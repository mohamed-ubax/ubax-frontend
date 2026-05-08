import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
  ApiConfiguration,
  getByKeycloakId,
  login as loginFn,
  logout as logoutFn,
  type LoginRequest,
  type LoginResponse,
  type LogoutRequest,
  type UserResponse,
} from '@ubax-workspace/shared-api-types';
import {
  catchError,
  map,
  Observable,
  of,
  switchMap,
  tap,
  throwError,
} from 'rxjs';
import { UbaxRole, type UbaxScope } from './user.model';
import { persistAuthSession, readStoredRefreshToken } from './auth-session';

export type { LoginRequest, LoginResponse };

/**
 * Réponse de GET /sub-roles pour l'utilisateur courant.
 * Le frontend sélectionne le sous-rôle primaire via pickPrimarySubRole().
 */
export type MySubRolesResponse = {
  scope: UbaxScope;
  subRoles: string[];
};

export type ResolvedUserProfile = {
  userId: string | null;
  scope: UbaxScope | null;
  avatarUrl: string | null;
};

type RefreshApiResponse = LoginResponse & {
  data?: {
    accessToken?: string | null;
    access_token?: string | null;
    refreshToken?: string | null;
    refresh_token?: string | null;
  } | null;
};

function pickFirstNonEmpty(
  ...candidates: Array<string | null | undefined>
): string | null {
  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim().length > 0) {
      return candidate;
    }
  }

  return null;
}

function resolveRefreshTokens(
  response: RefreshApiResponse,
  storedRefreshToken: string | null,
): { accessToken: string | null; refreshToken: string | null } {
  const accessToken = pickFirstNonEmpty(
    response.access_token,
    response.data?.accessToken,
    response.data?.access_token,
  );

  const refreshToken = pickFirstNonEmpty(
    response.refresh_token,
    response.data?.refreshToken,
    response.data?.refresh_token,
    storedRefreshToken,
  );

  return { accessToken, refreshToken };
}

function extractStringArray(data: unknown): string[] {
  if (Array.isArray(data)) {
    // Handle array of strings directly
    const stringItems = data.filter(
      (item): item is string => typeof item === 'string',
    );
    if (stringItems.length > 0) return stringItems;

    // Handle array of objects with 'role' property (API returns [{ role: 'DIRECTEUR_AGENCE', ... }])
    const roleItems = data
      .filter(
        (item) => typeof item === 'object' && item !== null && 'role' in item,
      )
      .map((item) => (item as { role: unknown }).role)
      .filter((role): role is string => typeof role === 'string');
    return roleItems;
  }
  return [];
}

function normalizeUserIds(userIds: readonly string[] | string): string[] {
  return Array.from(
    new Set(
      (Array.isArray(userIds) ? userIds : [userIds]).filter((userId) =>
        Boolean(userId?.trim()),
      ),
    ),
  );
}

function mapPartnerTypeToScope(partnerType: unknown): UbaxScope | null {
  if (typeof partnerType !== 'string') {
    return null;
  }

  const normalized = partnerType.trim().toUpperCase();

  if (normalized === 'HOTEL') {
    return 'HOTEL';
  }

  if (
    normalized === 'AGENCE_IMMOBILIERE' ||
    normalized === 'AGENCE' ||
    normalized === 'IMMOBILIER'
  ) {
    return 'AGENCE';
  }

  return null;
}

function readScopeFromUserProfile(raw: unknown): UbaxScope | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }

  const payload = raw as Record<string, unknown>;
  const data =
    payload['data'] && typeof payload['data'] === 'object'
      ? (payload['data'] as Record<string, unknown>)
      : payload;

  const scopeFromType = mapPartnerTypeToScope(data['partnerType']);
  if (scopeFromType) {
    return scopeFromType;
  }

  if (typeof data['hotelId'] === 'string' && data['hotelId']) {
    return 'HOTEL';
  }

  if (typeof data['agencyId'] === 'string' && data['agencyId']) {
    return 'AGENCE';
  }

  return null;
}

function readAvatarFromUserProfile(raw: unknown): string | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }

  const payload = raw as Record<string, unknown>;
  const data =
    payload['data'] && typeof payload['data'] === 'object'
      ? (payload['data'] as Record<string, unknown>)
      : payload;

  const candidates = [
    data['avatarUrl'],
    data['avatar_url'],
    data['avatar'],
    data['picture'],
    data['profilePicture'],
    data['profile_picture'],
  ];

  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim().length > 0) {
      return candidate;
    }
  }

  return null;
}

function mapResolvedUserProfile(raw: unknown): ResolvedUserProfile {
  if (!raw || typeof raw !== 'object') {
    return {
      userId: null,
      scope: null,
      avatarUrl: null,
    };
  }

  const payload = raw as Record<string, unknown>;
  const data =
    payload['data'] && typeof payload['data'] === 'object'
      ? (payload['data'] as Record<string, unknown>)
      : payload;

  return {
    userId: typeof data['userId'] === 'string' ? data['userId'] : null,
    scope: readScopeFromUserProfile(raw),
    avatarUrl: readAvatarFromUserProfile(raw),
  };
}

/**
 * Extrait la liste des membres d'une réponse d'équipe (gère les formats
 * { data: [...] }, { data: { content: [...] } }, ou directement un tableau).
 */
function extractTeamMembers(res: unknown): Array<Record<string, unknown>> {
  if (Array.isArray(res)) return res as Array<Record<string, unknown>>;

  if (res && typeof res === 'object') {
    const r = res as Record<string, unknown>;

    if (Array.isArray(r['content'])) {
      return r['content'] as Array<Record<string, unknown>>;
    }

    if (Array.isArray(r['data'])) {
      return r['data'] as Array<Record<string, unknown>>;
    }

    if (r['data'] && typeof r['data'] === 'object') {
      const nested = (r['data'] as Record<string, unknown>)['content'];
      if (Array.isArray(nested)) {
        return nested as Array<Record<string, unknown>>;
      }
    }
  }

  return [];
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly apiConfig = inject(ApiConfiguration);

  login(payload: LoginRequest): Observable<LoginResponse> {
    return loginFn(this.http, this.apiConfig.rootUrl, { body: payload }).pipe(
      map((response) => response.body as LoginResponse),
    );
  }

  getMyProfile(
    keycloakIds: readonly string[] | string,
  ): Observable<ResolvedUserProfile> {
    const root = this.apiConfig.rootUrl;
    const normalizedKeycloakIds = normalizeUserIds(keycloakIds);

    const tryNext = (
      remainingKeycloakIds: readonly string[],
    ): Observable<ResolvedUserProfile> => {
      const [currentKeycloakId, ...nextKeycloakIds] = remainingKeycloakIds;

      if (!currentKeycloakId) {
        return of({ userId: null, scope: null, avatarUrl: null });
      }

      return getByKeycloakId(this.http, root, {
        keycloakId: currentKeycloakId,
      }).pipe(
        map((response) =>
          mapResolvedUserProfile(
            response.body as UserResponse | { data?: UserResponse } | null,
          ),
        ),
        catchError(() =>
          nextKeycloakIds.length
            ? tryNext(nextKeycloakIds)
            : of({ userId: null, scope: null, avatarUrl: null }),
        ),
      );
    };

    return tryNext(normalizedKeycloakIds);
  }

  /**
   * Récupère le scope et les sous-rôles de l'utilisateur courant.
   *
   * - ADMIN / SUPER_ADMIN → GET /v1/admin/users/{id}/sub-roles?scope=UBAX_INTERNAL
   * - PARTNER (agence/hôtel) :
   *    1. GET /v1/agency/team → trouve le membre par keycloakId ou email
   *    2. Utilise le userId backend trouvé → GET /v1/agency/team/{userId}/sub-roles
   *    3. Fallback : idem pour /v1/hotel/team
   *
   * Le Keycloak `sub` (UUID) ≠ userId backend, donc l'étape 1 est indispensable
   * pour résoudre l'identifiant réel avant d'appeler l'endpoint sub-roles.
   */
  getMySubRoles(
    mainRole: UbaxRole,
    userIds: readonly string[] | string,
    email = '',
    preferredScope: UbaxScope | null = null,
  ): Observable<MySubRolesResponse> {
    const root = this.apiConfig.rootUrl;
    const normalizedUserIds = normalizeUserIds(userIds);

    const tryNext = <T>(
      remainingUserIds: readonly string[],
      request: (userId: string) => Observable<T>,
    ): Observable<T> => {
      const [currentUserId, ...nextUserIds] = remainingUserIds;

      if (!currentUserId) {
        return throwError(() => new Error('Unable to resolve user scope.'));
      }

      return request(currentUserId).pipe(
        catchError((error) =>
          nextUserIds.length
            ? tryNext(nextUserIds, request)
            : throwError(() => error),
        ),
      );
    };

    if (mainRole === UbaxRole.ADMIN || mainRole === UbaxRole.SUPER_ADMIN) {
      return tryNext(normalizedUserIds, (userId) =>
        this.http
          .get<{ data: unknown }>(
            `${root}/v1/admin/users/${userId}/sub-roles`,
            {
              params: { scope: 'UBAX_INTERNAL' },
            },
          )
          .pipe(
            map((res) => ({
              scope: 'UBAX_INTERNAL' as UbaxScope,
              subRoles: extractStringArray(res.data),
            })),
          ),
      );
    }

    const agencyRequest = () =>
      this.resolveSubRolesViaTeam(
        `${root}/v1/agency/team`,
        'AGENCE',
        normalizedUserIds,
        email,
      );

    const hotelRequest = () =>
      this.resolveSubRolesViaTeam(
        `${root}/v1/hotel/team`,
        'HOTEL',
        normalizedUserIds,
        email,
      );

    const runTeamResolution = (scopeHint: UbaxScope | null) => {
      // Pour PARTNER :
      // 1. Tente d'abord le scope préféré (si connu)
      // 2. Fallback sur l'autre endpoint équipe
      if (scopeHint === 'HOTEL') {
        return hotelRequest().pipe(catchError(() => agencyRequest()));
      }

      if (scopeHint === 'AGENCE') {
        return agencyRequest().pipe(catchError(() => hotelRequest()));
      }

      // Scope inconnu : conserve le fallback historique
      return agencyRequest().pipe(catchError(() => hotelRequest()));
    };

    if (preferredScope) {
      return runTeamResolution(preferredScope);
    }

    return runTeamResolution(null);
  }

  /**
   * Résout le userId backend via la liste d'équipe, puis appelle sub-roles.
   * La liste d'équipe ne requiert pas de userId dans le chemin → compatible
   * avec le Keycloak `sub` comme seul identifiant disponible dans le JWT.
   */
  private resolveSubRolesViaTeam(
    teamUrl: string,
    scope: UbaxScope,
    keycloakCandidates: string[],
    email: string,
  ): Observable<MySubRolesResponse> {
    return this.http.get<unknown>(teamUrl).pipe(
      switchMap((res) => {
        const members = extractTeamMembers(res);

        // Cherche d'abord par keycloakId, puis par email
        const found = members.find((m) => {
          const mKeycloak =
            typeof m['keycloakId'] === 'string' ? m['keycloakId'] : null;
          const mEmail =
            typeof m['email'] === 'string' ? m['email'].toLowerCase() : null;

          return (
            (mKeycloak && keycloakCandidates.includes(mKeycloak)) ||
            (mEmail && email && mEmail === email.toLowerCase())
          );
        });

        if (!found) {
          return throwError(
            () => new Error(`User not found in team: ${teamUrl}`),
          );
        }

        const backendUserId =
          typeof found['userId'] === 'string' ? found['userId'] : null;

        if (!backendUserId) {
          // userId backend absent → utilise les rôles déjà disponibles dans la réponse
          const subRoles = extractStringArray(
            found['roles'] ?? found['subRoles'],
          );
          return of({ scope, subRoles });
        }

        // Appel sub-roles avec le vrai userId backend
        const subRolesUrl = `${teamUrl}/${backendUserId}/sub-roles`;

        return this.http.get<{ data: unknown }>(subRolesUrl).pipe(
          map((subRes) => ({
            scope,
            subRoles: extractStringArray(subRes.data),
          })),
          catchError(() =>
            // Sub-roles endpoint indisponible → utilise les rôles de la liste
            of({
              scope,
              subRoles: extractStringArray(found['roles'] ?? found['subRoles']),
            }),
          ),
        );
      }),
    );
  }

  logout(refreshToken: string): Observable<void> {
    const body: LogoutRequest = { refreshToken };

    return logoutFn(this.http, this.apiConfig.rootUrl, { body }).pipe(
      map(() => void 0),
    );
  }

  refreshToken(): Observable<LoginResponse> {
    const storedRefreshToken = readStoredRefreshToken();

    return this.http
      .post<RefreshApiResponse>(
        `${this.apiConfig.rootUrl}/auth/refresh`,
        storedRefreshToken
          ? {
              refreshToken: storedRefreshToken,
              refresh_token: storedRefreshToken,
            }
          : {},
      )
      .pipe(
        map((response) => {
          const { accessToken, refreshToken } = resolveRefreshTokens(
            response,
            storedRefreshToken,
          );

          return {
            ...response,
            access_token: accessToken ?? response.access_token,
            refresh_token: refreshToken ?? response.refresh_token,
          } as LoginResponse;
        }),
        tap((response) => {
          if (response.access_token) {
            persistAuthSession({
              accessToken: response.access_token,
              refreshToken: response.refresh_token ?? storedRefreshToken ?? '',
            });
          }
        }),
      );
  }
}

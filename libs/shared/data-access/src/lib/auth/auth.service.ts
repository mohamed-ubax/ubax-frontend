import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
  ApiConfiguration,
  login as loginFn,
  logout as logoutFn,
  type LoginRequest,
  type LoginResponse,
  type LogoutRequest,
} from '@ubax-workspace/shared-api-types';
import { catchError, map, Observable, of, switchMap, tap, throwError } from 'rxjs';
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

function extractStringArray(data: unknown): string[] {
  if (Array.isArray(data)) {
    return data.filter((item): item is string => typeof item === 'string');
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
          .get<{ data: unknown }>(`${root}/v1/admin/users/${userId}/sub-roles`, {
            params: { scope: 'UBAX_INTERNAL' },
          })
          .pipe(
            map((res) => ({
              scope: 'UBAX_INTERNAL' as UbaxScope,
              subRoles: extractStringArray(res.data),
            })),
          ),
      );
    }

    // Pour PARTNER :
    // 1. Appel de la liste d'équipe pour résoudre le userId backend
    // 2. Appel sub-roles avec ce userId
    return this.resolveSubRolesViaTeam(
      `${root}/v1/agency/team`,
      'AGENCE',
      normalizedUserIds,
      email,
    ).pipe(
      catchError(() =>
        this.resolveSubRolesViaTeam(
          `${root}/v1/hotel/team`,
          'HOTEL',
          normalizedUserIds,
          email,
        ),
      ),
    );
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

        return this.http
          .get<{ data: unknown }>(subRolesUrl)
          .pipe(
            map((subRes) => ({
              scope,
              subRoles: extractStringArray(subRes.data),
            })),
            catchError(() =>
              // Sub-roles endpoint indisponible → utilise les rôles de la liste
              of({
                scope,
                subRoles: extractStringArray(
                  found['roles'] ?? found['subRoles'],
                ),
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
      .post<LoginResponse>(
        `${this.apiConfig.rootUrl}/auth/refresh`,
        storedRefreshToken ? { refreshToken: storedRefreshToken } : {},
      )
      .pipe(
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

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
import { catchError, map, Observable, tap } from 'rxjs';
import { UbaxRole, type UbaxScope, User } from './user.model';
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
   * - ADMIN / SUPER_ADMIN → GET /v1/admin/users/{id}/sub-roles?scope=UBAX_INTERNAL
   * - PARTNER → GET /v1/agency/team/{id}/sub-roles (fallback : hotel si 403/404)
   */
  getMySubRoles(mainRole: UbaxRole, userId: string): Observable<MySubRolesResponse> {
    const root = this.apiConfig.rootUrl;

    if (mainRole === UbaxRole.ADMIN || mainRole === UbaxRole.SUPER_ADMIN) {
      return this.http
        .get<{ data: unknown }>(`${root}/v1/admin/users/${userId}/sub-roles`, {
          params: { scope: 'UBAX_INTERNAL' },
        })
        .pipe(
          map((res) => ({
            scope: 'UBAX_INTERNAL' as UbaxScope,
            subRoles: extractStringArray(res.data),
          })),
        );
    }

    return this.http
      .get<{ data: unknown }>(`${root}/v1/agency/team/${userId}/sub-roles`)
      .pipe(
        map((res) => ({
          scope: 'AGENCE' as UbaxScope,
          subRoles: extractStringArray(res.data),
        })),
        catchError(() =>
          this.http
            .get<{ data: unknown }>(`${root}/v1/hotel/team/${userId}/sub-roles`)
            .pipe(
              map((res) => ({
                scope: 'HOTEL' as UbaxScope,
                subRoles: extractStringArray(res.data),
              })),
            ),
        ),
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

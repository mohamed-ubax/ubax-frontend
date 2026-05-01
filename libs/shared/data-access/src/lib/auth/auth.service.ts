import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
  ApiConfiguration,
  login as loginFn,
  logout as logoutFn,
  type LogoutRequest,
} from '@ubax-workspace/shared-api-types';
import { map, Observable, tap } from 'rxjs';
import { User } from './user.model';
import {
  persistAuthSession,
  readStoredRefreshToken,
} from './auth-session';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  refresh_expires_in: number;
  token_type: string;
  session_state: string;
  scope: string;
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

  getMe(): Observable<User> {
    return this.http.get<User>(`${this.apiConfig.rootUrl}/auth/me`);
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

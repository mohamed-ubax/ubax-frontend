import { inject } from '@angular/core';
import {
  HttpErrorResponse,
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpRequest,
} from '@angular/common/http';
import { AuthStore } from '@ubax-workspace/ubax-web-data-access';
import {
  AuthService,
  type LoginResponse,
} from '@ubax-workspace/shared-data-access';
import { catchError, switchMap, throwError } from 'rxjs';

const AUTH_SKIP_PATHS = ['/auth/login', '/auth/refresh', '/auth/logout'];

function isAuthSkipped(url: string): boolean {
  return AUTH_SKIP_PATHS.some((path) => url.includes(path));
}

function withBearer(
  req: HttpRequest<unknown>,
  token: string,
): HttpRequest<unknown> {
  return req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
}

function hasAccessToken(
  response: LoginResponse,
): response is LoginResponse & { access_token: string } {
  return (
    typeof response.access_token === 'string' &&
    response.access_token.length > 0
  );
}

export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
) => {
  const authStore = inject(AuthStore);
  const authService = inject(AuthService);
  const token = authStore.token();

  const authedReq = token ? withBearer(req, token) : req;

  return next(authedReq).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status !== 401 || isAuthSkipped(req.url)) {
        return throwError(() => err);
      }

      return authService.refreshToken().pipe(
        switchMap((response) => {
          if (!hasAccessToken(response)) {
            authStore.expireSession();
            return throwError(
              () => new Error('Missing access token in refresh response'),
            );
          }

          authStore.setToken(response.access_token);
          return next(withBearer(req, response.access_token));
        }),
        catchError((refreshErr) => {
          authStore.expireSession();
          return throwError(() => refreshErr);
        }),
      );
    }),
  );
};

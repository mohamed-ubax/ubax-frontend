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

function isBackendApiRequest(url: string): boolean {
  if (
    url.startsWith('/api') ||
    url.startsWith('/v1/') ||
    url.startsWith('/auth/')
  ) {
    return true;
  }

  if (/^https?:\/\//i.test(url)) {
    try {
      const parsed = new URL(url);
      return (
        parsed.pathname === '/api' ||
        parsed.pathname.startsWith('/api/') ||
        parsed.pathname.startsWith('/v1/') ||
        parsed.pathname.startsWith('/auth/')
      );
    } catch {
      return false;
    }
  }

  return false;
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

function readAccessToken(
  response: LoginResponse & {
    data?: { accessToken?: string | null; access_token?: string | null } | null;
  },
): string | null {
  if (hasAccessToken(response)) {
    return response.access_token;
  }

  const fromData = response.data?.accessToken ?? response.data?.access_token;
  return typeof fromData === 'string' && fromData.length > 0 ? fromData : null;
}

function shouldExpireSessionOnRefreshError(error: unknown): boolean {
  return (
    error instanceof HttpErrorResponse &&
    (error.status === 401 || error.status === 403)
  );
}

export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
) => {
  const authStore = inject(AuthStore);
  const authService = inject(AuthService);
  const token = authStore.token();
  const isBackendRequest = isBackendApiRequest(req.url);

  const authedReq =
    token && isBackendRequest && !isAuthSkipped(req.url)
      ? withBearer(req, token)
      : req;

  return next(authedReq).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status !== 401 || !isBackendRequest || isAuthSkipped(req.url)) {
        return throwError(() => err);
      }

      return authService.refreshToken().pipe(
        catchError((refreshErr) => {
          if (shouldExpireSessionOnRefreshError(refreshErr)) {
            authStore.expireSession();
          }
          return throwError(() => refreshErr);
        }),
        switchMap((response) => {
          const accessToken = readAccessToken(response);
          if (!accessToken) {
            return throwError(
              () => new Error('Missing access token in refresh response'),
            );
          }

          authStore.setToken(accessToken);
          return next(withBearer(req, accessToken));
        }),
      );
    }),
  );
};

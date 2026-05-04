import '@angular/compiler';
import {
  HttpErrorResponse,
  HttpRequest,
  HttpResponse,
} from '@angular/common/http';
import { Injector, runInInjectionContext } from '@angular/core';
import { firstValueFrom, of, throwError } from 'rxjs';
import { AuthService } from '@ubax-workspace/shared-data-access';
import { AuthStore } from '@ubax-workspace/ubax-web-data-access';
import type { LoginResponse } from '@ubax-workspace/shared-data-access';
import { authInterceptor } from './auth.interceptor';

function makeRefreshResponse(
  accessToken: string,
  refreshToken = 'new-refresh',
): LoginResponse {
  return {
    access_token: accessToken,
    refresh_token: refreshToken,
    expires_in: 3600,
    refresh_expires_in: 7200,
    token_type: 'Bearer',
    session_state: '',
    scope: '',
  };
}

describe('authInterceptor', () => {
  let authStore: {
    token: ReturnType<typeof vi.fn>;
    setToken: ReturnType<typeof vi.fn>;
    expireSession: ReturnType<typeof vi.fn>;
  };
  let authService: {
    refreshToken: ReturnType<typeof vi.fn>;
  };
  let injector: Injector;

  beforeEach(() => {
    authStore = {
      token: vi.fn().mockReturnValue(null),
      setToken: vi.fn(),
      expireSession: vi.fn(),
    };
    authService = {
      refreshToken: vi.fn(),
    };
    injector = Injector.create({
      providers: [
        { provide: AuthStore, useValue: authStore },
        { provide: AuthService, useValue: authService },
      ],
    });
  });

  function run(req: HttpRequest<unknown>, next: ReturnType<typeof vi.fn>) {
    return runInInjectionContext(injector, () => authInterceptor(req, next));
  }

  it("ajoute l'en-tête Authorization quand le token est présent", async () => {
    authStore.token.mockReturnValue('my-token');
    const req = new HttpRequest('GET', '/api/data');
    const next = vi.fn().mockReturnValue(of(new HttpResponse({ status: 200 })));

    await firstValueFrom(run(req, next));

    const sentReq: HttpRequest<unknown> = next.mock.calls[0]?.[0];
    expect(sentReq.headers.get('Authorization')).toBe('Bearer my-token');
  });

  it("n'ajoute pas d'en-tête Authorization quand il n'y a pas de token", async () => {
    authStore.token.mockReturnValue(null);
    const req = new HttpRequest('GET', '/api/data');
    const next = vi.fn().mockReturnValue(of(new HttpResponse({ status: 200 })));

    await firstValueFrom(run(req, next));

    const sentReq: HttpRequest<unknown> = next.mock.calls[0]?.[0];
    expect(sentReq.headers.get('Authorization')).toBeNull();
  });

  it('rafraîchit le token sur 401 et rejoue la requête originale', async () => {
    authStore.token.mockReturnValue('expired-token');
    authService.refreshToken.mockReturnValue(
      of(makeRefreshResponse('new-access-token')),
    );

    const req = new HttpRequest('GET', '/api/protected');
    let callCount = 0;
    const next = vi.fn().mockImplementation(() => {
      callCount++;
      return callCount === 1
        ? throwError(() => new HttpErrorResponse({ status: 401, url: '/api/protected' }))
        : of(new HttpResponse({ status: 200, body: { ok: true } }));
    });

    await firstValueFrom(run(req, next));

    expect(authService.refreshToken).toHaveBeenCalledTimes(1);
    expect(authStore.setToken).toHaveBeenCalledWith('new-access-token');
    expect(next).toHaveBeenCalledTimes(2);
    const retryReq: HttpRequest<unknown> = next.mock.calls[1]?.[0];
    expect(retryReq.headers.get('Authorization')).toBe('Bearer new-access-token');
  });

  it('appelle expireSession quand le refresh échoue', async () => {
    authStore.token.mockReturnValue('expired-token');
    authService.refreshToken.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 401, url: '/api/auth/refresh' })),
    );

    const req = new HttpRequest('GET', '/api/protected');
    const next = vi.fn().mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 401, url: '/api/protected' })),
    );

    await expect(firstValueFrom(run(req, next))).rejects.toBeInstanceOf(
      HttpErrorResponse,
    );
    expect(authStore.expireSession).toHaveBeenCalledTimes(1);
  });

  it("ne tente pas de refresh pour les endpoints d'authentification", async () => {
    authStore.token.mockReturnValue('token');
    const authReq = new HttpRequest('POST', '/api/auth/refresh');
    const next = vi.fn().mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 401, url: '/api/auth/refresh' })),
    );

    await expect(firstValueFrom(run(authReq, next))).rejects.toBeInstanceOf(
      HttpErrorResponse,
    );
    expect(authService.refreshToken).not.toHaveBeenCalled();
    expect(authStore.expireSession).not.toHaveBeenCalled();
  });

  it('propage les erreurs non-401 sans tenter de refresh', async () => {
    authStore.token.mockReturnValue('token');
    const req = new HttpRequest('GET', '/api/data');
    const next = vi.fn().mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 500, url: '/api/data' })),
    );

    const err = await firstValueFrom(run(req, next)).catch((e) => e);
    expect((err as HttpErrorResponse).status).toBe(500);
    expect(authService.refreshToken).not.toHaveBeenCalled();
  });
});

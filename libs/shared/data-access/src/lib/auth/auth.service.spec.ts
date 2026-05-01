import '@angular/compiler';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Injector } from '@angular/core';
import { firstValueFrom, of } from 'rxjs';
import { ApiConfiguration } from '@ubax-workspace/shared-api-types';
import * as apiTypes from '@ubax-workspace/shared-api-types';
import {
  AUTH_REFRESH_TOKEN_STORAGE_KEY,
  AUTH_TOKEN_STORAGE_KEY,
  persistAuthSession,
} from './auth-session';
import { AuthService, type LoginResponse } from './auth.service';

vi.mock('@ubax-workspace/shared-api-types', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@ubax-workspace/shared-api-types')>();
  return { ...actual, login: vi.fn(), logout: vi.fn() };
});

function createStorageMock(): Storage {
  const values = new Map<string, string>();

  return {
    get length() {
      return values.size;
    },
    clear(): void {
      values.clear();
    },
    getItem(key: string): string | null {
      return values.has(key) ? (values.get(key) ?? null) : null;
    },
    key(index: number): string | null {
      return Array.from(values.keys())[index] ?? null;
    },
    removeItem(key: string): void {
      values.delete(key);
    },
    setItem(key: string, value: string): void {
      values.set(key, value);
    },
  };
}

const LOGIN_RESPONSE: LoginResponse = {
  access_token: 'access-xyz',
  refresh_token: 'refresh-xyz',
  expires_in: 300,
  refresh_expires_in: 1800,
  token_type: 'Bearer',
  session_state: 'ss-1',
  scope: 'openid profile',
};

describe('AuthService', () => {
  let service: AuthService;
  let http: { get: ReturnType<typeof vi.fn>; post: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: createStorageMock(),
    });

    vi.clearAllMocks();

    http = { get: vi.fn(), post: vi.fn() };

    vi.mocked(apiTypes.login).mockReturnValue(
      of(new HttpResponse({ body: LOGIN_RESPONSE })) as any,
    );
    vi.mocked(apiTypes.logout).mockReturnValue(
      of(new HttpResponse({ body: null })) as any,
    );

    const injector = Injector.create({
      providers: [
        { provide: HttpClient, useValue: http },
        {
          provide: ApiConfiguration,
          useValue: { rootUrl: 'https://test.local' },
        },
        { provide: AuthService, useClass: AuthService },
      ],
    });

    service = injector.get(AuthService);
  });

  it('login appelle le bon endpoint et retourne la réponse', async () => {
    const result = await firstValueFrom(
      service.login({ email: 'a@ubax.com', password: 'secret' }),
    );

    expect(result).toEqual(LOGIN_RESPONSE);
    expect(apiTypes.login).toHaveBeenCalledWith(
      expect.anything(),
      'https://test.local',
      { body: { email: 'a@ubax.com', password: 'secret' } },
    );
  });

  it('getMe appelle /auth/me et retourne le profil', async () => {
    const user = {
      id: 'u-1',
      nom: 'Doe',
      prenom: 'Jane',
      email: 'jane@ubax.com',
      role: 'DG',
    };
    http.get.mockReturnValue(of(user));

    const result = await firstValueFrom(service.getMe());

    expect(result).toEqual(user);
    expect(http.get).toHaveBeenCalledWith('https://test.local/auth/me');
  });

  it('logout envoie le refresh token dans le corps de la requête', async () => {
    await firstValueFrom(service.logout('my-refresh-token'));

    expect(apiTypes.logout).toHaveBeenCalledWith(
      expect.anything(),
      'https://test.local',
      { body: { refreshToken: 'my-refresh-token' } },
    );
  });

  it('refreshToken envoie le token stocké et persiste les nouveaux tokens', async () => {
    persistAuthSession({
      accessToken: 'old-access',
      refreshToken: 'old-refresh',
    });
    const newTokens: LoginResponse = {
      ...LOGIN_RESPONSE,
      access_token: 'new-access',
      refresh_token: 'new-refresh',
    };
    http.post.mockReturnValue(of(newTokens));

    await firstValueFrom(service.refreshToken());

    expect(http.post).toHaveBeenCalledWith('https://test.local/auth/refresh', {
      refreshToken: 'old-refresh',
    });
    expect(globalThis.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY)).toBe(
      'new-access',
    );
    expect(
      globalThis.localStorage.getItem(AUTH_REFRESH_TOKEN_STORAGE_KEY),
    ).toBe('new-refresh');
  });

  it("refreshToken envoie un corps vide si aucun token n'est stocké", async () => {
    http.post.mockReturnValue(
      of({ ...LOGIN_RESPONSE, access_token: '', refresh_token: '' }),
    );

    await firstValueFrom(service.refreshToken());

    expect(http.post).toHaveBeenCalledWith(
      'https://test.local/auth/refresh',
      {},
    );
  });
});

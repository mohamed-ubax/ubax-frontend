import '@angular/compiler';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Injector } from '@angular/core';
import { firstValueFrom, of, throwError } from 'rxjs';
import { ApiConfiguration } from '@ubax-workspace/shared-api-types';
import * as apiTypes from '@ubax-workspace/shared-api-types';
import {
  AUTH_REFRESH_TOKEN_STORAGE_KEY,
  AUTH_TOKEN_STORAGE_KEY,
  persistAuthSession,
} from './auth-session';
import { UbaxRole } from './user.model';
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

  it('getMySubRoles appelle le endpoint admin interne pour les admins', async () => {
    http.get.mockReturnValue(of({ data: ['DIRECTEUR_GENERAL', 'FINANCE'] }));

    const result = await firstValueFrom(
      service.getMySubRoles(UbaxRole.ADMIN, 'admin-1'),
    );

    expect(result).toEqual({
      scope: 'UBAX_INTERNAL',
      subRoles: ['DIRECTEUR_GENERAL', 'FINANCE'],
    });
    expect(http.get).toHaveBeenCalledWith(
      'https://test.local/v1/admin/users/admin-1/sub-roles',
      {
        params: { scope: 'UBAX_INTERNAL' },
      },
    );
  });

  it('getMySubRoles résout le userId via la liste agence, puis appelle sub-roles', async () => {
    const memberList = [
      { keycloakId: 'kc-123', userId: 'backend-42', email: 'a@ubax.com' },
    ];
    http.get
      .mockReturnValueOnce(of({ data: memberList })) // GET /v1/agency/team
      .mockReturnValueOnce(of({ data: ['DIRECTEUR_AGENCE'] })); // GET sub-roles

    const result = await firstValueFrom(
      service.getMySubRoles(UbaxRole.PARTNER, ['kc-123'], 'a@ubax.com'),
    );

    expect(result).toEqual({
      scope: 'AGENCE',
      subRoles: ['DIRECTEUR_AGENCE'],
    });
    expect(http.get).toHaveBeenNthCalledWith(
      1,
      'https://test.local/v1/agency/team',
    );
    expect(http.get).toHaveBeenNthCalledWith(
      2,
      'https://test.local/v1/agency/team/backend-42/sub-roles',
    );
  });

  it('getMySubRoles bascule sur hotel si la liste agence ne contient pas le user', async () => {
    const hotelMemberList = [
      { keycloakId: 'kc-123', userId: 'hotel-7', email: 'a@ubax.com' },
    ];
    http.get
      .mockReturnValueOnce(of({ data: [] })) // GET /v1/agency/team → user not found
      .mockReturnValueOnce(of({ data: hotelMemberList })) // GET /v1/hotel/team
      .mockReturnValueOnce(of({ data: ['GERANT_HOTEL'] })); // GET hotel sub-roles

    const result = await firstValueFrom(
      service.getMySubRoles(UbaxRole.PARTNER, ['kc-123'], 'a@ubax.com'),
    );

    expect(result).toEqual({
      scope: 'HOTEL',
      subRoles: ['GERANT_HOTEL'],
    });
  });

  it('getMySubRoles bascule sur hotel si le endpoint agence est inaccessible (4xx/5xx)', async () => {
    const hotelMemberList = [
      { keycloakId: 'kc-partner', userId: 'hotel-99', email: 'partner@ubax.com' },
    ];
    http.get
      .mockReturnValueOnce(throwError(() => new Error('forbidden'))) // GET /v1/agency/team fails
      .mockReturnValueOnce(of({ data: hotelMemberList })) // GET /v1/hotel/team
      .mockReturnValueOnce(of({ data: ['GERANT_HOTEL'] })); // hotel sub-roles

    const result = await firstValueFrom(
      service.getMySubRoles(UbaxRole.PARTNER, ['kc-partner'], 'partner@ubax.com'),
    );

    expect(result).toEqual({
      scope: 'HOTEL',
      subRoles: ['GERANT_HOTEL'],
    });
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

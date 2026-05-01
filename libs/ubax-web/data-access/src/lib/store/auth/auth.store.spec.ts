import '@angular/compiler';
import { Buffer } from 'node:buffer';
import { Injector, ProviderToken, Type } from '@angular/core';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import {
  AUTH_REFRESH_TOKEN_STORAGE_KEY,
  AUTH_TOKEN_STORAGE_KEY,
  AuthService,
  DEFAULT_UBAX_WEB_HOME_PATH,
  Role,
  type User,
} from '@ubax-workspace/shared-data-access';
import { AuthStore } from './auth.store';

type AuthStoreContract = {
  user(): User | null;
  token(): string | null;
  loading(): boolean;
  error(): string | null;
  isAuthenticated(): boolean;
  role(): Role | null;
  fullName(): string;
  setToken(token: string): void;
  setUser(user: User): void;
  setRole(role: Role): void;
  expireSession(): void;
  loadMe(): void;
  logout(): void;
};

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

function createJwt(payload: Record<string, unknown>): string {
  const encode = (value: Record<string, unknown>) =>
    Buffer.from(JSON.stringify(value)).toString('base64url');

  return `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode(payload)}.signature`;
}

describe('AuthStore', () => {
  const authStoreToken =
    AuthStore as unknown as ProviderToken<AuthStoreContract>;
  const authStoreClass = AuthStore as unknown as Type<unknown>;

  let store: AuthStoreContract;
  let authService: {
    getMe: ReturnType<typeof vi.fn>;
    logout: ReturnType<typeof vi.fn>;
  };
  let router: {
    navigate: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: createStorageMock(),
    });

    if (!('atob' in globalThis)) {
      Object.defineProperty(globalThis, 'atob', {
        configurable: true,
        value: (value: string) =>
          Buffer.from(value, 'base64').toString('binary'),
      });
    }

    Reflect.deleteProperty(globalThis, 'location');

    authService = {
      getMe: vi.fn(),
      logout: vi.fn(),
    };
    router = {
      navigate: vi.fn().mockResolvedValue(true),
    };

    const injector = Injector.create({
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: Router, useValue: router },
        { provide: authStoreToken, useClass: authStoreClass },
      ],
    });

    store = injector.get(authStoreToken);
  });

  it('persists a token and derives the authenticated user', () => {
    const token = createJwt({
      sub: 'user-1',
      email: 'jane.doe@ubax.com',
      given_name: 'Jane',
      family_name: 'Doe',
      roles: ['UBAX_ADMIN'],
    });

    store.setToken(token);

    expect(globalThis.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY)).toBe(token);
    expect(store.token()).toBe(token);
    expect(store.user()).toEqual({
      id: 'user-1',
      nom: 'Doe',
      prenom: 'Jane',
      email: 'jane.doe@ubax.com',
      avatar: undefined,
      role: Role.DG,
    });
    expect(store.isAuthenticated()).toBe(true);
    expect(store.role()).toBe(Role.DG);
    expect(store.fullName()).toBe('Jane Doe');
  });

  it('hydrates the current user from the backend profile', () => {
    const user: User = {
      id: 'commercial-1',
      nom: 'Diallo',
      prenom: 'Awa',
      email: 'awa@ubax.com',
      role: Role.COMMERCIAL,
    };

    authService.getMe.mockReturnValue(of(user));

    store.loadMe();

    expect(authService.getMe).toHaveBeenCalledTimes(1);
    expect(store.user()).toEqual(user);
    expect(store.loading()).toBe(false);
    expect(store.error()).toBeNull();
  });

  it('clears the session and navigates to login when the profile request fails without a valid token fallback', () => {
    globalThis.localStorage.setItem(
      AUTH_REFRESH_TOKEN_STORAGE_KEY,
      'refresh-token',
    );
    store.setToken('invalid-token');
    authService.getMe.mockReturnValue(throwError(() => new Error('expired')));

    store.loadMe();

    expect(store.user()).toBeNull();
    expect(store.token()).toBeNull();
    expect(store.error()).toBe('Session expirée');
    expect(globalThis.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY)).toBeNull();
    expect(
      globalThis.localStorage.getItem(AUTH_REFRESH_TOKEN_STORAGE_KEY),
    ).toBeNull();
    expect(router.navigate).toHaveBeenCalledWith(['/connexion'], {
      queryParams: { redirect: DEFAULT_UBAX_WEB_HOME_PATH },
    });
  });

  it('expire la session immédiatement sans appel réseau', () => {
    const token = createJwt({
      sub: 'u-expire',
      email: 'expire@ubax.com',
      given_name: 'Expire',
      family_name: 'Session',
      roles: ['DG'],
    });

    globalThis.localStorage.setItem(
      AUTH_REFRESH_TOKEN_STORAGE_KEY,
      'refresh-token',
    );
    store.setToken(token);

    store.expireSession();

    expect(store.user()).toBeNull();
    expect(store.token()).toBeNull();
    expect(store.error()).toBe('Session expirée');
    expect(globalThis.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY)).toBeNull();
    expect(
      globalThis.localStorage.getItem(AUTH_REFRESH_TOKEN_STORAGE_KEY),
    ).toBeNull();
    expect(router.navigate).toHaveBeenCalledWith(['/connexion']);
  });

  it('logs out with the stored refresh token and resets the auth state', () => {
    const token = createJwt({
      sub: 'user-2',
      email: 'support@ubax.com',
      given_name: 'Support',
      family_name: 'Agent',
      roles: ['AGENT_SAV'],
    });

    globalThis.localStorage.setItem(
      AUTH_REFRESH_TOKEN_STORAGE_KEY,
      'refresh-token',
    );
    authService.logout.mockReturnValue(of(void 0));
    store.setToken(token);

    store.logout();

    expect(authService.logout).toHaveBeenCalledWith('refresh-token');
    expect(store.user()).toBeNull();
    expect(store.token()).toBeNull();
    expect(globalThis.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY)).toBeNull();
    expect(
      globalThis.localStorage.getItem(AUTH_REFRESH_TOKEN_STORAGE_KEY),
    ).toBeNull();
    expect(router.navigate).toHaveBeenCalledWith(['/connexion'], {
      queryParams: { redirect: DEFAULT_UBAX_WEB_HOME_PATH },
    });
  });
});

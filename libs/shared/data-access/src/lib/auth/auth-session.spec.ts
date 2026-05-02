import { Buffer } from 'node:buffer';
import {
  AUTH_REFRESH_TOKEN_STORAGE_KEY,
  AUTH_TOKEN_STORAGE_KEY,
  DEFAULT_UBAX_WEB_HOME_PATH,
  buildPortalLoginUrl,
  clearStoredAuthSession,
  currentBrowserPath,
  deriveUserFromAuthToken,
  persistAuthSession,
  readStoredAuthToken,
  readStoredRefreshToken,
  redirectBrowserToPortalLogin,
  resolveUbaxWebRedirectTarget,
} from './auth-session';
import { UbaxRole } from './user.model';

function createJwt(payload: Record<string, unknown>): string {
  const encode = (value: Record<string, unknown>) =>
    Buffer.from(JSON.stringify(value)).toString('base64url');

  return `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode(payload)}.signature`;
}

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

describe('auth-session helpers', () => {
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
  });

  it('derives the current user from a JWT payload', () => {
    const token = createJwt({
      sub: 'user-1',
      email: 'jane.doe@ubax.com',
      given_name: 'Jane',
      family_name: 'Doe',
      roles: ['UBAX_ADMIN'],
    });

    expect(deriveUserFromAuthToken(token)).toEqual({
      id: 'user-1',
      nom: 'Doe',
      prenom: 'Jane',
      email: 'jane.doe@ubax.com',
      avatar: undefined,
      mainRole: UbaxRole.ADMIN,
      subRole: null,
      scope: null,
    });
  });

  it('persists and clears the auth session tokens', () => {
    persistAuthSession({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });

    expect(readStoredAuthToken()).toBe('access-token');
    expect(readStoredRefreshToken()).toBe('refresh-token');
    expect(globalThis.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY)).toBe(
      'access-token',
    );
    expect(
      globalThis.localStorage.getItem(AUTH_REFRESH_TOKEN_STORAGE_KEY),
    ).toBe('refresh-token');

    clearStoredAuthSession();

    expect(readStoredAuthToken()).toBeNull();
    expect(readStoredRefreshToken()).toBeNull();
  });

  it('sanitizes redirect targets and redirects to the portal login page', () => {
    const assign = vi.fn();

    Object.defineProperty(globalThis, 'location', {
      configurable: true,
      value: {
        pathname: '/app/reservations',
        search: '?page=2',
        hash: '#details',
        assign,
      },
    });

    expect(resolveUbaxWebRedirectTarget('/finances')).toBe(
      DEFAULT_UBAX_WEB_HOME_PATH,
    );
    expect(resolveUbaxWebRedirectTarget('/app/finances?tab=1#graph')).toBe(
      '/app/finances?tab=1#graph',
    );
    expect(currentBrowserPath()).toBe('/app/reservations?page=2#details');
    expect(buildPortalLoginUrl('/evil')).toBe(
      '/connexion?redirect=%2Fapp%2Ftableau-de-bord',
    );

    expect(redirectBrowserToPortalLogin()).toBe(true);
    expect(assign).toHaveBeenCalledWith(
      '/connexion?redirect=%2Fapp%2Freservations%3Fpage%3D2%23details',
    );
  });
});

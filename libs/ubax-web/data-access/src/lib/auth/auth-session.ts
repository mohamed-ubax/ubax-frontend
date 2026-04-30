export const AUTH_TOKEN_STORAGE_KEY = 'ubax_token';
export const DEFAULT_UBAX_WEB_HOME_PATH = '/app/tableau-de-bord';

function getLocalStorage(): Storage | null {
  if (typeof globalThis === 'undefined' || !('localStorage' in globalThis)) {
    return null;
  }

  return globalThis.localStorage;
}

export function readStoredAuthToken(): string | null {
  return getLocalStorage()?.getItem(AUTH_TOKEN_STORAGE_KEY) ?? null;
}

export function persistAuthToken(token: string): void {
  getLocalStorage()?.setItem(AUTH_TOKEN_STORAGE_KEY, token);
}

export function clearStoredAuthToken(): void {
  getLocalStorage()?.removeItem(AUTH_TOKEN_STORAGE_KEY);
}

export function resolveUbaxWebRedirectTarget(
  candidate: string | null | undefined,
): string {
  if (!candidate || !candidate.startsWith('/') || candidate.startsWith('//')) {
    return DEFAULT_UBAX_WEB_HOME_PATH;
  }

  return candidate === '/app' || candidate.startsWith('/app/')
    ? candidate
    : DEFAULT_UBAX_WEB_HOME_PATH;
}

export function currentBrowserPath(): string {
  if (typeof globalThis === 'undefined' || !('location' in globalThis)) {
    return DEFAULT_UBAX_WEB_HOME_PATH;
  }

  const { pathname, search, hash } = globalThis.location;
  return resolveUbaxWebRedirectTarget(`${pathname}${search}${hash}`);
}

export function buildPortalLoginUrl(returnTo?: string): string {
  const redirect = resolveUbaxWebRedirectTarget(returnTo);
  return `/connexion?redirect=${encodeURIComponent(redirect)}`;
}

export function redirectBrowserToPortalLogin(returnTo?: string): boolean {
  if (typeof globalThis === 'undefined' || !('location' in globalThis)) {
    return false;
  }

  globalThis.location.assign(
    buildPortalLoginUrl(returnTo ?? currentBrowserPath()),
  );
  return true;
}

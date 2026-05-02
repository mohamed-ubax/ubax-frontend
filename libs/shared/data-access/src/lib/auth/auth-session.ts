import { Role, User } from './user.model';

export const AUTH_TOKEN_STORAGE_KEY = 'ubax_token';
export const AUTH_REFRESH_TOKEN_STORAGE_KEY = 'ubax_refresh_token';
export const DEFAULT_UBAX_WEB_HOME_PATH = '/app/tableau-de-bord';

export type StoredAuthSession = {
  accessToken: string;
  refreshToken: string;
};

type JwtPayload = Record<string, unknown>;

const TOKEN_ROLE_PATTERNS: ReadonlyArray<readonly [RegExp, Role]> = [
  [
    /GERANT_HOTEL|RECEPTIONNISTE|RESPONSABLE_HEBERGEMENT|COMPTABLE_HOTEL|HOTEL/,
    Role.HOTEL,
  ],
  [/UBAX_SUPER_ADMIN|UBAX_ADMIN/, Role.DG],
  [/DIRECTEUR_GENERAL|DIRECTEUR_AGENCE|\bDG\b/, Role.DG],
  [/COMMERCIAL/, Role.COMMERCIAL],
  [/AGENT_SAV|SUPPORT_CLIENT|\bSAV\b/, Role.SAV],
  [/COMPTABLE_AGENCE|COMPTABLE|FINANCE/, Role.COMPTABLE],
];

function getLocalStorage(): Storage | null {
  if (typeof globalThis === 'undefined' || !('localStorage' in globalThis)) {
    return null;
  }

  return globalThis.localStorage;
}

function decodeBase64Url(segment: string): string | null {
  const normalized = segment.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(
    normalized.length + ((4 - (normalized.length % 4)) % 4),
    '=',
  );

  try {
    if (typeof globalThis !== 'undefined' && 'atob' in globalThis) {
      return decodeURIComponent(
        Array.from(globalThis.atob(padded))
          .map(
            (character) =>
              `%${(character.codePointAt(0) ?? 0).toString(16).padStart(2, '0')}`,
          )
          .join(''),
      );
    }
  } catch {
    return null;
  }

  return null;
}

function decodeJwtPayload(token: string): JwtPayload | null {
  const [, payloadSegment] = token.split('.');

  if (!payloadSegment) {
    return null;
  }

  const decodedPayload = decodeBase64Url(payloadSegment);

  if (!decodedPayload) {
    return null;
  }

  try {
    const payload = JSON.parse(decodedPayload) as unknown;

    return payload && typeof payload === 'object'
      ? (payload as JwtPayload)
      : null;
  } catch {
    return null;
  }
}

function readString(
  payload: JwtPayload,
  keys: readonly string[],
): string | null {
  for (const key of keys) {
    const value = payload[key];

    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }

  return null;
}

function readStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string');
  }

  if (typeof value === 'string' && value.trim()) {
    return [value.trim()];
  }

  return [];
}

function readNestedRoles(payload: JwtPayload): string[] {
  const nestedRoles: string[] = [];
  const realmAccess = payload['realm_access'];

  if (realmAccess && typeof realmAccess === 'object') {
    nestedRoles.push(...readStringArray((realmAccess as JwtPayload)['roles']));
  }

  const resourceAccess = payload['resource_access'];

  if (resourceAccess && typeof resourceAccess === 'object') {
    Object.values(resourceAccess).forEach((entry) => {
      if (entry && typeof entry === 'object') {
        nestedRoles.push(...readStringArray((entry as JwtPayload)['roles']));
      }
    });
  }

  return nestedRoles;
}

function normalizeRoleValue(role: string): string {
  return role
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_');
}

function inferRoleFromPayload(payload: JwtPayload): Role | null {
  const candidates = [
    ...readStringArray(payload['role']),
    ...readStringArray(payload['roles']),
    ...readStringArray(payload['groups']),
    ...readStringArray(payload['group']),
    ...readStringArray(payload['subRole']),
    ...readStringArray(payload['sub_role']),
    ...readStringArray(payload['subRoles']),
    ...readStringArray(payload['authorities']),
    ...readNestedRoles(payload),
  ].map(normalizeRoleValue);

  for (const candidate of candidates) {
    for (const [pattern, role] of TOKEN_ROLE_PATTERNS) {
      if (pattern.test(candidate)) {
        return role;
      }
    }
  }

  return null;
}

function inferNames(
  payload: JwtPayload,
  email: string | null,
): {
  prenom: string;
  nom: string;
} {
  const prenom = readString(payload, [
    'given_name',
    'givenName',
    'prenom',
    'first_name',
    'firstName',
  ]);
  const nom = readString(payload, [
    'family_name',
    'familyName',
    'nom',
    'last_name',
    'lastName',
  ]);

  if (prenom || nom) {
    return { prenom: prenom ?? '', nom: nom ?? '' };
  }

  const fullName = readString(payload, ['name']);

  if (fullName) {
    const [firstName, ...rest] = fullName.split(/\s+/);
    return {
      prenom: firstName ?? '',
      nom: rest.join(' '),
    };
  }

  const emailPrefix = email?.split('@')[0] ?? '';
  return {
    prenom: emailPrefix,
    nom: '',
  };
}

export function deriveUserFromAuthToken(
  token: string | null | undefined,
): User | null {
  if (!token) {
    return null;
  }

  const payload = decodeJwtPayload(token);

  if (!payload) {
    return null;
  }

  const role = inferRoleFromPayload(payload);

  if (!role) {
    return null;
  }

  const email =
    readString(payload, ['email', 'preferred_username', 'upn']) ?? '';
  const { prenom, nom } = inferNames(payload, email);

  return {
    id:
      readString(payload, ['sub', 'userId', 'user_id', 'id', 'keycloakId']) ??
      (email || 'current-user'),
    nom,
    prenom,
    email,
    avatar:
      readString(payload, ['picture', 'avatar', 'avatar_url', 'avatarUrl']) ??
      undefined,
    role,
  };
}

export function readStoredAuthToken(): string | null {
  return getLocalStorage()?.getItem(AUTH_TOKEN_STORAGE_KEY) ?? null;
}

export function persistAuthToken(token: string): void {
  getLocalStorage()?.setItem(AUTH_TOKEN_STORAGE_KEY, token);
}

export function readStoredRefreshToken(): string | null {
  return getLocalStorage()?.getItem(AUTH_REFRESH_TOKEN_STORAGE_KEY) ?? null;
}

export function persistRefreshToken(token: string): void {
  getLocalStorage()?.setItem(AUTH_REFRESH_TOKEN_STORAGE_KEY, token);
}

export function persistAuthSession(session: StoredAuthSession): void {
  persistAuthToken(session.accessToken);
  persistRefreshToken(session.refreshToken);
}

export function clearStoredAuthToken(): void {
  getLocalStorage()?.removeItem(AUTH_TOKEN_STORAGE_KEY);
}

export function clearStoredRefreshToken(): void {
  getLocalStorage()?.removeItem(AUTH_REFRESH_TOKEN_STORAGE_KEY);
}

export function clearStoredAuthSession(): void {
  clearStoredAuthToken();
  clearStoredRefreshToken();
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

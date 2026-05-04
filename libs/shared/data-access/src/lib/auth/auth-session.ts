import { UbaxRole, UbaxScope, UbaxSubRole, User } from './user.model';

export const AUTH_TOKEN_STORAGE_KEY = 'ubax_token';
export const AUTH_REFRESH_TOKEN_STORAGE_KEY = 'ubax_refresh_token';
export const DEFAULT_UBAX_WEB_HOME_PATH = '/app/tableau-de-bord';

export type StoredAuthSession = {
  accessToken: string;
  refreshToken: string;
};

type JwtPayload = Record<string, unknown>;

// Main roles always come from the JWT. When sub-roles are also present there,
// we use them as a safe fallback before the GET /sub-roles enrichment completes.
const MAIN_ROLE_PATTERNS: ReadonlyArray<readonly [RegExp, UbaxRole]> = [
  [/\bUBAX_SUPER_ADMIN\b/, UbaxRole.SUPER_ADMIN],
  [/\bUBAX_ADMIN\b/, UbaxRole.ADMIN],
  [/\bUBAX_PARTNER\b/, UbaxRole.PARTNER],
  [/\bUBAX_OWNER\b/, UbaxRole.OWNER],
  [/\bUBAX_CLIENT\b/, UbaxRole.CLIENT],
];

const SUB_ROLE_PRIORITY: readonly UbaxSubRole[] = [
  UbaxSubRole.DIRECTEUR_AGENCE,
  UbaxSubRole.GERANT_HOTEL,
  UbaxSubRole.DIRECTEUR_GENERAL,
  UbaxSubRole.COMMERCIAL,
  UbaxSubRole.COMPTABLE_AGENCE,
  UbaxSubRole.COMPTABLE_HOTEL,
  UbaxSubRole.FINANCE,
  UbaxSubRole.AGENT_SAV,
  UbaxSubRole.RECEPTIONNISTE,
  UbaxSubRole.RESPONSABLE_HEBERGEMENT,
  UbaxSubRole.SUPPORT_CLIENT,
  UbaxSubRole.OPERATIONS,
];

const AGENCE_SUB_ROLES = new Set<UbaxSubRole>([
  UbaxSubRole.DIRECTEUR_AGENCE,
  UbaxSubRole.COMMERCIAL,
  UbaxSubRole.COMPTABLE_AGENCE,
  UbaxSubRole.AGENT_SAV,
]);

const HOTEL_SUB_ROLES = new Set<UbaxSubRole>([
  UbaxSubRole.GERANT_HOTEL,
  UbaxSubRole.RECEPTIONNISTE,
  UbaxSubRole.COMPTABLE_HOTEL,
  UbaxSubRole.RESPONSABLE_HEBERGEMENT,
]);

const INTERNAL_SUB_ROLES = new Set<UbaxSubRole>([
  UbaxSubRole.DIRECTEUR_GENERAL,
  UbaxSubRole.SUPPORT_CLIENT,
  UbaxSubRole.OPERATIONS,
  UbaxSubRole.FINANCE,
]);

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

function uniqueNonEmptyStrings(values: readonly (string | null)[]): string[] {
  return Array.from(
    new Set(values.filter((value): value is string => Boolean(value?.trim()))),
  );
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

function readRoleCandidates(payload: JwtPayload): string[] {
  return [
    ...readStringArray(payload['role']),
    ...readStringArray(payload['roles']),
    ...readStringArray(payload['authorities']),
    ...readNestedRoles(payload),
  ].map(normalizeRoleValue);
}

function inferMainRoleFromPayload(payload: JwtPayload): UbaxRole | null {
  const candidates = readRoleCandidates(payload);

  for (const candidate of candidates) {
    for (const [pattern, role] of MAIN_ROLE_PATTERNS) {
      if (pattern.test(candidate)) {
        return role;
      }
    }
  }

  return null;
}

function inferSubRoleFromPayload(payload: JwtPayload): UbaxSubRole | null {
  const candidates = new Set(readRoleCandidates(payload));

  for (const subRole of SUB_ROLE_PRIORITY) {
    if (candidates.has(subRole)) {
      return subRole;
    }
  }

  return null;
}

function inferScopeFromPayload(
  payload: JwtPayload,
  subRole: UbaxSubRole | null,
): UbaxScope | null {
  const explicitScope = [
    ...readStringArray(payload['ubax_scope']),
    ...readStringArray(payload['ubaxScope']),
    ...readStringArray(payload['user_scope']),
    ...readStringArray(payload['userScope']),
    ...readStringArray(payload['scope']),
  ]
    .map(normalizeRoleValue)
    .find(
      (value): value is UbaxScope =>
        value === 'AGENCE' || value === 'HOTEL' || value === 'UBAX_INTERNAL',
    );

  if (explicitScope) {
    return explicitScope;
  }

  if (subRole) {
    if (AGENCE_SUB_ROLES.has(subRole)) return 'AGENCE';
    if (HOTEL_SUB_ROLES.has(subRole)) return 'HOTEL';
    if (INTERNAL_SUB_ROLES.has(subRole)) return 'UBAX_INTERNAL';
  }

  const candidates = new Set(readRoleCandidates(payload));

  if (candidates.has('AGENCE')) return 'AGENCE';
  if (candidates.has('HOTEL')) return 'HOTEL';
  if (candidates.has('UBAX_INTERNAL')) return 'UBAX_INTERNAL';

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

function extractUserIdCandidates(payload: JwtPayload): string[] {
  return uniqueNonEmptyStrings([
    readString(payload, ['userId']),
    readString(payload, ['user_id']),
    readString(payload, ['id']),
    readString(payload, ['keycloakId']),
    readString(payload, ['sub']),
  ]);
}

export function readUserIdCandidatesFromAuthToken(
  token: string | null | undefined,
): string[] {
  if (!token) {
    return [];
  }

  const payload = decodeJwtPayload(token);

  if (!payload) {
    return [];
  }

  return extractUserIdCandidates(payload);
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

  const mainRole = inferMainRoleFromPayload(payload);

  if (!mainRole) {
    return null;
  }

  const subRole = inferSubRoleFromPayload(payload);
  const scope = inferScopeFromPayload(payload, subRole);

  const email =
    readString(payload, ['email', 'preferred_username', 'upn']) ?? '';
  const { prenom, nom } = inferNames(payload, email);
  const [resolvedUserId] = extractUserIdCandidates(payload);

  return {
    id: resolvedUserId ?? email ?? 'current-user',
    nom,
    prenom,
    email,
    avatar:
      readString(payload, ['picture', 'avatar', 'avatar_url', 'avatarUrl']) ??
      undefined,
    mainRole,
    subRole,
    scope,
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

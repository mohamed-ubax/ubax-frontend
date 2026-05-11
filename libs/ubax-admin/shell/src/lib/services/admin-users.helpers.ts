export type AdminRole = 'ADMIN' | 'SUPER_ADMIN';

export interface AdminUserLike {
  avatarUrl?: string;
  email?: string;
  firstName?: string;
  keycloakId?: string;
  lastName?: string;
  phone?: string;
  roles?: string[];
  userId?: string;
}

export interface AdminSubRole {
  id: string;
  userId: string;
  role: string;
  scope: string;
  createdAt: string;
}

export interface MemberResponse {
  userId?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  roles?: string[];
  subRoles?: { role: string; scope: string }[];
}

const COLLECTION_KEYS = [
  'content',
  'data',
  'items',
  'results',
  'members',
] as const;
const NESTED_KEYS = ['data', 'payload', 'result'] as const;

function readRecord(raw: unknown): Record<string, unknown> | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return null;
  }

  return raw as Record<string, unknown>;
}

function readString(
  record: Record<string, unknown>,
  keys: readonly string[],
): string | null {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' && value.trim().length > 0) {
      return value;
    }
  }

  return null;
}

export function readCollection(raw: unknown): unknown[] {
  if (Array.isArray(raw)) {
    return raw;
  }

  const record = readRecord(raw);
  if (!record) {
    return [];
  }

  for (const key of COLLECTION_KEYS) {
    const value = record[key];
    if (Array.isArray(value)) {
      return value;
    }
  }

  for (const key of NESTED_KEYS) {
    const nested = readCollection(record[key]);
    if (nested.length > 0) {
      return nested;
    }
  }

  return [];
}

export function getPrimaryAdminRole(admin: {
  roles?: string[];
}): AdminRole | null {
  if (admin.roles?.includes('SUPER_ADMIN')) return 'SUPER_ADMIN';
  if (admin.roles?.includes('ADMIN')) return 'ADMIN';
  return null;
}

export function normalizeAdminUser(raw: unknown): AdminUserLike | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return null;
  }

  const record = raw as Record<string, unknown>;
  const nested = record['data'];

  if (nested && typeof nested === 'object' && !Array.isArray(nested)) {
    return nested as AdminUserLike;
  }

  const candidate = raw as AdminUserLike;
  if (
    candidate.userId ||
    candidate.email ||
    candidate.firstName ||
    candidate.lastName ||
    candidate.keycloakId
  ) {
    return candidate;
  }

  return null;
}

export function normalizeAdminCollection(raw: unknown): AdminUserLike[] {
  const collection = readCollection(raw)
    .map((item) => normalizeAdminUser(item))
    .filter((item): item is AdminUserLike => Boolean(item));

  if (collection.length > 0) {
    return collection;
  }

  const single = normalizeAdminUser(raw);
  return single ? [single] : [];
}

function normalizeSubRole(raw: unknown): AdminSubRole | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    if (typeof raw === 'string' && raw.trim().length > 0) {
      return {
        id: raw,
        userId: '',
        role: raw,
        scope: 'UBAX_INTERNAL',
        createdAt: '',
      };
    }

    return null;
  }

  const record = raw as Record<string, unknown>;
  const role = readString(record, ['role', 'name', 'value']) ?? '';
  const id = readString(record, ['id', 'subRoleId', 'subRoleID']) ?? role;

  if (!role && !id) {
    return null;
  }

  return {
    id,
    userId: readString(record, ['userId', 'user_id']) ?? '',
    role: role || id,
    scope: readString(record, ['scope']) ?? 'UBAX_INTERNAL',
    createdAt: readString(record, ['createdAt', 'created_at']) ?? '',
  };
}

export function normalizeAdminSubRoles(raw: unknown): AdminSubRole[] {
  const collection = readCollection(raw)
    .map((item) => normalizeSubRole(item))
    .filter((item): item is AdminSubRole => Boolean(item));

  if (collection.length > 0) {
    return collection;
  }

  const single = normalizeSubRole(raw);
  return single ? [single] : [];
}

function normalizeMember(raw: unknown): MemberResponse | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return null;
  }

  return raw as MemberResponse;
}

export function normalizeMemberCollection(raw: unknown): MemberResponse[] {
  const collection = readCollection(raw)
    .map((item) => normalizeMember(item))
    .filter((item): item is MemberResponse => Boolean(item));

  if (collection.length > 0) {
    return collection;
  }

  const single = normalizeMember(raw);
  return single ? [single] : [];
}

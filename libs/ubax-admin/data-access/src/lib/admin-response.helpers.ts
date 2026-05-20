import type {
  AdminAgencyResponse,
  AdminDashboardResponse,
  AdminHotelResponse,
  ClientUserResponse,
} from '@ubax-workspace/shared-api-types';

type UnknownRecord = Record<string, unknown>;

export interface MemberResponse {
  active?: boolean;
  deletedAt?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  roles?: string[];
  subRoles?: string[] | { role: string; scope: string }[];
  userId?: string;
}

export interface AdminPageResult<T> {
  items: T[];
  totalElements: number;
  totalPages: number;
}

const DEFAULT_COLLECTION_KEYS = [
  'results',
  'content',
  'items',
  'data',
] as const;
const MEMBER_COLLECTION_KEYS = [
  'results',
  'content',
  'items',
  'members',
  'data',
] as const;
const NESTED_KEYS = ['data', 'payload', 'result'] as const;

export function normalizeSubRoleStrings(
  subRoles: MemberResponse['subRoles'],
): string[] {
  if (!subRoles?.length) {
    return [];
  }

  return subRoles
    .map((subRole) =>
      typeof subRole === 'string'
        ? subRole
        : ((subRole as { role?: string }).role ?? ''),
    )
    .filter((value) => value.trim().length > 0);
}

function readRecord(value: unknown): UnknownRecord | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  return value as UnknownRecord;
}

function readString(
  record: UnknownRecord,
  keys: readonly string[],
): string | undefined {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' && value.trim().length > 0) {
      return value;
    }
  }

  return undefined;
}

function readNumber(
  record: UnknownRecord,
  keys: readonly string[],
): number | undefined {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }
  }

  return undefined;
}

function readStringArray(
  record: UnknownRecord,
  key: string,
): string[] | undefined {
  const value = record[key];
  if (!Array.isArray(value)) {
    return undefined;
  }

  const normalized = value.filter(
    (item): item is string =>
      typeof item === 'string' && item.trim().length > 0,
  );

  return normalized.length > 0 ? normalized : undefined;
}

export function readCollection(
  raw: unknown,
  collectionKeys: readonly string[] = DEFAULT_COLLECTION_KEYS,
): unknown[] {
  if (Array.isArray(raw)) {
    return raw;
  }

  const record = readRecord(raw);
  if (!record) {
    return [];
  }

  for (const key of collectionKeys) {
    const value = record[key];
    if (Array.isArray(value)) {
      return value;
    }
  }

  for (const key of NESTED_KEYS) {
    const nested = readCollection(record[key], collectionKeys);
    if (nested.length > 0) {
      return nested;
    }
  }

  return [];
}

function readPageContainer(raw: unknown): UnknownRecord | null {
  const record = readRecord(raw);
  if (!record) {
    return null;
  }

  return readRecord(record['data']) ?? record;
}

function normalizePageResult<T>(
  raw: unknown,
  mapItem: (value: unknown) => T | null,
  collectionKeys: readonly string[] = DEFAULT_COLLECTION_KEYS,
): AdminPageResult<T> {
  const items = readCollection(raw, collectionKeys)
    .map((item) => mapItem(item))
    .filter((item): item is T => Boolean(item));

  const container = readPageContainer(raw);
  const totalElements =
    container &&
    readNumber(container, ['totalElements', 'totalItems', 'total_items']);

  const totalPages =
    container && readNumber(container, ['totalPages', 'total_pages']);

  return {
    items,
    totalElements: totalElements ?? items.length,
    totalPages: totalPages ?? (items.length > 0 ? 1 : 0),
  };
}

function hasAnyKnownKey(
  record: UnknownRecord | null,
  keys: readonly string[],
): boolean {
  if (!record) {
    return false;
  }

  return keys.some((key) => key in record);
}

function isAdminAgencyResponse(value: unknown): value is AdminAgencyResponse {
  return hasAnyKnownKey(readRecord(value), [
    'active',
    'city',
    'email',
    'id',
    'logoUrl',
    'name',
    'phone',
    'subscriptionActive',
    'subscriptionExpiresAt',
    'subscriptionPlan',
    'verified',
    'verifiedAt',
  ]);
}

function isAdminHotelResponse(value: unknown): value is AdminHotelResponse {
  return hasAnyKnownKey(readRecord(value), [
    'active',
    'city',
    'email',
    'id',
    'logoUrl',
    'name',
    'phone',
    'stars',
    'subscriptionActive',
    'subscriptionExpiresAt',
    'subscriptionPlan',
    'totalRooms',
    'verified',
    'verifiedAt',
  ]);
}

function isClientUserResponse(value: unknown): value is ClientUserResponse {
  return Boolean(readRecord(value));
}

function unwrapItem<T>(
  raw: unknown,
  guard: (value: unknown) => value is T,
): T | null {
  if (guard(raw)) {
    return raw;
  }

  const record = readRecord(raw);
  if (!record) {
    return null;
  }

  const nested = record['data'];
  return guard(nested) ? nested : null;
}

function normalizeMember(raw: unknown): MemberResponse | null {
  const record = readRecord(raw);
  if (!record) {
    return null;
  }

  const objectSubRoles = Array.isArray(record['subRoles'])
    ? record['subRoles'].filter(
        (
          item,
        ): item is {
          role: string;
          scope: string;
        } =>
          Boolean(item) &&
          typeof item === 'object' &&
          !Array.isArray(item) &&
          typeof (item as { role?: unknown }).role === 'string' &&
          typeof (item as { scope?: unknown }).scope === 'string',
      )
    : undefined;

  return {
    active:
      typeof record['active'] === 'boolean' ? record['active'] : undefined,
    deletedAt: readString(record, ['deletedAt', 'deleted_at']),
    email: readString(record, ['email']),
    firstName: readString(record, ['firstName', 'first_name']),
    lastName: readString(record, ['lastName', 'last_name']),
    phone: readString(record, ['phone']),
    roles: readStringArray(record, 'roles'),
    subRoles: objectSubRoles ?? readStringArray(record, 'subRoles'),
    userId: readString(record, ['userId', 'user_id', 'id']),
  };
}

export function normalizeAgencyPageResponse(
  raw: unknown,
): AdminPageResult<AdminAgencyResponse> {
  return normalizePageResult(raw, (item) =>
    isAdminAgencyResponse(item) ? item : null,
  );
}

export function normalizeHotelPageResponse(
  raw: unknown,
): AdminPageResult<AdminHotelResponse> {
  return normalizePageResult(raw, (item) =>
    isAdminHotelResponse(item) ? item : null,
  );
}

export function normalizeClientPageResponse(
  raw: unknown,
): AdminPageResult<ClientUserResponse> {
  return normalizePageResult(raw, (item) =>
    isClientUserResponse(item) ? item : null,
  );
}

export function normalizeAgencyResponse(
  raw: unknown,
): AdminAgencyResponse | null {
  return unwrapItem(raw, isAdminAgencyResponse);
}

export function normalizeHotelResponse(
  raw: unknown,
): AdminHotelResponse | null {
  return unwrapItem(raw, isAdminHotelResponse);
}

export function normalizeDashboardResponse(
  raw: unknown,
): AdminDashboardResponse {
  const record = readRecord(raw);
  const dataRecord = record ? readRecord(record['data']) : null;
  const source = dataRecord ?? record;

  if (!source) {
    return {};
  }

  return {
    confirmedReservations: readNumber(source, ['confirmedReservations']) ?? 0,
    openTickets: readNumber(source, ['openTickets']) ?? 0,
    pendingReservations: readNumber(source, ['pendingReservations']) ?? 0,
    propertiesPendingReview:
      readNumber(source, ['propertiesPendingReview']) ?? 0,
    publishedProperties: readNumber(source, ['publishedProperties']) ?? 0,
    totalActiveAgencies: readNumber(source, ['totalActiveAgencies']) ?? 0,
    totalActiveHotels: readNumber(source, ['totalActiveHotels']) ?? 0,
    totalClients: readNumber(source, ['totalClients']) ?? 0,
    totalOwners: readNumber(source, ['totalOwners']) ?? 0,
  };
}

export function normalizeMemberCollection(raw: unknown): MemberResponse[] {
  return readCollection(raw, MEMBER_COLLECTION_KEYS)
    .map((item) => normalizeMember(item))
    .filter((item): item is MemberResponse => Boolean(item));
}

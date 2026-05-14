import { inject, Injectable } from '@angular/core';
import {
  Api,
  ApiConfiguration,
  type AdminUserResponse,
  type AssignAdminRoleRequest,
  type CreateAdminRequest,
  assignAdminRole,
  assignSubRoles1,
  createAdmin,
  deleteAdmin,
  getSubRoles1,
  listAdmins,
  revokeSubRole1,
} from '@ubax-workspace/shared-api-types';
import { HttpClient } from '@angular/common/http';
import { from, map, Observable, of, switchMap } from 'rxjs';

export type AdminRole = 'ADMIN' | 'SUPER_ADMIN';

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
  /** Peut être un tableau de strings OU d'objets { role, scope } selon l'endpoint */
  subRoles?: string[] | { role: string; scope: string }[];
}

/** Normalise subRoles en tableau de strings quelle que soit la forme reçue */
export function normalizeSubRoleStrings(
  subRoles: MemberResponse['subRoles'],
): string[] {
  if (!subRoles?.length) return [];
  return subRoles.map((sr) =>
    typeof sr === 'string' ? sr : (sr as { role: string }).role ?? '',
  ).filter(Boolean);
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

export function normalizeAdminUser(raw: unknown): AdminUserResponse | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return null;
  }

  const record = raw as Record<string, unknown>;
  const nested = record['data'];

  if (nested && typeof nested === 'object' && !Array.isArray(nested)) {
    return nested as AdminUserResponse;
  }

  const candidate = raw as AdminUserResponse;
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

export function normalizeAdminCollection(raw: unknown): AdminUserResponse[] {
  const collection = readCollection(raw)
    .map((item) => normalizeAdminUser(item))
    .filter((item): item is AdminUserResponse => Boolean(item));

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
  // Cas 1 : tableau direct
  if (Array.isArray(raw)) {
    return raw
      .map((item) => normalizeMember(item))
      .filter((item): item is MemberResponse => Boolean(item));
  }

  if (!raw || typeof raw !== 'object') return [];

  const r = raw as Record<string, unknown>;

  // Cas 2 : { data: [...] } — tableau direct dans data
  if (Array.isArray(r['data'])) {
    return (r['data'] as unknown[])
      .map((item) => normalizeMember(item))
      .filter((item): item is MemberResponse => Boolean(item));
  }

  // Cas 3 : { data: { results: [...] } } — paginé
  const nested = r['data'];
  if (nested && typeof nested === 'object' && !Array.isArray(nested)) {
    const n = nested as Record<string, unknown>;
    for (const key of ['results', 'content', 'items', 'members'] as const) {
      if (Array.isArray(n[key])) {
        return (n[key] as unknown[])
          .map((item) => normalizeMember(item))
          .filter((item): item is MemberResponse => Boolean(item));
      }
    }
  }

  // Cas 4 : { results: [...] } ou { content: [...] } au premier niveau
  for (const key of ['results', 'content', 'items', 'members'] as const) {
    if (Array.isArray(r[key])) {
      return (r[key] as unknown[])
        .map((item) => normalizeMember(item))
        .filter((item): item is MemberResponse => Boolean(item));
    }
  }

  return [];
}

export function getPrimaryAdminRole(
  admin: AdminUserResponse,
): AdminRole | null {
  if (admin.roles?.includes('SUPER_ADMIN')) return 'SUPER_ADMIN';
  if (admin.roles?.includes('ADMIN')) return 'ADMIN';
  return null;
}

export const INTERNAL_SUB_ROLES = [
  { label: 'Directeur Général', value: 'DIRECTEUR_GENERAL' },
  { label: 'Support Client', value: 'SUPPORT_CLIENT' },
  { label: 'Opérations', value: 'OPERATIONS' },
  { label: 'Finance', value: 'FINANCE' },
  { label: 'Commercial', value: 'COMMERCIAL' },
] as const;

@Injectable({ providedIn: 'root' })
export class AdminUsersService {
  private readonly api = inject(Api);
  private readonly http = inject(HttpClient);
  private readonly config = inject(ApiConfiguration);

  listAdmins(): Observable<AdminUserResponse[]> {
    return from(this.api.invoke(listAdmins)).pipe(
      map(normalizeAdminCollection),
    );
  }

  createAdmin(body: CreateAdminRequest): Observable<AdminUserResponse> {
    return from(this.api.invoke(createAdmin, { body })).pipe(
      map((raw) => normalizeAdminUser(raw) ?? (raw as AdminUserResponse)),
    );
  }

  updateRole(
    userId: string,
    role: AssignAdminRoleRequest['role'],
  ): Observable<AdminUserResponse> {
    return from(
      this.api.invoke(assignAdminRole, { userId, body: { role } }),
    ).pipe(map((raw) => normalizeAdminUser(raw) ?? (raw as AdminUserResponse)));
  }

  deleteAdmin(userId: string): Observable<void> {
    return from(this.api.invoke(deleteAdmin, { userId }));
  }

  getSubRoles(userId: string): Observable<AdminSubRole[]> {
    return from(
      this.api.invoke(getSubRoles1, { userId, scope: 'UBAX_INTERNAL' }),
    ).pipe(
      // getSubRoles2 uses responseType:'blob' — parse the Blob as JSON first
      switchMap((raw) => {
        if (raw instanceof Blob) {
          return from(raw.text()).pipe(map((text) => {
            try { return normalizeAdminSubRoles(JSON.parse(text)); }
            catch { return []; }
          }));
        }
        return of(normalizeAdminSubRoles(raw));
      }),
    );
  }

  assignSubRoles(userId: string, roles: string[]): Observable<AdminSubRole[]> {
    return from(
      this.api.invoke(assignSubRoles1, {
        userId,
        body: { roles, scope: 'UBAX_INTERNAL' },
      }),
    ).pipe(
      switchMap((raw) => {
        if (raw instanceof Blob) {
          return from(raw.text()).pipe(map((text) => {
            try { return normalizeAdminSubRoles(JSON.parse(text)); }
            catch { return []; }
          }));
        }
        return of(normalizeAdminSubRoles(raw));
      }),
    );
  }

  revokeSubRole(userId: string, role: string): Observable<AdminSubRole[]> {
    return from(
      this.api.invoke(revokeSubRole1, { userId, role, scope: 'UBAX_INTERNAL' }),
    ).pipe(
      switchMap((raw) => {
        if (raw instanceof Blob) {
          return from(raw.text()).pipe(map((text) => {
            try { return normalizeAdminSubRoles(JSON.parse(text)); }
            catch { return []; }
          }));
        }
        return of(normalizeAdminSubRoles(raw));
      }),
    );
  }

  getAgencyMembers(agencyId: string): Observable<MemberResponse[]> {
    return this.http
      .get<unknown>(
        `${this.config.rootUrl}/v1/admin/agencies/${agencyId}/members`,
      )
      .pipe(map(normalizeMemberCollection));
  }

  getHotelMembers(hotelId: string): Observable<MemberResponse[]> {
    return this.http
      .get<unknown>(
        `${this.config.rootUrl}/v1/admin/hotels/${hotelId}/members`,
      )
      .pipe(map(normalizeMemberCollection));
  }
}

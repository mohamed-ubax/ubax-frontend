import { HttpParams } from '@angular/common/http';
import type { PropertyResponse } from '@ubax-workspace/shared-api-types';

export type AdminPropertyStatusFilter = Extract<
  PropertyResponse['status'],
  'DRAFT' | 'PENDING' | 'PUBLISHED' | 'REJECTED' | 'ARCHIVED'
>;

export interface PropertyPageResult {
  items: PropertyResponse[];
  totalElements: number;
  totalPages: number;
}

export interface AdminScopedPropertyListParams {
  page?: number;
  size?: number;
  status?: AdminPropertyStatusFilter;
  agencyId?: string;
  hotelId?: string;
  sort?: string;
}

export function normalizePropertyPageResponse(
  raw: unknown,
  requestedSize: number,
): PropertyPageResult {
  const body = raw as {
    data?: {
      results?: PropertyResponse[];
      content?: PropertyResponse[];
      totalItems?: number;
      total_items?: number;
      totalElements?: number;
      totalPages?: number;
      total_pages?: number;
    };
    results?: PropertyResponse[];
    content?: PropertyResponse[];
    totalItems?: number;
    total_items?: number;
    totalElements?: number;
    totalPages?: number;
    total_pages?: number;
  };

  const data = body?.data ?? body;

  const items: PropertyResponse[] =
    data?.results ??
    data?.content ??
    (Array.isArray(body) ? (body as PropertyResponse[]) : []);

  const totalElements =
    data?.totalItems ??
    data?.total_items ??
    ((data as Record<string, unknown>)?.['total-items'] as
      | number
      | undefined) ??
    data?.totalElements ??
    items.length;

  const rawTotalPages =
    ((data as Record<string, unknown>)['total-pages'] as number | undefined) ??
    data?.total_pages ??
    data?.totalPages ??
    ((body as Record<string, unknown>)['total-pages'] as number | undefined);

  const totalPages =
    rawTotalPages ?? (Math.ceil(totalElements / requestedSize) || 1);

  return { items, totalElements, totalPages };
}

export function buildAdminScopedPropertyQueryParams(
  params: AdminScopedPropertyListParams = {},
): HttpParams {
  const page = Math.max(params.page ?? 0, 0);
  const size = Math.min(Math.max(params.size ?? 20, 1), 200);

  let httpParams = new HttpParams()
    .set('page', String(page))
    .set('size', String(size))
    .set('sort', params.sort ?? 'createdAt,desc');

  if (params.status) {
    httpParams = httpParams.set('status', params.status);
  }

  if (params.agencyId) {
    httpParams = httpParams.set('agencyId', params.agencyId);
  }

  if (params.hotelId) {
    httpParams = httpParams.set('hotelId', params.hotelId);
  }

  return httpParams;
}

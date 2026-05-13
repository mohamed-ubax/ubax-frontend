import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import {
  ApiConfiguration,
  getById,
  list1,
  updateStatus1,
  type PropertyDetailResponse,
  type PropertyResponse,
  type PropertyStatusUpdateRequest,
} from '@ubax-workspace/shared-api-types';

export type PropertyModerationStatus = 'PUBLISHED' | 'REJECTED';

export interface PropertyModerationDecision {
  status: PropertyModerationStatus;
  rejectionReason?: string;
}

@Injectable({ providedIn: 'root' })
export class AdminPropertiesService {
  private readonly http = inject(HttpClient);
  private readonly apiConfig = inject(ApiConfiguration);

  private get rootUrl(): string {
    return this.apiConfig.rootUrl;
  }

  /** GET /v1/properties?status=PENDING — liste paginée côté serveur */
  listPending(params: {
    page?: number;
    size?: number;
    city?: string;
    propertyType?: string;
    agencyId?: string;
  } = {}): Observable<{ items: PropertyResponse[]; totalElements: number; totalPages: number }> {
    return list1(this.http, this.rootUrl, {
      status: 'PENDING',
      city: params.city || undefined,
      propertyType: params.propertyType || undefined,
      agencyId: params.agencyId || undefined,
      pageable: {
        page: params.page ?? 0,
        size: params.size ?? 20,
        sort: ['createdAt,desc'],
      },
    }).pipe(
      map((r) => {
        // Réponse réelle du backend :
        // { data: { totalItems, perPage, total_pages, page, results: [...] }, total_pages, total_items }
        const body = r.body as unknown as {
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
          (data as Record<string, unknown>)?.['total-items'] as number | undefined ??
          data?.totalElements ??
          items.length;

        // Le backend renvoie "total-pages" (avec tiret) — accès obligatoire par bracket notation
        const rawTotalPages =
          (data as Record<string, unknown>)['total-pages'] as number | undefined ??
          data?.total_pages ??
          data?.totalPages ??
          (body as Record<string, unknown>)['total-pages'] as number | undefined;

        const totalPages = rawTotalPages ?? (Math.ceil(totalElements / (params.size ?? 20)) || 1);

        return { items, totalElements, totalPages };
      }),
    );
  }

  /** GET /v1/properties?status=PUBLISHED — liste paginée côté serveur */
  listPublished(params: {
    page?: number;
    size?: number;
    city?: string;
    propertyType?: string;
    transactionType?: string;
    agencyId?: string;
    hotelId?: string;
    minPrice?: number;
    maxPrice?: number;
  } = {}): Observable<{ items: PropertyResponse[]; totalElements: number; totalPages: number }> {
    return list1(this.http, this.rootUrl, {
      status: 'PUBLISHED',
      city: params.city || undefined,
      propertyType: params.propertyType || undefined,
      transactionType: params.transactionType || undefined,
      agencyId: params.agencyId || undefined,
      hotelId: params.hotelId || undefined,
      minPrice: params.minPrice || undefined,
      maxPrice: params.maxPrice || undefined,
      pageable: {
        page: params.page ?? 0,
        size: params.size ?? 12,
        sort: ['publishedAt,desc'],
      },
    }).pipe(
      map((r) => {
        // Réponse réelle du backend :
        // { data: { totalItems, perPage, total_pages, page, results: [...] }, total_pages, total_items }
        const body = r.body as unknown as {
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
          (data as Record<string, unknown>)?.['total-items'] as number | undefined ??
          data?.totalElements ??
          items.length;

        // Le backend renvoie "total-pages" (avec tiret) — accès obligatoire par bracket notation
        const rawTotalPages =
          (data as Record<string, unknown>)['total-pages'] as number | undefined ??
          data?.total_pages ??
          data?.totalPages ??
          (body as Record<string, unknown>)['total-pages'] as number | undefined;

        const totalPages = rawTotalPages ?? (Math.ceil(totalElements / (params.size ?? 12)) || 1);

        return { items, totalElements, totalPages };
      }),
    );
  }
  getDetail(id: string): Observable<PropertyDetailResponse> {
    return getById(this.http, this.rootUrl, { id }).pipe(
      map((r) => {
        // API response shape:
        // { status, statusCode, message, data: { property: {...}, media: [...], documents: [...] } }
        const body = r.body as unknown as
          | { data?: PropertyDetailResponse }
          | PropertyDetailResponse;
        return (body as { data?: PropertyDetailResponse })?.data ?? (body as PropertyDetailResponse);
      }),
    );
  }

  /** PATCH /v1/properties/:id/status — approuver ou rejeter */
  decide(id: string, decision: PropertyModerationDecision): Observable<PropertyResponse> {
    const payload: PropertyStatusUpdateRequest = {
      status: decision.status,
      ...(decision.rejectionReason ? { rejectionReason: decision.rejectionReason } : {}),
    };
    return updateStatus1(this.http, this.rootUrl, { id, body: payload }).pipe(
      map((r) => {
        const body = r.body as unknown as { data?: PropertyResponse } | PropertyResponse;
        return (body as { data?: PropertyResponse })?.data ?? (body as PropertyResponse);
      }),
    );
  }
}

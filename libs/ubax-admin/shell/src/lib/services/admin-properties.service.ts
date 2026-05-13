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
        // API response shape:
        // { status, statusCode, message, data: { totalItems, totalPages, page, perPage, isFirst, isLast, results: [...] } }
        const body = r.body as unknown as {
          data?: {
            results?: PropertyResponse[];
            content?: PropertyResponse[];
            totalItems?: number;
            totalElements?: number;
            totalPages?: number;
          };
          results?: PropertyResponse[];
          content?: PropertyResponse[];
          totalItems?: number;
          totalElements?: number;
          totalPages?: number;
        };

        const data = body?.data ?? body;

        const items: PropertyResponse[] =
          data?.results ??
          data?.content ??
          (Array.isArray(body) ? (body as PropertyResponse[]) : []);

        const totalElements =
          data?.totalItems ??
          data?.totalElements ??
          items.length;

        const totalPages =
          data?.totalPages ?? 1;

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
    minPrice?: number;
    maxPrice?: number;
  } = {}): Observable<{ items: PropertyResponse[]; totalElements: number; totalPages: number }> {
    return list1(this.http, this.rootUrl, {
      status: 'PUBLISHED',
      city: params.city || undefined,
      propertyType: params.propertyType || undefined,
      transactionType: params.transactionType || undefined,
      agencyId: params.agencyId || undefined,
      minPrice: params.minPrice || undefined,
      maxPrice: params.maxPrice || undefined,
      pageable: {
        page: params.page ?? 0,
        size: params.size ?? 12,
        sort: ['publishedAt,desc'],
      },
    }).pipe(
      map((r) => {
        const body = r.body as unknown as {
          data?: {
            results?: PropertyResponse[];
            content?: PropertyResponse[];
            totalItems?: number;
            totalElements?: number;
            totalPages?: number;
          };
          results?: PropertyResponse[];
          content?: PropertyResponse[];
          totalItems?: number;
          totalElements?: number;
          totalPages?: number;
        };
        const data = body?.data ?? body;
        const items: PropertyResponse[] =
          data?.results ??
          data?.content ??
          (Array.isArray(body) ? (body as PropertyResponse[]) : []);
        const totalElements = data?.totalItems ?? data?.totalElements ?? items.length;
        const totalPages = data?.totalPages ?? 1;
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

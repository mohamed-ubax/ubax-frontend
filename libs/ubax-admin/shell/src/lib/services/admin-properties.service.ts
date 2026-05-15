import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import {
  ApiConfiguration,
  getById,
  list2,
  updateStatus1,
  type PropertyDetailResponse,
  type PropertyResponse,
  type PropertyStatusUpdateRequest,
} from '@ubax-workspace/shared-api-types';
import {
  buildAdminScopedPropertyQueryParams,
  normalizePropertyPageResponse,
  type AdminPropertyStatusFilter,
  type PropertyPageResult,
} from './admin-properties.helpers';

export type PropertyModerationStatus = 'PUBLISHED' | 'REJECTED';

export interface PropertyModerationDecision {
  status: PropertyModerationStatus;
  rejectionReason?: string;
}

export interface AdminScopedPropertyParams {
  page?: number;
  size?: number;
  status?: AdminPropertyStatusFilter;
  agencyId?: string;
  hotelId?: string;
}

@Injectable({ providedIn: 'root' })
export class AdminPropertiesService {
  private readonly http = inject(HttpClient);
  private readonly apiConfig = inject(ApiConfiguration);

  private get rootUrl(): string {
    return this.apiConfig.rootUrl;
  }

  /** GET /v1/properties?status=PENDING — liste paginée côté serveur */
  listPending(
    params: {
      page?: number;
      size?: number;
      city?: string;
      propertyType?: string;
      agencyId?: string;
    } = {},
  ): Observable<PropertyPageResult> {
    return list2(this.http, this.rootUrl, {
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
      map((r) => normalizePropertyPageResponse(r.body, params.size ?? 20)),
    );
  }

  /** GET /v1/properties?status=PUBLISHED — liste paginée côté serveur */
  listPublished(
    params: {
      page?: number;
      size?: number;
      city?: string;
      propertyType?: string;
      transactionType?: string;
      agencyId?: string;
      hotelId?: string;
      minPrice?: number;
      maxPrice?: number;
    } = {},
  ): Observable<PropertyPageResult> {
    return list2(this.http, this.rootUrl, {
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
      map((r) => normalizePropertyPageResponse(r.body, params.size ?? 12)),
    );
  }

  listAdminAgencyProperties(
    params: AdminScopedPropertyParams = {},
  ): Observable<PropertyPageResult> {
    const pageSize = Math.min(Math.max(params.size ?? 20, 1), 200);

    return this.http
      .get<unknown>(`${this.rootUrl}/v1/properties/admin/agencies`, {
        params: buildAdminScopedPropertyQueryParams({
          page: params.page,
          size: pageSize,
          status: params.status,
          agencyId: params.agencyId,
        }),
      })
      .pipe(map((body) => normalizePropertyPageResponse(body, pageSize)));
  }

  listAdminHotelProperties(
    params: AdminScopedPropertyParams = {},
  ): Observable<PropertyPageResult> {
    const pageSize = Math.min(Math.max(params.size ?? 20, 1), 200);

    return this.http
      .get<unknown>(`${this.rootUrl}/v1/properties/admin/hotels`, {
        params: buildAdminScopedPropertyQueryParams({
          page: params.page,
          size: pageSize,
          status: params.status,
          hotelId: params.hotelId,
        }),
      })
      .pipe(map((body) => normalizePropertyPageResponse(body, pageSize)));
  }

  getDetail(id: string): Observable<PropertyDetailResponse> {
    return getById(this.http, this.rootUrl, { id }).pipe(
      map((r) => {
        // API response shape:
        // { status, statusCode, message, data: { property: {...}, media: [...], documents: [...] } }
        const body = r.body as unknown as
          | { data?: PropertyDetailResponse }
          | PropertyDetailResponse;
        return (
          (body as { data?: PropertyDetailResponse })?.data ??
          (body as PropertyDetailResponse)
        );
      }),
    );
  }

  /** PATCH /v1/properties/:id/status — approuver ou rejeter */
  decide(
    id: string,
    decision: PropertyModerationDecision,
  ): Observable<PropertyResponse> {
    const payload: PropertyStatusUpdateRequest = {
      status: decision.status,
      ...(decision.rejectionReason
        ? { rejectionReason: decision.rejectionReason }
        : {}),
    };
    return updateStatus1(this.http, this.rootUrl, { id, body: payload }).pipe(
      map((r) => {
        const body = r.body as unknown as
          | { data?: PropertyResponse }
          | PropertyResponse;
        return (
          (body as { data?: PropertyResponse })?.data ??
          (body as PropertyResponse)
        );
      }),
    );
  }
}

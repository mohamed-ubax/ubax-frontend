import { inject, Injectable } from '@angular/core';
import {
  Api,
  type PartnerApplicationResponse,
  listApplications,
  getApplication,
  decide,
} from '@ubax-workspace/shared-api-types';
import { from, map, Observable } from 'rxjs';

export type DecisionStatus = 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'INCOMPLETE';

export interface DecisionRequest {
  newStatus: DecisionStatus;
  comment?: string;
}

function readCollection(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw;
  if (!raw || typeof raw !== 'object') return [];
  const r = raw as Record<string, unknown>;
  for (const key of ['results', 'content', 'items', 'data'] as const) {
    if (Array.isArray(r[key])) return r[key] as unknown[];
  }
  const nested = r['data'];
  if (nested && typeof nested === 'object' && !Array.isArray(nested)) {
    const n = nested as Record<string, unknown>;
    for (const key of ['results', 'content', 'items'] as const) {
      if (Array.isArray(n[key])) return n[key] as unknown[];
    }
  }
  return [];
}

@Injectable({ providedIn: 'root' })
export class AdminCandidaturesService {
  private readonly api = inject(Api);

  listApplications(params?: {
    status?: PartnerApplicationResponse['status'];
    page?: number;
    size?: number;
  }): Observable<PartnerApplicationResponse[]> {
    return from(
      this.api.invoke(listApplications, {
        status: params?.status,
        pageable: {
          page: params?.page ?? 0,
          size: params?.size ?? 50,
          sort: ['submittedAt,desc'],
        },
      }),
    ).pipe(map((raw) => readCollection(raw) as PartnerApplicationResponse[]));
  }

  getApplication(id: string): Observable<PartnerApplicationResponse> {
    return from(this.api.invoke(getApplication, { id })).pipe(
      map((raw) => {
        if (raw && typeof raw === 'object') {
          const r = raw as Record<string, unknown>;
          if (r['data'] && typeof r['data'] === 'object') {
            return r['data'] as PartnerApplicationResponse;
          }
        }
        return raw as PartnerApplicationResponse;
      }),
    );
  }

  decide(
    id: string,
    body: DecisionRequest,
  ): Observable<PartnerApplicationResponse> {
    return from(
      this.api.invoke(decide, {
        id,
        newStatus: body.newStatus,
        comment: body.comment,
      }),
    ).pipe(
      map((raw) => {
        if (raw && typeof raw === 'object') {
          const r = raw as Record<string, unknown>;
          if (r['data'] && typeof r['data'] === 'object') {
            return r['data'] as PartnerApplicationResponse;
          }
        }
        return raw as PartnerApplicationResponse;
      }),
    );
  }
}

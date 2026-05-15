import { inject, Injectable } from '@angular/core';
import {
  Api,
  type ClientUserResponse,
  listClients1,
} from '@ubax-workspace/shared-api-types';
import { from, map, Observable } from 'rxjs';

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
export class AdminClientsService {
  private readonly api = inject(Api);

  listClients(params?: { agencyId?: string; hotelId?: string }): Observable<ClientUserResponse[]> {
    return from(
      this.api.invoke(listClients1, {
        agencyId: params?.agencyId,
        hotelId: params?.hotelId,
        pageable: { page: 0, size: 500 },
      }),
    ).pipe(map((raw) => readCollection(raw) as ClientUserResponse[]));
  }
}

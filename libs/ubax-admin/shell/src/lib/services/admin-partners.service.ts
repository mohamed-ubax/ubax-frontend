import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
  ApiConfiguration,
  Api,
  type AdminAgencyResponse,
  type AdminHotelResponse,
  type AgencyResponse,
  activateAgency,
  activateHotel,
  listAgencies,
  listHotels,
  suspendAgency,
  suspendHotel,
} from '@ubax-workspace/shared-api-types';
import { from, map, Observable } from 'rxjs';

export interface PartnerFilterOption {
  id?: string;
  name?: string;
  city?: string;
}

/**
 * Extrait un tableau depuis n'importe quelle enveloppe API.
 *
 * Supporte les structures :
 *   - tableau direct                          → [...]
 *   - { data: [...] }                         → data
 *   - { data: { results: [...] } }            → data.results  ← format réel de l'API
 *   - { data: { content: [...] } }            → data.content
 *   - { results: [...] }                      → results
 *   - { content: [...] }                      → content
 */
function readCollection(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw;
  if (!raw || typeof raw !== 'object') return [];

  const r = raw as Record<string, unknown>;

  // Tableau direct dans les clés de premier niveau
  for (const key of ['results', 'content', 'items', 'data'] as const) {
    if (Array.isArray(r[key])) return r[key] as unknown[];
  }

  // Objet imbriqué dans data → chercher results/content/items dedans
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
export class AdminPartnersService {
  private readonly http = inject(HttpClient);
  private readonly apiConfig = inject(ApiConfiguration);
  private readonly api = inject(Api);

  private get rootUrl(): string {
    return this.apiConfig.rootUrl;
  }

  listAgencies(): Observable<AdminAgencyResponse[]> {
    return from(
      this.api.invoke(listAgencies, { pageable: { page: 0, size: 200 } }),
    ).pipe(map((raw) => readCollection(raw) as AdminAgencyResponse[]));
  }

  listHotels(): Observable<AdminHotelResponse[]> {
    return from(
      this.api.invoke(listHotels, { pageable: { page: 0, size: 200 } }),
    ).pipe(map((raw) => readCollection(raw) as AdminHotelResponse[]));
  }

  listAgencyFilterOptions(): Observable<PartnerFilterOption[]> {
    return this.http
      .get<unknown>(`${this.rootUrl}/v1/agencies`, {
        params: {
          page: 0,
          size: 200,
          sort: 'name,ASC',
        },
      })
      .pipe(map((raw) => readCollection(raw) as AgencyResponse[]));
  }

  listHotelFilterOptions(): Observable<PartnerFilterOption[]> {
    return this.http
      .get<unknown>(`${this.rootUrl}/v1/hotels`, {
        params: {
          page: 0,
          size: 200,
          sort: 'name,ASC',
        },
      })
      .pipe(map((raw) => readCollection(raw) as AdminHotelResponse[]));
  }

  activateAgency(id: string): Observable<AdminAgencyResponse> {
    return from(this.api.invoke(activateAgency, { id })).pipe(
      map((raw) => raw as AdminAgencyResponse),
    );
  }

  suspendAgency(id: string): Observable<AdminAgencyResponse> {
    return from(this.api.invoke(suspendAgency, { id })).pipe(
      map((raw) => raw as AdminAgencyResponse),
    );
  }

  activateHotel(id: string): Observable<AdminHotelResponse> {
    return from(this.api.invoke(activateHotel, { id })).pipe(
      map((raw) => raw as AdminHotelResponse),
    );
  }

  suspendHotel(id: string): Observable<AdminHotelResponse> {
    return from(this.api.invoke(suspendHotel, { id })).pipe(
      map((raw) => raw as AdminHotelResponse),
    );
  }
}

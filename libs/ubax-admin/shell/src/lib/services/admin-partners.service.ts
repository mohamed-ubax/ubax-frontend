import { inject, Injectable } from '@angular/core';
import {
  Api,
  type AdminAgencyResponse,
  type AdminHotelResponse,
  activateAgency,
  activateHotel,
  listAgencies,
  listHotels,
  suspendAgency,
  suspendHotel,
} from '@ubax-workspace/shared-api-types';
import { from, map, Observable } from 'rxjs';

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
  private readonly api = inject(Api);

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

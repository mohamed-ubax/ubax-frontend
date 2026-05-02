import { computed, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { tapResponse } from '@ngrx/operators';
import {
  patchState,
  signalStore,
  withComputed,
  withMethods,
  withState,
} from '@ngrx/signals';
import { updateEntity } from '@ngrx/signals/entities';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { withApiResource } from '@ubax-workspace/shared-data-access';
import {
  ApiConfiguration,
  getById2,
  list4,
  qualify,
  reject,
  TenantResponse,
} from '@ubax-workspace/shared-api-types';
import { exhaustMap, map, pipe, tap } from 'rxjs';

type Tenant = TenantResponse & { id: string };

const normalizeTenant = (
  tenant: TenantResponse,
  fallbackId?: string,
): Tenant => ({
  ...tenant,
  id: tenant.id ?? tenant.userId ?? fallbackId ?? '',
});

const mapPaginated = (raw: unknown): Tenant[] => {
  let items: TenantResponse[] = [];

  if (Array.isArray(raw)) {
    items = raw;
  } else if (raw && typeof raw === 'object') {
    const record = raw as { content?: unknown; data?: unknown };

    if (Array.isArray(record.content)) {
      items = record.content;
    } else if (record.data && typeof record.data === 'object') {
      const nested = (record.data as { content?: unknown }).content;
      if (Array.isArray(nested)) {
        items = nested;
      }
    } else if (Array.isArray(record.data)) {
      items = record.data;
    }
  }

  return items.map((item: TenantResponse) => normalizeTenant(item));
};

/**
 * LocationStore — gestion des locataires.
 * Branché sur /v1/tenants (TenantResponse).
 *
 * Méthodes disponibles (héritées de withApiResource) :
 *   store.load(params?)  — GET /v1/tenants
 *   store.loadOne(id)    — GET /v1/tenants/:id
 *   store.select(id)     — sélection locale
 *
 * Méthodes spécifiques :
 *   store.qualifier(id)  — PATCH /v1/tenants/:id/qualify
 *   store.rejeter({ id, reason }) — PATCH /v1/tenants/:id/reject
 */
export const LocationStore = signalStore(
  { providedIn: 'root' },
  withApiResource<Tenant, typeof list4, typeof getById2>({
    list: list4,
    getById: getById2,
    idSelector: (tenant) => tenant.id,
    mapList: mapPaginated,
    mapGetById: (raw, requestedId) => {
      if (raw && typeof raw === 'object') {
        const data = (raw as { data?: unknown }).data;
        if (data && typeof data === 'object') {
          return normalizeTenant(data as TenantResponse, requestedId);
        }
      }

      return normalizeTenant(raw as TenantResponse, requestedId);
    },
  }),
  withState({
    filterStatut: null as Tenant['status'] | null,
  }),
  withComputed(({ entities, filterStatut }) => ({
    locatairesActifs: computed(() =>
      entities().filter((l) => l.status === 'QUALIFIED'),
    ),
    locatairesEnAttente: computed(() =>
      entities().filter((l) => l.status === 'PENDING_REVIEW'),
    ),
    locatairesRejetes: computed(() =>
      entities().filter((l) => l.status === 'REJECTED'),
    ),
    locatairesFiltres: computed(() => {
      const s = filterStatut();
      return s ? entities().filter((l) => l.status === s) : entities();
    }),
    totalLocataires: computed(() => entities().length),
  })),
  withMethods(
    (
      store,
      http = inject(HttpClient),
      apiConfig = inject(ApiConfiguration),
    ) => ({
      setFilterStatut(statut: Tenant['status'] | null): void {
        patchState(store, { filterStatut: statut });
      },

      qualifier: rxMethod<string>(
        pipe(
          tap(() => patchState(store, { saving: true, error: null })),
          exhaustMap((id: string) =>
            qualify(http, apiConfig.rootUrl, { id }).pipe(
              map((r) => normalizeTenant(r.body as TenantResponse, id)),
              tapResponse({
                next: (tenant: Tenant) =>
                  patchState(
                    store,
                    updateEntity({ id: tenant.id, changes: tenant }),
                    { saving: false },
                  ),
                error: (err: HttpErrorResponse) =>
                  patchState(store, { saving: false, error: err.message }),
              }),
            ),
          ),
        ),
      ),

      rejeter: rxMethod<{ id: string; reason: string }>(
        pipe(
          tap(() => patchState(store, { saving: true, error: null })),
          exhaustMap(({ id, reason }) =>
            reject(http, apiConfig.rootUrl, { id, reason }).pipe(
              map((r) => normalizeTenant(r.body as TenantResponse, id)),
              tapResponse({
                next: (tenant: Tenant) =>
                  patchState(
                    store,
                    updateEntity({ id: tenant.id, changes: tenant }),
                    { saving: false },
                  ),
                error: (err: HttpErrorResponse) =>
                  patchState(store, { saving: false, error: err.message }),
              }),
            ),
          ),
        ),
      ),
    }),
  ),
);

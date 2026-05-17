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
import { setAllEntities, updateEntity } from '@ngrx/signals/entities';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import {
  withApiResource,
  resolveHttpErrorMessage,
} from '@ubax-workspace/shared-data-access';
import {
  ApiConfiguration,
  getById4,
  list6,
  qualify,
  reject,
  TenantResponse,
} from '@ubax-workspace/shared-api-types';
import { exhaustMap, map, pipe, switchMap, tap } from 'rxjs';

type Tenant = TenantResponse & { id: string; propertyId?: string };

const normalizeTenantStatus = (
  status: TenantResponse['status'] | 'PENDING' | undefined,
): TenantResponse['status'] => {
  if (status === 'PENDING') {
    return 'PENDING_REVIEW';
  }

  return status;
};

const normalizeTenant = (
  tenant: TenantResponse,
  fallbackId?: string,
): Tenant => ({
  ...tenant,
  status: normalizeTenantStatus(
    (tenant as TenantResponse & { status?: 'PENDING' }).status,
  ),
  id: tenant.id ?? tenant.userId ?? fallbackId ?? '',
  propertyId:
    (tenant as TenantResponse & { propertyId?: string }).propertyId ??
    undefined,
});

const mapPaginated = (raw: unknown): Tenant[] => {
  let items: TenantResponse[] = [];

  if (Array.isArray(raw)) {
    items = raw;
  } else if (raw && typeof raw === 'object') {
    const record = raw as {
      content?: unknown;
      results?: unknown;
      data?: unknown;
    };

    if (Array.isArray(record.content)) {
      items = record.content;
    } else if (Array.isArray(record.results)) {
      items = record.results;
    } else if (record.data && typeof record.data === 'object') {
      const nestedRecord = record.data as {
        content?: unknown;
        results?: unknown;
      };
      if (Array.isArray(nestedRecord.content)) {
        items = nestedRecord.content;
      } else if (Array.isArray(nestedRecord.results)) {
        items = nestedRecord.results;
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
  withApiResource<Tenant, typeof list6, typeof getById4>({
    list: list6,
    getById: getById4,
    idSelector: (tenant) => tenant.id,
    mapList: mapPaginated,
    mapGetById: (raw, requestedId) => {
      if (raw && typeof raw === 'object') {
        const data = (raw as { data?: unknown }).data;
        if (data && typeof data === 'object') {
          return normalizeTenant(data, requestedId);
        }
      }

      return normalizeTenant(raw, requestedId);
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

      loadSansContrat: rxMethod<void>(
        pipe(
          tap(() => patchState(store, { loading: true, error: null })),
          switchMap(() =>
            http
              .get<unknown>(`${apiConfig.rootUrl}/v1/tenants`, {
                params: { withoutContract: 'true', status: 'PENDING_REVIEW' },
              })
              .pipe(
                tapResponse({
                  next: (raw) => {
                    const items = mapPaginated(raw);
                    patchState(
                      store,
                      setAllEntities(items, { selectId: (t: Tenant) => t.id }),
                      { loading: false },
                    );
                  },
                  error: (err: HttpErrorResponse) =>
                    patchState(store, {
                      loading: false,
                      error: resolveHttpErrorMessage(
                        err,
                        'Erreur lors du chargement des locataires',
                      ),
                    }),
                }),
              ),
          ),
        ),
      ),

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
                  patchState(store, {
                    saving: false,
                    error: resolveHttpErrorMessage(
                      err,
                      'Erreur lors de la mise à jour du dossier',
                    ),
                  }),
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
                  patchState(store, {
                    saving: false,
                    error: resolveHttpErrorMessage(
                      err,
                      'Erreur lors de la mise à jour du dossier',
                    ),
                  }),
              }),
            ),
          ),
        ),
      ),
    }),
  ),
);

import { inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { tapResponse } from '@ngrx/operators';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { setAllEntities } from '@ngrx/signals/entities';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import {
  withApiResource,
  resolveHttpErrorMessage,
} from '@ubax-workspace/shared-data-access';
import {
  archive,
  ApiConfiguration,
  findAllByType,
  getById1 as getPropertyById,
  LaCodeListDto,
  listMine1,
  ListMine1$Params,
  Pageable,
  PropertyResponse,
  submit,
} from '@ubax-workspace/shared-api-types';
import { exhaustMap, forkJoin, map, of, pipe, tap } from 'rxjs';

export type EspaceStatus = NonNullable<ListMine1$Params['status']>;

export const ESPACE_STATUS_LABELS: Record<EspaceStatus, string> = {
  DRAFT: 'Brouillon',
  PENDING: 'En attente',
  PUBLISHED: 'Publié',
  RESERVED: 'Réservé',
  SOLD: 'Vendu',
  ARCHIVED: 'Archivé',
  REJECTED: 'Rejeté',
};

type MesEspacesState = {
  codeListPropertyTypes: LaCodeListDto[];
  archivingEspaceIds: string[];
  lastArchivedEspaceId: string | null;
  archiveError: string | null;
  submittingEspaceIds: string[];
  lastSubmittedEspaceId: string | null;
  submitError: string | null;
};

const initialState: MesEspacesState = {
  codeListPropertyTypes: [],
  archivingEspaceIds: [],
  lastArchivedEspaceId: null,
  archiveError: null,
  submittingEspaceIds: [],
  lastSubmittedEspaceId: null,
  submitError: null,
};

function extractList<T>(body: unknown): T[] {
  if (Array.isArray(body)) return body as T[];

  if (!body || typeof body !== 'object') {
    return [];
  }

  const record = body as Record<string, unknown>;
  const directKeys = ['content', 'items', 'rows', 'list', 'results'];

  for (const key of directKeys) {
    const value = record[key];
    if (Array.isArray(value)) {
      return value as T[];
    }
  }

  const data = record['data'];
  if (Array.isArray(data)) {
    return data as T[];
  }

  if (data && typeof data === 'object') {
    const nested = data as Record<string, unknown>;
    for (const key of directKeys) {
      const value = nested[key];
      if (Array.isArray(value)) {
        return value as T[];
      }
    }
  }

  return [];
}

function extractFirstItem<T>(body: unknown): T | null {
  if (!body || typeof body !== 'object') return null;
  const record = body as Record<string, unknown>;
  if (record['data'] && typeof record['data'] === 'object')
    return record['data'] as T;
  return record as T;
}

function normalizeEspace(
  property: PropertyResponse,
  index: number,
): PropertyResponse {
  if (property.id) return property;
  return { ...property, id: `espace-${index + 1}` };
}

function selectEspaceId(property: PropertyResponse): string {
  return (
    property.id ??
    `${property.title ?? 'espace'}-${property.createdAt ?? 'unknown'}`
  );
}

function pageRequest(page: number, size: number): Pageable {
  return { page, size, sort: ['createdAt,desc'] };
}

function withoutId(ids: string[], id: string): string[] {
  return ids.filter((i) => i !== id);
}

function extractCodeListValue(item: LaCodeListDto): string {
  return item.value ?? '';
}

function markArchived(entity: PropertyResponse): PropertyResponse {
  return { ...entity, status: 'ARCHIVED' as PropertyResponse['status'] };
}

function markPending(entity: PropertyResponse): PropertyResponse {
  return { ...entity, status: 'PENDING' as PropertyResponse['status'] };
}

/**
 * MesEspacesStore — gestion des espaces hôteliers du partenaire.
 *
 * Branché sur GET /v1/properties/mine (filtré côté composant sur les types hôteliers).
 *
 * Méthodes disponibles :
 *   store.load(params)          — charge la liste paginée
 *   store.archiveEspace(id)     — DELETE /v1/properties/{id} (soft delete → ARCHIVED)
 *   store.soumettreEspace(id)   — POST /v1/properties/{id}/submit (DRAFT → PENDING)
 */
export const MesEspacesStore = signalStore(
  { providedIn: 'root' },
  withApiResource<
    PropertyResponse,
    typeof listMine1,
    typeof getPropertyById,
    undefined,
    undefined,
    typeof archive
  >({
    list: listMine1,
    getById: getPropertyById,
    delete: archive,
    idSelector: selectEspaceId,
    mapList: (raw: unknown) =>
      extractList<PropertyResponse>(raw).map((p, i) => normalizeEspace(p, i)),
    mapGetById: (raw: unknown) => {
      const p = extractFirstItem<PropertyResponse>(raw);
      return normalizeEspace(p ?? ({} as PropertyResponse), 0);
    },
  }),
  withState(initialState),
  withMethods(
    (
      store,
      http = inject(HttpClient),
      apiConfig = inject(ApiConfiguration),
    ) => ({
      /**
       * Charge les espaces hôteliers paginés.
       * Utilise listMine1 avec les paramètres fournis.
       */
      chargerEspaces: rxMethod<{
        status?: EspaceStatus;
        page?: number;
        size?: number;
      } | void>(
        pipe(
          tap(() => patchState(store, { loading: true, error: null })),
          exhaustMap((params) => {
            const page = params?.page ?? 0;
            const size = params?.size ?? 20;
            const propertyTypes$ = store.codeListPropertyTypes().length
              ? of(store.codeListPropertyTypes())
              : findAllByType(http, apiConfig.rootUrl, {
                  type: 'PROPERTY_TYPE',
                }).pipe(map((r) => extractList<LaCodeListDto>(r.body)));

            return forkJoin({
              body: listMine1(http, apiConfig.rootUrl, {
                status: params?.status,
                pageable: pageRequest(page, size),
              }).pipe(map((r) => r.body)),
              propertyTypes: propertyTypes$,
            }).pipe(
              tapResponse({
                next: ({ body, propertyTypes }) => {
                  const items = extractList<PropertyResponse>(body).map(
                    (p, i) => normalizeEspace(p, i),
                  );
                  const sortedPropertyTypes = [...propertyTypes].sort((a, b) =>
                    extractCodeListValue(a).localeCompare(
                      extractCodeListValue(b),
                    ),
                  );
                  patchState(
                    store,
                    setAllEntities(items, { selectId: selectEspaceId }),
                    {
                      codeListPropertyTypes: sortedPropertyTypes,
                      loading: false,
                      error: null,
                    },
                  );
                },
                error: (err: HttpErrorResponse) =>
                  patchState(store, {
                    loading: false,
                    error: resolveHttpErrorMessage(
                      err,
                      'Erreur lors du chargement',
                    ),
                  }),
              }),
            );
          }),
        ),
      ),

      /**
       * Archive un espace (soft delete → statut ARCHIVED).
       * Endpoint : DELETE /v1/properties/{id}
       */
      archiveEspace: rxMethod<{ id: string; preserveInList?: boolean }>(
        pipe(
          tap(({ id }) =>
            patchState(store, (state) => ({
              archivingEspaceIds: state.archivingEspaceIds.includes(id)
                ? state.archivingEspaceIds
                : [...state.archivingEspaceIds, id],
              archiveError: null,
              lastArchivedEspaceId: null,
            })),
          ),
          exhaustMap(({ id, preserveInList }) =>
            archive(http, apiConfig.rootUrl, { id }).pipe(
              tapResponse({
                next: () => {
                  const nextEntities = preserveInList
                    ? store
                        .entities()
                        .map((e) =>
                          selectEspaceId(e) === id ? markArchived(e) : e,
                        )
                    : store.entities().filter((e) => selectEspaceId(e) !== id);

                  patchState(
                    store,
                    setAllEntities(nextEntities, { selectId: selectEspaceId }),
                    (state) => ({
                      archivingEspaceIds: withoutId(
                        state.archivingEspaceIds,
                        id,
                      ),
                      lastArchivedEspaceId: id,
                      archiveError: null,
                    }),
                  );
                },
                error: (err: HttpErrorResponse) =>
                  patchState(store, (state) => ({
                    archivingEspaceIds: withoutId(state.archivingEspaceIds, id),
                    archiveError: resolveHttpErrorMessage(
                      err,
                      "Erreur lors de l'archivage de l'espace",
                    ),
                  })),
              }),
            ),
          ),
        ),
      ),

      /**
       * Soumet un espace à la modération (DRAFT → PENDING).
       * Endpoint : POST /v1/properties/{id}/submit
       */
      soumettreEspace: rxMethod<string>(
        pipe(
          tap((id) =>
            patchState(store, (state) => ({
              submittingEspaceIds: state.submittingEspaceIds.includes(id)
                ? state.submittingEspaceIds
                : [...state.submittingEspaceIds, id],
              submitError: null,
              lastSubmittedEspaceId: null,
            })),
          ),
          exhaustMap((id) =>
            submit(http, apiConfig.rootUrl, { id }).pipe(
              map((r) => r.body),
              tapResponse({
                next: () => {
                  const nextEntities = store
                    .entities()
                    .map((e) =>
                      selectEspaceId(e) === id ? markPending(e) : e,
                    );

                  patchState(
                    store,
                    setAllEntities(nextEntities, { selectId: selectEspaceId }),
                    (state) => ({
                      submittingEspaceIds: withoutId(
                        state.submittingEspaceIds,
                        id,
                      ),
                      lastSubmittedEspaceId: id,
                      submitError: null,
                    }),
                  );
                },
                error: (err: HttpErrorResponse) =>
                  patchState(store, (state) => ({
                    submittingEspaceIds: withoutId(
                      state.submittingEspaceIds,
                      id,
                    ),
                    submitError: resolveHttpErrorMessage(
                      err,
                      "Erreur lors de la soumission de l'espace",
                    ),
                  })),
              }),
            ),
          ),
        ),
      ),

      clearArchiveFeedback(): void {
        patchState(store, { lastArchivedEspaceId: null, archiveError: null });
      },

      clearSubmitFeedback(): void {
        patchState(store, { lastSubmittedEspaceId: null, submitError: null });
      },
    }),
  ),
);

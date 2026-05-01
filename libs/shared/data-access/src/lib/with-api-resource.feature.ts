import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { computed, inject } from '@angular/core';
import { tapResponse } from '@ngrx/operators';
import {
  patchState,
  signalStoreFeature,
  type WritableStateSource,
  withComputed,
  withMethods,
  withState,
} from '@ngrx/signals';
import {
  addEntity,
  removeEntity,
  setAllEntities,
  updateEntity,
  withEntities,
} from '@ngrx/signals/entities';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { ApiConfiguration } from '@ubax-workspace/shared-api-types';
import { map, pipe, switchMap, tap } from 'rxjs';
import {
  ApiFnParams,
  ApiFnResponse,
  ApiHttpFn,
  ApiResourceConfig,
  ApiResourceState,
  AnyApiFn,
} from './api-resource.types';

type EntityDictionary<TItem> = Record<string, TItem>;

type ApiFnLike = AnyApiFn<never, unknown>;

type ApiResourceFeatureSignals<TItem> = {
  entities(): TItem[];
  entityMap(): EntityDictionary<TItem>;
  loading(): boolean;
  saving(): boolean;
  error(): string | null;
  selectedId(): string | null;
};

type ApiResourceFeatureStore<TItem> = ApiResourceFeatureSignals<TItem> &
  WritableStateSource<object>;

type EntityWithOptionalId = {
  id?: string | number | null;
};

function defaultSelectId<TItem>(item: TItem): string {
  if (item && typeof item === 'object' && 'id' in item) {
    const id = (item as EntityWithOptionalId).id;
    if (typeof id === 'string' || typeof id === 'number') {
      return String(id);
    }
  }

  return '';
}

function createIdParams<TParams>(id: string): TParams {
  return { id } as TParams;
}

function defaultMapItem<TItem, TRaw>(raw: TRaw): TItem {
  return raw as unknown as TItem;
}

/**
 * Extrait un tableau depuis une réponse brute.
 * Gère Spring Boot pagination ({ content: T[] }), CustomResponse ({ data: T[] })
 * et les tableaux directs.
 */
function defaultMapList<T>(raw: unknown): T[] {
  if (Array.isArray(raw)) return raw as T[];
  if (raw && typeof raw === 'object') {
    const r = raw as Record<string, unknown>;
    if (Array.isArray(r['content'])) return r['content'] as T[];
    if (Array.isArray(r['data'])) return r['data'] as T[];
    if (r['data'] && typeof r['data'] === 'object') {
      const nested = (r['data'] as Record<string, unknown>)['content'];
      if (Array.isArray(nested)) return nested as T[];
    }
  }
  return [];
}

/**
 * withApiResource<TItem>(config)
 *
 * Feature NgRx Signals générique qui apporte :
 *   - withEntities<TItem>() — stockage normalisé par id
 *   - loading / saving / error / selectedId — état commun
 *   - load(params?)     — charge la liste via config.list
 *   - loadOne(id)       — charge un item via config.getById
 *   - create(params)    — crée un item via config.create
 *   - update(params)    — met à jour un item via config.update
 *   - remove(id)        — supprime un item via config.delete
 *   - select(id|null)   — sélectionne un item localement
 *   - clearError()      — vide l'erreur
 *
 * Usage dans un store métier :
 *
 *   export const BiensStore = signalStore(
 *     { providedIn: 'root' },
 *     withApiResource<PropertyResponse>({ list: list1, getById, create: create2, ... }),
 *     withComputed(({ entities }) => ({
 *       biensPublies: computed(() => entities().filter(b => b.status === 'PUBLISHED')),
 *     }))
 *   );
 *
 * Usage direct dans un composant (scope composant) :
 *
 *   const TenantStore = createApiStore<TenantResponse>({ list: list4, getById: getById2 });
 *
 *   @Component({ providers: [TenantStore] })
 *   class MyComponent { store = inject(TenantStore); }
 */
export function withApiResource<
  TItem,
  TListFn extends ApiFnLike | undefined = undefined,
  TGetByIdFn extends ApiFnLike | undefined = undefined,
  TCreateFn extends ApiFnLike | undefined = undefined,
  TUpdateFn extends ApiFnLike | undefined = undefined,
  TDeleteFn extends ApiFnLike | undefined = undefined,
>(
  config: ApiResourceConfig<
    TItem,
    TListFn,
    TGetByIdFn,
    TCreateFn,
    TUpdateFn,
    TDeleteFn
  >,
) {
  const selectId = config.idSelector ?? defaultSelectId<TItem>;
  const mapList =
    config.mapList ??
    ((raw: ApiFnResponse<NonNullable<TListFn>>) => defaultMapList<TItem>(raw));
  const mapGetById =
    config.mapGetById ??
    ((raw: ApiFnResponse<NonNullable<TGetByIdFn>>) =>
      defaultMapItem<TItem, ApiFnResponse<NonNullable<TGetByIdFn>>>(raw));
  const mapCreate =
    config.mapCreate ??
    ((raw: ApiFnResponse<NonNullable<TCreateFn>>) =>
      defaultMapItem<TItem, ApiFnResponse<NonNullable<TCreateFn>>>(raw));
  const mapUpdate =
    config.mapUpdate ??
    ((raw: ApiFnResponse<NonNullable<TUpdateFn>>) =>
      defaultMapItem<TItem, ApiFnResponse<NonNullable<TUpdateFn>>>(raw));
  // Options entity passées aux opérations (setAllEntities, addEntity…)
  const entityOpts = { selectId };
  const listRequest = config.list as
    | ApiHttpFn<
        ApiFnParams<NonNullable<TListFn>>,
        ApiFnResponse<NonNullable<TListFn>>
      >
    | undefined;
  const getByIdRequest = config.getById as
    | ApiHttpFn<
        ApiFnParams<NonNullable<TGetByIdFn>>,
        ApiFnResponse<NonNullable<TGetByIdFn>>
      >
    | undefined;
  const createRequest = config.create as
    | ApiHttpFn<
        ApiFnParams<NonNullable<TCreateFn>>,
        ApiFnResponse<NonNullable<TCreateFn>>
      >
    | undefined;
  const updateRequest = config.update as
    | ApiHttpFn<
        ApiFnParams<NonNullable<TUpdateFn>>,
        ApiFnResponse<NonNullable<TUpdateFn>>
      >
    | undefined;
  const deleteRequest = config.delete as
    | ApiHttpFn<
        ApiFnParams<NonNullable<TDeleteFn>>,
        ApiFnResponse<NonNullable<TDeleteFn>>
      >
    | undefined;
  const buildGetByIdParams =
    config.buildGetByIdParams ??
    ((id: string) => createIdParams<ApiFnParams<NonNullable<TGetByIdFn>>>(id));
  const buildDeleteParams =
    config.buildDeleteParams ??
    ((id: string) => createIdParams<ApiFnParams<NonNullable<TDeleteFn>>>(id));

  return signalStoreFeature(
    withEntities<TItem>(),
    withState<ApiResourceState>({
      loading: false,
      saving: false,
      error: null,
      selectedId: null,
    }),
    withComputed((store: ApiResourceFeatureSignals<TItem>) => ({
      selectedItem: computed(() => {
        const id = store.selectedId();
        return id ? (store.entityMap()[id] ?? null) : null;
      }),
      isEmpty: computed(() => store.entities().length === 0),
      count: computed(() => store.entities().length),
      isLoading: computed(() => store.loading()),
      isSaving: computed(() => store.saving()),
      hasError: computed(() => store.error() !== null),
    })),
    withMethods(
      (
        store: ApiResourceFeatureStore<TItem>,
        http = inject(HttpClient),
        apiConfig = inject(ApiConfiguration),
      ) => {
        const rootUrl = () => apiConfig.rootUrl;

        return {
          select(id: string | null): void {
            patchState(store, { selectedId: id });
          },

          clearError(): void {
            patchState(store, { error: null });
          },

          ...(listRequest && {
            load: rxMethod<ApiFnParams<NonNullable<TListFn>>>(
              pipe(
                tap(() => patchState(store, { loading: true, error: null })),
                switchMap((params: ApiFnParams<NonNullable<TListFn>>) =>
                  listRequest(http, rootUrl(), params).pipe(
                    map((r) =>
                      mapList(r.body as ApiFnResponse<NonNullable<TListFn>>),
                    ),
                    tapResponse({
                      next: (items: TItem[]) =>
                        patchState(store, setAllEntities(items, entityOpts), {
                          loading: false,
                        }),
                      error: (err: HttpErrorResponse) =>
                        patchState(store, {
                          loading: false,
                          error: err.message ?? 'Erreur de chargement',
                        }),
                    }),
                  ),
                ),
              ),
            ),
          }),

          ...(getByIdRequest && {
            loadOne: rxMethod<string>(
              pipe(
                tap(() => patchState(store, { loading: true, error: null })),
                switchMap((id: string) =>
                  getByIdRequest(http, rootUrl(), buildGetByIdParams(id)).pipe(
                    map((r) =>
                      mapGetById(
                        r.body as ApiFnResponse<NonNullable<TGetByIdFn>>,
                        id,
                      ),
                    ),
                    tapResponse({
                      next: (item: TItem) =>
                        patchState(store, addEntity(item, entityOpts), {
                          loading: false,
                          selectedId: selectId(item),
                        }),
                      error: (err: HttpErrorResponse) =>
                        patchState(store, {
                          loading: false,
                          error: err.message ?? 'Erreur de chargement',
                        }),
                    }),
                  ),
                ),
              ),
            ),
          }),

          ...(createRequest && {
            create: rxMethod<ApiFnParams<NonNullable<TCreateFn>>>(
              pipe(
                tap(() => patchState(store, { saving: true, error: null })),
                switchMap((params: ApiFnParams<NonNullable<TCreateFn>>) =>
                  createRequest(http, rootUrl(), params).pipe(
                    map((r) =>
                      mapCreate(
                        r.body as ApiFnResponse<NonNullable<TCreateFn>>,
                      ),
                    ),
                    tapResponse({
                      next: (item: TItem) =>
                        patchState(store, addEntity(item, entityOpts), {
                          saving: false,
                        }),
                      error: (err: HttpErrorResponse) =>
                        patchState(store, {
                          saving: false,
                          error: err.message ?? 'Erreur de création',
                        }),
                    }),
                  ),
                ),
              ),
            ),
          }),

          ...(updateRequest && {
            update: rxMethod<ApiFnParams<NonNullable<TUpdateFn>>>(
              pipe(
                tap(() => patchState(store, { saving: true, error: null })),
                switchMap((params: ApiFnParams<NonNullable<TUpdateFn>>) =>
                  updateRequest(http, rootUrl(), params).pipe(
                    map((r) =>
                      mapUpdate(
                        r.body as ApiFnResponse<NonNullable<TUpdateFn>>,
                      ),
                    ),
                    tapResponse({
                      next: (item: TItem) =>
                        patchState(
                          store,
                          updateEntity({
                            id: selectId(item),
                            changes: item as Partial<TItem>,
                          }),
                          { saving: false },
                        ),
                      error: (err: HttpErrorResponse) =>
                        patchState(store, {
                          saving: false,
                          error: err.message ?? 'Erreur de mise à jour',
                        }),
                    }),
                  ),
                ),
              ),
            ),
          }),

          ...(deleteRequest && {
            remove: rxMethod<string>(
              pipe(
                switchMap((id: string) =>
                  deleteRequest(http, rootUrl(), buildDeleteParams(id)).pipe(
                    tapResponse({
                      next: () => patchState(store, removeEntity(id)),
                      error: (err: HttpErrorResponse) =>
                        patchState(store, {
                          error: err.message ?? 'Erreur de suppression',
                        }),
                    }),
                  ),
                ),
              ),
            ),
          }),
        };
      },
    ),
  );
}

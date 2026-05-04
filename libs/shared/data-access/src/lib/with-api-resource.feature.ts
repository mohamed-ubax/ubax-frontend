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
import { exhaustMap, map, pipe, switchMap, tap } from 'rxjs';
import {
  API_ERROR_MESSAGES,
  ApiFnParams,
  ApiFnResponse,
  ApiHttpFn,
  ApiResourceConfig,
  ApiResourceState,
  AnyApiFn,
  PaginationMeta,
} from './api-resource.types';
import { NOTIFICATION_HANDLER } from './notification.token';

type EntityDictionary<TItem> = Record<string, TItem>;

type ApiFnLike = AnyApiFn<never, unknown>;

type ApiResourceFeatureSignals<TItem> = {
  entities(): TItem[];
  entityMap(): EntityDictionary<TItem>;
  loading(): boolean;
  saving(): boolean;
  error(): string | null;
  selectedId(): string | null;
  pagination(): PaginationMeta | null;
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

function defaultMapPagination(raw: unknown): PaginationMeta | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;

  // Spring Boot Page : { totalElements, totalPages, number, size }
  const src =
    typeof r['totalElements'] === 'number'
      ? r
      : r['data'] && typeof r['data'] === 'object'
        ? (r['data'] as Record<string, unknown>)
        : null;

  if (!src || typeof src['totalElements'] !== 'number') return null;

  return {
    totalElements: src['totalElements'] as number,
    totalPages: (src['totalPages'] as number) ?? 1,
    currentPage: (src['number'] as number) ?? 0,
    pageSize: (src['size'] as number) ?? 20,
  };
}

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
  const mapPagination =
    config.mapPagination ??
    ((raw: ApiFnResponse<NonNullable<TListFn>>) =>
      defaultMapPagination(raw));
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
      pagination: null,
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
      hasPagination: computed(() => store.pagination() !== null),
    })),
    withMethods(
      (
        store: ApiResourceFeatureStore<TItem>,
        http = inject(HttpClient),
        apiConfig = inject(ApiConfiguration),
        notif = inject(NOTIFICATION_HANDLER, { optional: true }),
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
                    map((r) => {
                      const body = r.body as ApiFnResponse<NonNullable<TListFn>>;
                      return {
                        items: mapList(body),
                        pagination: mapPagination(body),
                      };
                    }),
                    tapResponse({
                      next: ({ items, pagination }) =>
                        patchState(
                          store,
                          setAllEntities(items, entityOpts),
                          { loading: false, pagination },
                        ),
                      error: (err: HttpErrorResponse) => {
                        const msg = err.message ?? API_ERROR_MESSAGES.load;
                        notif?.error(msg);
                        patchState(store, { loading: false, error: msg });
                      },
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
                      error: (err: HttpErrorResponse) => {
                        const msg = err.message ?? API_ERROR_MESSAGES.load;
                        notif?.error(msg);
                        patchState(store, { loading: false, error: msg });
                      },
                    }),
                  ),
                ),
              ),
            ),
          }),

          // exhaustMap : ignore les soumissions supplémentaires tant qu'une création est en cours
          ...(createRequest && {
            create: rxMethod<ApiFnParams<NonNullable<TCreateFn>>>(
              pipe(
                tap(() => patchState(store, { saving: true, error: null })),
                exhaustMap((params: ApiFnParams<NonNullable<TCreateFn>>) =>
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
                      error: (err: HttpErrorResponse) => {
                        const msg = err.message ?? API_ERROR_MESSAGES.create;
                        notif?.error(msg);
                        patchState(store, { saving: false, error: msg });
                      },
                    }),
                  ),
                ),
              ),
            ),
          }),

          // exhaustMap : ignore les sauvegardes supplémentaires tant qu'une mise à jour est en cours
          ...(updateRequest && {
            update: rxMethod<ApiFnParams<NonNullable<TUpdateFn>>>(
              pipe(
                tap(() => patchState(store, { saving: true, error: null })),
                exhaustMap((params: ApiFnParams<NonNullable<TUpdateFn>>) =>
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
                      error: (err: HttpErrorResponse) => {
                        const msg = err.message ?? API_ERROR_MESSAGES.update;
                        notif?.error(msg);
                        patchState(store, { saving: false, error: msg });
                      },
                    }),
                  ),
                ),
              ),
            ),
          }),

          ...(deleteRequest && {
            remove: rxMethod<string>(
              pipe(
                exhaustMap((id: string) =>
                  deleteRequest(http, rootUrl(), buildDeleteParams(id)).pipe(
                    tapResponse({
                      next: () => patchState(store, removeEntity(id)),
                      error: (err: HttpErrorResponse) => {
                        const msg = err.message ?? API_ERROR_MESSAGES.remove;
                        notif?.error(msg);
                        patchState(store, { error: msg });
                      },
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

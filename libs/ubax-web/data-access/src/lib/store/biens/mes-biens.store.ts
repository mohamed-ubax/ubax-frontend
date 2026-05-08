import { inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { tapResponse } from '@ngrx/operators';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { setAllEntities } from '@ngrx/signals/entities';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { withApiResource } from '@ubax-workspace/shared-data-access';
import {
  archive,
  ApiConfiguration,
  getById,
  findAllByType,
  LaCodeListDto,
  listMine,
  ListMine$Params,
  Pageable,
  PropertyResponse,
} from '@ubax-workspace/shared-api-types';
import { exhaustMap, forkJoin, map, pipe, switchMap, tap } from 'rxjs';

type PropertyMineStatus = NonNullable<ListMine$Params['status']>;

type BiensOverview = {
  total: number;
  active: number;
  rented: number;
  sold: number;
};

type MesBiensState = {
  codeListPropertyTypes: LaCodeListDto[];
  codeListTransactionTypes: LaCodeListDto[];
  codeListPropertyStatuses: LaCodeListDto[];
  codeListsLoading: boolean;
  codeListsError: string | null;
  overview: BiensOverview;
  overviewLoading: boolean;
  overviewError: string | null;
  archivingPropertyIds: string[];
  lastArchivedPropertyId: string | null;
  archiveError: string | null;
};

const initialState: MesBiensState = {
  codeListPropertyTypes: [],
  codeListTransactionTypes: [],
  codeListPropertyStatuses: [],
  codeListsLoading: false,
  codeListsError: null,
  overview: {
    total: 0,
    active: 0,
    rented: 0,
    sold: 0,
  },
  overviewLoading: false,
  overviewError: null,
  archivingPropertyIds: [],
  lastArchivedPropertyId: null,
  archiveError: null,
};

function extractList<T>(body: unknown): T[] {
  if (Array.isArray(body)) return body as T[];

  if (!body || typeof body !== 'object') {
    return [];
  }

  const record = body as Record<string, unknown>;
  const directKeys = [
    'content',
    'items',
    'rows',
    'list',
    'results',
    'properties',
  ];

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

  const looksLikeSingleProperty =
    typeof record['id'] === 'string' ||
    typeof record['title'] === 'string' ||
    typeof record['propertyType'] === 'string';

  return looksLikeSingleProperty ? ([record] as T[]) : [];
}

function extractTotalElements(body: unknown): number {
  if (!body || typeof body !== 'object') {
    return 0;
  }

  const record = body as Record<string, unknown>;
  if (typeof record['totalElements'] === 'number') {
    return record['totalElements'];
  }

  const data = record['data'];
  if (data && typeof data === 'object') {
    const nested = data as Record<string, unknown>;
    if (typeof nested['totalElements'] === 'number') {
      return nested['totalElements'];
    }
    if (typeof nested['total'] === 'number') {
      return nested['total'];
    }
    if (typeof nested['count'] === 'number') {
      return nested['count'];
    }
  }

  const inferredItems = extractList<unknown>(body);
  if (inferredItems.length > 0) {
    return inferredItems.length;
  }

  return 0;
}

function extractFirstItem<T>(body: unknown): T | null {
  if (!body || typeof body !== 'object') {
    return null;
  }

  const record = body as Record<string, unknown>;
  if (record['data'] && typeof record['data'] === 'object') {
    return record['data'] as T;
  }

  return record as T;
}

function normalizeProperty(
  property: PropertyResponse,
  index: number,
): PropertyResponse {
  if (property.id) {
    return property;
  }

  return {
    ...property,
    id: `property-${index + 1}`,
  };
}

function selectPropertyId(property: PropertyResponse): string {
  return (
    property.id ??
    `${property.title ?? 'property'}-${property.createdAt ?? 'unknown'}`
  );
}

function withoutArchivingId(state: MesBiensState, id: string): string[] {
  return state.archivingPropertyIds.filter((itemId) => itemId !== id);
}

function markArchived(entity: PropertyResponse): PropertyResponse {
  return {
    ...entity,
    status: 'ARCHIVED' as PropertyResponse['status'],
  };
}

function nextEntitiesAfterArchive(
  entities: readonly PropertyResponse[],
  id: string,
  preserveInList?: boolean,
): PropertyResponse[] {
  if (preserveInList) {
    return entities.map((entity) =>
      selectPropertyId(entity) === id ? markArchived(entity) : entity,
    );
  }

  return entities.filter((entity) => selectPropertyId(entity) !== id);
}

function pageRequest(page: number, size: number): Pageable {
  return {
    page,
    size,
    sort: ['createdAt,desc'],
  };
}

function countByStatus(
  http: HttpClient,
  rootUrl: string,
  status?: PropertyMineStatus,
) {
  return listMine(http, rootUrl, {
    status,
    pageable: pageRequest(0, 1),
  }).pipe(map((response) => extractTotalElements(response.body)));
}

export const MesBiensStore = signalStore(
  { providedIn: 'root' },
  withApiResource<
    PropertyResponse,
    typeof listMine,
    typeof getById,
    undefined,
    undefined,
    typeof archive
  >({
    list: listMine,
    getById: getById,
    delete: archive,
    idSelector: selectPropertyId,
    mapList: (raw: unknown) =>
      extractList<PropertyResponse>(raw).map((property, index) =>
        normalizeProperty(property, index),
      ),
    mapGetById: (raw: unknown) => {
      const property = extractFirstItem<PropertyResponse>(raw);
      return normalizeProperty(property ?? ({} as PropertyResponse), 0);
    },
  }),
  withState(initialState),
  withMethods(
    (
      store,
      http = inject(HttpClient),
      apiConfig = inject(ApiConfiguration),
    ) => ({
      loadCodeLists: rxMethod<void>(
        pipe(
          tap(() =>
            patchState(store, {
              codeListsLoading: true,
              codeListsError: null,
            }),
          ),
          exhaustMap(() =>
            forkJoin({
              propertyTypes: findAllByType(http, apiConfig.rootUrl, {
                type: 'PROPERTY_TYPE',
              }).pipe(
                map((response) => extractList<LaCodeListDto>(response.body)),
              ),
              transactionTypes: findAllByType(http, apiConfig.rootUrl, {
                type: 'TRANSACTION_TYPE',
              }).pipe(
                map((response) => extractList<LaCodeListDto>(response.body)),
              ),
              propertyStatuses: findAllByType(http, apiConfig.rootUrl, {
                type: 'PROPERTY_STATUS',
              }).pipe(
                map((response) => extractList<LaCodeListDto>(response.body)),
              ),
            }).pipe(
              tapResponse({
                next: ({ propertyTypes, transactionTypes, propertyStatuses }) =>
                  patchState(store, {
                    codeListPropertyTypes: propertyTypes,
                    codeListTransactionTypes: transactionTypes,
                    codeListPropertyStatuses: propertyStatuses,
                    codeListsLoading: false,
                    codeListsError: null,
                  }),
                error: (err: HttpErrorResponse) =>
                  patchState(store, {
                    codeListsLoading: false,
                    codeListsError: err.message,
                  }),
              }),
            ),
          ),
        ),
      ),

      loadOverview: rxMethod<void>(
        pipe(
          tap(() =>
            patchState(store, {
              overviewLoading: true,
              overviewError: null,
            }),
          ),
          switchMap(() =>
            forkJoin({
              total: countByStatus(http, apiConfig.rootUrl),
              active: countByStatus(http, apiConfig.rootUrl, 'PUBLISHED'),
              rented: countByStatus(http, apiConfig.rootUrl, 'RESERVED'),
              sold: countByStatus(http, apiConfig.rootUrl, 'SOLD'),
            }).pipe(
              tapResponse({
                next: (overview) =>
                  patchState(store, {
                    overview,
                    overviewLoading: false,
                    overviewError: null,
                  }),
                error: (err: HttpErrorResponse) =>
                  patchState(store, {
                    overviewLoading: false,
                    overviewError: err.message,
                  }),
              }),
            ),
          ),
        ),
      ),

      archiveProperty: rxMethod<{
        id: string;
        preserveInList?: boolean;
      }>(
        pipe(
          tap(({ id }) =>
            patchState(store, (state) => ({
              archivingPropertyIds: state.archivingPropertyIds.includes(id)
                ? state.archivingPropertyIds
                : [...state.archivingPropertyIds, id],
              archiveError: null,
              lastArchivedPropertyId: null,
            })),
          ),
          exhaustMap(({ id, preserveInList }) =>
            archive(http, apiConfig.rootUrl, { id }).pipe(
              tapResponse({
                next: () => {
                  const nextEntities = nextEntitiesAfterArchive(
                    store.entities(),
                    id,
                    preserveInList,
                  );

                  patchState(
                    store,
                    setAllEntities(nextEntities, {
                      selectId: selectPropertyId,
                    }),
                    (state) => ({
                      archivingPropertyIds: withoutArchivingId(state, id),
                      lastArchivedPropertyId: id,
                      archiveError: null,
                    }),
                  );
                },
                error: (err: HttpErrorResponse) =>
                  patchState(store, (state) => ({
                    archivingPropertyIds: withoutArchivingId(state, id),
                    archiveError: err.message,
                  })),
              }),
            ),
          ),
        ),
      ),

      clearArchiveFeedback(): void {
        patchState(store, {
          lastArchivedPropertyId: null,
          archiveError: null,
        });
      },
    }),
  ),
);

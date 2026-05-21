import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { tapResponse } from '@ngrx/operators';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { setAllEntities } from '@ngrx/signals/entities';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import {
  resolveHttpErrorMessage,
  withApiResource,
} from '@ubax-workspace/shared-data-access';
import {
  ApiConfiguration,
  BailleurDecisionRequest,
  BailleurApplicationResponse,
  getById9,
  listByAgency,
  processDecision,
} from '@ubax-workspace/shared-api-types';
import { exhaustMap, pipe, tap } from 'rxjs';

export type BailleurApplicationStatus = NonNullable<
  BailleurApplicationResponse['status']
>;

export type BailleurApplication = BailleurApplicationResponse & {
  id: string;
};

type BailleurApplicationsState = {
  decidingId: string | null;
  decisionError: string | null;
  lastDecidedId: string | null;
};

const initialState: BailleurApplicationsState = {
  decidingId: null,
  decisionError: null,
  lastDecidedId: null,
};

function extractCollection(raw: unknown): BailleurApplication[] {
  if (Array.isArray(raw)) {
    return raw.map((item) => extractItem(item));
  }

  if (!raw || typeof raw !== 'object') {
    return [];
  }

  const record = raw as Record<string, unknown>;
  const direct = record['results'] ?? record['content'];

  if (Array.isArray(direct)) {
    return direct.map((item) => extractItem(item));
  }

  const nested = record['data'];
  if (nested && typeof nested === 'object') {
    return extractCollection(nested);
  }

  return [];
}

function extractItem(raw: unknown, fallbackId = ''): BailleurApplication {
  if (!raw || typeof raw !== 'object') {
    return { id: fallbackId };
  }

  const record = raw as Record<string, unknown>;
  const source =
    record['data'] && typeof record['data'] === 'object'
      ? (record['data'] as Record<string, unknown>)
      : record;

  const item = source as BailleurApplicationResponse;
  return {
    ...item,
    id: item.id ?? fallbackId,
  };
}

function replaceApplication(
  entities: readonly BailleurApplication[],
  application: BailleurApplication,
): BailleurApplication[] {
  const exists = entities.some((entity) => entity.id === application.id);

  if (!exists) {
    return [application, ...entities];
  }

  return entities.map((entity) =>
    entity.id === application.id ? { ...entity, ...application } : entity,
  );
}

export const BailleurApplicationsStore = signalStore(
  withApiResource<BailleurApplication, typeof listByAgency, typeof getById9>({
    list: listByAgency,
    getById: getById9,
    buildGetByIdParams: (id) => ({ id }),
    idSelector: (application) => application.id,
    mapList: extractCollection,
    mapGetById: extractItem,
  }),
  withState(initialState),
  withMethods(
    (
      store,
      http = inject(HttpClient),
      apiConfig = inject(ApiConfiguration),
    ) => ({
      decide: rxMethod<{
        id: string;
        body: BailleurDecisionRequest;
      }>(
        pipe(
          tap(({ id }) =>
            patchState(store, {
              saving: true,
              decidingId: id,
              decisionError: null,
              lastDecidedId: null,
            }),
          ),
          exhaustMap(({ id, body }) =>
            processDecision(http, apiConfig.rootUrl, { id, body }).pipe(
              tapResponse({
                next: (response) => {
                  const updated = extractItem(response.body, id);
                  const entities = replaceApplication(
                    store.entities(),
                    updated,
                  );

                  patchState(
                    store,
                    setAllEntities(entities, {
                      selectId: (application: BailleurApplication) =>
                        application.id,
                    }),
                    {
                      saving: false,
                      selectedId: updated.id,
                      decidingId: null,
                      decisionError: null,
                      lastDecidedId: updated.id,
                    },
                  );
                },
                error: (error: HttpErrorResponse) =>
                  patchState(store, {
                    saving: false,
                    decidingId: null,
                    decisionError: resolveHttpErrorMessage(
                      error,
                      'Impossible de traiter la décision sur cette demande.',
                    ),
                  }),
              }),
            ),
          ),
        ),
      ),

      clearDecisionFeedback(): void {
        patchState(store, {
          decisionError: null,
          lastDecidedId: null,
        });
      },
    }),
  ),
);

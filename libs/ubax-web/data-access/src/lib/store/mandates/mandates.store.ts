import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { tapResponse } from '@ngrx/operators';
import {
  patchState,
  signalStore,
  withComputed,
  withMethods,
  withState,
} from '@ngrx/signals';
import { addEntity, setEntity } from '@ngrx/signals/entities';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import {
  resolveHttpErrorMessage,
  withApiResource,
} from '@ubax-workspace/shared-data-access';
import {
  activate,
  ApiConfiguration,
  cancel,
  create6,
  CreateMandateRequest,
  getById7,
  list4,
  submit1,
  terminate,
  TerminateMandateRequest,
} from '@ubax-workspace/shared-api-types';
import { computed } from '@angular/core';
import { exhaustMap, pipe, tap } from 'rxjs';

export type MandateStatus =
  | 'DRAFT'
  | 'PENDING_SIGNATURE'
  | 'ACTIVE'
  | 'TERMINATED'
  | 'CANCELLED';

export interface Mandate {
  id: string;
  referenceNumber?: string;
  status?: MandateStatus;
  agencyId?: string;
  agencyName?: string;
  ownerId?: string;
  ownerFullName?: string;
  ownerPhone?: string;
  startDate?: string;
  endDate?: string | null;
  commissionRate?: number;
  specialClauses?: string;
  terminationConditions?: string;
  terminatedAt?: string | null;
  terminationReason?: string | null;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

type MandatesState = {
  creating: boolean;
  createError: string | null;
  lastCreatedId: string | null;
  submittingId: string | null;
  submitError: string | null;
  lastSubmittedId: string | null;
  terminatingId: string | null;
  terminateError: string | null;
  lastTerminatedId: string | null;
  cancellingId: string | null;
  cancelError: string | null;
  lastCancelledId: string | null;
  activatingId: string | null;
  activateError: string | null;
  lastActivatedId: string | null;
};

const initialState: MandatesState = {
  creating: false,
  createError: null,
  lastCreatedId: null,
  submittingId: null,
  submitError: null,
  lastSubmittedId: null,
  terminatingId: null,
  terminateError: null,
  lastTerminatedId: null,
  cancellingId: null,
  cancelError: null,
  lastCancelledId: null,
  activatingId: null,
  activateError: null,
  lastActivatedId: null,
};

function extractMandateCollection(raw: unknown): Mandate[] {
  if (Array.isArray(raw)) {
    return raw.map((item) => extractMandateItem(item));
  }

  if (!raw || typeof raw !== 'object') {
    return [];
  }

  const record = raw as Record<string, unknown>;
  const direct = record['results'] ?? record['content'];

  if (Array.isArray(direct)) {
    return direct.map((item) => extractMandateItem(item));
  }

  const nested = record['data'];
  if (nested && typeof nested === 'object') {
    return extractMandateCollection(nested);
  }

  return [];
}

function extractMandateItem(raw: unknown, fallbackId = ''): Mandate {
  if (!raw || typeof raw !== 'object') {
    return { id: fallbackId };
  }

  const record = raw as Record<string, unknown>;
  const source =
    record['data'] && typeof record['data'] === 'object'
      ? (record['data'] as Record<string, unknown>)
      : record;

  const mandate = source as Mandate;

  return {
    ...mandate,
    id: mandate.id ?? fallbackId,
  };
}

function mergeMandate(
  current: Mandate | undefined,
  fallbackId: string,
  patch: Partial<Mandate>,
): Mandate {
  return {
    ...(current ?? { id: fallbackId }),
    ...patch,
    id: patch.id ?? current?.id ?? fallbackId,
  };
}

export const MandatesStore = signalStore(
  withApiResource<Mandate, typeof list4, typeof getById7>({
    list: list4,
    getById: getById7,
    buildGetByIdParams: (id) => ({ id }),
    idSelector: (mandate) => mandate.id,
    mapList: extractMandateCollection,
    mapGetById: extractMandateItem,
  }),
  withState(initialState),
  withComputed(({ entities }) => ({
    draftMandates: computed(() =>
      entities().filter((mandate) => mandate.status === 'DRAFT'),
    ),
    pendingMandates: computed(() =>
      entities().filter((mandate) => mandate.status === 'PENDING_SIGNATURE'),
    ),
    activeMandates: computed(() =>
      entities().filter((mandate) => mandate.status === 'ACTIVE'),
    ),
  })),
  withMethods(
    (
      store,
      http = inject(HttpClient),
      apiConfig = inject(ApiConfiguration),
    ) => ({
      createMandate: rxMethod<CreateMandateRequest>(
        pipe(
          tap(() =>
            patchState(store, {
              creating: true,
              saving: true,
              createError: null,
              lastCreatedId: null,
            }),
          ),
          exhaustMap((body) =>
            create6(http, apiConfig.rootUrl, { body }).pipe(
              tapResponse({
                next: (response) => {
                  const mandate = extractMandateItem(response.body);

                  patchState(
                    store,
                    addEntity(mandate, {
                      selectId: (item: Mandate) => item.id,
                    }),
                    {
                      creating: false,
                      saving: false,
                      selectedId: mandate.id,
                      createError: null,
                      lastCreatedId: mandate.id,
                    },
                  );
                },
                error: (error: HttpErrorResponse) =>
                  patchState(store, {
                    creating: false,
                    saving: false,
                    createError:
                      error.status === 409
                        ? 'Un mandat actif ou en attente de signature existe déjà pour ce bailleur.'
                        : resolveHttpErrorMessage(
                            error,
                            'Impossible de créer le mandat.',
                          ),
                  }),
              }),
            ),
          ),
        ),
      ),

      submitMandate: rxMethod<string>(
        pipe(
          tap((id) =>
            patchState(store, {
              submittingId: id,
              saving: true,
              submitError: null,
              lastSubmittedId: null,
            }),
          ),
          exhaustMap((id) =>
            submit1(http, apiConfig.rootUrl, { id }).pipe(
              tapResponse({
                next: (response) => {
                  const updated = mergeMandate(store.entityMap()[id], id, {
                    ...extractMandateItem(response.body, id),
                    status: 'PENDING_SIGNATURE',
                  });

                  patchState(
                    store,
                    setEntity(updated, {
                      selectId: (item: Mandate) => item.id,
                    }),
                    {
                      saving: false,
                      submittingId: null,
                      submitError: null,
                      lastSubmittedId: id,
                      selectedId: id,
                    },
                  );
                },
                error: (error: HttpErrorResponse) =>
                  patchState(store, {
                    saving: false,
                    submittingId: null,
                    submitError: resolveHttpErrorMessage(
                      error,
                      'Impossible de soumettre le mandat.',
                    ),
                  }),
              }),
            ),
          ),
        ),
      ),

      terminateMandate: rxMethod<{ id: string; body: TerminateMandateRequest }>(
        pipe(
          tap(({ id }) =>
            patchState(store, {
              terminatingId: id,
              saving: true,
              terminateError: null,
              lastTerminatedId: null,
            }),
          ),
          exhaustMap(({ id, body }) =>
            terminate(http, apiConfig.rootUrl, { id, body }).pipe(
              tapResponse({
                next: (response) => {
                  const updated = mergeMandate(store.entityMap()[id], id, {
                    ...extractMandateItem(response.body, id),
                    status: 'TERMINATED',
                    terminationReason: body.terminationReason,
                  });

                  patchState(
                    store,
                    setEntity(updated, {
                      selectId: (item: Mandate) => item.id,
                    }),
                    {
                      saving: false,
                      terminatingId: null,
                      terminateError: null,
                      lastTerminatedId: id,
                      selectedId: id,
                    },
                  );
                },
                error: (error: HttpErrorResponse) =>
                  patchState(store, {
                    saving: false,
                    terminatingId: null,
                    terminateError: resolveHttpErrorMessage(
                      error,
                      'Impossible de résilier le mandat.',
                    ),
                  }),
              }),
            ),
          ),
        ),
      ),

      cancelMandate: rxMethod<string>(
        pipe(
          tap((id) =>
            patchState(store, {
              cancellingId: id,
              saving: true,
              cancelError: null,
              lastCancelledId: null,
            }),
          ),
          exhaustMap((id) =>
            cancel(http, apiConfig.rootUrl, { id }).pipe(
              tapResponse({
                next: (response) => {
                  const updated = mergeMandate(store.entityMap()[id], id, {
                    ...extractMandateItem(response.body, id),
                    status: 'CANCELLED',
                  });

                  patchState(
                    store,
                    setEntity(updated, {
                      selectId: (item: Mandate) => item.id,
                    }),
                    {
                      saving: false,
                      cancellingId: null,
                      cancelError: null,
                      lastCancelledId: id,
                      selectedId: id,
                    },
                  );
                },
                error: (error: HttpErrorResponse) =>
                  patchState(store, {
                    saving: false,
                    cancellingId: null,
                    cancelError: resolveHttpErrorMessage(
                      error,
                      "Impossible d'annuler le mandat.",
                    ),
                  }),
              }),
            ),
          ),
        ),
      ),

      activateMandate: rxMethod<string>(
        pipe(
          tap((id) =>
            patchState(store, {
              activatingId: id,
              saving: true,
              activateError: null,
              lastActivatedId: null,
            }),
          ),
          exhaustMap((id) =>
            activate(http, apiConfig.rootUrl, { id }).pipe(
              tapResponse({
                next: (response) => {
                  const updated = mergeMandate(store.entityMap()[id], id, {
                    ...extractMandateItem(response.body, id),
                    status: 'ACTIVE',
                  });

                  patchState(
                    store,
                    setEntity(updated, {
                      selectId: (item: Mandate) => item.id,
                    }),
                    {
                      saving: false,
                      activatingId: null,
                      activateError: null,
                      lastActivatedId: id,
                      selectedId: id,
                    },
                  );
                },
                error: (error: HttpErrorResponse) =>
                  patchState(store, {
                    saving: false,
                    activatingId: null,
                    activateError: resolveHttpErrorMessage(
                      error,
                      "Impossible d'activer le mandat.",
                    ),
                  }),
              }),
            ),
          ),
        ),
      ),

      clearActionFeedback(): void {
        patchState(store, {
          createError: null,
          lastCreatedId: null,
          submitError: null,
          lastSubmittedId: null,
          terminateError: null,
          lastTerminatedId: null,
          cancelError: null,
          lastCancelledId: null,
          activateError: null,
          lastActivatedId: null,
        });
      },
    }),
  ),
);

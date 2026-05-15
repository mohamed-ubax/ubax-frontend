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
import { setAllEntities } from '@ngrx/signals/entities';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { withApiResource, resolveHttpErrorMessage } from '@ubax-workspace/shared-data-access';
import {
  ApiConfiguration,
  cancel,
  create7,
  getById2,
  list5,
  submit1,
  terminate,
  update2,
  TerminateContractRequest,
} from '@ubax-workspace/shared-api-types';
import { exhaustMap, pipe, tap } from 'rxjs';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ContractStatus =
  | 'DRAFT'
  | 'PENDING_SIGNATURE'
  | 'ACTIVE'
  | 'TERMINATED'
  | 'EXPIRED'
  | 'CANCELLED';

export interface ContractResponse {
  id: string;
  propertyId?: string;
  tenantId?: string;
  ownerId?: string;
  agencyId?: string;
  status?: ContractStatus;
  contractType?: 'LEASE' | 'SALE' | 'RESERVATION' | 'MANDATE';
  startDate?: string;
  endDate?: string | null;
  monthlyRent?: number;
  depositAmount?: number;
  signedFileUrl?: string | null;
  createdAt?: string;
  updatedAt?: string;
  // Enriched fields (may come from backend joins)
  tenantName?: string;
  tenantEmail?: string;
  tenantPhone?: string;
  propertyAddress?: string;
  propertyType?: string;
  agencyName?: string;
  ownerName?: string;
  [key: string]: unknown;
}

type ContratsState = {
  filterStatus: ContractStatus | null;
  submittingId: string | null;
  submitError: string | null;
  lastSubmittedId: string | null;
  terminatingId: string | null;
  terminateError: string | null;
  lastTerminatedId: string | null;
  cancellingId: string | null;
  cancelError: string | null;
  lastCancelledId: string | null;
};

const initialState: ContratsState = {
  filterStatus: null,
  submittingId: null,
  submitError: null,
  lastSubmittedId: null,
  terminatingId: null,
  terminateError: null,
  lastTerminatedId: null,
  cancellingId: null,
  cancelError: null,
  lastCancelledId: null,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function extractContractList(raw: unknown): ContractResponse[] {
  if (Array.isArray(raw)) return raw as ContractResponse[];
  if (!raw || typeof raw !== 'object') return [];

  const record = raw as Record<string, unknown>;
  if (Array.isArray(record['content'])) return record['content'] as ContractResponse[];

  const data = record['data'];
  if (data && typeof data === 'object') {
    const nested = (data as Record<string, unknown>)['content'];
    if (Array.isArray(nested)) return nested as ContractResponse[];
    if (Array.isArray(data)) return data as ContractResponse[];
  }

  return [];
}

function extractContractItem(raw: unknown, fallbackId?: string): ContractResponse {
  if (!raw || typeof raw !== 'object') return { id: fallbackId ?? '' };

  const record = raw as Record<string, unknown>;
  const data = record['data'];

  if (data && typeof data === 'object' && !Array.isArray(data)) {
    const item = data as ContractResponse;
    return { ...item, id: item.id ?? fallbackId ?? '' };
  }

  const item = record as ContractResponse;
  return { ...item, id: item.id ?? fallbackId ?? '' };
}

function updateContractStatusInList(
  entities: readonly ContractResponse[],
  id: string,
  status: ContractStatus,
  extra?: Partial<ContractResponse>,
): ContractResponse[] {
  return entities.map((c) =>
    c.id === id ? { ...c, status, ...extra } : c,
  );
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const ContratsStore = signalStore(
  { providedIn: 'root' },
  withApiResource<ContractResponse, typeof list5, typeof getById2, typeof create7, typeof update2>({
    list: list5,
    getById: getById2,
    create: create7,
    update: update2,
    buildGetByIdParams: (id) => ({ id }),
    idSelector: (c) => c.id,
    mapList: extractContractList,
    mapGetById: extractContractItem,
    mapCreate: extractContractItem,
    mapUpdate: extractContractItem,
  }),
  withState(initialState),
  withComputed(({ entities, filterStatus }) => ({
    contratsFiltres: computed(() => {
      const s = filterStatus();
      return s ? entities().filter((c) => c.status === s) : entities();
    }),
    contratsActifs: computed(() =>
      entities().filter((c) => c.status === 'ACTIVE'),
    ),
    contratsBrouillons: computed(() =>
      entities().filter((c) => c.status === 'DRAFT'),
    ),
    contratsEnAttente: computed(() =>
      entities().filter((c) => c.status === 'PENDING_SIGNATURE'),
    ),
    contratsTermines: computed(() =>
      entities().filter((c) =>
        c.status === 'TERMINATED' || c.status === 'CANCELLED',
      ),
    ),
  })),
  withMethods(
    (store, http = inject(HttpClient), apiConfig = inject(ApiConfiguration)) => ({
      setFilterStatus(status: ContractStatus | null): void {
        patchState(store, { filterStatus: status });
      },

      soumettre: rxMethod<string>(
        pipe(
          tap((id) =>
            patchState(store, {
              submittingId: id,
              submitError: null,
              lastSubmittedId: null,
            }),
          ),
          exhaustMap((id) =>
            submit1(http, apiConfig.rootUrl, { id }).pipe(
              tapResponse({
                next: (response) => {
                  const updated = extractContractItem(response.body, id);
                  const nextEntities = updateContractStatusInList(
                    store.entities(),
                    id,
                    'PENDING_SIGNATURE',
                    { signedFileUrl: updated.signedFileUrl },
                  );
                  patchState(
                    store,
                    setAllEntities(nextEntities, { selectId: (c: ContractResponse) => c.id }),
                    {
                      submittingId: null,
                      lastSubmittedId: id,
                      submitError: null,
                    },
                  );
                },
                error: (err: HttpErrorResponse) =>
                  patchState(store, {
                    submittingId: null,
                    submitError: resolveHttpErrorMessage(err, 'Erreur lors de la soumission du contrat'),
                  }),
              }),
            ),
          ),
        ),
      ),

      resilier: rxMethod<{ id: string; reason: string }>(
        pipe(
          tap(({ id }) =>
            patchState(store, {
              terminatingId: id,
              terminateError: null,
              lastTerminatedId: null,
            }),
          ),
          exhaustMap(({ id, reason }) =>
            terminate(http, apiConfig.rootUrl, {
              id,
              body: { terminationReason: reason } as TerminateContractRequest,
            }).pipe(
              tapResponse({
                next: () => {
                  const nextEntities = updateContractStatusInList(
                    store.entities(),
                    id,
                    'TERMINATED',
                  );
                  patchState(
                    store,
                    setAllEntities(nextEntities, { selectId: (c: ContractResponse) => c.id }),
                    {
                      terminatingId: null,
                      lastTerminatedId: id,
                      terminateError: null,
                    },
                  );
                },
                error: (err: HttpErrorResponse) =>
                  patchState(store, {
                    terminatingId: null,
                    terminateError: resolveHttpErrorMessage(err, 'Erreur lors de la résiliation du contrat'),
                  }),
              }),
            ),
          ),
        ),
      ),

      annuler: rxMethod<string>(
        pipe(
          tap((id) =>
            patchState(store, {
              cancellingId: id,
              cancelError: null,
              lastCancelledId: null,
            }),
          ),
          exhaustMap((id) =>
            cancel(http, apiConfig.rootUrl, { id }).pipe(
              tapResponse({
                next: () => {
                  const nextEntities = updateContractStatusInList(
                    store.entities(),
                    id,
                    'CANCELLED',
                  );
                  patchState(
                    store,
                    setAllEntities(nextEntities, { selectId: (c: ContractResponse) => c.id }),
                    {
                      cancellingId: null,
                      lastCancelledId: id,
                      cancelError: null,
                    },
                  );
                },
                error: (err: HttpErrorResponse) =>
                  patchState(store, {
                    cancellingId: null,
                    cancelError: resolveHttpErrorMessage(err, 'Erreur lors de l\'annulation du contrat'),
                  }),
              }),
            ),
          ),
        ),
      ),

      clearActionFeedback(): void {
        patchState(store, {
          lastSubmittedId: null,
          submitError: null,
          lastTerminatedId: null,
          terminateError: null,
          lastCancelledId: null,
          cancelError: null,
        });
      },
    }),
  ),
);

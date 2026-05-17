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
import {
  withApiResource,
  resolveHttpErrorMessage,
} from '@ubax-workspace/shared-data-access';
import {
  activate,
  ApiConfiguration,
  cancel,
  create7,
  getById2,
  getStats,
  list5,
  submit1,
  terminate,
  update2,
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
  referenceNumber?: string;
  propertyId?: string;
  propertyTitle?: string;
  propertyCity?: string;
  ownerId?: string;
  ownerFullName?: string;
  tenantId?: string;
  tenantFullName?: string;
  agencyId?: string;
  agencyName?: string;
  createdById?: string;
  createdByFullName?: string;
  status?: ContractStatus;
  contractType?: 'LEASE' | 'SALE' | 'RESERVATION' | 'MANDATE';
  startDate?: string;
  endDate?: string | null;
  monthlyRent?: number;
  monthlyCharges?: number;
  totalMonthlyAmount?: number;
  depositAmount?: number;
  depositReturned?: boolean;
  agencyCommissionRate?: number;
  paymentDay?: number;
  specialClauses?: string;
  terminationConditions?: string;
  fileUrl?: string | null;
  signedFileUrl?: string | null;
  createdAt?: string;
  updatedAt?: string;
  // Enriched fields (may come from backend joins)
  tenantName?: string;
  tenantEmail?: string;
  tenantPhone?: string;
  propertyAddress?: string;
  propertyType?: string;
  ownerName?: string;
  [key: string]: unknown;
}

export type ContractStats = {
  total: number;
  active: number;
  pendingSignature: number;
  terminated: number;
  cancelled: number;
  draft: number;
};

type ContratsState = {
  filterStatus: ContractStatus | null;
  stats: ContractStats;
  statsLoading: boolean;
  statsLoaded: boolean;
  statsError: string | null;
  submittingId: string | null;
  submitError: string | null;
  lastSubmittedId: string | null;
  activatingId: string | null;
  activateError: string | null;
  lastActivatedId: string | null;
  terminatingId: string | null;
  terminateError: string | null;
  lastTerminatedId: string | null;
  cancellingId: string | null;
  cancelError: string | null;
  lastCancelledId: string | null;
};

const EMPTY_CONTRACT_STATS: ContractStats = {
  total: 0,
  active: 0,
  pendingSignature: 0,
  terminated: 0,
  cancelled: 0,
  draft: 0,
};

const initialState: ContratsState = {
  filterStatus: null,
  stats: EMPTY_CONTRACT_STATS,
  statsLoading: false,
  statsLoaded: false,
  statsError: null,
  submittingId: null,
  submitError: null,
  lastSubmittedId: null,
  activatingId: null,
  activateError: null,
  lastActivatedId: null,
  terminatingId: null,
  terminateError: null,
  lastTerminatedId: null,
  cancellingId: null,
  cancelError: null,
  lastCancelledId: null,
};

function readNonEmptyString(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;

  const normalized = value.trim();
  if (!normalized) return undefined;

  return normalized;
}

function normalizeContract(contract: ContractResponse): ContractResponse {
  const fallbackPropertyAddress = [
    readNonEmptyString(contract.propertyTitle),
    readNonEmptyString(contract.propertyCity),
  ]
    .filter((value): value is string => Boolean(value))
    .join(', ');
  const tenantName =
    readNonEmptyString(contract.tenantName) ??
    readNonEmptyString(contract.tenantFullName);
  const ownerName =
    readNonEmptyString(contract.ownerName) ??
    readNonEmptyString(contract.ownerFullName);
  const agencyName =
    readNonEmptyString(contract.agencyName) ??
    readNonEmptyString(contract.createdByFullName);
  const propertyAddress =
    readNonEmptyString(contract.propertyAddress) ??
    (fallbackPropertyAddress || undefined);
  const documentUrl =
    readNonEmptyString(contract.signedFileUrl) ??
    readNonEmptyString(contract.fileUrl);

  return {
    ...contract,
    tenantName,
    ownerName,
    agencyName,
    propertyAddress,
    fileUrl: documentUrl,
    signedFileUrl: documentUrl,
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function extractContractList(raw: unknown): ContractResponse[] {
  if (Array.isArray(raw)) return raw as ContractResponse[];
  if (!raw || typeof raw !== 'object') return [];

  const record = raw as Record<string, unknown>;
  const directItems = record['content'] ?? record['results'];
  if (Array.isArray(directItems)) {
    return directItems.map((item) =>
      normalizeContract(item as ContractResponse),
    );
  }

  const data = record['data'];
  if (data && typeof data === 'object') {
    const nestedRecord = data as Record<string, unknown>;
    const nestedItems = nestedRecord['content'] ?? nestedRecord['results'];
    if (Array.isArray(nestedItems)) {
      return nestedItems.map((item) =>
        normalizeContract(item as ContractResponse),
      );
    }
    if (Array.isArray(data)) {
      return data.map((item) => normalizeContract(item as ContractResponse));
    }
  }

  return [];
}

function extractContractItem(
  raw: unknown,
  fallbackId?: string,
): ContractResponse {
  if (!raw || typeof raw !== 'object') return { id: fallbackId ?? '' };

  const record = raw as Record<string, unknown>;
  const data = record['data'];

  if (data && typeof data === 'object' && !Array.isArray(data)) {
    const item = data as ContractResponse;
    return normalizeContract({ ...item, id: item.id ?? fallbackId ?? '' });
  }

  const item = record as ContractResponse;
  return normalizeContract({ ...item, id: item.id ?? fallbackId ?? '' });
}

function updateContractStatusInList(
  entities: readonly ContractResponse[],
  id: string,
  status: ContractStatus,
  extra?: Partial<ContractResponse>,
): ContractResponse[] {
  return entities.map((c) => (c.id === id ? { ...c, status, ...extra } : c));
}

function incrementStatsBucket(
  stats: ContractStats,
  status: ContractStatus,
  delta: 1 | -1,
): ContractStats {
  const next = { ...stats };

  switch (status) {
    case 'DRAFT':
      next.draft = Math.max(0, next.draft + delta);
      break;
    case 'PENDING_SIGNATURE':
      next.pendingSignature = Math.max(0, next.pendingSignature + delta);
      break;
    case 'ACTIVE':
      next.active = Math.max(0, next.active + delta);
      break;
    case 'TERMINATED':
      next.terminated = Math.max(0, next.terminated + delta);
      break;
    case 'CANCELLED':
      next.cancelled = Math.max(0, next.cancelled + delta);
      break;
    default:
      break;
  }

  return next;
}

function transitionContractStats(
  stats: ContractStats,
  previousStatus: ContractStatus | undefined,
  nextStatus: ContractStatus,
): ContractStats {
  let next = { ...stats };

  if (previousStatus && previousStatus !== nextStatus) {
    next = incrementStatsBucket(next, previousStatus, -1);
  }

  if (previousStatus !== nextStatus) {
    next = incrementStatsBucket(next, nextStatus, 1);
  }

  return next;
}

function extractContractStats(raw: unknown): ContractStats {
  if (!raw || typeof raw !== 'object') {
    return EMPTY_CONTRACT_STATS;
  }

  const record = raw as Record<string, unknown>;
  const source =
    record['data'] && typeof record['data'] === 'object'
      ? (record['data'] as Record<string, unknown>)
      : record;

  return {
    total:
      typeof source['total'] === 'number' && Number.isFinite(source['total'])
        ? source['total']
        : 0,
    active:
      typeof source['active'] === 'number' && Number.isFinite(source['active'])
        ? source['active']
        : 0,
    pendingSignature:
      typeof source['pendingSignature'] === 'number' &&
      Number.isFinite(source['pendingSignature'])
        ? source['pendingSignature']
        : 0,
    terminated:
      typeof source['terminated'] === 'number' &&
      Number.isFinite(source['terminated'])
        ? source['terminated']
        : 0,
    cancelled:
      typeof source['cancelled'] === 'number' &&
      Number.isFinite(source['cancelled'])
        ? source['cancelled']
        : 0,
    draft:
      typeof source['draft'] === 'number' && Number.isFinite(source['draft'])
        ? source['draft']
        : 0,
  };
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const ContratsStore = signalStore(
  { providedIn: 'root' },
  withApiResource<
    ContractResponse,
    typeof list5,
    typeof getById2,
    typeof create7,
    typeof update2
  >({
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
      entities().filter(
        (c) => c.status === 'TERMINATED' || c.status === 'CANCELLED',
      ),
    ),
  })),
  withMethods(
    (
      store,
      http = inject(HttpClient),
      apiConfig = inject(ApiConfiguration),
    ) => ({
      setFilterStatus(status: ContractStatus | null): void {
        patchState(store, { filterStatus: status });
      },

      loadStats: rxMethod<void>(
        pipe(
          tap(() =>
            patchState(store, {
              statsLoading: true,
              statsError: null,
            }),
          ),
          exhaustMap(() =>
            getStats(http, apiConfig.rootUrl).pipe(
              tapResponse({
                next: (response) =>
                  patchState(store, {
                    stats: extractContractStats(response.body),
                    statsLoading: false,
                    statsLoaded: true,
                    statsError: null,
                  }),
                error: (err: HttpErrorResponse) =>
                  patchState(store, {
                    statsLoading: false,
                    statsError: resolveHttpErrorMessage(
                      err,
                      'Erreur lors du chargement des statistiques contrats',
                    ),
                  }),
              }),
            ),
          ),
        ),
      ),

      activer: rxMethod<string>(
        pipe(
          tap((id) =>
            patchState(store, {
              activatingId: id,
              activateError: null,
              lastActivatedId: null,
            }),
          ),
          exhaustMap((id) =>
            activate(http, apiConfig.rootUrl, { id }).pipe(
              tapResponse({
                next: () => {
                  const previousStatus = store
                    .entities()
                    .find((contract) => contract.id === id)?.status;
                  const nextEntities = updateContractStatusInList(
                    store.entities(),
                    id,
                    'ACTIVE',
                  );

                  patchState(
                    store,
                    setAllEntities(nextEntities, {
                      selectId: (c: ContractResponse) => c.id,
                    }),
                    {
                      stats: store.statsLoaded()
                        ? transitionContractStats(
                            store.stats(),
                            previousStatus,
                            'ACTIVE',
                          )
                        : store.stats(),
                      activatingId: null,
                      activateError: null,
                      lastActivatedId: id,
                    },
                  );
                },
                error: (err: HttpErrorResponse) =>
                  patchState(store, {
                    activatingId: null,
                    activateError: resolveHttpErrorMessage(
                      err,
                      "Erreur lors de l'activation du contrat",
                    ),
                  }),
              }),
            ),
          ),
        ),
      ),

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
                  const previousStatus = store
                    .entities()
                    .find((contract) => contract.id === id)?.status;
                  const updated = extractContractItem(response.body, id);
                  const nextEntities = updateContractStatusInList(
                    store.entities(),
                    id,
                    'PENDING_SIGNATURE',
                    { signedFileUrl: updated.signedFileUrl },
                  );
                  patchState(
                    store,
                    setAllEntities(nextEntities, {
                      selectId: (c: ContractResponse) => c.id,
                    }),
                    {
                      stats: store.statsLoaded()
                        ? transitionContractStats(
                            store.stats(),
                            previousStatus,
                            'PENDING_SIGNATURE',
                          )
                        : store.stats(),
                      submittingId: null,
                      lastSubmittedId: id,
                      submitError: null,
                    },
                  );
                },
                error: (err: HttpErrorResponse) =>
                  patchState(store, {
                    submittingId: null,
                    submitError: resolveHttpErrorMessage(
                      err,
                      'Erreur lors de la soumission du contrat',
                    ),
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
              body: { terminationReason: reason },
            }).pipe(
              tapResponse({
                next: () => {
                  const previousStatus = store
                    .entities()
                    .find((contract) => contract.id === id)?.status;
                  const nextEntities = updateContractStatusInList(
                    store.entities(),
                    id,
                    'TERMINATED',
                  );
                  patchState(
                    store,
                    setAllEntities(nextEntities, {
                      selectId: (c: ContractResponse) => c.id,
                    }),
                    {
                      stats: store.statsLoaded()
                        ? transitionContractStats(
                            store.stats(),
                            previousStatus,
                            'TERMINATED',
                          )
                        : store.stats(),
                      terminatingId: null,
                      lastTerminatedId: id,
                      terminateError: null,
                    },
                  );
                },
                error: (err: HttpErrorResponse) =>
                  patchState(store, {
                    terminatingId: null,
                    terminateError: resolveHttpErrorMessage(
                      err,
                      'Erreur lors de la résiliation du contrat',
                    ),
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
                  const previousStatus = store
                    .entities()
                    .find((contract) => contract.id === id)?.status;
                  const nextEntities = updateContractStatusInList(
                    store.entities(),
                    id,
                    'CANCELLED',
                  );
                  patchState(
                    store,
                    setAllEntities(nextEntities, {
                      selectId: (c: ContractResponse) => c.id,
                    }),
                    {
                      stats: store.statsLoaded()
                        ? transitionContractStats(
                            store.stats(),
                            previousStatus,
                            'CANCELLED',
                          )
                        : store.stats(),
                      cancellingId: null,
                      lastCancelledId: id,
                      cancelError: null,
                    },
                  );
                },
                error: (err: HttpErrorResponse) =>
                  patchState(store, {
                    cancellingId: null,
                    cancelError: resolveHttpErrorMessage(
                      err,
                      "Erreur lors de l'annulation du contrat",
                    ),
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
          lastActivatedId: null,
          activateError: null,
          lastTerminatedId: null,
          terminateError: null,
          lastCancelledId: null,
          cancelError: null,
        });
      },
    }),
  ),
);

import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { computed, inject } from '@angular/core';
import { tapResponse } from '@ngrx/operators';
import {
  patchState,
  signalStore,
  withComputed,
  withMethods,
  withState,
} from '@ngrx/signals';
import { setEntity, updateEntity } from '@ngrx/signals/entities';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import {
  NOTIFICATION_HANDLER,
  resolveHttpErrorMessage,
  withApiResource,
} from '@ubax-workspace/shared-data-access';
import {
  ApiConfiguration,
  assignAgent,
  configureAvailability,
  ConfigureVisitAvailabilityDto,
  ConfirmVisitRequestDto,
  confirmRequest,
  getConfiguration,
  getRequests,
  rejectRequest,
  RejectVisitRequestDto,
  updateBlackoutDates,
  UpdateBlackoutDatesDto,
  VisitAvailabilityResponse,
  VisitRequestResponse,
} from '@ubax-workspace/shared-api-types';
import { exhaustMap, map, pipe, switchMap, tap } from 'rxjs';

export const VISIT_REQUEST_STATUSES = [
  'PENDING',
  'CONFIRMED',
  'REJECTED',
  'CANCELLED',
  'COMPLETED',
] as const;

export type VisitRequestStatus = (typeof VISIT_REQUEST_STATUSES)[number];

export type VisitRequest = VisitRequestResponse & {
  id: string;
  status: VisitRequestStatus;
};

const STATUS_COUNTS_EMPTY: Record<VisitRequestStatus, number> = {
  PENDING: 0,
  CONFIRMED: 0,
  REJECTED: 0,
  CANCELLED: 0,
  COMPLETED: 0,
};

type VisitesState = {
  filterStatus: VisitRequestStatus | null;
  statusCounts: Record<VisitRequestStatus, number>;
  activeActionId: string | null;
  actionError: string | null;
  visitConfig: VisitAvailabilityResponse | null;
  visitConfigLoading: boolean;
  visitConfigError: string | null;
};

function normalizeVisitRequest(
  raw: VisitRequestResponse | null | undefined,
  fallbackId = '',
): VisitRequest {
  return {
    ...raw,
    id: raw?.id ?? fallbackId,
    status: (raw?.status as VisitRequestStatus) ?? 'PENDING',
  };
}

function readData(raw: unknown): Record<string, unknown> | null {
  if (!raw || typeof raw !== 'object') return null;
  const record = raw as Record<string, unknown>;
  const data = record['data'];
  if (data && typeof data === 'object') return data as Record<string, unknown>;
  return record;
}

function mapVisitList(raw: unknown): VisitRequest[] {
  const data = readData(raw);
  const results = data?.['results'];
  if (!Array.isArray(results)) return [];
  return results.map((item, index) =>
    normalizeVisitRequest(item as VisitRequestResponse, `visit-${index + 1}`),
  );
}

function mapVisitDetail(raw: unknown, requestedId: string): VisitRequest {
  const data = readData(raw);
  return normalizeVisitRequest(data as VisitRequestResponse, requestedId);
}

export const VisitesStore = signalStore(
  { providedIn: 'root' },
  withApiResource<VisitRequest, typeof getRequests>({
    list: getRequests,
    idSelector: (visit) => visit.id,
    mapList: mapVisitList,
  }),
  withState<VisitesState>({
    filterStatus: null,
    statusCounts: STATUS_COUNTS_EMPTY,
    activeActionId: null,
    actionError: null,
    visitConfig: null,
    visitConfigLoading: false,
    visitConfigError: null,
  }),
  withComputed(({ entities, filterStatus, pagination, statusCounts }) => ({
    visitsFiltrees: computed(() => {
      const status = filterStatus();
      return status
        ? entities().filter((v) => v.status === status)
        : entities();
    }),
    visitsPending: computed(() =>
      entities().filter((v) => v.status === 'PENDING'),
    ),
    visitsConfirmed: computed(() =>
      entities().filter((v) => v.status === 'CONFIRMED'),
    ),
    currentPage: computed(() => (pagination()?.currentPage ?? 0) + 1),
    pageSize: computed(() => pagination()?.pageSize ?? 20),
    totalElements: computed(
      () => pagination()?.totalElements ?? entities().length,
    ),
    totalPages: computed(() => pagination()?.totalPages ?? 1),
    visitCounts: computed(() => {
      const counts = { ...STATUS_COUNTS_EMPTY, ...statusCounts() };
      if (Object.values(counts).some((v) => v > 0)) return counts;
      for (const visit of entities()) {
        counts[visit.status] += 1;
      }
      return counts;
    }),
  })),
  withMethods(
    (
      store,
      http = inject(HttpClient),
      apiConfig = inject(ApiConfiguration),
      notifications = inject(NOTIFICATION_HANDLER, { optional: true }),
    ) => {
      const rootUrl = apiConfig.rootUrl;

      const handleSuccess = (visit: VisitRequest, message: string) => {
        const prev = store.entityMap()[visit.id];
        const nextCounts = { ...store.statusCounts() };
        if (
          prev &&
          prev.status !== visit.status &&
          nextCounts[prev.status] > 0
        ) {
          nextCounts[prev.status] -= 1;
          nextCounts[visit.status] += 1;
        }
        patchState(
          store,
          updateEntity({ id: visit.id, changes: visit }),
          {
            saving: false,
            activeActionId: null,
            actionError: null,
            statusCounts: nextCounts,
          },
        );
        notifications?.success(message);
      };

      const handleError = (err: HttpErrorResponse, fallback: string) => {
        const message = resolveHttpErrorMessage(err, fallback);
        notifications?.error(message);
        patchState(store, {
          saving: false,
          activeActionId: null,
          actionError: message,
          error: message,
        });
      };

      return {
        setFilterStatus(status: VisitRequestStatus | null): void {
          patchState(store, { filterStatus: status });
        },

        loadDetail: rxMethod<string>(
          pipe(
            tap(() => patchState(store, { loading: true, error: null })),
            switchMap((id) => {
              const params = { pageable: { page: 0, size: 1, sort: [`id,asc`] } };
              return getRequests(http, rootUrl, params).pipe(
                map((response) => mapVisitDetail(response.body, id)),
                tapResponse({
                  next: (visit) =>
                    patchState(
                      store,
                      setEntity(visit, { selectId: (v) => v.id }),
                      { loading: false, selectedId: visit.id },
                    ),
                  error: (err: HttpErrorResponse) =>
                    patchState(store, {
                      loading: false,
                      error: resolveHttpErrorMessage(
                        err,
                        'Impossible de charger la demande.',
                      ),
                    }),
                }),
              );
            }),
          ),
        ),

        confirmVisit: rxMethod<{
          visitRequestId: string;
          body: ConfirmVisitRequestDto;
        }>(
          pipe(
            tap(({ visitRequestId }) =>
              patchState(store, {
                saving: true,
                error: null,
                actionError: null,
                activeActionId: visitRequestId,
              }),
            ),
            exhaustMap(({ visitRequestId, body }) =>
              confirmRequest(http, rootUrl, { visitRequestId, body }).pipe(
                map((response) =>
                  normalizeVisitRequest(response.body, visitRequestId),
                ),
                tapResponse({
                  next: (visit) =>
                    handleSuccess(visit, 'Visite confirmée avec succès.'),
                  error: (err: HttpErrorResponse) =>
                    handleError(err, 'La confirmation a échoué.'),
                }),
              ),
            ),
          ),
        ),

        rejectVisit: rxMethod<{
          visitRequestId: string;
          body: RejectVisitRequestDto;
        }>(
          pipe(
            tap(({ visitRequestId }) =>
              patchState(store, {
                saving: true,
                error: null,
                actionError: null,
                activeActionId: visitRequestId,
              }),
            ),
            exhaustMap(({ visitRequestId, body }) =>
              rejectRequest(http, rootUrl, { visitRequestId, body }).pipe(
                map((response) =>
                  normalizeVisitRequest(response.body, visitRequestId),
                ),
                tapResponse({
                  next: (visit) =>
                    handleSuccess(visit, 'Demande rejetée.'),
                  error: (err: HttpErrorResponse) =>
                    handleError(err, 'Le rejet a échoué.'),
                }),
              ),
            ),
          ),
        ),

        assignAgent: rxMethod<{
          visitRequestId: string;
          agentId: string;
        }>(
          pipe(
            tap(({ visitRequestId }) =>
              patchState(store, {
                saving: true,
                error: null,
                actionError: null,
                activeActionId: visitRequestId,
              }),
            ),
            exhaustMap(({ visitRequestId, agentId }) =>
              assignAgent(http, rootUrl, { visitRequestId, agentId }).pipe(
                map((response) =>
                  normalizeVisitRequest(response.body, visitRequestId),
                ),
                tapResponse({
                  next: (visit) =>
                    handleSuccess(visit, 'Agent assigné avec succès.'),
                  error: (err: HttpErrorResponse) =>
                    handleError(err, "L'assignation a échoué."),
                }),
              ),
            ),
          ),
        ),

        configureAvailability: rxMethod<ConfigureVisitAvailabilityDto>(
          pipe(
            tap(() =>
              patchState(store, {
                visitConfigLoading: true,
                visitConfigError: null,
              }),
            ),
            exhaustMap((body) =>
              configureAvailability(http, rootUrl, { body }).pipe(
                tapResponse({
                  next: (response) => {
                    patchState(store, {
                      visitConfig: response.body,
                      visitConfigLoading: false,
                      visitConfigError: null,
                    });
                    notifications?.success('Créneaux configurés avec succès.');
                  },
                  error: (err: HttpErrorResponse) => {
                    const message = resolveHttpErrorMessage(
                      err,
                      'La configuration a échoué.',
                    );
                    notifications?.error(message);
                    patchState(store, {
                      visitConfigLoading: false,
                      visitConfigError: message,
                    });
                  },
                }),
              ),
            ),
          ),
        ),

        updateBlackoutDates: rxMethod<{
          propertyId: string;
          body: UpdateBlackoutDatesDto;
        }>(
          pipe(
            tap(() =>
              patchState(store, {
                visitConfigLoading: true,
                visitConfigError: null,
              }),
            ),
            exhaustMap(({ propertyId, body }) =>
              updateBlackoutDates(http, rootUrl, { propertyId, body }).pipe(
                tapResponse({
                  next: () => {
                    patchState(store, {
                      visitConfigLoading: false,
                      visitConfigError: null,
                    });
                    notifications?.success(
                      'Dates fermées mises à jour avec succès.',
                    );
                  },
                  error: (err: HttpErrorResponse) => {
                    const message = resolveHttpErrorMessage(
                      err,
                      'La mise à jour des dates fermées a échoué.',
                    );
                    notifications?.error(message);
                    patchState(store, {
                      visitConfigLoading: false,
                      visitConfigError: message,
                    });
                  },
                }),
              ),
            ),
          ),
        ),

        loadPropertyConfig: rxMethod<string>(
          pipe(
            tap(() =>
              patchState(store, {
                visitConfigLoading: true,
                visitConfigError: null,
                visitConfig: null,
              }),
            ),
            exhaustMap((propertyId) =>
              getConfiguration(http, rootUrl, { propertyId }).pipe(
                map((response) => {
                  const data = readData(response.body);
                  return data as VisitAvailabilityResponse;
                }),
                tapResponse({
                  next: (config) =>
                    patchState(store, {
                      visitConfig: config,
                      visitConfigLoading: false,
                      visitConfigError: null,
                    }),
                  error: (err: HttpErrorResponse) =>
                    patchState(store, {
                      visitConfigLoading: false,
                      visitConfigError: resolveHttpErrorMessage(
                        err,
                        'Impossible de charger la configuration.',
                      ),
                    }),
                }),
              ),
            ),
          ),
        ),
      };
    },
  ),
);

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
  CancelReservationRequest,
  ReservationResponse,
  cancelByHotel,
  complete,
  confirm,
  getById5,
  getHotelReservations,
  noShow,
} from '@ubax-workspace/shared-api-types';
import { catchError, forkJoin, map, of, pipe, switchMap, tap } from 'rxjs';

export const HOTEL_RESERVATION_STATUSES = [
  'PENDING',
  'CONFIRMED',
  'CANCELLED',
  'COMPLETED',
  'NO_SHOW',
] as const;

export type HotelReservationStatus =
  (typeof HOTEL_RESERVATION_STATUSES)[number];

export type HotelReservation = ReservationResponse & {
  id: string;
  status: HotelReservationStatus;
};

type HotelReservationsState = {
  filterStatus: HotelReservationStatus | null;
  statusCounts: Record<HotelReservationStatus, number>;
  countsLoading: boolean;
  detailStatusCode: number | null;
  activeActionId: string | null;
  actionError: string | null;
};

const EMPTY_STATUS_COUNTS: Record<HotelReservationStatus, number> = {
  PENDING: 0,
  CONFIRMED: 0,
  CANCELLED: 0,
  COMPLETED: 0,
  NO_SHOW: 0,
};

const DEFAULT_SORT = ['createdAt,desc'];

function normalizeReservation(
  reservation: ReservationResponse | null | undefined,
  fallbackId = '',
): HotelReservation {
  return {
    ...reservation,
    id:
      reservation?.id ??
      fallbackId ??
      `${reservation?.propertyId ?? 'reservation'}-${reservation?.createdAt ?? 'unknown'}`,
    status: reservation?.status ?? 'PENDING',
  };
}

function readDataRecord(raw: unknown): Record<string, unknown> | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }

  const record = raw as Record<string, unknown>;
  const data = record['data'];

  if (data && typeof data === 'object') {
    return data as Record<string, unknown>;
  }

  return record;
}

function mapReservationList(raw: unknown): HotelReservation[] {
  const data = readDataRecord(raw);
  const results = data?.['results'];

  if (!Array.isArray(results)) {
    return [];
  }

  return results.map((item, index) =>
    normalizeReservation(
      item as ReservationResponse,
      `reservation-${index + 1}`,
    ),
  );
}

function mapReservationDetail(
  raw: unknown,
  requestedId: string,
): HotelReservation {
  const data = readDataRecord(raw);

  return normalizeReservation(data as ReservationResponse, requestedId);
}

function readTotalElements(raw: unknown): number {
  const data = readDataRecord(raw);
  const total = data?.['totalElements'];

  return typeof total === 'number' && Number.isFinite(total) ? total : 0;
}

function applyReservationUpdate(
  store: {
    selectedId(): string | null;
  },
  reservation: HotelReservation,
) {
  return patchState(
    store as never,
    updateEntity({ id: reservation.id, changes: reservation }),
    { selectedId: reservation.id },
  );
}

export const HotelReservationsStore = signalStore(
  { providedIn: 'root' },
  withApiResource<HotelReservation, typeof getHotelReservations>({
    list: getHotelReservations,
    idSelector: (reservation) => reservation.id,
    mapList: mapReservationList,
  }),
  withState<HotelReservationsState>({
    filterStatus: null,
    statusCounts: EMPTY_STATUS_COUNTS,
    countsLoading: false,
    detailStatusCode: null,
    activeActionId: null,
    actionError: null,
  }),
  withComputed(({ entities, filterStatus, pagination, statusCounts }) => ({
    filteredReservations: computed(() => {
      const status = filterStatus();
      return status
        ? entities().filter((reservation) => reservation.status === status)
        : entities();
    }),
    currentPage: computed(() => (pagination()?.currentPage ?? 0) + 1),
    pageSize: computed(() => pagination()?.pageSize ?? 20),
    totalElements: computed(
      () => pagination()?.totalElements ?? entities().length,
    ),
    totalPages: computed(() => pagination()?.totalPages ?? 1),
    reservationCounts: computed(() => {
      const counts = { ...EMPTY_STATUS_COUNTS, ...statusCounts() };

      if (Object.values(counts).some((value) => value > 0)) {
        return counts;
      }

      for (const reservation of entities()) {
        counts[reservation.status] += 1;
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

      const handleMutationSuccess = (
        reservation: HotelReservation,
        successMessage: string,
      ) => {
        const previousReservation = store.entityMap()[reservation.id];
        const nextCounts = { ...store.statusCounts() };

        if (
          previousReservation &&
          previousReservation.status !== reservation.status &&
          nextCounts[previousReservation.status] > 0
        ) {
          nextCounts[previousReservation.status] -= 1;
          nextCounts[reservation.status] += 1;
        }

        patchState(
          store,
          updateEntity({ id: reservation.id, changes: reservation }),
          {
            selectedId: reservation.id,
            saving: false,
            activeActionId: null,
            actionError: null,
            statusCounts: nextCounts,
          },
        );
        notifications?.success(successMessage);
      };

      const handleMutationError = (
        err: HttpErrorResponse,
        fallback: string,
      ) => {
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
        setFilterStatus(status: HotelReservationStatus | null): void {
          patchState(store, { filterStatus: status });
        },

        loadDetail: rxMethod<string>(
          pipe(
            tap(() =>
              patchState(store, {
                loading: true,
                error: null,
                detailStatusCode: null,
              }),
            ),
            switchMap((id) =>
              getById5(http, rootUrl, { id }).pipe(
                map((response) => mapReservationDetail(response.body, id)),
                tapResponse({
                  next: (reservation) =>
                    patchState(
                      store,
                      setEntity(reservation, { selectId: (item) => item.id }),
                      {
                        loading: false,
                        selectedId: reservation.id,
                        detailStatusCode: null,
                      },
                    ),
                  error: (err: HttpErrorResponse) =>
                    patchState(store, {
                      loading: false,
                      detailStatusCode: err.status ?? null,
                      error:
                        err.status === 403
                          ? 'Accès non autorisé à cette réservation'
                          : resolveHttpErrorMessage(
                              err,
                              'Impossible de charger la réservation.',
                            ),
                    }),
                }),
              ),
            ),
          ),
        ),

        loadStatusCounts: rxMethod<void>(
          pipe(
            tap(() => patchState(store, { countsLoading: true })),
            switchMap(() =>
              forkJoin(
                Object.fromEntries(
                  HOTEL_RESERVATION_STATUSES.map((status) => [
                    status,
                    getHotelReservations(http, rootUrl, {
                      status,
                      pageable: { page: 0, size: 1, sort: DEFAULT_SORT },
                    }).pipe(
                      map((response) => readTotalElements(response.body)),
                      catchError(() => of(0)),
                    ),
                  ]),
                ),
              ).pipe(
                tap((entries) => {
                  const nextCounts = { ...EMPTY_STATUS_COUNTS };

                  for (const status of HOTEL_RESERVATION_STATUSES) {
                    nextCounts[status] = entries[status] ?? 0;
                  }

                  patchState(store, {
                    countsLoading: false,
                    statusCounts: nextCounts,
                  });
                }),
              ),
            ),
          ),
        ),

        confirmReservation: rxMethod<string>(
          pipe(
            tap((id) =>
              patchState(store, {
                saving: true,
                error: null,
                actionError: null,
                activeActionId: id,
              }),
            ),
            switchMap((id) =>
              confirm(http, rootUrl, { id }).pipe(
                map((response) => mapReservationDetail(response.body, id)),
                tapResponse({
                  next: (reservation) =>
                    handleMutationSuccess(
                      reservation,
                      'Réservation confirmée avec succès.',
                    ),
                  error: (err: HttpErrorResponse) =>
                    handleMutationError(err, 'La confirmation a échoué.'),
                }),
              ),
            ),
          ),
        ),

        completeReservation: rxMethod<string>(
          pipe(
            tap((id) =>
              patchState(store, {
                saving: true,
                error: null,
                actionError: null,
                activeActionId: id,
              }),
            ),
            switchMap((id) =>
              complete(http, rootUrl, { id }).pipe(
                map((response) => mapReservationDetail(response.body, id)),
                tapResponse({
                  next: (reservation) =>
                    handleMutationSuccess(
                      reservation,
                      'Le séjour a été marqué comme terminé.',
                    ),
                  error: (err: HttpErrorResponse) =>
                    handleMutationError(err, 'La clôture du séjour a échoué.'),
                }),
              ),
            ),
          ),
        ),

        markNoShow: rxMethod<string>(
          pipe(
            tap((id) =>
              patchState(store, {
                saving: true,
                error: null,
                actionError: null,
                activeActionId: id,
              }),
            ),
            switchMap((id) =>
              noShow(http, rootUrl, { id }).pipe(
                map((response) => mapReservationDetail(response.body, id)),
                tapResponse({
                  next: (reservation) =>
                    handleMutationSuccess(
                      reservation,
                      'Le client a été marqué en no-show.',
                    ),
                  error: (err: HttpErrorResponse) =>
                    handleMutationError(err, 'Le passage en no-show a échoué.'),
                }),
              ),
            ),
          ),
        ),

        cancelReservation: rxMethod<{ id: string; reason: string }>(
          pipe(
            tap(({ id }) =>
              patchState(store, {
                saving: true,
                error: null,
                actionError: null,
                activeActionId: id,
              }),
            ),
            switchMap(({ id, reason }) => {
              const body: CancelReservationRequest = { reason };

              return cancelByHotel(http, rootUrl, { id, body }).pipe(
                map((response) => mapReservationDetail(response.body, id)),
                tapResponse({
                  next: (reservation) =>
                    handleMutationSuccess(
                      reservation,
                      'La réservation a été annulée.',
                    ),
                  error: (err: HttpErrorResponse) =>
                    handleMutationError(err, 'L’annulation a échoué.'),
                }),
              );
            }),
          ),
        ),
      };
    },
  ),
);

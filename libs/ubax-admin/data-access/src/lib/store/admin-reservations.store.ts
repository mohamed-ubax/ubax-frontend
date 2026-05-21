import { inject, Injectable, signal } from '@angular/core';
import {
  Api,
  ReservationResponse,
  getById5,
  listAll,
} from '@ubax-workspace/shared-api-types';
import { resolveHttpErrorMessage } from '@ubax-workspace/shared-data-access';

export const ADMIN_RESERVATION_STATUSES = [
  'PENDING',
  'CONFIRMED',
  'CANCELLED',
  'COMPLETED',
  'NO_SHOW',
] as const;

export type AdminReservationStatus =
  (typeof ADMIN_RESERVATION_STATUSES)[number];

export type AdminReservation = ReservationResponse & {
  id: string;
  status: AdminReservationStatus;
};

type ReservationPageResult = {
  items: AdminReservation[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
};

const EMPTY_STATUS_COUNTS: Record<AdminReservationStatus, number> = {
  PENDING: 0,
  CONFIRMED: 0,
  CANCELLED: 0,
  COMPLETED: 0,
  NO_SHOW: 0,
};

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

function normalizeReservation(
  reservation: ReservationResponse | null | undefined,
  fallbackId = '',
): AdminReservation {
  return {
    ...reservation,
    id:
      reservation?.id ??
      fallbackId ??
      `${reservation?.propertyId ?? 'reservation'}-${reservation?.createdAt ?? 'unknown'}`,
    status: reservation?.status ?? 'PENDING',
  };
}

function normalizeReservationPageResponse(raw: unknown): ReservationPageResult {
  const data = readDataRecord(raw);
  const items = Array.isArray(data?.['results'])
    ? data['results'].map((item, index) =>
        normalizeReservation(
          item as ReservationResponse,
          `reservation-${index + 1}`,
        ),
      )
    : [];
  const totalElements =
    typeof data?.['totalElements'] === 'number'
      ? data['totalElements']
      : items.length;
  const totalPages =
    typeof data?.['totalPages'] === 'number'
      ? data['totalPages']
      : Math.max(1, Math.ceil(totalElements / 20));
  const currentPage = typeof data?.['number'] === 'number' ? data['number'] : 0;

  return {
    items,
    totalElements,
    totalPages,
    currentPage,
  };
}

function normalizeReservationDetail(
  raw: unknown,
  id: string,
): AdminReservation {
  const data = readDataRecord(raw);
  return normalizeReservation(data as ReservationResponse, id);
}

@Injectable({ providedIn: 'root' })
export class AdminReservationsStore {
  private readonly api = inject(Api);

  readonly loading = signal(false);
  readonly countsLoading = signal(false);
  readonly error = signal<string | null>(null);
  readonly detailStatusCode = signal<number | null>(null);
  readonly reservations = signal<AdminReservation[]>([]);
  readonly selectedReservation = signal<AdminReservation | null>(null);
  readonly totalElements = signal(0);
  readonly totalPages = signal(1);
  readonly currentPage = signal(1);
  readonly statusCounts =
    signal<Record<AdminReservationStatus, number>>(EMPTY_STATUS_COUNTS);

  async load(
    params: {
      page?: number;
      size?: number;
      status?: AdminReservationStatus;
    } = {},
  ): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      const raw = await this.api.invoke(listAll, {
        status: params.status,
        pageable: {
          page: params.page ?? 0,
          size: params.size ?? 20,
          sort: ['createdAt,desc'],
        },
      });
      const page = normalizeReservationPageResponse(raw);

      this.reservations.set(page.items);
      this.totalElements.set(page.totalElements);
      this.totalPages.set(page.totalPages);
      this.currentPage.set(page.currentPage + 1);
    } catch (error) {
      this.error.set(
        resolveHttpErrorMessage(
          error,
          'Impossible de charger les réservations.',
        ),
      );
      throw error;
    } finally {
      this.loading.set(false);
    }
  }

  async loadStatusCounts(): Promise<void> {
    this.countsLoading.set(true);

    try {
      const entries = await Promise.all(
        ADMIN_RESERVATION_STATUSES.map(async (status) => {
          try {
            const raw = await this.api.invoke(listAll, {
              status,
              pageable: { page: 0, size: 1, sort: ['createdAt,desc'] },
            });
            const page = normalizeReservationPageResponse(raw);

            return [status, page.totalElements] as const;
          } catch {
            return [status, 0] as const;
          }
        }),
      );

      this.statusCounts.set(
        entries.reduce(
          (accumulator, [status, total]) => ({
            ...accumulator,
            [status]: total,
          }),
          EMPTY_STATUS_COUNTS,
        ),
      );
    } finally {
      this.countsLoading.set(false);
    }
  }

  async loadDetail(id: string): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    this.detailStatusCode.set(null);

    try {
      const raw = await this.api.invoke(getById5, { id });
      this.selectedReservation.set(normalizeReservationDetail(raw, id));
    } catch (error) {
      const status = (error as { status?: number })?.status ?? null;
      this.detailStatusCode.set(status);
      this.error.set(
        status === 404
          ? 'Réservation introuvable.'
          : resolveHttpErrorMessage(
              error,
              'Impossible de charger le détail de la réservation.',
            ),
      );
      throw error;
    } finally {
      this.loading.set(false);
    }
  }
}

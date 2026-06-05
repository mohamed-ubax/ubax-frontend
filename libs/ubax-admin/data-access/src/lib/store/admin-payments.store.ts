import { inject, Injectable, signal } from '@angular/core';
import {
  Api,
  PaymentResponse,
  PaymentStatusUpdateRequest,
  PropertyDetailResponse,
  TenantResponse,
  getById1,
  getById6,
  getById4,
  list3,
  updateStatus2,
} from '@ubax-workspace/shared-api-types';
import { resolveHttpErrorMessage } from '@ubax-workspace/shared-data-access';

export const ADMIN_PAYMENT_STATUSES = [
  'PENDING',
  'PAID',
  'LATE',
  'PARTIAL',
  'CANCELLED',
] as const;

export const ADMIN_PAYMENT_TYPES = [
  'RENT',
  'DEPOSIT',
  'CHARGES',
  'COMMISSION',
  'SALE',
] as const;

export type AdminPaymentStatus = (typeof ADMIN_PAYMENT_STATUSES)[number];
export type AdminPaymentType = (typeof ADMIN_PAYMENT_TYPES)[number];

export type AdminPayment = PaymentResponse & {
  id: string;
  status: AdminPaymentStatus;
};

export type AdminPaymentPropertySummary = {
  city: string;
  title: string;
  partnerName: string;
  ownerName: string;
  partnerType: 'hotel' | 'agency' | 'unknown';
};

type PaymentPageResult = {
  items: AdminPayment[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
};

function readRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function readDataRecord(raw: unknown): Record<string, unknown> | null {
  const record = readRecord(raw);

  if (!record) {
    return null;
  }

  return readRecord(record['data']) ?? record;
}

function readCollection(raw: unknown): unknown[] {
  if (Array.isArray(raw)) {
    return raw;
  }

  const record = readRecord(raw);

  if (!record) {
    return [];
  }

  for (const key of ['results', 'content', 'items', 'data']) {
    const value = record[key];

    if (Array.isArray(value)) {
      return value;
    }
  }

  for (const key of ['data', 'payload', 'result']) {
    const nested = readCollection(record[key]);

    if (nested.length > 0) {
      return nested;
    }
  }

  return [];
}

function readNonEmptyString(
  record: Record<string, unknown> | null,
  keys: readonly string[],
): string | null {
  if (!record) {
    return null;
  }

  for (const key of keys) {
    const value = record[key];

    if (typeof value === 'string' && value.trim().length > 0) {
      return value.trim();
    }
  }

  return null;
}

function parseDateValue(value?: string): number {
  if (!value) {
    return Number.NEGATIVE_INFINITY;
  }

  const timestamp = new Date(value).getTime();

  return Number.isNaN(timestamp) ? Number.NEGATIVE_INFINITY : timestamp;
}

function normalizePayment(raw: unknown, fallbackId = ''): AdminPayment {
  const source = readDataRecord(raw) ?? {};
  const payment = source as PaymentResponse;

  return {
    ...payment,
    id:
      payment.id ??
      fallbackId ??
      payment.reference ??
      `${payment.propertyId ?? 'payment'}-${payment.createdAt ?? 'unknown'}`,
    status: payment.status ?? 'PENDING',
  };
}

function normalizePaymentPageResponse(raw: unknown): PaymentPageResult {
  const data = readDataRecord(raw);
  const items = readCollection(raw)
    .map((item, index) => normalizePayment(item, `payment-${index + 1}`))
    .sort((left, right) => {
      const rightDate = Math.max(
        parseDateValue(right.paidDate),
        parseDateValue(right.dueDate),
        parseDateValue(right.createdAt),
        parseDateValue(right.updatedAt),
      );
      const leftDate = Math.max(
        parseDateValue(left.paidDate),
        parseDateValue(left.dueDate),
        parseDateValue(left.createdAt),
        parseDateValue(left.updatedAt),
      );

      return rightDate - leftDate;
    });

  return {
    items,
    totalElements:
      typeof data?.['totalElements'] === 'number'
        ? data['totalElements']
        : items.length,
    totalPages: (() => {
      if (typeof data?.['totalPages'] === 'number') {
        return data['totalPages'];
      }

      return items.length > 0 ? 1 : 0;
    })(),
    currentPage: typeof data?.['number'] === 'number' ? data['number'] : 0,
  };
}

function normalizeTenantName(raw: unknown): string {
  const source = readDataRecord(raw);
  const tenant = source as TenantResponse | null;

  return (
    tenant?.fullName?.trim() ||
    readNonEmptyString(source, ['fullName', 'name']) ||
    'Client non renseigné'
  );
}

function normalizePropertySummary(raw: unknown): AdminPaymentPropertySummary {
  const source = readDataRecord(raw);
  const detail = source as PropertyDetailResponse | null;
  const propertyRecord = readRecord(detail?.property) ?? source;

  const hotelId = readNonEmptyString(propertyRecord, ['hotelId']);
  const agencyId = readNonEmptyString(propertyRecord, ['agencyId']);

  return {
    title:
      readNonEmptyString(propertyRecord, [
        'title',
        'hotelName',
        'name',
        'address',
      ]) || 'Bien non renseigné',
    city:
      readNonEmptyString(propertyRecord, ['city', 'district', 'street']) || '',
    partnerName:
      readNonEmptyString(propertyRecord, ['hotelName', 'agencyName']) || '',
    ownerName:
      readNonEmptyString(propertyRecord, ['ownerName']) || '',
    partnerType: hotelId ? 'hotel' : agencyId ? 'agency' : 'unknown',
  };
}

@Injectable({ providedIn: 'root' })
export class AdminPaymentsStore {
  private readonly api = inject(Api);

  readonly loading = signal(false);
  readonly detailLoading = signal(false);
  readonly updating = signal(false);
  readonly error = signal<string | null>(null);
  readonly detailError = signal<string | null>(null);
  readonly updateError = signal<string | null>(null);
  readonly payments = signal<AdminPayment[]>([]);
  readonly selectedPayment = signal<AdminPayment | null>(null);
  readonly tenantNames = signal<Record<string, string>>({});
  readonly propertySummaries = signal<
    Record<string, AdminPaymentPropertySummary>
  >({});
  readonly totalElements = signal(0);
  readonly totalPages = signal(1);
  readonly currentPage = signal(1);

  async load(
    params: {
      page?: number;
      size?: number;
      status?: AdminPaymentStatus;
      type?: AdminPaymentType;
    } = {},
  ): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      const raw = await this.api.invoke(list3, {
        status: params.status,
        type: params.type,
        pageable: {
          page: params.page ?? 0,
          size: params.size ?? 60,
          sort: ['createdAt,desc'],
        },
      });
      const page = normalizePaymentPageResponse(raw);

      this.payments.set(page.items);
      this.totalElements.set(page.totalElements);
      this.totalPages.set(page.totalPages);
      this.currentPage.set(page.currentPage + 1);
      await this.resolveRelations(page.items);
    } catch (error) {
      this.error.set(
        resolveHttpErrorMessage(error, 'Impossible de charger les paiements.'),
      );
      throw error;
    } finally {
      this.loading.set(false);
    }
  }

  async loadDetail(id: string): Promise<void> {
    this.detailLoading.set(true);
    this.detailError.set(null);

    try {
      const raw = await this.api.invoke(getById6, { id });
      const payment = normalizePayment(raw, id);

      this.selectedPayment.set(payment);
      await this.resolveRelations([payment]);
    } catch (error) {
      this.detailError.set(
        (error as { status?: number })?.status === 404
          ? 'Paiement introuvable.'
          : resolveHttpErrorMessage(
              error,
              'Impossible de charger le détail du paiement.',
            ),
      );
      throw error;
    } finally {
      this.detailLoading.set(false);
    }
  }

  async updateStatus(
    id: string,
    body: PaymentStatusUpdateRequest,
  ): Promise<AdminPayment> {
    this.updating.set(true);
    this.updateError.set(null);

    try {
      const raw = await this.api.invoke(updateStatus2, { id, body });
      const updatedPayment = normalizePayment(raw, id);

      this.selectedPayment.set(updatedPayment);
      this.payments.update((payments) => {
        const existingIndex = payments.findIndex(
          (payment) => payment.id === id,
        );

        if (existingIndex === -1) {
          return [updatedPayment, ...payments];
        }

        return payments.map((payment) =>
          payment.id === id ? updatedPayment : payment,
        );
      });

      return updatedPayment;
    } catch (error) {
      this.updateError.set(
        resolveHttpErrorMessage(
          error,
          'Impossible de mettre à jour le statut du paiement.',
        ),
      );
      throw error;
    } finally {
      this.updating.set(false);
    }
  }

  clearSelection(): void {
    this.selectedPayment.set(null);
    this.detailError.set(null);
    this.updateError.set(null);
  }

  private async resolveRelations(
    payments: readonly AdminPayment[],
  ): Promise<void> {
    const tenantIds = Array.from(
      new Set(
        payments
          .map((payment) => payment.tenantId?.trim())
          .filter((value): value is string => !!value),
      ),
    ).filter((tenantId) => this.tenantNames()[tenantId] == null);

    const propertyIds = Array.from(
      new Set(
        payments
          .map((payment) => payment.propertyId?.trim())
          .filter((value): value is string => !!value),
      ),
    ).filter((propertyId) => this.propertySummaries()[propertyId] == null);

    if (tenantIds.length > 0) {
      const tenantEntries = await Promise.all(
        tenantIds.map(async (tenantId) => {
          try {
            const raw = await this.api.invoke(getById4, { id: tenantId });
            return [tenantId, normalizeTenantName(raw)] as const;
          } catch {
            return [tenantId, 'Client non renseigné'] as const;
          }
        }),
      );

      this.tenantNames.update((current) => ({
        ...current,
        ...Object.fromEntries(tenantEntries),
      }));
    }

    if (propertyIds.length > 0) {
      const propertyEntries = await Promise.all(
        propertyIds.map(async (propertyId) => {
          try {
            const raw = await this.api.invoke(getById1, { id: propertyId });
            return [propertyId, normalizePropertySummary(raw)] as const;
          } catch {
            return [
              propertyId,
              { title: 'Bien non renseigné', city: '' },
            ] as const;
          }
        }),
      );

      this.propertySummaries.update((current) => ({
        ...current,
        ...Object.fromEntries(propertyEntries),
      }));
    }
  }
}

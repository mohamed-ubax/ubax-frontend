import { inject, Injectable, signal } from '@angular/core';
import { activate, Api, list4 } from '@ubax-workspace/shared-api-types';
import { resolveHttpErrorMessage } from '@ubax-workspace/shared-data-access';

export type AdminMandateStatus =
  | 'DRAFT'
  | 'PENDING_SIGNATURE'
  | 'ACTIVE'
  | 'TERMINATED'
  | 'CANCELLED';

export interface AdminMandate {
  id: string;
  referenceNumber?: string;
  status?: AdminMandateStatus;
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

function extractMandates(raw: unknown): AdminMandate[] {
  if (Array.isArray(raw)) {
    return raw.map((item) => extractMandate(item));
  }

  if (!raw || typeof raw !== 'object') {
    return [];
  }

  const record = raw as Record<string, unknown>;
  const direct = record['results'] ?? record['content'];

  if (Array.isArray(direct)) {
    return direct.map((item) => extractMandate(item));
  }

  const nested = record['data'];
  if (nested && typeof nested === 'object') {
    return extractMandates(nested);
  }

  return [];
}

function extractMandate(raw: unknown, fallbackId = ''): AdminMandate {
  if (!raw || typeof raw !== 'object') {
    return { id: fallbackId };
  }

  const record = raw as Record<string, unknown>;
  const source =
    record['data'] && typeof record['data'] === 'object'
      ? (record['data'] as Record<string, unknown>)
      : record;

  const mandate = source as AdminMandate;

  return {
    ...mandate,
    id: mandate.id ?? fallbackId,
  };
}

@Injectable({ providedIn: 'root' })
export class AdminMandatesStore {
  private readonly api = inject(Api);

  readonly loading = signal(false);
  readonly activatingId = signal<string | null>(null);
  readonly error = signal<string | null>(null);
  readonly mandates = signal<AdminMandate[]>([]);

  async load(status?: AdminMandateStatus): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      const raw = await this.api.invoke(list4, {
        status,
        pageable: { page: 0, size: 200, sort: ['createdAt,desc'] },
      });
      this.mandates.set(extractMandates(raw));
    } catch (error) {
      this.error.set(
        resolveHttpErrorMessage(error, 'Impossible de charger les mandats.'),
      );
      throw error;
    } finally {
      this.loading.set(false);
    }
  }

  async activate(id: string): Promise<void> {
    this.activatingId.set(id);
    this.error.set(null);

    try {
      const updated = extractMandate(
        await this.api.invoke(activate, { id }),
        id,
      );
      this.mandates.update((items) =>
        items.map((item) =>
          item.id === id ? { ...item, ...updated, id, status: 'ACTIVE' } : item,
        ),
      );
    } catch (error) {
      this.error.set(
        resolveHttpErrorMessage(error, "Impossible d'activer le mandat."),
      );
      throw error;
    } finally {
      this.activatingId.set(null);
    }
  }
}

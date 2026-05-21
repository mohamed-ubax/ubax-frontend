import { inject, Injectable, signal } from '@angular/core';
import {
  Api,
  type BailleurApplicationResponse,
  listAll1,
} from '@ubax-workspace/shared-api-types';
import { resolveHttpErrorMessage } from '@ubax-workspace/shared-data-access';

function extractApplications(raw: unknown): BailleurApplicationResponse[] {
  if (Array.isArray(raw)) {
    return raw as BailleurApplicationResponse[];
  }

  if (!raw || typeof raw !== 'object') {
    return [];
  }

  const record = raw as Record<string, unknown>;
  const direct = record['results'] ?? record['content'];

  if (Array.isArray(direct)) {
    return direct as BailleurApplicationResponse[];
  }

  const nested = record['data'];
  if (nested && typeof nested === 'object') {
    return extractApplications(nested);
  }

  return [];
}

@Injectable({ providedIn: 'root' })
export class AdminBailleurApplicationsStore {
  private readonly api = inject(Api);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly applications = signal<BailleurApplicationResponse[]>([]);

  async load(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      const raw = await this.api.invoke(listAll1, {
        page: 0,
        size: 200,
        sort: ['createdAt,desc'],
      });
      this.applications.set(extractApplications(raw));
    } catch (error) {
      this.error.set(
        resolveHttpErrorMessage(
          error,
          'Impossible de charger les demandes bailleur.',
        ),
      );
      throw error;
    } finally {
      this.loading.set(false);
    }
  }
}

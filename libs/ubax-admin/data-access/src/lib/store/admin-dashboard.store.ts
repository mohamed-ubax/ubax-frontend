import { inject, Injectable, signal } from '@angular/core';
import {
  Api,
  type AdminDashboardResponse,
  getAdminDashboard,
} from '@ubax-workspace/shared-api-types';
import { resolveHttpErrorMessage } from '@ubax-workspace/shared-data-access';
import { normalizeDashboardResponse } from '../admin-response.helpers';

@Injectable({ providedIn: 'root' })
export class AdminDashboardStore {
  private readonly api = inject(Api);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly dashboard = signal<AdminDashboardResponse | null>(null);

  async load(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      this.dashboard.set(
        normalizeDashboardResponse(await this.api.invoke(getAdminDashboard)),
      );
    } catch (error) {
      this.error.set(
        resolveHttpErrorMessage(
          error,
          'Impossible de charger le tableau de bord administrateur.',
        ),
      );
      throw error;
    } finally {
      this.loading.set(false);
    }
  }
}

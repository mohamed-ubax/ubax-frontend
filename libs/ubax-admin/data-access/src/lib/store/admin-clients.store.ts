import { inject, Injectable, signal } from '@angular/core';
import {
  Api,
  type ClientUserResponse,
  listClients1,
} from '@ubax-workspace/shared-api-types';
import { resolveHttpErrorMessage } from '@ubax-workspace/shared-data-access';
import { normalizeClientPageResponse } from '../admin-response.helpers';

export interface AdminClientFilters {
  active?: boolean;
  agencyId?: string;
  emailVerified?: boolean;
  hotelId?: string;
  identityVerified?: boolean;
}

@Injectable({ providedIn: 'root' })
export class AdminClientsStore {
  private readonly api = inject(Api);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly clients = signal<ClientUserResponse[]>([]);
  readonly totalElements = signal(0);
  readonly totalPages = signal(0);

  async load(filters?: AdminClientFilters): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      const raw = await this.api.invoke(listClients1, {
        agencyId: filters?.agencyId,
        active: filters?.active,
        emailVerified: filters?.emailVerified,
        hotelId: filters?.hotelId,
        identityVerified: filters?.identityVerified,
        pageable: { page: 0, size: 500 },
      });
      const page = normalizeClientPageResponse(raw);
      this.clients.set(page.items);
      this.totalElements.set(page.totalElements);
      this.totalPages.set(page.totalPages);
    } catch (error) {
      this.error.set(
        resolveHttpErrorMessage(error, 'Impossible de charger les clients.'),
      );
      throw error;
    } finally {
      this.loading.set(false);
    }
  }
}

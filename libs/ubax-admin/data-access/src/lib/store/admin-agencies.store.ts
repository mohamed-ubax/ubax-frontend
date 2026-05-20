import { inject, Injectable, signal } from '@angular/core';
import {
  Api,
  type AdminAgencyResponse,
  type UpdateSubscriptionRequest,
  activateAgency,
  listAgencies,
  suspendAgency,
  updateAgencySubscription,
} from '@ubax-workspace/shared-api-types';
import { resolveHttpErrorMessage } from '@ubax-workspace/shared-data-access';
import {
  normalizeAgencyPageResponse,
  normalizeAgencyResponse,
} from '../admin-response.helpers';

@Injectable({ providedIn: 'root' })
export class AdminAgenciesStore {
  private readonly api = inject(Api);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly agencies = signal<AdminAgencyResponse[]>([]);
  readonly totalElements = signal(0);
  readonly totalPages = signal(0);

  async load(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      const raw = await this.api.invoke(listAgencies, {
        pageable: { page: 0, size: 200 },
      });
      const page = normalizeAgencyPageResponse(raw);
      this.agencies.set(page.items);
      this.totalElements.set(page.totalElements);
      this.totalPages.set(page.totalPages);
    } catch (error) {
      this.error.set(
        resolveHttpErrorMessage(error, 'Impossible de charger les agences.'),
      );
      throw error;
    } finally {
      this.loading.set(false);
    }
  }

  async activate(id: string): Promise<AdminAgencyResponse> {
    this.error.set(null);
    try {
      const updated =
        normalizeAgencyResponse(
          await this.api.invoke(activateAgency, { id }),
        ) ?? {};
      const merged = this.merge(id, { ...updated, active: true, id });
      return merged;
    } catch (error) {
      this.error.set(
        resolveHttpErrorMessage(error, "Impossible d'activer l'agence."),
      );
      throw error;
    }
  }

  async suspend(id: string): Promise<AdminAgencyResponse> {
    this.error.set(null);
    try {
      const updated =
        normalizeAgencyResponse(await this.api.invoke(suspendAgency, { id })) ??
        {};
      const merged = this.merge(id, { ...updated, active: false, id });
      return merged;
    } catch (error) {
      this.error.set(
        resolveHttpErrorMessage(error, "Impossible de suspendre l'agence."),
      );
      throw error;
    }
  }

  async updateSubscription(
    id: string,
    body: UpdateSubscriptionRequest,
  ): Promise<AdminAgencyResponse> {
    this.error.set(null);
    try {
      const updated =
        normalizeAgencyResponse(
          await this.api.invoke(updateAgencySubscription, { id, body }),
        ) ?? {};
      return this.merge(id, { ...updated, id });
    } catch (error) {
      this.error.set(
        resolveHttpErrorMessage(
          error,
          "Impossible de mettre à jour l'abonnement de l'agence.",
        ),
      );
      throw error;
    }
  }

  private merge(
    id: string,
    patch: Partial<AdminAgencyResponse>,
  ): AdminAgencyResponse {
    let mergedAgency: AdminAgencyResponse = patch;

    this.agencies.update((items) =>
      items.map((item) => {
        if (item.id !== id) {
          return item;
        }

        mergedAgency = { ...item, ...patch, id };
        return mergedAgency;
      }),
    );

    return mergedAgency;
  }
}

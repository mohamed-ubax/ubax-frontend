import { inject, Injectable, signal } from '@angular/core';
import {
  Api,
  type AdminHotelResponse,
  type UpdateSubscriptionRequest,
  activateHotel,
  listHotels,
  suspendHotel,
  updateHotelSubscription,
} from '@ubax-workspace/shared-api-types';
import { resolveHttpErrorMessage } from '@ubax-workspace/shared-data-access';
import {
  normalizeHotelPageResponse,
  normalizeHotelResponse,
} from '../admin-response.helpers';

@Injectable({ providedIn: 'root' })
export class AdminHotelsStore {
  private readonly api = inject(Api);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly hotels = signal<AdminHotelResponse[]>([]);
  readonly totalElements = signal(0);
  readonly totalPages = signal(0);

  async load(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      const raw = await this.api.invoke(listHotels, {
        pageable: { page: 0, size: 200 },
      });
      const page = normalizeHotelPageResponse(raw);
      this.hotels.set(page.items);
      this.totalElements.set(page.totalElements);
      this.totalPages.set(page.totalPages);
    } catch (error) {
      this.error.set(
        resolveHttpErrorMessage(error, 'Impossible de charger les hôtels.'),
      );
      throw error;
    } finally {
      this.loading.set(false);
    }
  }

  async activate(id: string): Promise<AdminHotelResponse> {
    this.error.set(null);
    try {
      const updated =
        normalizeHotelResponse(await this.api.invoke(activateHotel, { id })) ??
        {};
      const merged = this.merge(id, { ...updated, active: true, id });
      return merged;
    } catch (error) {
      this.error.set(
        resolveHttpErrorMessage(error, "Impossible d'activer l'hôtel."),
      );
      throw error;
    }
  }

  async suspend(id: string): Promise<AdminHotelResponse> {
    this.error.set(null);
    try {
      const updated =
        normalizeHotelResponse(await this.api.invoke(suspendHotel, { id })) ??
        {};
      const merged = this.merge(id, { ...updated, active: false, id });
      return merged;
    } catch (error) {
      this.error.set(
        resolveHttpErrorMessage(error, "Impossible de suspendre l'hôtel."),
      );
      throw error;
    }
  }

  async updateSubscription(
    id: string,
    body: UpdateSubscriptionRequest,
  ): Promise<AdminHotelResponse> {
    this.error.set(null);
    try {
      const updated =
        normalizeHotelResponse(
          await this.api.invoke(updateHotelSubscription, { id, body }),
        ) ?? {};
      return this.merge(id, { ...updated, id });
    } catch (error) {
      this.error.set(
        resolveHttpErrorMessage(
          error,
          "Impossible de mettre à jour l'abonnement de l'hôtel.",
        ),
      );
      throw error;
    }
  }

  private merge(
    id: string,
    patch: Partial<AdminHotelResponse>,
  ): AdminHotelResponse {
    let mergedHotel: AdminHotelResponse = patch as AdminHotelResponse;

    this.hotels.update((items) =>
      items.map((item) => {
        if (item.id !== id) {
          return item;
        }

        mergedHotel = { ...item, ...patch, id };
        return mergedHotel;
      }),
    );

    return mergedHotel;
  }
}

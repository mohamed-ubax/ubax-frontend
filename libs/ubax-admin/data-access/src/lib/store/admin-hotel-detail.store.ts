import { inject, Injectable, signal } from '@angular/core';
import {
  Api,
  type AdminHotelResponse,
  type ClientUserResponse,
  type PaymentResponse,
  type PropertyResponse,
  type ReservationResponse,
  type UpdateSubscriptionRequest,
  activateHotel,
  getHotelMembers,
  getInactiveHotelMembers,
  list3,
  listClients1,
  listHotelProperties,
  listHotels,
  listAll,
  suspendHotel,
  updateHotelSubscription,
} from '@ubax-workspace/shared-api-types';
import { resolveHttpErrorMessage } from '@ubax-workspace/shared-data-access';
import {
  normalizeHotelPageResponse,
  normalizeMemberCollection,
  readCollection,
  type MemberResponse,
} from '../admin-response.helpers';

function normalizeCollection<T>(raw: unknown): T[] {
  return readCollection(raw).filter((item): item is T => Boolean(item));
}

function sortByDate<T>(
  items: T[],
  selectors: Array<(item: T) => string | undefined>,
): T[] {
  return [...items].sort((left, right) => {
    const leftValue = selectors.map((selector) => selector(left)).find(Boolean);
    const rightValue = selectors
      .map((selector) => selector(right))
      .find(Boolean);

    return (
      new Date(rightValue ?? 0).getTime() - new Date(leftValue ?? 0).getTime()
    );
  });
}

@Injectable({ providedIn: 'root' })
export class AdminHotelDetailStore {
  private readonly api = inject(Api);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly hotel = signal<AdminHotelResponse | null>(null);
  readonly activeMembers = signal<MemberResponse[]>([]);
  readonly inactiveMembers = signal<MemberResponse[]>([]);
  readonly clients = signal<ClientUserResponse[]>([]);
  readonly properties = signal<PropertyResponse[]>([]);
  readonly reservations = signal<ReservationResponse[]>([]);
  readonly payments = signal<PaymentResponse[]>([]);

  async load(hotelId: string): Promise<void> {
    if (!hotelId) {
      this.hotel.set(null);
      this.error.set("Identifiant d'hôtel manquant.");
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    try {
      const [
        hotelsRaw,
        activeMembersRaw,
        inactiveMembersRaw,
        clientsRaw,
        propertiesRaw,
        reservationsRaw,
      ] = await Promise.all([
        this.api.invoke(listHotels, {
          pageable: { page: 0, size: 500, sort: ['createdAt,desc'] },
        }),
        this.api.invoke(getHotelMembers, { hotelId }),
        this.api.invoke(getInactiveHotelMembers, { hotelId }),
        this.api.invoke(listClients1, {
          hotelId,
          pageable: { page: 0, size: 500, sort: ['createdAt,desc'] },
        }),
        this.api.invoke(listHotelProperties, {
          hotelId,
          pageable: { page: 0, size: 500, sort: ['createdAt,desc'] },
        }),
        this.api.invoke(listAll, {
          pageable: { page: 0, size: 500, sort: ['createdAt,desc'] },
        }),
      ]);

      const hotel =
        normalizeHotelPageResponse(hotelsRaw).items.find(
          (item) => item.id === hotelId,
        ) ?? null;

      if (!hotel) {
        this.hotel.set(null);
        this.activeMembers.set([]);
        this.inactiveMembers.set([]);
        this.clients.set([]);
        this.properties.set([]);
        this.reservations.set([]);
        this.payments.set([]);
        this.error.set('Hôtel introuvable.');
        return;
      }

      const properties = normalizeCollection<PropertyResponse>(
        propertiesRaw,
      ).filter((property) => property.hotelId === hotelId);
      const reservations = normalizeCollection<ReservationResponse>(
        reservationsRaw,
      ).filter(
        (reservation) =>
          Boolean(reservation.propertyId) &&
          properties.some((property) => property.id === reservation.propertyId),
      );

      const propertyIds = [
        ...new Set(
          properties
            .map((property) => property.id)
            .filter((value): value is string => Boolean(value)),
        ),
      ];
      const paymentCollections = await Promise.all(
        propertyIds.map(async (propertyId) => {
          try {
            const raw = await this.api.invoke(list3, {
              propertyId,
              pageable: { page: 0, size: 100, sort: ['createdAt,desc'] },
            });

            return normalizeCollection<PaymentResponse>(raw).map((payment) => ({
              ...payment,
              propertyId: payment.propertyId ?? propertyId,
            }));
          } catch {
            return [] as PaymentResponse[];
          }
        }),
      );

      this.hotel.set(hotel);
      this.activeMembers.set(normalizeMemberCollection(activeMembersRaw));
      this.inactiveMembers.set(normalizeMemberCollection(inactiveMembersRaw));
      this.clients.set(normalizeCollection<ClientUserResponse>(clientsRaw));
      this.properties.set(properties);
      this.reservations.set(
        sortByDate(reservations, [
          (reservation) => reservation.confirmedAt,
          (reservation) => reservation.createdAt,
          (reservation) => reservation.updatedAt,
        ]),
      );
      this.payments.set(
        sortByDate(paymentCollections.flat(), [
          (payment) => payment.paidDate,
          (payment) => payment.createdAt,
          (payment) => payment.updatedAt,
        ]),
      );
    } catch (error) {
      this.hotel.set(null);
      this.error.set(
        resolveHttpErrorMessage(
          error,
          "Impossible de charger les détails de l'hôtel.",
        ),
      );
      throw error;
    } finally {
      this.loading.set(false);
    }
  }

  async activate(hotelId: string): Promise<AdminHotelResponse> {
    this.error.set(null);

    try {
      const updated = await this.api.invoke(activateHotel, { id: hotelId });
      this.hotel.set(updated ?? this.hotel());
      return (updated ?? this.hotel()) as AdminHotelResponse;
    } catch (error) {
      this.error.set(
        resolveHttpErrorMessage(error, "Impossible d'activer l'hôtel."),
      );
      throw error;
    }
  }

  async suspend(hotelId: string): Promise<AdminHotelResponse> {
    this.error.set(null);

    try {
      const updated = await this.api.invoke(suspendHotel, { id: hotelId });
      this.hotel.set(updated ?? this.hotel());
      return (updated ?? this.hotel()) as AdminHotelResponse;
    } catch (error) {
      this.error.set(
        resolveHttpErrorMessage(error, "Impossible de suspendre l'hôtel."),
      );
      throw error;
    }
  }

  async updateSubscription(
    hotelId: string,
    body: UpdateSubscriptionRequest,
  ): Promise<AdminHotelResponse> {
    this.error.set(null);

    try {
      const updated = await this.api.invoke(updateHotelSubscription, {
        id: hotelId,
        body,
      });
      this.hotel.set(updated ?? this.hotel());
      return (updated ?? this.hotel()) as AdminHotelResponse;
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
}

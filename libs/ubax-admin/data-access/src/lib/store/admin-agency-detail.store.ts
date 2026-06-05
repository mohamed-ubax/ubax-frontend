import { inject, Injectable, signal } from '@angular/core';
import {
  Api,
  type AdminAgencyResponse,
  type ClientUserResponse,
  type PaymentResponse,
  type PropertyResponse,
  type UpdateSubscriptionRequest,
  activateAgency,
  getAgencyMembers,
  getInactiveAgencyMembers,
  list3,
  listClients1,
  listAgencyProperties,
  listAgencies,
  suspendAgency,
  updateAgencySubscription,
} from '@ubax-workspace/shared-api-types';
import { resolveHttpErrorMessage } from '@ubax-workspace/shared-data-access';
import {
  normalizeAgencyPageResponse,
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
export class AdminAgencyDetailStore {
  private readonly api = inject(Api);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly agency = signal<AdminAgencyResponse | null>(null);
  readonly activeMembers = signal<MemberResponse[]>([]);
  readonly inactiveMembers = signal<MemberResponse[]>([]);
  readonly clients = signal<ClientUserResponse[]>([]);
  readonly properties = signal<PropertyResponse[]>([]);
  readonly payments = signal<PaymentResponse[]>([]);

  async load(agencyId: string): Promise<void> {
    if (!agencyId) {
      this.agency.set(null);
      this.error.set("Identifiant d'agence manquant.");
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    try {
      const [
        agenciesRaw,
        activeMembersRaw,
        inactiveMembersRaw,
        clientsRaw,
        propertiesRaw,
      ] = await Promise.all([
        this.api.invoke(listAgencies, {
          pageable: { page: 0, size: 500, sort: ['createdAt,desc'] },
        }),
        this.api.invoke(getAgencyMembers, { agencyId }),
        this.api.invoke(getInactiveAgencyMembers, { agencyId }),
        this.api.invoke(listClients1, {
          agencyId,
          pageable: { page: 0, size: 500, sort: ['createdAt,desc'] },
        }),
        this.api.invoke(listAgencyProperties, {
          agencyId,
          pageable: { page: 0, size: 500, sort: ['createdAt,desc'] },
        }),
      ]);

      const agency =
        normalizeAgencyPageResponse(agenciesRaw).items.find(
          (item) => item.id === agencyId,
        ) ?? null;

      if (!agency) {
        this.agency.set(null);
        this.activeMembers.set([]);
        this.inactiveMembers.set([]);
        this.clients.set([]);
        this.properties.set([]);
        this.payments.set([]);
        this.error.set('Agence introuvable.');
        return;
      }

      const properties = normalizeCollection<PropertyResponse>(
        propertiesRaw,
      ).filter((property) => property.agencyId === agencyId);

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

      this.agency.set(agency);
      this.activeMembers.set(normalizeMemberCollection(activeMembersRaw));
      this.inactiveMembers.set(normalizeMemberCollection(inactiveMembersRaw));
      this.clients.set(normalizeCollection<ClientUserResponse>(clientsRaw));
      this.properties.set(properties);
      this.payments.set(
        sortByDate(paymentCollections.flat(), [
          (payment) => payment.paidDate,
          (payment) => payment.createdAt,
          (payment) => payment.updatedAt,
        ]),
      );
    } catch (error) {
      this.agency.set(null);
      this.error.set(
        resolveHttpErrorMessage(
          error,
          "Impossible de charger les détails de l'agence.",
        ),
      );
      throw error;
    } finally {
      this.loading.set(false);
    }
  }

  async activate(agencyId: string): Promise<AdminAgencyResponse> {
    this.error.set(null);

    try {
      const updated = await this.api.invoke(activateAgency, { id: agencyId });
      this.agency.set(updated ?? this.agency());
      return (updated ?? this.agency()) as AdminAgencyResponse;
    } catch (error) {
      this.error.set(
        resolveHttpErrorMessage(error, "Impossible d'activer l'agence."),
      );
      throw error;
    }
  }

  async suspend(agencyId: string): Promise<AdminAgencyResponse> {
    this.error.set(null);

    try {
      const updated = await this.api.invoke(suspendAgency, { id: agencyId });
      this.agency.set(updated ?? this.agency());
      return (updated ?? this.agency()) as AdminAgencyResponse;
    } catch (error) {
      this.error.set(
        resolveHttpErrorMessage(error, "Impossible de suspendre l'agence."),
      );
      throw error;
    }
  }

  async updateSubscription(
    agencyId: string,
    body: UpdateSubscriptionRequest,
  ): Promise<AdminAgencyResponse> {
    this.error.set(null);

    try {
      const updated = await this.api.invoke(updateAgencySubscription, {
        id: agencyId,
        body,
      });
      this.agency.set(updated ?? this.agency());
      return (updated ?? this.agency()) as AdminAgencyResponse;
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
}

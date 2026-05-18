import type { ReservationPropertyCard } from './reservation.types';

export type OverviewPropertyCard = ReservationPropertyCard & {
  readonly reservationId: string;
};

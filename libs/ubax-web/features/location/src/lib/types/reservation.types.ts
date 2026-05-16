export type ReservationStatus = 'Confirmé' | 'En attente' | 'Annulé';
export type ReservationTone = 'success' | 'warning' | 'danger';
export type ReservationEventTone = 'green' | 'orange' | 'blue';
export type ReservationKpiTone = 'new' | 'arrival' | 'departure' | 'revenue';

export type ReservationKpiCard = {
  readonly tone: ReservationKpiTone;
  readonly label: string;
  readonly value: string;
  readonly delta: string;
  readonly caption: string;
  readonly icon: string;
  readonly trendIcon: string;
  readonly compactValue?: boolean;
};

export type ReservationAvailabilityMetric = {
  readonly label: string;
  readonly value: number;
  readonly tone: 'green' | 'orange' | 'blue' | 'red';
  readonly share: number;
};

export type ReservationPropertyCard = {
  readonly id: string;
  readonly badge: string;
  readonly title: string;
  readonly location: string;
  readonly tenantName: string;
  readonly tenantRole: string;
  readonly price: string;
  readonly image: string;
  readonly avatar: string;
};

export type CommercialOverviewSnapshot = {
  readonly month: Date;
  readonly newReservations: number;
  readonly arrivals: number;
  readonly departures: number;
  readonly totalRevenue: number;
  readonly newReservationsDelta: string;
  readonly arrivalsDelta: string;
  readonly departuresDelta: string;
  readonly totalRevenueDelta: string;
  readonly availability: readonly ReservationAvailabilityMetric[];
};

export type CommercialRevenuePoint = {
  readonly label: string;
  readonly month: Date;
  readonly value: number;
};

export type ReservationPricing = {
  readonly nightlyAmount: string;
  readonly nights: number;
  readonly subtotal: string;
  readonly cityTax: string;
  readonly total: string;
};

export type CommercialReservation = {
  readonly id: string;
  readonly code: string;
  readonly guest: string;
  readonly guestImage: string;
  readonly profileAvatar: string;
  readonly profileCover: string;
  readonly property: string;
  readonly propertyImage: string;
  readonly propertyLocation: string;
  readonly propertyCategory: string;
  readonly tenantName: string;
  readonly tenantRole: string;
  readonly price: string;
  readonly amount: string;
  readonly arrivalDate: Date;
  readonly departureDate: Date;
  readonly createdAt: Date;
  readonly durationLabel: string;
  readonly status: ReservationStatus;
  readonly tone: ReservationTone;
  readonly eventTone: ReservationEventTone;
  readonly phone: string;
  readonly email: string;
  readonly address: string;
  readonly reference: string;
  readonly paymentMethod: string;
  readonly paymentLogo: string;
  readonly amenities: readonly string[];
  readonly pricing: ReservationPricing;
  readonly searchIndex: string;
};

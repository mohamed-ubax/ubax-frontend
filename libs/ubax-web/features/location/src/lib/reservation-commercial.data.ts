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
  readonly compactValue?: boolean;};

export type ReservationAvailabilityMetric = {
  readonly label: string;
  readonly value: number;
  readonly tone: 'green' | 'orange' | 'blue' | 'red';
  readonly share: number;};

export type ReservationPropertyCard = {
  readonly id: string;
  readonly badge: string;
  readonly title: string;
  readonly location: string;
  readonly tenantName: string;
  readonly tenantRole: string;
  readonly price: string;
  readonly image: string;
  readonly avatar: string;};

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
  readonly availability: readonly ReservationAvailabilityMetric[];};

export type CommercialRevenuePoint = {
  readonly label: string;
  readonly month: Date;
  readonly value: number;};

export type ReservationPricing = {
  readonly nightlyAmount: string;
  readonly nights: number;
  readonly subtotal: string;
  readonly cityTax: string;
  readonly total: string;};

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
  readonly searchIndex: string;};

type CommercialReservationSeed = {
  readonly id: string;
  readonly code: string;
  readonly guest: string;
  readonly guestImage: string;
  readonly property: string;
  readonly propertyImage?: string;
  readonly propertyLocation: string;
  readonly propertyCategory: string;
  readonly tenantName: string;
  readonly tenantRole: string;
  readonly price: string;
  readonly amount: string;
  readonly arrivalDate: Date;
  readonly departureDate: Date;
  readonly createdAt: Date;
  readonly status: ReservationStatus;
  readonly tone: ReservationTone;
  readonly eventTone: ReservationEventTone;
  readonly phone: string;
  readonly email: string;
  readonly address: string;
  readonly reference: string;
  readonly paymentMethod: string;
  readonly paymentLogo?: string;
  readonly profileAvatar?: string;
  readonly profileCover?: string;
  readonly amenities?: readonly string[];
  readonly pricing?: ReservationPricing;};

const DAY_IN_MS = 24 * 60 * 60 * 1000;
const MONTHS = [
  'Janvier',
  'Février',
  'Mars',
  'Avril',
  'Mai',
  'Juin',
  'Juillet',
  'Août',
  'Septembre',
  'Octobre',
  'Novembre',
  'Décembre',
] as const;

const ASSET_ROOT = '/reservations/commercial';
const PEOPLE_ROOT = `${ASSET_ROOT}/people`;
const DETAIL_ROOT = `${ASSET_ROOT}/detail`;
const OVERVIEW_ROOT = `${ASSET_ROOT}/overview`;
const ICON_ROOT = `${ASSET_ROOT}/icons`;
const CLIENT_ICON_ROOT = '/client-detail/icons';

export const COMMERCIAL_ICON_ASSETS = {
  searchHeader: `${ICON_ROOT}/search-header.webp`,
  searchCard: `${ICON_ROOT}/search-card.webp`,
  kpiCalendar: `${ICON_ROOT}/kpi-calendar.webp`,
  kpiArrival: `${ICON_ROOT}/kpi-arrival.webp`,
  kpiRevenue: `${ICON_ROOT}/kpi-revenue.webp`,
  trendUpDark: `${ICON_ROOT}/trend-up-dark.webp`,
  trendUpGreen: `${ICON_ROOT}/trend-up-green.webp`,
  trendDownRed: `${ICON_ROOT}/trend-down-red.webp`,
  actionEye: `${ICON_ROOT}/action-eye.webp`,
  actionEdit: `${ICON_ROOT}/action-edit.webp`,
  locationFill: `${ICON_ROOT}/location-fill.webp`,
  idCard: `${ICON_ROOT}/id-card.webp`,
  check: `${ICON_ROOT}/check.webp`,
  calendar: `${CLIENT_ICON_ROOT}/calendar.svg`,
  export: `${ICON_ROOT}/export.webp`,
  toolbarCalendar: '/archivages/commercial/icons/calendar-toolbar.webp',
  selectChevron: '/archivages/commercial/icons/chevron-down.webp',
  phone: `${CLIENT_ICON_ROOT}/phone.svg`,
  mail: `${CLIENT_ICON_ROOT}/mail.svg`,
  wave: `${CLIENT_ICON_ROOT}/wave-logo.webp`,
  chevronLeft: '/calendar/icons/raphael_arrow_left.webp',
  chevronRight: '/calendar/icons/raphael_arrow_right.webp',
} as const;

function createDate(year: number, month: number, day: number): Date {
  return new Date(year, month - 1, day);
}

function pad(value: number): string {
  return value.toString().padStart(2, '0');
}

function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replaceAll(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function formatLongDate(date: Date): string {
  return `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

export function formatMonthLabel(date: Date): string {
  return `${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

export function formatShortDate(date: Date): string {
  return `${pad(date.getDate())} / ${pad(date.getMonth() + 1)} / ${date.getFullYear()}`;
}

export function formatDateRange(
  start: Date,
  end: Date,
  separator = ' - ',
): string {
  return `${formatShortDate(start)}${separator}${formatShortDate(end)}`;
}

export function formatFcfa(value: number): string {
  return `${new Intl.NumberFormat('fr-FR')
    .format(value)
    .replaceAll(/\u202f/g, ' ')} FCFA`;
}

function createDurationLabel(start: Date, end: Date): string {
  const totalDays = Math.max(
    1,
    Math.round((end.getTime() - start.getTime()) / DAY_IN_MS) + 1,
  );

  return `${totalDays} jour${totalDays > 1 ? 's' : ''}`;
}

function createSearchIndex(seed: CommercialReservationSeed): string {
  return normalizeText(
    [
      seed.guest,
      seed.property,
      seed.status,
      formatLongDate(seed.arrivalDate),
      formatLongDate(seed.departureDate),
      formatDateRange(seed.arrivalDate, seed.departureDate),
    ].join(' '),
  );
}

function createReservation(
  seed: CommercialReservationSeed,
): CommercialReservation {
  return {
    ...seed,
    profileAvatar: seed.profileAvatar ?? `${DETAIL_ROOT}/profile-avatar.webp`,
    profileCover: seed.profileCover ?? `${DETAIL_ROOT}/profile-cover.webp`,
    propertyImage: seed.propertyImage ?? `${DETAIL_ROOT}/property-main.webp`,
    paymentLogo: seed.paymentLogo ?? COMMERCIAL_ICON_ASSETS.wave,
    durationLabel: createDurationLabel(seed.arrivalDate, seed.departureDate),
    amenities: seed.amenities ?? [
      'Climatisation',
      'Climatisation',
      'Climatisation',
      'Climatisation',
      'Climatisation',
      'Climatisation',
    ],
    pricing: seed.pricing ?? {
      nightlyAmount: '120 000 FCFA',
      nights: 2,
      subtotal: '240 000 FCFA',
      cityTax: '2 000 FCFA / nuit',
      total: '244 000 FCFA TTC',
    },
    searchIndex: createSearchIndex(seed),
  };
}

export const COMMERCIAL_DISPLAY_MONTH = createDate(2026, 4, 1);
export const COMMERCIAL_ACTIVE_DATE = createDate(2026, 4, 18);
export const COMMERCIAL_DETAIL_RESERVATION_ID = '0245';

export const COMMERCIAL_PROPERTY_CARDS: readonly ReservationPropertyCard[] = [
  {
    id: 'kalia-01',
    badge: 'Location',
    title: 'Immeuble kalia',
    location: 'Abidjan, Cocody',
    tenantName: 'Aïcha Kouadio',
    tenantRole: 'Locataire',
    price: '400 000 FCFA',
    image: `${OVERVIEW_ROOT}/property-card-01.webp`,
    avatar: `${PEOPLE_ROOT}/guest-02.webp`,
  },
  {
    id: 'kalia-02',
    badge: 'Location',
    title: 'Immeuble kalia',
    location: 'Abidjan, Cocody',
    tenantName: 'Aïcha Kouadio',
    tenantRole: 'Locataire',
    price: '400 000 FCFA',
    image: `${OVERVIEW_ROOT}/property-card-02.webp`,
    avatar: `${PEOPLE_ROOT}/guest-03.webp`,
  },
] as const;

const COMMERCIAL_OVERVIEW_SNAPSHOTS: readonly CommercialOverviewSnapshot[] = [
  {
    month: createDate(2026, 1, 1),
    newReservations: 118,
    arrivals: 86,
    departures: 39,
    totalRevenue: 1650000,
    newReservationsDelta: '12.50 %',
    arrivalsDelta: '2.85 %',
    departuresDelta: '2.10 %',
    totalRevenueDelta: '2.70 %',
    availability: [
      { label: 'Occupés', value: 92, tone: 'green', share: 68 },
      { label: 'Réservés', value: 17, tone: 'orange', share: 16 },
      { label: 'Disponible', value: 82, tone: 'blue', share: 11 },
      { label: 'Pas prêts', value: 19, tone: 'red', share: 5 },
    ],
  },
  {
    month: createDate(2026, 2, 1),
    newReservations: 129,
    arrivals: 91,
    departures: 42,
    totalRevenue: 1890000,
    newReservationsDelta: '9.30 %',
    arrivalsDelta: '3.10 %',
    departuresDelta: '2.75 %',
    totalRevenueDelta: '3.15 %',
    availability: [
      { label: 'Occupés', value: 95, tone: 'green', share: 70 },
      { label: 'Réservés', value: 18, tone: 'orange', share: 14 },
      { label: 'Disponible', value: 79, tone: 'blue', share: 11 },
      { label: 'Pas prêts', value: 20, tone: 'red', share: 5 },
    ],
  },
  {
    month: createDate(2026, 3, 1),
    newReservations: 141,
    arrivals: 97,
    departures: 45,
    totalRevenue: 2100000,
    newReservationsDelta: '10.20 %',
    arrivalsDelta: '3.20 %',
    departuresDelta: '3.05 %',
    totalRevenueDelta: '3.25 %',
    availability: [
      { label: 'Occupés', value: 99, tone: 'green', share: 71 },
      { label: 'Réservés', value: 19, tone: 'orange', share: 15 },
      { label: 'Disponible', value: 76, tone: 'blue', share: 10 },
      { label: 'Pas prêts', value: 21, tone: 'red', share: 4 },
    ],
  },
  {
    month: createDate(2026, 4, 1),
    newReservations: 150,
    arrivals: 102,
    departures: 48,
    totalRevenue: 2250000,
    newReservationsDelta: '20 %',
    arrivalsDelta: '3.40 %',
    departuresDelta: '3.40 %',
    totalRevenueDelta: '3.40 %',
    availability: [
      { label: 'Occupés', value: 102, tone: 'green', share: 72 },
      { label: 'Réservés', value: 20, tone: 'orange', share: 15 },
      { label: 'Disponible', value: 75, tone: 'blue', share: 9 },
      { label: 'Pas prêts', value: 22, tone: 'red', share: 4 },
    ],
  },
] as const;

const COMMERCIAL_DEFAULT_OVERVIEW_SNAPSHOT =
  COMMERCIAL_OVERVIEW_SNAPSHOTS[COMMERCIAL_OVERVIEW_SNAPSHOTS.length - 1];

export function buildCommercialReservationKpis(
  snapshot: CommercialOverviewSnapshot,
): readonly ReservationKpiCard[] {
  return [
    {
      tone: 'new',
      label: 'Nouvelles réservations',
      value: snapshot.newReservations.toString(),
      delta: snapshot.newReservationsDelta,
      caption: 'la semaine dernière',
      icon: COMMERCIAL_ICON_ASSETS.kpiCalendar,
      trendIcon: COMMERCIAL_ICON_ASSETS.trendUpDark,
    },
    {
      tone: 'arrival',
      label: 'Arrivée',
      value: snapshot.arrivals.toString(),
      delta: snapshot.arrivalsDelta,
      caption: 'la semaine dernière',
      icon: COMMERCIAL_ICON_ASSETS.kpiArrival,
      trendIcon: COMMERCIAL_ICON_ASSETS.trendUpGreen,
    },
    {
      tone: 'departure',
      label: 'Départ',
      value: snapshot.departures.toString(),
      delta: snapshot.departuresDelta,
      caption: 'la semaine dernière',
      icon: COMMERCIAL_ICON_ASSETS.kpiArrival,
      trendIcon: COMMERCIAL_ICON_ASSETS.trendDownRed,
    },
    {
      tone: 'revenue',
      label: 'Revenus totaux',
      value: formatFcfa(snapshot.totalRevenue),
      delta: snapshot.totalRevenueDelta,
      caption: 'la semaine dernière',
      icon: COMMERCIAL_ICON_ASSETS.kpiRevenue,
      trendIcon: COMMERCIAL_ICON_ASSETS.trendUpGreen,
      compactValue: true,
    },
  ] as const;
}

export function resolveCommercialOverviewSnapshot(
  range: { readonly start: Date; readonly end: Date } | null,
): CommercialOverviewSnapshot {
  if (range === null) {
    return COMMERCIAL_DEFAULT_OVERVIEW_SNAPSHOT;
  }

  const targetYear = range.end.getFullYear();
  const targetMonth = range.end.getMonth();

  return (
    COMMERCIAL_OVERVIEW_SNAPSHOTS.find(
      (snapshot) =>
        snapshot.month.getFullYear() === targetYear &&
        snapshot.month.getMonth() === targetMonth,
    ) ?? COMMERCIAL_DEFAULT_OVERVIEW_SNAPSHOT
  );
}

export const COMMERCIAL_RESERVATION_KPIS = buildCommercialReservationKpis(
  COMMERCIAL_DEFAULT_OVERVIEW_SNAPSHOT,
);

export const COMMERCIAL_AVAILABILITY_METRICS =
  COMMERCIAL_DEFAULT_OVERVIEW_SNAPSHOT.availability;

export const COMMERCIAL_REVENUE_SERIES: readonly CommercialRevenuePoint[] = [
  { label: 'JAN', month: createDate(2026, 1, 1), value: 400000 },
  { label: 'FEB', month: createDate(2026, 2, 1), value: 860000 },
  { label: 'MAR', month: createDate(2026, 3, 1), value: 1540000 },
  { label: 'AVR', month: createDate(2026, 4, 1), value: 3500000 },
  { label: 'MAI', month: createDate(2026, 5, 1), value: 2400000 },
  { label: 'JUI', month: createDate(2026, 6, 1), value: 4200000 },
  { label: 'JUI', month: createDate(2026, 7, 1), value: 5100000 },
  { label: 'AOU', month: createDate(2026, 8, 1), value: 5800000 },
  { label: 'SEP', month: createDate(2026, 9, 1), value: 6600000 },
  { label: 'OCT', month: createDate(2026, 10, 1), value: 7100000 },
  { label: 'NOV', month: createDate(2026, 11, 1), value: 7900000 },
  { label: 'DEC', month: createDate(2026, 12, 1), value: 9200000 },
] as const;

export const COMMERCIAL_REVENUE_LABELS = COMMERCIAL_REVENUE_SERIES.map(
  (point) => point.label,
);

export const COMMERCIAL_REVENUE_VALUES = COMMERCIAL_REVENUE_SERIES.map(
  (point) => point.value,
);

export const COMMERCIAL_RESERVATIONS: readonly CommercialReservation[] = [
  createReservation({
    id: '0241',
    code: 'UBX-RSV-0241',
    guest: 'Koné Ibrahim',
    guestImage: `${PEOPLE_ROOT}/guest-01.webp`,
    property: 'Résidence Plateau',
    propertyLocation: 'Abidjan, Cocody',
    propertyCategory: 'Résidence',
    tenantName: 'Aïcha Kouadio',
    tenantRole: 'Locataire',
    price: '150 000 FCFA',
    amount: '150 000 FCFA',
    arrivalDate: createDate(2026, 4, 4),
    departureDate: createDate(2026, 4, 5),
    createdAt: createDate(2026, 1, 5),
    status: 'Confirmé',
    tone: 'success',
    eventTone: 'green',
    phone: '+225 07 58 23 41 89',
    email: 'kone.ibrahim@ubax.ci',
    address: 'Abidjan, Cocody',
    reference: 'UBX-LOC-0241',
    paymentMethod: 'Wave',
  }),
  createReservation({
    id: '0242',
    code: 'UBX-RSV-0242',
    guest: 'Olivier Konan',
    guestImage: `${PEOPLE_ROOT}/guest-04.webp`,
    property: 'Appartement meublé',
    propertyLocation: 'Abidjan, Plateau',
    propertyCategory: 'Appartement',
    tenantName: 'Aïcha Kouadio',
    tenantRole: 'Locataire',
    price: '150 000 FCFA',
    amount: '150 000 FCFA',
    arrivalDate: createDate(2026, 4, 1),
    departureDate: createDate(2026, 4, 2),
    createdAt: createDate(2026, 1, 7),
    status: 'Confirmé',
    tone: 'success',
    eventTone: 'orange',
    phone: '+225 05 45 21 10 16',
    email: 'olivier.konan@ubax.ci',
    address: 'Abidjan, Plateau',
    reference: 'UBX-LOC-0242',
    paymentMethod: 'Wave',
  }),
  createReservation({
    id: '0243',
    code: 'UBX-RSV-0243',
    guest: 'Aïcha Kouadio',
    guestImage: `${PEOPLE_ROOT}/guest-02.webp`,
    property: 'Villa Riviera',
    propertyLocation: 'Abidjan, Riviera',
    propertyCategory: 'Villa',
    tenantName: 'Kevin Kouassi',
    tenantRole: 'Locataire',
    price: '150 000 FCFA',
    amount: '150 000 FCFA',
    arrivalDate: createDate(2026, 4, 9),
    departureDate: createDate(2026, 4, 10),
    createdAt: createDate(2026, 1, 8),
    status: 'Confirmé',
    tone: 'success',
    eventTone: 'blue',
    phone: '+225 05 55 74 20 61',
    email: 'aicha.kouadio@ubax.ci',
    address: 'Abidjan, Riviera',
    reference: 'UBX-LOC-0243',
    paymentMethod: 'Wave',
  }),
  createReservation({
    id: COMMERCIAL_DETAIL_RESERVATION_ID,
    code: 'UBX-TDX-00245',
    guest: 'Mariam Koné',
    guestImage: `${DETAIL_ROOT}/profile-avatar.webp`,
    profileAvatar: `${DETAIL_ROOT}/profile-avatar.webp`,
    profileCover: `${DETAIL_ROOT}/profile-cover.webp`,
    property: 'Villa Soleil',
    propertyImage: `${DETAIL_ROOT}/property-main.webp`,
    propertyLocation: 'Abidjan Cocody',
    propertyCategory: 'Villa',
    tenantName: 'Aïcha Kouadio',
    tenantRole: 'Locataire',
    price: '200 000 FCFA',
    amount: '120 000 FCFA',
    arrivalDate: createDate(2026, 4, 26),
    departureDate: createDate(2026, 4, 30),
    createdAt: createDate(2025, 1, 12),
    status: 'Confirmé',
    tone: 'success',
    eventTone: 'orange',
    phone: '+225 07 58 23 41 89',
    email: 'jm.koffi@gmail.com',
    address: 'Abidjan, Cocody',
    reference: 'UBX-LOC-0245',
    paymentMethod: 'Wave',
    pricing: {
      nightlyAmount: '120 000 FCFA',
      nights: 5,
      subtotal: '600 000 FCFA',
      cityTax: '2 000 FCFA / nuit',
      total: '620 000 FCFA TTC',
    },
  }),
  createReservation({
    id: '0246',
    code: 'UBX-RSV-0246',
    guest: 'Patrick Koffi',
    guestImage: `${PEOPLE_ROOT}/guest-03.webp`,
    property: 'Résidence Plateau',
    propertyLocation: 'Abidjan, Plateau',
    propertyCategory: 'Résidence',
    tenantName: 'Patrick Koffi',
    tenantRole: 'Locataire',
    price: '150 000 FCFA',
    amount: '150 000 FCFA',
    arrivalDate: createDate(2026, 4, 14),
    departureDate: createDate(2026, 4, 18),
    createdAt: createDate(2026, 1, 14),
    status: 'Confirmé',
    tone: 'success',
    eventTone: 'green',
    phone: '+225 07 43 61 10 19',
    email: 'patrick.koffi@ubax.ci',
    address: 'Abidjan, Plateau',
    reference: 'UBX-LOC-0246',
    paymentMethod: 'Wave',
  }),
  createReservation({
    id: '0247',
    code: 'UBX-RSV-0247',
    guest: 'Kevin Kouassi',
    guestImage: `${PEOPLE_ROOT}/guest-05.webp`,
    property: 'Villa Riviera',
    propertyLocation: 'Abidjan, Riviera',
    propertyCategory: 'Villa',
    tenantName: 'Kevin Kouassi',
    tenantRole: 'Locataire',
    price: '150 000 FCFA',
    amount: '150 000 FCFA',
    arrivalDate: createDate(2026, 4, 16),
    departureDate: createDate(2026, 4, 18),
    createdAt: createDate(2026, 1, 16),
    status: 'En attente',
    tone: 'warning',
    eventTone: 'blue',
    phone: '+225 01 01 52 84 10',
    email: 'kevin.kouassi@ubax.ci',
    address: 'Abidjan, Riviera',
    reference: 'UBX-LOC-0247',
    paymentMethod: 'Wave',
  }),
  createReservation({
    id: '0248',
    code: 'UBX-RSV-0248',
    guest: 'Armand Tano',
    guestImage: `${PEOPLE_ROOT}/guest-06.webp`,
    property: 'Villa Riviera',
    propertyLocation: 'Abidjan, Riviera',
    propertyCategory: 'Villa',
    tenantName: 'Armand Tano',
    tenantRole: 'Locataire',
    price: '150 000 FCFA',
    amount: '150 000 FCFA',
    arrivalDate: createDate(2026, 4, 20),
    departureDate: createDate(2026, 4, 21),
    createdAt: createDate(2026, 1, 20),
    status: 'Confirmé',
    tone: 'success',
    eventTone: 'blue',
    phone: '+225 05 09 91 82 44',
    email: 'armand.tano@ubax.ci',
    address: 'Abidjan, Riviera',
    reference: 'UBX-LOC-0248',
    paymentMethod: 'Wave',
  }),
  createReservation({
    id: '0249',
    code: 'UBX-RSV-0249',
    guest: 'Fanta Diallo',
    guestImage: `${PEOPLE_ROOT}/guest-02.webp`,
    property: 'Résidence Plateau',
    propertyLocation: 'Abidjan, Cocody',
    propertyCategory: 'Résidence',
    tenantName: 'Aïcha Kouadio',
    tenantRole: 'Locataire',
    price: '150 000 FCFA',
    amount: '150 000 FCFA',
    arrivalDate: createDate(2026, 4, 22),
    departureDate: createDate(2026, 4, 23),
    createdAt: createDate(2026, 1, 22),
    status: 'Confirmé',
    tone: 'success',
    eventTone: 'green',
    phone: '+225 07 88 63 11 07',
    email: 'fanta.diallo@ubax.ci',
    address: 'Abidjan, Cocody',
    reference: 'UBX-LOC-0249',
    paymentMethod: 'Wave',
  }),
  createReservation({
    id: '0250',
    code: 'UBX-RSV-0250',
    guest: 'Nadia Kouassi',
    guestImage: `${PEOPLE_ROOT}/guest-05.webp`,
    property: 'Appartement meublé',
    propertyLocation: 'Abidjan, Angré',
    propertyCategory: 'Appartement',
    tenantName: 'Aïcha Kouadio',
    tenantRole: 'Locataire',
    price: '150 000 FCFA',
    amount: '150 000 FCFA',
    arrivalDate: createDate(2026, 4, 28),
    departureDate: createDate(2026, 4, 29),
    createdAt: createDate(2026, 1, 24),
    status: 'Confirmé',
    tone: 'success',
    eventTone: 'orange',
    phone: '+225 05 85 41 17 55',
    email: 'nadia.kouassi@ubax.ci',
    address: 'Abidjan, Angré',
    reference: 'UBX-LOC-0250',
    paymentMethod: 'Wave',
  }),
  createReservation({
    id: '0251',
    code: 'UBX-RSV-0251',
    guest: 'Serge N’Guessan',
    guestImage: `${PEOPLE_ROOT}/guest-03.webp`,
    property: 'Villa Riviera',
    propertyLocation: 'Abidjan, Riviera',
    propertyCategory: 'Villa',
    tenantName: 'Patrick Koffi',
    tenantRole: 'Locataire',
    price: '150 000 FCFA',
    amount: '150 000 FCFA',
    arrivalDate: createDate(2026, 4, 24),
    departureDate: createDate(2026, 4, 25),
    createdAt: createDate(2026, 1, 26),
    status: 'Annulé',
    tone: 'danger',
    eventTone: 'blue',
    phone: '+225 01 43 87 10 15',
    email: 'serge.nguessan@ubax.ci',
    address: 'Abidjan, Riviera',
    reference: 'UBX-LOC-0251',
    paymentMethod: 'Wave',
  }),
  createReservation({
    id: '0252',
    code: 'UBX-RSV-0252',
    guest: 'Aissatou Diallo',
    guestImage: `${PEOPLE_ROOT}/guest-01.webp`,
    property: 'Résidence Plateau',
    propertyLocation: 'Abidjan, Cocody',
    propertyCategory: 'Résidence',
    tenantName: 'Aïcha Kouadio',
    tenantRole: 'Locataire',
    price: '150 000 FCFA',
    amount: '150 000 FCFA',
    arrivalDate: createDate(2026, 4, 18),
    departureDate: createDate(2026, 4, 20),
    createdAt: createDate(2026, 1, 27),
    status: 'Confirmé',
    tone: 'success',
    eventTone: 'green',
    phone: '+225 05 45 61 10 51',
    email: 'aissatou.diallo@ubax.ci',
    address: 'Abidjan, Cocody',
    reference: 'UBX-LOC-0252',
    paymentMethod: 'Wave',
  }),
  createReservation({
    id: '0253',
    code: 'UBX-RSV-0253',
    guest: 'Flore Bamba',
    guestImage: `${PEOPLE_ROOT}/guest-04.webp`,
    property: 'Villa Riviera',
    propertyLocation: 'Abidjan, Riviera',
    propertyCategory: 'Villa',
    tenantName: 'Kevin Kouassi',
    tenantRole: 'Locataire',
    price: '150 000 FCFA',
    amount: '150 000 FCFA',
    arrivalDate: createDate(2026, 4, 29),
    departureDate: createDate(2026, 4, 30),
    createdAt: createDate(2026, 1, 29),
    status: 'En attente',
    tone: 'warning',
    eventTone: 'blue',
    phone: '+225 07 51 49 83 44',
    email: 'flore.bamba@ubax.ci',
    address: 'Abidjan, Riviera',
    reference: 'UBX-LOC-0253',
    paymentMethod: 'Wave',
  }),
] as const;

export function filterReservations(
  reservations: readonly CommercialReservation[],
  query: string,
  range: { readonly start: Date; readonly end: Date } | null,
  propertyCategory: string | null = null,
): CommercialReservation[] {
  const normalizedQuery = normalizeText(query);
  const rangeStart = range ? startOfDay(range.start) : null;
  const rangeEnd = range ? startOfDay(range.end) : null;

  return reservations.filter((reservation) => {
    const matchesQuery =
      normalizedQuery.length === 0 ||
      reservation.searchIndex.includes(normalizedQuery);
    const matchesRange =
      rangeStart === null ||
      rangeEnd === null ||
      (startOfDay(reservation.arrivalDate) <= rangeEnd &&
        startOfDay(reservation.departureDate) >= rangeStart);
    const matchesPropertyCategory =
      propertyCategory === null ||
      propertyCategory.length === 0 ||
      reservation.propertyCategory === propertyCategory;

    return matchesQuery && matchesRange && matchesPropertyCategory;
  });
}

export function getReservationById(
  reservationId: string | null,
): CommercialReservation {
  if (reservationId) {
    const match = COMMERCIAL_RESERVATIONS.find(
      (reservation) => reservation.id === reservationId,
    );

    if (match) {
      return match;
    }
  }

  return (
    COMMERCIAL_RESERVATIONS.find(
      (reservation) => reservation.id === COMMERCIAL_DETAIL_RESERVATION_ID,
    ) ?? COMMERCIAL_RESERVATIONS[0]
  );
}

export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

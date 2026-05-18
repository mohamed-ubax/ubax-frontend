import type { DateRange } from '@ubax-workspace/shared-ui';
import type {
  DashboardCommercialActivityOption,
  DashboardCommercialActivityPeriod,
  DashboardCommercialActivitySnapshot,
  DashboardCommercialPlanningEventRecord,
  DashboardCommercialPlanningEventView,
  DashboardCommercialPlanningRecordInput,
  DashboardCommercialPlanningTimeLabel,
  DashboardCommercialPropertyCard,
  DashboardCommercialPropertyCardInput,
  DashboardCommercialStateTone,
} from '../types/dashboard-commercial.types';

export const DASHBOARD_COMMERCIAL_ASSET_ROOT = 'dashboard-commercial';
export const PLANNING_BASE_WEEK_START = parseLocalDate('2026-03-02');
export const PROSPECT_AXIS_VALUES = [0, 10, 20, 30, 50, 100] as const;
export const STATE_TONE_COLORS: Record<DashboardCommercialStateTone, string> = {
  orange: '#E87D1E',
  blue: '#2388FF',
  red: '#FF383C',
  green: '#1FB85C',
};

const FRENCH_WEEKDAY_FORMATTER = new Intl.DateTimeFormat('fr-FR', {
  weekday: 'long',
});
const FRENCH_LONG_DATE_FORMATTER = new Intl.DateTimeFormat('fr-FR', {
  day: '2-digit',
  month: 'long',
  year: 'numeric',
});
const FRENCH_SHORT_DATE_FORMATTER = new Intl.DateTimeFormat('fr-FR', {
  day: '2-digit',
  month: '2-digit',
  year: '2-digit',
});

export function dashboardCommercialAsset(file: string): string {
  return `${DASHBOARD_COMMERCIAL_ASSET_ROOT}/${file}`;
}

export function parseLocalDate(value: string): Date {
  return new Date(`${value}T00:00:00`);
}

export function addDays(date: Date, offset: number): Date {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + offset);
  return nextDate;
}

export function startOfWeek(date: Date): Date {
  const nextDate = new Date(date);
  const day = nextDate.getDay();
  const offset = day === 0 ? -6 : 1 - day;

  nextDate.setHours(0, 0, 0, 0);
  nextDate.setDate(nextDate.getDate() + offset);

  return nextDate;
}

export function formatIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

export function normalize(value: string): string {
  return value.trim().toLowerCase();
}

export function matchesDashboardSearch(term: string, ...parts: string[]): boolean {
  return parts.some((part) => normalize(part).includes(term));
}

export function isEventWithinRange(date: Date, range: DateRange | null): boolean {
  if (!range) {
    return true;
  }

  const timestamp = new Date(date).setHours(0, 0, 0, 0);
  const start = new Date(range.start).setHours(0, 0, 0, 0);
  const end = new Date(range.end).setHours(0, 0, 0, 0);

  return timestamp >= start && timestamp <= end;
}

export function formatFrenchWeekday(date: Date): string {
  const label = FRENCH_WEEKDAY_FORMATTER.format(date);
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function formatFrenchLongDate(date: Date): string {
  return FRENCH_LONG_DATE_FORMATTER.format(date);
}

// Private: not used directly by the component
function resolvePlanningArrowVariant(
  status: DashboardCommercialPlanningEventRecord['status'],
): string {
  if (status === 'confirmed') {
    return 'confirmed';
  }

  if (status === 'upcoming') {
    return 'upcoming';
  }

  return 'cancelled';
}

// Private: used only within this file to build PLANNING_EVENT_RECORDS
function createPlanningRecord(
  record: DashboardCommercialPlanningRecordInput,
): DashboardCommercialPlanningEventRecord {
  return {
    ...record,
    route: record.route ?? '/demandes/commercial',
  };
}

export function createPlanningEventView(
  record: DashboardCommercialPlanningEventRecord,
): DashboardCommercialPlanningEventView {
  const visualDurationHours =
    record.durationHours === 1 ? 2 : record.durationHours;

  return {
    id: record.id,
    customer: record.customer,
    property: record.property,
    dateKey: record.date,
    startHour: record.startHour,
    avatarSrc: dashboardCommercialAsset(`people/${record.avatarFile}`),
    arrowSrc: dashboardCommercialAsset(
      `icons/event-arrow-${resolvePlanningArrowVariant(record.status)}.webp`,
    ),
    status: record.status,
    startClass: `planning-event--start-${String(record.startHour).padStart(2, '0')}`,
    spanClass: `planning-event--span-${visualDurationHours}`,
    route: record.route,
  };
}

// Private: used only within this file to build PROPERTY_CARDS
function createPropertyCard(
  card: DashboardCommercialPropertyCardInput,
): DashboardCommercialPropertyCard {
  return {
    id: card.id,
    imageSrc: dashboardCommercialAsset(`properties/${card.propertyFile}`),
    ownerAvatarSrc: dashboardCommercialAsset(`people/${card.ownerFile}`),
    title: card.title,
    location: card.location,
    owner: card.owner,
    role: card.role,
    price: card.price,
    badge: card.badge,
    route: `/biens/${card.id}`,
  };
}

export const PLANNING_TIME_LABELS: readonly DashboardCommercialPlanningTimeLabel[] = [
  { label: '08 : 00', hour: 8 },
  { label: '09 : 00', hour: 9 },
  { label: '10 : 00', hour: 10 },
  { label: '11 : 00', hour: 11 },
  { label: '12 : 00', hour: 12 },
  { label: '13 : 00', hour: 13 },
  { label: '14 : 00', hour: 14 },
  { label: '15 : 00', hour: 15 },
  { label: '16 : 00', hour: 16 },
  { label: '17 : 00', hour: 17 },
  { label: '18 : 00', hour: 18 },
];

export const PLANNING_EVENT_RECORDS: readonly DashboardCommercialPlanningEventRecord[] =
  [
    createPlanningRecord({
      id: 'rdv-01',
      customer: 'Konan Olivier',
      property: 'Immeuble Kalia',
      date: '2026-03-02',
      startHour: 8,
      durationHours: 1,
      avatarFile: 'event-avatar-01.webp',
      status: 'confirmed',
    }),
    createPlanningRecord({
      id: 'rdv-02',
      customer: 'Mariam Traoré',
      property: 'Villa Riviera 3',
      date: '2026-03-02',
      startHour: 11,
      durationHours: 2,
      avatarFile: 'event-avatar-10.webp',
      status: 'cancelled',
    }),
    createPlanningRecord({
      id: 'rdv-03',
      customer: 'Yao Didier',
      property: 'Résidence Plateau',
      date: '2026-03-03',
      startHour: 9,
      durationHours: 2,
      avatarFile: 'event-avatar-02.webp',
      status: 'confirmed',
    }),
    createPlanningRecord({
      id: 'rdv-04',
      customer: 'Aïcha Kouadio',
      property: 'Immeuble Kalia',
      date: '2026-03-03',
      startHour: 15,
      durationHours: 2,
      avatarFile: 'event-avatar-11.webp',
      status: 'cancelled',
    }),
    createPlanningRecord({
      id: 'rdv-05',
      customer: 'Koffi Serge',
      property: 'Villa Riviera 3',
      date: '2026-03-04',
      startHour: 12,
      durationHours: 1,
      avatarFile: 'event-avatar-07.webp',
      status: 'confirmed',
    }),
    createPlanningRecord({
      id: 'rdv-06',
      customer: 'Fanta Bamba',
      property: 'Résidence Lagune',
      date: '2026-03-04',
      startHour: 16,
      durationHours: 2,
      avatarFile: 'event-avatar-09.webp',
      status: 'confirmed',
    }),
    createPlanningRecord({
      id: 'rdv-07',
      customer: 'Koné Ibrahim',
      property: 'Immeuble Kalia',
      date: '2026-03-05',
      startHour: 8,
      durationHours: 2,
      avatarFile: 'event-avatar-03.webp',
      status: 'confirmed',
    }),
    createPlanningRecord({
      id: 'rdv-08',
      customer: 'Moussa Kaboré',
      property: 'Résidence Plateau',
      date: '2026-03-05',
      startHour: 13,
      durationHours: 2,
      avatarFile: 'event-avatar-08.webp',
      status: 'cancelled',
    }),
    createPlanningRecord({
      id: 'rdv-09',
      customer: 'Rokia Diabaté',
      property: 'Résidence Lagune',
      date: '2026-03-06',
      startHour: 10,
      durationHours: 2,
      avatarFile: 'event-avatar-04.webp',
      status: 'upcoming',
    }),
    createPlanningRecord({
      id: 'rdv-10',
      customer: 'Kouamé Patrick',
      property: 'Villa Riviera 3',
      date: '2026-03-06',
      startHour: 15,
      durationHours: 1,
      avatarFile: 'event-avatar-05.webp',
      status: 'upcoming',
    }),
    createPlanningRecord({
      id: 'rdv-11',
      customer: 'Fatou Nguessan',
      property: 'Immeuble Kalia',
      date: '2026-03-07',
      startHour: 9,
      durationHours: 1,
      avatarFile: 'event-avatar-06.webp',
      status: 'upcoming',
    }),
    createPlanningRecord({
      id: 'rdv-12',
      customer: 'Konan Olivier',
      property: 'Villa Riviera 3',
      date: '2026-03-07',
      startHour: 14,
      durationHours: 2,
      avatarFile: 'event-avatar-01.webp',
      status: 'confirmed',
    }),
    createPlanningRecord({
      id: 'rdv-13',
      customer: 'Amandine Kassi',
      property: 'Résidence Plateau',
      date: '2026-03-08',
      startHour: 11,
      durationHours: 2,
      avatarFile: 'event-avatar-02.webp',
      status: 'confirmed',
    }),
    createPlanningRecord({
      id: 'rdv-14',
      customer: 'Jean Gohi',
      property: 'Résidence Lagune',
      date: '2026-03-08',
      startHour: 16,
      durationHours: 1,
      avatarFile: 'event-avatar-03.webp',
      status: 'upcoming',
    }),
  ];

export const ACTIVITY_OPTIONS: readonly DashboardCommercialActivityOption[] = [
  { label: 'Semaine', value: 'week' },
  { label: 'Mois', value: 'month' },
  { label: 'Trimestre', value: 'quarter' },
];

export const ACTIVITY_SNAPSHOTS: Record<
  DashboardCommercialActivityPeriod,
  DashboardCommercialActivitySnapshot
> = {
  week: {
    totalProperties: 45,
    newProspects: 15,
    closedDeals: 8,
    highlightedProspectCode: 'ven',
    prospects: [
      { code: 'lun', label: 'LUN', value: 42 },
      { code: 'mar', label: 'MAR', value: 53 },
      { code: 'mer', label: 'MER', value: 40 },
      { code: 'jeu', label: 'JEU', value: 50 },
      { code: 'ven', label: 'VEN', value: 64 },
      { code: 'sam', label: 'SAM', value: 56 },
      { code: 'dim', label: 'DIM', value: 42 },
    ],
    stateItems: [
      { label: 'Annonces actives', value: 10, tone: 'orange' },
      { label: 'Biens Loués', value: 23, tone: 'blue' },
      { label: 'Biens en entretien', value: 4, tone: 'red' },
      { label: 'Biens Vendus', value: 8, tone: 'green' },
    ],
  },
  month: {
    totalProperties: 45,
    newProspects: 28,
    closedDeals: 12,
    highlightedProspectCode: 'jeu',
    prospects: [
      { code: 'lun', label: 'LUN', value: 58 },
      { code: 'mar', label: 'MAR', value: 61 },
      { code: 'mer', label: 'MER', value: 55 },
      { code: 'jeu', label: 'JEU', value: 74 },
      { code: 'ven', label: 'VEN', value: 68 },
      { code: 'sam', label: 'SAM', value: 49 },
      { code: 'dim', label: 'DIM', value: 46 },
    ],
    stateItems: [
      { label: 'Annonces actives', value: 12, tone: 'orange' },
      { label: 'Biens Loués', value: 21, tone: 'blue' },
      { label: 'Biens en entretien', value: 4, tone: 'red' },
      { label: 'Biens Vendus', value: 8, tone: 'green' },
    ],
  },
  quarter: {
    totalProperties: 45,
    newProspects: 64,
    closedDeals: 19,
    highlightedProspectCode: 'sam',
    prospects: [
      { code: 'lun', label: 'LUN', value: 67 },
      { code: 'mar', label: 'MAR', value: 71 },
      { code: 'mer', label: 'MER', value: 63 },
      { code: 'jeu', label: 'JEU', value: 76 },
      { code: 'ven', label: 'VEN', value: 82 },
      { code: 'sam', label: 'SAM', value: 88 },
      { code: 'dim', label: 'DIM', value: 59 },
    ],
    stateItems: [
      { label: 'Annonces actives', value: 14, tone: 'orange' },
      { label: 'Biens Loués', value: 19, tone: 'blue' },
      { label: 'Biens en entretien', value: 3, tone: 'red' },
      { label: 'Biens Vendus', value: 9, tone: 'green' },
    ],
  },
};

export const PROPERTY_CARDS: readonly DashboardCommercialPropertyCard[] = [
  createPropertyCard({
    id: '1',
    propertyFile: 'property-01.webp',
    ownerFile: 'property-owner-01.webp',
    title: 'Immeuble Kalia',
    location: 'Abidjan, Cocody',
    owner: 'Aïcha Kouadio',
    role: 'Locataire',
    price: '400 000 FCFA',
    badge: 'Location',
  }),
  createPropertyCard({
    id: '2',
    propertyFile: 'property-02.webp',
    ownerFile: 'property-owner-02.webp',
    title: 'Villa Riviera 3',
    location: 'Abidjan, Riviera',
    owner: 'Mariam Touré',
    role: 'Bailleur',
    price: '650 000 FCFA',
    badge: 'Location',
  }),
  createPropertyCard({
    id: '3',
    propertyFile: 'property-03.webp',
    ownerFile: 'property-owner-03.webp',
    title: 'Résidence Lagune',
    location: 'Abidjan, Marcory',
    owner: 'Fanta Bamba',
    role: 'Locataire',
    price: '520 000 FCFA',
    badge: 'Location',
  }),
];

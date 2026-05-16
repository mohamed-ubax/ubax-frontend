import type { CommercialRequestDetail } from '../types/demandes.types';
import type {
  CalendarDay,
  CommercialNotificationItem,
  CommercialRequestRow,
  CommercialVisitCard,
  SummaryMetric,
} from '../types/demandes-commercial.types';

export const COMMERCIAL_ASSET_ROOT = '/demandes/commercial';

export const COMMERCIAL_METRIC_CARDS: readonly SummaryMetric[] = [
  {
    label: "Requêtes",
    value: 50,
    accent: 'var(--ubax-info)',
    iconBackground: 'var(--ubax-blue-soft)',
    icon: `${COMMERCIAL_ASSET_ROOT}/request-icon.webp`,
  },
  {
    label: 'Demande de visite',
    value: 25,
    accent: 'var(--ubax-accent)',
    iconBackground: 'var(--ubax-peach-soft)',
    icon: `${COMMERCIAL_ASSET_ROOT}/visit-icon.webp`,
  },
];

export const COMMERCIAL_CALENDAR_WEEKDAYS: readonly string[] = [
  'Lu',
  'Ma',
  'Me',
  'Je',
  'Ve',
  'Sa',
  'Di',
];

export const COMMERCIAL_CALENDAR_WEEKS: readonly (readonly CalendarDay[])[] = [
  [
    { label: '1' },
    { label: '2' },
    { label: '3' },
    { label: '4' },
    { label: '5' },
    { label: '6' },
    { label: '7' },
  ],
  [
    { label: '8' },
    { label: '9' },
    { label: '10' },
    { label: '11' },
    { label: '12' },
    { label: '13' },
    { label: '14' },
  ],
  [
    { label: '15' },
    { label: '16' },
    { label: '17' },
    { label: '18', isActive: true },
    { label: '19' },
    { label: '20' },
    { label: '21' },
  ],
  [
    { label: '22' },
    { label: '23' },
    { label: '24' },
    { label: '25' },
    { label: '26' },
    { label: '27' },
    { label: '28' },
  ],
  [
    { label: '29' },
    { label: '30' },
    { label: '1', isMuted: true },
    { label: '2', isMuted: true },
    { label: '3', isMuted: true },
    { label: '4', isMuted: true },
    { label: '5', isMuted: true },
  ],
];

export const COMMERCIAL_CALENDAR_ICONS = {
  previous: `${COMMERCIAL_ASSET_ROOT}/calendar-chevron-left.webp`,
  next: `${COMMERCIAL_ASSET_ROOT}/calendar-chevron-right.webp`,
} as const;

export const COMMERCIAL_REQUEST_ACTION_ICON = `${COMMERCIAL_ASSET_ROOT}/request-arrow.webp`;
export const COMMERCIAL_OVERLAY_CLOSE_ICON = `${COMMERCIAL_ASSET_ROOT}/overlay-close.webp`;
export const COMMERCIAL_NOTIFICATION_BELL_ICON = `${COMMERCIAL_ASSET_ROOT}/notification-bell.webp`;
export const COMMERCIAL_VISIT_META_ICONS = {
  home: `${COMMERCIAL_ASSET_ROOT}/visit-home.webp`,
  clock: `${COMMERCIAL_ASSET_ROOT}/visit-clock.webp`,
} as const;

const COMMERCIAL_REQUEST_DETAIL: CommercialRequestDetail = {
  firstName: 'Mariam',
  lastName: "Koné",
  phone: '+225 07 58 23 41 89',
  property: 'Immeuble Kalia',
  requestType: 'Location',
  date: '14 / 11 / 2026',
  requestTitle: "Plus d'infos SVP",
  requestMessage: [
    'Bonjour,',
    "Je souhaiterais obtenir davantage d'informations",
    'concernant ce bien (caractéristiques, prix et conditions).',
    'Merci de bien vouloir me recontacter dès que possible.',
    'Cordialement.',
  ],
  replyTitle: 'Titre de la reponse',
  replyMessage: 'Bonjour ...',
};

export const COMMERCIAL_REQUEST_ROWS: readonly CommercialRequestRow[] =
  Array.from({ length: 9 }, (_, index) => ({
    id: `request-${index + 1}`,
    client: 'Mariam Koné',
    property: 'Immeuble kalia',
    requestType: 'Location',
    summary: "Plus d'infos SVP",
    date: '14/11/2026',
    detail: COMMERCIAL_REQUEST_DETAIL,
  }));

export const COMMERCIAL_VISIT_CARDS: readonly CommercialVisitCard[] = [
  {
    id: 'visit-01',
    client: 'Armand Tano',
    phone: '+225 07 58 23 41 89',
    location: "Résidence Kalia - Appartement  0014",
    schedule: '14/04/2026     12:00  -  13:00',
    avatar: `${COMMERCIAL_ASSET_ROOT}/visit-avatar-01.webp`,
  },
  {
    id: 'visit-02',
    client: 'Armand Tano',
    phone: '+225 07 58 23 41 89',
    location: "Résidence Kalia - Appartement  0014",
    schedule: '14/04/2026     12:00  -  13:00',
    avatar: `${COMMERCIAL_ASSET_ROOT}/visit-avatar-02.webp`,
  },
  {
    id: 'visit-03',
    client: 'Armand Tano',
    phone: '+225 07 58 23 41 89',
    location: "Résidence Kalia - Appartement  0014",
    schedule: '14/04/2026     12:00  -  13:00',
    avatar: `${COMMERCIAL_ASSET_ROOT}/visit-avatar-03.webp`,
  },
  {
    id: 'visit-04',
    client: 'Armand Tano',
    phone: '+225 07 58 23 41 89',
    location: "Résidence Kalia - Appartement  0014",
    schedule: '14/04/2026     12:00  -  13:00',
    avatar: `${COMMERCIAL_ASSET_ROOT}/visit-avatar-04.webp`,
  },
  {
    id: 'visit-05',
    client: 'Armand Tano',
    phone: '+225 07 58 23 41 89',
    location: "Résidence Kalia - Appartement  0014",
    schedule: '14/04/2026     12:00  -  13:00',
    avatar: `${COMMERCIAL_ASSET_ROOT}/visit-avatar-05.webp`,
  },
  {
    id: 'visit-06',
    client: 'Armand Tano',
    phone: '+225 07 58 23 41 89',
    location: "Résidence Kalia - Appartement  0014",
    schedule: '14/04/2026     12:00  -  13:00',
    avatar: `${COMMERCIAL_ASSET_ROOT}/visit-avatar-06.webp`,
  },
  {
    id: 'visit-07',
    client: 'Armand Tano',
    phone: '+225 07 58 23 41 89',
    location: "Résidence Kalia - Appartement  0014",
    schedule: '14/04/2026     12:00  -  13:00',
    avatar: `${COMMERCIAL_ASSET_ROOT}/visit-avatar-07.webp`,
  },
  {
    id: 'visit-08',
    client: 'Armand Tano',
    phone: '+225 07 58 23 41 89',
    location: "Résidence Kalia - Appartement  0014",
    schedule: '14/04/2026     12:00  -  13:00',
    avatar: `${COMMERCIAL_ASSET_ROOT}/visit-avatar-03.webp`,
  },
];

export const COMMERCIAL_NOTIFICATIONS: readonly CommercialNotificationItem[] = [
  {
    id: 'notification-01',
    title: "Nouvelle demande d'information",
    message:
      "Laura Koné a demandé plus d'informations sur Appartement Riviera Palmeraie",
    time: 'il y a 2 minutes',
  },
  {
    id: 'notification-02',
    title: 'demande de visite',
    message:
      "Laura Koné a demandé plus d'informations sur Appartement Riviera Palmeraie",
    time: 'il y a 12 minutes',
  },
  {
    id: 'notification-03',
    title: "Nouvelle demande d'information",
    message:
      "Laura Koné a demandé plus d'informations sur Appartement Riviera Palmeraie",
    time: 'il y a 16 minutes',
  },
  {
    id: 'notification-04',
    title: "Nouvelle demande d'information",
    message:
      "Laura Koné a demandé plus d'informations sur Appartement Riviera Palmeraie",
    time: 'il y a 2 minutes',
  },
  {
    id: 'notification-05',
    title: "Nouvelle demande d'information",
    message:
      "Laura Koné a demandé plus d'informations sur Appartement Riviera Palmeraie",
    time: 'il y a 1 heure',
  },
];

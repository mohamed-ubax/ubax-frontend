import type {
  ComptableCalendarDay,
  ComptableNotificationItem,
  ComptableRequestRow,
  ComptableSummaryMetric,
  ComptableToolbarField,
} from '../types/demandes-comptable.types';

export const SHARED_ASSET_ROOT = '/shared/demandes';
export const COMPTABLE_ASSET_ROOT = '/demandes/comptable';

export const COMPTABLE_ICONS = {
  search: `${SHARED_ASSET_ROOT}/filter-search.webp`,
  date: `${SHARED_ASSET_ROOT}/filter-date.webp`,
  export: `${SHARED_ASSET_ROOT}/filter-export.webp`,
  notification: `${SHARED_ASSET_ROOT}/notification-bell.webp`,
  eye: `${SHARED_ASSET_ROOT}/action-eye.webp`,
  summaryOpen: `${SHARED_ASSET_ROOT}/summary-open.webp`,
  summaryProgress: `${SHARED_ASSET_ROOT}/summary-progress.webp`,
  summaryDone: `${SHARED_ASSET_ROOT}/summary-done.webp`,
  calendarPrev: '/demandes/commercial/calendar-chevron-left.webp',
  calendarNext: '/demandes/commercial/calendar-chevron-right.webp',
} as const;

export const COMPTABLE_TOOLBAR_FIELDS: readonly ComptableToolbarField[] = [
  { label: 'Recherche ...', icon: COMPTABLE_ICONS.search, kind: 'search' },
  { label: 'Sélectionner une date', icon: COMPTABLE_ICONS.date, kind: 'date' },
  { label: 'Exporter les données', icon: COMPTABLE_ICONS.export, kind: 'export' },
];

export const COMPTABLE_METRICS: readonly ComptableSummaryMetric[] = [
  { label: 'Demande reçus', value: 22, accent: 'var(--ubax-info)', icon: COMPTABLE_ICONS.summaryOpen },
  { label: 'Taches en cours', value: 7, accent: 'var(--ubax-accent)', icon: COMPTABLE_ICONS.summaryProgress },
  { label: 'Traités', value: 15, accent: 'var(--ubax-success)', icon: COMPTABLE_ICONS.summaryDone },
];

export const COMPTABLE_CALENDAR_WEEKDAYS = ['Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa', 'Di'] as const;

export const COMPTABLE_CALENDAR_WEEKS: readonly (readonly ComptableCalendarDay[])[] = [
  [
    { label: '1' }, { label: '2' }, { label: '3' }, { label: '4' },
    { label: '5' }, { label: '6' }, { label: '7' },
  ],
  [
    { label: '8' }, { label: '9' }, { label: '10' }, { label: '11' },
    { label: '12' }, { label: '13' }, { label: '14' },
  ],
  [
    { label: '15' }, { label: '16' }, { label: '17' }, { label: '18', isActive: true },
    { label: '19' }, { label: '20' }, { label: '21' },
  ],
  [
    { label: '22' }, { label: '23' }, { label: '24' }, { label: '25' },
    { label: '26' }, { label: '27' }, { label: '28' },
  ],
  [
    { label: '29' }, { label: '30' },
    { label: '1', isMuted: true }, { label: '2', isMuted: true },
    { label: '3', isMuted: true }, { label: '4', isMuted: true }, { label: '5', isMuted: true },
  ],
];

export const COMPTABLE_REQUEST_ROWS: readonly ComptableRequestRow[] = [
  { ref: 'FIN-00124', client: 'Awa Bakayoko', image: `${COMPTABLE_ASSET_ROOT}/request-thumb-01.webp`, property: 'Immeuble kalia', requestType: 'Contestation loyer', amount: '450 000 FCFA', status: 'En cour', date: '14/11/2026' },
  { ref: 'FIN-00125', client: 'Moussa Traoré', image: `${COMPTABLE_ASSET_ROOT}/request-thumb-02.webp`, property: 'Immeuble kalia', requestType: 'Remboursement', amount: '450 000 FCFA', status: 'En cour', date: '14/11/2026' },
  { ref: 'FIN-00126', client: 'Awa Bakayoko', image: `${COMPTABLE_ASSET_ROOT}/request-thumb-03.webp`, property: 'Immeuble kalia', requestType: 'Justificatif de charges', amount: '450 000 FCFA', status: 'En cour', date: '14/11/2026' },
  { ref: 'FIN-00127', client: 'Awa Bakayoko', image: `${COMPTABLE_ASSET_ROOT}/request-thumb-04.webp`, property: 'Immeuble kalia', requestType: 'Erreur de facture', amount: '450 000 FCFA', status: 'En cour', date: '14/11/2026' },
  { ref: 'FIN-00128', client: 'Awa Bakayoko', image: `${COMPTABLE_ASSET_ROOT}/request-thumb-05.webp`, property: 'Immeuble kalia', requestType: 'Contestation loyer', amount: '450 000 FCFA', status: 'En cour', date: '14/11/2026' },
  { ref: 'FIN-00129', client: 'Awa Bakayoko', image: `${COMPTABLE_ASSET_ROOT}/request-thumb-06.webp`, property: 'Immeuble kalia', requestType: 'Contestation loyer', amount: '450 000 FCFA', status: 'En cour', date: '14/11/2026' },
  { ref: 'FIN-00130', client: 'Awa Bakayoko', image: `${COMPTABLE_ASSET_ROOT}/request-thumb-07.webp`, property: 'Immeuble kalia', requestType: 'Contestation loyer', amount: '450 000 FCFA', status: 'En cour', date: '14/11/2026' },
  { ref: 'FIN-00131', client: 'Awa Bakayoko', image: `${COMPTABLE_ASSET_ROOT}/request-thumb-08.webp`, property: 'Immeuble kalia', requestType: 'Contestation loyer', amount: '450 000 FCFA', status: 'En cour', date: '14/11/2026' },
];

export const COMPTABLE_NOTIFICATIONS: readonly ComptableNotificationItem[] = [
  {
    title: 'Technicien assigné',
    message: 'Une nouvelle demande a été enregistrée pour le bien UBX-0845.',
    time: 'il y a 2 minutes',
  },
  {
    title: 'Intervention planifiée',
    message:
      "Laura Koné a demandé plus d'informations sur Appartement Riviera Palmeraie",
    time: 'il y a 12 minutes',
  },
  {
    title: 'Nouveau ticket SAV créé',
    message: 'Une nouvelle demande a été enregistrée pour le bien UBX-0845.',
    time: 'il y a 16 minutes',
  },
  {
    title: 'Nouveau ticket SAV créé',
    message: 'Une nouvelle demande a été enregistrée pour le bien UBX-0845.',
    time: 'il y a 16 minutes',
  },
];

import type {
  SavIssueCard,
  SavNotificationItem,
  SavPriorityTone,
  SavStatusTone,
  SavTicketFilterState,
  SavTicketRow,
} from '../types/demandes-sav.types';

export const SHARED_ASSET_ROOT = '/shared/demandes';
export const SAV_ASSET_ROOT = '/demandes/sav';
export const TICKETS_PER_PAGE = 8;

const DATE_FORMATTER = new Intl.DateTimeFormat('fr-FR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

export const STATUS_LABELS: Record<SavStatusTone, string> = {
  open: 'Ouvert',
  progress: 'en cours',
  success: 'Résolu',
};

export function createDefaultTicketFilters(): SavTicketFilterState {
  return { status: 'all', priority: 'all', issue: 'all', createdAt: null };
}

export function isSameCalendarDay(left: Date, right: Date): boolean {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

export function areFilterDatesEqual(
  left: Date | null,
  right: Date | null,
): boolean {
  if (!left || !right) return left === right;
  return isSameCalendarDay(left, right);
}

export function areTicketFiltersEqual(
  left: SavTicketFilterState,
  right: SavTicketFilterState,
): boolean {
  return (
    left.status === right.status &&
    left.priority === right.priority &&
    left.issue === right.issue &&
    areFilterDatesEqual(left.createdAt, right.createdAt)
  );
}

export function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}

const CLIENTS = [
  { name: 'Konan Olivier', avatar: `${SHARED_ASSET_ROOT}/ticket-avatar-01.webp` },
  { name: 'Awa Bakayoko', avatar: `${SHARED_ASSET_ROOT}/ticket-avatar-02.webp` },
  { name: 'Moussa Traoré', avatar: `${SHARED_ASSET_ROOT}/ticket-avatar-03.webp` },
  { name: 'Mariam Coulibaly', avatar: `${SHARED_ASSET_ROOT}/ticket-avatar-04.webp` },
  { name: 'Laura Koné', avatar: `${SHARED_ASSET_ROOT}/ticket-avatar-02.webp` },
  { name: 'Armand Tano', avatar: `${SHARED_ASSET_ROOT}/ticket-avatar-03.webp` },
] as const;

const PROPERTIES = [
  'Résidence Plateau - App 12',
  'Immeuble Kalia - Bureau 04',
  'Riviera Palmeraie - Villa 08',
  'Résidence Cocody - App 21',
] as const;

const ISSUE_TYPES = [
  "Fuite d'eau",
  'Problème électrique',
  'Porte cassée',
  'Climatisation défaillante',
  'Panne ascenseur',
  'Serrure bloquée',
] as const;

function createMockDate(day: number): Date {
  return new Date(2026, 2, day, 9, 0, 0, 0);
}

function formatMockDate(date: Date): string {
  return DATE_FORMATTER.format(date);
}

function buildTicket(
  sequence: number,
  statusTone: SavStatusTone,
  priorityTone: SavPriorityTone,
  issue: string,
  client: (typeof CLIENTS)[number],
  property: string,
  day: number,
): SavTicketRow {
  const createdAtDate = createMockDate(day);
  return {
    id: `UBX-TK-${String(sequence).padStart(4, '0')}`,
    client: client.name,
    avatar: client.avatar,
    property,
    issue,
    issueKey: issue,
    priority: priorityTone === 'urgent' ? 'Urgent' : 'normal',
    priorityTone,
    createdAt: formatMockDate(createdAtDate),
    createdAtDate,
    status: STATUS_LABELS[statusTone],
    statusTone,
  };
}

const BASE_TICKETS: readonly SavTicketRow[] = [
  buildTicket(12, 'success', 'urgent', "Fuite d'eau", CLIENTS[0], PROPERTIES[0], 5),
  buildTicket(13, 'success', 'urgent', 'Problème électrique', CLIENTS[1], PROPERTIES[0], 5),
  buildTicket(14, 'progress', 'normal', "Fuite d'eau", CLIENTS[2], PROPERTIES[0], 5),
  buildTicket(15, 'success', 'urgent', 'Porte cassée', CLIENTS[3], PROPERTIES[0], 5),
  buildTicket(16, 'success', 'urgent', 'Problème électrique', CLIENTS[1], PROPERTIES[0], 5),
  buildTicket(17, 'progress', 'normal', "Fuite d'eau", CLIENTS[2], PROPERTIES[0], 5),
  buildTicket(18, 'success', 'urgent', "Fuite d'eau", CLIENTS[0], PROPERTIES[0], 5),
  buildTicket(19, 'success', 'urgent', 'Porte cassée', CLIENTS[3], PROPERTIES[0], 5),
];

const OPEN_TICKETS: readonly SavTicketRow[] = Array.from(
  { length: 22 },
  (_, index) =>
    buildTicket(
      20 + index,
      'open',
      index % 2 === 0 ? 'urgent' : 'normal',
      ISSUE_TYPES[index % ISSUE_TYPES.length],
      CLIENTS[index % CLIENTS.length],
      PROPERTIES[(index + 1) % PROPERTIES.length],
      1 + (index % 10),
    ),
);

const PROGRESS_TICKETS: readonly SavTicketRow[] = Array.from(
  { length: 3 },
  (_, index) =>
    buildTicket(
      42 + index,
      'progress',
      index === 1 ? 'normal' : 'urgent',
      ISSUE_TYPES[(index + 2) % ISSUE_TYPES.length],
      CLIENTS[(index + 2) % CLIENTS.length],
      PROPERTIES[(index + 2) % PROPERTIES.length],
      6 + index,
    ),
);

const SUCCESS_TICKETS: readonly SavTicketRow[] = Array.from(
  { length: 9 },
  (_, index) =>
    buildTicket(
      45 + index,
      'success',
      index % 3 === 0 ? 'normal' : 'urgent',
      ISSUE_TYPES[(index + 3) % ISSUE_TYPES.length],
      CLIENTS[(index + 3) % CLIENTS.length],
      PROPERTIES[index % PROPERTIES.length],
      2 + (index % 8),
    ),
);

export const SAV_TICKETS: readonly SavTicketRow[] = [
  ...BASE_TICKETS,
  ...OPEN_TICKETS,
  ...PROGRESS_TICKETS,
  ...SUCCESS_TICKETS,
];

export const SAV_ISSUES: readonly SavIssueCard[] = [
  {
    id: 'issue-01',
    title: 'Problème de nom sur le contrat',
    client: 'Mariam Coulibaly',
    location: 'Résidence Plateau - App 12',
    phone: '+225 07 58 23 41 89',
    image: `${SAV_ASSET_ROOT}/issue-property-01.webp`,
    createdAt: createMockDate(5),
  },
  {
    id: 'issue-02',
    title: 'Litige sur la durée du bail',
    client: 'Mariam Coulibaly',
    location: 'Résidence Plateau - App 12',
    phone: '+225 07 58 23 41 89',
    image: `${SAV_ASSET_ROOT}/issue-property-02.webp`,
    createdAt: createMockDate(6),
  },
  {
    id: 'issue-03',
    title: 'Résiliation anticipée',
    client: 'Mariam Coulibaly',
    location: 'Résidence Plateau - App 12',
    phone: '+225 07 58 23 41 89',
    image: `${SAV_ASSET_ROOT}/issue-property-03.webp`,
    createdAt: createMockDate(7),
  },
  {
    id: 'issue-04',
    title: 'Renouvellement de contrat',
    client: 'Mariam Coulibaly',
    location: 'Résidence Plateau - App 12',
    phone: '+225 07 58 23 41 89',
    image: `${SAV_ASSET_ROOT}/issue-property-04.webp`,
    createdAt: createMockDate(8),
  },
];

export const SAV_NOTIFICATIONS: readonly SavNotificationItem[] = [
  {
    id: 'notification-01',
    title: 'Technicien assigné',
    message: 'Une nouvelle demande a été enregistrée pour le bien UBX-0845.',
    time: 'il y a 2 minutes',
    createdAt: createMockDate(5),
  },
  {
    id: 'notification-02',
    title: 'Intervention planifiée',
    message:
      "Laura Koné a demandé plus d'informations sur Appartement Riviera Palmeraie",
    time: 'il y a 12 minutes',
    createdAt: createMockDate(6),
  },
  {
    id: 'notification-03',
    title: 'Nouveau ticket SAV créé',
    message: 'Une nouvelle demande a été enregistrée pour le bien UBX-0845.',
    time: 'il y a 16 minutes',
    createdAt: createMockDate(7),
  },
  {
    id: 'notification-04',
    title: 'Nouveau ticket SAV créé',
    message: 'Une nouvelle demande a été enregistrée pour le bien UBX-0845.',
    time: 'il y a 16 minutes',
    createdAt: createMockDate(8),
  },
];

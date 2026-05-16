import { COUNTRY_CODES } from '@ubax-workspace/shared-data-access';
import type {
  DashboardSavCountryCodeOption,
  DashboardSavInterventionPeriod,
  DashboardSavInterventionSnapshot,
  DashboardSavNotificationItem,
  DashboardSavPriorityTone,
  DashboardSavStarTone,
  DashboardSavStatusTone,
  DashboardSavTechIntervention,
  DashboardSavTechnician,
  DashboardSavTechnicianDetail,
  DashboardSavTicket,
  DashboardSavTicketFilterState,
} from '../types/dashboard-sav-redesign.types';

// ─── Asset helpers ─────────────────────────────────────────────────────────────

export const SHARED_ASSET_ROOT = '/shared/demandes';
export const DASHBOARD_SAV_ASSET_ROOT = '/dashboard-sav';

function dashboardSavAsset(file: string): string {
  return `${DASHBOARD_SAV_ASSET_ROOT}/${file}`;
}

// ─── Pagination / timing constants ────────────────────────────────────────────

export const DEFAULT_VISIBLE_TECHNICIANS = 5;
export const DEFAULT_VISIBLE_NOTIFICATIONS = 5;
export const TICKETS_PER_PAGE = 4;
export const PHASE_TRANSITION_DURATION_MS = 260;
export const ADD_TECH_CLOSE_DURATION_MS = 220;
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ─── Formatters ────────────────────────────────────────────────────────────────

export const DATE_FORMATTER = new Intl.DateTimeFormat('fr-FR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

// ─── String helpers ────────────────────────────────────────────────────────────

const replaceText = (
  value: string,
  pattern: RegExp,
  replacement: string,
): string =>
  (
    String.prototype.replace as (
      this: string,
      searchValue: RegExp,
      replaceValue: string,
    ) => string
  ).call(value, pattern, replacement);

export function normalizeText(value: string): string {
  return replaceText(value.normalize('NFD'), /[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}

export function isSameCalendarDay(left: Date, right: Date): boolean {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

export function cloneDate(date: Date | null): Date | null {
  return date ? new Date(date) : null;
}

export function createDefaultTicketFilters(): DashboardSavTicketFilterState {
  return {
    status: 'all',
    priority: 'all',
    issue: 'all',
    createdAt: null,
  };
}

// ─── Mock date helpers ─────────────────────────────────────────────────────────

export function createMockDate(day: number): Date {
  return new Date(2026, 2, day, 9, 0, 0, 0);
}

export function formatMockDate(date: Date): string {
  return DATE_FORMATTER.format(date);
}

// ─── Status labels ─────────────────────────────────────────────────────────────

export const STATUS_LABELS: Record<DashboardSavStatusTone, string> = {
  open: 'Ouvert',
  progress: 'en cours',
  success: 'Résolu',
};

// ─── KPI tones ────────────────────────────────────────────────────────────────

export const KPI_TONES = {
  open: {
    accent: 'var(--ubax-info)',
    background: 'var(--ubax-info-soft-card)',
    orbSrc: dashboardSavAsset('kpi/orb-open.webp'),
    iconSrc: dashboardSavAsset('kpi/icon-open.webp'),
  },
  progress: {
    accent: 'var(--ubax-accent)',
    background: 'var(--ubax-accent-soft-card)',
    orbSrc: dashboardSavAsset('kpi/orb-progress.webp'),
    iconSrc: dashboardSavAsset('kpi/icon-progress.webp'),
  },
  success: {
    accent: 'var(--ubax-success)',
    background: 'var(--ubax-success-soft-card)',
    orbSrc: dashboardSavAsset('kpi/orb-done.webp'),
    iconSrc: dashboardSavAsset('kpi/icon-done.webp'),
  },
  urgent: {
    accent: 'var(--ubax-danger)',
    background: 'var(--ubax-danger-soft-card)',
    orbSrc: dashboardSavAsset('kpi/orb-urgent.webp'),
    iconSrc: dashboardSavAsset('kpi/icon-urgent.webp'),
  },
} as const;

// ─── Intervention snapshots ────────────────────────────────────────────────────

export const INTERVENTION_SNAPSHOTS: Record<
  DashboardSavInterventionPeriod,
  DashboardSavInterventionSnapshot
> = {
  'current-month': {
    pending: 12,
    progress: 21,
    completed: 15,
  },
  quarter: {
    pending: 18,
    progress: 27,
    completed: 24,
  },
  year: {
    pending: 41,
    progress: 66,
    completed: 58,
  },
};

// ─── Star assets ───────────────────────────────────────────────────────────────

export const STAR_ASSET_BY_TONE: Record<DashboardSavStarTone, string> = {
  full: dashboardSavAsset('technicians/star-full.webp'),
  half: dashboardSavAsset('technicians/star-half.webp'),
};

// ─── Phone country codes ───────────────────────────────────────────────────────

const SAV_PHONE_COUNTRY_SAMPLES: Record<
  string,
  { national: string; e164: string }
> = {
  CI: { national: '07 12 34 56 78', e164: '+2250712345678' },
  SN: { national: '77 100 20 20', e164: '+221771002020' },
  BJ: { national: '01 90 12 34 56', e164: '+2290190123456' },
  TG: { national: '90 12 34 56', e164: '+22890123456' },
  ML: { national: '70 12 34 56', e164: '+22370123456' },
};

export const COUNTRY_CODE_OPTIONS: readonly DashboardSavCountryCodeOption[] = [
  'CI',
  'SN',
  'BJ',
  'TG',
  'ML',
]
  .map((iso2) => {
    const country = COUNTRY_CODES.find((entry) => entry.iso2 === iso2);
    const sample = SAV_PHONE_COUNTRY_SAMPLES[iso2];

    if (!country || !sample) {
      return null;
    }

    return {
      ...country,
      sampleNational: sample.national,
      sampleE164: sample.e164,
    } satisfies DashboardSavCountryCodeOption;
  })
  .filter(
    (country): country is DashboardSavCountryCodeOption => country !== null,
  );

// ─── Phone formatting helpers ──────────────────────────────────────────────────

export function composeSavE164Phone(dialCode: string, nationalDigits: string): string {
  const digits = nationalDigits.replaceAll(/\D/g, '');

  if (!digits.length) {
    return '';
  }

  const body = digits.startsWith('0') ? digits.slice(1) : digits;

  if (dialCode === '225') {
    if (body.length !== 9 || !/^[1-9]\d{8}$/.test(body)) {
      return '';
    }

    return `+225${body}`;
  }

  if (body.length < 6 || body.length > 14 || !/^\d+$/.test(body)) {
    return '';
  }

  return `+${dialCode}${body}`;
}

export function sanitizeSavPhoneDraft(value: string, dialCode: string): string {
  const digits = value.replaceAll(/\D/g, '');
  const maxLength = dialCode === '225' ? 10 : 14;

  return digits.slice(0, maxLength);
}

// ─── Mock ticket data ──────────────────────────────────────────────────────────

const TICKET_CLIENTS = [
  {
    name: 'Konan Olivier',
    avatar: dashboardSavAsset('tickets/avatar-01.webp'),
  },
  {
    name: 'Awa Bakayoko',
    avatar: dashboardSavAsset('tickets/avatar-02.webp'),
  },
  {
    name: 'Moussa Traoré',
    avatar: dashboardSavAsset('tickets/avatar-03.webp'),
  },
  {
    name: 'Mariam Coulibaly',
    avatar: dashboardSavAsset('tickets/avatar-04.webp'),
  },
] as const;

const TICKET_PROPERTIES = [
  'résidence Plateau - App 12',
  'Résidence Plateau - App 22',
  'Immeuble kalia',
  'Villa Riviera',
  'Les Jardins de Cocody',
  'Résidence Palm Club - App 06',
] as const;

export const TICKET_ISSUES = [
  "Fuite d'eau",
  'Problème électrique',
  'Porte cassée',
  'Climatisation défaillante',
  'Serrure bloquée',
  'Panne ascenseur',
] as const;

export function buildTicket(
  sequence: number,
  statusTone: DashboardSavStatusTone,
  priorityTone: DashboardSavPriorityTone,
  issue: string,
  client: (typeof TICKET_CLIENTS)[number],
  property: string,
  day: number,
): DashboardSavTicket {
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
    createdAtLabel: formatMockDate(createdAtDate),
    createdAtDate,
    status: STATUS_LABELS[statusTone],
    statusTone,
  };
}

const BASE_TICKETS: readonly DashboardSavTicket[] = [
  {
    id: 'UBX-TK-0012',
    client: 'Konan Olivier',
    avatar: dashboardSavAsset('tickets/avatar-01.webp'),
    property: 'résidence Plateau - App 12',
    issue: "Fuite d'eau",
    issueKey: "Fuite d'eau",
    priority: 'Urgent',
    priorityTone: 'urgent',
    createdAtLabel: '05/03/2026',
    createdAtDate: createMockDate(5),
    status: 'Résolu',
    statusTone: 'success',
  },
  {
    id: 'UBX-TK-0012-B',
    client: 'Awa Bakayoko',
    avatar: dashboardSavAsset('tickets/avatar-02.webp'),
    property: 'résidence Plateau - App 12',
    issue: 'Problème électrique',
    issueKey: 'Problème électrique',
    priority: 'Urgent',
    priorityTone: 'urgent',
    createdAtLabel: '05/03/2026',
    createdAtDate: createMockDate(5),
    status: 'Résolu',
    statusTone: 'success',
  },
  {
    id: 'UBX-TK-0012-C',
    client: 'Moussa Traoré',
    avatar: dashboardSavAsset('tickets/avatar-03.webp'),
    property: 'résidence Plateau - App 12',
    issue: "Fuite d'eau",
    issueKey: "Fuite d'eau",
    priority: 'normal',
    priorityTone: 'normal',
    createdAtLabel: '05/03/2026',
    createdAtDate: createMockDate(5),
    status: 'en cours',
    statusTone: 'progress',
  },
  {
    id: 'UBX-TK-0012-D',
    client: 'Mariam Coulibaly',
    avatar: dashboardSavAsset('tickets/avatar-04.webp'),
    property: 'résidence Plateau - App 12',
    issue: 'Porte cassée',
    issueKey: 'Porte cassée',
    priority: 'Urgent',
    priorityTone: 'urgent',
    createdAtLabel: '05/03/2026',
    createdAtDate: createMockDate(5),
    status: 'Résolu',
    statusTone: 'success',
  },
];

const OPEN_TICKETS: readonly DashboardSavTicket[] = Array.from(
  { length: 22 },
  (_, index) =>
    buildTicket(
      100 + index,
      'open',
      index < 2 ? 'urgent' : 'normal',
      TICKET_ISSUES[index % TICKET_ISSUES.length],
      TICKET_CLIENTS[index % TICKET_CLIENTS.length],
      TICKET_PROPERTIES[index % TICKET_PROPERTIES.length],
      6 + (index % 12),
    ),
);

const PROGRESS_TICKETS: readonly DashboardSavTicket[] = Array.from(
  { length: 4 },
  (_, index) =>
    buildTicket(
      200 + index,
      'progress',
      'normal',
      TICKET_ISSUES[(index + 2) % TICKET_ISSUES.length],
      TICKET_CLIENTS[index % TICKET_CLIENTS.length],
      TICKET_PROPERTIES[(index + 1) % TICKET_PROPERTIES.length],
      10 + index,
    ),
);

const SUCCESS_TICKETS: readonly DashboardSavTicket[] = Array.from(
  { length: 12 },
  (_, index) =>
    buildTicket(
      300 + index,
      'success',
      index % 3 === 0 ? 'urgent' : 'normal',
      TICKET_ISSUES[(index + 1) % TICKET_ISSUES.length],
      TICKET_CLIENTS[(index + 1) % TICKET_CLIENTS.length],
      TICKET_PROPERTIES[(index + 2) % TICKET_PROPERTIES.length],
      2 + (index % 11),
    ),
);

export const ALL_TICKETS: readonly DashboardSavTicket[] = [
  ...BASE_TICKETS,
  ...OPEN_TICKETS,
  ...PROGRESS_TICKETS,
  ...SUCCESS_TICKETS,
];

// ─── Mock technician data ──────────────────────────────────────────────────────

export const BASE_TECHNICIANS: readonly DashboardSavTechnician[] = [
  {
    id: 'UBX-TECH-001',
    name: 'Mamadou Diallo',
    initials: 'MD',
    specialty: 'Électricité bâtiment',
    rating: 4.5,
    tickets: 2,
    phone: '+225 07 58 42 19 63',
    color: '#1a3047',
    image: dashboardSavAsset('technicians/avatar-05.webp'),
  },
  {
    id: 'UBX-TECH-002',
    name: 'Serge Kouamé',
    initials: 'SK',
    specialty: 'Plomberie & sanitaires',
    rating: 4.5,
    tickets: 0,
    phone: '+225 07 58 42 19 63',
    color: '#e87d1e',
    image: dashboardSavAsset('technicians/avatar-03.webp'),
  },
  {
    id: 'UBX-TECH-003',
    name: 'Alain Yao',
    initials: 'AY',
    specialty: 'Maintenance générale',
    rating: 4.5,
    tickets: 2,
    phone: '+225 07 58 42 19 63',
    color: '#16b55b',
    image: dashboardSavAsset('technicians/avatar-04.webp'),
  },
  {
    id: 'UBX-TECH-004',
    name: "Patrick N'Guessan",
    initials: 'PN',
    specialty: 'Peintre',
    rating: 4.5,
    tickets: 1,
    phone: '+225 07 58 42 19 63',
    color: '#e87d1e',
    image: dashboardSavAsset('technicians/avatar-02.webp'),
  },
  {
    id: 'UBX-TECH-005',
    name: 'Moussa Ba',
    initials: 'MB',
    specialty: 'Électricité bâtiment',
    rating: 4.5,
    tickets: 2,
    phone: '+225 07 58 42 19 63',
    color: '#1a3047',
    image: dashboardSavAsset('technicians/avatar-06.webp'),
  },
  {
    id: 'UBX-TECH-006',
    name: 'Kofi Mensah',
    initials: 'KM',
    specialty: 'Climatisation',
    rating: 4,
    tickets: 3,
    phone: '+225 07 58 42 19 63',
    color: '#e87d1e',
    image: dashboardSavAsset('technicians/avatar-07.webp'),
  },
  {
    id: 'UBX-TECH-007',
    name: 'Adjoua Traoré',
    initials: 'AT',
    specialty: 'Menuiserie',
    rating: 4.5,
    tickets: 1,
    phone: '+225 07 58 42 19 63',
    color: '#16b55b',
    image: dashboardSavAsset('technicians/avatar-08.webp'),
  },
  {
    id: 'UBX-TECH-008',
    name: 'Boubacar Diallo',
    initials: 'BD',
    specialty: 'Maintenance générale',
    rating: 4,
    tickets: 2,
    phone: '+225 07 58 42 19 63',
    color: '#1a3047',
    image: dashboardSavAsset('technicians/avatar-01.webp'),
  },
] as const;

const TECH_HISTORY: readonly DashboardSavTechIntervention[] = [
  {
    id: 'UBX-TK-0012',
    client: 'Koffi Didier',
    avatar: dashboardSavAsset('detail/history-avatar-01.webp'),
    property: 'résidence Plateau - App 12',
    city: 'Abidjan, Riviera',
    issue: 'Problème électrique',
    status: 'Résolu',
    date: '05/03/2026',
  },
  {
    id: 'UBX-TK-30',
    client: 'Kouamé Patrick',
    avatar: dashboardSavAsset('detail/history-avatar-02.webp'),
    property: 'résidence Plateau - App 13',
    city: 'Abidjan, Riviera',
    issue: 'Problème électrique',
    status: 'Résolu',
    date: '05/03/2026',
  },
  {
    id: 'UBX-TK-0014',
    client: 'Koffi Didier',
    avatar: dashboardSavAsset('detail/history-avatar-03.webp'),
    property: 'résidence Plateau - App 12',
    city: 'Abidjan, Riviera',
    issue: 'Problème électrique',
    status: 'Résolu',
    date: '05/03/2026',
  },
  {
    id: 'UBX-TK-0028',
    client: 'Koffi Didier',
    avatar: dashboardSavAsset('detail/history-avatar-04.webp'),
    property: 'résidence Plateau - App 12',
    city: 'Abidjan, Riviera',
    issue: 'Problème électrique',
    status: 'Résolu',
    date: '05/03/2026',
  },
  {
    id: 'UBX-TK-0056',
    client: 'Koffi Didier',
    avatar: dashboardSavAsset('detail/history-avatar-05.webp'),
    property: 'résidence Plateau - App 12',
    city: 'Abidjan, Riviera',
    issue: 'Problème électrique',
    status: 'Résolu',
    date: '05/03/2026',
  },
  {
    id: 'UBX-TK-0072',
    client: 'Koffi Didier',
    avatar: dashboardSavAsset('detail/history-avatar-06.webp'),
    property: 'résidence Plateau - App 12',
    city: 'Abidjan, Riviera',
    issue: 'Problème électrique',
    status: 'Résolu',
    date: '05/03/2026',
  },
  {
    id: 'UBX-TK-0072',
    client: 'Koffi Didier',
    avatar: dashboardSavAsset('detail/history-avatar-07.webp'),
    property: 'résidence Plateau - App 12',
    city: 'Abidjan, Riviera',
    issue: 'Problème électrique',
    status: 'Résolu',
    date: '05/03/2026',
  },
  {
    id: 'UBX-TK-0082',
    client: 'Koffi Didier',
    avatar: dashboardSavAsset('detail/history-avatar-08.webp'),
    property: 'résidence Plateau - App 12',
    city: 'Abidjan, Riviera',
    issue: 'Problème électrique',
    status: 'Résolu',
    date: '05/03/2026',
  },
  {
    id: 'UBX-TK-0012',
    client: 'Koffi Didier',
    avatar: dashboardSavAsset('detail/history-avatar-09.webp'),
    property: 'résidence Plateau - App 12',
    city: 'Abidjan, Riviera',
    issue: 'Problème électrique',
    status: 'Résolu',
    date: '05/03/2026',
  },
];

export const DEFAULT_TECHNICIAN_DETAIL: DashboardSavTechnicianDetail = {
  joinedOn: '12 Janvier 2025',
  contractStatus: 'Actif',
  employeeCode: 'UBX-LOC-0245',
  resolvedTickets: '09',
  totalPaid: '178 000 FCFA',
  history: TECH_HISTORY,
};

// ─── Mock notifications ────────────────────────────────────────────────────────

export const BASE_NOTIFICATIONS: readonly DashboardSavNotificationItem[] = [
  {
    id: 'notification-01',
    title: "Fuite d'eau",
    property: 'Résidence Plateau - App 12',
    ticketId: 'UBX-TK-0012',
    time: "Il y'a 5 minutes",
    createdAt: createMockDate(5),
    tone: 'alert',
    iconBackground: dashboardSavAsset('notifications/bg-alert.webp'),
    iconSrc: dashboardSavAsset('notifications/icon-alert.webp'),
    accent: 'var(--ubax-danger)',
  },
  {
    id: 'notification-02',
    title: 'Porte cassée',
    property: 'Villa Riviera',
    ticketId: 'UBX-TK-0052',
    time: "Il y'a 12 minutes",
    createdAt: createMockDate(5),
    tone: 'ticket',
    iconBackground: dashboardSavAsset('notifications/bg-ticket.webp'),
    iconSrc: dashboardSavAsset('notifications/icon-ticket.webp'),
    accent: 'var(--ubax-info)',
  },
  {
    id: 'notification-03',
    title: 'Problème électrique',
    property: 'Immeuble kalia',
    ticketId: 'UBX-TK-0015',
    time: "Il y'a 15 minutes",
    createdAt: createMockDate(6),
    tone: 'success',
    iconBackground: dashboardSavAsset('notifications/bg-success.webp'),
    iconSrc: dashboardSavAsset('notifications/icon-success.webp'),
    accent: 'var(--ubax-success-emphasis)',
  },
  {
    id: 'notification-04',
    title: "Fuite d'eau",
    property: 'Résidence Plateau - App 22',
    ticketId: 'UBX-TK-0172',
    time: "Il y'a 17 minutes",
    createdAt: createMockDate(7),
    tone: 'water',
    iconBackground: dashboardSavAsset('notifications/bg-water.webp'),
    iconSrc: dashboardSavAsset('notifications/icon-ticket.webp'),
    accent: 'var(--ubax-info)',
  },
  {
    id: 'notification-05',
    title: 'Problème électrique',
    property: 'Immeuble kalia',
    ticketId: 'UBX-TK-0015',
    time: "Il y'a 25 minutes",
    createdAt: createMockDate(8),
    tone: 'success',
    iconBackground: dashboardSavAsset('notifications/bg-success.webp'),
    iconSrc: dashboardSavAsset('notifications/icon-success.webp'),
    accent: 'var(--ubax-success-emphasis)',
  },
  {
    id: 'notification-06',
    title: "Fuite d'eau",
    property: 'Résidence Palm Club - App 06',
    ticketId: 'UBX-TK-0111',
    time: "Il y'a 39 minutes",
    createdAt: createMockDate(9),
    tone: 'alert',
    iconBackground: dashboardSavAsset('notifications/bg-alert.webp'),
    iconSrc: dashboardSavAsset('notifications/icon-alert.webp'),
    accent: 'var(--ubax-danger)',
  },
];

// ─── Technician asset helpers exposed for component ────────────────────────────

export function getDashboardSavAsset(file: string): string {
  return dashboardSavAsset(file);
}

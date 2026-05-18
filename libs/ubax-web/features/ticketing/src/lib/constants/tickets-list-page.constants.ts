import type {
  TicketPriority,
  TicketStatus,
} from '@ubax-workspace/ubax-web-data-access';

export const PAGE_SIZE = 10;

export const STATUS_META: Record<
  TicketStatus,
  { label: string; color: string; bg: string }
> = {
  OPEN: { label: 'Ouvert', color: 'var(--ubax-text-muted)', bg: '#f0f2f6' },
  IN_ANALYSIS: {
    label: 'En analyse',
    color: 'var(--ubax-info)',
    bg: 'var(--ubax-blue-soft)',
  },
  TECHNICIAN_SENT: {
    label: 'Technicien envoyé',
    color: 'var(--ubax-lilac)',
    bg: 'var(--ubax-lilac-soft)',
  },
  RESOLVED: {
    label: 'Résolu',
    color: 'var(--ubax-success)',
    bg: 'var(--ubax-success-soft)',
  },
  CLOSED: { label: 'Clôturé', color: '#fff', bg: '#1a3047' },
  CANCELLED: {
    label: 'Annulé',
    color: 'var(--ubax-danger)',
    bg: 'var(--ubax-danger-soft)',
  },
};

export const PRIORITY_META: Record<
  TicketPriority,
  { label: string; color: string; bg: string }
> = {
  LOW: { label: 'Faible', color: 'var(--ubax-text-muted)', bg: '#f0f2f6' },
  NORMAL: {
    label: 'Normale',
    color: 'var(--ubax-info)',
    bg: 'var(--ubax-blue-soft)',
  },
  HIGH: {
    label: 'Haute',
    color: 'var(--ubax-accent)',
    bg: 'var(--ubax-peach-soft)',
  },
  URGENT: {
    label: 'Urgente',
    color: 'var(--ubax-danger)',
    bg: 'var(--ubax-danger-soft)',
  },
};

export const CATEGORY_LABELS = {
  LEAK: 'Fuite',
  ELECTRICAL: 'Électricité',
  LOCK: 'Serrurerie',
  PLUMBING: 'Plomberie',
  APPLIANCE: 'Électroménager',
  STRUCTURE: 'Structure',
  PEST: 'Nuisibles',
  COMMON_AREA: 'Parties communes',
  OTHER: 'Autre',
} as const;

export function normalizeText(v: string): string {
  return v
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}

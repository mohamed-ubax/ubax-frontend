import type { TenantStatus } from '../types/locataires-kyc-list.types';

export const STATUS_META: Record<
  TenantStatus,
  { label: string; color: string; bg: string; dot: string }
> = {
  INCOMPLETE: {
    label: 'Incomplet',
    color: 'var(--ubax-text-muted)',
    bg: '#f0f2f6',
    dot: '#9ca3af',
  },
  PENDING_REVIEW: {
    label: 'En attente',
    color: 'var(--ubax-accent)',
    bg: 'var(--ubax-peach-soft)',
    dot: 'var(--ubax-accent)',
  },
  QUALIFIED: {
    label: 'Qualifié',
    color: 'var(--ubax-success)',
    bg: 'var(--ubax-success-soft)',
    dot: 'var(--ubax-success)',
  },
  REJECTED: {
    label: 'Rejeté',
    color: 'var(--ubax-danger)',
    bg: 'var(--ubax-danger-soft)',
    dot: 'var(--ubax-danger)',
  },
  BLACKLISTED: {
    label: 'Blacklisté',
    color: '#fff',
    bg: 'var(--ubax-navy)',
    dot: 'var(--ubax-navy)',
  },
};

export const KYC_PAGE_SIZE = 10;

export function normalizeKycText(v: string): string {
  return v
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}

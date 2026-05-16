import type { TicketPriority } from '@ubax-workspace/ubax-web-data-access';
import type {
  CategoryIconRule,
  PriorityOption,
} from '../types/ticket-create-page.types';

export const PRIORITY_STYLE_MAP: Record<
  TicketPriority,
  Omit<PriorityOption, 'value' | 'label'> & { defaultLabel: string }
> = {
  LOW: {
    defaultLabel: 'Faible',
    color: 'var(--ubax-text-muted)',
    bg: '#f0f2f6',
    icon: 'pi pi-arrow-down',
  },
  NORMAL: {
    defaultLabel: 'Normale',
    color: 'var(--ubax-info)',
    bg: 'var(--ubax-blue-soft)',
    icon: 'pi pi-minus',
  },
  HIGH: {
    defaultLabel: 'Haute',
    color: 'var(--ubax-accent)',
    bg: 'var(--ubax-peach-soft)',
    icon: 'pi pi-arrow-up',
  },
  URGENT: {
    defaultLabel: 'Urgente',
    color: 'var(--ubax-danger)',
    bg: 'var(--ubax-danger-soft)',
    icon: 'pi pi-bolt',
  },
};

export const CATEGORY_ICON_RULES: readonly CategoryIconRule[] = [
  { icon: 'pi pi-wave-pulse', keywords: ['leak', 'fuite', 'eau'] },
  { icon: 'pi pi-wrench', keywords: ['plumbing', 'plomb', 'plombier', 'sanitaire'] },
  { icon: 'pi pi-bolt', keywords: ['electrical', 'electric', 'electricien', 'electricite'] },
  { icon: 'pi pi-lock', keywords: ['lock', 'serr', 'acces', 'blindage'] },
  { icon: 'pi pi-desktop', keywords: ['appliance', 'electromenager', 'equipement'] },
  { icon: 'pi pi-building', keywords: ['structure', 'batiment', 'maçon', 'macon'] },
  { icon: 'pi pi-exclamation-circle', keywords: ['pest', 'nuisible', 'parasite'] },
  { icon: 'pi pi-users', keywords: ['common_area', 'parties communes', 'commun'] },
  { icon: 'pi pi-question-circle', keywords: ['other', 'autre'] },
];

export function normalizeCategoryToken(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}

export function resolveCategoryIcon(
  category: string,
  label?: string,
): string {
  const haystack = [category, label]
    .filter((value): value is string => Boolean(value))
    .map((value) => normalizeCategoryToken(value))
    .join(' ');

  const match = CATEGORY_ICON_RULES.find((rule) =>
    rule.keywords.some((keyword) => haystack.includes(keyword)),
  );

  return match?.icon ?? 'pi pi-briefcase';
}

export function resolvePriorityOption(
  priority: TicketPriority,
  label?: string,
): PriorityOption {
  const style = PRIORITY_STYLE_MAP[priority];

  return {
    value: priority,
    label: label || style.defaultLabel,
    color: style.color,
    bg: style.bg,
    icon: style.icon,
  };
}

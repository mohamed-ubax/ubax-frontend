import type { OverdueItem } from '../types/loyers-retard.types';
import { FINANCE_OVERDUE_ROWS } from './finance-ui.constants';

export const PERIOD_OPTIONS = [
  'Avril 2025',
  'Mars 2025',
  'Février 2025',
  'Janvier 2025',
  'Décembre 2024',
] as const;

export type PeriodOption = (typeof PERIOD_OPTIONS)[number];

export const ALL_OVERDUE_ROWS: readonly OverdueItem[] = Array.from(
  { length: 5 },
  (_, pageIndex) =>
    FINANCE_OVERDUE_ROWS.map((row, index) => ({
      ...row,
      uid: `finance-overdue-${pageIndex + 1}-${index + 1}`,
    })),
).flat();

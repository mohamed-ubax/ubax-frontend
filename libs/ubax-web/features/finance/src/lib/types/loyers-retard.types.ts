import type { FinanceOverdueRow } from './finance.types';

export type OverdueItem = FinanceOverdueRow & { readonly uid: string };

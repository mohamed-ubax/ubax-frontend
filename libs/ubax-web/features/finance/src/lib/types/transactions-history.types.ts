import type { FinanceTransactionRow } from './finance.types';

export type TransactionHistoryItem = FinanceTransactionRow & { readonly uid: string };

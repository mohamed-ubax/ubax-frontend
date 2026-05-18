import type { TransactionHistoryItem } from '../types/transactions-history.types';
import { FINANCE_TRANSACTION_HISTORY } from './finance-ui.constants';

export const HISTORY_PAGE_SIZE = 8;

export const ALL_TRANSACTIONS: readonly TransactionHistoryItem[] = Array.from(
  { length: 5 },
  (_, pageIndex) =>
    FINANCE_TRANSACTION_HISTORY.map((transaction, index) => ({
      ...transaction,
      uid: `finance-history-${pageIndex + 1}-${index + 1}`,
    })),
).flat();

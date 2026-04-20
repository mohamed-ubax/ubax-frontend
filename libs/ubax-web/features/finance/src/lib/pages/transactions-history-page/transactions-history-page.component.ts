import {
  ChangeDetectionStrategy,
  Component,
  computed,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { UbaxPaginatorComponent } from '@ubax-workspace/shared-ui';
import {
  FINANCE_ASSETS,
  FINANCE_SUMMARY_CARDS,
  FINANCE_TRANSACTION_HISTORY,
  FINANCE_TRANSACTION_TYPE_OPTIONS,
  FinanceTransactionFilterValue,
  FinanceTransactionRow,
} from '../../finance-ui.data';

type TransactionHistoryItem = FinanceTransactionRow & { readonly uid: string };

const HISTORY_PAGE_SIZE = 8;

const ALL_TRANSACTIONS: readonly TransactionHistoryItem[] = Array.from(
  { length: 5 },
  (_, pageIndex) =>
    FINANCE_TRANSACTION_HISTORY.map((transaction, index) => ({
      ...transaction,
      uid: `finance-history-${pageIndex + 1}-${index + 1}`,
    })),
).flat();

@Component({
  selector: 'ubax-transactions-history-page',
  standalone: true,
  imports: [UbaxPaginatorComponent, FormsModule],
  templateUrl: './transactions-history-page.component.html',
  styleUrl: './transactions-history-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TransactionsHistoryPageComponent {
  protected readonly assets = FINANCE_ASSETS;
  protected readonly kpiCards = FINANCE_SUMMARY_CARDS.slice(0, 3);
  protected readonly balanceCard = FINANCE_SUMMARY_CARDS[3];
  protected readonly transactionTypeOptions = FINANCE_TRANSACTION_TYPE_OPTIONS;
  protected readonly currentPage = signal(3);
  protected readonly selectedType =
    signal<FinanceTransactionFilterValue>('all');
  protected readonly searchQuery = signal('');
  protected readonly isBalanceHidden = signal(false);
  protected readonly balanceAmount = computed(() =>
    this.isBalanceHidden() ? '•••••••• FCFA' : this.balanceCard.amount,
  );
  protected readonly filteredTransactions = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    const selectedType = this.selectedType();

    return ALL_TRANSACTIONS.filter((transaction) => {
      const matchesType =
        selectedType === 'all' || transaction.type === selectedType;
      const matchesQuery =
        query.length === 0 ||
        [
          transaction.date,
          transaction.reference,
          transaction.property,
          transaction.tenant,
          transaction.amount,
        ]
          .join(' ')
          .toLowerCase()
          .includes(query);

      return matchesType && matchesQuery;
    });
  });
  protected readonly totalPages = computed(() =>
    Math.max(
      1,
      Math.ceil(this.filteredTransactions().length / HISTORY_PAGE_SIZE),
    ),
  );
  protected readonly pagedTransactions = computed(() => {
    const start = (this.currentPage() - 1) * HISTORY_PAGE_SIZE;
    return this.filteredTransactions().slice(start, start + HISTORY_PAGE_SIZE);
  });

  protected setSelectedType(value: FinanceTransactionFilterValue): void {
    if (value === 'all' || value === 'loyer' || value === 'depense') {
      this.selectedType.set(value);
      this.currentPage.set(1);
    }
  }

  protected setSearchQuery(value: string): void {
    this.searchQuery.set(value);
    this.currentPage.set(1);
  }

  protected toggleBalanceVisibility(): void {
    this.isBalanceHidden.update((value) => !value);
  }
}

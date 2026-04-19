import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { UbaxPaginatorComponent } from '@ubax-workspace/shared-ui';
import {
  FINANCE_ASSETS,
  FINANCE_SUMMARY_CARDS,
  FINANCE_TRANSACTION_HISTORY,
} from '../../finance-ui.data';

@Component({
  selector: 'ubax-transactions-history-page',
  standalone: true,
  imports: [UbaxPaginatorComponent],
  templateUrl: './transactions-history-page.component.html',
  styleUrl: './transactions-history-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TransactionsHistoryPageComponent {
  protected readonly assets = FINANCE_ASSETS;
  protected readonly summaryCards = FINANCE_SUMMARY_CARDS;
  protected readonly transactions = FINANCE_TRANSACTION_HISTORY;
  protected readonly currentPage = signal(3);
  protected readonly totalPages = 5;
}

import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  FINANCE_ASSETS,
  FINANCE_EXPENSE_LEGEND,
  FINANCE_MONTH_LABELS,
  FINANCE_OVERVIEW_OVERDUE,
  FINANCE_OVERVIEW_TRANSACTIONS,
  FINANCE_SUMMARY_CARDS,
  FINANCE_Y_AXIS_LABELS,
} from '../../finance-ui.data';

@Component({
  selector: 'ubax-finance-overview-page',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './finance-overview-page.component.html',
  styleUrl: './finance-overview-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FinanceOverviewPageComponent {
  protected readonly assets = FINANCE_ASSETS;
  protected readonly summaryCards = FINANCE_SUMMARY_CARDS;
  protected readonly monthLabels = FINANCE_MONTH_LABELS;
  protected readonly yAxisLabels = FINANCE_Y_AXIS_LABELS;
  protected readonly expenseLegend = FINANCE_EXPENSE_LEGEND;
  protected readonly overdueItems = FINANCE_OVERVIEW_OVERDUE;
  protected readonly transactions = FINANCE_OVERVIEW_TRANSACTIONS;
}

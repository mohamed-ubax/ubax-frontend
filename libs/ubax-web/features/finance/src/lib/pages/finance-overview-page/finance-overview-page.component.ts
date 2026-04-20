import {
  ChangeDetectionStrategy,
  Component,
  computed,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ChartModule } from 'primeng/chart';
import { ChartData, ChartOptions, Plugin } from 'chart.js';
import {
  FINANCE_ASSETS,
  FINANCE_EXPENSE_LEGEND,
  FINANCE_MONTH_LABELS,
  FINANCE_OVERVIEW_OVERDUE,
  FINANCE_OVERVIEW_TRANSACTIONS,
  FINANCE_REVENUE_SERIES,
  FINANCE_SUMMARY_CARDS,
  FINANCE_TRANSACTION_TYPE_OPTIONS,
  FINANCE_Y_AXIS_LABELS,
  FinanceTransactionFilterValue,
} from '../../finance-ui.data';

const ACTIVE_REVENUE_INDEX = FINANCE_REVENUE_SERIES.findIndex(
  (point) => point.highlighted,
);

const ACTIVE_REVENUE_PLUGIN: Plugin<'line'> = {
  id: 'ubaxFinanceActivePoint',
  afterDatasetsDraw(chart) {
    const activePoint = chart.getDatasetMeta(0).data[ACTIVE_REVENUE_INDEX];

    if (!activePoint) {
      return;
    }

    const { ctx, chartArea } = chart;

    ctx.save();
    ctx.strokeStyle = 'rgba(255, 142, 41, 0.38)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(activePoint.x, chartArea.top + 10);
    ctx.lineTo(activePoint.x, chartArea.bottom);
    ctx.stroke();

    ctx.fillStyle = '#ff8e29';
    ctx.beginPath();
    ctx.arc(activePoint.x, activePoint.y, 5.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(activePoint.x, activePoint.y, 2.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  },
};

@Component({
  selector: 'ubax-finance-overview-page',
  standalone: true,
  imports: [RouterLink, FormsModule, ChartModule],
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
  protected readonly transactionTypeOptions = FINANCE_TRANSACTION_TYPE_OPTIONS;
  protected readonly selectedType =
    signal<FinanceTransactionFilterValue>('all');
  protected readonly searchQuery = signal('');
  protected readonly isBalanceHidden = signal(false);
  protected readonly revenueChartPlugins = [ACTIVE_REVENUE_PLUGIN];
  protected readonly activeRevenueLabel =
    FINANCE_REVENUE_SERIES[ACTIVE_REVENUE_INDEX]?.amountLabel ?? '';
  protected readonly balanceAmount = computed(() =>
    this.isBalanceHidden() ? '•••••••• FCFA' : this.summaryCards[3].amount,
  );
  protected readonly revenueChartData: ChartData<'line'> = {
    labels: FINANCE_REVENUE_SERIES.map((point) => point.label),
    datasets: [
      {
        data: FINANCE_REVENUE_SERIES.map((point) => point.amount),
        borderColor: '#ff8e29',
        borderWidth: 3,
        fill: true,
        tension: 0.44,
        pointRadius: FINANCE_REVENUE_SERIES.map((point) =>
          point.highlighted ? 4 : 0,
        ),
        pointHoverRadius: FINANCE_REVENUE_SERIES.map((point) =>
          point.highlighted ? 4 : 0,
        ),
        pointBorderWidth: 0,
        pointBackgroundColor: '#ff8e29',
        clip: 8,
        backgroundColor: (context) => {
          const chart = context.chart;
          const { ctx, chartArea } = chart;

          if (!chartArea) {
            return 'rgba(255, 142, 41, 0.2)';
          }

          const gradient = ctx.createLinearGradient(
            0,
            chartArea.top,
            0,
            chartArea.bottom,
          );
          gradient.addColorStop(0, 'rgba(255, 142, 41, 0.34)');
          gradient.addColorStop(0.62, 'rgba(255, 142, 41, 0.14)');
          gradient.addColorStop(1, 'rgba(255, 142, 41, 0)');
          return gradient;
        },
      },
    ],
  };
  protected readonly revenueChartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 650 },
    interaction: { intersect: false, mode: undefined },
    plugins: {
      legend: { display: false },
      tooltip: { enabled: false },
    },
    layout: {
      padding: { top: 6, right: 6, bottom: 0, left: 6 },
    },
    scales: {
      x: {
        display: false,
        grid: { display: false },
        border: { display: false },
      },
      y: {
        min: 0,
        max: 6_000_000,
        display: false,
        grid: { display: false },
        border: { display: false },
      },
    },
  };
  protected readonly expenseChartData: ChartData<'pie'> = {
    labels: this.expenseLegend.map((item) => item.label),
    datasets: [
      {
        data: this.expenseLegend.map((item) => item.value),
        backgroundColor: [
          '#008bff',
          '#16b55b',
          '#e87d1e',
          '#f9b628',
          '#8402c6',
        ],
        borderWidth: 0,
        spacing: 0,
        hoverOffset: 0,
      },
    ],
  };
  protected readonly expenseChartOptions: ChartOptions<'pie'> = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 650 },
    plugins: {
      legend: { display: false },
      tooltip: { enabled: false },
    },
  };
  protected readonly transactions = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    const selectedType = this.selectedType();

    return FINANCE_OVERVIEW_TRANSACTIONS.filter((transaction) => {
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
    }).slice(0, 5);
  });

  protected setSelectedType(value: FinanceTransactionFilterValue): void {
    if (value === 'all' || value === 'loyer' || value === 'depense') {
      this.selectedType.set(value);
    }
  }

  protected setSearchQuery(value: string): void {
    this.searchQuery.set(value);
  }

  protected toggleBalanceVisibility(): void {
    this.isBalanceHidden.update((value) => !value);
  }
}

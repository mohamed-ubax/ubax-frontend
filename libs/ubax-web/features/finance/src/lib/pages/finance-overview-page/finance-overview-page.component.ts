import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ChartModule } from 'primeng/chart';
import { SelectModule } from 'primeng/select';
import { ChartData, ChartOptions, Plugin } from 'chart.js';
import {
  FINANCE_ASSETS,
  FINANCE_EXPENSE_LEGEND,
  FINANCE_MONTH_LABELS,
  FINANCE_OVERVIEW_TRANSACTIONS,
  FINANCE_REVENUE_SERIES,
  FINANCE_SUMMARY_CARDS,
  FINANCE_TRANSACTION_TYPE_OPTIONS,
  FINANCE_Y_AXIS_LABELS,
} from '../../constants/finance-ui.constants';
import type { FinanceTransactionFilterValue } from '../../types/finance.types';
import { ExpensesStore, mapExpenseToRow, PaymentsStore } from '@ubax-workspace/ubax-web-data-access';

const EXPENSE_CATEGORY_LABELS: Record<string, string> = {
  MAINTENANCE: 'Entretien',
  MARKETING: 'Marketing',
  SALARY: 'Salaire',
  UTILITIES: 'Charges',
  TAX: 'Taxes',
  OTHER: 'Autre',
};

const EXPENSE_CATEGORY_TONES: Record<string, string> = {
  MAINTENANCE: 'blue',
  MARKETING: 'yellow',
  SALARY: 'green',
  UTILITIES: 'orange',
  TAX: 'purple',
  OTHER: 'gray',
};

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
  imports: [RouterLink, FormsModule, ChartModule, SelectModule],
  templateUrl: './finance-overview-page.component.html',
  styleUrl: './finance-overview-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FinanceOverviewPageComponent implements OnInit {
  private readonly paymentsStore = inject(PaymentsStore);
  private readonly expensesStore = inject(ExpensesStore);

  protected readonly assets = FINANCE_ASSETS;
  protected readonly monthLabels = FINANCE_MONTH_LABELS;
  protected readonly yAxisLabels = FINANCE_Y_AXIS_LABELS;
  protected readonly transactionTypeOptions = [...FINANCE_TRANSACTION_TYPE_OPTIONS];
  protected readonly selectedType =
    signal<FinanceTransactionFilterValue>('all');
  protected readonly searchQuery = signal('');
  protected readonly isBalanceHidden = signal(false);
  protected readonly revenueChartPlugins = [ACTIVE_REVENUE_PLUGIN];
  protected readonly activeRevenueLabel =
    FINANCE_REVENUE_SERIES[ACTIVE_REVENUE_INDEX]?.amountLabel ?? '';

  protected readonly isLoadingDashboard = computed(() => this.paymentsStore.isLoadingDashboard());

  protected readonly summaryCards = computed(() => {
    const encaissement = this.paymentsStore.kpiEncaissement();
    const depenses = this.paymentsStore.kpiDepenses();
    const loyerAttente = this.paymentsStore.kpiLoyerAttente();
    const solde = this.paymentsStore.kpiSolde();
    const paidCount = this.paymentsStore.kpiPaidCount();
    const pendingCount = this.paymentsStore.kpiPendingCount();
    const lateCount = this.paymentsStore.kpiLateCount();

    const pendingLabel =
      pendingCount != null
        ? `${pendingCount} paiement${pendingCount !== 1 ? 's' : ''} en attente${lateCount ? `, dont ${lateCount} en retard` : ''}`
        : undefined;

    return [
      {
        ...FINANCE_SUMMARY_CARDS[0],
        amount: encaissement ?? '—',
        count:
          paidCount != null
            ? `${paidCount} paiement${paidCount !== 1 ? 's' : ''} encaissé${paidCount !== 1 ? 's' : ''}`
            : undefined,
      },
      {
        ...FINANCE_SUMMARY_CARDS[1],
        amount: depenses ?? '—',
      },
      {
        ...FINANCE_SUMMARY_CARDS[2],
        amount: loyerAttente ?? '—',
        count: pendingLabel,
      },
      {
        ...FINANCE_SUMMARY_CARDS[3],
        amount: solde ?? '—',
      },
    ];
  });

  protected readonly balanceAmount = computed(() =>
    this.isBalanceHidden()
      ? '•••••••• FCFA'
      : (this.paymentsStore.kpiSolde() ?? '—'),
  );

  protected readonly recentExpenses = computed(() =>
    this.expensesStore.entities().slice(0, 5).map(mapExpenseToRow),
  );

  protected readonly overdueItems = computed(() => {
    const rows = this.paymentsStore.latePaymentRows();
    if (rows.length === 0) return FINANCE_SUMMARY_CARDS[0].amount
      ? []
      : [];
    return rows.slice(0, 7).map((row) => ({
      name: row.tenant,
      property: row.property,
      amount: row.amount,
      avatar: 'finances/overdue/avatar-01.webp',
    }));
  });

  protected readonly expenseLegend = computed(() => {
    const categories = this.paymentsStore.expensesByCategory();
    if (categories.length === 0) return FINANCE_EXPENSE_LEGEND;

    const total = categories.reduce((s, c) => s + (c.amount ?? 0), 0);
    const tones = ['blue', 'yellow', 'green', 'purple', 'orange'] as const;
    return categories.slice(0, 5).map((c, i) => ({
      label: c.category ?? '—',
      ratio: total > 0 ? `${Math.round(((c.amount ?? 0) / total) * 100)} %` : '—',
      value: total > 0 ? Math.round(((c.amount ?? 0) / total) * 100) : 0,
      tone: tones[i % tones.length],
    }));
  });

  protected readonly expenseChartData = computed<ChartData<'pie'>>(() => {
    const legend = this.expenseLegend();
    return {
      labels: legend.map((item) => item.label),
      datasets: [
        {
          data: legend.map((item) => item.value),
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
  });

  protected readonly transactions = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    const selectedType = this.selectedType();
    const apiRows = this.paymentsStore.paymentRows();
    const rows =
      apiRows.length > 0 ? apiRows : [...FINANCE_OVERVIEW_TRANSACTIONS].map((t, i) => ({ ...t, id: `static-${i}`, rawStatus: t.status === 'payee' ? 'PAID' : 'PENDING' }));

    return rows
      .filter((t) => {
        const matchesType =
          selectedType === 'all' || t.type === selectedType;
        const matchesQuery =
          query.length === 0 ||
          [t.date, t.reference, t.property, t.tenant, t.amount]
            .join(' ')
            .toLowerCase()
            .includes(query);
        return matchesType && matchesQuery;
      })
      .slice(0, 5);
  });

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

  protected readonly expenseChartOptions: ChartOptions<'pie'> = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 650 },
    plugins: {
      legend: { display: false },
      tooltip: { enabled: false },
    },
  };

  ngOnInit(): void {
    this.paymentsStore.loadDashboard();
    this.paymentsStore.loadLatePayments();
    this.paymentsStore.load?.({
      pageable: { page: 0, size: 10, sort: [] },
    });
    this.expensesStore.load?.({
      pageable: { page: 0, size: 5, sort: [] },
    });
  }

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

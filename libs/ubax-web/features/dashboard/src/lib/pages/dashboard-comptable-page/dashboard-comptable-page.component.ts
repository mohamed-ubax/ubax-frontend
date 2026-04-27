import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ChartData, ChartOptions, Plugin } from 'chart.js';
import { ChartModule } from 'primeng/chart';
import { AuthStore } from '@ubax-workspace/ubax-web-data-access';
import { DateRange, DateRangePickerComponent } from '@ubax-workspace/shared-ui';

type DashboardPeriod = 'Jour' | 'Mois' | 'Année';

interface DashboardKpiCard {
  readonly label: string;
  readonly amount: number;
  readonly tone: 'revenue' | 'rent' | 'pending' | 'commission';
  readonly icon: string;
  readonly iconAlt: string;
}

interface RevenuePoint {
  readonly label: string;
  readonly amount: number;
  readonly tooltipLabel: string;
  readonly highlighted?: boolean;
}

interface RevenueSplitItem {
  readonly label: string;
  readonly value: number;
  readonly percentage: string;
  readonly tone: 'short' | 'location' | 'sale';
}

interface DashboardTransaction {
  readonly id: string;
  readonly title: string;
  readonly date: string;
  readonly customer: string;
  readonly amount: number;
  readonly month: string;
  readonly logo: string;
  readonly logoAlt: string;
}

interface DashboardExpense {
  readonly id: string;
  readonly label: string;
  readonly amount: number;
  readonly icon: string;
  readonly iconAlt: string;
}

interface DashboardOverdueItem {
  readonly id: string;
  readonly name: string;
  readonly property: string;
  readonly type: string;
}

const DASHBOARD_COMPTABLE_ASSETS = {
  search: 'finances/shared/search-icon.webp',
  calendar: 'finances/shared/calendar-icon.webp',
  export: 'finances/shared/export-icon.webp',
  balanceEyeOff: 'dashboard-comptable/balance-eye-off.webp',
  kpiRevenue: 'dashboard-comptable/kpi-revenue.webp',
  kpiRent: 'dashboard-comptable/kpi-rent.webp',
  kpiPending: 'dashboard-comptable/kpi-pending.webp',
  kpiCommission: 'dashboard-comptable/kpi-commission.webp',
  addExpense: 'dashboard-comptable/cta-add-expense.webp',
  expenseMaintenance: 'dashboard-comptable/expense-entretien.webp',
  expenseMarketing: 'dashboard-comptable/expense-marketing.webp',
  expenseSalaries: 'dashboard-comptable/expense-salaires.webp',
  expenseLocale: 'dashboard-comptable/expense-locale.webp',
  expenseTotal: 'dashboard-comptable/expense-total.webp',
  transactionCheck: 'dashboard-comptable/transaction-check.webp',
  transactionArrow: 'dashboard-comptable/transaction-arrow.webp',
  transactionOrange: 'biens/bailleur/payment-orange.webp',
  transactionWave: 'biens/bailleur/payment-wave.webp',
  transactionMomo: 'dashboard-comptable/payment-momo.webp',
  warning: 'dashboard-comptable/warning.webp',
} as const;

const KPI_CARDS: readonly DashboardKpiCard[] = [
  {
    label: 'Revenus du Mois',
    amount: 15_750_000,
    tone: 'revenue',
    icon: DASHBOARD_COMPTABLE_ASSETS.kpiRevenue,
    iconAlt: 'Icône revenus du mois',
  },
  {
    label: 'Loyer encaissés',
    amount: 8_750_000,
    tone: 'rent',
    icon: DASHBOARD_COMPTABLE_ASSETS.kpiRent,
    iconAlt: 'Icône loyers encaissés',
  },
  {
    label: 'Paiements en attente',
    amount: 6_000_000,
    tone: 'pending',
    icon: DASHBOARD_COMPTABLE_ASSETS.kpiPending,
    iconAlt: 'Icône paiements en attente',
  },
  {
    label: 'Commission Agence',
    amount: 1_750_000,
    tone: 'commission',
    icon: DASHBOARD_COMPTABLE_ASSETS.kpiCommission,
    iconAlt: 'Icône commission agence',
  },
] as const;

const REVENUE_SERIES: Record<DashboardPeriod, readonly RevenuePoint[]> = {
  Jour: [
    { label: 'JAN', amount: 800_000, tooltipLabel: '800 000 FCFA' },
    { label: 'FEB', amount: 1_300_000, tooltipLabel: '1 300 000 FCFA' },
    { label: 'MAR', amount: 600_000, tooltipLabel: '600 000 FCFA' },
    { label: 'APR', amount: 1_100_000, tooltipLabel: '1 100 000 FCFA' },
    { label: 'MAY', amount: 1_850_000, tooltipLabel: '1 850 000 FCFA' },
    {
      label: 'JUN',
      amount: 1_250_000,
      tooltipLabel: '1 250 000 FCFA',
      highlighted: true,
    },
    { label: 'JUL', amount: 1_650_000, tooltipLabel: '1 650 000 FCFA' },
    { label: 'AUG', amount: 1_500_000, tooltipLabel: '1 500 000 FCFA' },
    { label: 'SEP', amount: 1_320_000, tooltipLabel: '1 320 000 FCFA' },
    { label: 'OCT', amount: 950_000, tooltipLabel: '950 000 FCFA' },
    { label: 'NOV', amount: 600_000, tooltipLabel: '600 000 FCFA' },
    { label: 'DEC', amount: 1_700_000, tooltipLabel: '1 700 000 FCFA' },
  ],
  Mois: [
    { label: 'JAN', amount: 1_400_000, tooltipLabel: '1 400 000 FCFA' },
    { label: 'FEB', amount: 2_200_000, tooltipLabel: '2 200 000 FCFA' },
    { label: 'MAR', amount: 800_000, tooltipLabel: '800 000 FCFA' },
    { label: 'APR', amount: 1_900_000, tooltipLabel: '1 900 000 FCFA' },
    { label: 'MAY', amount: 4_450_000, tooltipLabel: '4 450 000 FCFA' },
    {
      label: 'JUN',
      amount: 2_900_000,
      tooltipLabel: '2 900 000 FCFA',
      highlighted: true,
    },
    { label: 'JUL', amount: 3_850_000, tooltipLabel: '3 850 000 FCFA' },
    { label: 'AUG', amount: 3_250_000, tooltipLabel: '3 250 000 FCFA' },
    { label: 'SEP', amount: 2_950_000, tooltipLabel: '2 950 000 FCFA' },
    { label: 'OCT', amount: 1_550_000, tooltipLabel: '1 550 000 FCFA' },
    { label: 'NOV', amount: 700_000, tooltipLabel: '700 000 FCFA' },
    { label: 'DEC', amount: 3_200_000, tooltipLabel: '3 200 000 FCFA' },
  ],
  Année: [
    { label: 'JAN', amount: 1_900_000, tooltipLabel: '1 900 000 FCFA' },
    { label: 'FEB', amount: 3_300_000, tooltipLabel: '3 300 000 FCFA' },
    { label: 'MAR', amount: 600_000, tooltipLabel: '600 000 FCFA' },
    { label: 'APR', amount: 2_300_000, tooltipLabel: '2 300 000 FCFA' },
    { label: 'MAY', amount: 5_600_000, tooltipLabel: '5 600 000 FCFA' },
    {
      label: 'JUN',
      amount: 3_500_000,
      tooltipLabel: '3 500 000 FCFA',
      highlighted: true,
    },
    { label: 'JUL', amount: 4_800_000, tooltipLabel: '4 800 000 FCFA' },
    { label: 'AUG', amount: 4_100_000, tooltipLabel: '4 100 000 FCFA' },
    { label: 'SEP', amount: 3_700_000, tooltipLabel: '3 700 000 FCFA' },
    { label: 'OCT', amount: 1_800_000, tooltipLabel: '1 800 000 FCFA' },
    { label: 'NOV', amount: 600_000, tooltipLabel: '600 000 FCFA' },
    { label: 'DEC', amount: 3_600_000, tooltipLabel: '3 600 000 FCFA' },
  ],
};

const Y_AXIS_LABELS: Record<DashboardPeriod, readonly string[]> = {
  Jour: ['2M', '1.5M', '1M', '500K', '250K', '0'],
  Mois: ['6M', '4M', '3M', '2M', '1M', '0'],
  Année: ['10M', '5M', '3M', '1M', '500K', '0'],
};

const REVENUE_SPLIT: Record<DashboardPeriod, readonly RevenueSplitItem[]> = {
  Jour: [
    { label: 'courte durée', value: 22, percentage: '22%', tone: 'short' },
    { label: 'Location', value: 54, percentage: '54%', tone: 'location' },
    { label: 'Vente', value: 24, percentage: '24%', tone: 'sale' },
  ],
  Mois: [
    { label: 'courte durée', value: 18, percentage: '18%', tone: 'short' },
    { label: 'Location', value: 61, percentage: '61%', tone: 'location' },
    { label: 'Vente', value: 21, percentage: '21%', tone: 'sale' },
  ],
  Année: [
    { label: 'courte durée', value: 15, percentage: '15%', tone: 'short' },
    { label: 'Location', value: 65, percentage: '65%', tone: 'location' },
    { label: 'Vente', value: 25, percentage: '25%', tone: 'sale' },
  ],
};

const INITIAL_TRANSACTIONS: readonly DashboardTransaction[] = [
  {
    id: 'transaction-1',
    title: 'Réception paiement Location',
    date: '5 Avril 2026 à 12 : 30',
    customer: 'Koné Ibrahim',
    amount: 450_000,
    month: 'Mars 2026',
    logo: DASHBOARD_COMPTABLE_ASSETS.transactionWave,
    logoAlt: 'Logo Wave',
  },
  {
    id: 'transaction-2',
    title: 'Réception paiement Location',
    date: '2 Avril 2026 à 17 : 41',
    customer: 'Koffi Didier',
    amount: 600_000,
    month: 'Mars 2026',
    logo: DASHBOARD_COMPTABLE_ASSETS.transactionOrange,
    logoAlt: 'Logo Orange Money',
  },
  {
    id: 'transaction-3',
    title: 'Réception paiement Location',
    date: '2 Avril 2026 à 17 : 41',
    customer: 'Konan Olivier',
    amount: 250_000,
    month: 'Mars 2026',
    logo: DASHBOARD_COMPTABLE_ASSETS.transactionMomo,
    logoAlt: 'Logo MTN Mobile Money',
  },
  {
    id: 'transaction-4',
    title: 'Réception paiement Location',
    date: '2 Avril 2026 à 17 : 41',
    customer: 'Koffi Didier',
    amount: 600_000,
    month: 'Mars 2026',
    logo: DASHBOARD_COMPTABLE_ASSETS.transactionOrange,
    logoAlt: 'Logo Orange Money',
  },
  {
    id: 'transaction-5',
    title: 'Réception paiement Location',
    date: '5 Avril 2026 à 12 : 30',
    customer: 'Koné Ibrahim',
    amount: 450_000,
    month: 'Mars 2026',
    logo: DASHBOARD_COMPTABLE_ASSETS.transactionWave,
    logoAlt: 'Logo Wave',
  },
  {
    id: 'transaction-6',
    title: 'Réception paiement Location',
    date: '5 Avril 2026 à 12 : 30',
    customer: 'Koné Ibrahim',
    amount: 450_000,
    month: 'Mars 2026',
    logo: DASHBOARD_COMPTABLE_ASSETS.transactionWave,
    logoAlt: 'Logo Wave',
  },
] as const;

const INITIAL_EXPENSES: readonly DashboardExpense[] = [
  {
    id: 'expense-1',
    label: 'Entretien',
    amount: 250_000,
    icon: DASHBOARD_COMPTABLE_ASSETS.expenseMaintenance,
    iconAlt: 'Icône entretien',
  },
  {
    id: 'expense-2',
    label: 'Marketing',
    amount: 250_000,
    icon: DASHBOARD_COMPTABLE_ASSETS.expenseMarketing,
    iconAlt: 'Icône marketing',
  },
  {
    id: 'expense-3',
    label: 'Salaires',
    amount: 800_000,
    icon: DASHBOARD_COMPTABLE_ASSETS.expenseSalaries,
    iconAlt: 'Icône salaires',
  },
  {
    id: 'expense-4',
    label: 'Locale',
    amount: 300_000,
    icon: DASHBOARD_COMPTABLE_ASSETS.expenseLocale,
    iconAlt: 'Icône local',
  },
] as const;

const INITIAL_OVERDUE_ITEMS: readonly DashboardOverdueItem[] = [
  {
    id: 'overdue-1',
    name: 'Affoué Sandrine',
    property: 'résidence Plateau',
    type: 'Appartement',
  },
  {
    id: 'overdue-2',
    name: 'Kouamé Patrick',
    property: 'Immeuble kalia',
    type: 'Appartement',
  },
  {
    id: 'overdue-3',
    name: 'Konan Olivier',
    property: 'Villa Riviera',
    type: 'Villa',
  },
  {
    id: 'overdue-4',
    name: 'Koné Ibrahim',
    property: 'résidence Plateau',
    type: 'Appartement',
  },
  {
    id: 'overdue-5',
    name: 'Affoué Sandrine',
    property: 'résidence Plateau',
    type: 'Appartement',
  },
  {
    id: 'overdue-6',
    name: 'Traoré Aïcha',
    property: 'résidence Plateau',
    type: 'Appartement',
  },
] as const;

const DRAWER_CATEGORIES = [
  'Entretien',
  'Marketing',
  'Salaires',
  'Locale',
  'Autre',
] as const;

function formatFcfa(amount: number): string {
  return `${new Intl.NumberFormat('fr-FR').format(amount).replace(/\u202f/g, ' ')} FCFA`;
}

function formatShortDate(date: Date): string {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  }).format(date);
}

function normalizeForSearch(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function parseAmountInput(value: string): number {
  const numericValue = Number(value.replace(/[^\d]/g, ''));
  return Number.isFinite(numericValue) ? numericValue : 0;
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
): void {
  const safeRadius = Math.min(radius, width / 2, height / 2);

  ctx.beginPath();
  ctx.moveTo(x + safeRadius, y);
  ctx.lineTo(x + width - safeRadius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + safeRadius);
  ctx.lineTo(x + width, y + height - safeRadius);
  ctx.quadraticCurveTo(
    x + width,
    y + height,
    x + width - safeRadius,
    y + height,
  );
  ctx.lineTo(x + safeRadius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - safeRadius);
  ctx.lineTo(x, y + safeRadius);
  ctx.quadraticCurveTo(x, y, x + safeRadius, y);
  ctx.closePath();
}

function createRevenueFocusPlugin(
  activeIndex: number,
  tooltipLabel: string,
): Plugin<'line'> {
  return {
    id: 'ubaxDashboardComptableRevenueFocus',
    afterDatasetsDraw(chart) {
      const activePoint = chart.getDatasetMeta(0).data[activeIndex] as
        | { x: number; y: number }
        | undefined;

      if (!activePoint) {
        return;
      }

      const { ctx, chartArea } = chart;
      const bubbleWidth = 149;
      const bubbleHeight = 52;
      const bubbleX = Math.min(
        Math.max(activePoint.x, chartArea.left + bubbleWidth / 2),
        chartArea.right - bubbleWidth / 2,
      );
      const bubbleY = chartArea.top + 18;

      ctx.save();

      ctx.strokeStyle = 'rgba(232, 125, 30, 0.42)';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(activePoint.x, bubbleY + bubbleHeight + 10);
      ctx.lineTo(activePoint.x, chartArea.bottom);
      ctx.stroke();

      ctx.fillStyle = '#e87d1e';
      ctx.beginPath();
      ctx.arc(activePoint.x, activePoint.y, 6, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(activePoint.x, activePoint.y, 2.8, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#1a3047';
      drawRoundedRect(
        ctx,
        bubbleX - bubbleWidth / 2,
        bubbleY,
        bubbleWidth,
        bubbleHeight,
        6,
      );
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = '500 13px Lexend';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(tooltipLabel, bubbleX, bubbleY + bubbleHeight / 2 + 1);

      ctx.restore();
    },
  };
}

function resolveExpenseIcon(category: string): {
  icon: string;
  iconAlt: string;
} {
  switch (normalizeForSearch(category)) {
    case 'entretien':
      return {
        icon: DASHBOARD_COMPTABLE_ASSETS.expenseMaintenance,
        iconAlt: 'Icône entretien',
      };
    case 'marketing':
      return {
        icon: DASHBOARD_COMPTABLE_ASSETS.expenseMarketing,
        iconAlt: 'Icône marketing',
      };
    case 'salaires':
      return {
        icon: DASHBOARD_COMPTABLE_ASSETS.expenseSalaries,
        iconAlt: 'Icône salaires',
      };
    case 'locale':
    case 'local':
      return {
        icon: DASHBOARD_COMPTABLE_ASSETS.expenseLocale,
        iconAlt: 'Icône local',
      };
    default:
      return {
        icon: DASHBOARD_COMPTABLE_ASSETS.expenseTotal,
        iconAlt: 'Icône dépense',
      };
  }
}

@Component({
  selector: 'ubax-dashboard-comptable-page',
  standalone: true,
  imports: [ChartModule, DateRangePickerComponent, FormsModule],
  templateUrl: './dashboard-comptable-page.component.html',
  styleUrl: './dashboard-comptable-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComptablePageComponent {
  protected readonly assets = DASHBOARD_COMPTABLE_ASSETS;
  protected readonly kpiCards = KPI_CARDS;
  protected readonly expenseCategories = DRAWER_CATEGORIES;
  protected readonly authStore = inject(AuthStore);

  protected readonly datePickerOpen = signal(false);
  protected readonly selectedRange = signal<DateRange | null>(null);
  protected readonly searchQuery = signal('');
  protected readonly balanceVisible = signal(true);
  protected readonly revenuePeriod = signal<DashboardPeriod>('Année');
  protected readonly splitPeriod = signal<DashboardPeriod>('Année');
  protected readonly addExpenseOpen = signal(false);
  protected readonly remindedIds = signal<string[]>([]);
  protected readonly transactions = signal([...INITIAL_TRANSACTIONS]);
  protected readonly expenses = signal([...INITIAL_EXPENSES]);
  protected readonly overdueItems = signal([...INITIAL_OVERDUE_ITEMS]);

  protected readonly draftCategory = signal<string>('Entretien');
  protected readonly draftAmount = signal('');
  protected readonly draftProperty = signal('');
  protected readonly draftReference = signal('');

  protected readonly displayName = computed(() => {
    const user = this.authStore.user();
    const fullName = [user?.prenom, user?.nom].filter(Boolean).join(' ').trim();
    return fullName || 'Alain Traoré';
  });
  protected readonly selectedRangeLabel = computed(() => {
    const range = this.selectedRange();

    if (!range) {
      return 'Sélectionner une date';
    }

    return `${formatShortDate(range.start)} - ${formatShortDate(range.end)}`;
  });
  protected readonly balanceAmount = computed(() =>
    this.balanceVisible() ? formatFcfa(15_750_000) : '•••••••••••••••',
  );
  protected readonly monthLabels = computed(() =>
    REVENUE_SERIES[this.revenuePeriod()].map((point) => point.label),
  );
  protected readonly yAxisLabels = computed(
    () => Y_AXIS_LABELS[this.revenuePeriod()],
  );
  protected readonly activeRevenuePoint = computed(() => {
    const series = REVENUE_SERIES[this.revenuePeriod()];
    return series.find((point) => point.highlighted) ?? series[0];
  });
  protected readonly activeRevenueIndex = computed(() => {
    const index = REVENUE_SERIES[this.revenuePeriod()].findIndex(
      (point) => point.highlighted,
    );
    return Math.max(index, 0);
  });
  protected readonly revenueChartPlugins = computed(() => [
    createRevenueFocusPlugin(
      this.activeRevenueIndex(),
      this.activeRevenuePoint().tooltipLabel,
    ),
  ]);
  protected readonly revenueChartData = computed<ChartData<'line'>>(() => {
    const points = REVENUE_SERIES[this.revenuePeriod()];

    return {
      labels: points.map((point) => point.label),
      datasets: [
        {
          data: points.map((point) => point.amount),
          borderColor: '#e87d1e',
          borderWidth: 3,
          tension: 0.44,
          fill: true,
          pointRadius: points.map((point) => (point.highlighted ? 6 : 0)),
          pointHoverRadius: points.map((point) => (point.highlighted ? 6 : 0)),
          pointBorderWidth: 0,
          pointBackgroundColor: '#e87d1e',
          clip: 8,
          backgroundColor: (context) => {
            const { ctx, chartArea } = context.chart;

            if (!chartArea) {
              return 'rgba(232, 125, 30, 0.22)';
            }

            const gradient = ctx.createLinearGradient(
              0,
              chartArea.top,
              0,
              chartArea.bottom,
            );
            gradient.addColorStop(0, 'rgba(232, 125, 30, 0.34)');
            gradient.addColorStop(0.55, 'rgba(232, 125, 30, 0.12)');
            gradient.addColorStop(1, 'rgba(232, 125, 30, 0)');
            return gradient;
          },
        },
      ],
    };
  });
  protected readonly revenueChartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 420 },
    interaction: { intersect: false, mode: undefined },
    plugins: {
      legend: { display: false },
      tooltip: { enabled: false },
    },
    layout: {
      padding: { top: 18, right: 10, bottom: 2, left: 8 },
    },
    scales: {
      x: {
        display: false,
        grid: { display: false },
        border: { display: false },
      },
      y: {
        min: 0,
        max: 10_000_000,
        display: false,
        grid: { display: false },
        border: { display: false },
      },
    },
  };
  protected readonly revenueSplit = computed(
    () => REVENUE_SPLIT[this.splitPeriod()],
  );
  protected readonly distributionChartData = computed<ChartData<'doughnut'>>(
    () => ({
      labels: this.revenueSplit().map((item) => item.label),
      datasets: [
        {
          data: this.revenueSplit().map((item) => item.value),
          backgroundColor: ['#2388ff', '#34c759', '#ff912c'],
          borderWidth: 0,
          spacing: 0,
          hoverOffset: 0,
        },
      ],
    }),
  );
  protected readonly distributionChartOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 420 },
    rotation: -90,
    circumference: 180,
    cutout: '62%',
    plugins: {
      legend: { display: false },
      tooltip: { enabled: false },
    },
  };
  protected readonly filteredTransactions = computed(() => {
    const query = normalizeForSearch(this.searchQuery().trim());

    if (!query) {
      return this.transactions();
    }

    return this.transactions().filter((transaction) =>
      normalizeForSearch(
        [
          transaction.title,
          transaction.date,
          transaction.customer,
          formatFcfa(transaction.amount),
          transaction.month,
        ].join(' '),
      ).includes(query),
    );
  });
  protected readonly filteredOverdueItems = computed(() => {
    const query = normalizeForSearch(this.searchQuery().trim());

    if (!query) {
      return this.overdueItems();
    }

    return this.overdueItems().filter((item) =>
      normalizeForSearch(`${item.name} ${item.property} ${item.type}`).includes(
        query,
      ),
    );
  });
  protected readonly totalExpenses = computed(() =>
    this.expenses().reduce((total, item) => total + item.amount, 0),
  );

  protected onDateRangeApplied(range: DateRange): void {
    this.selectedRange.set(range);
  }

  protected toggleBalanceVisibility(): void {
    this.balanceVisible.update((visible) => !visible);
  }

  protected openAddExpense(): void {
    this.addExpenseOpen.set(true);
  }

  protected closeAddExpense(): void {
    this.addExpenseOpen.set(false);
    this.resetExpenseDraft();
  }

  protected formatAmount(amount: number): string {
    return formatFcfa(amount);
  }

  protected isRelanceSent(id: string): boolean {
    return this.remindedIds().includes(id);
  }

  protected sendReminder(id: string): void {
    this.remindedIds.update((ids) => (ids.includes(id) ? ids : [...ids, id]));
  }

  protected saveExpense(): void {
    const category = this.draftCategory().trim() || 'Autre';
    const amount = parseAmountInput(this.draftAmount());

    if (amount <= 0) {
      return;
    }

    const resolvedIcon = resolveExpenseIcon(category);

    this.expenses.update((items) => [
      ...items,
      {
        id: `expense-${Date.now()}`,
        label: category,
        amount,
        icon: resolvedIcon.icon,
        iconAlt: resolvedIcon.iconAlt,
      },
    ]);

    this.closeAddExpense();
  }

  private resetExpenseDraft(): void {
    this.draftCategory.set('Entretien');
    this.draftAmount.set('');
    this.draftProperty.set('');
    this.draftReference.set('');
  }
}

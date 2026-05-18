import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  HostListener,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ChartData, ChartOptions } from 'chart.js';
import { ChartModule } from 'primeng/chart';
import { AuthStore } from '@ubax-workspace/ubax-web-data-access';
import {
  DateRange,
  DateRangePickerComponent,
  UiFormDatePickerComponent,
  UiFormInputComponent,
  UiFormSelectComponent,
} from '@ubax-workspace/shared-ui';
import type {
  DashboardExpenseLinkMode,
  DashboardExpenseUpload,
  DashboardPeriod,
} from '../../types/dashboard-comptable.types';
import {
  DASHBOARD_COMPTABLE_ASSETS,
  KPI_CARDS,
  REVENUE_SERIES,
  Y_AXIS_LABELS,
  REVENUE_SPLIT,
  INITIAL_TRANSACTIONS,
  INITIAL_EXPENSES,
  INITIAL_OVERDUE_ITEMS,
  DRAWER_CATEGORIES,
  EXPENSE_PAYMENT_METHODS,
  EXPENSE_PROPERTIES,
  EXPENSE_PROVIDER_OPTIONS,
  MODAL_CLOSE_DURATION_MS,
  DEFAULT_EXPENSE_DATE,
  startOfDay,
  formatFileSize,
  formatFcfa,
  formatShortDate,
  normalizeForSearch,
  parseAmountInput,
  createRevenueFocusPlugin,
  resolveExpenseIcon,
} from '../../constants/dashboard-comptable.constants';

@Component({
  selector: 'ubax-dashboard-comptable-page',
  standalone: true,
  imports: [
    ChartModule,
    DateRangePickerComponent,
    FormsModule,
    UiFormDatePickerComponent,
    UiFormInputComponent,
    UiFormSelectComponent,
  ],
  templateUrl: './dashboard-comptable-page.component.html',
  styleUrl: './dashboard-comptable-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComptablePageComponent {
  protected readonly assets = DASHBOARD_COMPTABLE_ASSETS;
  protected readonly kpiCards = KPI_CARDS;
  protected readonly expenseCategories = DRAWER_CATEGORIES;
  protected readonly expensePaymentMethods = EXPENSE_PAYMENT_METHODS;
  protected readonly expenseProperties = EXPENSE_PROPERTIES;
  protected readonly expensePropertyLabels = EXPENSE_PROPERTIES.map(
    (p) => p.label,
  );
  protected readonly expenseProviders = EXPENSE_PROVIDER_OPTIONS;
  protected readonly authStore = inject(AuthStore);
  private readonly document = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);
  private closeExpenseTimeout: ReturnType<typeof setTimeout> | null = null;
  private scrollLockState: {
    readonly htmlOverflow: string;
    readonly bodyOverflow: string;
    readonly bodyTouchAction: string;
    readonly bodyPosition: string;
    readonly bodyTop: string;
    readonly bodyWidth: string;
    readonly bodyHadOverlayClass: boolean;
    readonly scrollY: number;
  } | null = null;

  protected readonly datePickerOpen = signal(false);
  protected readonly selectedRange = signal<DateRange | null>(null);
  protected readonly searchQuery = signal('');
  protected readonly balanceVisible = signal(true);
  protected readonly revenuePeriod = signal<DashboardPeriod>('Année');
  protected readonly splitPeriod = signal<DashboardPeriod>('Année');
  protected readonly addExpenseOpen = signal(false);
  protected readonly addExpenseClosing = signal(false);
  protected readonly remindedIds = signal<string[]>([]);
  protected readonly transactions = signal([...INITIAL_TRANSACTIONS]);
  protected readonly expenses = signal([...INITIAL_EXPENSES]);
  protected readonly overdueItems = signal([...INITIAL_OVERDUE_ITEMS]);

  protected readonly draftCategory = signal<string>('Réparation');
  protected readonly draftAmount = signal('75 000 FCFA');
  protected readonly draftProperty = signal(EXPENSE_PROPERTIES[0]?.label ?? '');
  protected readonly draftReference = signal('UBX-FAC-0012');
  protected readonly draftPaymentMethod = signal<string>('Espèces');
  protected readonly draftProvider = signal<string>(
    EXPENSE_PROVIDER_OPTIONS[0] ?? '',
  );
  protected readonly draftDate = signal<Date>(startOfDay(DEFAULT_EXPENSE_DATE));
  protected readonly draftExpenseLinkMode =
    signal<DashboardExpenseLinkMode>('property');
  protected readonly draftUploads = signal<DashboardExpenseUpload[]>([]);

  constructor() {
    effect(() => {
      const isOverlayVisible =
        this.addExpenseOpen() || this.addExpenseClosing();

      this.document.body.classList.toggle(
        'ubax-dashboard-overlay-open',
        isOverlayVisible,
      );

      if (isOverlayVisible) {
        this.lockPageScroll();
      } else {
        this.unlockPageScroll();
      }
    });

    this.destroyRef.onDestroy(() => {
      if (this.closeExpenseTimeout) {
        clearTimeout(this.closeExpenseTimeout);
      }

      this.unlockPageScroll();
      this.document.body.classList.remove('ubax-dashboard-overlay-open');
    });
  }

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
  protected readonly modalVisible = computed(
    () => this.addExpenseOpen() || this.addExpenseClosing(),
  );
  protected readonly isPropertyLinkedExpense = computed(
    () => this.draftExpenseLinkMode() === 'property',
  );
  protected readonly selectedExpenseProperty = computed(
    () =>
      this.expenseProperties.find(
        (option) => option.label === this.draftProperty(),
      ) ?? this.expenseProperties[0],
  );
  protected readonly draftOwner = computed(() => {
    if (!this.isPropertyLinkedExpense()) {
      return 'Agence générale';
    }

    return this.selectedExpenseProperty()?.owner ?? 'Propriétaire non assigné';
  });
  protected readonly canSaveExpense = computed(
    () => parseAmountInput(this.draftAmount()) > 0,
  );

  protected onDateRangeApplied(range: DateRange): void {
    this.selectedRange.set(range);
  }

  @HostListener('document:keydown.escape')
  protected handleEscape(): void {
    if (this.modalVisible()) {
      this.closeAddExpense();
    }
  }

  protected toggleBalanceVisibility(): void {
    this.balanceVisible.update((visible) => !visible);
  }

  protected openAddExpense(): void {
    if (this.closeExpenseTimeout) {
      clearTimeout(this.closeExpenseTimeout);
      this.closeExpenseTimeout = null;
    }

    this.addExpenseClosing.set(false);
    this.addExpenseOpen.set(true);
  }

  protected closeAddExpense(): void {
    if (!this.addExpenseOpen()) {
      return;
    }

    this.addExpenseClosing.set(true);

    if (this.closeExpenseTimeout) {
      clearTimeout(this.closeExpenseTimeout);
    }

    this.closeExpenseTimeout = setTimeout(() => {
      this.addExpenseOpen.set(false);
      this.addExpenseClosing.set(false);
      this.closeExpenseTimeout = null;
      this.resetExpenseDraft();
    }, MODAL_CLOSE_DURATION_MS);
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

  protected setExpenseLinkMode(mode: DashboardExpenseLinkMode): void {
    this.draftExpenseLinkMode.set(mode);
  }

  protected updateExpenseUploads(
    fileList: FileList | null,
    input: HTMLInputElement,
  ): void {
    if (!fileList || fileList.length === 0) {
      return;
    }

    const nextUploads = Array.from(fileList).map((file) => ({
      id: `${file.name}-${file.lastModified}-${file.size}`,
      name: file.name,
      sizeLabel: formatFileSize(file.size),
    }));

    this.draftUploads.update((uploads) => {
      const existingIds = new Set(uploads.map((upload) => upload.id));
      const deduplicated = nextUploads.filter(
        (upload) => !existingIds.has(upload.id),
      );

      return [...uploads, ...deduplicated];
    });

    input.value = '';
  }

  protected removeExpenseUpload(uploadId: string): void {
    this.draftUploads.update((uploads) =>
      uploads.filter((upload) => upload.id !== uploadId),
    );
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
    this.draftCategory.set('Réparation');
    this.draftAmount.set('75 000 FCFA');
    this.draftProperty.set(EXPENSE_PROPERTIES[0]?.label ?? '');
    this.draftReference.set('UBX-FAC-0012');
    this.draftPaymentMethod.set('Espèces');
    this.draftProvider.set(EXPENSE_PROVIDER_OPTIONS[0] ?? '');
    this.draftDate.set(startOfDay(DEFAULT_EXPENSE_DATE));
    this.draftExpenseLinkMode.set('property');
    this.draftUploads.set([]);
  }

  private lockPageScroll(): void {
    if (this.scrollLockState) {
      return;
    }

    const { body, documentElement, defaultView } = this.document;

    if (!body || !documentElement) {
      return;
    }

    this.scrollLockState = {
      htmlOverflow: documentElement.style.overflow,
      bodyOverflow: body.style.overflow,
      bodyTouchAction: body.style.touchAction,
      bodyPosition: body.style.position,
      bodyTop: body.style.top,
      bodyWidth: body.style.width,
      bodyHadOverlayClass: body.classList.contains(
        'ubax-dashboard-overlay-open',
      ),
      scrollY: defaultView?.scrollY ?? documentElement.scrollTop ?? 0,
    };

    body.classList.add('ubax-dashboard-overlay-open');
    documentElement.style.overflow = 'hidden';
    body.style.overflow = 'hidden';
    body.style.touchAction = 'none';
    body.style.position = 'fixed';
    body.style.top = `-${this.scrollLockState.scrollY}px`;
    body.style.width = '100%';
  }

  private unlockPageScroll(): void {
    if (!this.scrollLockState) {
      return;
    }

    const { body, documentElement, defaultView } = this.document;

    documentElement.style.overflow = this.scrollLockState.htmlOverflow;
    body.style.overflow = this.scrollLockState.bodyOverflow;
    body.style.touchAction = this.scrollLockState.bodyTouchAction;
    body.style.position = this.scrollLockState.bodyPosition;
    body.style.top = this.scrollLockState.bodyTop;
    body.style.width = this.scrollLockState.bodyWidth;

    if (!this.scrollLockState.bodyHadOverlayClass) {
      body.classList.remove('ubax-dashboard-overlay-open');
    }

    defaultView?.scrollTo({
      top: this.scrollLockState.scrollY,
      left: 0,
      behavior: 'auto',
    });

    this.scrollLockState = null;
  }
}

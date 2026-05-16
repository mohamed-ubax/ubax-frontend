import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { UIChart } from 'primeng/chart';
import { ChartData, ChartOptions } from 'chart.js';
import { AuthStore } from '@ubax-workspace/ubax-web-data-access';
import {
  DateRange,
  DateRangePickerComponent,
  UbaxPaginatorComponent,
} from '@ubax-workspace/shared-ui';
import {
  PAGE_SIZE,
  REVENUE_MAX,
  DASHBOARD_ICONS,
  KPI_CARDS,
  DONUT_LEGEND,
  REVENUE_BARS,
  OVERVIEW_PROPERTIES,
  FULL_LIST_PROPERTIES,
  TRANSACTIONS,
} from '../../constants/dashboard-dg.constants';

@Component({
  selector: 'ubax-dashboard-dg-page',
  standalone: true,
  imports: [
    RouterLink,
    UbaxPaginatorComponent,
    DateRangePickerComponent,
    UIChart,
  ],
  templateUrl: './dashboard-dg-page.component.html',
  styleUrl: './dashboard-dg-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardDgPageComponent {
  private readonly document = inject(DOCUMENT);

  readonly authStore = inject(AuthStore);
  readonly icons = DASHBOARD_ICONS;
  readonly kpiCards = KPI_CARDS;
  readonly donutLegend = DONUT_LEGEND;
  readonly revenueBars = REVENUE_BARS;
  readonly overviewProperties = OVERVIEW_PROPERTIES;
  readonly transactions = TRANSACTIONS;
  readonly donutChartData: ChartData<'doughnut'> = {
    labels: ['Réservés', 'Occupés', 'Disponibles', 'En maintenance'],
    datasets: [
      {
        data: [12, 9, 6, 2],
        backgroundColor: ['#E87D1E', '#16B55B', '#2388FF', '#FF383C'],
        borderColor: '#FFFFFF',
        borderWidth: 6,
        hoverOffset: 0,
        spacing: 2,
      },
    ],
  };
  readonly donutChartOptions: ChartOptions<'doughnut'> = {
    animation: {
      duration: 650,
    },
    responsive: true,
    maintainAspectRatio: false,
    cutout: '72%',
    rotation: (-34 * Math.PI) / 180,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        enabled: false,
      },
    },
  };
  readonly revenueChartData: ChartData<'bar'> = {
    labels: REVENUE_BARS.map((bar) => bar.label),
    datasets: [
      {
        data: REVENUE_BARS.map((bar) => bar.value),
        backgroundColor: REVENUE_BARS.map((bar) =>
          bar.highlighted ? '#1A3047' : '#FF8D28',
        ),
        borderSkipped: false,
        borderRadius: 3,
        barThickness: 25,
        maxBarThickness: 25,
        categoryPercentage: 0.74,
        barPercentage: 1,
        stack: 'revenue',
      },
      {
        data: REVENUE_BARS.map((bar) => REVENUE_MAX - bar.value),
        backgroundColor: '#E5E5EF',
        borderSkipped: false,
        borderRadius: 3,
        barThickness: 25,
        maxBarThickness: 25,
        categoryPercentage: 0.74,
        barPercentage: 1,
        stack: 'revenue',
      },
    ],
  };
  readonly revenueChartOptions: ChartOptions<'bar'> = {
    animation: {
      duration: 650,
    },
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        enabled: false,
      },
    },
    layout: {
      padding: {
        top: 10,
        right: 4,
        bottom: 2,
        left: 4,
      },
    },
    scales: {
      x: {
        stacked: true,
        display: false,
        grid: {
          display: false,
        },
        border: {
          display: false,
        },
      },
      y: {
        stacked: true,
        display: false,
        min: 0,
        max: REVENUE_MAX,
        grid: {
          display: false,
        },
        border: {
          display: false,
        },
      },
    },
  };

  readonly datePickerOpen = signal(false);
  readonly selectedRange = signal<DateRange | null>(null);
  readonly showFullList = signal(false);
  readonly currentPage = signal(3);

  readonly displayName = computed(
    () => this.authStore.fullName() || 'Jean-Marc Kouassi',
  );

  readonly pageTitle = computed(() =>
    this.showFullList() ? 'Liste des biens' : 'Tableau de bord',
  );

  readonly headerDateLabel = computed(() => {
    const range = this.selectedRange();
    if (!range) {
      return 'Sélectionner une date';
    }

    return `${this.formatShortDate(range.start)} - ${this.formatShortDate(range.end)}`;
  });

  readonly totalPages = computed(() =>
    Math.ceil(FULL_LIST_PROPERTIES.length / PAGE_SIZE),
  );

  readonly pagedProperties = computed(() => {
    const start = (this.currentPage() - 1) * PAGE_SIZE;
    return FULL_LIST_PROPERTIES.slice(start, start + PAGE_SIZE);
  });

  readonly exportRows = computed(() =>
    this.showFullList() ? this.pagedProperties() : this.overviewProperties,
  );

  openDatePicker(): void {
    this.datePickerOpen.set(true);
  }

  onDateRangeApplied(range: DateRange): void {
    this.selectedRange.set(range);
  }

  toggleFullList(): void {
    const nextState = !this.showFullList();
    const applyState = () => {
      this.showFullList.set(nextState);

      if (nextState) {
        this.currentPage.set(3);
      }
    };

    if ('startViewTransition' in this.document) {
      this.document.startViewTransition(() => applyState());
      return;
    }

    applyState();
  }

  exportVisibleRows(): void {
    const currentWindow = this.document.defaultView;

    if (!currentWindow) {
      return;
    }

    const lines = [
      'ID;Nom du bien;Type;Localisation;Prix;Locataires;Statut',
      ...this.exportRows().map((row) =>
        [
          row.id,
          row.name,
          row.type,
          row.location,
          row.price,
          row.tenant,
          row.status,
        ].join(';'),
      ),
    ];

    const blob = new Blob([lines.join('\n')], {
      type: 'text/csv;charset=utf-8',
    });
    const url = currentWindow.URL.createObjectURL(blob);
    const link = this.document.createElement('a');

    link.href = url;
    link.download = this.showFullList()
      ? 'dashboard-dg-liste-biens.csv'
      : 'dashboard-dg-overview.csv';

    this.document.body.append(link);
    link.click();
    link.remove();
    currentWindow.URL.revokeObjectURL(url);
  }

  private formatShortDate(date: Date): string {
    const day = `${date.getDate()}`.padStart(2, '0');
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const year = `${date.getFullYear()}`.slice(-2);

    return `${day}/${month}/${year}`;
  }
}

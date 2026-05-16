import { DOCUMENT, NgClass } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ChartData, ChartOptions } from 'chart.js';
import { UIChart } from 'primeng/chart';
import { SelectModule } from 'primeng/select';
import { AuthStore } from '@ubax-workspace/ubax-web-data-access';
import { DateRange, DateRangePickerComponent } from '@ubax-workspace/shared-ui';
import type {
  DashboardCommercialActivityPeriod,
  DashboardCommercialKpiCard,
  DashboardCommercialPlanningDay,
  DashboardCommercialPlanningEventView,
  DashboardCommercialProspectPoint,
  DashboardCommercialPropertyCard,
} from '../../types/dashboard-commercial.types';
import {
  ACTIVITY_OPTIONS,
  ACTIVITY_SNAPSHOTS,
  PLANNING_TIME_LABELS,
  PLANNING_EVENT_RECORDS,
  PROPERTY_CARDS,
  PLANNING_BASE_WEEK_START,
  PROSPECT_AXIS_VALUES,
  STATE_TONE_COLORS,
  dashboardCommercialAsset,
  parseLocalDate,
  addDays,
  startOfWeek,
  formatIsoDate,
  normalize,
  matchesDashboardSearch,
  isEventWithinRange,
  formatFrenchWeekday,
  formatFrenchLongDate,
  createPlanningEventView,
} from '../../constants/dashboard-commercial.constants';

const FRENCH_SHORT_DATE_FORMATTER = new Intl.DateTimeFormat('fr-FR', {
  day: '2-digit',
  month: '2-digit',
  year: '2-digit',
});

@Component({
  selector: 'ubax-dashboard-commercial-page',
  standalone: true,
  imports: [
    FormsModule,
    RouterLink,
    SelectModule,
    UIChart,
    DateRangePickerComponent,
    NgClass,
  ],
  templateUrl: './dashboard-commercial-page.component.html',
  styleUrl: './dashboard-commercial-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardCommercialPageComponent {
  private readonly document = inject(DOCUMENT);

  readonly authStore = inject(AuthStore);
  readonly searchIconSrc = dashboardCommercialAsset('icons/search.webp');
  readonly calendarIconSrc = dashboardCommercialAsset('icons/calendar.webp');
  readonly planningFilterIconSrc = dashboardCommercialAsset(
    'planning/filter-calendar.webp',
  );
  readonly exportIconSrc = dashboardCommercialAsset('icons/export.webp');
  readonly addIconSrc = dashboardCommercialAsset('icons/add.webp');
  readonly chevronDownIconSrc = dashboardCommercialAsset(
    'icons/chevron-down.webp',
  );
  readonly propertyArrowSrc = dashboardCommercialAsset(
    'icons/property-arrow.webp',
  );
  readonly locationIconSrc = dashboardCommercialAsset('icons/location.webp');
  readonly standaloneModelOptions = { standalone: true } as const;

  readonly datePickerOpen = signal(false);
  readonly selectedRange = signal<DateRange | null>(null);
  readonly searchTerm = signal('');
  readonly selectedActivityPeriod =
    signal<DashboardCommercialActivityPeriod>('week');

  readonly activityOptions = [...ACTIVITY_OPTIONS];
  readonly planningTimeLabels = PLANNING_TIME_LABELS;

  readonly displayName = computed(() => {
    const user = this.authStore.user();
    const fullName = [user?.prenom, user?.nom].filter(Boolean).join(' ').trim();

    return fullName || 'Jean-Marc Kouassi';
  });

  readonly headerDateLabel = computed(() => {
    const range = this.selectedRange();

    if (!range) {
      return 'Sélectionner une date';
    }

    return `${this.formatShortDate(range.start)} - ${this.formatShortDate(range.end)}`;
  });

  readonly planningWeekStart = computed(() => {
    const firstVisibleEvent = this.planningEvents()[0];

    if (firstVisibleEvent) {
      return startOfWeek(parseLocalDate(firstVisibleEvent.dateKey));
    }

    return startOfWeek(this.selectedRange()?.start ?? PLANNING_BASE_WEEK_START);
  });

  readonly planningDateLabel = computed(() => {
    const range = this.selectedRange();

    if (!range) {
      return `Semaine du ${this.formatShortDate(this.planningWeekStart())}`;
    }

    return `${this.formatShortDate(range.start)} - ${this.formatShortDate(range.end)}`;
  });

  readonly activitySnapshot = computed(
    () => ACTIVITY_SNAPSHOTS[this.selectedActivityPeriod()],
  );

  readonly planningEvents = computed<
    readonly DashboardCommercialPlanningEventView[]
  >(() => {
    const normalizedTerm = normalize(this.searchTerm());
    const selectedRange = this.selectedRange();

    return PLANNING_EVENT_RECORDS.filter((record) => {
      const eventDate = parseLocalDate(record.date);
      const matchesTerm =
        !normalizedTerm ||
        matchesDashboardSearch(
          normalizedTerm,
          record.customer,
          record.property,
        );

      return matchesTerm && isEventWithinRange(eventDate, selectedRange);
    }).map(createPlanningEventView);
  });

  readonly planningDays = computed<readonly DashboardCommercialPlanningDay[]>(
    () => {
      const eventsByDay = new Map<
        string,
        DashboardCommercialPlanningEventView[]
      >();

      for (const event of this.planningEvents()) {
        const dayEvents = eventsByDay.get(event.dateKey) ?? [];
        dayEvents.push(event);
        eventsByDay.set(event.dateKey, dayEvents);
      }

      return Array.from({ length: 7 }, (_, index) => {
        const currentDate = addDays(this.planningWeekStart(), index);
        const key = formatIsoDate(currentDate);
        const events = [...(eventsByDay.get(key) ?? [])].sort(
          (left, right) => left.startHour - right.startHour,
        );

        return {
          key,
          label: formatFrenchWeekday(currentDate),
          date: formatFrenchLongDate(currentDate),
          events,
        };
      });
    },
  );

  readonly kpiCards = computed<readonly DashboardCommercialKpiCard[]>(() => {
    const snapshot = this.activitySnapshot();

    return [
      {
        label: 'Tous les biens',
        value: String(snapshot.totalProperties),
        iconSrc: dashboardCommercialAsset('icons/kpi-home.webp'),
        iconAlt: 'Icône tous les biens',
        variant: 'properties',
      },
      {
        label: 'Nouveaux prospects',
        value: String(snapshot.newProspects),
        iconSrc: dashboardCommercialAsset('icons/kpi-users.webp'),
        iconAlt: 'Icône nouveaux prospects',
        variant: 'prospects',
      },
      {
        label: 'Rendez-vous',
        value: String(this.planningEvents().length),
        iconSrc: dashboardCommercialAsset('icons/kpi-appointments.webp'),
        iconAlt: 'Icône rendez-vous',
        variant: 'appointments',
      },
      {
        label: 'Dossiers conclus',
        value: String(snapshot.closedDeals),
        iconSrc: dashboardCommercialAsset('icons/kpi-success.webp'),
        iconAlt: 'Icône dossiers conclus',
        variant: 'closed',
      },
    ];
  });

  readonly prospectPoints = computed<
    readonly DashboardCommercialProspectPoint[]
  >(() => {
    const snapshot = this.activitySnapshot();

    return snapshot.prospects.map((point) => ({
      ...point,
      highlighted: point.code === snapshot.highlightedProspectCode,
    }));
  });

  readonly prospectChartData = computed<ChartData<'bar'>>(() => ({
    labels: this.prospectPoints().map((point) => point.label),
    datasets: [
      {
        data: this.prospectPoints().map((point) => point.value),
        backgroundColor: this.prospectPoints().map((point) =>
          point.highlighted ? '#E87D1E' : '#CAD0DE',
        ),
        borderSkipped: false,
        borderRadius: 8,
        barThickness: 12,
        maxBarThickness: 12,
        categoryPercentage: 0.5,
        barPercentage: 0.92,
        stack: 'prospects',
      },
      {
        data: this.prospectPoints().map((point) => 100 - point.value),
        backgroundColor: '#EFF2F7',
        borderSkipped: false,
        borderRadius: 8,
        barThickness: 12,
        maxBarThickness: 12,
        categoryPercentage: 0.5,
        barPercentage: 0.92,
        stack: 'prospects',
      },
    ],
  }));

  readonly prospectChartOptions: ChartOptions<'bar'> = {
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
        top: 6,
        right: 12,
        bottom: 0,
        left: 0,
      },
    },
    scales: {
      x: {
        stacked: true,
        ticks: {
          display: false,
        },
        grid: {
          display: false,
        },
        border: {
          display: false,
        },
      },
      y: {
        stacked: true,
        min: 0,
        max: 100,
        ticks: {
          stepSize: 10,
          color: '#19213D',
          font: {
            family: 'Inter, system-ui, sans-serif',
            size: 14,
            weight: 400,
          },
          callback: (value) =>
            PROSPECT_AXIS_VALUES.includes(
              Number(value) as (typeof PROSPECT_AXIS_VALUES)[number],
            )
              ? `${value}`
              : '',
        },
        grid: {
          color: '#ECEFF6',
          drawTicks: false,
        },
        border: {
          display: false,
        },
      },
    },
  };

  readonly stateItems = computed(() => this.activitySnapshot().stateItems);
  readonly stateTotal = computed(() => this.activitySnapshot().totalProperties);

  readonly stateChartData = computed<ChartData<'bar'>>(() => ({
    labels: ['Etat des biens'],
    datasets: this.stateItems().map((item, index, items) => ({
      label: item.label,
      data: [item.value],
      backgroundColor: STATE_TONE_COLORS[item.tone],
      borderColor: STATE_TONE_COLORS[item.tone],
      borderWidth: 0,
      borderSkipped: false,
      borderRadius: {
        topLeft: index === 0 ? 14 : 0,
        bottomLeft: index === 0 ? 14 : 0,
        topRight: index === items.length - 1 ? 14 : 0,
        bottomRight: index === items.length - 1 ? 14 : 0,
      },
      barThickness: 28,
      categoryPercentage: 1,
      barPercentage: 1,
      stack: 'state',
    })),
  }));

  readonly stateChartOptions = computed<ChartOptions<'bar'>>(() => ({
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 650,
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        enabled: false,
      },
    },
    scales: {
      x: {
        stacked: true,
        display: false,
        min: 0,
        max: this.stateTotal(),
        grid: {
          display: false,
          drawTicks: false,
        },
        border: {
          display: false,
        },
      },
      y: {
        stacked: true,
        display: false,
        grid: {
          display: false,
          drawTicks: false,
        },
        border: {
          display: false,
        },
      },
    },
  }));

  readonly visibleProperties = computed<
    readonly DashboardCommercialPropertyCard[]
  >(() => {
    const normalizedTerm = normalize(this.searchTerm());

    if (!normalizedTerm) {
      return PROPERTY_CARDS;
    }

    return PROPERTY_CARDS.filter((property) =>
      matchesDashboardSearch(
        normalizedTerm,
        property.title,
        property.location,
        property.owner,
        property.badge,
      ),
    );
  });

  openDatePicker(): void {
    this.datePickerOpen.set(true);
  }

  updateSearchTerm(term: string): void {
    this.searchTerm.set(term);
  }

  onDateRangeApplied(range: DateRange): void {
    this.selectedRange.set(range);
  }

  onActivityPeriodChange(period: DashboardCommercialActivityPeriod): void {
    this.selectedActivityPeriod.set(period);
  }

  exportVisibleRows(): void {
    const currentWindow = this.document.defaultView;

    if (!currentWindow) {
      return;
    }

    const lines = [
      'Bien;Localisation;Occupant;Rôle;Prix',
      ...this.visibleProperties().map((property) =>
        [
          property.title,
          property.location,
          property.owner,
          property.role,
          property.price,
        ].join(';'),
      ),
    ];

    const blob = new currentWindow.Blob([lines.join('\n')], {
      type: 'text/csv;charset=utf-8',
    });
    const url = currentWindow.URL.createObjectURL(blob);
    const link = this.document.createElement('a');

    link.href = url;
    link.download = 'dashboard-commercial.csv';
    link.click();
    currentWindow.URL.revokeObjectURL(url);
  }

  formatCount(value: number): string {
    return String(value).padStart(2, '0');
  }

  private formatShortDate(date: Date): string {
    return FRENCH_SHORT_DATE_FORMATTER.format(date);
  }
}

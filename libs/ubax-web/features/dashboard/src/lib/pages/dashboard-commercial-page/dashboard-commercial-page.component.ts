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

type DashboardCommercialPlanningStatus = 'confirmed' | 'upcoming' | 'cancelled';
type DashboardCommercialActivityPeriod = 'week' | 'month' | 'quarter';
type DashboardCommercialProspectCode =
  | 'lun'
  | 'mar'
  | 'mer'
  | 'jeu'
  | 'ven'
  | 'sam'
  | 'dim';
type DashboardCommercialStateTone = 'orange' | 'blue' | 'red' | 'green';

type DashboardCommercialKpiCard = {
  label: string;
  value: string;
  iconSrc: string;
  iconAlt: string;
  variant: 'properties' | 'prospects' | 'appointments' | 'closed';};

type DashboardCommercialPlanningTimeLabel = {
  label: string;
  hour: number;};

type DashboardCommercialPlanningEventRecord = {
  id: string;
  customer: string;
  property: string;
  date: string;
  startHour: number;
  durationHours: 1 | 2 | 3;
  avatarFile: string;
  status: DashboardCommercialPlanningStatus;
  route: string;};

type DashboardCommercialPlanningEventView = {
  id: string;
  customer: string;
  property: string;
  dateKey: string;
  startHour: number;
  avatarSrc: string;
  arrowSrc: string;
  status: DashboardCommercialPlanningStatus;
  startClass: string;
  spanClass: string;
  route: string;};

type DashboardCommercialPlanningDay = {
  key: string;
  label: string;
  date: string;
  events: readonly DashboardCommercialPlanningEventView[];};

type DashboardCommercialActivityOption = {
  label: string;
  value: DashboardCommercialActivityPeriod;};

type DashboardCommercialProspectPoint = {
  code: DashboardCommercialProspectCode;
  label: string;
  value: number;
  highlighted: boolean;};

type DashboardCommercialStateItem = {
  label: string;
  value: number;
  tone: DashboardCommercialStateTone;};

type DashboardCommercialActivitySnapshot = {
  totalProperties: number;
  newProspects: number;
  closedDeals: number;
  highlightedProspectCode: DashboardCommercialProspectCode;
  prospects: readonly Omit<DashboardCommercialProspectPoint, 'highlighted'>[];
  stateItems: readonly DashboardCommercialStateItem[];};

type DashboardCommercialPropertyCard = {
  id: string;
  imageSrc: string;
  ownerAvatarSrc: string;
  title: string;
  location: string;
  owner: string;
  role: string;
  price: string;
  badge: string;
  route: string;};

type DashboardCommercialPlanningRecordInput = Omit<
  DashboardCommercialPlanningEventRecord,
  'route'
> & {
  route?: string;
};

type DashboardCommercialPropertyCardInput = Omit<
  DashboardCommercialPropertyCard,
  'imageSrc' | 'ownerAvatarSrc' | 'route'
> & {
  propertyFile: string;
  ownerFile: string;
};

const DASHBOARD_COMMERCIAL_ASSET_ROOT = 'dashboard-commercial';
const PLANNING_BASE_WEEK_START = parseLocalDate('2026-03-02');
const PROSPECT_AXIS_VALUES = [0, 10, 20, 30, 50, 100] as const;
const STATE_TONE_COLORS: Record<DashboardCommercialStateTone, string> = {
  orange: '#E87D1E',
  blue: '#2388FF',
  red: '#FF383C',
  green: '#1FB85C',
};
const FRENCH_WEEKDAY_FORMATTER = new Intl.DateTimeFormat('fr-FR', {
  weekday: 'long',
});
const FRENCH_LONG_DATE_FORMATTER = new Intl.DateTimeFormat('fr-FR', {
  day: '2-digit',
  month: 'long',
  year: 'numeric',
});
const FRENCH_SHORT_DATE_FORMATTER = new Intl.DateTimeFormat('fr-FR', {
  day: '2-digit',
  month: '2-digit',
  year: '2-digit',
});

function dashboardCommercialAsset(file: string): string {
  return `${DASHBOARD_COMMERCIAL_ASSET_ROOT}/${file}`;
}

function parseLocalDate(value: string): Date {
  return new Date(`${value}T00:00:00`);
}

function addDays(date: Date, offset: number): Date {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + offset);
  return nextDate;
}

function startOfWeek(date: Date): Date {
  const nextDate = new Date(date);
  const day = nextDate.getDay();
  const offset = day === 0 ? -6 : 1 - day;

  nextDate.setHours(0, 0, 0, 0);
  nextDate.setDate(nextDate.getDate() + offset);

  return nextDate;
}

function formatIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function matchesDashboardSearch(term: string, ...parts: string[]): boolean {
  return parts.some((part) => normalize(part).includes(term));
}

function isEventWithinRange(date: Date, range: DateRange | null): boolean {
  if (!range) {
    return true;
  }

  const timestamp = new Date(date).setHours(0, 0, 0, 0);
  const start = new Date(range.start).setHours(0, 0, 0, 0);
  const end = new Date(range.end).setHours(0, 0, 0, 0);

  return timestamp >= start && timestamp <= end;
}

function formatFrenchWeekday(date: Date): string {
  const label = FRENCH_WEEKDAY_FORMATTER.format(date);
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function formatFrenchLongDate(date: Date): string {
  return FRENCH_LONG_DATE_FORMATTER.format(date);
}

function resolvePlanningArrowVariant(
  status: DashboardCommercialPlanningStatus,
): string {
  if (status === 'confirmed') {
    return 'confirmed';
  }

  if (status === 'upcoming') {
    return 'upcoming';
  }

  return 'cancelled';
}

function createPlanningRecord(
  record: DashboardCommercialPlanningRecordInput,
): DashboardCommercialPlanningEventRecord {
  return {
    ...record,
    route: record.route ?? '/demandes/commercial',
  };
}

function createPlanningEventView(
  record: DashboardCommercialPlanningEventRecord,
): DashboardCommercialPlanningEventView {
  const visualDurationHours =
    record.durationHours === 1 ? 2 : record.durationHours;

  return {
    id: record.id,
    customer: record.customer,
    property: record.property,
    dateKey: record.date,
    startHour: record.startHour,
    avatarSrc: dashboardCommercialAsset(`people/${record.avatarFile}`),
    arrowSrc: dashboardCommercialAsset(
      `icons/event-arrow-${resolvePlanningArrowVariant(record.status)}.webp`,
    ),
    status: record.status,
    startClass: `planning-event--start-${String(record.startHour).padStart(2, '0')}`,
    spanClass: `planning-event--span-${visualDurationHours}`,
    route: record.route,
  };
}

function createPropertyCard(
  card: DashboardCommercialPropertyCardInput,
): DashboardCommercialPropertyCard {
  return {
    id: card.id,
    imageSrc: dashboardCommercialAsset(`properties/${card.propertyFile}`),
    ownerAvatarSrc: dashboardCommercialAsset(`people/${card.ownerFile}`),
    title: card.title,
    location: card.location,
    owner: card.owner,
    role: card.role,
    price: card.price,
    badge: card.badge,
    route: `/biens/${card.id}`,
  };
}

const PLANNING_TIME_LABELS: readonly DashboardCommercialPlanningTimeLabel[] = [
  { label: '08 : 00', hour: 8 },
  { label: '09 : 00', hour: 9 },
  { label: '10 : 00', hour: 10 },
  { label: '11 : 00', hour: 11 },
  { label: '12 : 00', hour: 12 },
  { label: '13 : 00', hour: 13 },
  { label: '14 : 00', hour: 14 },
  { label: '15 : 00', hour: 15 },
  { label: '16 : 00', hour: 16 },
  { label: '17 : 00', hour: 17 },
  { label: '18 : 00', hour: 18 },
];

const PLANNING_EVENT_RECORDS: readonly DashboardCommercialPlanningEventRecord[] =
  [
    createPlanningRecord({
      id: 'rdv-01',
      customer: 'Konan Olivier',
      property: 'Immeuble Kalia',
      date: '2026-03-02',
      startHour: 8,
      durationHours: 1,
      avatarFile: 'event-avatar-01.webp',
      status: 'confirmed',
    }),
    createPlanningRecord({
      id: 'rdv-02',
      customer: 'Mariam Traoré',
      property: 'Villa Riviera 3',
      date: '2026-03-02',
      startHour: 11,
      durationHours: 2,
      avatarFile: 'event-avatar-10.webp',
      status: 'cancelled',
    }),
    createPlanningRecord({
      id: 'rdv-03',
      customer: 'Yao Didier',
      property: 'Résidence Plateau',
      date: '2026-03-03',
      startHour: 9,
      durationHours: 2,
      avatarFile: 'event-avatar-02.webp',
      status: 'confirmed',
    }),
    createPlanningRecord({
      id: 'rdv-04',
      customer: 'Aïcha Kouadio',
      property: 'Immeuble Kalia',
      date: '2026-03-03',
      startHour: 15,
      durationHours: 2,
      avatarFile: 'event-avatar-11.webp',
      status: 'cancelled',
    }),
    createPlanningRecord({
      id: 'rdv-05',
      customer: 'Koffi Serge',
      property: 'Villa Riviera 3',
      date: '2026-03-04',
      startHour: 12,
      durationHours: 1,
      avatarFile: 'event-avatar-07.webp',
      status: 'confirmed',
    }),
    createPlanningRecord({
      id: 'rdv-06',
      customer: 'Fanta Bamba',
      property: 'Résidence Lagune',
      date: '2026-03-04',
      startHour: 16,
      durationHours: 2,
      avatarFile: 'event-avatar-09.webp',
      status: 'confirmed',
    }),
    createPlanningRecord({
      id: 'rdv-07',
      customer: 'Koné Ibrahim',
      property: 'Immeuble Kalia',
      date: '2026-03-05',
      startHour: 8,
      durationHours: 2,
      avatarFile: 'event-avatar-03.webp',
      status: 'confirmed',
    }),
    createPlanningRecord({
      id: 'rdv-08',
      customer: 'Moussa Kaboré',
      property: 'Résidence Plateau',
      date: '2026-03-05',
      startHour: 13,
      durationHours: 2,
      avatarFile: 'event-avatar-08.webp',
      status: 'cancelled',
    }),
    createPlanningRecord({
      id: 'rdv-09',
      customer: 'Rokia Diabaté',
      property: 'Résidence Lagune',
      date: '2026-03-06',
      startHour: 10,
      durationHours: 2,
      avatarFile: 'event-avatar-04.webp',
      status: 'upcoming',
    }),
    createPlanningRecord({
      id: 'rdv-10',
      customer: 'Kouamé Patrick',
      property: 'Villa Riviera 3',
      date: '2026-03-06',
      startHour: 15,
      durationHours: 1,
      avatarFile: 'event-avatar-05.webp',
      status: 'upcoming',
    }),
    createPlanningRecord({
      id: 'rdv-11',
      customer: 'Fatou Nguessan',
      property: 'Immeuble Kalia',
      date: '2026-03-07',
      startHour: 9,
      durationHours: 1,
      avatarFile: 'event-avatar-06.webp',
      status: 'upcoming',
    }),
    createPlanningRecord({
      id: 'rdv-12',
      customer: 'Konan Olivier',
      property: 'Villa Riviera 3',
      date: '2026-03-07',
      startHour: 14,
      durationHours: 2,
      avatarFile: 'event-avatar-01.webp',
      status: 'confirmed',
    }),
    createPlanningRecord({
      id: 'rdv-13',
      customer: 'Amandine Kassi',
      property: 'Résidence Plateau',
      date: '2026-03-08',
      startHour: 11,
      durationHours: 2,
      avatarFile: 'event-avatar-02.webp',
      status: 'confirmed',
    }),
    createPlanningRecord({
      id: 'rdv-14',
      customer: 'Jean Gohi',
      property: 'Résidence Lagune',
      date: '2026-03-08',
      startHour: 16,
      durationHours: 1,
      avatarFile: 'event-avatar-03.webp',
      status: 'upcoming',
    }),
  ];

const ACTIVITY_OPTIONS: readonly DashboardCommercialActivityOption[] = [
  { label: 'Semaine', value: 'week' },
  { label: 'Mois', value: 'month' },
  { label: 'Trimestre', value: 'quarter' },
];

const ACTIVITY_SNAPSHOTS: Record<
  DashboardCommercialActivityPeriod,
  DashboardCommercialActivitySnapshot
> = {
  week: {
    totalProperties: 45,
    newProspects: 15,
    closedDeals: 8,
    highlightedProspectCode: 'ven',
    prospects: [
      { code: 'lun', label: 'LUN', value: 42 },
      { code: 'mar', label: 'MAR', value: 53 },
      { code: 'mer', label: 'MER', value: 40 },
      { code: 'jeu', label: 'JEU', value: 50 },
      { code: 'ven', label: 'VEN', value: 64 },
      { code: 'sam', label: 'SAM', value: 56 },
      { code: 'dim', label: 'DIM', value: 42 },
    ],
    stateItems: [
      { label: 'Annonces actives', value: 10, tone: 'orange' },
      { label: 'Biens Loués', value: 23, tone: 'blue' },
      { label: 'Biens en entretien', value: 4, tone: 'red' },
      { label: 'Biens Vendus', value: 8, tone: 'green' },
    ],
  },
  month: {
    totalProperties: 45,
    newProspects: 28,
    closedDeals: 12,
    highlightedProspectCode: 'jeu',
    prospects: [
      { code: 'lun', label: 'LUN', value: 58 },
      { code: 'mar', label: 'MAR', value: 61 },
      { code: 'mer', label: 'MER', value: 55 },
      { code: 'jeu', label: 'JEU', value: 74 },
      { code: 'ven', label: 'VEN', value: 68 },
      { code: 'sam', label: 'SAM', value: 49 },
      { code: 'dim', label: 'DIM', value: 46 },
    ],
    stateItems: [
      { label: 'Annonces actives', value: 12, tone: 'orange' },
      { label: 'Biens Loués', value: 21, tone: 'blue' },
      { label: 'Biens en entretien', value: 4, tone: 'red' },
      { label: 'Biens Vendus', value: 8, tone: 'green' },
    ],
  },
  quarter: {
    totalProperties: 45,
    newProspects: 64,
    closedDeals: 19,
    highlightedProspectCode: 'sam',
    prospects: [
      { code: 'lun', label: 'LUN', value: 67 },
      { code: 'mar', label: 'MAR', value: 71 },
      { code: 'mer', label: 'MER', value: 63 },
      { code: 'jeu', label: 'JEU', value: 76 },
      { code: 'ven', label: 'VEN', value: 82 },
      { code: 'sam', label: 'SAM', value: 88 },
      { code: 'dim', label: 'DIM', value: 59 },
    ],
    stateItems: [
      { label: 'Annonces actives', value: 14, tone: 'orange' },
      { label: 'Biens Loués', value: 19, tone: 'blue' },
      { label: 'Biens en entretien', value: 3, tone: 'red' },
      { label: 'Biens Vendus', value: 9, tone: 'green' },
    ],
  },
};

const PROPERTY_CARDS: readonly DashboardCommercialPropertyCard[] = [
  createPropertyCard({
    id: '1',
    propertyFile: 'property-01.webp',
    ownerFile: 'property-owner-01.webp',
    title: 'Immeuble Kalia',
    location: 'Abidjan, Cocody',
    owner: 'Aïcha Kouadio',
    role: 'Locataire',
    price: '400 000 FCFA',
    badge: 'Location',
  }),
  createPropertyCard({
    id: '2',
    propertyFile: 'property-02.webp',
    ownerFile: 'property-owner-02.webp',
    title: 'Villa Riviera 3',
    location: 'Abidjan, Riviera',
    owner: 'Mariam Touré',
    role: 'Bailleur',
    price: '650 000 FCFA',
    badge: 'Location',
  }),
  createPropertyCard({
    id: '3',
    propertyFile: 'property-03.webp',
    ownerFile: 'property-owner-03.webp',
    title: 'Résidence Lagune',
    location: 'Abidjan, Marcory',
    owner: 'Fanta Bamba',
    role: 'Locataire',
    price: '520 000 FCFA',
    badge: 'Location',
  }),
];

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

import { DatePipe, NgClass } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { AuthStore } from '@ubax-workspace/ubax-web-data-access';
import { DateRange, DateRangePickerComponent } from '@ubax-workspace/shared-ui';

type DashboardCommercialPlanningStatus = 'confirmed' | 'upcoming' | 'cancelled';

interface DashboardCommercialKpiCard {
  label: string;
  value: string;
  iconSrc: string;
  iconAlt: string;
  variant: 'properties' | 'prospects' | 'appointments' | 'closed';
}

interface DashboardCommercialPlanningTimeLabel {
  label: string;
  positionClass: string;
}

interface DashboardCommercialPlanningDay {
  label: string;
  date: string;
  positionClass: string;
}

interface DashboardCommercialPlanningEvent {
  customer: string;
  property: string;
  avatarSrc: string;
  arrowSrc: string;
  status: DashboardCommercialPlanningStatus;
  positionClass: string;
}

interface DashboardCommercialProspectBar {
  code: 'lun' | 'mar' | 'mer' | 'jeu' | 'ven' | 'sam' | 'dim';
  label: string;
}

interface DashboardCommercialStateItem {
  label: string;
  value: string;
  tone: 'orange' | 'blue' | 'red' | 'green';
}

interface DashboardCommercialPropertyCard {
  imageSrc: string;
  ownerAvatarSrc: string;
  title: string;
  location: string;
  owner: string;
  role: string;
  price: string;
}

const DASHBOARD_COMMERCIAL_ASSET_ROOT = 'dashboard-commercial';

function dashboardCommercialAsset(file: string): string {
  return `${DASHBOARD_COMMERCIAL_ASSET_ROOT}/${file}`;
}

function createPlanningEvent(
  status: DashboardCommercialPlanningStatus,
  positionClass: string,
  avatarFile: string,
): DashboardCommercialPlanningEvent {
  let arrowVariant = 'cancelled';

  if (status === 'confirmed') {
    arrowVariant = 'confirmed';
  } else if (status === 'upcoming') {
    arrowVariant = 'upcoming';
  }

  return {
    customer: 'Konan Olivier',
    property: 'Immeuble kalia',
    avatarSrc: dashboardCommercialAsset(`people/${avatarFile}`),
    arrowSrc: dashboardCommercialAsset(
      `icons/event-arrow-${arrowVariant}.webp`,
    ),
    status,
    positionClass,
  };
}

function createPropertyCard(
  propertyFile: string,
  ownerFile: string,
): DashboardCommercialPropertyCard {
  return {
    imageSrc: dashboardCommercialAsset(`properties/${propertyFile}`),
    ownerAvatarSrc: dashboardCommercialAsset(`people/${ownerFile}`),
    title: 'Immeuble kalia',
    location: 'Abidjan, Cocody',
    owner: 'Aïcha Kouadio',
    role: 'Locataire',
    price: '400 000 FCFA',
  };
}

const PLANNING_TIME_LABELS: readonly DashboardCommercialPlanningTimeLabel[] = [
  { label: '08 : 00', positionClass: 'planning-card__time-label--01' },
  { label: '09 : 00', positionClass: 'planning-card__time-label--02' },
  { label: '10 : 00', positionClass: 'planning-card__time-label--03' },
  { label: '11 : 00', positionClass: 'planning-card__time-label--04' },
  { label: '12 : 00', positionClass: 'planning-card__time-label--05' },
  { label: '13 : 00', positionClass: 'planning-card__time-label--06' },
  { label: '14 : 00', positionClass: 'planning-card__time-label--07' },
  { label: '15 : 00', positionClass: 'planning-card__time-label--08' },
  { label: '16 : 00', positionClass: 'planning-card__time-label--09' },
  { label: '17 : 00', positionClass: 'planning-card__time-label--10' },
  { label: '18 : 00', positionClass: 'planning-card__time-label--11' },
];

const PLANNING_DAYS: readonly DashboardCommercialPlanningDay[] = [
  {
    label: 'Lundi',
    date: '02 mars 2026',
    positionClass: 'planning-card__day-group--01',
  },
  {
    label: 'Mardi',
    date: '03 mars 2026',
    positionClass: 'planning-card__day-group--02',
  },
  {
    label: 'Mercredi',
    date: '04 mars 2026',
    positionClass: 'planning-card__day-group--03',
  },
  {
    label: 'Jeudi',
    date: '05 mars 2026',
    positionClass: 'planning-card__day-group--04',
  },
  {
    label: 'Vendredi',
    date: '06 mars 2026',
    positionClass: 'planning-card__day-group--05',
  },
  {
    label: 'Samedi',
    date: '07 mars 2026',
    positionClass: 'planning-card__day-group--06',
  },
  {
    label: 'Dimanche',
    date: '08 mars 2026',
    positionClass: 'planning-card__day-group--07',
  },
];

const PLANNING_EVENTS: readonly DashboardCommercialPlanningEvent[] = [
  createPlanningEvent(
    'confirmed',
    'planning-event--position-01',
    'event-avatar-01.webp',
  ),
  createPlanningEvent(
    'cancelled',
    'planning-event--position-02',
    'event-avatar-10.webp',
  ),
  createPlanningEvent(
    'confirmed',
    'planning-event--position-03',
    'event-avatar-01.webp',
  ),
  createPlanningEvent(
    'confirmed',
    'planning-event--position-04',
    'event-avatar-02.webp',
  ),
  createPlanningEvent(
    'cancelled',
    'planning-event--position-05',
    'event-avatar-11.webp',
  ),
  createPlanningEvent(
    'confirmed',
    'planning-event--position-06',
    'event-avatar-07.webp',
  ),
  createPlanningEvent(
    'confirmed',
    'planning-event--position-07',
    'event-avatar-09.webp',
  ),
  createPlanningEvent(
    'confirmed',
    'planning-event--position-08',
    'event-avatar-03.webp',
  ),
  createPlanningEvent(
    'cancelled',
    'planning-event--position-09',
    'event-avatar-11.webp',
  ),
  createPlanningEvent(
    'confirmed',
    'planning-event--position-10',
    'event-avatar-01.webp',
  ),
  createPlanningEvent(
    'confirmed',
    'planning-event--position-11',
    'event-avatar-08.webp',
  ),
  createPlanningEvent(
    'upcoming',
    'planning-event--position-12',
    'event-avatar-04.webp',
  ),
  createPlanningEvent(
    'upcoming',
    'planning-event--position-13',
    'event-avatar-05.webp',
  ),
  createPlanningEvent(
    'upcoming',
    'planning-event--position-14',
    'event-avatar-06.webp',
  ),
];

const PROSPECT_BARS: readonly DashboardCommercialProspectBar[] = [
  { code: 'lun', label: 'LUN' },
  { code: 'mar', label: 'MAR' },
  { code: 'mer', label: 'MER' },
  { code: 'jeu', label: 'JEU' },
  { code: 'ven', label: 'VEN' },
  { code: 'sam', label: 'SAM' },
  { code: 'dim', label: 'DIM' },
];

const STATE_ITEMS: readonly DashboardCommercialStateItem[] = [
  { label: 'Annonces actives', value: '10', tone: 'orange' },
  { label: 'Biens Loués', value: '33', tone: 'blue' },
  { label: 'Biens en entretien', value: '02', tone: 'red' },
  { label: 'Biens Vendus', value: '10', tone: 'green' },
];

const PROPERTY_CARDS: readonly DashboardCommercialPropertyCard[] = [
  createPropertyCard('property-01.webp', 'property-owner-01.webp'),
  createPropertyCard('property-02.webp', 'property-owner-02.webp'),
  createPropertyCard('property-03.webp', 'property-owner-03.webp'),
];

@Component({
  selector: 'ubax-dashboard-commercial-page',
  standalone: true,
  imports: [DateRangePickerComponent, DatePipe, NgClass],
  templateUrl: './dashboard-commercial-page.component.html',
  styleUrl: './dashboard-commercial-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardCommercialPageComponent {
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
  readonly stateProgressSrc = dashboardCommercialAsset(
    'state/progress-bar.webp',
  );

  readonly datePickerOpen = signal(false);
  readonly selectedRange = signal<DateRange | null>(null);

  readonly kpiCards: readonly DashboardCommercialKpiCard[] = [
    {
      label: 'Tous les biens',
      value: '120',
      iconSrc: dashboardCommercialAsset('icons/kpi-home.webp'),
      iconAlt: 'Icône tous les biens',
      variant: 'properties',
    },
    {
      label: 'Nouveaux prospects',
      value: '15',
      iconSrc: dashboardCommercialAsset('icons/kpi-users.webp'),
      iconAlt: 'Icône nouveaux prospects',
      variant: 'prospects',
    },
    {
      label: 'Rendez-vous',
      value: '15',
      iconSrc: dashboardCommercialAsset('icons/kpi-appointments.webp'),
      iconAlt: 'Icône rendez-vous',
      variant: 'appointments',
    },
    {
      label: 'Dossiers conclus',
      value: '8',
      iconSrc: dashboardCommercialAsset('icons/kpi-success.webp'),
      iconAlt: 'Icône dossiers conclus',
      variant: 'closed',
    },
  ];

  readonly planningTimeLabels = PLANNING_TIME_LABELS;
  readonly planningDays = PLANNING_DAYS;
  readonly planningEvents = PLANNING_EVENTS;
  readonly prospectBars = PROSPECT_BARS;
  readonly stateItems = STATE_ITEMS;
  readonly properties = PROPERTY_CARDS;

  onDateRangeApplied(range: DateRange): void {
    this.selectedRange.set(range);
  }
}

import { CommonModule, DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  inject,
  signal,
} from '@angular/core';
import {
  CommercialRequestDetail,
  DemandeDetailPanelComponent,
} from '../../components/demande-detail-panel/demande-detail-panel.component';

type SummaryMetric = {
  readonly label: string;
  readonly value: number;
  readonly accent: string;
  readonly iconBackground: string;
  readonly icon: string;};

type CalendarDay = {
  readonly label: string;
  readonly isActive?: boolean;
  readonly isMuted?: boolean;};

type CommercialRequestRow = {
  readonly id: string;
  readonly client: string;
  readonly property: string;
  readonly requestType: string;
  readonly summary: string;
  readonly date: string;
  readonly detail: CommercialRequestDetail;};

type CommercialVisitCard = {
  readonly id: string;
  readonly client: string;
  readonly phone: string;
  readonly location: string;
  readonly schedule: string;
  readonly avatar: string;};

type CommercialNotificationItem = {
  readonly id: string;
  readonly title: string;
  readonly message: string;
  readonly time: string;};

const ASSET_ROOT = '/demandes/commercial';

const COMMERCIAL_REQUEST_DETAIL: CommercialRequestDetail = {
  firstName: 'Mariam',
  lastName: 'Koné',
  phone: '+225 07 58 23 41 89',
  property: 'Immeuble Kalia',
  requestType: 'Location',
  date: '14 / 11 / 2026',
  requestTitle: 'Plus d’infos SVP',
  requestMessage: [
    'Bonjour,',
    'Je souhaiterais obtenir davantage d’informations',
    'concernant ce bien (caractéristiques, prix et conditions).',
    'Merci de bien vouloir me recontacter dès que possible.',
    'Cordialement.',
  ],
  replyTitle: 'Titre de la reponse',
  replyMessage: 'Bonjour ...',
};

@Component({
  selector: 'ubax-demandes-commercial-page',
  standalone: true,
  imports: [CommonModule, DemandeDetailPanelComponent],
  templateUrl: './demandes-commercial-page.component.html',
  styleUrl: './demandes-commercial-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DemandesCommercialPageComponent {
  readonly metricCards: readonly SummaryMetric[] = [
    {
      label: 'Requêtes',
      value: 50,
      accent: 'var(--ubax-info)',
      iconBackground: 'var(--ubax-blue-soft)',
      icon: `${ASSET_ROOT}/request-icon.webp`,
    },
    {
      label: 'Demande de visite',
      value: 25,
      accent: 'var(--ubax-accent)',
      iconBackground: 'var(--ubax-peach-soft)',
      icon: `${ASSET_ROOT}/visit-icon.webp`,
    },
  ];

  readonly calendarWeekdays = ['Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa', 'Di'];
  readonly calendarWeeks: readonly (readonly CalendarDay[])[] = [
    [
      { label: '1' },
      { label: '2' },
      { label: '3' },
      { label: '4' },
      { label: '5' },
      { label: '6' },
      { label: '7' },
    ],
    [
      { label: '8' },
      { label: '9' },
      { label: '10' },
      { label: '11' },
      { label: '12' },
      { label: '13' },
      { label: '14' },
    ],
    [
      { label: '15' },
      { label: '16' },
      { label: '17' },
      { label: '18', isActive: true },
      { label: '19' },
      { label: '20' },
      { label: '21' },
    ],
    [
      { label: '22' },
      { label: '23' },
      { label: '24' },
      { label: '25' },
      { label: '26' },
      { label: '27' },
      { label: '28' },
    ],
    [
      { label: '29' },
      { label: '30' },
      { label: '1', isMuted: true },
      { label: '2', isMuted: true },
      { label: '3', isMuted: true },
      { label: '4', isMuted: true },
      { label: '5', isMuted: true },
    ],
  ];

  readonly calendarIcons = {
    previous: `${ASSET_ROOT}/calendar-chevron-left.webp`,
    next: `${ASSET_ROOT}/calendar-chevron-right.webp`,
  };

  readonly requestActionIcon = `${ASSET_ROOT}/request-arrow.webp`;
  readonly overlayCloseIcon = `${ASSET_ROOT}/overlay-close.webp`;
  readonly notificationBellIcon = `${ASSET_ROOT}/notification-bell.webp`;
  readonly visitMetaIcons = {
    home: `${ASSET_ROOT}/visit-home.webp`,
    clock: `${ASSET_ROOT}/visit-clock.webp`,
  };

  readonly requestRows: readonly CommercialRequestRow[] = Array.from(
    { length: 9 },
    (_, index) => ({
      id: `request-${index + 1}`,
      client: 'Mariam Koné',
      property: 'Immeuble kalia',
      requestType: 'Location',
      summary: 'Plus d’infos SVP',
      date: '14/11/2026',
      detail: COMMERCIAL_REQUEST_DETAIL,
    }),
  );

  readonly visitCards: readonly CommercialVisitCard[] = [
    {
      id: 'visit-01',
      client: 'Armand Tano',
      phone: '+225 07 58 23 41 89',
      location: 'Résidence Kalia - Appartement  0014',
      schedule: '14/04/2026     12:00  -  13:00',
      avatar: `${ASSET_ROOT}/visit-avatar-01.webp`,
    },
    {
      id: 'visit-02',
      client: 'Armand Tano',
      phone: '+225 07 58 23 41 89',
      location: 'Résidence Kalia - Appartement  0014',
      schedule: '14/04/2026     12:00  -  13:00',
      avatar: `${ASSET_ROOT}/visit-avatar-02.webp`,
    },
    {
      id: 'visit-03',
      client: 'Armand Tano',
      phone: '+225 07 58 23 41 89',
      location: 'Résidence Kalia - Appartement  0014',
      schedule: '14/04/2026     12:00  -  13:00',
      avatar: `${ASSET_ROOT}/visit-avatar-03.webp`,
    },
    {
      id: 'visit-04',
      client: 'Armand Tano',
      phone: '+225 07 58 23 41 89',
      location: 'Résidence Kalia - Appartement  0014',
      schedule: '14/04/2026     12:00  -  13:00',
      avatar: `${ASSET_ROOT}/visit-avatar-04.webp`,
    },
    {
      id: 'visit-05',
      client: 'Armand Tano',
      phone: '+225 07 58 23 41 89',
      location: 'Résidence Kalia - Appartement  0014',
      schedule: '14/04/2026     12:00  -  13:00',
      avatar: `${ASSET_ROOT}/visit-avatar-05.webp`,
    },
    {
      id: 'visit-06',
      client: 'Armand Tano',
      phone: '+225 07 58 23 41 89',
      location: 'Résidence Kalia - Appartement  0014',
      schedule: '14/04/2026     12:00  -  13:00',
      avatar: `${ASSET_ROOT}/visit-avatar-06.webp`,
    },
    {
      id: 'visit-07',
      client: 'Armand Tano',
      phone: '+225 07 58 23 41 89',
      location: 'Résidence Kalia - Appartement  0014',
      schedule: '14/04/2026     12:00  -  13:00',
      avatar: `${ASSET_ROOT}/visit-avatar-07.webp`,
    },
    {
      id: 'visit-08',
      client: 'Armand Tano',
      phone: '+225 07 58 23 41 89',
      location: 'Résidence Kalia - Appartement  0014',
      schedule: '14/04/2026     12:00  -  13:00',
      avatar: `${ASSET_ROOT}/visit-avatar-03.webp`,
    },
  ];

  readonly notifications: readonly CommercialNotificationItem[] = [
    {
      id: 'notification-01',
      title: 'Nouvelle demande d’information',
      message:
        'Laura Koné a demandé plus d’informations sur Appartement Riviera Palmeraie',
      time: 'il y a 2 minutes',
    },
    {
      id: 'notification-02',
      title: 'demande de visite',
      message:
        'Laura Koné a demandé plus d’informations sur Appartement Riviera Palmeraie',
      time: 'il y a 12 minutes',
    },
    {
      id: 'notification-03',
      title: 'Nouvelle demande d’information',
      message:
        'Laura Koné a demandé plus d’informations sur Appartement Riviera Palmeraie',
      time: 'il y a 16 minutes',
    },
    {
      id: 'notification-04',
      title: 'Nouvelle demande d’information',
      message:
        'Laura Koné a demandé plus d’informations sur Appartement Riviera Palmeraie',
      time: 'il y a 2 minutes',
    },
    {
      id: 'notification-05',
      title: 'Nouvelle demande d’information',
      message:
        'Laura Koné a demandé plus d’informations sur Appartement Riviera Palmeraie',
      time: 'il y a 1 heure',
    },
  ];

  readonly selectedRequest = signal<CommercialRequestDetail | null>(null);

  private readonly document = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    effect(() => {
      this.document.body.classList.toggle(
        'ubax-demande-overlay-open',
        this.selectedRequest() !== null,
      );
    });

    this.destroyRef.onDestroy(() => {
      this.document.body.classList.remove('ubax-demande-overlay-open');
    });
  }

  protected openRequest(request: CommercialRequestDetail): void {
    this.selectedRequest.set(request);
  }

  protected closeRequest(): void {
    this.selectedRequest.set(null);
  }
}

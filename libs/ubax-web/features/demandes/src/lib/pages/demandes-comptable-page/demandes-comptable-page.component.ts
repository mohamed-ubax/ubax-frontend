import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';

interface ComptableToolbarField {
  readonly label: string;
  readonly icon: string;
  readonly kind: 'search' | 'date' | 'export';
}

interface ComptableSummaryMetric {
  readonly label: string;
  readonly value: number;
  readonly accent: string;
  readonly icon: string;
}

interface ComptableCalendarDay {
  readonly label: string;
  readonly isActive?: boolean;
  readonly isMuted?: boolean;
}

interface ComptableRequestRow {
  readonly ref: string;
  readonly client: string;
  readonly image: string;
  readonly property: string;
  readonly requestType: string;
  readonly amount: string;
  readonly status: string;
  readonly date: string;
}

interface ComptableNotificationItem {
  readonly title: string;
  readonly message: string;
  readonly time: string;
}

const SHARED_ASSET_ROOT = '/shared/demandes';
const COMPTABLE_ASSET_ROOT = '/demandes/comptable';

@Component({
  selector: 'ubax-demandes-comptable-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './demandes-comptable-page.component.html',
  styleUrl: './demandes-comptable-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DemandesComptablePageComponent {
  readonly icons = {
    search: `${SHARED_ASSET_ROOT}/filter-search.webp`,
    date: `${SHARED_ASSET_ROOT}/filter-date.webp`,
    export: `${SHARED_ASSET_ROOT}/filter-export.webp`,
    notification: `${SHARED_ASSET_ROOT}/notification-bell.webp`,
    eye: `${SHARED_ASSET_ROOT}/action-eye.webp`,
    summaryOpen: `${SHARED_ASSET_ROOT}/summary-open.webp`,
    summaryProgress: `${SHARED_ASSET_ROOT}/summary-progress.webp`,
    summaryDone: `${SHARED_ASSET_ROOT}/summary-done.webp`,
    calendarPrev: '/demandes/commercial/calendar-chevron-left.webp',
    calendarNext: '/demandes/commercial/calendar-chevron-right.webp',
  };

  readonly toolbarFields: readonly ComptableToolbarField[] = [
    { label: 'Recherche ...', icon: this.icons.search, kind: 'search' },
    { label: 'Sélectionner une date', icon: this.icons.date, kind: 'date' },
    { label: 'Exporter les données', icon: this.icons.export, kind: 'export' },
  ];

  readonly metrics: readonly ComptableSummaryMetric[] = [
    {
      label: 'Demande reçus',
      value: 22,
      accent: 'var(--ubax-info)',
      icon: this.icons.summaryOpen,
    },
    {
      label: 'Taches en cours',
      value: 7,
      accent: 'var(--ubax-accent)',
      icon: this.icons.summaryProgress,
    },
    {
      label: 'Traités',
      value: 15,
      accent: 'var(--ubax-success)',
      icon: this.icons.summaryDone,
    },
  ];

  readonly calendarWeekdays = ['Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa', 'Di'];
  readonly calendarWeeks: readonly (readonly ComptableCalendarDay[])[] = [
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

  readonly requestRows: readonly ComptableRequestRow[] = [
    {
      ref: 'FIN-00124',
      client: 'Awa Bakayoko',
      image: `${COMPTABLE_ASSET_ROOT}/request-thumb-01.webp`,
      property: 'Immeuble kalia',
      requestType: 'Contestation loyer',
      amount: '450 000 FCFA',
      status: 'En cour',
      date: '14/11/2026',
    },
    {
      ref: 'FIN-00125',
      client: 'Moussa Traoré',
      image: `${COMPTABLE_ASSET_ROOT}/request-thumb-02.webp`,
      property: 'Immeuble kalia',
      requestType: 'Remboursement',
      amount: '450 000 FCFA',
      status: 'En cour',
      date: '14/11/2026',
    },
    {
      ref: 'FIN-00126',
      client: 'Awa Bakayoko',
      image: `${COMPTABLE_ASSET_ROOT}/request-thumb-03.webp`,
      property: 'Immeuble kalia',
      requestType: 'Justificatif de charges',
      amount: '450 000 FCFA',
      status: 'En cour',
      date: '14/11/2026',
    },
    {
      ref: 'FIN-00127',
      client: 'Awa Bakayoko',
      image: `${COMPTABLE_ASSET_ROOT}/request-thumb-04.webp`,
      property: 'Immeuble kalia',
      requestType: 'Erreur de facture',
      amount: '450 000 FCFA',
      status: 'En cour',
      date: '14/11/2026',
    },
    {
      ref: 'FIN-00128',
      client: 'Awa Bakayoko',
      image: `${COMPTABLE_ASSET_ROOT}/request-thumb-05.webp`,
      property: 'Immeuble kalia',
      requestType: 'Contestation loyer',
      amount: '450 000 FCFA',
      status: 'En cour',
      date: '14/11/2026',
    },
    {
      ref: 'FIN-00129',
      client: 'Awa Bakayoko',
      image: `${COMPTABLE_ASSET_ROOT}/request-thumb-06.webp`,
      property: 'Immeuble kalia',
      requestType: 'Contestation loyer',
      amount: '450 000 FCFA',
      status: 'En cour',
      date: '14/11/2026',
    },
    {
      ref: 'FIN-00130',
      client: 'Awa Bakayoko',
      image: `${COMPTABLE_ASSET_ROOT}/request-thumb-07.webp`,
      property: 'Immeuble kalia',
      requestType: 'Contestation loyer',
      amount: '450 000 FCFA',
      status: 'En cour',
      date: '14/11/2026',
    },
    {
      ref: 'FIN-00131',
      client: 'Awa Bakayoko',
      image: `${COMPTABLE_ASSET_ROOT}/request-thumb-08.webp`,
      property: 'Immeuble kalia',
      requestType: 'Contestation loyer',
      amount: '450 000 FCFA',
      status: 'En cour',
      date: '14/11/2026',
    },
  ];

  readonly notifications: readonly ComptableNotificationItem[] = [
    {
      title: 'Technicien assigné',
      message: 'Une nouvelle demande a été enregistrée pour le bien UBX-0845.',
      time: 'il ya 2 minutes',
    },
    {
      title: 'Intervention planifiée',
      message:
        'Laura Koné a demandé plus d’informations sur Appartement Riviera Palmeraie',
      time: 'il ya 12 minutes',
    },
    {
      title: 'Nouveau ticket SAV créé',
      message: 'Une nouvelle demande a été enregistrée pour le bien UBX-0845.',
      time: 'il ya 16 minutes',
    },
    {
      title: 'Nouveau ticket SAV créé',
      message: 'Une nouvelle demande a été enregistrée pour le bien UBX-0845.',
      time: 'il ya 16 minutes',
    },
  ];
}

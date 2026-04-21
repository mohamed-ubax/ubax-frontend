import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';

type SavToolbarFieldKind = 'search' | 'date' | 'export';
type SavFilterFieldSize = 'sm' | 'lg' | 'date';
type SavPriorityTone = 'urgent' | 'normal';
type SavStatusTone = 'progress' | 'success';

interface SavToolbarField {
  readonly label: string;
  readonly icon: string;
  readonly kind: SavToolbarFieldKind;
}

interface SavSummaryMetric {
  readonly label: string;
  readonly value: number;
  readonly accent: string;
  readonly background: string;
  readonly icon: string;
}

interface SavIssueCard {
  readonly title: string;
  readonly client: string;
  readonly location: string;
  readonly phone: string;
  readonly image: string;
}

interface SavTicketFilterField {
  readonly label: string;
  readonly size: SavFilterFieldSize;
}

interface SavTicketRow {
  readonly id: string;
  readonly client: string;
  readonly avatar: string;
  readonly property: string;
  readonly issue: string;
  readonly priority: string;
  readonly priorityTone: SavPriorityTone;
  readonly createdAt: string;
  readonly status: string;
  readonly statusTone: SavStatusTone;
}

interface SavNotificationItem {
  readonly title: string;
  readonly message: string;
  readonly time: string;
}

const SHARED_ASSET_ROOT = '/shared/demandes';
const SAV_ASSET_ROOT = '/demandes/sav';

@Component({
  selector: 'ubax-demandes-sav-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './demandes-sav-page.component.html',
  styleUrl: './demandes-sav-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DemandesSavPageComponent {
  readonly sharedIcons = {
    search: `${SHARED_ASSET_ROOT}/filter-search.webp`,
    date: `${SHARED_ASSET_ROOT}/filter-date.webp`,
    export: `${SHARED_ASSET_ROOT}/filter-export.webp`,
    chevron: `${SHARED_ASSET_ROOT}/select-chevron.webp`,
    notification: `${SHARED_ASSET_ROOT}/notification-bell.webp`,
  };

  readonly toolbarFields: readonly SavToolbarField[] = [
    {
      label: 'Recherche ...',
      icon: this.sharedIcons.search,
      kind: 'search',
    },
    {
      label: 'Sélectionner une date',
      icon: this.sharedIcons.date,
      kind: 'date',
    },
    {
      label: 'Exporter les données',
      icon: this.sharedIcons.export,
      kind: 'export',
    },
  ];

  readonly statCards: readonly SavSummaryMetric[] = [
    {
      label: 'Tickets ouverts',
      value: 22,
      accent: 'var(--ubax-info)',
      background: '#8CCBFF',
      icon: `${SHARED_ASSET_ROOT}/summary-open.webp`,
    },
    {
      label: 'Traitement en cours',
      value: 5,
      accent: 'var(--ubax-accent)',
      background: '#FBBD86',
      icon: `${SHARED_ASSET_ROOT}/summary-progress.webp`,
    },
    {
      label: 'Tickets résolus',
      value: 15,
      accent: 'var(--ubax-success)',
      background: '#8CFFBE',
      icon: `${SHARED_ASSET_ROOT}/summary-done.webp`,
    },
  ];

  readonly issueCards: readonly SavIssueCard[] = [
    {
      title: 'Problème de nom sur le contrat',
      client: 'Mariam Coulibaly',
      location: 'Résidence Plateau - App 12',
      phone: '+225 07 58 23 41 89',
      image: `${SAV_ASSET_ROOT}/issue-property-01.webp`,
    },
    {
      title: 'Litige sur la durée du bail',
      client: 'Mariam Coulibaly',
      location: 'Résidence Plateau - App 12',
      phone: '+225 07 58 23 41 89',
      image: `${SAV_ASSET_ROOT}/issue-property-02.webp`,
    },
    {
      title: 'Résiliation anticipée',
      client: 'Mariam Coulibaly',
      location: 'Résidence Plateau - App 12',
      phone: '+225 07 58 23 41 89',
      image: `${SAV_ASSET_ROOT}/issue-property-03.webp`,
    },
    {
      title: 'Renouvellement de contrat',
      client: 'Mariam Coulibaly',
      location: 'Résidence Plateau - App 12',
      phone: '+225 07 58 23 41 89',
      image: `${SAV_ASSET_ROOT}/issue-property-04.webp`,
    },
  ];

  readonly tableFilters: readonly SavTicketFilterField[] = [
    { label: 'Statut', size: 'sm' },
    { label: 'Priorité', size: 'sm' },
    { label: 'Type de problème', size: 'lg' },
    { label: 'Date', size: 'date' },
  ];

  readonly tickets: readonly SavTicketRow[] = [
    {
      id: 'UBX-TK-0012',
      client: 'Konan Olivier',
      avatar: `${SHARED_ASSET_ROOT}/ticket-avatar-01.webp`,
      property: 'Résidence Plateau - App 12',
      issue: 'Fuite d’eau',
      priority: 'Urgent',
      priorityTone: 'urgent',
      createdAt: '05/03/2026',
      status: 'Résolu',
      statusTone: 'success',
    },
    {
      id: 'UBX-TK-0013',
      client: 'Awa Bakayoko',
      avatar: `${SHARED_ASSET_ROOT}/ticket-avatar-02.webp`,
      property: 'Résidence Plateau - App 12',
      issue: 'Problème électrique',
      priority: 'Urgent',
      priorityTone: 'urgent',
      createdAt: '05/03/2026',
      status: 'Résolu',
      statusTone: 'success',
    },
    {
      id: 'UBX-TK-0014',
      client: 'Moussa Traoré',
      avatar: `${SHARED_ASSET_ROOT}/ticket-avatar-03.webp`,
      property: 'Résidence Plateau - App 12',
      issue: 'Fuite d’eau',
      priority: 'normal',
      priorityTone: 'normal',
      createdAt: '05/03/2026',
      status: 'en cours',
      statusTone: 'progress',
    },
    {
      id: 'UBX-TK-0015',
      client: 'Mariam Coulibaly',
      avatar: `${SHARED_ASSET_ROOT}/ticket-avatar-04.webp`,
      property: 'Résidence Plateau - App 12',
      issue: 'Porte cassée',
      priority: 'Urgent',
      priorityTone: 'urgent',
      createdAt: '05/03/2026',
      status: 'Résolu',
      statusTone: 'success',
    },
    {
      id: 'UBX-TK-0016',
      client: 'Awa Bakayoko',
      avatar: `${SHARED_ASSET_ROOT}/ticket-avatar-02.webp`,
      property: 'Résidence Plateau - App 12',
      issue: 'Problème électrique',
      priority: 'Urgent',
      priorityTone: 'urgent',
      createdAt: '05/03/2026',
      status: 'Résolu',
      statusTone: 'success',
    },
    {
      id: 'UBX-TK-0017',
      client: 'Moussa Traoré',
      avatar: `${SHARED_ASSET_ROOT}/ticket-avatar-03.webp`,
      property: 'Résidence Plateau - App 12',
      issue: 'Fuite d’eau',
      priority: 'normal',
      priorityTone: 'normal',
      createdAt: '05/03/2026',
      status: 'en cours',
      statusTone: 'progress',
    },
    {
      id: 'UBX-TK-0018',
      client: 'Konan Olivier',
      avatar: `${SHARED_ASSET_ROOT}/ticket-avatar-01.webp`,
      property: 'Résidence Plateau - App 12',
      issue: 'Fuite d’eau',
      priority: 'Urgent',
      priorityTone: 'urgent',
      createdAt: '05/03/2026',
      status: 'Résolu',
      statusTone: 'success',
    },
    {
      id: 'UBX-TK-0019',
      client: 'Mariam Coulibaly',
      avatar: `${SHARED_ASSET_ROOT}/ticket-avatar-04.webp`,
      property: 'Résidence Plateau - App 12',
      issue: 'Porte cassée',
      priority: 'Urgent',
      priorityTone: 'urgent',
      createdAt: '05/03/2026',
      status: 'Résolu',
      statusTone: 'success',
    },
  ];

  readonly notifications: readonly SavNotificationItem[] = [
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

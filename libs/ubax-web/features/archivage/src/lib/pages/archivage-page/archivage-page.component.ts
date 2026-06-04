import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { UbaxPaginatorComponent } from '@ubax-workspace/shared-ui';
import { ArchivageStore } from '@ubax-workspace/ubax-web-data-access';
import { MessageService } from 'primeng/api';
import { DatePickerModule } from 'primeng/datepicker';
import { SelectModule } from 'primeng/select';
import { TooltipModule } from 'primeng/tooltip';

import {
  ARCHIVAGE_ICONS,
  ARCHIVAGE_TAB_DEFINITIONS,
} from '../../constants/archivage-page.constants';
import type {
  ArchivageFilterField,
  ArchivageFieldId,
  ArchivageRow,
  ArchivageTabDefinition,
  ArchivageTabId,
  ArchivageCellTone,
} from '../../types/archivage.types';
import type {
  ArchivageFiltersState,
  ArchivageSelectOption,
} from '../../types/archivage-page.types';

const FRENCH_MONTH_NAMES = [
  'Janvier',
  'Février',
  'Mars',
  'Avril',
  'Mai',
  'Juin',
  'Juillet',
  'Août',
  'Septembre',
  'Octobre',
  'Novembre',
  'Décembre',
] as const;

const ARCHIVAGE_DATE_PATTERN = /^\d{2}\/\d{2}\/\d{4}$/;

const DEFAULT_FILTERS: ArchivageFiltersState = {
  keyword: '',
  startDate: null,
  endDate: null,
  owner: '',
  archivedBy: '',
  type: '',
};

const PROPERTY_TYPE_LABELS: Record<string, string> = {
  APARTMENT: 'Appartement',
  VILLA: 'Villa',
  HOUSE: 'Maison',
  LAND: 'Terrain',
  OFFICE: 'Bureau',
  WAREHOUSE: 'Entrepôt',
  STORE: 'Boutique',
  HOTEL_ROOM: 'Chambre hôtel',
  HOTEL_SUITE: 'Suite hôtelière',
  HOTEL_STUDIO: 'Studio hôtel',
  EVENT_SPACE: 'Espace événement',
  CONFERENCE_ROOM: 'Salle conférence',
  RESTAURANT_SPACE: 'Restaurant/Bar',
};

const TICKET_STATUS_LABELS: Record<string, { label: string; tone: ArchivageCellTone }> = {
  RESOLVED: { label: 'Résolu', tone: 'success' },
  CLOSED: { label: 'Clôturé', tone: 'warning' },
  CANCELLED: { label: 'Annulé', tone: 'danger' },
  OPEN: { label: 'Ouvert', tone: 'warning' },
  IN_ANALYSIS: { label: 'En analyse', tone: 'warning' },
  TECHNICIAN_SENT: { label: 'Technicien envoyé', tone: 'warning' },
};

const FRENCH_STATUS_LABELS: Record<string, string> = {
  // Propriétés
  DRAFT: 'Brouillon',
  PENDING: 'En attente',
  PUBLISHED: 'Publié',
  RESERVED: 'Réservé',
  SOLD: 'Vendu',
  ARCHIVED: 'Archivé',
  REJECTED: 'Rejeté',
  // Locataires
  ACTIVE: 'Actif',
  INACTIVE: 'Inactif',
  QUALIFIED: 'Qualifié',
  // Paiements
  PAID: 'Payé',
  UNPAID: 'Non payé',
  PARTIAL: 'Partiel',
  OVERDUE: 'En retard',
  CANCELLED: 'Annulé',
  REFUNDED: 'Remboursé',
  // Tickets
  OPEN: 'Ouvert',
  IN_ANALYSIS: 'En analyse',
  TECHNICIAN_SENT: 'Technicien envoyé',
  RESOLVED: 'Résolu',
  CLOSED: 'Clôturé',
  // Documents
  EXPIRED: 'Expiré',
  VALID: 'Valide',
  // Priorités tickets
  LOW: 'Faible',
  NORMAL: 'Normale',
  HIGH: 'Haute',
  URGENT: 'Urgente',
  // Méthodes de paiement
  CASH: 'Espèces',
  BANK_TRANSFER: 'Virement',
  MOBILE_MONEY: 'Mobile Money',
  CHECK: 'Chèque',
  // Types de paiement
  RENT: 'Loyer',
  CHARGE: 'Charges',
  DEPOSIT: 'Dépôt de garantie',
  MAINTENANCE: 'Maintenance',
};

type PendingRestoreInfo = {
  id: string;
  tab: ArchivageTabId;
  propertyId?: string;
};

type DetailFieldDef = { label: string; key: string; format?: 'date' | 'amount' | 'type' };

const DETAIL_FIELDS: Record<ArchivageTabId, DetailFieldDef[]> = {
  biens: [
    { label: 'Titre', key: 'title' },
    { label: 'Type', key: 'propertyType', format: 'type' },
    { label: 'Ville', key: 'city' },
    { label: 'Adresse', key: 'address' },
    { label: 'Propriétaire', key: 'ownerName' },
    { label: 'Agence', key: 'agencyName' },
    { label: 'Prix', key: 'price', format: 'amount' },
    { label: 'Statut', key: 'status' },
    { label: 'Créé le', key: 'createdAt', format: 'date' },
    { label: 'Modifié le', key: 'updatedAt', format: 'date' },
  ],
  locataires: [
    { label: 'Nom complet', key: 'fullName' },
    { label: 'Email', key: 'email' },
    { label: 'Bien', key: 'propertyId' },
    { label: 'Statut emploi', key: 'employmentStatus' },
    { label: 'Revenu mensuel', key: 'monthlyIncome', format: 'amount' },
    { label: 'Garant', key: 'guarantorName' },
    { label: 'Statut', key: 'status' },
    { label: 'Créé le', key: 'createdAt', format: 'date' },
    { label: 'Archivé le', key: 'updatedAt', format: 'date' },
  ],
  factures: [
    { label: 'Référence', key: 'reference' },
    { label: 'Type', key: 'paymentType' },
    { label: 'Méthode', key: 'paymentMethod' },
    { label: 'Montant', key: 'amount', format: 'amount' },
    { label: 'Montant payé', key: 'amountPaid', format: 'amount' },
    { label: 'Date d\'échéance', key: 'dueDate', format: 'date' },
    { label: 'Date de paiement', key: 'paidDate', format: 'date' },
    { label: 'Période', key: 'periodLabel' },
    { label: 'Enregistré par', key: 'recordedByName' },
    { label: 'Statut', key: 'status' },
  ],
  tickets: [
    { label: 'Titre', key: 'title' },
    { label: 'Description', key: 'description' },
    { label: 'Catégorie', key: 'category' },
    { label: 'Priorité', key: 'priority' },
    { label: 'Technicien', key: 'technicianName' },
    { label: 'Assigné à', key: 'assignedToName' },
    { label: 'Statut', key: 'status' },
    { label: 'Coût réparation', key: 'repairCost', format: 'amount' },
    { label: 'Note de résolution', key: 'resolutionNote' },
    { label: 'Créé le', key: 'createdAt', format: 'date' },
  ],
  documents: [
    { label: 'Type', key: 'type' },
    { label: 'Nom', key: 'name' },
    { label: 'Bien', key: 'propertyId' },
    { label: 'Statut', key: 'status' },
    { label: 'Date de début', key: 'startDate', format: 'date' },
    { label: 'Date de fin', key: 'endDate', format: 'date' },
    { label: 'Créé le', key: 'createdAt', format: 'date' },
  ],
};

function str(value: unknown): string {
  if (value === null || value === undefined) return '';
  return String(value);
}

function isoToFrenchDate(iso: unknown): string {
  if (!iso) return '';
  const s = String(iso);
  const d = new Date(s);
  if (isNaN(d.getTime())) return s;
  const day = String(d.getDate()).padStart(2, '0');
  const month = FRENCH_MONTH_NAMES[d.getMonth()];
  return month ? `${day} ${month} ${d.getFullYear()}` : s;
}

function isoToDDMMYYYY(iso: unknown): string {
  if (!iso) return '';
  const s = String(iso);
  const d = new Date(s);
  if (isNaN(d.getTime())) return s;
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

function formatAmount(value: unknown): string {
  const n = Number(value);
  if (isNaN(n)) return str(value);
  return `${n.toLocaleString('fr-FR')} FCFA`;
}

function mapBienToRow(item: Record<string, unknown>): ArchivageRow {
  const id = str(item['id']) || `bien-${Math.random()}`;
  const title = str(item['title'] ?? item['reference'] ?? id);
  const propType = PROPERTY_TYPE_LABELS[str(item['propertyType'])] || str(item['propertyType']) || '—';
  const city = str(item['city'] ?? item['district'] ?? '—');
  const owner = str(item['ownerName'] ?? '—');
  const archivedAt = isoToFrenchDate(item['updatedAt'] ?? item['publishedAt'] ?? '');

  return {
    id,
    searchIndex: [title, propType, city, owner].join(' '),
    startDate: isoToDDMMYYYY(item['updatedAt']),
    endDate: isoToDDMMYYYY(item['updatedAt']),
    owner,
    type: str(item['propertyType']),
    cells: [
      { kind: 'text', value: title, emphasis: true },
      { kind: 'text', value: propType },
      { kind: 'text', value: city },
      { kind: 'text', value: owner },
      { kind: 'text', value: archivedAt },
      { kind: 'badge', label: 'Archivé', tone: 'warning' },
      { kind: 'actions', primaryLabel: 'voir', secondaryLabel: 'Restaurer' },
    ],
  };
}

function mapLocataireToRow(item: Record<string, unknown>): ArchivageRow {
  const id = str(item['id']) || `locataire-${Math.random()}`;
  const fullName = str(item['fullName'] ?? item['name'] ?? '—');
  const propertyRef = str(item['propertyId'] ?? item['propertyName'] ?? '—');
  const createdAt = isoToDDMMYYYY(item['createdAt'] ?? '');
  const exitDate = isoToDDMMYYYY(item['updatedAt'] ?? '');
  const archivedAt = isoToFrenchDate(item['updatedAt'] ?? '');
  const status = str(item['status'] ?? item['archiveReason'] ?? '');
  const badgeTone: ArchivageCellTone = status === 'ACTIVE' ? 'success' : 'warning';

  return {
    id,
    searchIndex: [fullName, propertyRef, status].join(' '),
    startDate: createdAt,
    endDate: exitDate,
    cells: [
      { kind: 'text', value: fullName, emphasis: true },
      { kind: 'text', value: propertyRef },
      { kind: 'text', value: createdAt || '—' },
      { kind: 'text', value: exitDate || '—' },
      { kind: 'text', value: archivedAt || '—' },
      { kind: 'badge', label: status || 'Archivé', tone: badgeTone },
      { kind: 'actions', primaryLabel: 'voir', secondaryLabel: 'Restaurer' },
    ],
  };
}

function mapFactureToRow(item: Record<string, unknown>): ArchivageRow {
  const id = str(item['id']) || `facture-${Math.random()}`;
  const reference = str(item['reference'] ?? id);
  const propertyRef = str(item['propertyId'] ?? item['propertyName'] ?? '—');
  const contact = str(item['recordedByName'] ?? item['tenantId'] ?? '—');
  const invoiceDate = isoToFrenchDate(item['dueDate'] ?? item['paidDate'] ?? item['createdAt'] ?? '');
  const amount = formatAmount(item['amount']);
  const reason = str(item['periodLabel'] ?? item['paymentType'] ?? item['note'] ?? '—');
  const badgeTone: ArchivageCellTone = item['overdue'] ? 'danger' : 'warning';

  return {
    id,
    searchIndex: [reference, propertyRef, contact, reason].join(' '),
    startDate: isoToDDMMYYYY(item['dueDate'] ?? item['createdAt'] ?? ''),
    endDate: isoToDDMMYYYY(item['paidDate'] ?? item['updatedAt'] ?? ''),
    cells: [
      { kind: 'text', value: reference, emphasis: true },
      { kind: 'text', value: propertyRef },
      { kind: 'text', value: contact },
      { kind: 'text', value: invoiceDate || '—' },
      { kind: 'text', value: amount, emphasis: true },
      { kind: 'badge', label: reason, tone: badgeTone },
      { kind: 'actions', primaryLabel: 'voir', secondaryLabel: 'Restaurer' },
    ],
  };
}

function mapTicketToRow(item: Record<string, unknown>): ArchivageRow {
  const id = str(item['id']) || `ticket-${Math.random()}`;
  const reference = str(item['id'] ?? '—');
  const propertyRef = str(item['propertyId'] ?? item['propertyName'] ?? '—');
  const technician = str(item['technicianName'] ?? item['assignedToName'] ?? '—');
  const description = str(item['title'] ?? item['description'] ?? '—');
  const date = isoToFrenchDate(item['createdAt'] ?? item['updatedAt'] ?? '');
  const statusKey = str(item['status'] ?? '');
  const statusInfo = TICKET_STATUS_LABELS[statusKey] ?? { label: statusKey || 'Archivé', tone: 'warning' as ArchivageCellTone };

  return {
    id,
    searchIndex: [reference, propertyRef, technician, description].join(' '),
    startDate: isoToDDMMYYYY(item['createdAt'] ?? ''),
    endDate: isoToDDMMYYYY(item['updatedAt'] ?? ''),
    cells: [
      { kind: 'text', value: reference.slice(0, 12) || '—', emphasis: true },
      { kind: 'text', value: propertyRef },
      { kind: 'text', value: technician },
      { kind: 'text', value: description },
      { kind: 'text', value: date || '—' },
      { kind: 'badge', label: statusInfo.label, tone: statusInfo.tone },
      { kind: 'actions', primaryLabel: 'voir', secondaryLabel: 'Restaurer' },
    ],
  };
}

function mapDocumentToRow(item: Record<string, unknown>): ArchivageRow {
  const id = str(item['id']) || `doc-${Math.random()}`;
  const docType = str(item['type'] ?? item['documentType'] ?? '—');
  const propertyRef = str(item['_propertyId'] ?? item['propertyId'] ?? '—');
  const client = str(item['clientName'] ?? item['uploadedBy'] ?? '—');
  const startDate = isoToDDMMYYYY(item['startDate'] ?? item['createdAt'] ?? '');
  const endDate = isoToDDMMYYYY(item['endDate'] ?? item['updatedAt'] ?? '');
  const status = str(item['status'] ?? 'Archivé');
  const badgeTone: ArchivageCellTone = status === 'ACTIVE' ? 'success' : status === 'EXPIRED' ? 'danger' : 'warning';

  return {
    id,
    searchIndex: [docType, propertyRef, client].join(' '),
    startDate,
    endDate,
    type: docType,
    cells: [
      { kind: 'text', value: docType, emphasis: true },
      { kind: 'text', value: propertyRef },
      { kind: 'text', value: client },
      { kind: 'text', value: startDate || '—' },
      { kind: 'text', value: endDate || '—' },
      { kind: 'badge', label: status, tone: badgeTone },
      { kind: 'actions', primaryLabel: 'voir', secondaryLabel: 'Restaurer' },
    ],
  };
}

function cloneDate(value: Date | null): Date | null {
  return value ? new Date(value) : null;
}

function normalizeCalendarDate(value: Date): Date {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate());
}

function parseRowDate(value: string): Date | null {
  const parts = value.split('/');
  if (parts.length !== 3) return null;
  const [day, month, year] = parts.map(Number);
  if (!day || !month || !year) return null;
  return new Date(year, month - 1, day);
}

function getDateRangeValidationMessage(filters: ArchivageFiltersState): string | null {
  const hasStart = !!filters.startDate;
  const hasEnd = !!filters.endDate;
  if (hasStart !== hasEnd) return 'Renseignez la date de début et la date de fin pour appliquer un intervalle.';
  if (!filters.startDate || !filters.endDate) return null;
  const start = normalizeCalendarDate(filters.startDate);
  const end = normalizeCalendarDate(filters.endDate);
  return start > end ? 'La date de début ne peut pas être supérieure à la date de fin.' : null;
}

function getEffectiveDateRange(filters: ArchivageFiltersState): { readonly start: Date; readonly end: Date } | null {
  if (getDateRangeValidationMessage(filters)) return null;
  const { startDate, endDate } = filters;
  if (!startDate || !endDate) return null;
  return { start: normalizeCalendarDate(startDate), end: normalizeCalendarDate(endDate) };
}

function isRowWithinDateRange(row: ArchivageRow, dateRange: { start: Date; end: Date }): boolean {
  const rowDate = parseRowDate(row.startDate);
  if (!rowDate) return true;
  return rowDate >= dateRange.start && rowDate <= dateRange.end;
}

function cloneFiltersState(f: ArchivageFiltersState): ArchivageFiltersState {
  return { ...f, startDate: cloneDate(f.startDate), endDate: cloneDate(f.endDate) };
}

function areFilterDatesEqual(a: Date | null, b: Date | null): boolean {
  if (!a || !b) return a === b;
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function areFiltersEqual(a: ArchivageFiltersState, b: ArchivageFiltersState): boolean {
  return (
    a.keyword === b.keyword &&
    areFilterDatesEqual(a.startDate, b.startDate) &&
    areFilterDatesEqual(a.endDate, b.endDate) &&
    a.owner === b.owner &&
    a.archivedBy === b.archivedBy &&
    a.type === b.type
  );
}

function normalizeText(value: string): string {
  return value.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

@Component({
  selector: 'ubax-archivage-page',
  standalone: true,
  imports: [
    FormsModule,
    DatePickerModule,
    SelectModule,
    TooltipModule,
    UbaxPaginatorComponent,
  ],
  templateUrl: './archivage-page.component.html',
  styleUrl: './archivage-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArchivagePageComponent implements OnInit, OnDestroy {
  private readonly document = inject(DOCUMENT);
  private readonly store = inject(ArchivageStore);
  private readonly messageService = inject(MessageService);

  protected readonly tabs = ARCHIVAGE_TAB_DEFINITIONS;
  protected readonly icons = ARCHIVAGE_ICONS;
  protected readonly PAGE_SIZE = 10;
  protected readonly standaloneModelOptions = { standalone: true };

  protected readonly activeTab = signal<ArchivageTabId>('biens');
  protected readonly currentPage = signal(1);
  protected readonly headerSearch = signal('');
  protected readonly draftFilters = signal<ArchivageFiltersState>(cloneFiltersState(DEFAULT_FILTERS));
  protected readonly appliedFilters = signal<ArchivageFiltersState>(cloneFiltersState(DEFAULT_FILTERS));

  protected readonly detailDialogVisible = signal(false);
  protected readonly detailDialogClosing = signal(false);
  protected readonly confirmDialogVisible = signal(false);
  protected readonly confirmDialogClosing = signal(false);
  protected readonly pendingRestore = signal<PendingRestoreInfo | null>(null);

  protected readonly activeDefinition = computed<ArchivageTabDefinition>(
    () => ARCHIVAGE_TAB_DEFINITIONS.find((t) => t.id === this.activeTab()) ?? ARCHIVAGE_TAB_DEFINITIONS[0],
  );

  protected readonly activeTabStore = computed(() => {
    const tab = this.activeTab();
    switch (tab) {
      case 'biens': return this.store.biens();
      case 'locataires': return this.store.locataires();
      case 'factures': return this.store.factures();
      case 'tickets': return this.store.tickets();
      case 'documents': return this.store.documents();
    }
  });

  protected readonly isLoading = computed(() => this.activeTabStore().loading);
  protected readonly loadError = computed(() => this.activeTabStore().error);
  protected readonly totalPages = computed(() => Math.max(1, this.activeTabStore().totalPages || 1));

  protected readonly rawRows = computed<readonly ArchivageRow[]>(() => {
    const items = this.activeTabStore().items;
    const tab = this.activeTab();
    switch (tab) {
      case 'biens': return items.map(mapBienToRow);
      case 'locataires': return items.map(mapLocataireToRow);
      case 'factures': return items.map(mapFactureToRow);
      case 'tickets': return items.map(mapTicketToRow);
      case 'documents': return items.map(mapDocumentToRow);
    }
  });

  protected readonly filteredRows = computed<readonly ArchivageRow[]>(() => {
    const globalQuery = normalizeText(this.headerSearch());
    const filters = this.appliedFilters();
    const effectiveDateRange = getEffectiveDateRange(filters);

    return this.rawRows().filter((row) => {
      if (globalQuery && !normalizeText(row.searchIndex).includes(globalQuery)) return false;
      if (filters.keyword && !normalizeText(row.searchIndex).includes(normalizeText(filters.keyword))) return false;
      if (effectiveDateRange && !isRowWithinDateRange(row, effectiveDateRange)) return false;
      if (filters.owner && row.owner !== filters.owner) return false;
      if (filters.type && row.type !== filters.type) return false;
      return true;
    });
  });

  protected readonly pagedRows = computed<readonly ArchivageRow[]>(() => this.filteredRows());

  protected readonly dateRangeValidationMessage = computed(() =>
    getDateRangeValidationMessage(this.draftFilters()),
  );

  protected readonly hasDateRangeValidationIssue = computed(() => !!this.dateRangeValidationMessage());

  protected readonly showResetFiltersButton = computed(() => {
    const hasApplied = !areFiltersEqual(this.appliedFilters(), DEFAULT_FILTERS);
    const hasPending = !areFiltersEqual(this.draftFilters(), this.appliedFilters());
    return hasApplied && (!hasPending || this.hasDateRangeValidationIssue());
  });

  protected readonly selectedItem = computed(() => this.store.selectedItem());
  protected readonly selectedItemLoading = computed(() => this.store.selectedItemLoading());
  protected readonly isRestoring = computed(() => this.store.restoreStatus() === 'pending');

  protected readonly detailFields = computed(() => DETAIL_FIELDS[this.activeTab()]);

  constructor() {
    // Gestion du z-index du topbar : on le passe derrière l'overlay quand un dialog est ouvert
    effect(() => {
      const isOpen = this.detailDialogVisible() || this.confirmDialogVisible();
      this.document.body.classList.toggle('ubax-overlay-open', isOpen);
    });

    effect(() => {
      const status = this.store.restoreStatus();
      if (status === 'success') {
        this.pushToast('success', 'Élément restauré avec succès.');
        this.store.setRestoreIdle();
        this.confirmDialogClosing.set(true);
        setTimeout(() => {
          this.confirmDialogVisible.set(false);
          this.confirmDialogClosing.set(false);
          this.pendingRestore.set(null);
          this.reloadActiveTab();
        }, 220);
      } else if (status === 'error') {
        this.pushToast('error', this.store.restoreError() ?? 'Erreur lors de la restauration.');
        this.store.setRestoreIdle();
      }
    });
  }

  private pushToast(severity: 'success' | 'error', detail: string): void {
    this.messageService.add({
      severity,
      summary: severity === 'success' ? 'Opération réussie' : 'Action impossible',
      detail,
      life: severity === 'error' ? 6200 : 4200,
      closable: true,
      styleClass: `ubax-toast-message ubax-toast-message--${severity}`,
      contentStyleClass: 'ubax-toast-content',
      closeIcon: 'pi-times',
    });
  }

  ngOnInit(): void {
    this.reloadActiveTab();
  }

  ngOnDestroy(): void {
    this.document.body.classList.remove('ubax-overlay-open');
  }

  private reloadActiveTab(): void {
    const page = this.currentPage() - 1;
    const size = this.PAGE_SIZE;
    switch (this.activeTab()) {
      case 'biens':
        this.store.loadBiens({ page, size });
        break;
      case 'locataires':
        this.store.loadLocataires({ page, size });
        break;
      case 'factures':
        this.store.loadFactures({ page, size });
        break;
      case 'tickets':
        this.store.loadTickets({ page, size });
        break;
      case 'documents':
        this.store.loadDocuments();
        break;
    }
  }

  protected selectTab(tabId: ArchivageTabId): void {
    if (tabId === this.activeTab()) return;
    this.activeTab.set(tabId);
    this.currentPage.set(1);
    this.headerSearch.set('');
    this.clearFilters();
    this.reloadActiveTab();
  }

  protected changePage(page: number): void {
    this.currentPage.set(page);
    this.reloadActiveTab();
  }

  protected updateHeaderSearch(event: Event): void {
    this.headerSearch.set(this.getTextInputValue(event));
  }

  protected updateDraftFilter(field: ArchivageFieldId, value: string): void {
    this.draftFilters.update((s) => ({ ...s, [field]: value }) as ArchivageFiltersState);
  }

  protected updateDraftDateFilter(field: ArchivageFieldId, value: Date | null): void {
    this.draftFilters.update((s) => ({ ...s, [field]: cloneDate(value) }) as ArchivageFiltersState);
  }

  protected applyFilters(event: Event): void {
    event.preventDefault();
    if (this.hasDateRangeValidationIssue()) return;
    this.appliedFilters.set(cloneFiltersState(this.draftFilters()));
    this.currentPage.set(1);
    this.reloadActiveTab();
  }

  protected clearFilters(): void {
    this.draftFilters.set(cloneFiltersState(DEFAULT_FILTERS));
    this.appliedFilters.set(cloneFiltersState(DEFAULT_FILTERS));
  }

  protected handleView(row: ArchivageRow): void {
    const item = this.activeTabStore().items.find((i) => String(i['id']) === row.id);
    if (item) {
      this.store.setDetailItem(item);
    }

    switch (this.activeTab()) {
      case 'tickets':
        this.store.loadTicketDetail(row.id);
        break;
      case 'locataires':
        this.store.loadTenantDetail(row.id);
        break;
      case 'factures':
        this.store.loadPaymentDetail(row.id);
        break;
    }

    this.detailDialogVisible.set(true);
  }

  protected handleRestore(row: ArchivageRow): void {
    const tab = this.activeTab();
    let propertyId: string | undefined;

    if (tab === 'documents') {
      const item = this.activeTabStore().items.find((i) => String(i['id']) === row.id);
      propertyId = String(item?.['_propertyId'] ?? item?.['propertyId'] ?? '');
    }

    this.pendingRestore.set({ id: row.id, tab, propertyId });
    this.confirmDialogVisible.set(true);
  }

  protected confirmRestore(): void {
    const pending = this.pendingRestore();
    if (!pending) return;

    switch (pending.tab) {
      case 'biens':
        this.store.restoreBien(pending.id);
        break;
      case 'locataires':
        this.store.restoreLocataire(pending.id);
        break;
      case 'factures':
        this.store.restoreFacture(pending.id);
        break;
      case 'tickets':
        this.store.restoreTicket(pending.id);
        break;
      case 'documents':
        this.store.restoreDocumentItem({
          propertyId: pending.propertyId ?? '',
          docId: pending.id,
        });
        break;
    }
  }

  protected restoreFromDetail(): void {
    const item = this.store.selectedItem();
    if (!item) return;
    this.closeDetailDialog();
    const id = String(item['id'] ?? '');
    if (!id) return;
    const tab = this.activeTab();
    let propertyId: string | undefined;
    if (tab === 'documents') {
      propertyId = String(item['_propertyId'] ?? item['propertyId'] ?? '');
    }
    this.pendingRestore.set({ id, tab, propertyId });
    this.confirmDialogVisible.set(true);
  }

  protected cancelRestore(): void {
    this.confirmDialogClosing.set(true);
    setTimeout(() => {
      this.confirmDialogVisible.set(false);
      this.confirmDialogClosing.set(false);
      this.pendingRestore.set(null);
    }, 220);
  }

  protected closeDetailDialog(): void {
    this.detailDialogClosing.set(true);
    setTimeout(() => {
      this.detailDialogVisible.set(false);
      this.detailDialogClosing.set(false);
      this.store.clearDetail();
    }, 220);
  }

  protected getFieldValue(field: DetailFieldDef): string {
    const item = this.selectedItem();
    if (!item) return '—';
    const raw = item[field.key];
    if (raw === null || raw === undefined || raw === '') return '—';
    if (field.format === 'date') return isoToFrenchDate(raw) || '—';
    if (field.format === 'amount') return formatAmount(raw);
    if (field.format === 'type') return PROPERTY_TYPE_LABELS[String(raw)] || FRENCH_STATUS_LABELS[String(raw)] || String(raw);
    const asStr = String(raw);
    return FRENCH_STATUS_LABELS[asStr] || asStr;
  }

  protected getTextInputValue(event: Event): string {
    return (event.target as HTMLInputElement | null)?.value ?? '';
  }

  protected getDraftFilterValue(field: ArchivageFieldId): string {
    const value = this.draftFilters()[field];
    return typeof value === 'string' ? value : '';
  }

  protected getDraftDateValue(field: ArchivageFieldId): Date | null {
    const value = this.draftFilters()[field];
    return value instanceof Date ? value : null;
  }

  protected getSelectOptions(field: ArchivageFilterField): ArchivageSelectOption[] {
    return [
      { label: field.label, value: '' },
      ...(field.options ?? []).map((o) => ({ label: o, value: o })),
    ];
  }

  protected formatTableCellValue(value: string): string {
    if (!ARCHIVAGE_DATE_PATTERN.test(value)) return value;
    const parsedDate = parseRowDate(value);
    if (!parsedDate) return value;
    const day = String(parsedDate.getDate()).padStart(2, '0');
    const month = FRENCH_MONTH_NAMES[parsedDate.getMonth()];
    return month ? `${day} ${month} ${parsedDate.getFullYear()}` : value;
  }

  protected exportCurrentView(): void {
    const currentWindow = this.document.defaultView;
    if (!currentWindow) return;
    const lines = [
      this.activeDefinition().columns.join(';'),
      ...this.filteredRows().map((row) =>
        row.cells
          .map((c) => {
            if (c.kind === 'text') return c.value;
            if (c.kind === 'badge') return c.label;
            if (c.kind === 'avatar') return c.value;
            return '';
          })
          .join(';'),
      ),
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = currentWindow.URL.createObjectURL(blob);
    const link = this.document.createElement('a');
    link.href = url;
    link.download = `${this.activeTab()}-archives.csv`;
    this.document.body.append(link);
    link.click();
    link.remove();
    currentWindow.URL.revokeObjectURL(url);
  }
}

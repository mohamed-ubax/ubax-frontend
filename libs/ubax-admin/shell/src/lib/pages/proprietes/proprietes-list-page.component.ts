import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import type { PropertyResponse } from '@ubax-workspace/shared-api-types';
import {
  EmptyStateComponent,
  SectionCardComponent,
  StatusBadgeComponent,
} from '@ubax-workspace/shared-design-system';
import {
  NOTIFICATION_HANDLER,
  resolveHttpErrorMessage,
} from '@ubax-workspace/shared-data-access';
import {
  UiDataTableCellDefDirective,
  type UiDataTableColumn,
  UiDataTableComponent,
  UiDataTableEmptyDefDirective,
  UiFormSelectComponent,
  UiPaginationComponent,
} from '@ubax-workspace/shared-ui';
import { AdminPropertiesService } from '../../services/admin-properties.service';

const PAGE_SIZE = 20;

const PROPERTY_TYPE_LABELS: Record<string, string> = {
  APARTMENT: 'Appartement',
  VILLA: 'Villa',
  HOUSE: 'Maison',
  LAND: 'Terrain',
  OFFICE: 'Bureau',
  COMMERCIAL: 'Commercial',
  STUDIO: 'Studio',
  DUPLEX: 'Duplex',
  PENTHOUSE: 'Penthouse',
};

const TRANSACTION_TYPE_LABELS: Record<string, string> = {
  SALE: 'Vente',
  RENT: 'Location',
  RENT_FURNISHED: 'Location meublée',
  SHORT_STAY: 'Court séjour',
};

@Component({
  selector: 'ubax-admin-proprietes-list-page',
  standalone: true,
  imports: [
    DatePipe,
    SectionCardComponent,
    StatusBadgeComponent,
    EmptyStateComponent,
    UiFormSelectComponent,
    UiDataTableComponent,
    UiDataTableCellDefDirective,
    UiDataTableEmptyDefDirective,
    UiPaginationComponent,
  ],
  templateUrl: './proprietes-list-page.component.html',
  styleUrl: './proprietes-list-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProprietesListPageComponent {
  private readonly svc = inject(AdminPropertiesService);
  private readonly notif = inject(NOTIFICATION_HANDLER);
  private readonly router = inject(Router);

  protected readonly loading = signal(false);
  protected readonly properties = signal<PropertyResponse[]>([]);
  protected readonly totalElements = signal(0);
  protected readonly totalPages = signal(1);
  protected readonly currentPage = signal(0); // 0-based for server pagination

  // Active filters
  protected readonly searchQuery = signal('');
  protected readonly cityFilter = signal('');
  protected readonly typeFilter = signal('');
  protected readonly agencyFilter = signal('');

  protected readonly tableColumns: readonly UiDataTableColumn<PropertyResponse>[] =
    [
      { key: 'property', header: 'Bien', width: '24%' },
      { key: 'type', header: 'Type', width: '10%' },
      { key: 'transaction', header: 'Transaction', width: '12%' },
      { key: 'city', header: 'Ville', width: '10%' },
      { key: 'price', header: 'Prix', width: '12%', align: 'end' },
      { key: 'owner', header: 'Agence / Propriétaire', width: '18%' },
      { key: 'submittedAt', header: 'Soumis le', width: '8%' },
      { key: 'actions', header: 'Actions', width: '6%', align: 'end' },
    ];

  protected readonly typeOptions = [
    'Tous les types',
    'Appartement',
    'Villa',
    'Maison',
    'Terrain',
    'Bureau',
    'Commercial',
    'Studio',
  ];

  protected readonly typeFilterLabel = signal('Tous les types');

  private readonly typeOptionValues: Record<string, string> = {
    'Tous les types': '',
    'Appartement': 'APARTMENT',
    'Villa': 'VILLA',
    'Maison': 'HOUSE',
    'Terrain': 'LAND',
    'Bureau': 'OFFICE',
    'Commercial': 'COMMERCIAL',
    'Studio': 'STUDIO',
  };

  protected readonly filteredProperties = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    if (!query) return this.properties();
    return this.properties().filter(
      (p) =>
        (p.title ?? '').toLowerCase().includes(query) ||
        (p.city ?? '').toLowerCase().includes(query) ||
        (p.agencyName ?? '').toLowerCase().includes(query) ||
        (p.ownerName ?? '').toLowerCase().includes(query) ||
        (p.district ?? '').toLowerCase().includes(query),
    );
  });

  protected readonly pagedRows = computed(() => this.filteredProperties());

  constructor() {
    effect(() => {
      void this.loadProperties();
    });
  }

  private async loadProperties(): Promise<void> {
    this.loading.set(true);
    try {
      const result = await firstValueFrom(
        this.svc.listPending({
          page: this.currentPage(),
          size: PAGE_SIZE,
          city: this.cityFilter() || undefined,
          propertyType: this.typeFilter() || undefined,
          agencyId: this.agencyFilter() || undefined,
        }),
      );
      this.properties.set(result.items);
      this.totalElements.set(result.totalElements);
      this.totalPages.set(result.totalPages);
    } catch (err) {
      this.notif.error(
        resolveHttpErrorMessage(
          err,
          'Impossible de charger la liste des biens en attente.',
        ),
      );
    } finally {
      this.loading.set(false);
    }
  }

  protected onSearchChange(value: string): void {
    this.searchQuery.set(value);
  }

  protected onTypeFilterChange(label: string): void {
    this.typeFilterLabel.set(label);
    this.typeFilter.set(this.typeOptionValues[label] ?? '');
    this.currentPage.set(0);
    void this.loadProperties();
  }

  protected onPageChange(page: number | Event): void {
    if (typeof page !== 'number') {
      return;
    }

    this.currentPage.set(page - 1);
    void this.loadProperties();
  }

  protected viewDetail(property: PropertyResponse): void {
    void this.router.navigate(['/proprietes', property.id]);
  }

  protected getPropertyTypeLabel(type: string | undefined): string {
    return PROPERTY_TYPE_LABELS[type ?? ''] ?? type ?? '—';
  }

  protected getTransactionTypeLabel(type: string | undefined): string {
    return TRANSACTION_TYPE_LABELS[type ?? ''] ?? type ?? '—';
  }

  protected getTransactionBadge(
    type: string | undefined,
  ): 'info' | 'neutral' | 'active' | 'warning' {
    switch (type) {
      case 'SALE':
        return 'active';
      case 'RENT':
        return 'info';
      case 'RENT_FURNISHED':
        return 'info';
      case 'SHORT_STAY':
        return 'warning';
      default:
        return 'neutral';
    }
  }

  protected formatPrice(price: number | undefined): string {
    if (!price) return '—';
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      maximumFractionDigits: 0,
    }).format(price);
  }

  protected getPropertyInitials(property: PropertyResponse): string {
    return (property.title ?? property.propertyType ?? 'BI')
      .slice(0, 2)
      .toUpperCase();
  }

  /** coverPhotoUrl est retourné par l'API mais absent du type généré */
  protected getCoverPhotoUrl(property: PropertyResponse): string | null {
    return (
      (property as PropertyResponse & { coverPhotoUrl?: string })
        .coverPhotoUrl ?? null
    );
  }
}

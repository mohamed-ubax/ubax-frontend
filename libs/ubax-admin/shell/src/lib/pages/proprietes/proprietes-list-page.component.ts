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
  SearchFilterBarComponent,
  SectionCardComponent,
  StatusBadgeComponent,
  type FilterOption,
} from '@ubax-workspace/shared-design-system';
import { NOTIFICATION_HANDLER, resolveHttpErrorMessage } from '@ubax-workspace/shared-data-access';
import { TableModule } from 'primeng/table';
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
    TableModule,
    DatePipe,
    SearchFilterBarComponent,
    SectionCardComponent,
    StatusBadgeComponent,
    EmptyStateComponent,
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

  protected readonly searchFilters: { label: string; options: FilterOption[] }[] = [
    {
      label: 'Type de bien',
      options: [
        { label: 'Tous les types', value: '' },
        { label: 'Appartement', value: 'APARTMENT' },
        { label: 'Villa', value: 'VILLA' },
        { label: 'Maison', value: 'HOUSE' },
        { label: 'Terrain', value: 'LAND' },
        { label: 'Bureau', value: 'OFFICE' },
        { label: 'Commercial', value: 'COMMERCIAL' },
        { label: 'Studio', value: 'STUDIO' },
      ],
    },
  ];

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
      this.notif.error(resolveHttpErrorMessage(err, 'Impossible de charger la liste des biens en attente.'));
    } finally {
      this.loading.set(false);
    }
  }

  protected onSearchChange(value: string): void {
    this.searchQuery.set(value);
  }

  protected onFilterChange(event: { filter: string; value: unknown }): void {
    this.typeFilter.set((event.value as string) ?? '');
    this.currentPage.set(0);
    void this.loadProperties();
  }

  protected onPageChange(event: { first: number; rows: number }): void {
    this.currentPage.set(Math.floor(event.first / event.rows));
    void this.loadProperties();
  }

  protected viewDetail(property: PropertyResponse): void {
    void this.router.navigate(['/proprietes', property.id]);
  }

  protected getPropertyTypeLabel(type: string | undefined): string {
    return PROPERTY_TYPE_LABELS[type ?? ''] ?? (type ?? '—');
  }

  protected getTransactionTypeLabel(type: string | undefined): string {
    return TRANSACTION_TYPE_LABELS[type ?? ''] ?? (type ?? '—');
  }

  protected getTransactionBadge(type: string | undefined): 'info' | 'neutral' | 'active' | 'warning' {
    switch (type) {
      case 'SALE': return 'active';
      case 'RENT': return 'info';
      case 'RENT_FURNISHED': return 'info';
      case 'SHORT_STAY': return 'warning';
      default: return 'neutral';
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
    return (property.title ?? property.propertyType ?? 'BI').slice(0, 2).toUpperCase();
  }

  /** coverPhotoUrl est retourné par l'API mais absent du type généré */
  protected getCoverPhotoUrl(property: PropertyResponse): string | null {
    return (property as PropertyResponse & { coverPhotoUrl?: string }).coverPhotoUrl ?? null;
  }
}

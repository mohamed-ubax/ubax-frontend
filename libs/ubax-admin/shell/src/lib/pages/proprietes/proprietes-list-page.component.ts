import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import type { PropertyResponse } from '@ubax-workspace/shared-api-types';
import { EmptyStateComponent } from '@ubax-workspace/shared-design-system';
import {
  NOTIFICATION_HANDLER,
  resolveHttpErrorMessage,
} from '@ubax-workspace/shared-data-access';
import {
  UbaxPaginatorComponent,
  UiFormSelectComponent,
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

const TRANSACTION_COLORS: Record<string, string> = {
  SALE: '#34c759',
  RENT: '#e87d1e',
  RENT_FURNISHED: '#e87d1e',
  SHORT_STAY: '#2b7fff',
};

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Brouillon',
  PENDING: 'En attente',
  PUBLISHED: 'Publié',
  REJECTED: 'Rejeté',
  ARCHIVED: 'Archivé',
  RESERVED: 'Réservé',
  SOLD: 'Vendu',
};

const STATUS_COLORS: Record<string, string> = {
  DRAFT: '#6b7280',
  PENDING: '#f59e0b',
  PUBLISHED: '#2b7fff',
  REJECTED: '#ef4444',
  ARCHIVED: '#7c3aed',
  RESERVED: '#10b981',
  SOLD: '#111827',
};

@Component({
  selector: 'ubax-admin-proprietes-list-page',
  standalone: true,
  imports: [
    EmptyStateComponent,
    UbaxPaginatorComponent,
    UiFormSelectComponent,
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
  protected readonly currentPage = signal(1); // 1-based

  protected readonly searchQuery = signal('');
  protected readonly typeFilter = signal('');

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
    Appartement: 'APARTMENT',
    Villa: 'VILLA',
    Maison: 'HOUSE',
    Terrain: 'LAND',
    Bureau: 'OFFICE',
    Commercial: 'COMMERCIAL',
    Studio: 'STUDIO',
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
          page: this.currentPage() - 1,
          size: PAGE_SIZE,
          propertyType: this.typeFilter() || undefined,
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
    this.currentPage.set(1);
    void this.loadProperties();
  }

  protected onPageChange(page: number): void {
    this.currentPage.set(page);
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

  protected getTransactionColor(type: string | undefined): string {
    return TRANSACTION_COLORS[type ?? ''] ?? '#e87d1e';
  }

  protected getStatusLabel(
    status: PropertyResponse['status'] | undefined,
  ): string {
    return STATUS_LABELS[status ?? ''] ?? status ?? 'Inconnu';
  }

  protected getStatusColor(
    status: PropertyResponse['status'] | undefined,
  ): string {
    return STATUS_COLORS[status ?? ''] ?? '#6b7280';
  }

  protected formatPrice(
    price: number | undefined,
    transactionType?: string,
  ): string {
    if (!price) return '—';
    const formatted = new Intl.NumberFormat('fr-FR', {
      maximumFractionDigits: 0,
    }).format(price);
    const suffix = transactionType === 'SALE' ? 'FCFA' : 'FCFA/Mois';
    return `${formatted} ${suffix}`;
  }

  protected getCoverPhotoUrl(property: PropertyResponse): string | null {
    return (
      (property as PropertyResponse & { coverPhotoUrl?: string })
        .coverPhotoUrl ?? null
    );
  }

  protected getOwnerLogoUrl(property: PropertyResponse): string | null {
    const p = property as PropertyResponse & {
      agencyLogoUrl?: string;
      hotelLogoUrl?: string;
    };
    return p.agencyLogoUrl ?? p.hotelLogoUrl ?? null;
  }

  protected getDisplayCount(): string {
    const total = this.totalElements();
    const page = this.currentPage();
    const start = (page - 1) * PAGE_SIZE + 1;
    const end = Math.min(page * PAGE_SIZE, total);
    if (total === 0) return 'Aucun bien';
    return `Affichage ${start} à ${end} sur ${total} bien${total > 1 ? 's' : ''}`;
  }
}

import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import type { PropertyResponse } from '@ubax-workspace/shared-api-types';
import { EmptyStateComponent } from '@ubax-workspace/shared-design-system';
import { NOTIFICATION_HANDLER } from '@ubax-workspace/shared-data-access';
import { UbaxPaginatorComponent, UiFormSelectComponent } from '@ubax-workspace/shared-ui';
import { AdminPropertiesService } from '../../services/admin-properties.service';

export interface PropertyKpi {
  label: string;
  value: string | number;
  trend: string;
  icon: string;
  iconBg: string;
  iconColor: string;
}

const PAGE_SIZE = 12;

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
  HOTEL_ROOM: 'Chambre',
  HOTEL_SUITE: 'Suite',
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

// Options pour les selects
const CITY_OPTIONS = ['Toutes les villes', 'Dakar', 'Abidjan', 'Douala', 'Yaoundé', 'Bamako', 'Lomé', 'Cotonou', 'Ouagadougou', 'Niamey'];
const TYPE_OPTIONS = ['Tous les types', 'Appartement', 'Villa', 'Maison', 'Terrain', 'Bureau', 'Studio', 'Duplex'];
const TRANSACTION_OPTIONS = ["Tous les types d'offre", 'Vente', 'Location', 'Location meublée', 'Court séjour'];

const TYPE_VALUE_MAP: Record<string, string> = {
  'Appartement': 'APARTMENT', 'Villa': 'VILLA', 'Maison': 'HOUSE',
  'Terrain': 'LAND', 'Bureau': 'OFFICE', 'Studio': 'STUDIO', 'Duplex': 'DUPLEX',
};
const TRANSACTION_VALUE_MAP: Record<string, string> = {
  'Vente': 'SALE', 'Location': 'RENT', 'Location meublée': 'RENT_FURNISHED', 'Court séjour': 'SHORT_STAY',
};

@Component({
  selector: 'ubax-proprietes-published-list',
  standalone: true,
  imports: [
    EmptyStateComponent,
    UbaxPaginatorComponent,
    UiFormSelectComponent,
  ],
  templateUrl: './proprietes-published-list-page.component.html',
  styleUrl: './proprietes-published-list-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProprietesPublishedListPageComponent {
  readonly pageTitle = input.required<string>();
  readonly kpis = input<PropertyKpi[]>([]);
  readonly transactionTypeFilter = input<string | undefined>(undefined);

  private readonly svc = inject(AdminPropertiesService);
  private readonly notif = inject(NOTIFICATION_HANDLER);
  private readonly router = inject(Router);

  protected readonly loading = signal(false);
  protected readonly properties = signal<PropertyResponse[]>([]);
  protected readonly totalElements = signal(0);
  protected readonly totalPages = signal(1);
  protected readonly currentPage = signal(1);

  // Select values (label-based for UiFormSelectComponent)
  protected readonly searchQuery = signal('');
  protected readonly cityLabel = signal('Toutes les villes');
  protected readonly typeLabel = signal('Tous les types');
  protected readonly transactionLabel = signal("Tous les types d'offre");

  // Options
  protected readonly cityOptions = CITY_OPTIONS;
  protected readonly typeOptions = TYPE_OPTIONS;
  protected readonly transactionOptions = TRANSACTION_OPTIONS;

  protected readonly filteredProperties = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    if (!q) return this.properties();
    return this.properties().filter(
      (p) =>
        (p.title ?? '').toLowerCase().includes(q) ||
        (p.city ?? '').toLowerCase().includes(q) ||
        (p.agencyName ?? '').toLowerCase().includes(q) ||
        (p.ownerName ?? '').toLowerCase().includes(q) ||
        (p.district ?? '').toLowerCase().includes(q),
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
      const cityVal = this.cityLabel();
      const typeVal = this.typeLabel();
      const txVal = this.transactionLabel();

      const city = cityVal === 'Toutes les villes' ? undefined : cityVal;
      const propertyType = typeVal === 'Tous les types' ? undefined : TYPE_VALUE_MAP[typeVal];
      const transactionType = txVal === "Tous les types d'offre"
        ? (this.transactionTypeFilter() || undefined)
        : TRANSACTION_VALUE_MAP[txVal];

      const result = await firstValueFrom(
        this.svc.listPublished({
          page: this.currentPage() - 1,
          size: PAGE_SIZE,
          city,
          propertyType,
          transactionType,
        }),
      );
      this.properties.set(result.items);
      this.totalElements.set(result.totalElements);
      this.totalPages.set(result.totalPages);
    } catch {
      this.notif.error('Impossible de charger la liste des propriétés.');
    } finally {
      this.loading.set(false);
    }
  }

  protected onSearch(event: Event): void {
    this.searchQuery.set((event.target as HTMLInputElement).value);
  }

  protected onCityChange(value: string): void {
    this.cityLabel.set(value);
    this.currentPage.set(1);
    void this.loadProperties();
  }

  protected onTypeChange(value: string): void {
    this.typeLabel.set(value);
    this.currentPage.set(1);
    void this.loadProperties();
  }

  protected onTransactionChange(value: string): void {
    this.transactionLabel.set(value);
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
    return PROPERTY_TYPE_LABELS[type ?? ''] ?? (type ?? '—');
  }

  protected getTransactionTypeLabel(type: string | undefined): string {
    return TRANSACTION_TYPE_LABELS[type ?? ''] ?? (type ?? '—');
  }

  protected getTransactionColor(type: string | undefined): string {
    return TRANSACTION_COLORS[type ?? ''] ?? '#e87d1e';
  }

  protected formatPrice(price: number | undefined, transactionType?: string): string {
    if (!price) return '—';
    const formatted = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(price);
    const suffix = transactionType === 'SALE' ? 'FCFA' : 'FCFA/Mois';
    return `${formatted} ${suffix}`;
  }

  protected getCoverPhotoUrl(property: PropertyResponse): string | null {
    return (property as PropertyResponse & { coverPhotoUrl?: string }).coverPhotoUrl ?? null;
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

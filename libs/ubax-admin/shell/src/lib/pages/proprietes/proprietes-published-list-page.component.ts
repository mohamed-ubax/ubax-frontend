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
import {
  UbaxPaginatorComponent,
  UiFormSelectComponent,
} from '@ubax-workspace/shared-ui';
import {
  AdminPartnersService,
  type PartnerFilterOption,
} from '../../services/admin-partners.service';
import { AdminPropertiesService } from '../../services/admin-properties.service';

export interface PropertyKpi {
  label: string;
  value: string | number;
  trend: string;
  icon: string;
  iconBg: string;
  iconColor: string;
}

type AdminPropertyScope = 'agencies' | 'hotels';

interface PartnerSelectOption {
  label: string;
  id: string;
  value: string;
}

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

const DEFAULT_PARTNER_LABEL: Record<AdminPropertyScope, string> = {
  agencies: 'Toutes les agences',
  hotels: 'Tous les hôtels',
};

const KPI_TREND_BY_SCOPE: Record<AdminPropertyScope, string> = {
  agencies: 'mis a jour selon le filtre courant',
  hotels: 'mis a jour selon le filtre courant',
};

const KPI_PAGE_TREND = 'calcule sur la page courante';

function buildUniquePartnerOptions(
  partners: readonly PartnerFilterOption[],
): PartnerSelectOption[] {
  const occurrences = new Map<string, number>();

  return partners
    .filter(
      (partner): partner is { id: string; name?: string; city?: string } =>
        Boolean(partner.id),
    )
    .map((partner) => {
      const baseLabel = partner.name?.trim() || 'Sans nom';
      const nextOccurrence = (occurrences.get(baseLabel) ?? 0) + 1;

      occurrences.set(baseLabel, nextOccurrence);

      let label = baseLabel;

      if (nextOccurrence > 1) {
        if (partner.city) {
          label = `${baseLabel} · ${partner.city}`;
        } else {
          label = `${baseLabel} (${nextOccurrence})`;
        }
      }

      return {
        id: partner.id,
        label,
        value: partner.id,
      };
    });
}

function formatCount(value: number): string {
  return new Intl.NumberFormat('fr-FR').format(value);
}

function formatAveragePrice(properties: readonly PropertyResponse[]): string {
  const prices = properties
    .map((property) => property.price ?? 0)
    .filter((price) => price > 0);

  if (prices.length === 0) {
    return '—';
  }

  const average = prices.reduce((sum, price) => sum + price, 0) / prices.length;

  return `${new Intl.NumberFormat('fr-FR', {
    maximumFractionDigits: 0,
  }).format(average)} FCFA`;
}

// Options pour les selects
@Component({
  selector: 'ubax-admin-proprietes-published-list',
  standalone: true,
  imports: [EmptyStateComponent, UbaxPaginatorComponent, UiFormSelectComponent],
  templateUrl: './proprietes-published-list-page.component.html',
  styleUrl: './proprietes-published-list-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProprietesPublishedListPageComponent {
  readonly pageTitle = input.required<string>();
  readonly scope = input.required<AdminPropertyScope>();

  private readonly svc = inject(AdminPropertiesService);
  private readonly partnersSvc = inject(AdminPartnersService);
  private readonly notif = inject(NOTIFICATION_HANDLER);
  private readonly router = inject(Router);

  protected readonly loading = signal(false);
  protected readonly properties = signal<PropertyResponse[]>([]);
  protected readonly totalElements = signal(0);
  protected readonly totalPages = signal(1);
  protected readonly currentPage = signal(1);

  protected readonly eyebrowLabel = computed(() =>
    this.scope() === 'agencies' ? 'Biens agences' : 'Biens hôteliers',
  );

  protected readonly searchQuery = signal('');
  protected readonly partnerLabel = signal('');
  protected readonly partnerIdFilter = signal<string | undefined>(undefined);
  protected readonly partnerOptions = signal<readonly string[]>([]);

  private readonly partnerSelectOptions = signal<
    readonly PartnerSelectOption[]
  >([]);
  private partnerOptionsRequestId = 0;

  protected readonly kpis = computed<PropertyKpi[]>(() => {
    const scope = this.scope();
    const properties = this.properties();
    const totalProperties = this.totalElements();
    const totalPartners = this.partnerIdFilter()
      ? 1
      : this.partnerSelectOptions().length;
    const averagePrice = formatAveragePrice(properties);

    if (scope === 'agencies') {
      const saleCount = properties.filter(
        (property) => property.transactionType === 'SALE',
      ).length;
      const rentCount = properties.filter(
        (property) =>
          property.transactionType === 'RENT' ||
          property.transactionType === 'RENT_FURNISHED',
      ).length;

      return [
        {
          label: 'Total Agences',
          value: formatCount(totalPartners),
          trend: KPI_TREND_BY_SCOPE.agencies,
          icon: 'pi pi-building',
          iconBg: 'rgba(43, 127, 255, 0.12)',
          iconColor: '#2b7fff',
        },
        {
          label: 'Biens publiés',
          value: formatCount(totalProperties),
          trend: KPI_TREND_BY_SCOPE.agencies,
          icon: 'pi pi-home',
          iconBg: 'rgba(232, 125, 30, 0.12)',
          iconColor: '#e87d1e',
        },
        {
          label: 'Propriétés à vendre',
          value: formatCount(saleCount),
          trend: KPI_PAGE_TREND,
          icon: 'pi pi-tag',
          iconBg: 'rgba(52, 199, 89, 0.12)',
          iconColor: '#34c759',
        },
        {
          label: 'Propriétés à louer',
          value: formatCount(rentCount),
          trend: KPI_PAGE_TREND,
          icon: 'pi pi-key',
          iconBg: 'rgba(232, 125, 30, 0.12)',
          iconColor: '#e87d1e',
        },
        {
          label: 'Prix moyen',
          value: averagePrice,
          trend: KPI_PAGE_TREND,
          icon: 'pi pi-chart-line',
          iconBg: 'rgba(43, 127, 255, 0.12)',
          iconColor: '#2b7fff',
        },
      ];
    }

    const roomCount = properties.filter(
      (property) => property.propertyType === 'HOTEL_ROOM',
    ).length;
    const suiteCount = properties.filter(
      (property) => property.propertyType === 'HOTEL_SUITE',
    ).length;
    const shortStayCount = properties.filter(
      (property) => property.transactionType === 'SHORT_STAY',
    ).length;

    return [
      {
        label: 'Total Hôtels',
        value: formatCount(totalPartners),
        trend: KPI_TREND_BY_SCOPE.hotels,
        icon: 'pi pi-building',
        iconBg: 'rgba(43, 127, 255, 0.12)',
        iconColor: '#2b7fff',
      },
      {
        label: 'Chambres publiées',
        value: formatCount(totalProperties),
        trend: KPI_TREND_BY_SCOPE.hotels,
        icon: 'pi pi-th-large',
        iconBg: 'rgba(232, 125, 30, 0.12)',
        iconColor: '#e87d1e',
      },
      {
        label: 'Chambres standards',
        value: formatCount(roomCount),
        trend: KPI_PAGE_TREND,
        icon: 'pi pi-home',
        iconBg: 'rgba(52, 199, 89, 0.12)',
        iconColor: '#34c759',
      },
      {
        label: 'Suites',
        value: formatCount(suiteCount),
        trend: KPI_PAGE_TREND,
        icon: 'pi pi-star',
        iconBg: 'rgba(43, 127, 255, 0.12)',
        iconColor: '#2b7fff',
      },
      {
        label: 'Court séjour',
        value: formatCount(shortStayCount),
        trend: KPI_PAGE_TREND,
        icon: 'pi pi-calendar',
        iconBg: 'rgba(232, 125, 30, 0.12)',
        iconColor: '#e87d1e',
      },
    ];
  });

  protected readonly filteredProperties = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    if (!q) return this.properties();
    return this.properties().filter(
      (p) =>
        (p.title ?? '').toLowerCase().includes(q) ||
        (p.city ?? '').toLowerCase().includes(q) ||
        (p.agencyName ?? '').toLowerCase().includes(q) ||
        (p.hotelName ?? '').toLowerCase().includes(q) ||
        (p.ownerName ?? '').toLowerCase().includes(q) ||
        (p.district ?? '').toLowerCase().includes(q),
    );
  });

  constructor() {
    effect(() => {
      const scope = this.scope();
      const defaultLabel = DEFAULT_PARTNER_LABEL[scope];

      this.partnerLabel.set(defaultLabel);
      this.partnerIdFilter.set(undefined);
      this.partnerSelectOptions.set([]);
      this.partnerOptions.set([defaultLabel]);
      this.currentPage.set(1);

      void this.loadPartnerOptions(scope);
    });

    effect(() => {
      const scope = this.scope();
      const page = this.currentPage() - 1;
      const partnerId = this.partnerIdFilter();

      void this.loadProperties({ scope, page, partnerId });
    });
  }

  private async loadProperties(params: {
    scope: AdminPropertyScope;
    page: number;
    partnerId: string | undefined;
  }): Promise<void> {
    this.loading.set(true);
    try {
      const request =
        params.scope === 'agencies'
          ? this.svc.listAdminAgencyProperties({
              page: params.page,
              size: PAGE_SIZE,
              status: 'PUBLISHED',
              agencyId: params.partnerId,
            })
          : this.svc.listAdminHotelProperties({
              page: params.page,
              size: PAGE_SIZE,
              status: 'PUBLISHED',
              hotelId: params.partnerId,
            });

      const result = await firstValueFrom(request);

      this.properties.set(result.items);
      this.totalElements.set(result.totalElements);
      this.totalPages.set(result.totalPages);
    } catch {
      this.notif.error(
        params.scope === 'agencies'
          ? 'Impossible de charger la liste des biens des agences.'
          : 'Impossible de charger la liste des biens des hôtels.',
      );
    } finally {
      this.loading.set(false);
    }
  }

  private async loadPartnerOptions(scope: AdminPropertyScope): Promise<void> {
    const requestId = ++this.partnerOptionsRequestId;
    const defaultOption: PartnerSelectOption = {
      id: '',
      label: DEFAULT_PARTNER_LABEL[scope],
      value: '',
    };

    try {
      const partners =
        scope === 'agencies'
          ? await firstValueFrom(this.partnersSvc.listAgencyFilterOptions())
          : await firstValueFrom(this.partnersSvc.listHotelFilterOptions());

      if (requestId !== this.partnerOptionsRequestId) {
        return;
      }

      const options = buildUniquePartnerOptions(partners);

      this.partnerSelectOptions.set(options);
      this.partnerOptions.set([
        defaultOption.label,
        ...options.map((option) => option.label),
      ]);
    } catch {
      if (requestId !== this.partnerOptionsRequestId) {
        return;
      }

      this.partnerSelectOptions.set([]);
      this.partnerOptions.set([defaultOption.label]);
      this.notif.error(
        scope === 'agencies'
          ? 'Impossible de charger les agences pour le filtre.'
          : 'Impossible de charger les hôtels pour le filtre.',
      );
    }
  }

  protected onSearch(event: Event): void {
    this.searchQuery.set((event.target as HTMLInputElement).value);
  }

  protected onPartnerChange(value: string): void {
    const defaultLabel = DEFAULT_PARTNER_LABEL[this.scope()];
    const selectedPartner = this.partnerSelectOptions().find(
      (option) => option.label === value,
    );

    this.partnerLabel.set(value);
    this.partnerIdFilter.set(
      value === defaultLabel ? undefined : selectedPartner?.id,
    );
    this.currentPage.set(1);
  }

  protected onPageChange(page: number): void {
    this.currentPage.set(page);
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

  protected getDisplayCount(): string {
    const total = this.totalElements();
    const page = this.currentPage();
    const start = (page - 1) * PAGE_SIZE + 1;
    const end = Math.min(page * PAGE_SIZE, total);
    if (total === 0) return 'Aucun bien';
    return `Affichage ${start} à ${end} sur ${total} bien${total > 1 ? 's' : ''}`;
  }
}

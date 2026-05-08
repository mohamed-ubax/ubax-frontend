import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  computed,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { MesBiensStore } from '@ubax-workspace/ubax-web-data-access';
import {
  LaCodeListDto,
  ListMine$Params,
  PropertyResponse,
} from '@ubax-workspace/shared-api-types';
import {
  UbaxMorphTabsDirective,
  UbaxPaginatorComponent,
  deriveViewState,
  type ViewState,
} from '@ubax-workspace/shared-ui';
import {
  NOTIFICATION_HANDLER,
  NotificationHandler,
} from '@ubax-workspace/shared-data-access';
import { BiensListSkeletonComponent } from './biens-list-skeleton/biens-list-skeleton.component';

type BienViewMode = 'grid' | 'list';
type FilterDropdownKey = 'type' | 'category' | 'status';

type BienSummaryCard = {
  readonly label: string;
  readonly value: string;
  readonly trend?: string;
  readonly orbKey: string;
  readonly iconKey: string;
  readonly iconAlt: string;
};

type FilterOption = {
  readonly label: string;
  readonly value: string;
  readonly tone: 'neutral' | 'accent' | 'success' | 'warning';
};

type GridBienCard = {
  readonly id: string;
  readonly title: string;
  readonly location: string;
  readonly tenant: string;
  readonly tenantRole: string;
  readonly price: string;
  readonly image: string;
  readonly avatar: string;
  readonly type: string;
  readonly category: string;
  readonly statusRaw: PropertyMineStatus;
  readonly status: string;
  readonly boosted: boolean;
  readonly rejectionReason: string | null;
};

type ListBienCard = {
  readonly id: string;
  readonly title: string;
  readonly location: string;
  readonly tenant: string;
  readonly tenantRole: string;
  readonly price: string;
  readonly image: string;
  readonly avatar: string;
  readonly type: string;
  readonly category: string;
  readonly statusRaw: PropertyMineStatus;
  readonly status: string;
  readonly boosted: boolean;
  readonly rejectionReason: string | null;
};

type PropertyMineStatus = NonNullable<ListMine$Params['status']>;

const DEFAULT_TYPE_OPTIONS: readonly FilterOption[] = [
  { label: 'Type de bien', value: 'all', tone: 'neutral' },
  { label: 'Appartement', value: 'APARTMENT', tone: 'accent' },
  { label: 'Villa', value: 'VILLA', tone: 'accent' },
  { label: 'Bureau', value: 'OFFICE', tone: 'accent' },
];

const DEFAULT_CATEGORY_OPTIONS: readonly FilterOption[] = [
  { label: 'Catégorie', value: 'all', tone: 'neutral' },
  { label: 'Location', value: 'RENT', tone: 'success' },
  { label: 'Vente', value: 'SALE', tone: 'warning' },
];

const DEFAULT_STATUS_OPTIONS: readonly FilterOption[] = [
  { label: 'Statut', value: 'all', tone: 'neutral' },
  { label: 'Brouillon', value: 'DRAFT', tone: 'neutral' },
  { label: 'En attente', value: 'PENDING', tone: 'warning' },
  { label: 'Publié', value: 'PUBLISHED', tone: 'success' },
  { label: 'Rejeté', value: 'REJECTED', tone: 'accent' },
  { label: 'Archivé', value: 'ARCHIVED', tone: 'neutral' },
];

const IMAGE_POOL = [
  'shared/rooms/room-photo-01.webp',
  'biens/list/grid-property-02.webp',
  'hotel-dashboard/properties/property-kevin.webp',
  'biens/list/grid-property-04.webp',
  'biens/list/grid-property-05.webp',
  'biens/list/grid-property-06.webp',
  'biens/list/list-property-02.webp',
  'biens/list/list-property-06.webp',
  'biens/list/list-property-07.webp',
];

const AVATAR_POOL = [
  'hotel-dashboard/properties/tenant-aicha.webp',
  'hotel-dashboard/properties/tenant-armand.webp',
  'hotel-dashboard/properties/tenant-kevin.webp',
  'biens/list/grid-tenant-04.webp',
  'biens/list/grid-tenant-05.webp',
  'biens/list/grid-tenant-06.webp',
  'biens/list/list-tenant-01.webp',
];

const STATUS_LABEL_MAP: Record<PropertyMineStatus, string> = {
  DRAFT: 'Brouillon',
  PENDING: 'En attente',
  PUBLISHED: 'Publié',
  RESERVED: 'Réservé',
  SOLD: 'Vendu',
  ARCHIVED: 'Archivé',
  REJECTED: 'Rejeté',
};

const TRANSACTION_LABEL_MAP: Record<string, string> = {
  RENT: 'Location',
  SALE: 'Vente',
  RENT_FURNISHED: 'Location meublée',
  SHORT_STAY: 'Court séjour',
};

const TRANSACTION_TONE_MAP: Record<string, FilterOption['tone']> = {
  RENT: 'success',
  SALE: 'warning',
  RENT_FURNISHED: 'success',
  SHORT_STAY: 'accent',
};

const STATUS_TONE_MAP: Record<string, FilterOption['tone']> = {
  DRAFT: 'neutral',
  PENDING: 'warning',
  PUBLISHED: 'success',
  RESERVED: 'success',
  SOLD: 'accent',
  ARCHIVED: 'neutral',
  REJECTED: 'accent',
};

function capitalizeWords(value: string): string {
  return value
    .toLowerCase()
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function codeListLabel(item: LaCodeListDto): string {
  if (item.description && item.description.trim().length > 0) {
    return item.description;
  }

  if (item.value && item.value.trim().length > 0) {
    return capitalizeWords(item.value);
  }

  return '';
}

function formatPrice(price?: number): string {
  if (typeof price !== 'number' || Number.isNaN(price)) {
    return 'N/A';
  }

  return `${new Intl.NumberFormat('fr-FR').format(price)} FCFA`;
}

function toDisplayLocation(property: PropertyResponse): string {
  const parts = [property.city, property.district].filter(
    (part): part is string =>
      typeof part === 'string' && part.trim().length > 0,
  );

  return parts.length > 0 ? parts.join(', ') : 'Ville non renseignée';
}

function asPropertyStatus(value: string): PropertyMineStatus | undefined {
  if (
    value === 'DRAFT' ||
    value === 'PENDING' ||
    value === 'PUBLISHED' ||
    value === 'RESERVED' ||
    value === 'SOLD' ||
    value === 'ARCHIVED' ||
    value === 'REJECTED'
  ) {
    return value;
  }

  return undefined;
}

@Component({
  selector: 'ubax-biens-list-page',
  standalone: true,
  imports: [RouterLink, UbaxMorphTabsDirective, UbaxPaginatorComponent, BiensListSkeletonComponent],
  templateUrl: './biens-list-page.component.html',
  styleUrl: './biens-list-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BiensListPageComponent {
  private readonly store = inject(MesBiensStore);
  private readonly document = inject(DOCUMENT);
  private readonly notifications = inject(NOTIFICATION_HANDLER, {
    optional: true,
  }) as NotificationHandler | null;

  protected readonly viewMode = signal<BienViewMode>('grid');
  protected readonly currentPage = signal(1);
  protected readonly openDropdown = signal<FilterDropdownKey | null>(null);
  protected readonly selectedType = signal('all');
  protected readonly selectedCategory = signal('all');
  protected readonly selectedStatus = signal('all');
  protected readonly archiveDialogTarget = signal<{
    id: string;
    title: string;
    statusRaw: PropertyMineStatus;
  } | null>(null);

  private readonly archivePendingId = signal<string | null>(null);
  private readonly archivePendingTitle = signal('');

  // ── ViewState pattern ────────────────────────────────────────────────────
  private readonly hasLoaded = signal(false);
  readonly isLeavingSkeleton = signal(false);
  readonly contentEntering = signal(false);

  readonly viewState = computed<ViewState>(() =>
    deriveViewState(
      this.store.loading(),
      this.store.error(),
      this.store.entities().length === 0,
      this.hasLoaded(),
    ),
  );
  // ────────────────────────────────────────────────────────────────────────

  protected readonly pageSize = computed(() =>
    this.viewMode() === 'grid' ? 12 : 8,
  );

  protected readonly summaryCards = computed<readonly BienSummaryCard[]>(() => {
    const overview = this.store.overview();

    return [
      {
        label: 'Tous les biens',
        value: String(overview.total),
        trend: undefined,
        orbKey: 'tous',
        iconKey: 'tous',
        iconAlt: 'Tous les biens',
      },
      {
        label: 'Annonces actives',
        value: String(overview.active),
        orbKey: 'annonces',
        iconKey: 'annonces',
        iconAlt: 'Annonces actives',
      },
      {
        label: 'Biens Loués',
        value: String(overview.rented),
        orbKey: 'loues',
        iconKey: 'loues',
        iconAlt: 'Biens loués',
      },
      {
        label: 'Biens Vendus',
        value: String(overview.sold),
        orbKey: 'vendus',
        iconKey: 'vendus',
        iconAlt: 'Biens vendus',
      },
    ];
  });

  protected readonly typeOptions = computed<readonly FilterOption[]>(() => {
    const codeList = this.store.codeListPropertyTypes();
    if (codeList.length === 0) {
      return DEFAULT_TYPE_OPTIONS;
    }

    return [
      { label: 'Type de bien', value: 'all', tone: 'neutral' },
      ...codeList
        .filter(
          (item) =>
            typeof item.value === 'string' && item.value.trim().length > 0,
        )
        .map((item) => ({
          label: codeListLabel(item),
          value: item.value as string,
          tone: 'accent' as const,
        })),
    ];
  });

  protected readonly categoryOptions = computed<readonly FilterOption[]>(() => {
    const codeList = this.store.codeListTransactionTypes();
    if (codeList.length === 0) {
      return DEFAULT_CATEGORY_OPTIONS;
    }

    return [
      { label: 'Catégorie', value: 'all', tone: 'neutral' },
      ...codeList
        .filter(
          (item) =>
            typeof item.value === 'string' && item.value.trim().length > 0,
        )
        .map((item) => {
          const value = item.value as string;
          const label = TRANSACTION_LABEL_MAP[value] ?? codeListLabel(item);
          return {
            label,
            value,
            tone: TRANSACTION_TONE_MAP[value] ?? 'accent',
          };
        }),
    ];
  });

  protected readonly statusOptions = computed<readonly FilterOption[]>(() => {
    const codeList = this.store.codeListPropertyStatuses();
    if (codeList.length === 0) {
      return DEFAULT_STATUS_OPTIONS;
    }

    return [
      { label: 'Statut', value: 'all', tone: 'neutral' },
      ...codeList
        .filter(
          (item) =>
            typeof item.value === 'string' && item.value.trim().length > 0,
        )
        .map((item) => {
          const value = item.value as string;
          const status = asPropertyStatus(value);
          const label =
            (status ? STATUS_LABEL_MAP[status] : undefined) ??
            codeListLabel(item);

          return {
            label,
            value,
            tone: STATUS_TONE_MAP[value] ?? 'neutral',
          };
        }),
    ];
  });

  protected readonly selectedTypeLabel = computed(() =>
    this.getOptionLabel(this.typeOptions(), this.selectedType()),
  );

  protected readonly selectedCategoryLabel = computed(() =>
    this.getOptionLabel(this.categoryOptions(), this.selectedCategory()),
  );

  protected readonly selectedStatusLabel = computed(() =>
    this.getOptionLabel(this.statusOptions(), this.selectedStatus()),
  );

  private readonly filteredProperties = computed(() => {
    const selectedType = this.selectedType();
    const selectedCategory = this.selectedCategory();
    const selectedStatus = this.selectedStatus();

    return this.store.entities().filter((property) => {
      const typeMatch =
        selectedType === 'all' || property.propertyType === selectedType;
      const categoryMatch =
        selectedCategory === 'all' ||
        property.transactionType === selectedCategory;
      const statusMatch =
        selectedStatus === 'all' || property.status === selectedStatus;

      return typeMatch && categoryMatch && statusMatch;
    });
  });

  protected readonly filteredGridCards = computed<readonly GridBienCard[]>(() =>
    this.filteredProperties().map((property, index) =>
      this.toCard(property, index),
    ),
  );

  protected readonly filteredListCards = computed<readonly ListBienCard[]>(() =>
    this.filteredProperties().map((property, index) =>
      this.toCard(property, index),
    ),
  );

  protected readonly totalPages = computed(() => {
    return Math.max(1, this.store.pagination()?.totalPages ?? 1);
  });

  protected readonly isLoading = computed(() => this.store.loading());

  protected readonly hasActiveFilters = computed(
    () =>
      this.selectedType() !== 'all' ||
      this.selectedCategory() !== 'all' ||
      this.selectedStatus() !== 'all',
  );

  protected readonly hasVisibleCards = computed(() => {
    const cards =
      this.viewMode() === 'grid'
        ? this.visibleGridCards().length
        : this.visibleListCards().length;

    return cards > 0;
  });

  protected readonly showEmptyState = computed(
    () => !this.isLoading() && !this.hasVisibleCards(),
  );

  protected readonly visibleGridCards = this.filteredGridCards;

  protected readonly visibleListCards = this.filteredListCards;

  protected readonly archiveDialogTitle = computed(
    () => this.archiveDialogTarget()?.title ?? 'ce bien',
  );

  private readonly loadParams = computed<ListMine$Params>(() => {
    const page = this.currentPage();
    const size = this.pageSize();
    const sel = this.selectedStatus();
    const status = sel === 'all' ? undefined : asPropertyStatus(sel);
    return {
      pageable: { page: Math.max(0, page - 1), size, sort: ['createdAt,desc'] },
      ...(status === undefined ? {} : { status }),
    };
  });

  constructor() {
    this.store.loadCodeLists();
    this.store.loadOverview();

    this.store.load?.(toObservable(this.loadParams).pipe(takeUntilDestroyed()));

    // ── ViewState effect ─────────────────────────────────────────────────
    let wasLoading = false;
    let hadEntitiesWhenLoadingStarted = false;

    effect(() => {
      const loading = this.store.loading();
      const hasEntities = this.store.entities().length > 0;
      const hasError = this.store.error() !== null;

      if (loading) {
        wasLoading = true;
        if (!hadEntitiesWhenLoadingStarted) {
          hadEntitiesWhenLoadingStarted = hasEntities;
        }
        // Navigation retour : données déjà là → afficher immédiatement
        if (hasEntities && !this.hasLoaded()) {
          this.hasLoaded.set(true);
          this.triggerContentEnter();
        }
        return;
      }

      if (this.hasLoaded()) return;

      if (wasLoading) {
        if (!hadEntitiesWhenLoadingStarted) {
          // Premier chargement réseau : fade-out skeleton → fade-in contenu
          this.isLeavingSkeleton.set(true);
          setTimeout(() => {
            this.hasLoaded.set(true);
            this.isLeavingSkeleton.set(false);
            this.triggerContentEnter();
          }, 320);
        }
      } else if (hasEntities || hasError) {
        // Cache hit immédiat
        this.hasLoaded.set(true);
        this.triggerContentEnter();
      }
    });
    // ────────────────────────────────────────────────────────────────────

    effect(() => {
      const totalPages = this.totalPages();
      const page = this.currentPage();

      if (page > totalPages) {
        untracked(() => this.currentPage.set(totalPages));
      }
    });

    effect(() => {
      const archivedId = this.store.lastArchivedPropertyId();
      const pendingId = this.archivePendingId();

      if (!archivedId || archivedId !== pendingId) {
        return;
      }

      const pendingTitle = this.archivePendingTitle();
      this.notifications?.success(`Le bien "${pendingTitle}" a été archivé.`);
      this.store.loadOverview();
      this.store.clearArchiveFeedback();
      this.archivePendingId.set(null);
      this.archivePendingTitle.set('');
      this.archiveDialogTarget.set(null);
    });

    effect(() => {
      const archiveError = this.store.archiveError();
      const pendingId = this.archivePendingId();

      if (!archiveError || !pendingId) {
        return;
      }

      this.notifications?.error(
        "Impossible d'archiver ce bien pour le moment. Veuillez réessayer.",
      );
      this.store.clearArchiveFeedback();
      this.archivePendingId.set(null);
      this.archivePendingTitle.set('');
    });

    effect((onCleanup) => {
      const hasArchiveOverlay = this.archiveDialogTarget() !== null;
      this.document.body.classList.toggle(
        'ubax-overlay-open',
        hasArchiveOverlay,
      );

      onCleanup(() => {
        if (hasArchiveOverlay) {
          this.document.body.classList.remove('ubax-overlay-open');
        }
      });
    });
  }

  private triggerContentEnter(): void {
    this.contentEntering.set(false);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        this.contentEntering.set(true);
      });
    });
  }

  retryLoad(): void {
    this.hasLoaded.set(false);
    this.contentEntering.set(false);
    this.store.load?.(toObservable(this.loadParams).pipe(takeUntilDestroyed()));
  }

  protected setViewMode(mode: BienViewMode): void {
    if (this.viewMode() === mode) {
      return;
    }
    this.viewMode.set(mode);
    this.currentPage.set(1);
  }

  protected toggleDropdown(dropdown: FilterDropdownKey): void {
    this.openDropdown.update((current) =>
      current === dropdown ? null : dropdown,
    );
  }

  protected selectTypeOption(value: string): void {
    this.selectedType.set(value);
    this.currentPage.set(1);
    this.openDropdown.set(null);
  }

  protected selectCategoryOption(value: string): void {
    this.selectedCategory.set(value);
    this.currentPage.set(1);
    this.openDropdown.set(null);
  }

  protected selectStatusOption(value: string): void {
    this.selectedStatus.set(value);
    this.currentPage.set(1);
    this.openDropdown.set(null);
  }

  protected resetFilters(): void {
    this.selectedType.set('all');
    this.selectedCategory.set('all');
    this.selectedStatus.set('all');
    this.currentPage.set(1);
    this.openDropdown.set(null);
  }

  protected openArchiveDialog(card: {
    id: string;
    title: string;
    statusRaw: PropertyMineStatus;
  }): void {
    if (card.statusRaw === 'ARCHIVED' || this.isArchiving(card.id)) {
      return;
    }

    this.archiveDialogTarget.set(card);
  }

  protected closeArchiveDialog(): void {
    if (this.archivePendingId()) {
      return;
    }

    this.archiveDialogTarget.set(null);
  }

  protected confirmArchive(): void {
    const target = this.archiveDialogTarget();
    if (!target || this.isArchiving(target.id)) {
      return;
    }

    this.archivePendingId.set(target.id);
    this.archivePendingTitle.set(target.title);
    this.store.archiveProperty({ id: target.id });
  }

  protected isArchiving(id: string): boolean {
    return this.store.archivingPropertyIds().includes(id);
  }

  protected canArchive(statusRaw: PropertyMineStatus, id: string): boolean {
    return statusRaw !== 'ARCHIVED' && !this.isArchiving(id);
  }

  @HostListener('document:click', ['$event'])
  handleDocumentClick(event: MouseEvent): void {
    const target = event.target;
    if (target instanceof HTMLElement && target.closest('.filter-dropdown')) {
      return;
    }
    this.openDropdown.set(null);
  }

  @HostListener('document:keydown.escape')
  handleEscapeKey(): void {
    this.openDropdown.set(null);
  }

  private getOptionLabel(
    options: readonly FilterOption[],
    value: string,
  ): string {
    return options.find((o) => o.value === value)?.label ?? options[0].label;
  }

  private toCard(
    property: PropertyResponse,
    index: number,
  ): GridBienCard & ListBienCard {
    const status = (property.status ?? 'DRAFT') as PropertyMineStatus;
    const transactionValue = property.transactionType ?? '';
    const transactionLabel =
      TRANSACTION_LABEL_MAP[transactionValue] ||
      capitalizeWords(transactionValue || 'TRANSACTION');

    return {
      id: property.id ?? `property-${index + 1}`,
      title: property.title?.trim() || 'Bien sans titre',
      location: toDisplayLocation(property),
      tenant: property.ownerName?.trim() || 'Propriétaire non renseigné',
      tenantRole: 'Propriétaire',
      price: formatPrice(property.price),
      image: IMAGE_POOL[index % IMAGE_POOL.length],
      avatar: AVATAR_POOL[index % AVATAR_POOL.length],
      type: property.propertyType || 'N/A',
      category: transactionLabel,
      statusRaw: status,
      status: STATUS_LABEL_MAP[status] ?? status,
      boosted: Boolean(property.boosted),
      rejectionReason: property.rejectionReason?.trim() || null,
    };
  }
}

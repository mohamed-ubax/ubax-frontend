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
import { RouterLink } from '@angular/router';
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
import {
  MesEspacesStore,
  EspaceStatus,
  ESPACE_STATUS_LABELS,
  resolvePropertyCardImage,
} from '@ubax-workspace/ubax-web-data-access';
import {
  LaCodeListDto,
  PropertyResponse,
} from '@ubax-workspace/shared-api-types';
import { EspacesListSkeletonComponent } from './espaces-list-skeleton/espaces-list-skeleton.component';
import { EspacesCardsSkeletonComponent } from './espaces-cards-skeleton/espaces-cards-skeleton.component';

type RoomViewMode = 'grid' | 'list';
type FilterDropdownKey = 'type' | 'status';

type FilterOption = {
  readonly label: string;
  readonly value: string;
  readonly tone: 'neutral' | 'accent' | 'success' | 'warning';
};

type EspaceCard = {
  readonly id: string;
  readonly title: string;
  readonly image: string;
  readonly city: string;
  readonly typeLabel: string;
  readonly typeRaw: string;
  readonly statusRaw: EspaceStatus;
  readonly statusLabel: string;
  readonly price: string;
  readonly boosted: boolean;
  readonly rejectionReason: string | null;
  readonly createdAt: string | null;
  readonly canEdit: boolean;
  readonly canSubmit: boolean;
  readonly canArchive: boolean;
};

const PAGE_SIZE_GRID = 12;
const PAGE_SIZE_LIST = 10;
const DEFAULT_ESPACE_IMAGE = 'shared/rooms/room-photo-01.webp';

const STATUS_TONE_MAP: Record<EspaceStatus, FilterOption['tone']> = {
  DRAFT: 'neutral',
  PENDING: 'warning',
  PUBLISHED: 'success',
  RESERVED: 'accent',
  SOLD: 'accent',
  ARCHIVED: 'neutral',
  REJECTED: 'accent',
};

function formatPrice(price: number | null | undefined): string {
  if (price == null) return '—';
  return new Intl.NumberFormat('fr-FR').format(price);
}

function readCodeListValue(item: LaCodeListDto): string {
  return item.value ?? '';
}

function readCodeListLabel(item: LaCodeListDto): string {
  return item.description ?? item.value ?? '';
}

function mapToEspaceCard(
  property: PropertyResponse,
  index: number,
  propertyTypeLabels: ReadonlyMap<string, string>,
): EspaceCard {
  const statusRaw = (property.status ?? 'DRAFT') as EspaceStatus;
  const typeRaw = property.propertyType ?? '';
  const typeLabel = propertyTypeLabels.get(typeRaw) ?? typeRaw;

  return {
    id: property.id ?? `espace-${index}`,
    title: property.title?.trim() || 'Espace sans titre',
    image: resolvePropertyCardImage(property, DEFAULT_ESPACE_IMAGE),
    city: property.city ?? '—',
    typeLabel,
    typeRaw,
    statusRaw,
    statusLabel: ESPACE_STATUS_LABELS[statusRaw] ?? statusRaw,
    price: formatPrice(property.price),
    boosted: Boolean(property.boosted),
    rejectionReason: property.rejectionReason?.trim() || null,
    createdAt: property.createdAt ?? null,
    canEdit: statusRaw === 'DRAFT' || statusRaw === 'REJECTED',
    canSubmit: statusRaw === 'DRAFT',
    canArchive: statusRaw === 'PUBLISHED' || statusRaw === 'DRAFT',
  };
}

@Component({
  selector: 'ubax-espaces-list-page',
  standalone: true,
  imports: [
    RouterLink,
    UbaxMorphTabsDirective,
    UbaxPaginatorComponent,
    EspacesListSkeletonComponent,
    EspacesCardsSkeletonComponent,
  ],
  templateUrl: './espaces-list-page.component.html',
  styleUrls: ['./espaces-list-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EspacesListPageComponent {
  private readonly store = inject(MesEspacesStore);
  private readonly document = inject(DOCUMENT);
  private readonly notifications = inject(NOTIFICATION_HANDLER, {
    optional: true,
  }) as NotificationHandler | null;

  // ── UI state ──────────────────────────────────────────────────────────────
  protected readonly viewMode = signal<RoomViewMode>('grid');
  protected readonly currentPage = signal(1);
  protected readonly openDropdown = signal<FilterDropdownKey | null>(null);
  protected readonly selectedType = signal('all');
  protected readonly selectedStatus = signal('all');

  protected readonly archiveDialogTarget = signal<{
    id: string;
    title: string;
    statusRaw: EspaceStatus;
  } | null>(null);
  protected readonly archiveDialogClosing = signal(false);
  private readonly archivePendingId = signal<string | null>(null);
  private readonly archivePendingTitle = signal('');

  protected readonly submitDialogTarget = signal<{
    id: string;
    title: string;
  } | null>(null);

  // ── ViewState pattern ─────────────────────────────────────────────────────
  private readonly hasLoaded = signal(false);
  readonly isLeavingSkeleton = signal(false);
  readonly contentEntering = signal(false);
  /**
   * true pendant un rechargement (filtre, pagination) une fois le premier
   * chargement terminé. Seule la zone cards est remplacée par un skeleton.
   */
  readonly isReloading = signal(false);

  readonly viewState = computed<ViewState>(() =>
    deriveViewState(
      this.store.loading() && !this.isReloading(),
      this.store.error(),
      this.store.entities().length === 0,
      this.hasLoaded(),
    ),
  );
  // ─────────────────────────────────────────────────────────────────────────

  // ── Filter options ────────────────────────────────────────────────────────
  readonly typeOptions = computed<readonly FilterOption[]>(() => {
    const usedTypeValues = new Set(
      this.store
        .entities()
        .map((entity) => entity.propertyType ?? '')
        .filter((value) => value.length > 0),
    );

    const options: FilterOption[] = [];

    this.store.codeListPropertyTypes().forEach((item) => {
      const value = readCodeListValue(item);
      if (!value || (usedTypeValues.size > 0 && !usedTypeValues.has(value))) {
        return;
      }

      options.push({
        label: readCodeListLabel(item),
        value,
        tone: 'accent' as const,
      });
    });

    return [
      { label: "Type d'espace", value: 'all', tone: 'neutral' },
      ...options,
    ];
  });

  readonly statusOptions: readonly FilterOption[] = [
    { label: 'Statut', value: 'all', tone: 'neutral' },
    { label: 'Brouillon', value: 'DRAFT', tone: 'neutral' },
    { label: 'En attente', value: 'PENDING', tone: 'warning' },
    { label: 'Publié', value: 'PUBLISHED', tone: 'success' },
    { label: 'Rejeté', value: 'REJECTED', tone: 'accent' },
    { label: 'Archivé', value: 'ARCHIVED', tone: 'neutral' },
  ];

  // ── Computed ──────────────────────────────────────────────────────────────
  protected readonly pageSize = computed(() =>
    this.viewMode() === 'grid' ? PAGE_SIZE_GRID : PAGE_SIZE_LIST,
  );

  protected readonly selectedTypeLabel = computed(() =>
    this.getOptionLabel(this.typeOptions(), this.selectedType()),
  );

  protected readonly selectedStatusLabel = computed(() =>
    this.getOptionLabel(this.statusOptions, this.selectedStatus()),
  );

  private readonly propertyTypeLabels = computed(
    () =>
      new Map(
        this.store
          .codeListPropertyTypes()
          .map((item) => [readCodeListValue(item), readCodeListLabel(item)]),
      ),
  );

  private readonly filteredCards = computed(() => {
    const type = this.selectedType();
    const status = this.selectedStatus();
    const propertyTypeLabels = this.propertyTypeLabels();

    return this.store
      .entities()
      .map((p, i) => mapToEspaceCard(p, i, propertyTypeLabels))
      .filter((card) => {
        const matchesType = type === 'all' || card.typeRaw === type;
        const matchesStatus = status === 'all' || card.statusRaw === status;
        return matchesType && matchesStatus;
      });
  });

  protected readonly visibleCards = computed(() => this.filteredCards());

  protected readonly totalPages = computed(() =>
    Math.max(1, this.store.pagination()?.totalPages ?? 1),
  );

  protected readonly hasActiveFilters = computed(
    () => this.selectedType() !== 'all' || this.selectedStatus() !== 'all',
  );

  protected readonly showEmptyState = computed(
    () =>
      !this.store.loading() &&
      !this.isReloading() &&
      this.filteredCards().length === 0,
  );

  // ── Summary stats ─────────────────────────────────────────────────────────
  protected readonly totalEspaces = computed(
    () => this.store.entities().length,
  );
  protected readonly publishedCount = computed(
    () => this.store.entities().filter((e) => e.status === 'PUBLISHED').length,
  );
  protected readonly pendingCount = computed(
    () => this.store.entities().filter((e) => e.status === 'PENDING').length,
  );
  protected readonly draftCount = computed(
    () => this.store.entities().filter((e) => e.status === 'DRAFT').length,
  );

  protected readonly archiveDialogTitle = computed(
    () => this.archiveDialogTarget()?.title ?? 'cet espace',
  );

  constructor() {
    // Initial load
    this.store.chargerEspaces({ page: 0, size: 200 });

    // ── ViewState effect ──────────────────────────────────────────────────
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

        if (this.hasLoaded()) {
          // Rechargement partiel : skeleton cards uniquement
          this.isReloading.set(true);
        } else if (hasEntities) {
          // Navigation retour avec cache : afficher immédiatement
          this.hasLoaded.set(true);
          this.triggerContentEnter();
        }
        return;
      }

      // loading vient de passer à false ─────────────────────────────────

      if (this.isReloading()) {
        this.isReloading.set(false);
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
    // ─────────────────────────────────────────────────────────────────────

    effect(() => {
      const totalPages = this.totalPages();
      const page = this.currentPage();
      if (page > totalPages) {
        untracked(() => this.currentPage.set(totalPages));
      }
    });

    // Archive feedback
    effect(() => {
      const archivedId = this.store.lastArchivedEspaceId();
      const pendingId = this.archivePendingId();
      if (!archivedId || archivedId !== pendingId) return;

      const pendingTitle = this.archivePendingTitle();
      this.notifications?.success(`L'espace "${pendingTitle}" a été archivé.`);
      this.store.clearArchiveFeedback();
      this.archivePendingId.set(null);
      this.archivePendingTitle.set('');
      this.archiveDialogTarget.set(null);
    });

    effect(() => {
      const archiveError = this.store.archiveError();
      const pendingId = this.archivePendingId();
      if (!archiveError || !pendingId) return;

      this.notifications?.error(
        "Impossible d'archiver cet espace. Veuillez réessayer.",
      );
      this.store.clearArchiveFeedback();
      this.archivePendingId.set(null);
      this.archivePendingTitle.set('');
    });

    // Submit feedback
    effect(() => {
      const lastId = this.store.lastSubmittedEspaceId();
      if (!lastId) return;
      this.notifications?.success('Espace soumis à la modération.');
      this.store.clearSubmitFeedback();
      this.submitDialogTarget.set(null);
    });

    effect(() => {
      const submitError = this.store.submitError();
      if (!submitError) return;
      this.notifications?.error(
        `Erreur lors de la soumission : ${submitError}`,
      );
      this.store.clearSubmitFeedback();
    });

    // Scroll lock when modal open
    effect((onCleanup) => {
      const hasOverlay =
        this.archiveDialogTarget() !== null ||
        this.submitDialogTarget() !== null;
      this.document.body.classList.toggle('ubax-overlay-open', hasOverlay);
      this.document.body.style.overflow = hasOverlay ? 'hidden' : '';

      onCleanup(() => {
        if (hasOverlay) {
          this.document.body.classList.remove('ubax-overlay-open');
          this.document.body.style.overflow = '';
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
    this.isReloading.set(false);
    this.contentEntering.set(false);
    this.store.chargerEspaces({ page: 0, size: 200 });
  }

  // ── View mode ─────────────────────────────────────────────────────────────
  protected setViewMode(mode: RoomViewMode): void {
    if (this.viewMode() === mode) return;
    this.viewMode.set(mode);
    this.currentPage.set(1);
  }

  // ── Filters ───────────────────────────────────────────────────────────────
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

  protected selectStatusOption(value: string): void {
    this.selectedStatus.set(value);
    this.currentPage.set(1);
    this.openDropdown.set(null);
  }

  protected resetFilters(): void {
    this.selectedType.set('all');
    this.selectedStatus.set('all');
    this.currentPage.set(1);
    this.openDropdown.set(null);
  }

  // ── Archive ───────────────────────────────────────────────────────────────
  protected openArchiveDialog(card: EspaceCard): void {
    if (card.statusRaw === 'ARCHIVED' || this.isArchiving(card.id)) return;
    this.archiveDialogTarget.set({
      id: card.id,
      title: card.title,
      statusRaw: card.statusRaw,
    });
  }

  protected closeArchiveDialog(): void {
    if (this.archivePendingId()) return;
    this.archiveDialogClosing.set(true);
    setTimeout(() => {
      this.archiveDialogTarget.set(null);
      this.archiveDialogClosing.set(false);
    }, 220);
  }

  protected confirmArchive(): void {
    const target = this.archiveDialogTarget();
    if (!target || this.isArchiving(target.id)) return;
    this.archivePendingId.set(target.id);
    this.archivePendingTitle.set(target.title);
    this.store.archiveEspace({ id: target.id, preserveInList: true });
  }

  protected isArchiving(id: string): boolean {
    return this.store.archivingEspaceIds().includes(id);
  }

  protected canArchive(statusRaw: EspaceStatus, id: string): boolean {
    return statusRaw !== 'ARCHIVED' && !this.isArchiving(id);
  }

  // ── Submit ────────────────────────────────────────────────────────────────
  protected openSubmitDialog(card: EspaceCard): void {
    this.submitDialogTarget.set({ id: card.id, title: card.title });
  }

  protected closeSubmitDialog(): void {
    this.submitDialogTarget.set(null);
  }

  protected confirmSubmit(): void {
    const target = this.submitDialogTarget();
    if (!target) return;
    this.store.soumettreEspace(target.id);
  }

  protected isSubmitting(id: string): boolean {
    return this.store.submittingEspaceIds().includes(id);
  }

  // ── Status helpers ────────────────────────────────────────────────────────
  protected getStatusTone(status: EspaceStatus): FilterOption['tone'] {
    return STATUS_TONE_MAP[status] ?? 'neutral';
  }

  @HostListener('document:click', ['$event'])
  handleDocumentClick(event: MouseEvent): void {
    const target = event.target;
    if (target instanceof HTMLElement && target.closest('.filter-dropdown'))
      return;
    this.openDropdown.set(null);
  }

  @HostListener('document:keydown.escape')
  handleEscapeKey(): void {
    if (this.archiveDialogTarget() !== null) {
      this.closeArchiveDialog();
      return;
    }
    if (this.submitDialogTarget() !== null) {
      this.closeSubmitDialog();
      return;
    }
    this.openDropdown.set(null);
  }

  private getOptionLabel(
    options: readonly FilterOption[],
    value: string,
  ): string {
    return options.find((o) => o.value === value)?.label ?? options[0].label;
  }
}

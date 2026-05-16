import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  OnDestroy,
  Renderer2,
  computed,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { MesBiensStore } from '@ubax-workspace/ubax-web-data-access';
import type { ListMine1$Params } from '@ubax-workspace/shared-api-types';
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
import { BiensCardsSkeletonComponent } from './biens-cards-skeleton/biens-cards-skeleton.component';
import type {
  BienSummaryCard,
  BienViewMode,
  FilterDropdownKey,
  FilterOption,
  GridBienCard,
  ListBienCard,
  PropertyMineStatus,
} from '../../types/immobilier.types';
import {
  DEFAULT_CATEGORY_OPTIONS,
  DEFAULT_STATUS_OPTIONS,
  DEFAULT_TYPE_OPTIONS,
  STATUS_LABEL_MAP,
  STATUS_TONE_MAP,
  TRANSACTION_LABEL_MAP,
  TRANSACTION_TONE_MAP,
  asPropertyStatus,
  codeListLabel,
  toBienCard,
} from '../../constants/immobilier.constants';

@Component({
  selector: 'ubax-biens-list-page',
  standalone: true,
  imports: [
    RouterLink,
    UbaxMorphTabsDirective,
    UbaxPaginatorComponent,
    BiensListSkeletonComponent,
    BiensCardsSkeletonComponent,
  ],
  templateUrl: './biens-list-page.component.html',
  styleUrl: './biens-list-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BiensListPageComponent implements OnDestroy {
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
  protected readonly archiveDialogClosing = signal(false);

  protected readonly submitDialogTarget = signal<{
    id: string;
    title: string;
    statusRaw: PropertyMineStatus;
  } | null>(null);
  protected readonly submitDialogClosing = signal(false);

  private readonly renderer = inject(Renderer2);
  private archiveOverlayElement: HTMLElement | null = null;
  private submitOverlayElement: HTMLElement | null = null;

  private readonly archivePendingId = signal<string | null>(null);
  private readonly archivePendingTitle = signal('');
  private readonly submitPendingId = signal<string | null>(null);
  private readonly submitPendingTitle = signal('');

  // ── ViewState pattern ────────────────────────────────────────────────────
  private readonly hasLoaded = signal(false);
  readonly isLeavingSkeleton = signal(false);
  readonly contentEntering = signal(false);
  readonly isReloading = signal(false);

  readonly viewState = computed<ViewState>(() =>
    deriveViewState(
      this.store.loading() && !this.isReloading(),
      this.store.error(),
      this.store.entities().length === 0,
      this.hasLoaded(),
    ),
  );

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
      toBienCard(property, index),
    ),
  );

  protected readonly filteredListCards = computed<readonly ListBienCard[]>(() =>
    this.filteredProperties().map((property, index) =>
      toBienCard(property, index),
    ),
  );

  protected readonly totalPages = computed(() => {
    const pagination = this.store.pagination();
    if (!pagination) return 1;

    const fromApi = Number(pagination.totalPages);
    if (Number.isFinite(fromApi) && fromApi > 0) {
      return Math.max(1, Math.floor(fromApi));
    }

    const totalElements = Number(pagination.totalElements ?? 0);
    const pageSize = Number(pagination.pageSize ?? this.pageSize());

    if (Number.isFinite(totalElements) && totalElements > 0 && pageSize > 0) {
      return Math.max(1, Math.ceil(totalElements / pageSize));
    }

    const currentItems = this.store.entities();
    if (currentItems && currentItems.length >= pageSize && pageSize > 0) {
      return Math.max(
        2,
        Math.ceil((totalElements || currentItems.length) / pageSize),
      );
    }

    return 1;
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
    () => !this.isLoading() && !this.isReloading() && !this.hasVisibleCards(),
  );

  protected readonly visibleGridCards = this.filteredGridCards;
  protected readonly visibleListCards = this.filteredListCards;

  protected readonly archiveDialogTitle = computed(
    () => this.archiveDialogTarget()?.title ?? 'ce bien',
  );

  private readonly loadParams = computed<ListMine1$Params>(() => {
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
          this.isReloading.set(true);
        } else if (hasEntities) {
          this.hasLoaded.set(true);
          this.triggerContentEnter();
        }
        return;
      }

      if (this.isReloading()) {
        this.isReloading.set(false);
        return;
      }

      if (this.hasLoaded()) return;

      if (wasLoading) {
        if (!hadEntitiesWhenLoadingStarted) {
          this.isLeavingSkeleton.set(true);
          setTimeout(() => {
            this.hasLoaded.set(true);
            this.isLeavingSkeleton.set(false);
            this.triggerContentEnter();
          }, 320);
        }
      } else if (hasEntities || hasError) {
        this.hasLoaded.set(true);
        this.triggerContentEnter();
      }
    });

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

    effect(() => {
      const submittedId = this.store.lastSubmittedPropertyId();
      const pendingId = this.submitPendingId();

      if (!submittedId || submittedId !== pendingId) {
        return;
      }

      const pendingTitle = this.submitPendingTitle();
      this.notifications?.success(
        `Le bien "${pendingTitle}" a été soumis à la modération.`,
      );
      this.store.loadOverview();
      this.store.clearSubmitFeedback();
      this.submitPendingId.set(null);
      this.submitPendingTitle.set('');
    });

    effect(() => {
      const submitError = this.store.submitError();
      const pendingId = this.submitPendingId();

      if (!submitError || !pendingId) {
        return;
      }

      this.notifications?.error(
        'Impossible de soumettre ce bien pour le moment. Veuillez réessayer.',
      );
      this.store.clearSubmitFeedback();
      this.submitPendingId.set(null);
      this.submitPendingTitle.set('');
    });

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

    effect(() => {
      const target = this.archiveDialogTarget();
      if (target && !this.archiveOverlayElement) {
        this.createArchiveOverlayPortal();
      } else if (!target && this.archiveOverlayElement) {
        this.destroyArchiveOverlayPortal();
      }
    });

    effect(() => {
      const target = this.submitDialogTarget();
      if (target && !this.submitOverlayElement) {
        this.createSubmitOverlayPortal();
      } else if (!target && this.submitOverlayElement) {
        this.destroySubmitOverlayPortal();
      }
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

  private createArchiveOverlayPortal(): void {
    const target = this.archiveDialogTarget();
    if (!target) return;

    this.archiveOverlayElement = this.renderer.createElement('div');
    this.renderer.addClass(this.archiveOverlayElement, 'ubax-modal-overlay');
    this.renderer.addClass(
      this.archiveOverlayElement,
      'archive-modal-overlay-portal',
    );
    this.renderer.setStyle(this.archiveOverlayElement, 'display', 'flex');
    this.renderer.listen(this.archiveOverlayElement, 'click', () =>
      this.closeArchiveDialog(),
    );

    const dialogElement = this.renderer.createElement('dialog');
    this.renderer.addClass(dialogElement, 'archive-modal');
    this.renderer.setAttribute(dialogElement, 'open', 'true');
    this.renderer.setAttribute(
      dialogElement,
      'aria-labelledby',
      'archive-modal-title',
    );
    this.renderer.listen(dialogElement, 'click', (e) => e.stopPropagation());

    const titleElement = this.renderer.createElement('h3');
    this.renderer.setAttribute(titleElement, 'id', 'archive-modal-title');
    this.renderer.setProperty(
      titleElement,
      'textContent',
      'Archiver ce bien ?',
    );
    this.renderer.appendChild(dialogElement, titleElement);

    const descriptionElement = this.renderer.createElement('p');
    const descriptionText = `Vous allez archiver "${target.title}". Cette action retire le bien de votre liste active.`;
    this.renderer.setProperty(
      descriptionElement,
      'textContent',
      descriptionText,
    );
    this.renderer.appendChild(dialogElement, descriptionElement);

    const actionsElement = this.renderer.createElement('div');
    this.renderer.addClass(actionsElement, 'archive-modal__actions');

    const cancelButton = this.renderer.createElement('button');
    this.renderer.addClass(cancelButton, 'archive-modal__btn');
    this.renderer.addClass(cancelButton, 'archive-modal__btn--cancel');
    this.renderer.setAttribute(cancelButton, 'type', 'button');
    this.renderer.setProperty(cancelButton, 'textContent', 'Annuler');
    this.renderer.setProperty(
      cancelButton,
      'disabled',
      this.isArchiving(target.id),
    );
    this.renderer.listen(cancelButton, 'click', () =>
      this.closeArchiveDialog(),
    );
    this.renderer.appendChild(actionsElement, cancelButton);

    const confirmButton = this.renderer.createElement('button');
    this.renderer.addClass(confirmButton, 'archive-modal__btn');
    this.renderer.addClass(confirmButton, 'archive-modal__btn--confirm');
    this.renderer.setAttribute(confirmButton, 'type', 'button');
    this.renderer.setProperty(
      confirmButton,
      'textContent',
      this.isArchiving(target.id) ? 'Archivage...' : "Confirmer l'archivage",
    );
    this.renderer.setProperty(
      confirmButton,
      'disabled',
      this.isArchiving(target.id),
    );
    this.renderer.listen(confirmButton, 'click', () => this.confirmArchive());
    this.renderer.appendChild(actionsElement, confirmButton);

    this.renderer.appendChild(dialogElement, actionsElement);
    this.renderer.appendChild(this.archiveOverlayElement, dialogElement);
    this.renderer.appendChild(document.body, this.archiveOverlayElement);
    this.renderer.addClass(document.body, 'ubax-overlay-open');
  }

  private destroyArchiveOverlayPortal(): void {
    if (this.archiveOverlayElement) {
      this.renderer.removeClass(document.body, 'ubax-overlay-open');
      this.renderer.removeChild(document.body, this.archiveOverlayElement);
      this.archiveOverlayElement = null;
    }
  }

  private createSubmitOverlayPortal(): void {
    const target = this.submitDialogTarget();
    if (!target) return;

    this.submitOverlayElement = this.renderer.createElement('div');
    this.renderer.addClass(this.submitOverlayElement, 'ubax-modal-overlay');
    this.renderer.addClass(
      this.submitOverlayElement,
      'archive-modal-overlay-portal',
    );
    this.renderer.setStyle(this.submitOverlayElement, 'display', 'flex');
    this.renderer.listen(this.submitOverlayElement, 'click', () =>
      this.closeSubmitDialog(),
    );

    const dialogElement = this.renderer.createElement('dialog');
    this.renderer.addClass(dialogElement, 'archive-modal');
    this.renderer.setAttribute(dialogElement, 'open', 'true');
    this.renderer.setAttribute(
      dialogElement,
      'aria-labelledby',
      'submit-modal-title',
    );
    this.renderer.listen(dialogElement, 'click', (e) => e.stopPropagation());

    const titleElement = this.renderer.createElement('h3');
    this.renderer.setAttribute(titleElement, 'id', 'submit-modal-title');
    this.renderer.setProperty(
      titleElement,
      'textContent',
      'Soumettre à la modération ?',
    );
    this.renderer.appendChild(dialogElement, titleElement);

    const descriptionElement = this.renderer.createElement('p');
    this.renderer.setProperty(
      descriptionElement,
      'textContent',
      `Vous allez soumettre "${target.title}" à la modération. Votre bien sera examiné avant publication.`,
    );
    this.renderer.appendChild(dialogElement, descriptionElement);

    const actionsElement = this.renderer.createElement('div');
    this.renderer.addClass(actionsElement, 'archive-modal__actions');

    const cancelButton = this.renderer.createElement('button');
    this.renderer.addClass(cancelButton, 'archive-modal__btn');
    this.renderer.addClass(cancelButton, 'archive-modal__btn--cancel');
    this.renderer.setAttribute(cancelButton, 'type', 'button');
    this.renderer.setProperty(cancelButton, 'textContent', 'Annuler');
    this.renderer.setProperty(
      cancelButton,
      'disabled',
      this.isSubmitting(target.id),
    );
    this.renderer.listen(cancelButton, 'click', () => this.closeSubmitDialog());
    this.renderer.appendChild(actionsElement, cancelButton);

    const confirmButton = this.renderer.createElement('button');
    this.renderer.addClass(confirmButton, 'archive-modal__btn');
    this.renderer.addClass(confirmButton, 'archive-modal__btn--confirm');
    this.renderer.setAttribute(confirmButton, 'type', 'button');
    this.renderer.setProperty(
      confirmButton,
      'textContent',
      this.isSubmitting(target.id)
        ? 'Soumission...'
        : 'Confirmer la soumission',
    );
    this.renderer.setProperty(
      confirmButton,
      'disabled',
      this.isSubmitting(target.id),
    );
    this.renderer.listen(confirmButton, 'click', () => this.confirmSubmit());
    this.renderer.appendChild(actionsElement, confirmButton);

    this.renderer.appendChild(dialogElement, actionsElement);
    this.renderer.appendChild(this.submitOverlayElement, dialogElement);
    this.renderer.appendChild(document.body, this.submitOverlayElement);
  }

  private destroySubmitOverlayPortal(): void {
    if (this.submitOverlayElement) {
      this.renderer.removeChild(document.body, this.submitOverlayElement);
      this.submitOverlayElement = null;
    }
  }

  ngOnDestroy(): void {
    this.destroyArchiveOverlayPortal();
    this.destroySubmitOverlayPortal();
  }

  retryLoad(): void {
    this.hasLoaded.set(false);
    this.isReloading.set(false);
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

    this.archiveDialogClosing.set(true);
    if (this.archiveOverlayElement) {
      this.renderer.addClass(this.archiveOverlayElement, 'is-closing');
      const dialogEl =
        this.archiveOverlayElement.querySelector<HTMLElement>('dialog');
      if (dialogEl) this.renderer.addClass(dialogEl, 'is-closing');
    }
    setTimeout(() => {
      this.archiveDialogTarget.set(null);
      this.archiveDialogClosing.set(false);
    }, 220);
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

  protected soumettreProperty(card: {
    id: string;
    title: string;
    statusRaw: PropertyMineStatus;
  }): void {
    if (!this.canSubmit(card.statusRaw, card.id)) {
      return;
    }

    this.submitDialogTarget.set(card);
  }

  protected closeSubmitDialog(): void {
    if (this.submitPendingId()) {
      return;
    }

    this.submitDialogClosing.set(true);
    if (this.submitOverlayElement) {
      this.renderer.addClass(this.submitOverlayElement, 'is-closing');
      const dialogEl =
        this.submitOverlayElement.querySelector<HTMLElement>('dialog');
      if (dialogEl) this.renderer.addClass(dialogEl, 'is-closing');
    }
    setTimeout(() => {
      this.submitDialogTarget.set(null);
      this.submitDialogClosing.set(false);
    }, 220);
  }

  protected confirmSubmit(): void {
    const target = this.submitDialogTarget();
    if (!target || this.isSubmitting(target.id)) {
      return;
    }

    this.submitPendingId.set(target.id);
    this.submitPendingTitle.set(target.title);
    this.store.soumettreProperty({ id: target.id });
    this.submitDialogTarget.set(null);
    this.submitDialogClosing.set(false);
  }

  protected isSubmitting(id: string): boolean {
    return this.store.submittingPropertyIds().includes(id);
  }

  protected canSubmit(statusRaw: PropertyMineStatus, id: string): boolean {
    return (
      (statusRaw === 'DRAFT' || statusRaw === 'REJECTED') &&
      !this.isSubmitting(id)
    );
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
    if (this.archiveDialogTarget() !== null) {
      this.closeArchiveDialog();
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

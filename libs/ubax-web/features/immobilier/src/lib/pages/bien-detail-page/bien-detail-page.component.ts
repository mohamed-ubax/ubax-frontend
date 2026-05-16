import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DomSanitizer, type SafeResourceUrl } from '@angular/platform-browser';
import { firstValueFrom } from 'rxjs';
import {
  ApiConfiguration,
  generateReadUrl,
  getById1 as getPropertyById,
  PropertyDetailResponse,
} from '@ubax-workspace/shared-api-types';
import { deriveViewState, ViewState } from '@ubax-workspace/shared-ui';
import { MesBiensStore } from '@ubax-workspace/ubax-web-data-access';
import {
  NOTIFICATION_HANDLER,
  NotificationHandler,
} from '@ubax-workspace/shared-data-access';

type BienDocument = {
  readonly id: string;
  readonly name: string;
  readonly fileUrl: string;
};

type BienMetric = {
  readonly label: string;
  readonly value: string;
};

type BienGalleryItem = {
  readonly key: string;
  readonly src: string | null;
  readonly alt: string;
  readonly isPlaceholder: boolean;
};

type BienComment = {
  readonly author: string;
  readonly avatar: string;
  readonly rating: number;
  readonly review: string;
};

type BienVideo = {
  readonly key: string;
  readonly fileUrl: string;
  readonly playbackUrl: string;
  readonly fileName?: string;
  readonly mimeType?: string;
};

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Brouillon',
  PENDING: 'En attente',
  PUBLISHED: 'Publie',
  RESERVED: 'Reserve',
  SOLD: 'Vendu',
  ARCHIVED: 'Archive',
  REJECTED: 'Rejete',
};

const PROPERTY_TYPE_LABELS: Record<string, string> = {
  APARTMENT: 'Appartement',
  VILLA: 'Villa',
  HOUSE: 'Maison',
  LAND: 'Terrain',
  OFFICE: 'Bureau',
  HOTEL_ROOM: 'Chambre hotel',
};

const TRANSACTION_TYPE_LABELS: Record<string, string> = {
  SALE: 'Vente',
  RENT: 'Location',
  RENT_FURNISHED: 'Location meublee',
  SHORT_STAY: 'Court sejour',
};

const CONDITION_LABELS: Record<string, string> = {
  NEW: 'Neuf',
  GOOD: 'Bon etat',
  RENOVATE: 'A renover',
};

const MIN_GALLERY_SLOTS = 4;

function readAmenityPayloadLabel(item: {
  readonly code?: string;
  readonly customDescription?: string;
  readonly customValue?: string;
  readonly description?: string;
  readonly value?: string;
}): string {
  return (
    item.description?.trim() ||
    item.value?.trim() ||
    item.customDescription?.trim() ||
    item.customValue?.trim() ||
    item.code?.trim() ||
    ''
  );
}

@Component({
  selector: 'ubax-bien-detail-page',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './bien-detail-page.component.html',
  styleUrl: './bien-detail-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BienDetailPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly store = inject(MesBiensStore);
  private readonly document = inject(DOCUMENT);
  private readonly http = inject(HttpClient);
  private readonly apiConfig = inject(ApiConfiguration);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly notifications = inject(NOTIFICATION_HANDLER, {
    optional: true,
  }) as NotificationHandler | null;

  private readonly propertyDetail = signal<PropertyDetailResponse | null>(null);
  private readonly loadingDetail = signal(false);
  private readonly detailError = signal<string | null>(null);
  private readonly hasLoadedDetail = signal(false);
  private readonly resolvedVideoUrls = signal<Record<string, string>>({});

  protected readonly comments: readonly BienComment[] = [];
  protected readonly ratingStars = [1, 2, 3, 4, 5] as const;
  protected readonly activeImageIndex = signal(0);
  protected readonly brokenGalleryImageKeys = signal<Record<string, true>>({});
  protected readonly archiveConfirmOpen = signal(false);
  protected readonly archivePending = signal(false);
  protected readonly propertyArchived = signal(false);
  protected readonly propertyId = signal<string | null>(null);
  protected readonly documentOpeningId = signal<string | null>(null);
  protected readonly previewUrl = signal<string | null>(null);
  protected readonly previewName = signal<string>('Document');
  protected readonly previewFullscreen = signal(false);
  protected readonly previewIsImage = signal(false);

  protected readonly previewSafeUrl = computed<SafeResourceUrl | null>(() => {
    const url = this.previewUrl();
    return url ? this.sanitizer.bypassSecurityTrustResourceUrl(url) : null;
  });

  protected readonly property = computed(
    () => this.propertyDetail()?.property ?? null,
  );

  protected readonly viewState = computed<ViewState>(() =>
    deriveViewState(
      this.loadingDetail(),
      this.detailError(),
      !this.property(),
      this.hasLoadedDetail(),
    ),
  );

  protected readonly detailErrorMessage = computed(
    () =>
      this.detailError() ??
      'Impossible de charger les details complets de ce bien.',
  );

  protected readonly statusCode = computed(
    () => this.property()?.status ?? 'DRAFT',
  );
  protected readonly canEditProperty = computed(() => {
    const property = this.property();

    return (
      !!property &&
      (property.status === 'DRAFT' || property.status === 'REJECTED')
    );
  });

  protected readonly propertyStatus = computed(() => {
    if (this.propertyArchived()) {
      return STATUS_LABELS['ARCHIVED'];
    }
    return STATUS_LABELS[this.statusCode()] ?? this.statusCode();
  });

  protected readonly statusClass = computed(() => {
    const code = this.statusCode();
    if (this.propertyArchived() || code === 'ARCHIVED') return 'archived';
    if (code === 'PENDING') return 'pending';
    if (code === 'REJECTED') return 'rejected';
    return 'active';
  });

  protected readonly galleryItems = computed<readonly BienGalleryItem[]>(() => {
    const media = this.propertyDetail()?.media ?? [];
    const photos = [...media]
      .filter((item) => (item.mediaType ?? 'PHOTO') !== 'VIDEO')
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
      .map((item, index) => {
        const src = item.fileUrl?.trim() || null;

        return {
          key: item.id ?? `gallery-${index}`,
          src,
          alt: `Photo du bien ${index + 1}`,
          isPlaceholder: !src,
        } satisfies BienGalleryItem;
      });

    const items = [...photos];

    while (items.length < MIN_GALLERY_SLOTS) {
      const slotNumber = items.length + 1;
      items.push({
        key: `gallery-placeholder-${slotNumber}`,
        src: null,
        alt: `Image indisponible ${slotNumber}`,
        isPlaceholder: true,
      });
    }

    return items;
  });

  protected readonly videos = computed<readonly BienVideo[]>(() => {
    const resolvedUrls = this.resolvedVideoUrls();

    return (this.propertyDetail()?.media ?? [])
      .filter((item) => item.mediaType === 'VIDEO' && !!item.fileUrl)
      .map((item, index) => {
        const fileUrl = item.fileUrl ?? '';
        const key = (item.id ?? fileUrl) || `video-${index}`;

        return {
          key,
          fileUrl,
          playbackUrl: resolvedUrls[key] ?? fileUrl,
          fileName: item.fileName ?? undefined,
          mimeType: item.mimeType ?? undefined,
        } satisfies BienVideo;
      });
  });

  protected readonly hasGallery = computed(() =>
    this.galleryItems().some((item) => !!item.src),
  );
  protected readonly hasVideos = computed(() => this.videos().length > 0);

  protected readonly documents = computed<readonly BienDocument[]>(() => {
    const docs = this.propertyDetail()?.documents ?? [];
    return docs.map((doc, index) => ({
      id: doc.id ?? `doc-${index}`,
      name: doc.title?.trim() || doc.fileName?.trim() || 'Document',
      fileUrl: doc.fileUrl ?? '',
    }));
  });

  protected readonly hasDocuments = computed(() => this.documents().length > 0);

  protected readonly activeGalleryItem = computed<BienGalleryItem>(() => {
    const items = this.galleryItems();
    const index = Math.min(this.activeImageIndex(), items.length - 1);

    return (
      items[index] ??
      items[0] ?? {
        key: 'gallery-fallback',
        src: null,
        alt: 'Image indisponible',
        isPlaceholder: true,
      }
    );
  });

  protected readonly propertyTitle = computed(
    () => this.property()?.title?.trim() || 'Bien immobilier',
  );

  protected readonly propertyTypeLabel = computed(() => {
    const code = this.property()?.propertyType ?? '';
    return PROPERTY_TYPE_LABELS[code] ?? this.normalizeCodeLabel(code);
  });

  protected readonly transactionLabel = computed(() => {
    const code = this.property()?.transactionType ?? '';
    return TRANSACTION_TYPE_LABELS[code] ?? this.normalizeCodeLabel(code);
  });

  protected readonly conditionLabel = computed(() => {
    const code = this.property()?.condition ?? '';
    return CONDITION_LABELS[code] ?? this.normalizeCodeLabel(code);
  });

  protected readonly locationLabel = computed(() => {
    const city = this.normalizeCodeLabel(this.property()?.city ?? '');
    const district = (this.property()?.district ?? '').trim();
    return [city, district].filter((x) => x.length > 0).join(', ') || '-';
  });

  protected readonly fullAddress = computed(() => {
    const street = (this.property()?.street ?? '').trim();
    const address = (this.property()?.address ?? '').trim();
    return [street, address].filter((x) => x.length > 0).join(', ') || '-';
  });

  protected readonly priceLabel = computed(() => {
    const amount = this.property()?.price;
    if (typeof amount !== 'number') {
      return '-';
    }
    return `${amount.toLocaleString('fr-FR')} FCFA`;
  });

  protected readonly ownerName = computed(
    () => this.property()?.ownerName?.trim() || 'Proprietaire non renseigne',
  );

  protected readonly ownerPhone = computed(() => '-');

  protected readonly ownerProfileLink = computed(() => {
    const ownerId = this.property()?.ownerId;
    return ownerId ? ['/biens/bailleurs', ownerId] : ['/biens'];
  });

  protected readonly metrics = computed<readonly BienMetric[]>(() => {
    const current = this.property();
    return [
      { label: 'Pieces', value: this.formatNumber(current?.rooms) },
      { label: 'Chambres', value: this.formatNumber(current?.bedrooms) },
      {
        label: 'Salles de bains',
        value: this.formatNumber(current?.bathrooms),
      },
      { label: 'Balcons', value: this.formatNumber(current?.balconies) },
      {
        label: 'Surface',
        value:
          typeof current?.surfaceTotal === 'number'
            ? `${current.surfaceTotal} m²`
            : '-',
      },
    ];
  });

  protected readonly descriptionParagraphs = computed(() => {
    const raw = this.property()?.description?.trim() ?? '';
    if (!raw) {
      return ['Aucune description disponible pour ce bien.'];
    }
    return raw
      .split(/\n+/)
      .map((chunk) => chunk.trim())
      .filter((chunk) => chunk.length > 0);
  });

  protected readonly amenityColumns = computed(() => {
    const source = this.property()?.amenities ?? [];
    const labels = source
      .map((item) => readAmenityPayloadLabel(item))
      .map((item) => item.trim())
      .map((item) => this.normalizeCodeLabel(item))
      .filter((item) => item.length > 0);

    if (labels.length === 0) {
      return [['Aucune commodite specifiee']];
    }

    const columnCount = 3;
    const columns: string[][] = Array.from({ length: columnCount }, () => []);
    labels.forEach((label, index) => {
      columns[index % columnCount]?.push(label);
    });
    return columns.filter((column) => column.length > 0);
  });

  protected readonly archiveDisabled = computed(() => {
    const code = this.statusCode();
    return this.archivePending() || code === 'ARCHIVED' || code === 'PENDING';
  });

  protected readonly showTenantInfo = computed(() => false);

  protected readonly latitude = computed(
    () => this.property()?.latitude ?? null,
  );
  protected readonly longitude = computed(
    () => this.property()?.longitude ?? null,
  );
  protected readonly hasCoordinates = computed(
    () =>
      typeof this.latitude() === 'number' &&
      typeof this.longitude() === 'number',
  );

  protected readonly mapSafeUrl = computed<SafeResourceUrl | null>(() => {
    const lat = this.latitude();
    const lng = this.longitude();
    if (typeof lat !== 'number' || typeof lng !== 'number') return null;
    const d = 0.012;
    const url =
      `https://www.openstreetmap.org/export/embed.html` +
      `?bbox=${lng - d},${lat - d},${lng + d},${lat + d}` +
      `&layer=mapnik&marker=${lat},${lng}`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  });

  constructor() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.propertyId.set(id);
      void this.loadPropertyDetail(id);
    }

    effect(() => {
      const archivedId = this.store.lastArchivedPropertyId();
      const id = this.propertyId();

      if (!archivedId || !id || archivedId !== id) {
        return;
      }

      this.propertyArchived.set(true);
      this.archivePending.set(false);
      this.archiveConfirmOpen.set(false);
      this.notifications?.success(
        `Le bien "${this.propertyTitle()}" est maintenant archive.`,
      );
      this.store.clearArchiveFeedback();
      void this.loadPropertyDetail(id);
    });

    effect(() => {
      const archiveError = this.store.archiveError();
      if (!archiveError || !this.archivePending()) {
        return;
      }

      this.archivePending.set(false);
      this.notifications?.error(
        "Une erreur est survenue lors de l'archivage du bien.",
      );
      this.store.clearArchiveFeedback();
    });

    effect((onCleanup) => {
      const hasArchiveOverlay = this.archiveConfirmOpen();
      const hasDocPreviewOverlay = !!this.previewUrl();
      const hasOverlay = hasArchiveOverlay || hasDocPreviewOverlay;
      this.document.body.classList.toggle('ubax-overlay-open', hasOverlay);

      onCleanup(() => {
        if (hasOverlay) {
          this.document.body.classList.remove('ubax-overlay-open');
        }
      });
    });
  }

  protected selectImage(index: number): void {
    this.activeImageIndex.set(index);
  }

  protected previousImage(): void {
    const items = this.galleryItems();
    if (items.length <= 1) return;
    this.activeImageIndex.update((current) =>
      current === 0 ? items.length - 1 : current - 1,
    );
  }

  protected nextImage(): void {
    const items = this.galleryItems();
    if (items.length <= 1) return;
    this.activeImageIndex.update((current) =>
      current === items.length - 1 ? 0 : current + 1,
    );
  }

  protected isGalleryImageAvailable(item: BienGalleryItem): boolean {
    return (
      !!item.src &&
      !item.isPlaceholder &&
      !this.brokenGalleryImageKeys()[item.key]
    );
  }

  protected markGalleryImageBroken(key: string): void {
    this.brokenGalleryImageKeys.update((current) => {
      if (current[key]) {
        return current;
      }

      return {
        ...current,
        [key]: true,
      };
    });
  }

  protected openArchiveConfirm(): void {
    if (this.archiveDisabled()) {
      return;
    }

    this.archiveConfirmOpen.set(true);
  }

  protected closeArchiveConfirm(): void {
    if (this.archivePending()) {
      return;
    }

    this.archiveConfirmOpen.set(false);
  }

  protected confirmArchive(): void {
    const id = this.propertyId();
    if (!id || this.archivePending() || this.statusCode() === 'ARCHIVED') {
      return;
    }

    this.archivePending.set(true);
    this.store.archiveProperty({
      id,
      preserveInList: true,
    });
  }

  protected async openDocument(
    fileUrl: string,
    fileName?: string,
    docId?: string,
  ): Promise<void> {
    if (!fileUrl) return;

    if (docId) {
      this.documentOpeningId.set(docId);
    }

    try {
      const response = await firstValueFrom(
        generateReadUrl(this.http, this.apiConfig.rootUrl, { fileUrl }),
      );
      const resolvedUrl =
        this.extractReadUrlFromResponse(response.body) ?? fileUrl;
      this.previewName.set(fileName?.trim() || 'Document');
      this.previewIsImage.set(this.isPreviewImage(resolvedUrl, fileName));
      this.previewUrl.set(resolvedUrl);
    } catch {
      this.previewName.set(fileName?.trim() || 'Document');
      this.previewIsImage.set(this.isPreviewImage(fileUrl, fileName));
      this.previewUrl.set(fileUrl);
    } finally {
      if (docId) {
        this.documentOpeningId.set(null);
      }
    }
  }

  protected closePreview(): void {
    this.previewUrl.set(null);
    this.previewName.set('Document');
    this.previewIsImage.set(false);
    this.previewFullscreen.set(false);
  }

  protected togglePreviewFullscreen(): void {
    this.previewFullscreen.update((value) => !value);
  }

  protected async downloadDocument(
    fileUrl: string,
    fileName: string,
    docId?: string,
  ): Promise<void> {
    if (!fileUrl) return;

    if (docId) {
      this.documentOpeningId.set(docId);
    }

    let resolvedUrl = fileUrl;

    try {
      const response = await firstValueFrom(
        generateReadUrl(this.http, this.apiConfig.rootUrl, { fileUrl }),
      );
      resolvedUrl = this.extractReadUrlFromResponse(response.body) ?? fileUrl;
    } catch {
      resolvedUrl = fileUrl;
    }

    const link = document.createElement('a');
    link.href = resolvedUrl;
    link.download = fileName || 'document';
    link.rel = 'noopener';
    link.target = '_blank';
    link.click();

    if (docId) {
      this.documentOpeningId.set(null);
    }
  }

  protected retryLoad(): void {
    const id = this.propertyId();
    if (!id) {
      return;
    }

    void this.loadPropertyDetail(id);
  }

  private async loadPropertyDetail(id: string): Promise<void> {
    try {
      this.loadingDetail.set(true);
      this.detailError.set(null);
      this.resolvedVideoUrls.set({});
      const response = await firstValueFrom(
        getPropertyById(this.http, this.apiConfig.rootUrl, { id }),
      );
      const detail = this.extractDetailFromResponse(response.body);
      this.propertyDetail.set(detail);
      void this.resolveVideoReadUrls(detail);
      this.hasLoadedDetail.set(true);
      this.activeImageIndex.set(0);
    } catch {
      this.propertyDetail.set(null);
      this.resolvedVideoUrls.set({});
      this.hasLoadedDetail.set(true);
      this.detailError.set(
        'Impossible de charger les details complets de ce bien.',
      );
      this.notifications?.error(this.detailErrorMessage());
    } finally {
      this.loadingDetail.set(false);
    }
  }

  private async resolveVideoReadUrls(
    detail: PropertyDetailResponse | null,
  ): Promise<void> {
    const videoEntries = (detail?.media ?? [])
      .filter((item) => item.mediaType === 'VIDEO' && !!item.fileUrl)
      .map((item, index) => ({
        key: (item.id ?? item.fileUrl) || `video-${index}`,
        fileUrl: item.fileUrl ?? '',
      }));

    if (!videoEntries.length) {
      this.resolvedVideoUrls.set({});
      return;
    }

    const resolvedEntries = await Promise.all(
      videoEntries.map(async (entry) => {
        if (this.isPublicPropertyMediaUrl(entry.fileUrl)) {
          return [entry.key, entry.fileUrl] as const;
        }

        try {
          const response = await firstValueFrom(
            generateReadUrl(this.http, this.apiConfig.rootUrl, {
              fileUrl: entry.fileUrl,
            }),
          );

          return [
            entry.key,
            this.extractReadUrlFromResponse(response.body) ?? entry.fileUrl,
          ] as const;
        } catch {
          return [entry.key, entry.fileUrl] as const;
        }
      }),
    );

    this.resolvedVideoUrls.set(Object.fromEntries(resolvedEntries));
  }

  private isPublicPropertyMediaUrl(fileUrl: string): boolean {
    return /\/properties-media\//i.test(fileUrl);
  }

  private extractDetailFromResponse(
    body: unknown,
  ): PropertyDetailResponse | null {
    if (!body || typeof body !== 'object') {
      return null;
    }

    const direct = body as PropertyDetailResponse;
    if (direct.property || direct.media || direct.documents) {
      return direct;
    }

    const wrapped = body as { data?: unknown };
    if (wrapped.data && typeof wrapped.data === 'object') {
      return wrapped.data as PropertyDetailResponse;
    }

    return null;
  }

  private normalizeCodeLabel(raw: string): string {
    return raw
      .toLowerCase()
      .split('_')
      .filter((part) => part.length > 0)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }

  private extractReadUrlFromResponse(body: unknown): string | null {
    if (!body || typeof body !== 'object') {
      return null;
    }

    const direct = body as { readUrl?: unknown };
    if (typeof direct.readUrl === 'string' && direct.readUrl.length > 0) {
      return direct.readUrl;
    }

    const wrapped = body as { data?: unknown };
    if (wrapped.data && typeof wrapped.data === 'object') {
      const nested = wrapped.data as { readUrl?: unknown };
      if (typeof nested.readUrl === 'string' && nested.readUrl.length > 0) {
        return nested.readUrl;
      }
    }

    return null;
  }

  private isPreviewImage(url: string, fileName?: string): boolean {
    const target = `${fileName ?? ''} ${url}`.toLowerCase();
    return /(\.png|\.jpe?g|\.webp|\.gif|\.bmp|\.svg)(\?|$|\s)/.test(target);
  }

  private formatNumber(value: number | undefined): string {
    return typeof value === 'number' ? `${value}` : '-';
  }
}

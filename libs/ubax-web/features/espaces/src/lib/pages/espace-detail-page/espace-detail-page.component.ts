import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DomSanitizer, type SafeResourceUrl } from '@angular/platform-browser';
import {
  ApiConfiguration,
  generateReadUrl,
  getById,
  PropertyDetailResponse,
} from '@ubax-workspace/shared-api-types';
import { firstValueFrom } from 'rxjs';
import { deriveViewState, ViewState } from '@ubax-workspace/shared-ui';
import {
  NOTIFICATION_HANDLER,
  type NotificationHandler,
} from '@ubax-workspace/shared-data-access';

type GuestProfile = {
  readonly clientId: string;
  readonly name: string;
  readonly code: string;
  readonly avatar: string;
};

type ReservationDetail = {
  readonly title: string;
  readonly type: string;
  readonly capacity: string;
  readonly bookingDate: string;
  readonly bookingTime: string;
  readonly stayDuration: string;
  readonly facilities: readonly string[];
};

type GalleryPhoto = {
  readonly key: string;
  readonly src: string | null;
  readonly alt: string;
  readonly isPlaceholder: boolean;
  readonly previewCount?: number;
};

type HistoryRow = {
  readonly id: number;
  readonly clientId: string;
  readonly guestName: string;
  readonly property: string;
  readonly duration: string;
  readonly period: string;
  readonly status: 'Confirme';
  readonly avatar: string;
};

type LegalDocument = {
  readonly id: string;
  readonly name: string;
  readonly fileUrl: string;
};

const MIN_GALLERY_SLOTS = 4;

@Component({
  selector: 'ubax-espace-detail-page',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './espace-detail-page.component.html',
  styleUrl: './espace-detail-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EspaceDetailPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly document = inject(DOCUMENT);
  private readonly http = inject(HttpClient);
  private readonly apiConfig = inject(ApiConfiguration);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly notifications = inject(NOTIFICATION_HANDLER, {
    optional: true,
  }) as NotificationHandler | null;

  private readonly detailResponse = signal<PropertyDetailResponse | null>(null);
  private readonly loadingDetail = signal(false);
  private readonly detailError = signal<string | null>(null);
  private readonly hasLoadedDetail = signal(false);
  readonly brokenGalleryImageKeys = signal<Record<string, true>>({});
  readonly documentOpeningId = signal<string | null>(null);
  readonly previewUrl = signal<string | null>(null);
  readonly previewName = signal<string>('Document');
  readonly previewFullscreen = signal(false);
  readonly previewIsImage = signal(false);

  readonly previewSafeUrl = computed<SafeResourceUrl | null>(() => {
    const url = this.previewUrl();
    return url ? this.sanitizer.bypassSecurityTrustResourceUrl(url) : null;
  });

  readonly detailId = computed(
    () => this.route.snapshot.paramMap.get('id') ?? '',
  );

  readonly property = computed(() => this.detailResponse()?.property ?? null);

  readonly viewState = computed<ViewState>(() =>
    deriveViewState(
      this.loadingDetail(),
      this.detailError(),
      !this.property(),
      this.hasLoadedDetail(),
    ),
  );

  readonly detailErrorMessage = computed(
    () =>
      this.detailError() ?? "Impossible de charger les détails de l'espace.",
  );

  readonly guest = computed<GuestProfile>(() => ({
    clientId: (this.property()?.ownerId ?? this.detailId()) || '0',
    name: this.property()?.ownerName?.trim() || 'Proprietaire non renseigne',
    code: this.property()?.id ? `#P-${this.property()?.id}` : '#P-000000',
    avatar: 'shared/people/profile-01.webp',
  }));

  readonly reservation = computed<ReservationDetail>(() => {
    const current = this.property();
    const amenities = (current?.amenities ?? [])
      .map(
        (item) => item.customValue || item.customDescription || item.code || '',
      )
      .map((item) => item.trim())
      .filter((item) => item.length > 0);

    const createdAt = current?.createdAt ? new Date(current.createdAt) : null;
    const bookingDate = createdAt
      ? createdAt.toLocaleDateString('fr-FR', {
          weekday: 'long',
          day: '2-digit',
          month: 'long',
          year: 'numeric',
        })
      : '-';

    const bookingTime = createdAt
      ? createdAt.toLocaleTimeString('fr-FR', {
          hour: '2-digit',
          minute: '2-digit',
        })
      : '-';

    return {
      title: current?.title?.trim() || 'Espace hotelier',
      type: this.normalizeCodeLabel(current?.propertyType ?? ''),
      capacity:
        typeof current?.maxOccupancy === 'number'
          ? `${current.maxOccupancy} personnes`
          : '-',
      bookingDate,
      bookingTime,
      stayDuration:
        current?.paymentFrequency === 'NIGHTLY'
          ? 'Par nuit'
          : this.normalizeCodeLabel(current?.paymentFrequency ?? ''),
      facilities:
        amenities.length > 0 ? amenities : ['Aucune commodite specifiee'],
    };
  });

  readonly galleryPhotos = computed<readonly GalleryPhoto[]>(() => {
    const media = this.detailResponse()?.media ?? [];
    const sorted = [...media].sort(
      (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0),
    );

    const photos: GalleryPhoto[] = sorted
      .filter((item) => (item.mediaType ?? 'PHOTO') !== 'VIDEO')
      .map((item, index) => ({
        key: item.id ?? `gallery-${index}`,
        src: item.fileUrl?.trim() || null,
        alt: `Photo ${index + 1}`,
        isPlaceholder: !(item.fileUrl?.trim() || null),
        previewCount: undefined,
      }));

    const items: GalleryPhoto[] = photos.map((photo, index, all) => ({
      ...photo,
      previewCount:
        photo.src && index === all.length - 1
          ? all.filter((item) => !!item.src).length
          : undefined,
    }));

    while (items.length < MIN_GALLERY_SLOTS) {
      const slotNumber = items.length + 1;
      items.push({
        key: `gallery-placeholder-${slotNumber}`,
        src: null,
        alt: `Image indisponible ${slotNumber}`,
        isPlaceholder: true,
        previewCount: undefined,
      });
    }

    return items;
  });

  readonly totalGalleryCount = computed(() => this.galleryPhotos().length);

  readonly legalDocuments = computed<readonly LegalDocument[]>(() => {
    const docs = this.detailResponse()?.documents ?? [];
    return docs.map((doc, index) => ({
      id: doc.id ?? `doc-${index}`,
      name: doc.title?.trim() || doc.fileName?.trim() || 'Document legal',
      fileUrl: doc.fileUrl ?? '',
    }));
  });

  readonly historyRows = computed<readonly HistoryRow[]>(() => []);

  readonly latitude = computed(() => this.property()?.latitude ?? null);
  readonly longitude = computed(() => this.property()?.longitude ?? null);
  readonly hasCoordinates = computed(
    () =>
      typeof this.latitude() === 'number' &&
      typeof this.longitude() === 'number',
  );

  readonly mapSafeUrl = computed<SafeResourceUrl | null>(() => {
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

  readonly videos = computed(() =>
    (this.detailResponse()?.media ?? []).filter(
      (item) => item.mediaType === 'VIDEO' && !!item.fileUrl,
    ),
  );
  readonly hasVideos = computed(() => this.videos().length > 0);

  readonly activeGalleryIndex = signal(0);

  readonly activeGalleryPhoto = computed(() => {
    const photos = this.galleryPhotos();
    const safeIndex = Math.min(this.activeGalleryIndex(), photos.length - 1);
    return (
      photos[safeIndex] ??
      photos[0] ?? {
        key: 'gallery-fallback',
        src: null,
        alt: 'Image indisponible',
        isPlaceholder: true,
        previewCount: undefined,
      }
    );
  });

  readonly galleryCounterLabel = computed(() => {
    const photos = this.galleryPhotos();
    const safeIndex = Math.min(this.activeGalleryIndex(), photos.length - 1);
    return `${safeIndex + 1}/${this.totalGalleryCount()}`;
  });

  constructor() {
    const id = this.detailId();
    if (id) {
      void this.loadDetail(id);
    }

    effect((onCleanup) => {
      const hasOverlay = !!this.previewUrl();
      this.document.body.classList.toggle('ubax-overlay-open', hasOverlay);

      onCleanup(() => {
        if (hasOverlay) {
          this.document.body.classList.remove('ubax-overlay-open');
        }
      });
    });
  }

  retryLoad(): void {
    const id = this.detailId();
    if (!id) {
      return;
    }

    void this.loadDetail(id);
  }

  selectGalleryImage(index: number): void {
    this.activeGalleryIndex.set(index);
  }

  isGalleryImageAvailable(item: GalleryPhoto): boolean {
    return (
      !!item.src &&
      !item.isPlaceholder &&
      !this.brokenGalleryImageKeys()[item.key]
    );
  }

  markGalleryImageBroken(key: string): void {
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

  previousGalleryImage(): void {
    const photos = this.galleryPhotos();
    this.activeGalleryIndex.update((index) =>
      index === 0 ? photos.length - 1 : index - 1,
    );
  }

  nextGalleryImage(): void {
    const photos = this.galleryPhotos();
    this.activeGalleryIndex.update((index) =>
      index === photos.length - 1 ? 0 : index + 1,
    );
  }

  async openDocument(
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

  closePreview(): void {
    this.previewUrl.set(null);
    this.previewName.set('Document');
    this.previewIsImage.set(false);
    this.previewFullscreen.set(false);
  }

  togglePreviewFullscreen(): void {
    this.previewFullscreen.update((value) => !value);
  }

  async downloadDocument(
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

  private async loadDetail(id: string): Promise<void> {
    try {
      this.loadingDetail.set(true);
      this.detailError.set(null);
      const response = await firstValueFrom(
        getById(this.http, this.apiConfig.rootUrl, {
          id,
        }),
      );
      this.detailResponse.set(this.extractDetailFromResponse(response.body));
      this.hasLoadedDetail.set(true);
      this.activeGalleryIndex.set(0);
    } catch {
      this.detailResponse.set(null);
      this.hasLoadedDetail.set(true);
      this.detailError.set("Impossible de charger les détails de l'espace.");
      this.notifications?.error(this.detailErrorMessage());
    } finally {
      this.loadingDetail.set(false);
    }
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
    if (!raw) {
      return '-';
    }

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
}

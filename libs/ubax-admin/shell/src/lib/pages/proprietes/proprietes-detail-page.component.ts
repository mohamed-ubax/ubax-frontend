import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { DomSanitizer, type SafeResourceUrl } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { toSignal } from '@angular/core/rxjs-interop';
import { map, firstValueFrom } from 'rxjs';
import {
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  ApiConfiguration,
  generateReadUrl,
  type PropertyDetailResponse,
  type PropertyMediaResponse,
  type PropertyDocumentResponse,
  type PresignedReadUrlResponse,
} from '@ubax-workspace/shared-api-types';
import { deriveViewState, type ViewState } from '@ubax-workspace/shared-ui';
// shared-design-system components not used in this template (uses bien-detail-page pattern directly)
import { NOTIFICATION_HANDLER } from '@ubax-workspace/shared-data-access';
import { DialogModule } from 'primeng/dialog';
import { TextareaModule } from 'primeng/textarea';
import {
  AdminPropertiesService,
  type PropertyModerationStatus,
} from '../../services/admin-properties.service';

type ModalType = 'approve' | 'reject' | null;

type BienGalleryItem = {
  readonly key: string;
  readonly src: string | null;
  readonly alt: string;
  readonly isPlaceholder: boolean;
};

type BienDocument = {
  readonly id: string;
  readonly name: string;
  readonly fileUrl: string;
};

type BienMetric = {
  readonly label: string;
  readonly value: string;
};

const MIN_GALLERY_SLOTS = 4;

const PROPERTY_TYPE_LABELS: Record<string, string> = {
  APARTMENT: 'Appartement', VILLA: 'Villa', HOUSE: 'Maison',
  LAND: 'Terrain', OFFICE: 'Bureau', COMMERCIAL: 'Commercial',
  STUDIO: 'Studio', DUPLEX: 'Duplex', PENTHOUSE: 'Penthouse',
  HOTEL_ROOM: 'Chambre hôtel', HOTEL_SUITE: 'Suite hôtel',
};

const TRANSACTION_TYPE_LABELS: Record<string, string> = {
  SALE: 'Vente', RENT: 'Location',
  RENT_FURNISHED: 'Location meublée', SHORT_STAY: 'Court séjour',
};

const CONDITION_LABELS: Record<string, string> = {
  NEW: 'Neuf', GOOD: 'Bon état', RENOVATE: 'À rénover',
};

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Brouillon', PENDING: 'En attente', PUBLISHED: 'Publié',
  RESERVED: 'Réservé', SOLD: 'Vendu', ARCHIVED: 'Archivé', REJECTED: 'Rejeté',
};

@Component({
  selector: 'ubax-admin-proprietes-detail-page',
  standalone: true,
  imports: [
    DatePipe,
    ReactiveFormsModule,
    DialogModule,
    TextareaModule,
  ],
  templateUrl: './proprietes-detail-page.component.html',
  styleUrl: './proprietes-detail-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProprietesDetailPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly svc = inject(AdminPropertiesService);
  private readonly notif = inject(NOTIFICATION_HANDLER);
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly http = inject(HttpClient);
  private readonly apiConfig = inject(ApiConfiguration);
  private readonly sanitizer = inject(DomSanitizer);

  private readonly propertyId = toSignal(
    this.route.paramMap.pipe(map((p) => p.get('id') ?? '')),
    { initialValue: '' },
  );

  private readonly propertyDetail = signal<PropertyDetailResponse | null>(null);
  private readonly loadingDetail = signal(false);
  private readonly detailError = signal<string | null>(null);
  private readonly hasLoadedDetail = signal(false);

  protected readonly activeImageIndex = signal(0);
  protected readonly brokenGalleryImageKeys = signal<Record<string, true>>({});
  protected readonly activeModal = signal<ModalType>(null);
  protected readonly saving = signal(false);
  protected readonly documentOpeningId = signal<string | null>(null);
  protected readonly previewUrl = signal<string | null>(null);
  protected readonly previewName = signal<string>('Document');
  protected readonly previewFullscreen = signal(false);
  protected readonly previewIsImage = signal(false);

  protected readonly previewSafeUrl = computed<SafeResourceUrl | null>(() => {
    const url = this.previewUrl();
    return url ? this.sanitizer.bypassSecurityTrustResourceUrl(url) : null;
  });

  protected readonly rejectionForm = this.fb.group({
    reason: ['', [Validators.required, Validators.minLength(10)]],
  });

  // ── ViewState ─────────────────────────────────────────────────────────────

  protected readonly property = computed(() => this.propertyDetail()?.property ?? null);

  protected readonly viewState = computed<ViewState>(() =>
    deriveViewState(
      this.loadingDetail(),
      this.detailError(),
      !this.property(),
      this.hasLoadedDetail(),
    ),
  );

  protected readonly detailErrorMessage = computed(
    () => this.detailError() ?? 'Impossible de charger les détails de ce bien.',
  );

  // ── Status ────────────────────────────────────────────────────────────────

  protected readonly statusCode = computed(() => this.property()?.status ?? 'PENDING');

  protected readonly propertyStatus = computed(
    () => STATUS_LABELS[this.statusCode()] ?? this.statusCode(),
  );

  protected readonly statusClass = computed(() => {
    const code = this.statusCode();
    if (code === 'ARCHIVED') return 'archived';
    if (code === 'PENDING') return 'pending';
    if (code === 'REJECTED') return 'rejected';
    if (code === 'PUBLISHED') return 'active';
    return 'active';
  });

  protected readonly isPending = computed(() => this.statusCode() === 'PENDING');
  protected readonly isTerminal = computed(() =>
    this.statusCode() === 'PUBLISHED' || this.statusCode() === 'REJECTED' || this.statusCode() === 'ARCHIVED',
  );

  // ── Gallery ───────────────────────────────────────────────────────────────

  protected readonly galleryItems = computed<readonly BienGalleryItem[]>(() => {
    const media = this.propertyDetail()?.media ?? [];
    const photos = [...media]
      .filter((item) => (item.mediaType ?? 'PHOTO') !== 'VIDEO')
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
      .map((item, index) => ({
        key: item.id ?? `gallery-${index}`,
        src: item.fileUrl?.trim() || null,
        alt: `Photo du bien ${index + 1}`,
        isPlaceholder: !item.fileUrl?.trim(),
      } satisfies BienGalleryItem));

    const items = [...photos];
    while (items.length < MIN_GALLERY_SLOTS) {
      items.push({
        key: `gallery-placeholder-${items.length + 1}`,
        src: null,
        alt: `Image indisponible ${items.length + 1}`,
        isPlaceholder: true,
      });
    }
    return items;
  });

  protected readonly activeGalleryItem = computed<BienGalleryItem>(() => {
    const items = this.galleryItems();
    const index = Math.min(this.activeImageIndex(), items.length - 1);
    return items[index] ?? items[0] ?? { key: 'fallback', src: null, alt: '', isPlaceholder: true };
  });

  // ── Documents ─────────────────────────────────────────────────────────────

  protected readonly documents = computed<readonly BienDocument[]>(() =>
    (this.propertyDetail()?.documents ?? []).map((doc, i) => ({
      id: doc.id ?? `doc-${i}`,
      name: doc.title?.trim() || doc.fileName?.trim() || 'Document',
      fileUrl: doc.fileUrl ?? '',
    })),
  );

  // ── Computed labels ───────────────────────────────────────────────────────

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
    return [city, district].filter(Boolean).join(', ') || '—';
  });

  protected readonly fullAddress = computed(() => {
    const street = (this.property()?.street ?? '').trim();
    const address = (this.property()?.address ?? '').trim();
    return [street, address].filter(Boolean).join(', ') || '—';
  });

  protected readonly priceLabel = computed(() => {
    const amount = this.property()?.price;
    if (typeof amount !== 'number') return '—';
    return `${amount.toLocaleString('fr-FR')} FCFA`;
  });

  protected readonly ownerName = computed(
    () => this.property()?.ownerName?.trim() || this.property()?.agencyName?.trim() || 'Non renseigné',
  );

  protected readonly metrics = computed<readonly BienMetric[]>(() => {
    const p = this.property();
    return [
      { label: 'Pièces', value: this.formatNumber(p?.rooms) },
      { label: 'Chambres', value: this.formatNumber(p?.bedrooms) },
      { label: 'Salles de bains', value: this.formatNumber(p?.bathrooms) },
      { label: 'Balcons', value: this.formatNumber(p?.balconies) },
      { label: 'Surface', value: typeof p?.surfaceTotal === 'number' ? `${p.surfaceTotal} m²` : '—' },
    ];
  });

  protected readonly descriptionParagraphs = computed(() => {
    const raw = this.property()?.description?.trim() ?? '';
    if (!raw) return ['Aucune description disponible pour ce bien.'];
    return raw.split(/\n+/).map((c) => c.trim()).filter(Boolean);
  });

  protected readonly amenityColumns = computed(() => {
    const source = this.property()?.amenities ?? [];
    const labels = source
      .map((item) => item.customValue?.trim() || item.code?.trim() || '')
      .map((l) => this.normalizeCodeLabel(l))
      .filter(Boolean);

    if (!labels.length) return [['Aucune commodité spécifiée']];
    const cols: string[][] = [[], [], []];
    labels.forEach((l, i) => cols[i % 3]?.push(l));
    return cols.filter((c) => c.length > 0);
  });

  protected readonly hasCoordinates = computed(
    () => typeof this.property()?.latitude === 'number' && typeof this.property()?.longitude === 'number',
  );

  protected readonly mapSafeUrl = computed<SafeResourceUrl | null>(() => {
    const lat = this.property()?.latitude;
    const lng = this.property()?.longitude;
    if (typeof lat !== 'number' || typeof lng !== 'number') return null;
    const d = 0.012;
    const url = `https://www.openstreetmap.org/export/embed.html?bbox=${lng - d},${lat - d},${lng + d},${lat + d}&layer=mapnik&marker=${lat},${lng}`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  });

  // ── Back navigation ───────────────────────────────────────────────────────

  /** Retourne à la page précédente dans l'historique, ou à la modération par défaut */
  protected goBack(): void {
    // On vérifie si on vient d'une page propriétés publiées ou de la modération
    const referrer = document.referrer;
    if (referrer.includes('/proprietes/agences')) {
      void this.router.navigate(['/proprietes/agences']);
    } else if (referrer.includes('/proprietes/hotels')) {
      void this.router.navigate(['/proprietes/hotels']);
    } else {
      void this.router.navigate(['/proprietes']);
    }
  }

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  constructor() {
    effect(() => {
      const id = this.propertyId();
      if (id) void this.loadPropertyDetail(id);
    });
  }

  private async loadPropertyDetail(id: string): Promise<void> {
    this.loadingDetail.set(true);
    this.detailError.set(null);
    try {
      const detail = await firstValueFrom(this.svc.getDetail(id));
      this.propertyDetail.set(detail);
      this.hasLoadedDetail.set(true);
      this.activeImageIndex.set(0);
    } catch {
      this.propertyDetail.set(null);
      this.hasLoadedDetail.set(true);
      this.detailError.set('Impossible de charger les détails de ce bien.');
      this.notif.error(this.detailErrorMessage());
    } finally {
      this.loadingDetail.set(false);
    }
  }

  protected retryLoad(): void {
    const id = this.propertyId();
    if (id) void this.loadPropertyDetail(id);
  }

  // ── Gallery ───────────────────────────────────────────────────────────────

  protected selectImage(index: number): void { this.activeImageIndex.set(index); }

  protected previousImage(): void {
    const items = this.galleryItems();
    if (items.length <= 1) return;
    this.activeImageIndex.update((i) => (i === 0 ? items.length - 1 : i - 1));
  }

  protected nextImage(): void {
    const items = this.galleryItems();
    if (items.length <= 1) return;
    this.activeImageIndex.update((i) => (i === items.length - 1 ? 0 : i + 1));
  }

  protected isGalleryImageAvailable(item: BienGalleryItem): boolean {
    return !!item.src && !item.isPlaceholder && !this.brokenGalleryImageKeys()[item.key];
  }

  protected markGalleryImageBroken(key: string): void {
    this.brokenGalleryImageKeys.update((c) => c[key] ? c : { ...c, [key]: true });
  }

  // ── Documents ─────────────────────────────────────────────────────────────

  protected async openDocument(fileUrl: string, fileName?: string, docId?: string): Promise<void> {
    if (!fileUrl) return;
    if (docId) this.documentOpeningId.set(docId);
    try {
      const res = await firstValueFrom(generateReadUrl(this.http, this.apiConfig.rootUrl, { fileUrl }));
      const body = res.body as unknown as { data?: PresignedReadUrlResponse } | PresignedReadUrlResponse;
      const url = (body as { data?: PresignedReadUrlResponse })?.data?.readUrl
        ?? (body as PresignedReadUrlResponse)?.readUrl ?? fileUrl;
      this.previewName.set(fileName?.trim() || 'Document');
      this.previewIsImage.set(this.isPreviewImage(url, fileName));
      this.previewUrl.set(url);
    } catch {
      this.previewName.set(fileName?.trim() || 'Document');
      this.previewIsImage.set(this.isPreviewImage(fileUrl, fileName));
      this.previewUrl.set(fileUrl);
    } finally {
      if (docId) this.documentOpeningId.set(null);
    }
  }

  protected closePreview(): void {
    this.previewUrl.set(null);
    this.previewName.set('Document');
    this.previewIsImage.set(false);
    this.previewFullscreen.set(false);
  }

  protected togglePreviewFullscreen(): void {
    this.previewFullscreen.update((v) => !v);
  }

  // ── Moderation ────────────────────────────────────────────────────────────

  protected openModal(type: ModalType): void {
    this.rejectionForm.reset();
    this.activeModal.set(type);
  }

  protected closeModal(): void { this.activeModal.set(null); }

  protected async submitApprove(): Promise<void> {
    await this.submitDecision('PUBLISHED');
    this.closeModal();
  }

  protected async submitReject(): Promise<void> {
    if (this.rejectionForm.invalid) { this.rejectionForm.markAllAsTouched(); return; }
    await this.submitDecision('REJECTED', this.rejectionForm.value.reason);
    this.closeModal();
  }

  private async submitDecision(status: PropertyModerationStatus, rejectionReason?: string): Promise<void> {
    const id = this.propertyId();
    if (!id) return;
    this.saving.set(true);
    try {
      const updated = await firstValueFrom(this.svc.decide(id, { status, rejectionReason }));
      const current = this.propertyDetail();
      if (current) this.propertyDetail.set({ ...current, property: updated });
      if (status === 'PUBLISHED') {
        this.notif.success('Bien approuvé et publié avec succès.');
      } else {
        this.notif.success('Bien rejeté. Le propriétaire sera notifié.');
      }
      setTimeout(() => void this.router.navigate(['/proprietes']), 1500);
    } catch {
      this.notif.error("L'opération a échoué. Veuillez réessayer.");
    } finally {
      this.saving.set(false);
    }
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private normalizeCodeLabel(raw: string): string {
    return raw.toLowerCase().split('_').filter(Boolean)
      .map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
  }

  private isPreviewImage(url: string, fileName?: string): boolean {
    const target = `${fileName ?? ''} ${url}`.toLowerCase();
    return /(\.png|\.jpe?g|\.webp|\.gif|\.bmp|\.svg)(\?|$|\s)/.test(target);
  }

  private formatNumber(value: number | undefined): string {
    return typeof value === 'number' ? `${value}` : '—';
  }
}

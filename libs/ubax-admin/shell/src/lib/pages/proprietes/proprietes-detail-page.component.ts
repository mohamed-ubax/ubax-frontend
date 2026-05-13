import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { DomSanitizer, type SafeResourceUrl } from '@angular/platform-browser';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
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
  type PropertyResponse,
  type PropertyMediaResponse,
  type PropertyDocumentResponse,
  type PresignedReadUrlResponse,
} from '@ubax-workspace/shared-api-types';
import {
  EmptyStateComponent,
  SectionCardComponent,
  StatusBadgeComponent,
  type InfoItem,
} from '@ubax-workspace/shared-design-system';
import { NOTIFICATION_HANDLER } from '@ubax-workspace/shared-data-access';
import { DialogModule } from 'primeng/dialog';
import { TextareaModule } from 'primeng/textarea';
import {
  AdminPropertiesService,
  type PropertyModerationStatus,
} from '../../services/admin-properties.service';

type ModalType = 'approve' | 'reject' | null;

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

const CONDITION_LABELS: Record<string, string> = {
  NEW: 'Neuf',
  GOOD: 'Bon état',
  RENOVATE: 'À rénover',
};

const DOC_TYPE_LABELS: Record<string, string> = {
  TITLE_DEED: 'Titre de propriété',
  BUILDING_PERMIT: 'Permis de construire',
  DIAGNOSTIC: 'Diagnostic',
  CADASTRAL_PLAN: 'Plan cadastral',
  INSURANCE: 'Assurance',
  CONFORMITY_CERTIFICATE: 'Certificat de conformité',
  OTHER: 'Autre',
};

@Component({
  selector: 'ubax-admin-proprietes-detail-page',
  standalone: true,
  imports: [
    DatePipe,
    RouterLink,
    ReactiveFormsModule,
    SectionCardComponent,
    StatusBadgeComponent,
    EmptyStateComponent,
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

  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected readonly detail = signal<PropertyDetailResponse | null>(null);
  protected readonly activeModal = signal<ModalType>(null);
  protected readonly activeMediaIndex = signal(0);
  protected readonly lightboxOpen = signal(false);
  protected readonly lightboxUrl = signal<string | null>(null);
  protected readonly lightboxSafeUrl = computed<SafeResourceUrl | null>(() => {
    const url = this.lightboxUrl();
    return url ? this.sanitizer.bypassSecurityTrustResourceUrl(url) : null;
  });
  protected readonly lightboxIsImage = signal(false);
  protected readonly openingMediaId = signal<string | null>(null);
  protected readonly openingDocId = signal<string | null>(null);

  protected readonly rejectionForm = this.fb.group({
    reason: ['', [Validators.required, Validators.minLength(10)]],
  });

  // ── Computed ──────────────────────────────────────────────────────────────

  protected readonly property = computed(() => this.detail()?.property ?? null);

  protected readonly media = computed(() => this.detail()?.media ?? []);

  protected readonly coverMedia = computed(() =>
    this.media().find((m) => m.cover) ?? this.media()[0] ?? null,
  );

  protected readonly galleryMedia = computed(() =>
    this.media().filter((m) => m.mediaType === 'IMAGE' || !m.mediaType),
  );

  protected readonly documents = computed(() => this.detail()?.documents ?? []);

  protected readonly infoItems = computed<InfoItem[]>(() => {
    const p = this.property();
    if (!p) return [];
    return [
      { label: 'Type de bien', value: this.getPropertyTypeLabel(p.propertyType) },
      { label: 'Transaction', value: this.getTransactionTypeLabel(p.transactionType) },
      { label: 'Ville', value: p.city ?? '—' },
      { label: 'Quartier', value: p.district ?? '—' },
      { label: 'Adresse', value: p.address ?? p.street ?? '—' },
      { label: 'Prix', value: this.formatPrice(p.price) },
    ];
  });

  protected readonly detailItems = computed<InfoItem[]>(() => {
    const p = this.property();
    if (!p) return [];
    const items: InfoItem[] = [];
    if (p.surfaceLiving) items.push({ label: 'Surface habitable', value: `${p.surfaceLiving} m²` });
    if (p.surfaceTotal) items.push({ label: 'Surface totale', value: `${p.surfaceTotal} m²` });
    if (p.rooms) items.push({ label: 'Pièces', value: String(p.rooms) });
    if (p.bedrooms) items.push({ label: 'Chambres', value: String(p.bedrooms) });
    if (p.bathrooms) items.push({ label: 'Salles de bain', value: String(p.bathrooms) });
    if (p.floor !== undefined && p.floor !== null) items.push({ label: 'Étage', value: p.floor === 0 ? 'RDC' : String(p.floor) });
    if (p.totalFloors) items.push({ label: 'Nb étages', value: String(p.totalFloors) });
    if (p.condition) items.push({ label: 'État', value: CONDITION_LABELS[p.condition] ?? p.condition });
    if (p.yearBuilt) items.push({ label: 'Année construction', value: String(p.yearBuilt) });
    return items;
  });

  protected readonly ownerInfo = computed<InfoItem[]>(() => {
    const p = this.property();
    if (!p) return [];
    const items: InfoItem[] = [];
    if (p.agencyName) items.push({ label: 'Agence', value: p.agencyName });
    if (p.ownerName) items.push({ label: 'Propriétaire', value: p.ownerName });
    return items;
  });

  constructor() {
    effect(() => {
      const id = this.propertyId();
      if (id) void this.loadDetail(id);
    });
  }

  private async loadDetail(id: string): Promise<void> {
    this.loading.set(true);
    try {
      this.detail.set(await firstValueFrom(this.svc.getDetail(id)));
    } catch {
      this.notif.error('Impossible de charger le détail du bien.');
    } finally {
      this.loading.set(false);
    }
  }

  // ── Modals ────────────────────────────────────────────────────────────────

  protected openModal(type: ModalType): void {
    this.rejectionForm.reset();
    this.activeModal.set(type);
  }

  protected closeModal(): void {
    this.activeModal.set(null);
  }

  protected async submitApprove(): Promise<void> {
    await this.submitDecision('PUBLISHED');
    this.closeModal();
  }

  protected async submitReject(): Promise<void> {
    if (this.rejectionForm.invalid) {
      this.rejectionForm.markAllAsTouched();
      return;
    }
    await this.submitDecision('REJECTED', this.rejectionForm.value.reason);
    this.closeModal();
  }

  private async submitDecision(
    status: PropertyModerationStatus,
    rejectionReason?: string,
  ): Promise<void> {
    const id = this.propertyId();
    if (!id) return;

    this.saving.set(true);
    try {
      const updated = await firstValueFrom(
        this.svc.decide(id, { status, rejectionReason }),
      );
      // Update the detail signal with the new property status
      const current = this.detail();
      if (current) {
        this.detail.set({ ...current, property: updated });
      }

      if (status === 'PUBLISHED') {
        this.notif.success('Bien approuvé et publié avec succès.');
        // Navigate back to list after short delay
        setTimeout(() => void this.router.navigate(['/proprietes']), 1500);
      } else {
        this.notif.success('Bien rejeté. Le propriétaire sera notifié.');
        setTimeout(() => void this.router.navigate(['/proprietes']), 1500);
      }
    } catch {
      this.notif.error("L'opération a échoué. Veuillez réessayer.");
    } finally {
      this.saving.set(false);
    }
  }

  // ── Media / Lightbox ──────────────────────────────────────────────────────

  protected async openMedia(media: PropertyMediaResponse): Promise<void> {
    if (!media.fileUrl) return;
    this.openingMediaId.set(media.id ?? 'loading');
    try {
      const res = await firstValueFrom(
        generateReadUrl(this.http, this.apiConfig.rootUrl, { fileUrl: media.fileUrl }),
      );
      const body = res.body as unknown as { data?: PresignedReadUrlResponse } | PresignedReadUrlResponse;
      const url =
        (body as { data?: PresignedReadUrlResponse })?.data?.readUrl ??
        (body as PresignedReadUrlResponse)?.readUrl ??
        media.fileUrl;
      this.lightboxUrl.set(url);
      this.lightboxIsImage.set(
        media.mediaType === 'IMAGE' || (media.mimeType ?? '').startsWith('image/') || !media.mimeType,
      );
      this.lightboxOpen.set(true);
    } catch {
      // Fallback to raw URL
      this.lightboxUrl.set(media.fileUrl ?? null);
      this.lightboxIsImage.set(true);
      this.lightboxOpen.set(true);
    } finally {
      this.openingMediaId.set(null);
    }
  }

  protected async openDocument(doc: PropertyDocumentResponse): Promise<void> {
    if (!doc.fileUrl) return;
    this.openingDocId.set(doc.id ?? 'loading');
    try {
      const res = await firstValueFrom(
        generateReadUrl(this.http, this.apiConfig.rootUrl, { fileUrl: doc.fileUrl }),
      );
      const body = res.body as unknown as { data?: PresignedReadUrlResponse } | PresignedReadUrlResponse;
      const url =
        (body as { data?: PresignedReadUrlResponse })?.data?.readUrl ??
        (body as PresignedReadUrlResponse)?.readUrl ??
        doc.fileUrl;
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch {
      window.open(doc.fileUrl, '_blank', 'noopener,noreferrer');
    } finally {
      this.openingDocId.set(null);
    }
  }

  protected closeLightbox(): void {
    this.lightboxOpen.set(false);
    this.lightboxUrl.set(null);
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

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

  protected getDocTypeLabel(type: string | undefined): string {
    return DOC_TYPE_LABELS[type ?? ''] ?? (type ?? 'Document');
  }

  protected formatPrice(price: number | undefined): string {
    if (!price) return '—';
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      maximumFractionDigits: 0,
    }).format(price);
  }

  protected formatFileSize(bytes: number | undefined): string {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} o`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
  }

  protected isTerminal(): boolean {
    const status = this.property()?.status;
    return status === 'PUBLISHED' || status === 'REJECTED' || status === 'ARCHIVED';
  }

  protected isPending(): boolean {
    return this.property()?.status === 'PENDING';
  }
}

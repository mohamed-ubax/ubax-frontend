import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer, type SafeResourceUrl } from '@angular/platform-browser';
import { firstValueFrom } from 'rxjs';
import {
  ApiConfiguration,
  generateReadUrl,
  getById6,
  PaymentResponse,
} from '@ubax-workspace/shared-api-types';

const STATUS_LABELS: Record<string, string> = {
  PAID: 'Payé',
  PENDING: 'En attente',
  LATE: 'En retard',
  PARTIAL: 'Partiel',
  CANCELLED: 'Annulé',
};

const STATUS_TONES: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'neutral'> = {
  PAID: 'success',
  PENDING: 'warning',
  LATE: 'danger',
  PARTIAL: 'info',
  CANCELLED: 'neutral',
};

const PAYMENT_TYPE_LABELS: Record<string, string> = {
  RENT: 'Loyer',
  DEPOSIT: 'Caution',
  CHARGES: 'Charges',
  COMMISSION: 'Commission',
  SALE: 'Vente',
};

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  CASH: 'Espèces',
  BANK_TRANSFER: 'Virement bancaire',
  MOBILE_MONEY: 'Mobile Money',
  CHECK: 'Chèque',
};

function formatAmount(amount: number | undefined): string {
  if (amount == null) return '—';
  return `${amount.toLocaleString('fr-FR')} FCFA`;
}

function formatDate(iso: string | undefined): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

function extractResponseData(body: unknown): unknown {
  if (!body || typeof body !== 'object') return {};
  const r = body as Record<string, unknown>;
  return r['data'] && typeof r['data'] === 'object' ? r['data'] : r;
}

@Component({
  selector: 'ubax-paiement-detail-page',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './paiement-detail-page.component.html',
  styleUrl: './paiement-detail-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaiementDetailPageComponent implements OnInit {
  private static readonly DOCUMENT_READ_URL_TTL_MS = 240_000;

  private readonly route = inject(ActivatedRoute);
  private readonly doc = inject(DOCUMENT);
  private readonly http = inject(HttpClient);
  private readonly apiConfig = inject(ApiConfiguration);
  private readonly sanitizer = inject(DomSanitizer);

  protected readonly payment = signal<PaymentResponse | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);

  protected readonly previewUrl = signal<string | null>(null);
  protected readonly previewName = signal('Reçu de paiement');
  protected readonly previewIsImage = signal(false);
  protected readonly previewFullscreen = signal(false);
  protected readonly documentOpening = signal(false);

  private prefetchedDocumentSource: string | null = null;
  private prefetchedDocumentUrl: string | null = null;
  private prefetchedDocumentAt: number | null = null;
  private prefetchedDocumentPromise: Promise<string | null> | null = null;

  protected readonly statusLabel = computed(
    () => STATUS_LABELS[this.payment()?.status ?? ''] ?? '—',
  );
  protected readonly statusTone = computed(
    () => STATUS_TONES[this.payment()?.status ?? ''] ?? 'neutral',
  );
  protected readonly typeLabel = computed(
    () => PAYMENT_TYPE_LABELS[this.payment()?.paymentType ?? ''] ?? '—',
  );
  protected readonly methodLabel = computed(
    () => PAYMENT_METHOD_LABELS[this.payment()?.paymentMethod ?? ''] ?? '—',
  );
  protected readonly amountFormatted = computed(() =>
    formatAmount(this.payment()?.amount),
  );
  protected readonly amountPaidFormatted = computed(() =>
    formatAmount(this.payment()?.amountPaid),
  );
  protected readonly dueDateFormatted = computed(() =>
    formatDate(this.payment()?.dueDate),
  );
  protected readonly paidDateFormatted = computed(() =>
    formatDate(this.payment()?.paidDate),
  );
  protected readonly createdAtFormatted = computed(() =>
    formatDate(this.payment()?.createdAt),
  );
  protected readonly safePreviewUrl = computed<SafeResourceUrl | null>(() => {
    const url = this.previewUrl();
    return url ? this.sanitizer.bypassSecurityTrustResourceUrl(url) : null;
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      void this.loadPayment(id);
    } else {
      this.loading.set(false);
      this.error.set('Identifiant de paiement manquant.');
    }
  }

  private async loadPayment(id: string): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const response = await firstValueFrom(
        getById6(this.http, this.apiConfig.rootUrl, { id }),
      );
      const data = extractResponseData(response.body);
      this.payment.set(data as PaymentResponse);
    } catch {
      this.error.set('Impossible de charger les détails du paiement.');
    } finally {
      this.loading.set(false);
    }
  }

  protected async openReceipt(): Promise<void> {
    const fileUrl = this.payment()?.receiptUrl;
    if (!fileUrl || this.documentOpening()) return;

    const prefetchedUrl = this.getFreshPrefetchedDocumentUrl(fileUrl);
    if (prefetchedUrl) {
      this.openPreview(prefetchedUrl);
      return;
    }

    this.documentOpening.set(true);
    this.doc.body.classList.add('ubax-overlay-open');

    try {
      const resolvedUrl = this.prefetchedDocumentPromise
        ? await this.prefetchedDocumentPromise
        : await this.resolveDocumentReadUrl(fileUrl);

      if (!resolvedUrl) throw new Error('Missing read url');

      this.cachePrefetchedDocumentUrl(fileUrl, resolvedUrl);
      this.openPreview(resolvedUrl);
    } catch {
      // Fallback : utiliser l'URL brute si la présignature échoue
      this.openPreview(fileUrl);
    } finally {
      this.documentOpening.set(false);
    }
  }

  protected closePreview(): void {
    this.previewUrl.set(null);
    this.previewName.set('Reçu de paiement');
    this.previewIsImage.set(false);
    this.previewFullscreen.set(false);
    this.doc.body.classList.remove('ubax-overlay-open');
  }

  protected togglePreviewFullscreen(): void {
    this.previewFullscreen.update((v) => !v);
  }

  private openPreview(resolvedUrl: string): void {
    this.previewIsImage.set(this.isPreviewImage(resolvedUrl));
    this.previewUrl.set(resolvedUrl);
    this.previewFullscreen.set(false);
  }

  private async resolveDocumentReadUrl(fileUrl: string): Promise<string | null> {
    const response = await firstValueFrom(
      generateReadUrl(this.http, this.apiConfig.rootUrl, { fileUrl }),
    );
    return this.extractReadUrlFromResponse(response.body);
  }

  private extractReadUrlFromResponse(body: unknown): string | null {
    if (!body || typeof body !== 'object') return null;
    const direct = body as { readUrl?: unknown };
    if (typeof direct.readUrl === 'string' && direct.readUrl.length > 0) return direct.readUrl;
    const wrapped = body as { data?: unknown };
    if (wrapped.data && typeof wrapped.data === 'object') {
      const nested = wrapped.data as { readUrl?: unknown };
      if (typeof nested.readUrl === 'string' && nested.readUrl.length > 0) return nested.readUrl;
    }
    return null;
  }

  private cachePrefetchedDocumentUrl(fileUrl: string, resolvedUrl: string): void {
    this.prefetchedDocumentSource = fileUrl;
    this.prefetchedDocumentUrl = resolvedUrl;
    this.prefetchedDocumentAt = Date.now();
  }

  private getFreshPrefetchedDocumentUrl(fileUrl: string): string | null {
    if (
      this.prefetchedDocumentSource !== fileUrl ||
      !this.prefetchedDocumentUrl ||
      this.prefetchedDocumentAt == null
    ) return null;

    if (Date.now() - this.prefetchedDocumentAt > PaiementDetailPageComponent.DOCUMENT_READ_URL_TTL_MS) {
      this.prefetchedDocumentSource = null;
      this.prefetchedDocumentUrl = null;
      this.prefetchedDocumentAt = null;
      return null;
    }

    return this.prefetchedDocumentUrl;
  }

  private isPreviewImage(url: string): boolean {
    return /(\.png|\.jpe?g|\.webp|\.gif|\.bmp|\.svg)(\?|$|\s)/i.test(url);
  }
}

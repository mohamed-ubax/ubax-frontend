import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
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

function extractReadUrl(body: unknown): string | null {
  if (!body || typeof body !== 'object') return null;
  const direct = body as { readUrl?: unknown };
  if (typeof direct.readUrl === 'string' && direct.readUrl) return direct.readUrl;
  const wrapped = body as { data?: unknown };
  if (wrapped.data && typeof wrapped.data === 'object') {
    const nested = wrapped.data as { readUrl?: unknown };
    if (typeof nested.readUrl === 'string' && nested.readUrl) return nested.readUrl;
  }
  return null;
}

function isImageUrl(url: string): boolean {
  return /(\.png|\.jpe?g|\.webp|\.gif|\.bmp|\.svg)(\?|$)/i.test(url);
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
  private readonly route = inject(ActivatedRoute);
  private readonly http = inject(HttpClient);
  private readonly apiConfig = inject(ApiConfiguration);
  private readonly sanitizer = inject(DomSanitizer);

  protected readonly payment = signal<PaymentResponse | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);

  protected readonly previewUrl = signal<string | null>(null);
  protected readonly previewIsImage = signal(false);
  protected readonly previewLoading = signal(false);

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
    if (!fileUrl) return;
    this.previewLoading.set(true);
    try {
      const response = await firstValueFrom(
        generateReadUrl(this.http, this.apiConfig.rootUrl, { fileUrl }),
      );
      const resolvedUrl = extractReadUrl(response.body) ?? fileUrl;
      this.previewIsImage.set(isImageUrl(resolvedUrl));
      this.previewUrl.set(resolvedUrl);
    } catch {
      this.previewIsImage.set(isImageUrl(fileUrl));
      this.previewUrl.set(fileUrl);
    } finally {
      this.previewLoading.set(false);
    }
  }

  protected closePreview(): void {
    this.previewUrl.set(null);
    this.previewIsImage.set(false);
  }
}

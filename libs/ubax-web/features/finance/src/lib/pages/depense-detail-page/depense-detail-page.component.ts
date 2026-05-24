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
  getById8,
  ExpenseResponse,
} from '@ubax-workspace/shared-api-types';

const CATEGORY_LABELS: Record<string, string> = {
  MAINTENANCE: 'Entretien',
  MARKETING: 'Marketing',
  SALARY: 'Salaire',
  UTILITIES: 'Charges',
  TAX: 'Taxes',
  OTHER: 'Autre',
};

const COST_CENTER_LABELS: Record<string, string> = {
  AGENCY_GENERAL: 'Agence (général)',
  PROPERTY_SPECIFIC: 'Bien spécifique',
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
  selector: 'ubax-depense-detail-page',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './depense-detail-page.component.html',
  styleUrl: './depense-detail-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DepenseDetailPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly http = inject(HttpClient);
  private readonly apiConfig = inject(ApiConfiguration);
  private readonly sanitizer = inject(DomSanitizer);

  protected readonly expense = signal<ExpenseResponse | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);

  protected readonly previewUrl = signal<string | null>(null);
  protected readonly previewIsImage = signal(false);
  protected readonly previewLoading = signal(false);

  protected readonly categoryLabel = computed(
    () => CATEGORY_LABELS[this.expense()?.category ?? ''] ?? '—',
  );
  protected readonly costCenterLabel = computed(
    () => COST_CENTER_LABELS[this.expense()?.costCenter ?? ''] ?? '—',
  );
  protected readonly methodLabel = computed(
    () => PAYMENT_METHOD_LABELS[this.expense()?.paymentMethod ?? ''] ?? '—',
  );
  protected readonly amountFormatted = computed(() =>
    formatAmount(this.expense()?.amount),
  );
  protected readonly expenseDateFormatted = computed(() =>
    formatDate(this.expense()?.expenseDate),
  );
  protected readonly createdAtFormatted = computed(() =>
    formatDate(this.expense()?.createdAt),
  );
  protected readonly safePreviewUrl = computed<SafeResourceUrl | null>(() => {
    const url = this.previewUrl();
    return url ? this.sanitizer.bypassSecurityTrustResourceUrl(url) : null;
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      void this.loadExpense(id);
    } else {
      this.loading.set(false);
      this.error.set('Identifiant de dépense manquant.');
    }
  }

  private async loadExpense(id: string): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const response = await firstValueFrom(
        getById8(this.http, this.apiConfig.rootUrl, { id }),
      );
      const data = extractResponseData(response.body);
      this.expense.set(data as ExpenseResponse);
    } catch {
      this.error.set('Impossible de charger les détails de la dépense.');
    } finally {
      this.loading.set(false);
    }
  }

  protected async openJustification(): Promise<void> {
    const fileUrl = this.expense()?.justificationUrl;
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

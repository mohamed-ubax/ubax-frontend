import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import {
  ApiConfiguration,
  PaymentStatusUpdateRequest,
  generateReadUrl,
} from '@ubax-workspace/shared-api-types';
import {
  AdminPayment,
  AdminPaymentPropertySummary,
  AdminPaymentType,
  AdminPaymentsStore,
} from '@ubax-workspace/ubax-admin-data-access';
import { DocumentPreviewComponent } from '@ubax-workspace/shared-design-system';
import { HttpClient } from '@angular/common/http';

const PAGE_SIZE = 60;
const INITIAL_TRANSACTIONS_COUNT = 6;

type PaymentTypeFilter = AdminPaymentType | 'ALL';
type KpiTone = 'blue' | 'green' | 'orange' | 'purple';

type PaymentStatusTone = 'success' | 'warning' | 'danger' | 'neutral' | 'info';

const PAYMENT_TYPE_OPTIONS: Array<{
  value: PaymentTypeFilter;
  label: string;
}> = [
  { value: 'ALL', label: 'Type' },
  { value: 'RENT', label: 'Loyer' },
  { value: 'DEPOSIT', label: 'Caution' },
  { value: 'CHARGES', label: 'Charges' },
  { value: 'COMMISSION', label: 'Commission' },
  { value: 'SALE', label: 'Vente' },
];

const STATUS_OPTIONS: Array<{
  value: PaymentStatusUpdateRequest['status'];
  label: string;
}> = [
  { value: 'PENDING', label: 'En attente' },
  { value: 'PAID', label: 'Validé' },
  { value: 'PARTIAL', label: 'Partiel' },
  { value: 'LATE', label: 'En retard' },
  { value: 'CANCELLED', label: 'Rejeté' },
];

@Component({
  selector: 'ubax-admin-payments-page',
  standalone: true,
  imports: [CommonModule, FormsModule, DocumentPreviewComponent],
  templateUrl: './payments-page.component.html',
  styleUrl: './payments-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaymentsPageComponent implements OnInit {
  protected readonly store = inject(AdminPaymentsStore);

  private readonly http = inject(HttpClient);
  private readonly apiConfig = inject(ApiConfiguration);

  protected readonly searchTerm = signal('');
  protected readonly selectedType = signal<PaymentTypeFilter>('ALL');
  protected readonly showAllTransactions = signal(false);
  protected readonly dialogOpen = signal(false);
  protected readonly treatmentStatus =
    signal<PaymentStatusUpdateRequest['status']>('PENDING');
  protected readonly treatmentNote = signal('');

  protected readonly typeOptions = PAYMENT_TYPE_OPTIONS;
  protected readonly statusOptions = STATUS_OPTIONS;
  protected readonly initialTransactionsCount = INITIAL_TRANSACTIONS_COUNT;

  protected readonly filteredPayments = computed(() => {
    const query = this.normalizeText(this.searchTerm());

    return this.store.payments().filter((payment) => {
      if (!query) {
        return true;
      }

      const haystack = this.normalizeText(
        [
          payment.reference,
          payment.recordedByName,
          payment.periodLabel,
          payment.paymentMethod,
          payment.paymentType,
          payment.status,
          payment.id,
        ]
          .filter(Boolean)
          .join(' '),
      );

      return haystack.includes(query);
    });
  });

  protected readonly recentTransactions = computed(() => {
    const payments = this.filteredPayments();

    if (this.showAllTransactions()) {
      return payments;
    }

    return payments.slice(0, INITIAL_TRANSACTIONS_COUNT);
  });

  protected readonly pendingRequests = computed(() =>
    this.store
      .payments()
      .filter((payment) => payment.status !== 'PAID')
      .slice(0, 6),
  );

  protected readonly paymentHistory = computed(() =>
    this.store
      .payments()
      .filter((payment) => payment.status === 'PAID')
      .slice(0, 6),
  );

  protected readonly viewState = computed(() => {
    if (this.store.loading() && this.store.payments().length === 0) {
      return 'loading';
    }

    if (this.store.error() && this.store.payments().length === 0) {
      return 'error';
    }

    if (!this.store.loading() && this.filteredPayments().length === 0) {
      return 'empty';
    }

    return 'success';
  });

  protected readonly selectedPayment = computed(() =>
    this.store.selectedPayment(),
  );
  protected readonly resolvedTenantNames = this.store.tenantNames;
  protected readonly resolvedPropertySummaries = this.store.propertySummaries;

  protected readonly kpis = computed(() => {
    const payments = this.store.payments();
    const currentMonthPayments = payments.filter((payment) =>
      this.isSameMonth(payment.paidDate ?? payment.createdAt),
    );
    const collectedThisMonth = currentMonthPayments.reduce(
      (sum, payment) =>
        sum +
        (payment.status === 'PAID'
          ? (payment.amountPaid ?? payment.amount ?? 0)
          : 0),
      0,
    );
    const commissionThisMonth = currentMonthPayments.reduce(
      (sum, payment) =>
        sum +
        (payment.paymentType === 'COMMISSION'
          ? (payment.amountPaid ?? payment.amount ?? 0)
          : 0),
      0,
    );
    const partnerTransfer = currentMonthPayments.reduce(
      (sum, payment) =>
        payment.paymentType === 'COMMISSION' || payment.status !== 'PAID'
          ? sum
          : sum + (payment.amountPaid ?? payment.amount ?? 0),
      0,
    );
    const overallBalance = payments.reduce(
      (sum, payment) => sum + (payment.amountPaid ?? payment.amount ?? 0),
      0,
    );

    return [
      {
        icon: 'pi pi-building-columns',
        title: 'Solde Ubax',
        subtitle: 'Compte principal',
        value: this.formatCurrency(overallBalance),
        caption: `${payments.length} transaction${payments.length > 1 ? 's' : ''}`,
        tone: 'blue' as const,
      },
      {
        icon: 'pi pi-wallet',
        title: 'Total collecté',
        subtitle: 'Ce mois',
        value: this.formatCurrency(collectedThisMonth),
        caption: `${currentMonthPayments.filter((payment) => payment.status === 'PAID').length} paiements encaissés`,
        tone: 'green' as const,
      },
      {
        icon: 'pi pi-percentage',
        title: 'Commissions Ubax',
        subtitle: 'Ce mois',
        value: this.formatCurrency(commissionThisMonth),
        caption: `${currentMonthPayments.filter((payment) => payment.paymentType === 'COMMISSION').length} commissions`,
        tone: 'orange' as const,
      },
      {
        icon: 'pi pi-send',
        title: 'Montant à virer',
        subtitle: 'Partenaires',
        value: this.formatCurrency(partnerTransfer),
        caption: `${this.pendingRequests().length} demande${this.pendingRequests().length > 1 ? 's' : ''} à traiter`,
        tone: 'purple' as const,
      },
    ] satisfies Array<{
      icon: string;
      title: string;
      subtitle: string;
      value: string;
      caption: string;
      tone: KpiTone;
    }>;
  });

  ngOnInit(): void {
    void this.loadPayments();
  }

  protected onSearch(value: string): void {
    this.searchTerm.set(value);
  }

  protected onTypeChange(value: PaymentTypeFilter): void {
    this.selectedType.set(value);
    void this.loadPayments();
  }

  protected retry(): void {
    void this.loadPayments();
  }

  protected toggleTransactions(): void {
    this.showAllTransactions.update((value) => !value);
  }

  protected async openDetails(id: string): Promise<void> {
    this.dialogOpen.set(true);

    try {
      await this.store.loadDetail(id);
      const payment = this.store.selectedPayment();

      this.treatmentStatus.set(payment?.status ?? 'PENDING');
      this.treatmentNote.set(payment?.note ?? '');
    } catch {
      // Le store expose déjà l'erreur pour l'UI.
    }
  }

  protected closeDetails(): void {
    this.dialogOpen.set(false);
    this.store.clearSelection();
  }

  protected async saveTreatment(): Promise<void> {
    const payment = this.selectedPayment();

    if (!payment?.id) {
      return;
    }

    try {
      await this.store.updateStatus(payment.id, {
        status: this.treatmentStatus(),
        note: this.treatmentNote().trim() || undefined,
        receiptUrl: payment.receiptUrl,
      });
      this.closeDetails();
    } catch {
      // Le store expose déjà l'erreur pour l'UI.
    }
  }

  protected async rejectRequest(): Promise<void> {
    const payment = this.selectedPayment();

    if (!payment?.id) {
      return;
    }

    try {
      await this.store.updateStatus(payment.id, {
        status: 'CANCELLED',
        note: this.treatmentNote().trim() || undefined,
        receiptUrl: payment.receiptUrl,
      });
      this.closeDetails();
    } catch {
      // Le store expose déjà l'erreur pour l'UI.
    }
  }

  protected async validatePayment(): Promise<void> {
    const payment = this.selectedPayment();

    if (!payment?.id) {
      return;
    }

    try {
      await this.store.updateStatus(payment.id, {
        status: 'PAID',
        amountPaid: payment.amountPaid ?? payment.amount,
        paidDate: new Date().toISOString().slice(0, 10),
        note: this.treatmentNote().trim() || undefined,
        receiptUrl: payment.receiptUrl,
      });
      this.closeDetails();
    } catch {
      // Le store expose déjà l'erreur pour l'UI.
    }
  }

  protected statusLabel(status?: string | null): string {
    switch (status) {
      case 'PAID':
        return 'Disponible';
      case 'PENDING':
        return 'En attente';
      case 'LATE':
        return 'En retard';
      case 'PARTIAL':
        return 'Partiel';
      case 'CANCELLED':
        return 'Rejeté';
      default:
        return 'Non renseigné';
    }
  }

  protected statusTone(status?: string | null): PaymentStatusTone {
    switch (status) {
      case 'PAID':
        return 'success';
      case 'PENDING':
        return 'warning';
      case 'LATE':
        return 'danger';
      case 'PARTIAL':
        return 'info';
      case 'CANCELLED':
        return 'neutral';
      default:
        return 'neutral';
    }
  }

  protected paymentTypeLabel(type?: string | null): string {
    switch (type) {
      case 'RENT':
        return 'Hôtel';
      case 'DEPOSIT':
        return 'Caution';
      case 'CHARGES':
        return 'Charges';
      case 'COMMISSION':
        return 'Agence';
      case 'SALE':
        return 'Vente';
      default:
        return 'Type';
    }
  }

  protected paymentMethodLabel(method?: string | null): string {
    switch (method) {
      case 'BANK_TRANSFER':
        return 'Virement bancaire';
      case 'MOBILE_MONEY':
        return 'Mobile money';
      case 'CHECK':
        return 'Chèque';
      case 'CASH':
        return 'Espèces';
      default:
        return 'Non renseigné';
    }
  }

  protected formatCurrency(value?: number | null): string {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      return '—';
    }

    return `${new Intl.NumberFormat('fr-FR', {
      maximumFractionDigits: 0,
    }).format(value)} FCFA`;
  }

  protected formatDate(value?: string | null): string {
    if (!value) {
      return '—';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return '—';
    }

    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(date);
  }

  protected formatDateTime(value?: string | null): string {
    if (!value) {
      return '—';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return '—';
    }

    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  }

  protected requesterName(payment: AdminPayment): string {
    return payment.recordedByName?.trim() || 'Demandeur non renseigné';
  }

  protected customerName(payment: AdminPayment): string {
    const tenantId = payment.tenantId?.trim();

    if (tenantId) {
      return (
        this.resolvedTenantNames()[tenantId] ?? this.requesterName(payment)
      );
    }

    return this.requesterName(payment);
  }

  protected customerMeta(payment: AdminPayment): string {
    return payment.tenantId?.trim() || payment.recordedById?.trim() || '—';
  }

  protected propertyLabel(payment: AdminPayment): string {
    return this.propertySummary(payment).title;
  }

  protected propertyMeta(payment: AdminPayment): string {
    const summary = this.propertySummary(payment);

    return summary.city || payment.propertyId?.trim() || '—';
  }

  protected commissionAmount(payment: AdminPayment): string {
    return payment.paymentType === 'COMMISSION'
      ? this.formatCurrency(payment.amountPaid ?? payment.amount)
      : '—';
  }

  protected partnerAmount(payment: AdminPayment): string {
    return payment.paymentType === 'COMMISSION'
      ? '—'
      : this.formatCurrency(payment.amountPaid ?? payment.amount);
  }

  protected attachmentLabel(payment: AdminPayment): string {
    const fileUrl = payment.receiptUrl?.trim();

    if (!fileUrl) {
      return 'Aucune pièce jointe';
    }

    const segments = fileUrl.split('/');
    return segments.at(-1) || 'Reçu de paiement';
  }

  readonly resolveDocumentUrl = (fileUrl: string): Promise<string | null> =>
    firstValueFrom(
      generateReadUrl(this.http, this.apiConfig.rootUrl, { fileUrl }),
    )
      .then((response) => {
        const body = response.body as {
          readUrl?: string;
          data?: { readUrl?: string };
        } | null;

        return body?.readUrl ?? body?.data?.readUrl ?? null;
      })
      .catch(() => null);

  private propertySummary(payment: AdminPayment): AdminPaymentPropertySummary {
    const propertyId = payment.propertyId?.trim();

    if (propertyId) {
      return (
        this.resolvedPropertySummaries()[propertyId] ?? {
          title:
            payment.periodLabel?.trim() || propertyId || 'Bien non renseigné',
          city: '',
        }
      );
    }

    return {
      title: payment.periodLabel?.trim() || 'Bien non renseigné',
      city: '',
    };
  }

  private async loadPayments(): Promise<void> {
    const selectedType = this.selectedType();

    try {
      await this.store.load({
        page: 0,
        size: PAGE_SIZE,
        type: selectedType === 'ALL' ? undefined : selectedType,
      });
    } catch {
      // Le store expose déjà l'erreur pour l'UI.
    }
  }

  private normalizeText(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }

  private isSameMonth(value?: string | null): boolean {
    if (!value) {
      return false;
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return false;
    }

    const now = new Date();

    return (
      date.getFullYear() === now.getFullYear() &&
      date.getMonth() === now.getMonth()
    );
  }
}

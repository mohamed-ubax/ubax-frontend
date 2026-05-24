import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  OnInit,
  signal,
  untracked,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { UbaxPaginatorComponent } from '@ubax-workspace/shared-ui';
import {
  FINANCE_ASSETS,
  FINANCE_SUMMARY_CARDS,
  FINANCE_TRANSACTION_TYPE_OPTIONS,
} from '../../constants/finance-ui.constants';
import type { FinanceTransactionFilterValue } from '../../types/finance.types';
import { PaymentsStore } from '@ubax-workspace/ubax-web-data-access';
import {
  PaymentCreateRequest,
  PaymentStatusUpdateRequest,
} from '@ubax-workspace/shared-api-types';
import { NouvelleTransactionDialogComponent } from '../../components/nouvelle-transaction-dialog/nouvelle-transaction-dialog.component';
import { UpdateStatutPaiementDialogComponent } from '../../components/update-statut-paiement-dialog/update-statut-paiement-dialog.component';

const PAGE_SIZE = 8;

@Component({
  selector: 'ubax-transactions-history-page',
  standalone: true,
  imports: [
    RouterLink,
    FormsModule,
    SelectModule,
    UbaxPaginatorComponent,
    NouvelleTransactionDialogComponent,
    UpdateStatutPaiementDialogComponent,
  ],
  templateUrl: './transactions-history-page.component.html',
  styleUrl: './transactions-history-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TransactionsHistoryPageComponent implements OnInit {
  private readonly paymentsStore = inject(PaymentsStore);
  private readonly syncTenantNamesEffect = effect(() => {
    const tenantIds = this.paymentsStore.paymentTenantIds();

    if (tenantIds.length === 0) {
      return;
    }

    untracked(() => this.paymentsStore.ensureTenantNames(tenantIds));
  });

  protected readonly isNewTransactionOpen = signal(false);
  protected readonly selectedPaymentId = signal<string | null>(null);
  protected readonly selectedPaymentStatus = signal('PENDING');
  protected readonly isUpdateStatusOpen = signal(false);

  protected readonly assets = FINANCE_ASSETS;
  protected readonly transactionTypeOptions = FINANCE_TRANSACTION_TYPE_OPTIONS;
  protected readonly currentPage = signal(1);
  protected readonly selectedType =
    signal<FinanceTransactionFilterValue>('all');
  protected readonly searchQuery = signal('');
  protected readonly isBalanceHidden = signal(false);

  protected readonly isLoadingDashboard = computed(() =>
    this.paymentsStore.isLoadingDashboard(),
  );

  protected readonly kpiCards = computed(() => {
    const encaissement = this.paymentsStore.kpiEncaissement();
    const depenses = this.paymentsStore.kpiDepenses();
    const loyerAttente = this.paymentsStore.kpiLoyerAttente();
    const paidCount = this.paymentsStore.kpiPaidCount();
    const pendingCount = this.paymentsStore.kpiPendingCount();
    const lateCount = this.paymentsStore.kpiLateCount();

    const pendingLabel =
      pendingCount != null
        ? `${pendingCount} paiement${pendingCount !== 1 ? 's' : ''} en attente${lateCount ? `, dont ${lateCount} en retard` : ''}`
        : undefined;

    return [
      {
        ...FINANCE_SUMMARY_CARDS[0],
        amount: encaissement ?? '—',
        count:
          paidCount != null
            ? `${paidCount} paiement${paidCount !== 1 ? 's' : ''} encaissé${paidCount !== 1 ? 's' : ''}`
            : undefined,
      },
      { ...FINANCE_SUMMARY_CARDS[1], amount: depenses ?? '—' },
      {
        ...FINANCE_SUMMARY_CARDS[2],
        amount: loyerAttente ?? '—',
        count: pendingLabel,
      },
    ];
  });

  protected readonly balanceCard = computed(() => ({
    ...FINANCE_SUMMARY_CARDS[3],
    amount: this.paymentsStore.kpiSolde() ?? '—',
  }));

  protected readonly balanceAmount = computed(() =>
    this.isBalanceHidden()
      ? '•••••••• FCFA'
      : (this.paymentsStore.kpiSolde() ?? '—'),
  );

  protected readonly isLoading = computed(() => this.paymentsStore.loading());
  protected readonly isCreatingPayment = computed(() =>
    this.paymentsStore.creatingPayment(),
  );
  protected readonly createPaymentError = computed(() =>
    this.paymentsStore.createPaymentError(),
  );
  protected readonly isUpdatingStatus = computed(
    () => !!this.paymentsStore.updatingStatusId(),
  );
  protected readonly updateStatusError = computed(() =>
    this.paymentsStore.updateStatusError(),
  );

  protected readonly filteredTransactions = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    const selectedType = this.selectedType();
    const rows = this.paymentsStore.paymentRows();

    return rows.filter((t) => {
      const matchesType = selectedType === 'all' || t.type === selectedType;
      const matchesQuery =
        query.length === 0 ||
        [t.date, t.reference, t.property, t.tenant, t.amount]
          .join(' ')
          .toLowerCase()
          .includes(query);
      return matchesType && matchesQuery;
    });
  });

  protected readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.filteredTransactions().length / PAGE_SIZE)),
  );

  protected readonly pagedTransactions = computed(() => {
    const start = (this.currentPage() - 1) * PAGE_SIZE;
    return this.filteredTransactions()
      .slice(start, start + PAGE_SIZE)
      .map((t, i) => ({ ...t, uid: `tx-${t.id}-${i}` }));
  });

  ngOnInit(): void {
    this.paymentsStore.loadDashboard();
    this.paymentsStore.load?.({
      pageable: { page: 0, size: 100, sort: [] },
    });
  }

  protected setSelectedType(value: FinanceTransactionFilterValue): void {
    if (value === 'all' || value === 'loyer' || value === 'depense') {
      this.selectedType.set(value);
      this.currentPage.set(1);
    }
  }

  protected setSearchQuery(value: string): void {
    this.searchQuery.set(value);
    this.currentPage.set(1);
  }

  protected toggleBalanceVisibility(): void {
    this.isBalanceHidden.update((v) => !v);
  }

  protected openNewTransaction(): void {
    this.isNewTransactionOpen.set(true);
    this.paymentsStore.clearPaymentFeedback();
  }

  protected closeNewTransaction(): void {
    this.isNewTransactionOpen.set(false);
  }

  protected submitNewTransaction(body: PaymentCreateRequest): void {
    this.paymentsStore.createPayment(body);
  }

  protected openUpdateStatus(
    paymentId: string,
    rawStatus: string | undefined,
  ): void {
    this.selectedPaymentId.set(paymentId);
    this.selectedPaymentStatus.set(rawStatus ?? 'PENDING');
    this.isUpdateStatusOpen.set(true);
    this.paymentsStore.clearPaymentFeedback();
  }

  protected closeUpdateStatus(): void {
    this.isUpdateStatusOpen.set(false);
    this.selectedPaymentId.set(null);
  }

  protected submitStatusUpdate(body: PaymentStatusUpdateRequest): void {
    const id = this.selectedPaymentId();
    if (!id) return;
    this.paymentsStore.updatePaymentStatus({ id, body });
  }
}

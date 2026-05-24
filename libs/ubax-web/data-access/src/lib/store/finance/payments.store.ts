import { computed, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { tapResponse } from '@ngrx/operators';
import {
  patchState,
  signalStore,
  withComputed,
  withMethods,
  withState,
} from '@ngrx/signals';
import { addEntity, setEntity } from '@ngrx/signals/entities';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import {
  withApiResource,
  resolveHttpErrorMessage,
} from '@ubax-workspace/shared-data-access';
import {
  AgencyDashboardResponse,
  ApiConfiguration,
  create5,
  delete2,
  getAgencyDashboard,
  getById6,
  list3,
  listLate,
  PaymentCreateRequest,
  PaymentResponse,
  PaymentStatusUpdateRequest,
  updateStatus2,
} from '@ubax-workspace/shared-api-types';
import { exhaustMap, pipe, switchMap, tap } from 'rxjs';

export type Payment = PaymentResponse & { id: string };

type FinanceState = {
  latePayments: Payment[];
  loadingLate: boolean;
  lateError: string | null;
  dashboard: AgencyDashboardResponse | null;
  loadingDashboard: boolean;
  dashboardError: string | null;
  creatingPayment: boolean;
  createPaymentError: string | null;
  lastCreatedPaymentId: string | null;
  updatingStatusId: string | null;
  updateStatusError: string | null;
};

const initialFinanceState: FinanceState = {
  latePayments: [],
  loadingLate: false,
  lateError: null,
  dashboard: null,
  loadingDashboard: false,
  dashboardError: null,
  creatingPayment: false,
  createPaymentError: null,
  lastCreatedPaymentId: null,
  updatingStatusId: null,
  updateStatusError: null,
};

function normalizePayment(raw: unknown, fallbackId = ''): Payment {
  if (!raw || typeof raw !== 'object') return { id: fallbackId };
  const r = raw as Record<string, unknown>;
  const src =
    r['data'] && typeof r['data'] === 'object'
      ? (r['data'] as Record<string, unknown>)
      : r;
  return { ...(src as PaymentResponse), id: (src['id'] as string) ?? fallbackId };
}

function extractPaymentList(raw: unknown): Payment[] {
  if (!raw || typeof raw !== 'object') return [];
  const r = raw as Record<string, unknown>;
  let items: unknown[] = [];

  if (Array.isArray(r['results'])) {
    items = r['results'];
  } else if (Array.isArray(r['content'])) {
    items = r['content'];
  } else if (r['data'] && typeof r['data'] === 'object') {
    const data = r['data'] as Record<string, unknown>;
    if (Array.isArray(data['results'])) items = data['results'];
    else if (Array.isArray(data['content'])) items = data['content'];
  }

  return items.map((item) => normalizePayment(item));
}

function formatAmount(amount: number | undefined): string {
  if (amount == null) return '— FCFA';
  return `${amount.toLocaleString('fr-FR')} FCFA`;
}

function formatDate(iso: string | undefined): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('fr-FR');
  } catch {
    return iso;
  }
}

function computeDelayDays(dueDate: string | undefined): string {
  if (!dueDate) return '—';
  const due = new Date(dueDate);
  const now = new Date();
  const diffMs = now.getTime() - due.getTime();
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  return days > 0 ? `${days} jours` : '—';
}

export function mapPaymentToRow(p: Payment) {
  const isRent = p.paymentType === 'RENT';
  return {
    id: p.id,
    date: formatDate(p.paidDate ?? p.dueDate ?? p.createdAt),
    reference: p.reference ?? '—',
    type: isRent ? ('loyer' as const) : ('depense' as const),
    property: p.periodLabel ?? '—',
    tenant: p.recordedByName ?? '—',
    amount: formatAmount(p.amount),
    status:
      p.status === 'PAID'
        ? ('payee' as const)
        : ('en-attente' as const),
    rawStatus: p.status,
  };
}

export function mapLatePaymentToRow(p: Payment) {
  return {
    id: p.id,
    uid: `late-${p.id}`,
    tenant: p.recordedByName ?? '—',
    property: p.periodLabel ?? '—',
    amount: formatAmount(p.amount),
    dueDate: formatDate(p.dueDate),
    delay: computeDelayDays(p.dueDate),
    penalty: '—',
    period: p.periodLabel ?? '—',
  };
}

export const PaymentsStore = signalStore(
  { providedIn: 'root' },
  withApiResource<Payment, typeof list3, typeof getById6, typeof create5, typeof updateStatus2, typeof delete2>({
    list: list3,
    getById: getById6,
    create: create5,
    update: updateStatus2,
    delete: delete2,
    buildGetByIdParams: (id) => ({ id }),
    buildDeleteParams: (id) => ({ id }),
    idSelector: (p) => p.id,
    mapList: extractPaymentList,
    mapGetById: normalizePayment,
    mapCreate: normalizePayment,
    mapUpdate: (raw) => normalizePayment(raw),
  }),
  withState(initialFinanceState),
  withComputed(({ entities, dashboard, latePayments }) => ({
    paymentRows: computed(() => entities().map(mapPaymentToRow)),
    latePaymentRows: computed(() => latePayments().map(mapLatePaymentToRow)),
    kpiEncaissement: computed(() =>
      dashboard()?.totalRevenue != null
        ? formatAmount(dashboard()!.totalRevenue)
        : null,
    ),
    kpiDepenses: computed(() =>
      dashboard()?.totalExpenses != null
        ? formatAmount(dashboard()!.totalExpenses)
        : null,
    ),
    kpiLoyerAttente: computed(() =>
      dashboard()?.overdueAmount != null
        ? formatAmount(dashboard()!.overdueAmount)
        : null,
    ),
    kpiSolde: computed(() =>
      dashboard()?.netRevenue != null
        ? formatAmount(dashboard()!.netRevenue)
        : null,
    ),
    kpiPendingCount: computed(() => dashboard()?.pendingPaymentsCount ?? null),
    kpiLateCount: computed(() => dashboard()?.latePaymentsCount ?? null),
    kpiPaidCount: computed(() => dashboard()?.paidPaymentsCount ?? null),
    kpiRecoveryRate: computed(() => dashboard()?.recoveryRate ?? null),
    kpiActiveContracts: computed(() => dashboard()?.activeContracts ?? null),
    expensesByCategory: computed(() => dashboard()?.expensesByCategory ?? []),
  })),
  withMethods(
    (store, http = inject(HttpClient), apiConfig = inject(ApiConfiguration)) => ({
      loadLatePayments: rxMethod<void>(
        pipe(
          tap(() => patchState(store, { loadingLate: true, lateError: null })),
          switchMap(() =>
            listLate(http, apiConfig.rootUrl).pipe(
              tapResponse({
                next: (r) => {
                  const raw = r.body as unknown;
                  let items: Payment[] = [];
                  if (Array.isArray(raw)) {
                    items = raw.map((x) => normalizePayment(x));
                  } else if (raw && typeof raw === 'object') {
                    const rec = raw as Record<string, unknown>;
                    const data = rec['data'];
                    if (Array.isArray(data)) {
                      items = data.map((x) => normalizePayment(x));
                    } else {
                      items = extractPaymentList(raw);
                    }
                  }
                  patchState(store, { latePayments: items, loadingLate: false });
                },
                error: (err: HttpErrorResponse) =>
                  patchState(store, {
                    loadingLate: false,
                    lateError: resolveHttpErrorMessage(err, 'Erreur chargement loyers en retard'),
                  }),
              }),
            ),
          ),
        ),
      ),

      loadDashboard: rxMethod<{ from?: string; to?: string } | void>(
        pipe(
          tap(() => patchState(store, { loadingDashboard: true, dashboardError: null })),
          switchMap((params) =>
            getAgencyDashboard(http, apiConfig.rootUrl, params ?? undefined).pipe(
              tapResponse({
                next: (r) => {
                  const raw = r.body as unknown;
                  let data: AgencyDashboardResponse | null = null;
                  if (raw && typeof raw === 'object') {
                    const rec = raw as Record<string, unknown>;
                    data = (rec['data'] ?? raw) as AgencyDashboardResponse;
                  }
                  patchState(store, { dashboard: data, loadingDashboard: false });
                },
                error: (err: HttpErrorResponse) =>
                  patchState(store, {
                    loadingDashboard: false,
                    dashboardError: resolveHttpErrorMessage(err, 'Erreur chargement tableau de bord'),
                  }),
              }),
            ),
          ),
        ),
      ),

      createPayment: rxMethod<PaymentCreateRequest>(
        pipe(
          tap(() =>
            patchState(store, {
              creatingPayment: true,
              createPaymentError: null,
              lastCreatedPaymentId: null,
            }),
          ),
          exhaustMap((body) =>
            create5(http, apiConfig.rootUrl, { body }).pipe(
              tapResponse({
                next: (r) => {
                  const payment = normalizePayment(r.body);
                  patchState(
                    store,
                    addEntity(payment, { selectId: (p: Payment) => p.id }),
                    {
                      creatingPayment: false,
                      lastCreatedPaymentId: payment.id,
                    },
                  );
                },
                error: (err: HttpErrorResponse) =>
                  patchState(store, {
                    creatingPayment: false,
                    createPaymentError: resolveHttpErrorMessage(
                      err,
                      "Impossible d'enregistrer le paiement.",
                    ),
                  }),
              }),
            ),
          ),
        ),
      ),

      updatePaymentStatus: rxMethod<{ id: string; body: PaymentStatusUpdateRequest }>(
        pipe(
          tap(({ id }) =>
            patchState(store, { updatingStatusId: id, updateStatusError: null }),
          ),
          exhaustMap(({ id, body }) =>
            updateStatus2(http, apiConfig.rootUrl, { id, body }).pipe(
              tapResponse({
                next: (r) => {
                  const updated = normalizePayment(r.body, id);
                  patchState(
                    store,
                    setEntity(updated, { selectId: (p: Payment) => p.id }),
                    { updatingStatusId: null },
                  );
                },
                error: (err: HttpErrorResponse) =>
                  patchState(store, {
                    updatingStatusId: null,
                    updateStatusError: resolveHttpErrorMessage(
                      err,
                      'Impossible de mettre à jour le statut.',
                    ),
                  }),
              }),
            ),
          ),
        ),
      ),

      clearPaymentFeedback(): void {
        patchState(store, {
          createPaymentError: null,
          lastCreatedPaymentId: null,
          updateStatusError: null,
        });
      },
    }),
  ),
);

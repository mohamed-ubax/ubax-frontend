import { inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { tapResponse } from '@ngrx/operators';
import {
  patchState,
  signalStore,
  withMethods,
  withState,
} from '@ngrx/signals';
import { addEntity } from '@ngrx/signals/entities';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import {
  withApiResource,
  resolveHttpErrorMessage,
} from '@ubax-workspace/shared-data-access';
import {
  ApiConfiguration,
  create7,
  delete3,
  ExpenseCreateRequest,
  ExpenseResponse,
  getById8,
  list5,
} from '@ubax-workspace/shared-api-types';
import { exhaustMap, pipe, tap } from 'rxjs';

export type Expense = ExpenseResponse & { id: string };

type ExpensesState = {
  creatingExpense: boolean;
  createExpenseError: string | null;
  lastCreatedExpenseId: string | null;
};

const initialState: ExpensesState = {
  creatingExpense: false,
  createExpenseError: null,
  lastCreatedExpenseId: null,
};

function normalizeExpense(raw: unknown, fallbackId = ''): Expense {
  if (!raw || typeof raw !== 'object') return { id: fallbackId };
  const r = raw as Record<string, unknown>;
  const src =
    r['data'] && typeof r['data'] === 'object'
      ? (r['data'] as Record<string, unknown>)
      : r;
  return { ...(src as ExpenseResponse), id: (src['id'] as string) ?? fallbackId };
}

function extractExpenseList(raw: unknown): Expense[] {
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

  return items.map((item) => normalizeExpense(item));
}

function formatExpenseAmount(amount: number | undefined): string {
  if (amount == null) return '— FCFA';
  return `${amount.toLocaleString('fr-FR')} FCFA`;
}

function formatExpenseDate(iso: string | undefined): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('fr-FR');
  } catch {
    return iso;
  }
}

const CATEGORY_LABELS: Record<string, string> = {
  MAINTENANCE: 'Entretien',
  MARKETING: 'Marketing',
  SALARY: 'Salaire',
  UTILITIES: 'Charges',
  TAX: 'Taxes',
  OTHER: 'Autre',
};

export function mapExpenseToRow(e: Expense) {
  return {
    id: e.id,
    date: formatExpenseDate(e.expenseDate ?? e.createdAt),
    reference: e.invoiceReference ?? '—',
    type: 'depense' as const,
    category: CATEGORY_LABELS[e.category ?? ''] ?? e.category ?? '—',
    label: e.label ?? '—',
    provider: e.provider ?? '—',
    amount: formatExpenseAmount(e.amount),
    status: 'payee' as const,
  };
}

export const ExpensesStore = signalStore(
  { providedIn: 'root' },
  withApiResource<Expense, typeof list5, typeof getById8, typeof create7, undefined, typeof delete3>({
    list: list5,
    getById: getById8,
    create: create7,
    delete: delete3,
    buildGetByIdParams: (id) => ({ id }),
    buildDeleteParams: (id) => ({ id }),
    idSelector: (e) => e.id,
    mapList: extractExpenseList,
    mapGetById: normalizeExpense,
    mapCreate: normalizeExpense,
  }),
  withState(initialState),
  withMethods(
    (store, http = inject(HttpClient), apiConfig = inject(ApiConfiguration)) => ({
      createExpense: rxMethod<ExpenseCreateRequest>(
        pipe(
          tap(() =>
            patchState(store, {
              creatingExpense: true,
              createExpenseError: null,
              lastCreatedExpenseId: null,
            }),
          ),
          exhaustMap((body) =>
            create7(http, apiConfig.rootUrl, { body }).pipe(
              tapResponse({
                next: (r) => {
                  const expense = normalizeExpense(r.body);
                  patchState(
                    store,
                    addEntity(expense, { selectId: (e: Expense) => e.id }),
                    {
                      creatingExpense: false,
                      lastCreatedExpenseId: expense.id,
                    },
                  );
                },
                error: (err: HttpErrorResponse) =>
                  patchState(store, {
                    creatingExpense: false,
                    createExpenseError: resolveHttpErrorMessage(
                      err,
                      "Impossible d'enregistrer la dépense.",
                    ),
                  }),
              }),
            ),
          ),
        ),
      ),

      clearExpenseFeedback(): void {
        patchState(store, {
          createExpenseError: null,
          lastCreatedExpenseId: null,
        });
      },
    }),
  ),
);

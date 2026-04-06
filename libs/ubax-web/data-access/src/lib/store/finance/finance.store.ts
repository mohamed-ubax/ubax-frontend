import { computed, inject } from '@angular/core';
import { tapResponse } from '@ngrx/operators';
import {
  patchState,
  signalStore,
  withComputed,
  withMethods,
  withState,
} from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap } from 'rxjs';
import { Depense, Facture, Recette, Transaction } from '../../models/finance.model';
import { FinanceService } from '../../services/finance.service';

interface FinanceState {
  depenses: Depense[];
  recettes: Recette[];
  transactions: Transaction[];
  factures: Facture[];
  loading: boolean;
  error: string | null;
}

export const FinanceStore = signalStore(
  { providedIn: 'root' },
  withState<FinanceState>({
    depenses: [],
    recettes: [],
    transactions: [],
    factures: [],
    loading: false,
    error: null,
  }),
  withComputed(({ depenses, recettes, factures }) => ({
    totalDepenses: computed(() => depenses().reduce((sum, d) => sum + d.montant, 0)),
    totalRecettes: computed(() => recettes().reduce((sum, r) => sum + r.montant, 0)),
    solde: computed(() => recettes().reduce((s, r) => s + r.montant, 0) - depenses().reduce((s, d) => s + d.montant, 0)),
    loyersEnRetard: computed(() => factures().filter((f) => f.statut === 'en_retard')),
    facturesEnAttente: computed(() => factures().filter((f) => f.statut === 'en_attente')),
  })),
  withMethods((store, svc = inject(FinanceService)) => ({
    loadDepenses: rxMethod<void>(
      pipe(
        tap(() => patchState(store, { loading: true })),
        switchMap(() =>
          svc.getDepenses().pipe(
            tapResponse({
              next: (depenses) => patchState(store, { depenses, loading: false }),
              error: () => patchState(store, { loading: false, error: 'Erreur chargement dépenses' }),
            }),
          ),
        ),
      ),
    ),

    loadRecettes: rxMethod<void>(
      pipe(
        tap(() => patchState(store, { loading: true })),
        switchMap(() =>
          svc.getRecettes().pipe(
            tapResponse({
              next: (recettes) => patchState(store, { recettes, loading: false }),
              error: () => patchState(store, { loading: false, error: 'Erreur chargement recettes' }),
            }),
          ),
        ),
      ),
    ),

    loadTransactions: rxMethod<void>(
      pipe(
        switchMap(() =>
          svc.getTransactions().pipe(
            tapResponse({
              next: (transactions) => patchState(store, { transactions }),
              error: () => patchState(store, { error: 'Erreur chargement transactions' }),
            }),
          ),
        ),
      ),
    ),

    loadFactures: rxMethod<void>(
      pipe(
        switchMap(() =>
          svc.getFactures().pipe(
            tapResponse({
              next: (factures) => patchState(store, { factures }),
              error: () => patchState(store, { error: 'Erreur chargement factures' }),
            }),
          ),
        ),
      ),
    ),

    addDepense: rxMethod<Omit<Depense, 'id'>>(
      pipe(
        switchMap((payload) =>
          svc.createDepense(payload).pipe(
            tapResponse({
              next: (d) => patchState(store, { depenses: [...store.depenses(), d] }),
              error: () => patchState(store, { error: 'Erreur création dépense' }),
            }),
          ),
        ),
      ),
    ),
  })),
);

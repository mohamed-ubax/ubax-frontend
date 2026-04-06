import { Route } from '@angular/router';

export const financeRoutes: Route[] = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/finance-overview-page/finance-overview-page.component').then(
        (m) => m.FinanceOverviewPageComponent,
      ),
  },
  {
    path: 'facturation',
    loadComponent: () =>
      import('./pages/facturation-page/facturation-page.component').then(
        (m) => m.FacturationPageComponent,
      ),
  },
  {
    path: 'recettes',
    loadComponent: () =>
      import('./pages/recettes-history-page/recettes-history-page.component').then(
        (m) => m.RecettesHistoryPageComponent,
      ),
  },
  {
    path: 'depenses',
    loadComponent: () =>
      import('./pages/depenses-list-page/depenses-list-page.component').then(
        (m) => m.DepensesListPageComponent,
      ),
  },
  {
    path: 'depenses/ajouter',
    loadComponent: () =>
      import('./pages/depense-add-page/depense-add-page.component').then(
        (m) => m.DepenseAddPageComponent,
      ),
  },
  {
    path: 'transactions',
    loadComponent: () =>
      import('./pages/transactions-history-page/transactions-history-page.component').then(
        (m) => m.TransactionsHistoryPageComponent,
      ),
  },
  {
    path: 'loyers-retard',
    loadComponent: () =>
      import('./pages/loyers-retard-page/loyers-retard-page.component').then(
        (m) => m.LoyersRetardPageComponent,
      ),
  },
];

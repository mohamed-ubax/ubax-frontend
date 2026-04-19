import { Route } from '@angular/router';

export const immobilierRoutes: Route[] = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/biens-list-page/biens-list-page.component').then(
        (m) => m.BiensListPageComponent,
      ),
  },
  {
    path: 'ajouter',
    loadComponent: () =>
      import('./pages/bien-add-page/bien-add-page.component').then(
        (m) => m.BienAddPageComponent,
      ),
  },
  {
    path: 'bailleurs/:id',
    loadComponent: () =>
      import(
        './pages/bailleur-detail-page/bailleur-detail-page.component'
      ).then((m) => m.BailleurDetailPageComponent),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./pages/bien-detail-page/bien-detail-page.component').then(
        (m) => m.BienDetailPageComponent,
      ),
  },
];

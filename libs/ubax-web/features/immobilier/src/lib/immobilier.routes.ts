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
    path: ':id/modifier',
    loadComponent: () =>
      import('./pages/bien-add-page/bien-add-page.component').then(
        (m) => m.BienAddPageComponent,
      ),
  },
  {
    path: 'bailleurs',
    loadComponent: () =>
      import('./pages/bailleurs-list-page/bailleurs-list-page.component').then(
        (m) => m.BailleursListPageComponent,
      ),
  },
  {
    path: 'bailleurs/demandes',
    loadComponent: () =>
      import(
        './pages/bailleur-applications-list-page/bailleur-applications-list-page.component'
      ).then((m) => m.BailleurApplicationsListPageComponent),
  },
  {
    path: 'bailleurs/demandes/:id',
    loadComponent: () =>
      import(
        './pages/bailleur-application-detail-page/bailleur-application-detail-page.component'
      ).then((m) => m.BailleurApplicationDetailPageComponent),
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

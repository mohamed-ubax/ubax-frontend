import { Route } from '@angular/router';

export const contratsRoutes: Route[] = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/contrats-list-page/contrats-list-page.component').then(
        (m) => m.ContratsListPageComponent,
      ),
  },
  {
    path: 'mandats',
    loadComponent: () =>
      import('./pages/mandats-list-page/mandats-list-page.component').then(
        (m) => m.MandatsListPageComponent,
      ),
  },
  {
    path: 'mandats/nouveau',
    loadComponent: () =>
      import('./pages/mandats-add-page/mandats-add-page.component').then(
        (m) => m.MandatsAddPageComponent,
      ),
  },
  {
    path: 'mandats/:id',
    loadComponent: () =>
      import('./pages/mandats-detail-page/mandats-detail-page.component').then(
        (m) => m.MandatsDetailPageComponent,
      ),
  },
  {
    path: 'nouveau',
    loadComponent: () =>
      import('./pages/contrats-add-page/contrats-add-page.component').then(
        (m) => m.ContratsAddPageComponent,
      ),
  },
  {
    path: ':id/modifier',
    loadComponent: () =>
      import('./pages/contrats-edit-page/contrats-edit-page.component').then(
        (m) => m.ContratsEditPageComponent,
      ),
  },
  {
    path: ':id',
    loadComponent: () =>
      import(
        './pages/contrats-detail-page/contrats-detail-page.component'
      ).then((m) => m.ContratsDetailPageComponent),
  },
];

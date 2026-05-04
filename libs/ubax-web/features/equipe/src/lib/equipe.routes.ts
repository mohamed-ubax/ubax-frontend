import { Route } from '@angular/router';

export const equipeRoutes: Route[] = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/equipe-page/equipe-page.component').then(
        (m) => m.EquipePageComponent,
      ),
  },
];

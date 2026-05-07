import { Route } from '@angular/router';

export const profilRoutes: Route[] = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/profil-page/profil-page.component').then(
        (m) => m.ProfilPageComponent,
      ),
  },
];

import { Route } from '@angular/router';

export const archivageRoutes: Route[] = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/archivage-page/archivage-page.component').then(
        (m) => m.ArchivagePageComponent,
      ),
  },
];

import { Route } from '@angular/router';

export const dashboardRoutes: Route[] = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/dashboard-dg-page/dashboard-dg-page.component').then(
        (m) => m.DashboardDgPageComponent,
      ),
  },
];

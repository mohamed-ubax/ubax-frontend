import { Route } from '@angular/router';

export const agencyClientsRoutes: Route[] = [
  {
    path: '',
    loadComponent: () =>
      import(
        './pages/agency-clients-list-page/agency-clients-list-page.component'
      ).then((m) => m.AgencyClientsListPageComponent),
  },
];

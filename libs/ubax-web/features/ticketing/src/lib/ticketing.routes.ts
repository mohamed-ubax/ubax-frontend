import { Route } from '@angular/router';

export const ticketingRoutes: Route[] = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/tickets-list-page/tickets-list-page.component').then(
        (m) => m.TicketsListPageComponent,
      ),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./pages/ticket-detail-page/ticket-detail-page.component').then(
        (m) => m.TicketDetailPageComponent,
      ),
  },
];

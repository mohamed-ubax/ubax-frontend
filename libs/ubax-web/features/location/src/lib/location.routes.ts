import { Route } from '@angular/router';

export const locationRoutes: Route[] = [
  {
    path: '',
    loadComponent: () =>
      import(
        './pages/reservations-overview-page/reservations-overview-page.component'
      ).then((m) => m.ReservationsOverviewPageComponent),
  },
  {
    path: 'liste',
    loadComponent: () =>
      import('./pages/reservation-page/reservation-page.component').then(
        (m) => m.ReservationPageComponent,
      ),
  },
  {
    path: 'calendrier',
    loadComponent: () =>
      import(
        './pages/reservation-calendar-page/reservation-calendar-page.component'
      ).then((m) => m.ReservationCalendarPageComponent),
  },
  {
    path: 'ajouter',
    loadComponent: () =>
      import(
        './pages/ajouter-reservation-page/ajouter-reservation-page.component'
      ).then((m) => m.AjouterReservationPageComponent),
  },
  {
    path: 'locataires/:id',
    loadComponent: () =>
      import(
        './pages/locataire-detail-page/locataire-detail-page.component'
      ).then((m) => m.LocataireDetailPageComponent),
  },
  {
    path: ':id',
    loadComponent: () =>
      import(
        './pages/reservation-detail-page/reservation-detail-page.component'
      ).then((m) => m.ReservationDetailPageComponent),
  },
];

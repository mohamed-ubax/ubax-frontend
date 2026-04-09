import { Route } from '@angular/router';

export const locationRoutes: Route[] = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/reservation-page/reservation-page.component').then(
        (m) => m.ReservationPageComponent,
      ),
  },
  {
    path: 'ajouter',
    loadComponent: () =>
      import('./pages/ajouter-reservation-page/ajouter-reservation-page.component').then(
        (m) => m.AjouterReservationPageComponent,
      ),
  },
  {
    path: 'locataires/:id',
    loadComponent: () =>
      import('./pages/locataire-detail-page/locataire-detail-page.component').then(
        (m) => m.LocataireDetailPageComponent,
      ),
  },
];

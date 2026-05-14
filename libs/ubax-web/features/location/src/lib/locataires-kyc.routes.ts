import { Route } from '@angular/router';

export const locatairesKycRoutes: Route[] = [
  {
    path: '',
    loadComponent: () =>
      import(
        './pages/locataires-kyc-list-page/locataires-kyc-list-page.component'
      ).then((m) => m.LocatairesKycListPageComponent),
  },
  {
    path: ':id',
    loadComponent: () =>
      import(
        './pages/locataire-kyc-detail-page/locataire-kyc-detail-page.component'
      ).then((m) => m.LocataireKycDetailPageComponent),
  },
];

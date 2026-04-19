import { inject } from '@angular/core';
import { CanMatchFn, Route } from '@angular/router';
import {
  AuthStore,
  ROUTE_ROLE_ACCESS,
  Role,
} from '@ubax-workspace/ubax-web-data-access';

const forRole =
  (...roles: Role[]): CanMatchFn =>
  () => {
    const userRole = inject(AuthStore).role();
    return !!userRole && roles.includes(userRole);
  };

export const demandesRoutes: Route[] = [
  {
    path: '',
    canMatch: [forRole(...ROUTE_ROLE_ACCESS.demandesCommercial)],
    loadComponent: () =>
      import(
        './pages/demandes-commercial-page/demandes-commercial-page.component'
      ).then((m) => m.DemandesCommercialPageComponent),
  },
  {
    path: '',
    canMatch: [forRole(...ROUTE_ROLE_ACCESS.demandesSav)],
    loadComponent: () =>
      import('./pages/demandes-sav-page/demandes-sav-page.component').then(
        (m) => m.DemandesSavPageComponent,
      ),
  },
  {
    path: '',
    canMatch: [forRole(...ROUTE_ROLE_ACCESS.demandesComptable)],
    loadComponent: () =>
      import(
        './pages/demandes-comptable-page/demandes-comptable-page.component'
      ).then((m) => m.DemandesComptablePageComponent),
  },
  {
    path: 'commercial',
    canMatch: [forRole(...ROUTE_ROLE_ACCESS.demandesCommercial)],
    loadComponent: () =>
      import(
        './pages/demandes-commercial-page/demandes-commercial-page.component'
      ).then((m) => m.DemandesCommercialPageComponent),
  },
  {
    path: 'sav',
    canMatch: [forRole(...ROUTE_ROLE_ACCESS.demandesSav)],
    loadComponent: () =>
      import('./pages/demandes-sav-page/demandes-sav-page.component').then(
        (m) => m.DemandesSavPageComponent,
      ),
  },
  {
    path: 'comptable',
    canMatch: [forRole(...ROUTE_ROLE_ACCESS.demandesComptable)],
    loadComponent: () =>
      import(
        './pages/demandes-comptable-page/demandes-comptable-page.component'
      ).then((m) => m.DemandesComptablePageComponent),
  },
];

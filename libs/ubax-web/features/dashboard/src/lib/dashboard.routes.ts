import { inject } from '@angular/core';
import { CanMatchFn, Route } from '@angular/router';
import { AuthStore, Role } from '@ubax-workspace/ubax-web-data-access';

/** Retourne true uniquement si le rôle courant est dans la liste. */
const forRole =
  (...roles: Role[]): CanMatchFn =>
  () => {
    const userRole = inject(AuthStore).role();
    return !!userRole && roles.includes(userRole);
  };

export const dashboardRoutes: Route[] = [
  {
    path: '',
    canMatch: [forRole(Role.DG)],
    loadComponent: () =>
      import('./pages/dashboard-dg-page/dashboard-dg-page.component').then(
        (m) => m.DashboardDgPageComponent,
      ),
  },
  {
    path: '',
    canMatch: [forRole(Role.COMMERCIAL)],
    loadComponent: () =>
      import(
        './pages/dashboard-commercial-page/dashboard-commercial-page.component'
      ).then((m) => m.DashboardCommercialPageComponent),
  },
  {
    path: '',
    canMatch: [forRole(Role.COMPTABLE)],
    loadComponent: () =>
      import(
        './pages/dashboard-comptable-page/dashboard-comptable-page.component'
      ).then((m) => m.DashboardComptablePageComponent),
  },
  {
    path: '',
    canMatch: [forRole(Role.SAV)],
    loadComponent: () =>
      import('./pages/dashboard-sav-page/dashboard-sav-page.component').then(
        (m) => m.DashboardSavPageComponent,
      ),
  },
  {
    path: '',
    canMatch: [forRole(Role.HOTEL)],
    loadComponent: () =>
      import('@ubax-workspace/ubax-web-hotel').then(
        (m) => m.HotelOverviewPageComponent,
      ),
  },
];

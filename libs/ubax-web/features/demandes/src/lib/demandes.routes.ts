import { Route } from '@angular/router';
import { Role } from '@ubax-workspace/ubax-web-data-access';

export const demandesRoutes: Route[] = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/demandes-commercial-page/demandes-commercial-page.component').then(
        (m) => m.DemandesCommercialPageComponent,
      ),
    data: { roles: [Role.COMMERCIAL, Role.DG] },
  },
  {
    path: 'sav',
    loadComponent: () =>
      import('./pages/demandes-sav-page/demandes-sav-page.component').then(
        (m) => m.DemandesSavPageComponent,
      ),
    data: { roles: [Role.SAV, Role.DG] },
  },
  {
    path: 'comptable',
    loadComponent: () =>
      import('./pages/demandes-comptable-page/demandes-comptable-page.component').then(
        (m) => m.DemandesComptablePageComponent,
      ),
    data: { roles: [Role.COMPTABLE, Role.DG] },
  },
];

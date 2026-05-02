import { inject } from '@angular/core';
import { CanMatchFn, Route } from '@angular/router';
import {
  AuthStore,
  UbaxRole,
  UbaxSubRole,
} from '@ubax-workspace/ubax-web-data-access';
import type { UbaxScope } from '@ubax-workspace/ubax-web-data-access';

/**
 * Retourne true si l'utilisateur est PARTNER dans le scope attendu.
 * Si subRole est précisé, le vérifie également — mais uniquement quand
 * user.subRole est déjà chargé (non-null), pour éviter un blocage au
 * premier rendu avant la réponse GET /sub-roles.
 */
const forPartnerProfile =
  (scope: UbaxScope, subRole: UbaxSubRole | null = null): CanMatchFn =>
  () => {
    const user = inject(AuthStore).user();
    const mainRole = user?.mainRole;
    const currentScope = user?.scope;
    const currentSubRole = user?.subRole ?? null;

    if (mainRole !== UbaxRole.PARTNER) return false;
    if (currentScope !== scope) return false;
    if (
      subRole !== null &&
      currentSubRole !== null &&
      currentSubRole !== subRole
    )
      return false;

    return true;
  };

const forInternalAdminProfile: CanMatchFn = () => {
  const mainRole = inject(AuthStore).user()?.mainRole;

  return mainRole === UbaxRole.ADMIN || mainRole === UbaxRole.SUPER_ADMIN;
};

export const dashboardRoutes: Route[] = [
  {
    path: '',
    canMatch: [forInternalAdminProfile],
    loadComponent: () =>
      import(
        './components/internal-dashboard-router/internal-dashboard-router.component'
      ).then((m) => m.InternalDashboardRouterComponent),
  },
  {
    path: '',
    canMatch: [forPartnerProfile('AGENCE', UbaxSubRole.DIRECTEUR_AGENCE)],
    loadComponent: () =>
      import('./pages/dashboard-dg-page/dashboard-dg-page.component').then(
        (m) => m.DashboardDgPageComponent,
      ),
  },
  {
    path: '',
    canMatch: [forPartnerProfile('AGENCE', UbaxSubRole.COMMERCIAL)],
    loadComponent: () =>
      import(
        './pages/dashboard-commercial-page/dashboard-commercial-page.component'
      ).then((m) => m.DashboardCommercialPageComponent),
  },
  {
    path: '',
    canMatch: [forPartnerProfile('AGENCE', UbaxSubRole.COMPTABLE_AGENCE)],
    loadComponent: () =>
      import(
        './pages/dashboard-comptable-page/dashboard-comptable-page.component'
      ).then((m) => m.DashboardComptablePageComponent),
  },
  {
    path: '',
    canMatch: [forPartnerProfile('AGENCE', UbaxSubRole.AGENT_SAV)],
    loadComponent: () =>
      import(
        './pages/dashboard-sav-page/dashboard-sav-page-redesign.component'
      ).then((m) => m.DashboardSavPageComponent),
  },
  {
    path: '',
    canMatch: [forPartnerProfile('HOTEL')],
    loadComponent: () =>
      import('@ubax-workspace/ubax-web-hotel').then(
        (m) => m.HotelOverviewPageComponent,
      ),
  },
];

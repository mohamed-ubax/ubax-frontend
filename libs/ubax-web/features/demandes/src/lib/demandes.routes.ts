import { inject } from '@angular/core';
import { CanMatchFn, Route } from '@angular/router';
import {
  AuthStore,
  UbaxRole,
  UbaxSubRole,
} from '@ubax-workspace/ubax-web-data-access';

/**
 * Filtre par sous-rôle agence.
 * Scope est garanti non-null par l'APP_INITIALIZER (auth.initializer).
 * Si user.subRole est null (sous-rôles pas encore chargés), la restriction
 * sur le sous-rôle est ignorée.
 */
const forAgenceSubRoles =
  (...subRoles: UbaxSubRole[]): CanMatchFn =>
  () => {
    const user = inject(AuthStore).user();
    if (!user || user.mainRole !== UbaxRole.PARTNER || user.scope !== 'AGENCE')
      return false;
    if (user.subRole !== null && !subRoles.includes(user.subRole)) return false;
    return true;
  };

const COMMERCIAL_ROLES: UbaxSubRole[] = [
  UbaxSubRole.DIRECTEUR_AGENCE,
  UbaxSubRole.COMMERCIAL,
];
const SAV_ROLES: UbaxSubRole[] = [UbaxSubRole.AGENT_SAV];
const COMPTABLE_ROLES: UbaxSubRole[] = [UbaxSubRole.COMPTABLE_AGENCE];

export const demandesRoutes: Route[] = [
  // ── Vue index — redirige selon sous-rôle ──────────────────────────────────
  {
    path: '',
    canMatch: [forAgenceSubRoles(...COMMERCIAL_ROLES)],
    loadComponent: () =>
      import(
        './pages/demandes-commercial-page/demandes-commercial-page.component'
      ).then((m) => m.DemandesCommercialPageComponent),
  },
  {
    path: '',
    canMatch: [forAgenceSubRoles(...SAV_ROLES)],
    loadComponent: () =>
      import('./pages/demandes-sav-page/demandes-sav-page.component').then(
        (m) => m.DemandesSavPageComponent,
      ),
  },
  {
    path: '',
    canMatch: [forAgenceSubRoles(...COMPTABLE_ROLES)],
    loadComponent: () =>
      import(
        './pages/demandes-comptable-page/demandes-comptable-page.component'
      ).then((m) => m.DemandesComptablePageComponent),
  },

  // ── Sous-routes nommées ───────────────────────────────────────────────────
  {
    path: 'commercial',
    canMatch: [forAgenceSubRoles(...COMMERCIAL_ROLES)],
    loadComponent: () =>
      import(
        './pages/demandes-commercial-page/demandes-commercial-page.component'
      ).then((m) => m.DemandesCommercialPageComponent),
  },
  {
    path: 'sav',
    canMatch: [forAgenceSubRoles(...SAV_ROLES)],
    loadComponent: () =>
      import('./pages/demandes-sav-page/demandes-sav-page.component').then(
        (m) => m.DemandesSavPageComponent,
      ),
  },
  {
    path: 'comptable',
    canMatch: [forAgenceSubRoles(...COMPTABLE_ROLES)],
    loadComponent: () =>
      import(
        './pages/demandes-comptable-page/demandes-comptable-page.component'
      ).then((m) => m.DemandesComptablePageComponent),
  },

  // ── Configuration des créneaux de visite (SCRUM-375 / SCRUM-376) ─────────
  {
    path: 'visites/configuration',
    canMatch: [forAgenceSubRoles(...COMMERCIAL_ROLES)],
    loadComponent: () =>
      import(
        './pages/visite-config-page/visite-config-page.component'
      ).then((m) => m.VisiteConfigPageComponent),
  },
];

import { Route } from '@angular/router';
import { Role } from '@ubax-workspace/ubax-web-data-access';
import { authGuard } from './guards/auth.guard';
import { roleGuard } from './guards/role.guard';

export const webRoutes: Route[] = [
  {
    path: '',
    loadComponent: () =>
      import('./layout/main-layout/main-layout.component').then(
        (m) => m.MainLayoutComponent,
      ),
    canActivate: [authGuard],
    children: [
      // Redirection racine selon rôle (gérée dans DashboardRoutes)
      {
        path: '',
        redirectTo: 'tableau-de-bord',
        pathMatch: 'full',
      },

      // ── Dashboards ──────────────────────────────────────────────────────────
      {
        path: 'tableau-de-bord',
        loadChildren: () =>
          import('@ubax-workspace/ubax-web-dashboard').then(
            (m) => m.dashboardRoutes,
          ),
      },

      // ── Immobilier ──────────────────────────────────────────────────────────
      {
        path: 'biens',
        loadChildren: () =>
          import('@ubax-workspace/ubax-web-immobilier').then(
            (m) => m.immobilierRoutes,
          ),
        canActivate: [roleGuard],
        data: { roles: [Role.DG, Role.COMMERCIAL, Role.COMPTABLE] },
      },

      // ── Location / Réservations ─────────────────────────────────────────────
      {
        path: 'reservations',
        loadChildren: () =>
          import('@ubax-workspace/ubax-web-location').then(
            (m) => m.locationRoutes,
          ),
        canActivate: [roleGuard],
        data: { roles: [Role.DG, Role.COMMERCIAL, Role.SAV, Role.HOTEL] },
      },

      // ── Demandes clients ────────────────────────────────────────────────────
      {
        path: 'demandes',
        loadChildren: () =>
          import('@ubax-workspace/ubax-web-demandes').then(
            (m) => m.demandesRoutes,
          ),
        canActivate: [roleGuard],
        data: { roles: [Role.DG, Role.COMMERCIAL, Role.SAV, Role.COMPTABLE] },
      },

      // ── Finance ─────────────────────────────────────────────────────────────
      {
        path: 'finances',
        loadChildren: () =>
          import('@ubax-workspace/ubax-web-finance').then(
            (m) => m.financeRoutes,
          ),
        canActivate: [roleGuard],
        data: { roles: [Role.DG, Role.COMPTABLE] },
      },

      // ── Archivage ───────────────────────────────────────────────────────────
      {
        path: 'archivages',
        loadChildren: () =>
          import('@ubax-workspace/ubax-web-archivage').then(
            (m) => m.archivageRoutes,
          ),
        canActivate: [roleGuard],
        data: { roles: [Role.DG, Role.COMPTABLE] },
      },

      // ── Hotel ───────────────────────────────────────────────────────────────
      {
        path: 'hotel',
        loadChildren: () =>
          import('@ubax-workspace/ubax-web-hotel').then((m) => m.hotelRoutes),
        canActivate: [roleGuard],
        data: { roles: [Role.DG, Role.HOTEL] },
      },
    ],
  },

  // Fallback
  { path: '**', redirectTo: 'tableau-de-bord' },
];

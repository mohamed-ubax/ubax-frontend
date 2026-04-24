import { Route } from '@angular/router';
import { ROUTE_ROLE_ACCESS } from '@ubax-workspace/ubax-web-data-access';
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
        data: { roles: ROUTE_ROLE_ACCESS.biens },
      },

      // ── Location / Réservations ─────────────────────────────────────────────
      {
        path: 'reservations',
        loadChildren: () =>
          import('@ubax-workspace/ubax-web-location').then(
            (m) => m.locationRoutes,
          ),
        canActivate: [roleGuard],
        data: {
          preload: true,
          roles: ROUTE_ROLE_ACCESS.reservations,
        },
      },

      // ── Demandes clients ────────────────────────────────────────────────────
      {
        path: 'demandes',
        loadChildren: () =>
          import('@ubax-workspace/ubax-web-demandes').then(
            (m) => m.demandesRoutes,
          ),
        canActivate: [roleGuard],
        data: {
          preload: true,
          roles: ROUTE_ROLE_ACCESS.demandes,
        },
      },

      // ── Finance ─────────────────────────────────────────────────────────────
      {
        path: 'finances',
        loadChildren: () =>
          import('@ubax-workspace/ubax-web-finance').then(
            (m) => m.financeRoutes,
          ),
        canActivate: [roleGuard],
        data: { roles: ROUTE_ROLE_ACCESS.finances },
      },

      // ── Archivage ───────────────────────────────────────────────────────────
      {
        path: 'archivages',
        loadChildren: () =>
          import('@ubax-workspace/ubax-web-archivage').then(
            (m) => m.archivageRoutes,
          ),
        canActivate: [roleGuard],
        data: { roles: ROUTE_ROLE_ACCESS.archivages },
      },

      // ── Hotel ───────────────────────────────────────────────────────────────
      {
        path: 'hotel',
        loadChildren: () =>
          import('@ubax-workspace/ubax-web-hotel').then((m) => m.hotelRoutes),
        canActivate: [roleGuard],
        data: { roles: ROUTE_ROLE_ACCESS.hotel },
      },
    ],
  },

  // Fallback
  { path: '**', redirectTo: 'tableau-de-bord' },
];

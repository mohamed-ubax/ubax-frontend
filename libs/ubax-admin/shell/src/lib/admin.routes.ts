import { Route } from '@angular/router';
import { UbaxRole } from '@ubax-workspace/shared-data-access';
import { authGuard } from './guards/auth.guard';
import { roleGuard } from './guards/role.guard';

const ADMIN_READ_ROLES = [UbaxRole.ADMIN, UbaxRole.SUPER_ADMIN] as const;
const ADMIN_WRITE_ROLES = [UbaxRole.SUPER_ADMIN] as const;

export const adminRoutes: Route[] = [
  {
    path: '',
    loadComponent: () =>
      import('./layout/main-layout/main-layout.component').then(
        (m) => m.MainLayoutComponent,
      ),
    canActivate: [authGuard, roleGuard],
    data: { roles: ADMIN_READ_ROLES },
    children: [
      {
        path: '',
        redirectTo: 'tableau-de-bord',
        pathMatch: 'full',
      },
      {
        path: 'tableau-de-bord',
        canActivate: [roleGuard],
        data: { roles: ADMIN_READ_ROLES },
        loadComponent: () =>
          import('./pages/dashboard/dashboard.component').then(
            (m) => m.DashboardComponent,
          ),
      },
      {
        path: 'administrateurs',
        canActivate: [roleGuard],
        data: { roles: ADMIN_READ_ROLES },
        loadComponent: () =>
          import('./pages/administrateurs/administrateurs-page.component').then(
            (m) => m.AdministrateursPageComponent,
          ),
      },
      // Agences
      {
        path: 'agences',
        canActivate: [roleGuard],
        data: { roles: ADMIN_WRITE_ROLES },
        loadComponent: () =>
          import('./pages/agences/agences-page.component').then(
            (m) => m.AgencesPageComponent,
          ),
      },
      {
        path: 'agences/:agencyId',
        canActivate: [roleGuard],
        data: { roles: ADMIN_READ_ROLES },
        loadComponent: () =>
          import('./pages/agences/agency-detail-page.component').then(
            (m) => m.AgencyDetailPageComponent,
          ),
      },
      // FE-408 — Membres d'une agence (lecture seule)
      {
        path: 'agences/:agencyId/membres',
        canActivate: [roleGuard],
        data: { roles: ADMIN_READ_ROLES },
        loadComponent: () =>
          import('./pages/membres/membres-agence-page.component').then(
            (m) => m.MembresAgencePageComponent,
          ),
      },
      // Hôtels
      {
        path: 'hotels',
        canActivate: [roleGuard],
        data: { roles: ADMIN_WRITE_ROLES },
        loadComponent: () =>
          import('./pages/hotels/hotels-page.component').then(
            (m) => m.HotelsPageComponent,
          ),
      },
      {
        path: 'hotels/:hotelId',
        canActivate: [roleGuard],
        data: { roles: ADMIN_READ_ROLES },
        loadComponent: () =>
          import('./pages/hotels/hotel-detail-page.component').then(
            (m) => m.HotelDetailPageComponent,
          ),
      },
      // FE-409 — Membres d'un hôtel (lecture seule)
      {
        path: 'hotels/:hotelId/membres',
        canActivate: [roleGuard],
        data: { roles: ADMIN_READ_ROLES },
        loadComponent: () =>
          import('./pages/membres/membres-hotel-page.component').then(
            (m) => m.MembresHotelPageComponent,
          ),
      },
      // UBAX-FE-502 — Liste des candidatures partenaires
      {
        path: 'candidatures',
        canActivate: [roleGuard],
        data: { roles: ADMIN_READ_ROLES },
        loadComponent: () =>
          import('./pages/candidatures/candidatures-list-page.component').then(
            (m) => m.CandidaturesListPageComponent,
          ),
      },
      // UBAX-FE-503 — Détail d'une candidature partenaire
      {
        path: 'candidatures/:id',
        canActivate: [roleGuard],
        data: { roles: ADMIN_READ_ROLES },
        loadComponent: () =>
          import(
            './pages/candidatures/candidatures-detail-page.component'
          ).then((m) => m.CandidaturesDetailPageComponent),
      },
      {
        path: 'bailleurs',
        canActivate: [roleGuard],
        data: { roles: ADMIN_READ_ROLES },
        loadComponent: () =>
          import(
            './pages/bailleurs/bailleurs-applications-page.component'
          ).then((m) => m.BailleursApplicationsPageComponent),
      },
      // UBAX-FE-613 — Modération des biens PENDING
      {
        path: 'proprietes',
        canActivate: [roleGuard],
        data: { roles: ADMIN_READ_ROLES },
        loadComponent: () =>
          import('./pages/proprietes/proprietes-list-page.component').then(
            (m) => m.ProprietesListPageComponent,
          ),
      },
      // Propriétés publiées — Agences
      {
        path: 'proprietes/agences',
        canActivate: [roleGuard],
        data: { roles: ADMIN_READ_ROLES },
        loadComponent: () =>
          import('./pages/proprietes/proprietes-agences-page.component').then(
            (m) => m.ProprietesAgencesPageComponent,
          ),
      },
      // Propriétés publiées — Hôtels
      {
        path: 'proprietes/hotels',
        canActivate: [roleGuard],
        data: { roles: ADMIN_READ_ROLES },
        loadComponent: () =>
          import('./pages/proprietes/proprietes-hotels-page.component').then(
            (m) => m.ProprietesHotelsPageComponent,
          ),
      },
      // BE-CLIENT-01 — Liste des clients
      {
        path: 'clients',
        canActivate: [roleGuard],
        data: { roles: ADMIN_READ_ROLES },
        loadComponent: () =>
          import('./pages/clients/clients-page.component').then(
            (m) => m.ClientsPageComponent,
          ),
      },
      {
        path: 'reservations',
        canActivate: [roleGuard],
        data: { roles: ADMIN_READ_ROLES },
        loadComponent: () =>
          import('./pages/reservations/reservations-list-page.component').then(
            (m) => m.ReservationsListPageComponent,
          ),
      },
      {
        path: 'reservations/:id',
        canActivate: [roleGuard],
        data: { roles: ADMIN_READ_ROLES },
        loadComponent: () =>
          import('./pages/reservations/reservation-detail-page.component').then(
            (m) => m.ReservationDetailPageComponent,
          ),
      },
      {
        path: 'paiements',
        canActivate: [roleGuard],
        data: { roles: ADMIN_READ_ROLES },
        loadComponent: () =>
          import('./pages/paiements/payments-page.component').then(
            (m) => m.PaymentsPageComponent,
          ),
      },
      {
        path: 'code-lists',
        canActivate: [roleGuard],
        data: { roles: ADMIN_READ_ROLES },
        loadComponent: () =>
          import('./pages/code-lists/code-lists-page.component').then(
            (m) => m.CodeListsPageComponent,
          ),
      },

      // UBAX-FE-613 — Détail d'un bien en attente de modération
      {
        path: 'proprietes/:id',
        canActivate: [roleGuard],
        data: { roles: ADMIN_READ_ROLES },
        loadComponent: () =>
          import('./pages/proprietes/proprietes-detail-page.component').then(
            (m) => m.ProprietesDetailPageComponent,
          ),
      },
    ],
  },
];

import { Route } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const adminRoutes: Route[] = [
  {
    path: '',
    loadComponent: () =>
      import('./layout/main-layout/main-layout.component').then(
        (m) => m.MainLayoutComponent,
      ),
    canActivate: [authGuard],
    children: [
      {
        path: '',
        redirectTo: 'tableau-de-bord',
        pathMatch: 'full',
      },
      {
        path: 'tableau-de-bord',
        loadComponent: () =>
          import('./pages/dashboard/dashboard.component').then(
            (m) => m.DashboardComponent,
          ),
      },
      {
        path: 'administrateurs',
        loadComponent: () =>
          import('./pages/administrateurs/administrateurs-page.component').then(
            (m) => m.AdministrateursPageComponent,
          ),
      },
      // Agences
      {
        path: 'agences',
        loadComponent: () =>
          import('./pages/agences/agences-page.component').then(
            (m) => m.AgencesPageComponent,
          ),
      },
      // FE-408 — Membres d'une agence (lecture seule)
      {
        path: 'agences/:agencyId/membres',
        loadComponent: () =>
          import('./pages/membres/membres-agence-page.component').then(
            (m) => m.MembresAgencePageComponent,
          ),
      },
      // Hôtels
      {
        path: 'hotels',
        loadComponent: () =>
          import('./pages/hotels/hotels-page.component').then(
            (m) => m.HotelsPageComponent,
          ),
      },
      // FE-409 — Membres d'un hôtel (lecture seule)
      {
        path: 'hotels/:hotelId/membres',
        loadComponent: () =>
          import('./pages/membres/membres-hotel-page.component').then(
            (m) => m.MembresHotelPageComponent,
          ),
      },
      // UBAX-FE-502 — Liste des candidatures partenaires
      {
        path: 'candidatures',
        loadComponent: () =>
          import('./pages/candidatures/candidatures-list-page.component').then(
            (m) => m.CandidaturesListPageComponent,
          ),
      },
      // UBAX-FE-503 — Détail d'une candidature partenaire
      {
        path: 'candidatures/:id',
        loadComponent: () =>
          import(
            './pages/candidatures/candidatures-detail-page.component'
          ).then((m) => m.CandidaturesDetailPageComponent),
      },
      // UBAX-FE-613 — Modération des biens PENDING
      {
        path: 'proprietes',
        loadComponent: () =>
          import('./pages/proprietes/proprietes-list-page.component').then(
            (m) => m.ProprietesListPageComponent,
          ),
      },
      // Propriétés publiées — Agences
      {
        path: 'proprietes/agences',
        loadComponent: () =>
          import('./pages/proprietes/proprietes-agences-page.component').then(
            (m) => m.ProprietesAgencesPageComponent,
          ),
      },
      // Propriétés publiées — Hôtels
      {
        path: 'proprietes/hotels',
        loadComponent: () =>
          import('./pages/proprietes/proprietes-hotels-page.component').then(
            (m) => m.ProprietesHotelsPageComponent,
          ),
      },
      // BE-CLIENT-01 — Liste des clients
      {
        path: 'clients',
        loadComponent: () =>
          import('./pages/clients/clients-page.component').then(
            (m) => m.ClientsPageComponent,
          ),
      },
      {
        path: 'code-lists',
        loadComponent: () =>
          import('./pages/code-lists/code-lists-page.component').then(
            (m) => m.CodeListsPageComponent,
          ),
      },

      // UBAX-FE-613 — Détail d'un bien en attente de modération
      {
        path: 'proprietes/:id',
        loadComponent: () =>
          import('./pages/proprietes/proprietes-detail-page.component').then(
            (m) => m.ProprietesDetailPageComponent,
          ),
      },
    ],
  },
];

import { Route } from '@angular/router';

export const hotelRoutes: Route[] = [
  {
    path: 'reservations',
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./pages/calendrier-page/calendrier-page.component').then(
            (m) => m.CalendrierPageComponent,
          ),
      },
      {
        path: 'liste',
        loadComponent: () =>
          import(
            './pages/reservations-list-page/reservations-list-page.component'
          ).then((m) => m.ReservationsListPageComponent),
      },
      {
        path: ':id',
        loadComponent: () =>
          import(
            './pages/reservation-detail-page/reservation-detail-page.component'
          ).then((m) => m.ReservationDetailPageComponent),
      },
    ],
  },
  {
    path: 'reservations-calendrier',
    loadComponent: () =>
      import('./pages/calendrier-page/calendrier-page.component').then(
        (m) => m.CalendrierPageComponent,
      ),
  },
  {
    path: 'espaces',
    loadComponent: () =>
      import('@ubax-workspace/ubax-web-espaces').then(
        (m) => m.EspacesListPageComponent,
      ),
  },
  {
    path: 'espaces/ajouter',
    loadComponent: () =>
      import('@ubax-workspace/ubax-web-espaces').then(
        (m) => m.EspaceAddPageComponent,
      ),
  },
  {
    path: 'espaces/:id/modifier',
    loadComponent: () =>
      import('@ubax-workspace/ubax-web-espaces').then(
        (m) => m.EspaceAddPageComponent,
      ),
  },
  {
    path: 'espaces/:id',
    loadComponent: () =>
      import('@ubax-workspace/ubax-web-espaces').then(
        (m) => m.EspaceDetailPageComponent,
      ),
  },
  {
    path: '',
    loadComponent: () =>
      import('./pages/hotel-overview-page/hotel-overview-page.component').then(
        (m) => m.HotelOverviewPageComponent,
      ),
  },
  {
    path: 'chambres/ajouter',
    loadComponent: () =>
      import('./pages/chambre-add-page/chambre-add-page.component').then(
        (m) => m.ChambreAddPageComponent,
      ),
  },
  {
    path: 'clients',
    loadComponent: () =>
      import('./pages/clients-list-page/clients-list-page.component').then(
        (m) => m.ClientsListPageComponent,
      ),
  },
  {
    path: 'clients/:id',
    loadComponent: () =>
      import('./pages/client-detail-page/client-detail-page.component').then(
        (m) => m.ClientDetailPageComponent,
      ),
  },
  {
    path: 'facturation',
    loadComponent: () =>
      import('./pages/facturation-page/facturation-page.component').then(
        (m) => m.FacturationPageComponent,
      ),
  },
  {
    path: 'facturation/recettes',
    loadComponent: () =>
      import(
        './pages/historique-recettes-page/historique-recettes-page.component'
      ).then((m) => m.HistoriqueRecettesPageComponent),
  },
  {
    path: 'facturation/depenses',
    loadComponent: () =>
      import(
        './pages/historique-depenses-page/historique-depenses-page.component'
      ).then((m) => m.HistoriqueDepensesPageComponent),
  },
  {
    path: 'facturation/ajouter-depense',
    loadComponent: () =>
      import(
        './pages/ajouter-depense-page/ajouter-depense-page.component'
      ).then((m) => m.AjouterDepensePageComponent),
  },
  {
    path: 'equipe',
    loadChildren: () =>
      import('@ubax-workspace/ubax-web-equipe').then((m) => m.equipeRoutes),
  },
];

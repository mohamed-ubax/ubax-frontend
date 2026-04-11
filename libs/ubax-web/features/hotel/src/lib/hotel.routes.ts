import { Route } from '@angular/router';

export const hotelRoutes: Route[] = [
  {
    path: 'reservations',
    loadComponent: () =>
      import('./pages/calendrier-page/calendrier-page.component').then(
        (m) => m.CalendrierPageComponent,
      ),
  },
  {
    path: 'espaces',
    loadComponent: () =>
      import(
        '../../../espaces/src/lib/pages/espaces-list-page/espaces-list-page.component'
      ).then((m) => m.EspacesListPageComponent),
  },
  {
    path: 'espaces/ajouter',
    loadComponent: () =>
      import(
        '../../../espaces/src/lib/pages/espace-add-page/espace-add-page.component'
      ).then((m) => m.EspaceAddPageComponent),
  },
  {
    path: 'espaces/:id',
    loadComponent: () =>
      import(
        '../../../espaces/src/lib/pages/espace-detail-page/espace-detail-page.component'
      ).then((m) => m.EspaceDetailPageComponent),
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
    path: 'employes',
    loadComponent: () =>
      import('./pages/employes-list-page/employes-list-page.component').then(
        (m) => m.EmployesListPageComponent,
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
    path: 'employes/ajouter',
    loadComponent: () =>
      import('./pages/employe-add-page/employe-add-page.component').then(
        (m) => m.EmployeAddPageComponent,
      ),
  },
  {
    path: 'employes/:id',
    loadComponent: () =>
      import('./pages/employe-detail-page/employe-detail-page.component').then(
        (m) => m.EmployeDetailPageComponent,
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
];

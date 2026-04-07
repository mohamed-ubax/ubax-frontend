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
      import('./pages/historique-recettes-page/historique-recettes-page.component').then(
        (m) => m.HistoriqueRecettesPageComponent,
      ),
  },
  {
    path: 'facturation/depenses',
    loadComponent: () =>
      import('./pages/historique-depenses-page/historique-depenses-page.component').then(
        (m) => m.HistoriqueDepensesPageComponent,
      ),
  },
  {
    path: 'facturation/ajouter-depense',
    loadComponent: () =>
      import('./pages/ajouter-depense-page/ajouter-depense-page.component').then(
        (m) => m.AjouterDepensePageComponent,
      ),
  },
];

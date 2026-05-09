import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'ubax-admin-dashboard',
  standalone: true,
  template: `
    <div class="p-8">
      <h1 class="text-2xl font-semibold text-gray-800">Tableau de bord Admin</h1>
      <p class="mt-2 text-gray-500">Bienvenue dans l'espace d'administration UBAX.</p>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent {}

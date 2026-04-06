import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PageHeaderComponent, FilterBarComponent } from '@ubax-workspace/shared-ui';

@Component({
  selector: 'ubax-employe-add-page',
  standalone: true,
  imports: [PageHeaderComponent],
  template: `
    <ubax-page-header title="Ajouter un employé" backLink="/hotel/employes" />
    <p class="text-slate-400 text-sm">En cours de développement…</p>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmployeAddPageComponent {}

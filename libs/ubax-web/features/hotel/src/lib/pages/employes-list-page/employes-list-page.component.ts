import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PageHeaderComponent, FilterBarComponent } from '@ubax-workspace/shared-ui';

@Component({
  selector: 'ubax-employes-list-page',
  standalone: true,
  imports: [PageHeaderComponent, FilterBarComponent],
  template: `
    <ubax-page-header title="Employés" />
    <ubax-filter-bar />
    <p class="text-slate-400 text-sm">En cours de développement…</p>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmployesListPageComponent {}

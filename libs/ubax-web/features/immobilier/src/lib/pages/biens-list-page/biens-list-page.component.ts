import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PageHeaderComponent, FilterBarComponent } from '@ubax-workspace/shared-ui';

@Component({
  selector: 'ubax-biens-list-page',
  standalone: true,
  imports: [PageHeaderComponent, FilterBarComponent],
  template: `
    <ubax-page-header title="Mes biens">
      <!-- slot actions : boutons Ajouter -->
    </ubax-page-header>
    <ubax-filter-bar [showDateRange]="false" />
    <p class="text-slate-400 text-sm">En cours de développement…</p>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BiensListPageComponent {}

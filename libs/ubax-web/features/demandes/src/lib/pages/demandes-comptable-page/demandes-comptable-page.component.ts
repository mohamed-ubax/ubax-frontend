import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PageHeaderComponent, FilterBarComponent } from '@ubax-workspace/shared-ui';

@Component({
  selector: 'ubax-demandes-comptable-page',
  standalone: true,
  imports: [PageHeaderComponent, FilterBarComponent],
  template: `
    <ubax-page-header title="Demandes clientèles" />
    <ubax-filter-bar />
    <p class="text-slate-400 text-sm mt-4">En cours de développement…</p>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DemandesComptablePageComponent {}

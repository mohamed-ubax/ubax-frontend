import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PageHeaderComponent, PageToolbarComponent, FilterBarComponent } from '@ubax-workspace/shared-ui';

@Component({
  selector: 'ubax-finance-overview-page',
  standalone: true,
  imports: [PageHeaderComponent, PageToolbarComponent, FilterBarComponent],
  template: `
    <ubax-page-header title="Finance" />
    <ubax-page-toolbar />
    <p class="text-slate-400 text-sm mt-4">En cours de développement…</p>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FinanceOverviewPageComponent {}

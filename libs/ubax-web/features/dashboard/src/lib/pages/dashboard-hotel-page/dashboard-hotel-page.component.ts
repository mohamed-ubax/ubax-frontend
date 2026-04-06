import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PageHeaderComponent, PageToolbarComponent } from '@ubax-workspace/shared-ui';

@Component({
  selector: 'ubax-dashboard-hotel-page',
  standalone: true,
  imports: [PageHeaderComponent, PageToolbarComponent],
  template: `
    <ubax-page-header title="Tableau de bord">
    </ubax-page-header>
    <ubax-page-toolbar />
    <p class="text-slate-400 text-sm mt-4">En cours de développement…</p>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardHotelPageComponent {}

import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PageHeaderComponent, PageToolbarComponent } from '@ubax-workspace/shared-ui';

@Component({
  selector: 'ubax-reservation-page',
  standalone: true,
  imports: [PageHeaderComponent, PageToolbarComponent],
  template: `
    <ubax-page-header title="Réservations" />
    <ubax-page-toolbar />
    <p class="text-slate-400 text-sm mt-4">En cours de développement…</p>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReservationPageComponent {}

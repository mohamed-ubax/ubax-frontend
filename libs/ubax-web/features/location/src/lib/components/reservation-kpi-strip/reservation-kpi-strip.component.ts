import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { ReservationKpiCard } from '../../types/reservation.types';

@Component({
  selector: 'ubax-reservation-kpi-strip',
  standalone: true,
  templateUrl: './reservation-kpi-strip.component.html',
  styleUrl: './reservation-kpi-strip.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReservationKpiStripComponent {
  readonly cards = input.required<readonly ReservationKpiCard[]>();
}

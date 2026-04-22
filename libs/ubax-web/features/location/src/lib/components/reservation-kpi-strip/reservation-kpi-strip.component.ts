import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ReservationKpiCard } from '../../reservation-commercial.data';

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

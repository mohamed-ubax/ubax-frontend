import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map } from 'rxjs';
import {
  COMMERCIAL_ICON_ASSETS,
  getReservationById,
} from '../../reservation-commercial.data';

@Component({
  selector: 'ubax-reservation-detail-page',
  standalone: true,
  imports: [RouterLink, DatePipe],
  templateUrl: './reservation-detail-page.component.html',
  styleUrl: './reservation-detail-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReservationDetailPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly reservationId = toSignal(
    this.route.paramMap.pipe(map((params) => params.get('id'))),
    { initialValue: this.route.snapshot.paramMap.get('id') },
  );

  readonly icons = COMMERCIAL_ICON_ASSETS;
  readonly reservation = computed(() =>
    getReservationById(this.reservationId()),
  );
}

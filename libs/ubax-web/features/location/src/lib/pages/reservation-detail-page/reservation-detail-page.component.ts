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

type ReservationContactItem = {
  readonly label: string;
  readonly value: string;
  readonly icon: string;
  readonly href?: string;
  readonly external?: boolean;};

type ReservationPricingRow = {
  readonly label: string;
  readonly value: string;};

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
  readonly contactItems = computed<readonly ReservationContactItem[]>(() => {
    const reservation = this.reservation();
    const phoneNumber = reservation.phone.replace(/\s+/g, '');
    const mapQuery = encodeURIComponent(
      `${reservation.property}, ${reservation.address}`,
    );

    return [
      {
        label: 'Téléphone',
        value: reservation.phone,
        icon: this.icons.phone,
        href: `tel:${phoneNumber}`,
      },
      {
        label: 'Email',
        value: reservation.email,
        icon: this.icons.mail,
        href: `mailto:${reservation.email}`,
      },
      {
        label: 'Adresse',
        value: reservation.address,
        icon: this.icons.locationFill,
        href: `https://www.google.com/maps/search/?api=1&query=${mapQuery}`,
        external: true,
      },
      {
        label: 'Référence',
        value: reservation.reference,
        icon: this.icons.idCard,
      },
    ];
  });
  readonly pricingRows = computed<readonly ReservationPricingRow[]>(() => {
    const pricing = this.reservation().pricing;

    return [
      {
        label: 'Nuitée',
        value: pricing.nightlyAmount,
      },
      {
        label: 'Nuits',
        value: pricing.nights.toString(),
      },
      {
        label: 'Sous total',
        value: pricing.subtotal,
      },
      {
        label: 'Taxe de séjour',
        value: pricing.cityTax,
      },
    ];
  });
}

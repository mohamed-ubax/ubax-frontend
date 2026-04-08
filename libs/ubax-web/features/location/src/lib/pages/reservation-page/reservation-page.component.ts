import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

interface Reservation {
  id: string;
  guest: string;
  property: string;
  duration: string;
  arrival: string;
  departure: string;
  status: 'Confirmé' | 'En attente' | 'Annulé';
}

@Component({
  selector: 'ubax-reservation-page',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './reservation-page.component.html',
  styleUrl: './reservation-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReservationPageComponent {
  readonly reservations: Reservation[] = [
    { id: '1', guest: 'Koné Ibrahim', property: 'Résidence Plateau', duration: '2 jours', arrival: '14 / 04 / 2026', departure: '18 / 04 / 2026', status: 'Confirmé' },
    { id: '2', guest: 'Koné Ibrahim', property: 'Résidence Plateau', duration: '2 jours', arrival: '14 / 04 / 2026', departure: '18 / 04 / 2026', status: 'Confirmé' },
    { id: '3', guest: 'Koné Ibrahim', property: 'Résidence Plateau', duration: '2 jours', arrival: '14 / 04 / 2026', departure: '18 / 04 / 2026', status: 'Confirmé' },
    { id: '4', guest: 'Koné Ibrahim', property: 'Résidence Plateau', duration: '2 jours', arrival: '14 / 04 / 2026', departure: '18 / 04 / 2026', status: 'Confirmé' },
    { id: '5', guest: 'Koné Ibrahim', property: 'Résidence Plateau', duration: '2 jours', arrival: '14 / 04 / 2026', departure: '18 / 04 / 2026', status: 'Confirmé' },
    { id: '6', guest: 'Koné Ibrahim', property: 'Résidence Plateau', duration: '2 jours', arrival: '14 / 04 / 2026', departure: '18 / 04 / 2026', status: 'Confirmé' },
    { id: '7', guest: 'Koné Ibrahim', property: 'Résidence Plateau', duration: '2 jours', arrival: '14 / 04 / 2026', departure: '18 / 04 / 2026', status: 'Confirmé' },
    { id: '8', guest: 'Koné Ibrahim', property: 'Résidence Plateau', duration: '2 jours', arrival: '14 / 04 / 2026', departure: '18 / 04 / 2026', status: 'Confirmé' },
  ];

  readonly pages = [1, 2, 3, 4, 5];
  activePage = 1;
}

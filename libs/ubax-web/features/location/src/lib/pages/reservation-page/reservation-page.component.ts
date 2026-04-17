import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { UbaxPaginatorComponent } from '@ubax-workspace/shared-ui';

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
  imports: [RouterLink, UbaxPaginatorComponent],
  templateUrl: './reservation-page.component.html',
  styleUrl: './reservation-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReservationPageComponent {
  readonly reservations: Reservation[] = [
    {
      id: '1',
      guest: 'Koné Ibrahim',
      property: 'Résidence Plateau',
      duration: '2 jours',
      arrival: '14 Avril 2026',
      departure: '18 Avril 2026',
      status: 'Confirmé',
    },
    {
      id: '2',
      guest: 'Koné Ibrahim',
      property: 'Résidence Plateau',
      duration: '2 jours',
      arrival: '14 Avril 2026',
      departure: '18 Avril 2026',
      status: 'Confirmé',
    },
    {
      id: '3',
      guest: 'Koné Ibrahim',
      property: 'Résidence Plateau',
      duration: '2 jours',
      arrival: '14 Avril 2026',
      departure: '18 Avril 2026',
      status: 'Confirmé',
    },
    {
      id: '4',
      guest: 'Koné Ibrahim',
      property: 'Résidence Plateau',
      duration: '2 jours',
      arrival: '14 Avril 2026',
      departure: '18 Avril 2026',
      status: 'Confirmé',
    },
    {
      id: '5',
      guest: 'Koné Ibrahim',
      property: 'Résidence Plateau',
      duration: '2 jours',
      arrival: '14 Avril 2026',
      departure: '18 Avril 2026',
      status: 'Confirmé',
    },
    {
      id: '6',
      guest: 'Koné Ibrahim',
      property: 'Résidence Plateau',
      duration: '2 jours',
      arrival: '14 Avril 2026',
      departure: '18 Avril 2026',
      status: 'Confirmé',
    },
    {
      id: '7',
      guest: 'Koné Ibrahim',
      property: 'Résidence Plateau',
      duration: '2 jours',
      arrival: '14 Avril 2026',
      departure: '18 Avril 2026',
      status: 'Confirmé',
    },
    {
      id: '8',
      guest: 'Koné Ibrahim',
      property: 'Résidence Plateau',
      duration: '2 jours',
      arrival: '14 Avril 2026',
      departure: '18 Avril 2026',
      status: 'Confirmé',
    },
  ];

  readonly totalPages = 5;
  readonly currentPage = signal(1);
}

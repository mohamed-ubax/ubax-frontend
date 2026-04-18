import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  DateRange,
  DateRangePickerComponent,
  UbaxPaginatorComponent,
} from '@ubax-workspace/shared-ui';

const PAGE_SIZE = 10;
const DAY_IN_MS = 24 * 60 * 60 * 1000;
const MONTH_NAMES = [
  'Janvier',
  'Février',
  'Mars',
  'Avril',
  'Mai',
  'Juin',
  'Juillet',
  'Août',
  'Septembre',
  'Octobre',
  'Novembre',
  'Décembre',
];

type ReservationStatus = 'Confirmé' | 'En attente' | 'Annulé';

interface Reservation {
  id: string;
  image: string;
  guest: string;
  property: string;
  duration: string;
  arrivalDate: Date;
  departureDate: Date;
  status: ReservationStatus;
  searchIndex: string;
}

interface ReservationSeed {
  id: string;
  image: string;
  guest: string;
  property: string;
  arrivalDate: Date;
  departureDate: Date;
  status: ReservationStatus;
}

function createDate(year: number, month: number, day: number): Date {
  return new Date(year, month - 1, day);
}

function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function formatTableDate(date: Date): string {
  const day = date.getDate();
  const month = MONTH_NAMES[date.getMonth()];
  const year = date.getFullYear();

  return `${day} ${month} ${year}`;
}

function createReservation(seed: ReservationSeed): Reservation {
  const durationInDays = Math.max(
    1,
    Math.round(
      (seed.departureDate.getTime() - seed.arrivalDate.getTime()) / DAY_IN_MS,
    ),
  );
  const durationLabel = `${durationInDays} jour${durationInDays > 1 ? 's' : ''}`;
  const arrivalLabel = formatTableDate(seed.arrivalDate);
  const departureLabel = formatTableDate(seed.departureDate);

  return {
    ...seed,
    duration: durationLabel,
    searchIndex: normalizeText(
      [
        seed.guest,
        seed.property,
        durationLabel,
        arrivalLabel,
        departureLabel,
        seed.status,
      ].join(' '),
    ),
  };
}

@Component({
  selector: 'ubax-reservation-page',
  standalone: true,
  imports: [
    FormsModule,
    RouterLink,
    UbaxPaginatorComponent,
    DateRangePickerComponent,
    DatePipe,
  ],
  templateUrl: './reservation-page.component.html',
  styleUrl: './reservation-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReservationPageComponent {
  readonly datePickerOpen = signal(false);
  readonly selectedRange = signal<DateRange | null>(null);
  readonly searchTerm = signal('');
  readonly currentPage = signal(1);
  readonly hasActiveFilters = computed(
    () => this.searchTerm().trim().length > 0 || this.selectedRange() !== null,
  );

  readonly reservations: Reservation[] = [
    createReservation({
      id: '1',
      image: '/hotel-dashboard/reservations/guest-01.png',
      guest: 'Koné Ibrahim',
      property: 'Résidence Plateau',
      arrivalDate: createDate(2026, 4, 14),
      departureDate: createDate(2026, 4, 18),
      status: 'Confirmé',
    }),
    createReservation({
      id: '2',
      image: '/hotel-dashboard/reservations/guest-02.png',
      guest: 'Amani Natacha',
      property: 'Villa Riviera',
      arrivalDate: createDate(2026, 4, 16),
      departureDate: createDate(2026, 4, 19),
      status: 'Confirmé',
    }),
    createReservation({
      id: '3',
      image: '/hotel-dashboard/reservations/guest-03.png',
      guest: 'Kouamé Sarah',
      property: 'Appartement meublé',
      arrivalDate: createDate(2026, 4, 20),
      departureDate: createDate(2026, 4, 22),
      status: 'En attente',
    }),
    createReservation({
      id: '4',
      image: '/hotel-dashboard/reservations/guest-04.png',
      guest: 'Bamba Cédric',
      property: 'Suites des Lagunes',
      arrivalDate: createDate(2026, 4, 24),
      departureDate: createDate(2026, 4, 28),
      status: 'Confirmé',
    }),
    createReservation({
      id: '5',
      image: '/hotel-dashboard/reservations/guest-05.png',
      guest: 'Diallo Fanta',
      property: 'Résidence Plateau',
      arrivalDate: createDate(2026, 4, 29),
      departureDate: createDate(2026, 5, 2),
      status: 'Annulé',
    }),
    createReservation({
      id: '6',
      image: '/hotel-dashboard/reservations/guest-02.png',
      guest: 'Touré Mireille',
      property: 'Villa Azur',
      arrivalDate: createDate(2026, 5, 3),
      departureDate: createDate(2026, 5, 6),
      status: 'Confirmé',
    }),
    createReservation({
      id: '7',
      image: '/hotel-dashboard/reservations/guest-04.png',
      guest: 'N’Guessan Flora',
      property: 'Loft Cocody',
      arrivalDate: createDate(2026, 5, 8),
      departureDate: createDate(2026, 5, 10),
      status: 'En attente',
    }),
    createReservation({
      id: '8',
      image: '/hotel-dashboard/reservations/guest-01.png',
      guest: 'Yao Christian',
      property: 'Résidence Plateau',
      arrivalDate: createDate(2026, 5, 11),
      departureDate: createDate(2026, 5, 15),
      status: 'Confirmé',
    }),
    createReservation({
      id: '9',
      image: '/hotel-dashboard/reservations/guest-03.png',
      guest: 'Koffi Nadia',
      property: 'Appartement meublé',
      arrivalDate: createDate(2026, 5, 16),
      departureDate: createDate(2026, 5, 20),
      status: 'Confirmé',
    }),
    createReservation({
      id: '10',
      image: '/hotel-dashboard/reservations/guest-05.png',
      guest: 'Kouassi Landry',
      property: 'Villa Riviera',
      arrivalDate: createDate(2026, 5, 18),
      departureDate: createDate(2026, 5, 21),
      status: 'Annulé',
    }),
    createReservation({
      id: '11',
      image: '/hotel-dashboard/reservations/guest-02.png',
      guest: 'Boni Grâce',
      property: 'Suites des Lagunes',
      arrivalDate: createDate(2026, 5, 22),
      departureDate: createDate(2026, 5, 26),
      status: 'Confirmé',
    }),
    createReservation({
      id: '12',
      image: '/hotel-dashboard/reservations/guest-04.png',
      guest: 'Ouattara Idriss',
      property: 'Villa Azur',
      arrivalDate: createDate(2026, 5, 27),
      departureDate: createDate(2026, 5, 30),
      status: 'En attente',
    }),
  ];

  readonly filteredReservations = computed(() => {
    const query = normalizeText(this.searchTerm());
    const selectedRange = this.selectedRange();

    return this.reservations.filter((reservation) => {
      const matchesSearch =
        query.length === 0 || reservation.searchIndex.includes(query);
      const matchesDate =
        !selectedRange || this.matchesSelectedRange(reservation, selectedRange);

      return matchesSearch && matchesDate;
    });
  });

  readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.filteredReservations().length / PAGE_SIZE)),
  );

  readonly pagedReservations = computed(() => {
    const startIndex = (this.currentPage() - 1) * PAGE_SIZE;

    return this.filteredReservations().slice(
      startIndex,
      startIndex + PAGE_SIZE,
    );
  });

  constructor() {
    effect(() => {
      const totalPages = this.totalPages();

      if (this.currentPage() > totalPages) {
        this.currentPage.set(totalPages);
      }
    });
  }

  onSearchChange(value: string): void {
    this.searchTerm.set(value);
    this.currentPage.set(1);
  }

  onDateRangeApplied(range: DateRange): void {
    this.selectedRange.set(range);
    this.currentPage.set(1);
  }

  resetFilters(): void {
    this.searchTerm.set('');
    this.selectedRange.set(null);
    this.currentPage.set(1);
  }

  protected formatTableDate(date: Date): string {
    return formatTableDate(date);
  }

  private matchesSelectedRange(
    reservation: Reservation,
    selectedRange: DateRange,
  ): boolean {
    const filterStart = this.startOfDay(selectedRange.start);
    const filterEnd = this.startOfDay(selectedRange.end);
    const reservationStart = this.startOfDay(reservation.arrivalDate);
    const reservationEnd = this.startOfDay(reservation.departureDate);

    return reservationStart <= filterEnd && reservationEnd >= filterStart;
  }

  private startOfDay(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }
}

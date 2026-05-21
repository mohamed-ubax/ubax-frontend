import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { UbaxMorphTabsDirective } from '@ubax-workspace/shared-ui';
import {
  HotelReservationsStore,
  type HotelReservation,
} from '@ubax-workspace/ubax-web-data-access';
import type {
  CalReservation,
  CalendarDay,
  CalendarWeekEvent,
  WeekWithEvents,
} from '../../types/calendrier.types';

@Component({
  selector: 'ubax-calendrier-page',
  standalone: true,
  imports: [RouterLink, UbaxMorphTabsDirective],
  templateUrl: './calendrier-page.component.html',
  styleUrl: './calendrier-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CalendrierPageComponent {
  private readonly store = inject(HotelReservationsStore);

  activeView = signal<'Jour' | 'Semaine' | 'Mois' | 'Année'>('Mois');

  private readonly weekBaseHeight = 147.196;
  private readonly weekRowOffset = 82;
  private readonly multiDayEventInset = 44;
  private readonly multiDayEventWidthOffset = 88;
  private readonly singleDayEventInset = 18;
  private readonly singleDayEventWidthOffset = 36;
  private readonly maxMultiDayEventWidth = 381.45;
  private readonly maxSingleDayEventWidth = 192;

  private readonly today = new Date();
  currentDate = signal(
    new Date(this.today.getFullYear(), this.today.getMonth(), 1),
  );

  readonly monthNames = [
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

  readonly dayNames = [
    'Dimanche',
    'Lundi',
    'Mardi',
    'Mercredi',
    'Jeudi',
    'Vendredi',
    'Samedi',
  ];

  readonly views: Array<'Jour' | 'Semaine' | 'Mois' | 'Année'> = [
    'Jour',
    'Semaine',
    'Mois',
    'Année',
  ];

  readonly occupancyRate = computed(() => {
    const total = this.store.totalElements();

    if (total <= 0) {
      return 0;
    }

    const occupied = this.store
      .entities()
      .filter((reservation) =>
        ['CONFIRMED', 'COMPLETED', 'NO_SHOW'].includes(reservation.status),
      ).length;

    return Math.min(100, Math.round((occupied / total) * 100));
  });

  readonly arrivalsToday = computed(
    () =>
      this.store
        .entities()
        .filter(
          (reservation) =>
            this.isSameDay(reservation.checkInDate, this.today) &&
            reservation.status !== 'CANCELLED',
        ).length,
  );

  readonly departuresToday = computed(
    () =>
      this.store
        .entities()
        .filter(
          (reservation) =>
            this.isSameDay(reservation.checkOutDate, this.today) &&
            reservation.status !== 'CANCELLED',
        ).length,
  );

  readonly dailyRevenue = computed(() =>
    this.store.entities().reduce((sum, reservation) => {
      if (
        this.isSameDay(reservation.checkInDate, this.today) &&
        ['CONFIRMED', 'COMPLETED', 'NO_SHOW'].includes(reservation.status)
      ) {
        return sum + (reservation.totalAmount ?? 0);
      }

      return sum;
    }, 0),
  );

  readonly todayReservationCount = computed(
    () =>
      this.store.entities().filter((reservation) => {
        const start = this.parseDate(reservation.checkInDate);

        return (
          start?.getMonth() === this.currentDate().getMonth() &&
          start?.getFullYear() === this.currentDate().getFullYear()
        );
      }).length,
  );

  readonly monthLabel = computed(() => {
    const d = this.currentDate();
    return `${this.monthNames[d.getMonth()]} ${d.getFullYear()}`;
  });

  readonly reservations = computed((): CalReservation[] => {
    return this.store
      .entities()
      .flatMap((reservation) => this.mapToCalendarReservation(reservation));
  });

  constructor() {
    this.store.load?.({
      pageable: { page: 0, size: 200, sort: ['createdAt,desc'] },
    });
    this.store.loadStatusCounts();
  }

  private normalize(d: Date): Date {
    const n = new Date(d);
    n.setHours(0, 0, 0, 0);
    return n;
  }

  readonly weeksWithEvents = computed((): WeekWithEvents[] => {
    const d = this.currentDate();
    const year = d.getFullYear();
    const month = d.getMonth();
    const todayStr = this.today.toDateString();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days: CalendarDay[] = [];

    // Prev month trailing days
    const startDow = firstDay.getDay();
    for (let i = startDow - 1; i >= 0; i--) {
      const date = new Date(year, month, -i);
      days.push({
        date,
        dayNumber: date.getDate(),
        isCurrentMonth: false,
        isToday: false,
      });
    }

    // Current month
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const date = new Date(year, month, day);
      days.push({
        date,
        dayNumber: day,
        isCurrentMonth: true,
        isToday: date.toDateString() === todayStr,
      });
    }

    // Fill remaining cells to complete last row
    const remainder = days.length % 7;
    if (remainder !== 0) {
      for (let i = 1; i <= 7 - remainder; i++) {
        const date = new Date(year, month + 1, i);
        days.push({
          date,
          dayNumber: i,
          isCurrentMonth: false,
          isToday: false,
        });
      }
    }

    // Split into weeks and compute events per week
    const weeks: WeekWithEvents[] = [];
    for (let i = 0; i < days.length; i += 7) {
      const week = days.slice(i, i + 7);
      const wStart = this.normalize(week[0].date);
      const wEnd = this.normalize(week[6].date);

      const events = this.reservations()
        .filter(
          (r) =>
            this.normalize(r.start) <= wEnd && this.normalize(r.end) >= wStart,
        )
        .map((r) => {
          const rStart = this.normalize(r.start);
          const rEnd = this.normalize(r.end);

          const startColIdx =
            rStart < wStart
              ? 0
              : week.findIndex(
                  (day) =>
                    this.normalize(day.date).getTime() === rStart.getTime(),
                );
          const startCol = Math.max(0, startColIdx);

          const endColIdx =
            rEnd > wEnd
              ? 6
              : week.findIndex(
                  (day) =>
                    this.normalize(day.date).getTime() === rEnd.getTime(),
                );
          const endCol = endColIdx < 0 ? 6 : endColIdx;

          return {
            ...r,
            startCol,
            endCol,
            row: 0,
            spanDays: endCol - startCol + 1,
          };
        })
        .sort((left, right) => {
          if (left.startCol !== right.startCol) {
            return left.startCol - right.startCol;
          }

          if (left.endCol !== right.endCol) {
            return right.endCol - left.endCol;
          }

          return left.start.getTime() - right.start.getTime();
        });

      const rowEndCols: number[] = [];
      const placedEvents = events.map((event) => {
        let row = rowEndCols.findIndex(
          (lastEndCol) => event.startCol > lastEndCol,
        );

        if (row === -1) {
          row = rowEndCols.length;
        }

        rowEndCols[row] = event.endCol;

        return {
          ...event,
          row,
        };
      });

      const rowCount = Math.max(1, rowEndCols.length);
      const minHeight =
        this.weekBaseHeight + (rowCount - 1) * this.weekRowOffset;

      weeks.push({ days: week, events: placedEvents, rowCount, minHeight });
    }

    return weeks;
  });

  prevMonth(): void {
    const d = this.currentDate();
    this.currentDate.set(new Date(d.getFullYear(), d.getMonth() - 1, 1));
  }

  nextMonth(): void {
    const d = this.currentDate();
    this.currentDate.set(new Date(d.getFullYear(), d.getMonth() + 1, 1));
  }

  goToToday(): void {
    this.currentDate.set(
      new Date(this.today.getFullYear(), this.today.getMonth(), 1),
    );
  }

  getWeekClasses(week: WeekWithEvents, isLast: boolean): string {
    const classes = [
      'cal-week',
      `cal-week--rows-${Math.min(week.rowCount, 4)}`,
    ];

    if (isLast) {
      classes.push('cal-week--last');
    }

    return classes.join(' ');
  }

  getEventClasses(event: CalendarWeekEvent): string {
    const classes = [
      'cal-event',
      `cal-event--${event.color}`,
      `cal-event--start-${event.startCol}`,
      `cal-event--span-${Math.min(event.spanDays, 7)}`,
      `cal-event--row-${Math.min(event.row, 3)}`,
    ];

    if (event.spanDays === 1) {
      classes.push('cal-event--compact', 'cal-event--mini');
    }

    return classes.join(' ');
  }

  private formatDateRange(start: Date, end: Date): string {
    const startDay = String(start.getDate()).padStart(2, '0');
    const endDay = String(end.getDate()).padStart(2, '0');
    const sameMonth =
      start.getMonth() === end.getMonth() &&
      start.getFullYear() === end.getFullYear();

    if (sameMonth) {
      return `${startDay} - ${endDay} ${this.monthNames[start.getMonth()].toLowerCase()} ${start.getFullYear()}`;
    }

    const formatter = new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });

    return `${formatter.format(start)} - ${formatter.format(end)}`;
  }

  private mapToCalendarReservation(
    reservation: HotelReservation,
  ): CalReservation[] {
    const start = this.parseDate(reservation.checkInDate);
    const end = this.parseDate(reservation.checkOutDate);

    if (!start || !end) {
      return [];
    }

    return [
      {
        id: reservation.id,
        guest: reservation.clientFullName ?? 'Client UBAX',
        property: reservation.propertyTitle ?? 'Réservation',
        amount: this.formatCurrency(reservation.totalAmount),
        dateRange: this.formatDateRange(start, end),
        start,
        end,
        image: this.resolveGuestImage(reservation.id),
        color: this.resolveReservationColor(reservation.status),
      },
    ];
  }

  private parseDate(value?: string): Date | null {
    if (!value) {
      return null;
    }

    const date = new Date(value);

    return Number.isNaN(date.getTime()) ? null : date;
  }

  private resolveGuestImage(id: string): string {
    const images = [
      'hotel-dashboard/reservations/guest-01.webp',
      'hotel-dashboard/reservations/guest-02.webp',
      'hotel-dashboard/reservations/guest-03.webp',
      'hotel-dashboard/reservations/guest-04.webp',
      'hotel-dashboard/reservations/guest-05.webp',
    ];
    const hash = Array.from(id).reduce(
      (sum, char) => sum + (char.codePointAt(0) ?? 0),
      0,
    );

    return images[hash % images.length];
  }

  private resolveReservationColor(
    status: HotelReservation['status'],
  ): CalReservation['color'] {
    switch (status) {
      case 'CONFIRMED':
        return 'green';
      case 'COMPLETED':
      case 'NO_SHOW':
        return 'blue';
      case 'CANCELLED':
      case 'PENDING':
      default:
        return 'orange';
    }
  }

  protected formatCurrency(value?: number): string {
    if (typeof value !== 'number') {
      return '—';
    }

    return `${new Intl.NumberFormat('fr-FR', {
      maximumFractionDigits: 0,
    }).format(value)} FCFA`;
  }

  private isSameDay(value: string | undefined, date: Date): boolean {
    const target = this.parseDate(value);

    return Boolean(
      target?.getDate() === date.getDate() &&
        target?.getMonth() === date.getMonth() &&
        target?.getFullYear() === date.getFullYear(),
    );
  }
}

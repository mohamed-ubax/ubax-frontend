import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DateRange, DateRangePickerComponent } from '@ubax-workspace/shared-ui';
import {
  COMMERCIAL_ACTIVE_DATE,
  COMMERCIAL_DISPLAY_MONTH,
  COMMERCIAL_ICON_ASSETS,
  COMMERCIAL_RESERVATIONS,
  filterReservations,
  formatDateRange,
  formatMonthLabel,
  startOfDay,
} from '../../reservation-commercial.data';
import { ReservationMiniCalendarComponent } from '../../components/reservation-mini-calendar/reservation-mini-calendar.component';

interface CalendarDay {
  readonly date: Date;
  readonly label: number;
  readonly isCurrentMonth: boolean;
  readonly isActive: boolean;
}

interface CalendarReservationEvent {
  readonly id: string;
  readonly guest: string;
  readonly property: string;
  readonly amount: string;
  readonly image: string;
  readonly start: Date;
  readonly end: Date;
  readonly tone: 'green' | 'orange' | 'blue';
  readonly dateRange: string;
  readonly startCol: number;
  readonly endCol: number;
  readonly row: number;
  readonly spanDays: number;
}

interface CalendarWeek {
  readonly days: readonly CalendarDay[];
  readonly events: readonly CalendarReservationEvent[];
  readonly rowCount: number;
}

interface LegendEntry {
  readonly property: string;
  readonly tone: 'green' | 'orange' | 'blue';
}

@Component({
  selector: 'ubax-reservation-calendar-page',
  standalone: true,
  imports: [
    FormsModule,
    RouterLink,
    DateRangePickerComponent,
    ReservationMiniCalendarComponent,
  ],
  templateUrl: './reservation-calendar-page.component.html',
  styleUrl: './reservation-calendar-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReservationCalendarPageComponent {
  readonly icons = COMMERCIAL_ICON_ASSETS;
  readonly weekLabels = [
    'Lundi',
    'Mardi',
    'Mercredi',
    'Jeudi',
    'Vendredi',
    'Samedi',
    'Dimanche',
  ];
  readonly datePickerOpen = signal(false);
  readonly selectedRange = signal<DateRange | null>(null);
  readonly searchTerm = signal('');
  readonly currentMonth = signal(COMMERCIAL_DISPLAY_MONTH);
  readonly activeDate = signal(COMMERCIAL_ACTIVE_DATE);

  readonly filteredReservations = computed(() =>
    filterReservations(
      COMMERCIAL_RESERVATIONS,
      this.searchTerm(),
      this.selectedRange(),
    ),
  );

  readonly monthLabel = computed(() => formatMonthLabel(this.currentMonth()));

  readonly legendEntries = computed<LegendEntry[]>(() => {
    const entries = new Map<string, LegendEntry>();

    this.filteredReservations().forEach((reservation) => {
      if (!entries.has(reservation.property)) {
        entries.set(reservation.property, {
          property: reservation.property,
          tone: reservation.eventTone,
        });
      }
    });

    return [...entries.values()].slice(0, 4);
  });

  readonly weeks = computed<CalendarWeek[]>(() => {
    const month = this.currentMonth();
    const year = month.getFullYear();
    const monthIndex = month.getMonth();
    const firstDay = new Date(year, monthIndex, 1);
    const lastDay = new Date(year, monthIndex + 1, 0);
    const monthDays: CalendarDay[] = [];
    const firstDayOffset = (firstDay.getDay() + 6) % 7;

    for (let day = firstDayOffset; day > 0; day -= 1) {
      const date = new Date(year, monthIndex, 1 - day);

      monthDays.push(this.createCalendarDay(date, false));
    }

    for (let day = 1; day <= lastDay.getDate(); day += 1) {
      monthDays.push(
        this.createCalendarDay(new Date(year, monthIndex, day), true),
      );
    }

    while (monthDays.length % 7 !== 0) {
      const offset =
        monthDays.length - (firstDayOffset + lastDay.getDate()) + 1;
      monthDays.push(
        this.createCalendarDay(new Date(year, monthIndex + 1, offset), false),
      );
    }

    const weeks: CalendarWeek[] = [];

    for (let index = 0; index < monthDays.length; index += 7) {
      const weekDays = monthDays.slice(index, index + 7);
      const weekStart = startOfDay(weekDays[0].date);
      const weekEnd = startOfDay(weekDays[6].date);
      const rawEvents = this.filteredReservations()
        .filter(
          (reservation) =>
            startOfDay(reservation.arrivalDate) <= weekEnd &&
            startOfDay(reservation.departureDate) >= weekStart,
        )
        .map((reservation) => {
          const start = startOfDay(reservation.arrivalDate);
          const end = startOfDay(reservation.departureDate);
          const startCol =
            start < weekStart
              ? 0
              : weekDays.findIndex(
                  (day) => startOfDay(day.date).getTime() === start.getTime(),
                );
          const endCol =
            end > weekEnd
              ? 6
              : weekDays.findIndex(
                  (day) => startOfDay(day.date).getTime() === end.getTime(),
                );

          return {
            id: reservation.id,
            guest: reservation.guest,
            property: reservation.property,
            amount: reservation.amount,
            image: reservation.guestImage,
            start: reservation.arrivalDate,
            end: reservation.departureDate,
            tone: reservation.eventTone,
            dateRange: formatDateRange(
              reservation.arrivalDate,
              reservation.departureDate,
            ),
            startCol: Math.max(0, startCol),
            endCol: endCol < 0 ? 6 : endCol,
            row: 0,
            spanDays: Math.max(
              1,
              (endCol < 0 ? 6 : endCol) - Math.max(0, startCol) + 1,
            ),
          } satisfies CalendarReservationEvent;
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
      const events = rawEvents.map((event) => {
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
        } satisfies CalendarReservationEvent;
      });

      weeks.push({
        days: weekDays,
        events,
        rowCount: Math.max(1, rowEndCols.length),
      });
    }

    return weeks;
  });

  constructor() {
    effect(() => {
      const range = this.selectedRange();

      if (range) {
        this.currentMonth.set(
          new Date(range.start.getFullYear(), range.start.getMonth(), 1),
        );
      }
    });
  }

  onSearchChange(value: string): void {
    this.searchTerm.set(value);
  }

  onDateRangeApplied(range: DateRange): void {
    this.selectedRange.set(range);
  }

  protected previousMonth(): void {
    const month = this.currentMonth();
    this.currentMonth.set(
      new Date(month.getFullYear(), month.getMonth() - 1, 1),
    );
  }

  protected nextMonth(): void {
    const month = this.currentMonth();
    this.currentMonth.set(
      new Date(month.getFullYear(), month.getMonth() + 1, 1),
    );
  }

  protected rangeLabel(): string {
    const range = this.selectedRange();

    return range
      ? formatDateRange(range.start, range.end, ' - ')
      : 'Sélectionner une date';
  }

  protected weekClass(week: CalendarWeek, isLast: boolean): string {
    const classes = [
      'calendar-week',
      `calendar-week--rows-${Math.min(week.rowCount, 4)}`,
    ];

    if (isLast) {
      classes.push('calendar-week--last');
    }

    return classes.join(' ');
  }

  protected eventClass(event: CalendarReservationEvent): string {
    const classes = [
      'calendar-event',
      `calendar-event--${event.tone}`,
      `calendar-event--start-${event.startCol}`,
      `calendar-event--span-${Math.min(event.spanDays, 7)}`,
      `calendar-event--row-${Math.min(event.row, 3)}`,
    ];

    if (event.spanDays === 1) {
      classes.push('calendar-event--compact');
    }

    return classes.join(' ');
  }

  private createCalendarDay(date: Date, isCurrentMonth: boolean): CalendarDay {
    return {
      date,
      label: date.getDate(),
      isCurrentMonth,
      isActive:
        date.getFullYear() === this.activeDate().getFullYear() &&
        date.getMonth() === this.activeDate().getMonth() &&
        date.getDate() === this.activeDate().getDate(),
    };
  }
}

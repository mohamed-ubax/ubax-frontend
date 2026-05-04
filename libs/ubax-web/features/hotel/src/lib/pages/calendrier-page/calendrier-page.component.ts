import {
  ChangeDetectionStrategy,
  Component,
  computed,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { UbaxMorphTabsDirective } from '@ubax-workspace/shared-ui';

type CalReservation = {
  id: string;
  guest: string;
  property: string;
  amount: string;
  dateRange: string;
  start: Date;
  end: Date;
  image: string;
  color: 'green' | 'blue' | 'orange';};

type CalReservationTemplate = {
  id: string;
  guest: string;
  property: string;
  amount: string;
  startDay: number;
  durationDays: number;
  image: string;
  color: 'green' | 'blue' | 'orange';};

type CalendarDay = {
  date: Date;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;};

type CalendarWeekEvent = CalReservation & {
  startCol: number;
  endCol: number;
  row: number;
  spanDays: number;};

type WeekWithEvents = {
  days: CalendarDay[];
  events: CalendarWeekEvent[];
  rowCount: number;
  minHeight: number;};

@Component({
  selector: 'ubax-calendrier-page',
  standalone: true,
  imports: [RouterLink, UbaxMorphTabsDirective],
  templateUrl: './calendrier-page.component.html',
  styleUrl: './calendrier-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CalendrierPageComponent {
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

  readonly monthLabel = computed(() => {
    const d = this.currentDate();
    return `${this.monthNames[d.getMonth()]} ${d.getFullYear()}`;
  });

  private readonly reservationTemplates: CalReservationTemplate[] = [
    {
      id: '1',
      guest: 'Konan Olivier',
      property: 'Appartement meublé',
      amount: '150 000 FCFA',
      startDay: 2,
      durationDays: 2,
      image: '/hotel-dashboard/reservations/guest-04.webp',
      color: 'orange',
    },
    {
      id: '2',
      guest: 'Konan Olivier',
      property: 'résidence Plateau',
      amount: '150 000 FCFA',
      startDay: 6,
      durationDays: 2,
      image: '/hotel-dashboard/reservations/guest-02.webp',
      color: 'green',
    },
    {
      id: '3',
      guest: 'Konan Olivier',
      property: 'Villa Riviera',
      amount: '150 000 FCFA',
      startDay: 9,
      durationDays: 2,
      image: '/hotel-dashboard/reservations/guest-03.webp',
      color: 'blue',
    },
    {
      id: '4',
      guest: 'Konan Olivier',
      property: 'Villa Riviera',
      amount: '150 000 FCFA',
      startDay: 12,
      durationDays: 2,
      image: '/hotel-dashboard/reservations/guest-01.webp',
      color: 'blue',
    },
    {
      id: '5',
      guest: 'Konan Olivier',
      property: 'Villa Riviera',
      amount: '150 000 FCFA',
      startDay: 15,
      durationDays: 2,
      image: '/hotel-dashboard/reservations/guest-04.webp',
      color: 'orange',
    },
    {
      id: '6',
      guest: 'Konan Olivier',
      property: 'résidence Plateau',
      amount: '150 000 FCFA',
      startDay: 20,
      durationDays: 2,
      image: '/hotel-dashboard/reservations/guest-05.webp',
      color: 'green',
    },
    {
      id: '7',
      guest: 'Konan Olivier',
      property: 'Villa Riviera',
      amount: '150 000 FCFA',
      startDay: 23,
      durationDays: 2,
      image: '/hotel-dashboard/reservations/guest-02.webp',
      color: 'blue',
    },
    {
      id: '8',
      guest: 'Konan Olivier',
      property: 'Villa Riviera',
      amount: '150 000 FCFA',
      startDay: 26,
      durationDays: 2,
      image: '/hotel-dashboard/reservations/guest-04.webp',
      color: 'orange',
    },
    {
      id: '9',
      guest: 'Konan Olivier',
      property: 'Villa Riviera',
      amount: '150 000 FCFA',
      startDay: 29,
      durationDays: 2,
      image: '/hotel-dashboard/reservations/guest-01.webp',
      color: 'blue',
    },
  ];

  readonly reservations = computed((): CalReservation[] => {
    const currentMonth = this.currentDate();
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    return this.reservationTemplates.map((template) => {
      const { startDay, durationDays, ...reservation } = template;
      const maxStartDay = Math.max(1, daysInMonth - durationDays + 1);
      const resolvedStartDay = Math.min(startDay, maxStartDay);
      const resolvedEndDay = Math.min(
        daysInMonth,
        resolvedStartDay + durationDays - 1,
      );
      const start = new Date(year, month, resolvedStartDay);
      const end = new Date(year, month, resolvedEndDay);

      return {
        ...reservation,
        start,
        end,
        dateRange: this.formatDateRange(start, end),
      };
    });
  });

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
}

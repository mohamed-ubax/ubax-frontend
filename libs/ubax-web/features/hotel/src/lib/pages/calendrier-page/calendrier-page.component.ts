import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

interface CalReservation {
  id: string;
  guest: string;
  property: string;
  amount: string;
  dateRange: string;
  start: Date;
  end: Date;
  color: 'green' | 'blue' | 'orange';
}

interface CalendarDay {
  date: Date;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
}

interface WeekWithEvents {
  days: CalendarDay[];
  events: Array<CalReservation & { startCol: number; endCol: number }>;
}

@Component({
  selector: 'ubax-calendrier-page',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './calendrier-page.component.html',
  styleUrl: './calendrier-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CalendrierPageComponent {
  activeView = signal<'Jour' | 'Semaine' | 'Mois' | 'Année'>('Mois');

  private readonly today = new Date();
  currentDate = signal(new Date(this.today.getFullYear(), this.today.getMonth(), 1));

  readonly monthNames = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
  ];

  readonly dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

  readonly views: Array<'Jour' | 'Semaine' | 'Mois' | 'Année'> = ['Jour', 'Semaine', 'Mois', 'Année'];

  readonly monthLabel = computed(() => {
    const d = this.currentDate();
    return `${this.monthNames[d.getMonth()]} ${d.getFullYear()}`;
  });

  private readonly reservations: CalReservation[] = [
    {
      id: '1', guest: 'Konan Olivier', property: 'résidence Plateau',
      amount: '150 000 FCFA', dateRange: '06 - 08 avr.',
      start: new Date(2026, 3, 6), end: new Date(2026, 3, 8),
      color: 'green',
    },
    {
      id: '2', guest: 'Konan Olivier', property: 'résidence Plateau',
      amount: '150 000 FCFA', dateRange: '20 - 22 avr.',
      start: new Date(2026, 3, 20), end: new Date(2026, 3, 22),
      color: 'green',
    },
    {
      id: '3', guest: 'Konan Olivier', property: 'Villa Riviera',
      amount: '150 000 FCFA', dateRange: '09 - 11 avr.',
      start: new Date(2026, 3, 9), end: new Date(2026, 3, 11),
      color: 'blue',
    },
    {
      id: '4', guest: 'Konan Olivier', property: 'Villa Riviera',
      amount: '150 000 FCFA', dateRange: '14 - 16 avr.',
      start: new Date(2026, 3, 14), end: new Date(2026, 3, 16),
      color: 'blue',
    },
    {
      id: '5', guest: 'Konan Olivier', property: 'Villa Riviera',
      amount: '150 000 FCFA', dateRange: '23 - 25 avr.',
      start: new Date(2026, 3, 23), end: new Date(2026, 3, 25),
      color: 'blue',
    },
    {
      id: '6', guest: 'Konan Olivier', property: 'Villa Riviera',
      amount: '150 000 FCFA', dateRange: '28 - 30 avr.',
      start: new Date(2026, 3, 28), end: new Date(2026, 3, 30),
      color: 'blue',
    },
    {
      id: '7', guest: 'Konan Olivier', property: 'Appartement meublé',
      amount: '150 000 FCFA', dateRange: '02 - 04 avr.',
      start: new Date(2026, 3, 2), end: new Date(2026, 3, 4),
      color: 'orange',
    },
    {
      id: '8', guest: 'Konan Olivier', property: 'Appartement meublé',
      amount: '150 000 FCFA', dateRange: '17 - 19 avr.',
      start: new Date(2026, 3, 17), end: new Date(2026, 3, 19),
      color: 'orange',
    },
    {
      id: '9', guest: 'Konan Olivier', property: 'Appartement meublé',
      amount: '150 000 FCFA', dateRange: '26 - 28 avr.',
      start: new Date(2026, 3, 26), end: new Date(2026, 3, 28),
      color: 'orange',
    },
  ];

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
      days.push({ date, dayNumber: date.getDate(), isCurrentMonth: false, isToday: false });
    }

    // Current month
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const date = new Date(year, month, day);
      days.push({ date, dayNumber: day, isCurrentMonth: true, isToday: date.toDateString() === todayStr });
    }

    // Fill remaining cells to complete last row
    const remainder = days.length % 7;
    if (remainder !== 0) {
      for (let i = 1; i <= 7 - remainder; i++) {
        const date = new Date(year, month + 1, i);
        days.push({ date, dayNumber: i, isCurrentMonth: false, isToday: false });
      }
    }

    // Split into weeks and compute events per week
    const weeks: WeekWithEvents[] = [];
    for (let i = 0; i < days.length; i += 7) {
      const week = days.slice(i, i + 7);
      const wStart = this.normalize(week[0].date);
      const wEnd = this.normalize(week[6].date);

      const events = this.reservations
        .filter(r => this.normalize(r.start) <= wEnd && this.normalize(r.end) >= wStart)
        .map(r => {
          const rStart = this.normalize(r.start);
          const rEnd = this.normalize(r.end);

          const startColIdx = rStart < wStart
            ? 0
            : week.findIndex(day => this.normalize(day.date).getTime() === rStart.getTime());
          const startCol = startColIdx < 0 ? 0 : startColIdx;

          const endColIdx = rEnd > wEnd
            ? 6
            : week.findIndex(day => this.normalize(day.date).getTime() === rEnd.getTime());
          const endCol = endColIdx < 0 ? 6 : endColIdx;

          return { ...r, startCol, endCol };
        });

      weeks.push({ days: week, events });
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
    this.currentDate.set(new Date(this.today.getFullYear(), this.today.getMonth(), 1));
  }
}

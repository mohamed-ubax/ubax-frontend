import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  input,
  signal,
} from '@angular/core';
import {
  COMMERCIAL_ACTIVE_DATE,
  COMMERCIAL_DISPLAY_MONTH,
  COMMERCIAL_ICON_ASSETS,
  formatMonthLabel,
} from '../../reservation-commercial.data';

interface MiniCalendarCell {
  readonly label: string;
  readonly muted: boolean;
  readonly active: boolean;
}

type MiniCalendarWeek = readonly MiniCalendarCell[];

@Component({
  selector: 'ubax-reservation-mini-calendar',
  standalone: true,
  templateUrl: './reservation-mini-calendar.component.html',
  styleUrl: './reservation-mini-calendar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReservationMiniCalendarComponent {
  readonly initialMonth = input<Date>(COMMERCIAL_DISPLAY_MONTH);
  readonly activeDate = input<Date | null>(COMMERCIAL_ACTIVE_DATE);

  protected readonly icons = COMMERCIAL_ICON_ASSETS;
  protected readonly weekLabels = ['Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa', 'Di'];
  protected readonly displayMonth = signal(COMMERCIAL_DISPLAY_MONTH);
  protected readonly monthLabel = computed(() =>
    formatMonthLabel(this.displayMonth()),
  );
  protected readonly weeks = computed(() =>
    this.buildWeeks(this.displayMonth(), this.activeDate()),
  );

  constructor() {
    effect(() => {
      const month = this.initialMonth();
      this.displayMonth.set(new Date(month.getFullYear(), month.getMonth(), 1));
    });
  }

  protected previousMonth(): void {
    const month = this.displayMonth();
    this.displayMonth.set(
      new Date(month.getFullYear(), month.getMonth() - 1, 1),
    );
  }

  protected nextMonth(): void {
    const month = this.displayMonth();
    this.displayMonth.set(
      new Date(month.getFullYear(), month.getMonth() + 1, 1),
    );
  }

  private buildWeeks(
    displayMonth: Date,
    activeDate: Date | null,
  ): MiniCalendarWeek[] {
    const firstDay = new Date(
      displayMonth.getFullYear(),
      displayMonth.getMonth(),
      1,
    );
    const lastDay = new Date(
      displayMonth.getFullYear(),
      displayMonth.getMonth() + 1,
      0,
    );
    const startOffset = (firstDay.getDay() + 6) % 7;
    const weekCount = Math.ceil((startOffset + lastDay.getDate()) / 7);
    const gridStart = new Date(
      displayMonth.getFullYear(),
      displayMonth.getMonth(),
      1 - startOffset,
    );
    const weeks: MiniCalendarWeek[] = [];

    for (let weekIndex = 0; weekIndex < weekCount; weekIndex += 1) {
      const week: MiniCalendarCell[] = [];

      for (let dayIndex = 0; dayIndex < 7; dayIndex += 1) {
        const cellDate = new Date(gridStart);
        cellDate.setDate(gridStart.getDate() + weekIndex * 7 + dayIndex);

        week.push({
          label: cellDate.getDate().toString(),
          muted: cellDate.getMonth() !== displayMonth.getMonth(),
          active:
            activeDate !== null &&
            cellDate.getFullYear() === activeDate.getFullYear() &&
            cellDate.getMonth() === activeDate.getMonth() &&
            cellDate.getDate() === activeDate.getDate(),
        });
      }

      weeks.push(week);
    }

    return weeks;
  }
}

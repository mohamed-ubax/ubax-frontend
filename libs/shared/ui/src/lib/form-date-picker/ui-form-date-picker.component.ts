import {
  ChangeDetectionStrategy,
  Component,
  computed,
  HostListener,
  input,
  model,
  signal,
} from '@angular/core';

interface CalendarDay {
  readonly date: Date;
  readonly label: string;
  readonly muted: boolean;
  readonly active: boolean;
}

const WEEKDAYS = ['Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa', 'Di'] as const;

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

function formatMonthYear(date: Date): string {
  const raw = new Intl.DateTimeFormat('fr-FR', {
    month: 'long',
    year: 'numeric',
  }).format(date);
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

function buildCalendarWeeks(
  displayMonth: Date,
  activeDate: Date,
): CalendarDay[][] {
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
  const weeks: CalendarDay[][] = [];

  for (let w = 0; w < weekCount; w++) {
    const week: CalendarDay[] = [];

    for (let d = 0; d < 7; d++) {
      const cell = new Date(gridStart);
      cell.setDate(gridStart.getDate() + w * 7 + d);

      week.push({
        date: cell,
        label: cell.getDate().toString(),
        muted: cell.getMonth() !== displayMonth.getMonth(),
        active:
          cell.getFullYear() === activeDate.getFullYear() &&
          cell.getMonth() === activeDate.getMonth() &&
          cell.getDate() === activeDate.getDate(),
      });
    }

    weeks.push(week);
  }

  return weeks;
}

@Component({
  selector: 'ubax-ui-form-date-picker',
  standalone: true,
  templateUrl: './ui-form-date-picker.component.html',
  styleUrl: './ui-form-date-picker.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiFormDatePickerComponent {
  readonly label = input('');
  readonly iconSrc = input('');
  readonly value = model<Date>(new Date());

  protected readonly isOpen = signal(false);
  protected readonly weekdays = WEEKDAYS;

  private readonly calendarMonth = signal(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  );

  protected readonly dateLabel = computed(() => formatDate(this.value()));

  protected readonly calendarLabel = computed(() =>
    formatMonthYear(this.calendarMonth()),
  );

  protected readonly calendarWeeks = computed(() =>
    buildCalendarWeeks(this.calendarMonth(), this.value()),
  );

  protected toggle(): void {
    if (this.isOpen()) {
      this.isOpen.set(false);
    } else {
      const v = this.value();
      this.calendarMonth.set(new Date(v.getFullYear(), v.getMonth(), 1));
      this.isOpen.set(true);
    }
  }

  protected close(): void {
    this.isOpen.set(false);
  }

  protected previousMonth(): void {
    const m = this.calendarMonth();
    this.calendarMonth.set(new Date(m.getFullYear(), m.getMonth() - 1, 1));
  }

  protected nextMonth(): void {
    const m = this.calendarMonth();
    this.calendarMonth.set(new Date(m.getFullYear(), m.getMonth() + 1, 1));
  }

  protected selectDate(date: Date): void {
    this.value.set(startOfDay(date));
    this.isOpen.set(false);
  }

  @HostListener('document:keydown', ['$event'])
  protected onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape' && this.isOpen()) {
      event.stopImmediatePropagation();
      this.isOpen.set(false);
    }
  }
}

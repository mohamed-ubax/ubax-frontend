import { CommonModule, DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  model,
  OnDestroy,
  output,
  signal,
} from '@angular/core';

export type DateRange = {
  start: Date;
  end: Date;};

type CalendarDay = {
  date: Date;
  dayNum: number;
  isCurrentMonth: boolean;};

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

export const DAY_NAMES = ['Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa', 'Di'];

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

@Component({
  selector: 'ubax-date-range-picker',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './date-range-picker.component.html',
  styleUrl: './date-range-picker.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DateRangePickerComponent implements OnDestroy {
  private readonly document = inject(DOCUMENT);
  private scrollLockState: {
    readonly htmlOverflow: string;
    readonly bodyOverflow: string;
    readonly bodyTouchAction: string;
    readonly bodyPosition: string;
    readonly bodyTop: string;
    readonly bodyWidth: string;
    readonly bodyHadDatePickerOpenClass: boolean;
    readonly scrollY: number;
  } | null = null;
  private closeTimeout: ReturnType<typeof setTimeout> | null = null;

  readonly isOpen = model<boolean>(false);
  readonly isClosing = signal(false);
  readonly applied = output<DateRange>();

  readonly dayNames = DAY_NAMES;

  // ── Calendar navigation ────────────────────────────────────────────
  readonly leftYear = signal(new Date().getFullYear());
  readonly leftMonth = signal(new Date().getMonth());

  readonly rightYear = computed(() =>
    this.leftMonth() === 11 ? this.leftYear() + 1 : this.leftYear(),
  );
  readonly rightMonth = computed(() => (this.leftMonth() + 1) % 12);

  readonly leftMonthLabel = computed(
    () => `${MONTH_NAMES[this.leftMonth()]} ${this.leftYear()}`,
  );
  readonly rightMonthLabel = computed(
    () => `${MONTH_NAMES[this.rightMonth()]} ${this.rightYear()}`,
  );

  readonly leftWeeks = computed(() =>
    this.buildMonth(this.leftYear(), this.leftMonth()),
  );
  readonly rightWeeks = computed(() =>
    this.buildMonth(this.rightYear(), this.rightMonth()),
  );

  // ── Selection state ────────────────────────────────────────────────
  readonly startDate = signal<Date | null>(null);
  readonly endDate = signal<Date | null>(null);
  readonly hoveredDate = signal<Date | null>(null);
  readonly activePreset = signal<string | null>(null);

  readonly startLabel = computed(() => this.formatDate(this.startDate()));
  readonly endLabel = computed(() => this.formatDate(this.endDate()));

  constructor() {
    effect(() => {
      if (this.isOpen()) {
        this.lockPageScroll();
      } else {
        this.unlockPageScroll();
      }
    });
  }

  // ── Quick presets ──────────────────────────────────────────────────
  readonly presets: Array<{ label: string; getValue: () => DateRange }> = [
    {
      label: "Aujourd'hui",
      getValue: () => {
        const d = startOfDay(new Date());
        return { start: d, end: d };
      },
    },
    {
      label: 'Hier',
      getValue: () => {
        const d = startOfDay(new Date());
        d.setDate(d.getDate() - 1);
        return { start: d, end: d };
      },
    },
    {
      label: 'Cette semaine',
      getValue: () => {
        const today = startOfDay(new Date());
        const dow = today.getDay() === 0 ? 6 : today.getDay() - 1;
        const start = new Date(today);
        start.setDate(today.getDate() - dow);
        return { start, end: today };
      },
    },
    {
      label: 'La semaine dernière',
      getValue: () => {
        const today = startOfDay(new Date());
        const dow = today.getDay() === 0 ? 6 : today.getDay() - 1;
        const end = new Date(today);
        end.setDate(today.getDate() - dow - 1);
        const start = new Date(end);
        start.setDate(end.getDate() - 6);
        return { start, end };
      },
    },
    {
      label: 'Ce mois ci',
      getValue: () => {
        const today = new Date();
        const start = new Date(today.getFullYear(), today.getMonth(), 1);
        const end = startOfDay(today);
        return { start, end };
      },
    },
    {
      label: 'Le mois dernier',
      getValue: () => {
        const today = new Date();
        const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const end = new Date(today.getFullYear(), today.getMonth(), 0);
        return { start, end };
      },
    },
    {
      label: 'Trois derniers mois',
      getValue: () => {
        const today = startOfDay(new Date());
        const start = new Date(today);
        start.setMonth(start.getMonth() - 3);
        return { start, end: today };
      },
    },
    {
      label: 'Six derniers mois',
      getValue: () => {
        const today = startOfDay(new Date());
        const start = new Date(today);
        start.setMonth(start.getMonth() - 6);
        return { start, end: today };
      },
    },
    {
      label: 'Cette Année',
      getValue: () => {
        const today = new Date();
        return {
          start: new Date(today.getFullYear(), 0, 1),
          end: startOfDay(today),
        };
      },
    },
    {
      label: "L'an dernier",
      getValue: () => {
        const y = new Date().getFullYear() - 1;
        return { start: new Date(y, 0, 1), end: new Date(y, 11, 31) };
      },
    },
    {
      label: 'Depuis le début',
      getValue: () => ({
        start: new Date(2020, 0, 1),
        end: startOfDay(new Date()),
      }),
    },
  ];

  // ── Calendar grid builder ──────────────────────────────────────────
  private buildMonth(year: number, month: number): CalendarDay[][] {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    // Monday-first offset
    let offset = firstDay.getDay() - 1;
    if (offset < 0) offset = 6;

    const days: CalendarDay[] = [];

    for (let i = offset; i > 0; i--) {
      const d = new Date(year, month, 1 - i);
      days.push({ date: d, dayNum: d.getDate(), isCurrentMonth: false });
    }
    for (let d = 1; d <= lastDay.getDate(); d++) {
      days.push({
        date: new Date(year, month, d),
        dayNum: d,
        isCurrentMonth: true,
      });
    }
    const target = days.length <= 35 ? 35 : 42;
    let n = 1;
    while (days.length < target) {
      days.push({
        date: new Date(year, month + 1, n++),
        dayNum: n - 1,
        isCurrentMonth: false,
      });
    }

    const weeks: CalendarDay[][] = [];
    for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7));
    return weeks;
  }

  // ── Navigation ─────────────────────────────────────────────────────
  prevMonth(): void {
    if (this.leftMonth() === 0) {
      this.leftYear.update((y) => y - 1);
      this.leftMonth.set(11);
    } else this.leftMonth.update((m) => m - 1);
  }

  nextMonth(): void {
    if (this.leftMonth() === 11) {
      this.leftYear.update((y) => y + 1);
      this.leftMonth.set(0);
    } else this.leftMonth.update((m) => m + 1);
  }

  // ── Day selection ──────────────────────────────────────────────────
  selectDay(date: Date): void {
    const start = this.startDate();
    if (!start || this.endDate()) {
      this.startDate.set(startOfDay(date));
      this.endDate.set(null);
    } else if (date < start) {
      this.startDate.set(startOfDay(date));
    } else {
      this.endDate.set(startOfDay(date));
    }
    this.activePreset.set(null);
  }

  hoverDay(date: Date): void {
    this.hoveredDate.set(startOfDay(date));
  }
  leaveDay(): void {
    this.hoveredDate.set(null);
  }

  isStart(date: Date): boolean {
    const s = this.startDate();
    return !!s && this.sameDay(date, s);
  }

  isEnd(date: Date): boolean {
    const e = this.endDate();
    return !!e && this.sameDay(date, e);
  }

  isInRange(date: Date): boolean {
    const start = this.startDate();
    const end =
      this.endDate() ?? (this.startDate() ? this.hoveredDate() : null);
    if (!start || !end) return false;
    const t = date.getTime(),
      s = start.getTime(),
      e = end.getTime();
    return s <= e ? t > s && t < e : t < s && t > e;
  }

  isToday(date: Date): boolean {
    return this.sameDay(date, new Date());
  }

  private sameDay(a: Date, b: Date): boolean {
    return (
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate()
    );
  }

  // ── Presets ────────────────────────────────────────────────────────
  applyPreset(label: string, range: DateRange): void {
    this.startDate.set(range.start);
    this.endDate.set(range.end);
    this.activePreset.set(label);
  }

  // ── Actions ────────────────────────────────────────────────────────
  apply(): void {
    const start = this.startDate();
    const end = this.endDate() ?? start;
    if (start && end) this.applied.emit({ start, end });
    this.close();
  }

  cancel(): void {
    this.close();
  }

  private close(): void {
    this.clearCloseTimeout();
    this.isClosing.set(true);
    this.closeTimeout = setTimeout(() => {
      this.isOpen.set(false);
      this.isClosing.set(false);
      this.closeTimeout = null;
    }, 220);
  }

  stopPropagation(event: MouseEvent): void {
    event.stopPropagation();
  }

  ngOnDestroy(): void {
    this.clearCloseTimeout();
    this.unlockPageScroll();
  }

  private lockPageScroll(): void {
    if (this.scrollLockState) {
      return;
    }

    const { body, documentElement, defaultView } = this.document;
    if (!body || !documentElement) {
      return;
    }

    this.scrollLockState = {
      htmlOverflow: documentElement.style.overflow,
      bodyOverflow: body.style.overflow,
      bodyTouchAction: body.style.touchAction,
      bodyPosition: body.style.position,
      bodyTop: body.style.top,
      bodyWidth: body.style.width,
      bodyHadDatePickerOpenClass: body.classList.contains(
        'ubax-date-picker-open',
      ),
      scrollY: defaultView?.scrollY ?? documentElement.scrollTop ?? 0,
    };

    body.classList.add('ubax-date-picker-open');
    documentElement.style.overflow = 'hidden';
    body.style.overflow = 'hidden';
    body.style.touchAction = 'none';
    body.style.position = 'fixed';
    body.style.top = `-${this.scrollLockState.scrollY}px`;
    body.style.width = '100%';
  }

  private unlockPageScroll(): void {
    if (!this.scrollLockState) {
      return;
    }

    const { body, documentElement, defaultView } = this.document;

    documentElement.style.overflow = this.scrollLockState.htmlOverflow;
    body.style.overflow = this.scrollLockState.bodyOverflow;
    body.style.touchAction = this.scrollLockState.bodyTouchAction;
    body.style.position = this.scrollLockState.bodyPosition;
    body.style.top = this.scrollLockState.bodyTop;
    body.style.width = this.scrollLockState.bodyWidth;

    if (!this.scrollLockState.bodyHadDatePickerOpenClass) {
      body.classList.remove('ubax-date-picker-open');
    }

    defaultView?.scrollTo({
      top: this.scrollLockState.scrollY,
      left: 0,
      behavior: 'auto',
    });

    this.scrollLockState = null;
  }

  private clearCloseTimeout(): void {
    if (this.closeTimeout === null) {
      return;
    }

    clearTimeout(this.closeTimeout);
    this.closeTimeout = null;
  }

  // ── Formatting ─────────────────────────────────────────────────────
  private formatDate(d: Date | null): string {
    if (!d) return 'JJ - MM - AA';
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yy = String(d.getFullYear()).slice(-2);
    return `${dd} - ${mm} - ${yy}`;
  }
}

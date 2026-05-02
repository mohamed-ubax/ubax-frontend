import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  EmbeddedViewRef,
  HostListener,
  inject,
  input,
  model,
  OnDestroy,
  Renderer2,
  signal,
  TemplateRef,
  ViewChild,
  ViewContainerRef,
} from '@angular/core';

type CalendarDay = {
  readonly date: Date;
  readonly label: string;
  readonly muted: boolean;
  readonly active: boolean;};

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
export class UiFormDatePickerComponent implements OnDestroy {
  readonly label = input('');
  readonly iconSrc = input('');
  readonly value = model<Date>(new Date());

  protected readonly isOpen = signal(false);
  protected readonly weekdays = WEEKDAYS;
  protected readonly calendarTop = signal(0);
  protected readonly calendarLeft = signal(0);

  @ViewChild('calendarTpl') private calendarTpl!: TemplateRef<void>;

  private calendarView: EmbeddedViewRef<void> | null = null;
  private calendarEl: HTMLElement | null = null;

  private readonly el = inject(ElementRef) as ElementRef<HTMLElement>;
  private readonly vcr = inject(ViewContainerRef);
  private readonly renderer = inject(Renderer2);

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
      this.close();
    } else {
      const v = this.value();
      this.calendarMonth.set(new Date(v.getFullYear(), v.getMonth(), 1));

      const trigger = this.el.nativeElement.querySelector<HTMLElement>(
        '.form-date-picker__trigger',
      );
      if (trigger) {
        const rect = trigger.getBoundingClientRect();
        this.calendarTop.set(rect.bottom + 10);
        this.calendarLeft.set(rect.left);
      }

      this.isOpen.set(true);
      this.calendarView = this.vcr.createEmbeddedView(this.calendarTpl);
      this.calendarView.detectChanges();
      this.calendarEl =
        this.calendarView.rootNodes.find(
          (n): n is HTMLElement => n.nodeType === Node.ELEMENT_NODE,
        ) ?? null;
      if (this.calendarEl) {
        this.renderer.appendChild(document.body, this.calendarEl);
      }
    }
  }

  protected close(): void {
    this.isOpen.set(false);
    const el = this.calendarEl;
    const view = this.calendarView;
    this.calendarEl = null;
    this.calendarView = null;
    if (el && view) {
      el.classList.add('is-leaving');
      el.addEventListener('animationend', () => view.destroy(), { once: true });
    } else {
      view?.destroy();
    }
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
    this.close();
  }

  ngOnDestroy(): void {
    this.calendarView?.destroy();
  }

  @HostListener('document:click', ['$event'])
  protected onDocumentClick(event: MouseEvent): void {
    const target = event.target as Node;
    if (
      !this.el.nativeElement.contains(target) &&
      !this.calendarEl?.contains(target)
    ) {
      this.close();
    }
  }

  @HostListener('document:keydown', ['$event'])
  protected onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape' && this.isOpen()) {
      event.stopImmediatePropagation();
      this.close();
    }
  }
}

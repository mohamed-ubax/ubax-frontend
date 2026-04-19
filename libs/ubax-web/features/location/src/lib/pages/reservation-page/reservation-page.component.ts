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
import {
  COMMERCIAL_ICON_ASSETS,
  COMMERCIAL_RESERVATION_KPIS,
  COMMERCIAL_RESERVATIONS,
  filterReservations,
  formatDateRange,
} from '../../reservation-commercial.data';
import { ReservationKpiStripComponent } from '../../components/reservation-kpi-strip/reservation-kpi-strip.component';

const PAGE_SIZE = 10;

@Component({
  selector: 'ubax-reservation-page',
  standalone: true,
  imports: [
    FormsModule,
    RouterLink,
    UbaxPaginatorComponent,
    DateRangePickerComponent,
    DatePipe,
    ReservationKpiStripComponent,
  ],
  templateUrl: './reservation-page.component.html',
  styleUrl: './reservation-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReservationPageComponent {
  readonly icons = COMMERCIAL_ICON_ASSETS;
  readonly kpiCards = COMMERCIAL_RESERVATION_KPIS;
  readonly datePickerOpen = signal(false);
  readonly selectedRange = signal<DateRange | null>(null);
  readonly searchTerm = signal('');
  readonly currentPage = signal(1);

  readonly filteredReservations = computed(() => {
    return filterReservations(
      COMMERCIAL_RESERVATIONS,
      this.searchTerm(),
      this.selectedRange(),
    );
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

  protected rangeLabel(): string {
    const range = this.selectedRange();

    return range
      ? formatDateRange(range.start, range.end, ' - ')
      : 'Sélectionner une date';
  }
}

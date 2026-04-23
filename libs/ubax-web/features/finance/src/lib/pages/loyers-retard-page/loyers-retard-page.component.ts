import {
  ChangeDetectionStrategy,
  Component,
  computed,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { UbaxPaginatorComponent } from '@ubax-workspace/shared-ui';
import {
  FINANCE_ASSETS,
  FINANCE_OVERDUE_ROWS,
  FINANCE_SUMMARY_CARDS,
  FinanceOverdueRow,
} from '../../finance-ui.data';

type OverdueItem = FinanceOverdueRow & { readonly uid: string };

const PERIOD_OPTIONS = [
  'Avril 2025',
  'Mars 2025',
  'Février 2025',
  'Janvier 2025',
  'Décembre 2024',
] as const;

const ALL_ROWS: readonly OverdueItem[] = Array.from(
  { length: 5 },
  (_, pageIndex) =>
    FINANCE_OVERDUE_ROWS.map((row, index) => ({
      ...row,
      uid: `finance-overdue-${pageIndex + 1}-${index + 1}`,
    })),
).flat();

@Component({
  selector: 'ubax-loyers-retard-page',
  standalone: true,
  imports: [RouterLink, UbaxPaginatorComponent, FormsModule],
  templateUrl: './loyers-retard-page.component.html',
  styleUrl: './loyers-retard-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoyersRetardPageComponent {
  protected readonly assets = FINANCE_ASSETS;
  protected readonly periodOptions = PERIOD_OPTIONS;
  protected readonly currentPage = signal(3);
  protected readonly selectedPeriod =
    signal<(typeof PERIOD_OPTIONS)[number]>('Avril 2025');
  protected readonly searchQuery = signal('');
  protected readonly unpaidBalance = FINANCE_SUMMARY_CARDS[0].amount;
  protected readonly filteredRows = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    const selectedPeriod = this.selectedPeriod();

    return ALL_ROWS.filter((row) => {
      const matchesPeriod = row.period === selectedPeriod;
      const matchesQuery =
        query.length === 0
          ? true
          : [row.tenant, row.property, row.amount, row.penalty]
              .join(' ')
              .toLowerCase()
              .includes(query);

      return matchesPeriod && matchesQuery;
    });
  });
  protected readonly totalPages = computed(() =>
    Math.max(
      1,
      Math.ceil(this.filteredRows().length / FINANCE_OVERDUE_ROWS.length),
    ),
  );
  protected readonly pagedRows = computed(() => {
    const start = (this.currentPage() - 1) * FINANCE_OVERDUE_ROWS.length;
    return this.filteredRows().slice(
      start,
      start + FINANCE_OVERDUE_ROWS.length,
    );
  });

  protected setSelectedPeriod(value: (typeof PERIOD_OPTIONS)[number]): void {
    if (PERIOD_OPTIONS.includes(value)) {
      this.selectedPeriod.set(value);
      this.currentPage.set(1);
    }
  }

  protected setSearchQuery(value: string): void {
    this.searchQuery.set(value);
    this.currentPage.set(1);
  }
}

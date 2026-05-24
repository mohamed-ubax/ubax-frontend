import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { UbaxPaginatorComponent } from '@ubax-workspace/shared-ui';
import { FINANCE_ASSETS } from '../../constants/finance-ui.constants';
import { PaymentsStore } from '@ubax-workspace/ubax-web-data-access';

const PAGE_SIZE = 6;

@Component({
  selector: 'ubax-loyers-retard-page',
  standalone: true,
  imports: [RouterLink, UbaxPaginatorComponent, FormsModule],
  templateUrl: './loyers-retard-page.component.html',
  styleUrl: './loyers-retard-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoyersRetardPageComponent implements OnInit {
  private readonly paymentsStore = inject(PaymentsStore);

  protected readonly assets = FINANCE_ASSETS;
  protected readonly currentPage = signal(1);
  protected readonly searchQuery = signal('');

  protected readonly unpaidBalance = computed(
    () => this.paymentsStore.kpiLoyerAttente() ?? '—',
  );

  protected readonly filteredRows = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    const rows = this.paymentsStore.latePaymentRows();

    if (query.length === 0) return rows;
    return rows.filter((row) =>
      [row.tenant, row.property, row.amount, row.penalty]
        .join(' ')
        .toLowerCase()
        .includes(query),
    );
  });

  protected readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.filteredRows().length / PAGE_SIZE)),
  );

  protected readonly pagedRows = computed(() => {
    const start = (this.currentPage() - 1) * PAGE_SIZE;
    return this.filteredRows().slice(start, start + PAGE_SIZE);
  });

  protected readonly isLoading = computed(() => this.paymentsStore.loadingLate());

  ngOnInit(): void {
    this.paymentsStore.loadLatePayments();
    this.paymentsStore.loadDashboard();
  }

  protected setSearchQuery(value: string): void {
    this.searchQuery.set(value);
    this.currentPage.set(1);
  }
}

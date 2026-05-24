import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { UbaxPaginatorComponent } from '@ubax-workspace/shared-ui';
import { ExpensesStore } from '@ubax-workspace/ubax-web-data-access';
import { ExpenseCreateRequest } from '@ubax-workspace/shared-api-types';
import { FINANCE_ASSETS } from '../../constants/finance-ui.constants';
import { NouvelleDepenseDialogComponent } from '../../components/nouvelle-depense-dialog/nouvelle-depense-dialog.component';

const PAGE_SIZE = 8;

const CATEGORY_LABELS: Record<string, string> = {
  MAINTENANCE: 'Entretien',
  MARKETING: 'Marketing',
  SALARY: 'Salaire',
  UTILITIES: 'Charges',
  TAX: 'Taxes',
  OTHER: 'Autre',
};

@Component({
  selector: 'ubax-depenses-list-page',
  standalone: true,
  imports: [RouterLink, UbaxPaginatorComponent, NouvelleDepenseDialogComponent],
  templateUrl: './depenses-list-page.component.html',
  styleUrl: './depenses-list-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DepensesListPageComponent implements OnInit {
  private readonly expensesStore = inject(ExpensesStore);

  protected readonly assets = FINANCE_ASSETS;
  protected readonly currentPage = signal(1);
  protected readonly searchQuery = signal('');
  protected readonly isAddOpen = signal(false);
  protected readonly isLoading = computed(() => this.expensesStore.loading());
  protected readonly isCreating = computed(() => this.expensesStore.creatingExpense());
  protected readonly createError = computed(() => this.expensesStore.createExpenseError());

  protected readonly filteredRows = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    const rows = this.expensesStore.entities().map((e) => ({
      id: e.id,
      uid: `exp-${e.id}`,
      date: e.expenseDate ?? e.createdAt ?? '—',
      reference: e.invoiceReference ?? '—',
      category: CATEGORY_LABELS[e.category ?? ''] ?? (e.category ?? '—'),
      label: e.label ?? '—',
      provider: e.provider ?? '—',
      amount: e.amount != null ? `${e.amount.toLocaleString('fr-FR')} FCFA` : '—',
    }));

    if (query.length === 0) return rows;
    return rows.filter((r) =>
      [r.date, r.reference, r.category, r.label, r.provider, r.amount]
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

  ngOnInit(): void {
    this.expensesStore.load?.({ pageable: { page: 0, size: 100, sort: [] } });
  }

  protected setSearchQuery(value: string): void {
    this.searchQuery.set(value);
    this.currentPage.set(1);
  }

  protected openAdd(): void {
    this.isAddOpen.set(true);
    this.expensesStore.clearExpenseFeedback();
  }

  protected closeAdd(): void {
    this.isAddOpen.set(false);
  }

  protected submitExpense(body: ExpenseCreateRequest): void {
    this.expensesStore.createExpense(body);
  }
}

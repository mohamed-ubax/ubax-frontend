import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  AgencyBailleursStore,
  type AgencyBailleur,
} from '@ubax-workspace/ubax-web-data-access';
import {
  EmptyStateComponent,
  SearchFilterBarComponent,
  SectionCardComponent,
} from '@ubax-workspace/shared-design-system';
import {
  deriveViewState,
  type UiDataTableColumn,
  type ViewState,
  UiDataTableCellDefDirective,
  UiDataTableComponent,
  UiDataTableEmptyDefDirective,
  UiPaginationComponent,
} from '@ubax-workspace/shared-ui';

const PAGE_SIZE = 10;

@Component({
  selector: 'ubax-bailleurs-list-page',
  standalone: true,
  imports: [
    DatePipe,
    RouterLink,
    EmptyStateComponent,
    SearchFilterBarComponent,
    SectionCardComponent,
    UiDataTableComponent,
    UiDataTableCellDefDirective,
    UiDataTableEmptyDefDirective,
    UiPaginationComponent,
  ],
  providers: [AgencyBailleursStore],
  templateUrl: './bailleurs-list-page.component.html',
  styleUrl: './bailleurs-list-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BailleursListPageComponent {
  protected readonly store = inject(AgencyBailleursStore);
  protected readonly pageSize = PAGE_SIZE;

  protected readonly searchValue = signal('');
  protected readonly currentPage = signal(1);
  private readonly hasLoaded = signal(false);

  protected readonly tableColumns: readonly UiDataTableColumn<AgencyBailleur>[] =
    [
      { key: 'owner', header: 'Bailleur', width: '28%' },
      { key: 'phone', header: 'Téléphone', width: '18%' },
      { key: 'email', header: 'Email', width: '22%' },
      { key: 'joinedAt', header: 'Rattaché le', width: '18%' },
      { key: 'actions', header: 'Actions', width: '14%', align: 'end' },
    ];

  protected readonly viewState = computed<ViewState>(() =>
    deriveViewState(
      this.store.loading(),
      this.store.error(),
      this.store.entities().length === 0,
      this.hasLoaded(),
    ),
  );

  protected readonly filteredRows = computed(() => {
    const query = this.searchValue().toLowerCase().trim();

    return this.store.entities().filter((bailleur) => {
      if (!query) {
        return true;
      }

      return [
        bailleur.firstName,
        bailleur.lastName,
        bailleur.phone,
        bailleur.email,
      ]
        .filter((value): value is string => Boolean(value))
        .some((value) => value.toLowerCase().includes(query));
    });
  });

  protected readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.filteredRows().length / PAGE_SIZE)),
  );

  protected readonly pagedRows = computed(() => {
    const start = (this.currentPage() - 1) * PAGE_SIZE;
    return this.filteredRows().slice(start, start + PAGE_SIZE);
  });

  constructor() {
    effect(
      () => {
        this.store.load?.({ page: 0, size: 200, sort: ['joinedAt,desc'] });
      },
      { allowSignalWrites: true },
    );

    effect(() => {
      if (!this.store.loading() && !this.hasLoaded()) {
        this.hasLoaded.set(true);
      }
    });

    effect(() => {
      this.searchValue();
      this.currentPage.set(1);
    });
  }

  protected onSearchChange(value: string): void {
    this.searchValue.set(value);
  }

  protected onPageChange(page: number): void {
    this.currentPage.set(page);
  }

  protected fullName(bailleur: AgencyBailleur): string {
    return [bailleur.firstName, bailleur.lastName]
      .filter((value): value is string => Boolean(value))
      .join(' ');
  }
}

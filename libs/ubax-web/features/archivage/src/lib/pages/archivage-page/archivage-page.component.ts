import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { UbaxPaginatorComponent } from '@ubax-workspace/shared-ui';

import {
  ARCHIVAGE_ICONS,
  ARCHIVAGE_TAB_DEFINITIONS,
  type ArchivageFieldId,
  type ArchivageRow,
  type ArchivageTabDefinition,
  type ArchivageTabId,
} from './archivage-page.data';

interface ArchivageFiltersState {
  readonly keyword: string;
  readonly startDate: string;
  readonly endDate: string;
  readonly owner: string;
  readonly archivedBy: string;
  readonly type: string;
}

const DEFAULT_FILTERS: ArchivageFiltersState = {
  keyword: '',
  startDate: '',
  endDate: '',
  owner: '',
  archivedBy: '',
  type: '',
};

function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replaceAll(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function stringifyRowCells(row: ArchivageRow): string[] {
  return row.cells.map((cell) => {
    switch (cell.kind) {
      case 'avatar':
        return cell.value;
      case 'badge':
        return cell.label;
      case 'actions':
        return `${cell.primaryLabel} / ${cell.secondaryLabel}`;
      default:
        return cell.value;
    }
  });
}

@Component({
  selector: 'ubax-archivage-page',
  standalone: true,
  imports: [UbaxPaginatorComponent],
  templateUrl: './archivage-page.component.html',
  styleUrl: './archivage-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArchivagePageComponent {
  private readonly document = inject(DOCUMENT);

  protected readonly tabs = ARCHIVAGE_TAB_DEFINITIONS;
  protected readonly icons = ARCHIVAGE_ICONS;
  protected readonly PAGE_SIZE = 6;
  protected readonly activeTab = signal<ArchivageTabId>('biens');
  protected readonly currentPage = signal(1);
  protected readonly headerSearch = signal('');
  protected readonly filters = signal<ArchivageFiltersState>(DEFAULT_FILTERS);

  protected readonly activeDefinition = computed<ArchivageTabDefinition>(() => {
    return (
      ARCHIVAGE_TAB_DEFINITIONS.find((tab) => tab.id === this.activeTab()) ??
      ARCHIVAGE_TAB_DEFINITIONS[0]
    );
  });

  protected readonly filteredRows = computed<readonly ArchivageRow[]>(() => {
    const globalQuery = normalizeText(this.headerSearch());
    const filters = this.filters();

    return this.activeDefinition().rows.filter((row) => {
      if (
        globalQuery &&
        !normalizeText(row.searchIndex).includes(globalQuery)
      ) {
        return false;
      }

      if (
        filters.keyword &&
        !normalizeText(row.searchIndex).includes(normalizeText(filters.keyword))
      ) {
        return false;
      }

      if (filters.startDate && row.startDate !== filters.startDate) {
        return false;
      }

      if (filters.endDate && row.endDate !== filters.endDate) {
        return false;
      }

      if (filters.owner && row.owner !== filters.owner) {
        return false;
      }

      if (filters.archivedBy && row.archivedBy !== filters.archivedBy) {
        return false;
      }

      if (filters.type && row.type !== filters.type) {
        return false;
      }

      return true;
    });
  });

  protected readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.filteredRows().length / this.PAGE_SIZE)),
  );

  protected readonly pagedRows = computed<readonly ArchivageRow[]>(() => {
    const start = (this.currentPage() - 1) * this.PAGE_SIZE;
    return this.filteredRows().slice(start, start + this.PAGE_SIZE);
  });

  protected selectTab(tabId: ArchivageTabId): void {
    if (tabId === this.activeTab()) {
      return;
    }

    this.activeTab.set(tabId);
    this.currentPage.set(1);
    this.headerSearch.set('');
    this.filters.set(DEFAULT_FILTERS);
  }

  protected updateHeaderSearch(event: Event): void {
    this.headerSearch.set(this.getTextInputValue(event));
    this.currentPage.set(1);
  }

  protected updateFilter(field: ArchivageFieldId, value: string): void {
    this.filters.update((state) => ({
      ...state,
      [field]: value,
    }));
    this.currentPage.set(1);
  }

  protected applyFilters(event: Event): void {
    event.preventDefault();
    this.currentPage.set(1);
  }

  protected getTextInputValue(event: Event): string {
    return (event.target as HTMLInputElement | null)?.value ?? '';
  }

  protected getSelectValue(event: Event): string {
    return (event.target as HTMLSelectElement | null)?.value ?? '';
  }

  protected exportCurrentView(): void {
    const currentWindow = this.document.defaultView;

    if (!currentWindow) {
      return;
    }

    const lines = [
      this.activeDefinition().columns.join(';'),
      ...this.filteredRows().map((row) => stringifyRowCells(row).join(';')),
    ];
    const blob = new Blob([lines.join('\n')], {
      type: 'text/csv;charset=utf-8',
    });
    const url = currentWindow.URL.createObjectURL(blob);
    const link = this.document.createElement('a');

    link.href = url;
    link.download = `${this.activeTab()}-archives.csv`;
    this.document.body.append(link);
    link.click();
    link.remove();
    currentWindow.URL.revokeObjectURL(url);
  }
}

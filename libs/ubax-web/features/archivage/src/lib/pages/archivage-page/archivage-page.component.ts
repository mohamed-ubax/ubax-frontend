import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { UbaxPaginatorComponent } from '@ubax-workspace/shared-ui';
import { DatePickerModule } from 'primeng/datepicker';
import { SelectModule } from 'primeng/select';

import {
  ARCHIVAGE_ICONS,
  ARCHIVAGE_TAB_DEFINITIONS,
  type ArchivageFilterField,
  type ArchivageFieldId,
  type ArchivageRow,
  type ArchivageTabDefinition,
  type ArchivageTabId,
} from './archivage-page.data';

interface ArchivageFiltersState {
  readonly keyword: string;
  readonly startDate: Date | null;
  readonly endDate: Date | null;
  readonly owner: string;
  readonly archivedBy: string;
  readonly type: string;
}

interface ArchivageSelectOption {
  readonly label: string;
  readonly value: string;
}

const FRENCH_MONTH_NAMES = [
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
] as const;

const ARCHIVAGE_DATE_PATTERN = /^\d{2}\/\d{2}\/\d{4}$/;

const DEFAULT_FILTERS: ArchivageFiltersState = {
  keyword: '',
  startDate: null,
  endDate: null,
  owner: '',
  archivedBy: '',
  type: '',
};

function cloneDate(value: Date | null): Date | null {
  return value ? new Date(value) : null;
}

function normalizeCalendarDate(value: Date): Date {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate());
}

function parseRowDate(value: string): Date | null {
  const [day, month, year] = value.split('/').map(Number);

  if (!day || !month || !year) {
    return null;
  }

  return new Date(year, month - 1, day);
}

function formatLongFrenchDate(value: Date): string {
  const day = String(value.getDate()).padStart(2, '0');
  const month = FRENCH_MONTH_NAMES[value.getMonth()];

  if (!month) {
    return `${day}/${String(value.getMonth() + 1).padStart(2, '0')}/${value.getFullYear()}`;
  }

  return `${day} ${month} ${value.getFullYear()}`;
}

function getDateRangeValidationMessage(
  filters: ArchivageFiltersState,
): string | null {
  const hasStartDate = !!filters.startDate;
  const hasEndDate = !!filters.endDate;

  if (hasStartDate !== hasEndDate) {
    return 'Renseignez la date de début et la date de fin pour appliquer un intervalle.';
  }

  if (!filters.startDate || !filters.endDate) {
    return null;
  }

  const startDate = normalizeCalendarDate(filters.startDate);
  const endDate = normalizeCalendarDate(filters.endDate);

  return startDate > endDate
    ? 'La date de début ne peut pas être supérieure à la date de fin.'
    : null;
}

function getEffectiveDateRange(filters: ArchivageFiltersState): {
  readonly start: Date;
  readonly end: Date;
} | null {
  if (getDateRangeValidationMessage(filters)) {
    return null;
  }

  const { startDate, endDate } = filters;

  if (!startDate || !endDate) {
    return null;
  }

  const normalizedStartDate = normalizeCalendarDate(startDate);
  const normalizedEndDate = normalizeCalendarDate(endDate);

  return { start: normalizedStartDate, end: normalizedEndDate };
}

function isRowWithinDateRange(
  row: ArchivageRow,
  dateRange: { readonly start: Date; readonly end: Date },
): boolean {
  const rowStart = parseRowDate(row.startDate);
  const rowEnd = parseRowDate(row.endDate);

  if (!rowStart || !rowEnd) {
    return false;
  }

  return rowStart >= dateRange.start && rowEnd <= dateRange.end;
}

function cloneFiltersState(
  filters: ArchivageFiltersState,
): ArchivageFiltersState {
  return {
    ...filters,
    startDate: cloneDate(filters.startDate),
    endDate: cloneDate(filters.endDate),
  };
}

function areFilterDatesEqual(left: Date | null, right: Date | null): boolean {
  if (!left || !right) {
    return left === right;
  }

  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

function areFiltersEqual(
  left: ArchivageFiltersState,
  right: ArchivageFiltersState,
): boolean {
  return (
    left.keyword === right.keyword &&
    areFilterDatesEqual(left.startDate, right.startDate) &&
    areFilterDatesEqual(left.endDate, right.endDate) &&
    left.owner === right.owner &&
    left.archivedBy === right.archivedBy &&
    left.type === right.type
  );
}

function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
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
  imports: [
    FormsModule,
    DatePickerModule,
    SelectModule,
    UbaxPaginatorComponent,
  ],
  templateUrl: './archivage-page.component.html',
  styleUrl: './archivage-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArchivagePageComponent {
  private readonly document = inject(DOCUMENT);

  protected readonly tabs = ARCHIVAGE_TAB_DEFINITIONS;
  protected readonly icons = ARCHIVAGE_ICONS;
  protected readonly PAGE_SIZE = 10;
  protected readonly standaloneModelOptions = { standalone: true };
  protected readonly activeTab = signal<ArchivageTabId>('biens');
  protected readonly currentPage = signal(1);
  protected readonly headerSearch = signal('');
  protected readonly draftFilters = signal<ArchivageFiltersState>(
    cloneFiltersState(DEFAULT_FILTERS),
  );
  protected readonly appliedFilters = signal<ArchivageFiltersState>(
    cloneFiltersState(DEFAULT_FILTERS),
  );

  protected readonly activeDefinition = computed<ArchivageTabDefinition>(() => {
    return (
      ARCHIVAGE_TAB_DEFINITIONS.find((tab) => tab.id === this.activeTab()) ??
      ARCHIVAGE_TAB_DEFINITIONS[0]
    );
  });

  protected readonly dateRangeValidationMessage = computed(() =>
    getDateRangeValidationMessage(this.draftFilters()),
  );

  protected readonly hasDateRangeValidationIssue = computed(
    () => !!this.dateRangeValidationMessage(),
  );

  protected readonly showResetFiltersButton = computed(() => {
    const hasAppliedFilters = !areFiltersEqual(
      this.appliedFilters(),
      DEFAULT_FILTERS,
    );
    const hasPendingDraftChanges = !areFiltersEqual(
      this.draftFilters(),
      this.appliedFilters(),
    );

    return (
      hasAppliedFilters &&
      (!hasPendingDraftChanges || this.hasDateRangeValidationIssue())
    );
  });

  protected readonly filteredRows = computed<readonly ArchivageRow[]>(() => {
    const globalQuery = normalizeText(this.headerSearch());
    const filters = this.appliedFilters();
    const effectiveDateRange = getEffectiveDateRange(filters);

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

      if (
        effectiveDateRange &&
        !isRowWithinDateRange(row, effectiveDateRange)
      ) {
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
    this.clearFilters();
  }

  protected updateHeaderSearch(event: Event): void {
    this.headerSearch.set(this.getTextInputValue(event));
    this.currentPage.set(1);
  }

  protected updateDraftFilter(field: ArchivageFieldId, value: string): void {
    this.draftFilters.update(
      (state) =>
        ({
          ...state,
          [field]: value,
        }) as ArchivageFiltersState,
    );
  }

  protected updateDraftDateFilter(
    field: ArchivageFieldId,
    value: Date | null,
  ): void {
    this.draftFilters.update(
      (state) =>
        ({
          ...state,
          [field]: cloneDate(value),
        }) as ArchivageFiltersState,
    );
  }

  protected applyFilters(event: Event): void {
    event.preventDefault();

    if (this.hasDateRangeValidationIssue()) {
      return;
    }

    this.appliedFilters.set(cloneFiltersState(this.draftFilters()));
    this.currentPage.set(1);
  }

  protected clearFilters(): void {
    this.draftFilters.set(cloneFiltersState(DEFAULT_FILTERS));
    this.appliedFilters.set(cloneFiltersState(DEFAULT_FILTERS));
    this.currentPage.set(1);
  }

  protected getTextInputValue(event: Event): string {
    return (event.target as HTMLInputElement | null)?.value ?? '';
  }

  protected getDraftFilterValue(field: ArchivageFieldId): string {
    const value = this.draftFilters()[field];

    return typeof value === 'string' ? value : '';
  }

  protected getDraftDateValue(field: ArchivageFieldId): Date | null {
    const value = this.draftFilters()[field];

    return value instanceof Date ? value : null;
  }

  protected getSelectOptions(
    field: ArchivageFilterField,
  ): ArchivageSelectOption[] {
    return [
      { label: field.label, value: '' },
      ...(field.options ?? []).map((option) => ({
        label: option,
        value: option,
      })),
    ];
  }

  protected formatTableCellValue(value: string): string {
    if (!ARCHIVAGE_DATE_PATTERN.test(value)) {
      return value;
    }

    const parsedDate = parseRowDate(value);

    return parsedDate ? formatLongFrenchDate(parsedDate) : value;
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

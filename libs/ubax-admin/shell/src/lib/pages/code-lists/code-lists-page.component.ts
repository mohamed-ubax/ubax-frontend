import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { firstValueFrom } from 'rxjs';
import {
  FormsModule,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import type { LaCodeListDto } from '@ubax-workspace/shared-api-types';
import {
  EmptyStateComponent,
  SearchFilterBarComponent,
  SectionCardComponent,
  StatusBadgeComponent,
  type FilterOption,
} from '@ubax-workspace/shared-design-system';
import {
  NOTIFICATION_HANDLER,
  resolveHttpErrorMessage,
} from '@ubax-workspace/shared-data-access';
import {
  UiDataTableCellDefDirective,
  type UiDataTableColumn,
  UiDataTableComponent,
  UiDataTableEmptyDefDirective,
  UiPaginationComponent,
} from '@ubax-workspace/shared-ui';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { AdminCodeListsService } from '../../services/admin-code-lists.service';
import { extractCodeListTypes } from '../../services/admin-code-lists.helpers';

type SourceFilter = 'all' | 'system' | 'manual';
type EditorMode = 'create' | 'edit';

const TYPE_FILTER_LABEL = 'Tous les types';
const SOURCE_FILTER_LABEL = 'Toutes les sources';
const CUSTOM_TYPE_VALUE = '__custom__';
const PAGE_SIZE = 12;
const PAGINATION_ARROW_LEFT_SRC =
  'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none"%3E%3Cpath d="M15 6l-6 6 6 6" stroke="%231a3047" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/%3E%3C/svg%3E';
const PAGINATION_ARROW_RIGHT_SRC =
  'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none"%3E%3Cpath d="M9 6l6 6-6 6" stroke="%231a3047" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/%3E%3C/svg%3E';

const SOURCE_FILTER_OPTIONS: FilterOption[] = [
  { label: 'Toutes les sources', value: 'all' },
  { label: 'Système', value: 'system' },
  { label: 'Manuelles', value: 'manual' },
];

function normalizeText(value: string): string {
  return value.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

function formatTypeLabel(type?: string): string {
  if (!type) return 'Sans type';

  return type
    .split('_')
    .filter(Boolean)
    .map((segment) => segment[0] + segment.slice(1).toLowerCase())
    .join(' ');
}

function buildPreference(entry: LaCodeListDto): {
  id?: string;
  type?: string;
  value?: string;
} {
  return {
    id: entry.id,
    type: entry.type,
    value: entry.value,
  };
}

@Component({
  selector: 'ubax-admin-code-lists-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    FormsModule,
    SearchFilterBarComponent,
    SectionCardComponent,
    StatusBadgeComponent,
    EmptyStateComponent,
    UiDataTableComponent,
    UiDataTableCellDefDirective,
    UiDataTableEmptyDefDirective,
    UiPaginationComponent,
    DialogModule,
    SelectModule,
  ],
  templateUrl: './code-lists-page.component.html',
  styleUrl: './code-lists-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CodeListsPageComponent implements OnInit {
  private readonly service = inject(AdminCodeListsService);
  private readonly notifications = inject(NOTIFICATION_HANDLER);
  private readonly formBuilder = inject(NonNullableFormBuilder);

  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected readonly codeLists = signal<LaCodeListDto[]>([]);
  protected readonly searchQuery = signal('');
  protected readonly selectedType = signal<string>('all');
  protected readonly selectedSource = signal<SourceFilter>('all');
  protected readonly editorMode = signal<EditorMode>('create');
  protected readonly selectedId = signal<string | null>(null);
  protected readonly currentPage = signal(1);
  protected readonly editorOpen = signal(false);
  protected readonly selectedTypeOption = signal<string | null>(null);

  protected readonly paginationArrowLeftSrc = PAGINATION_ARROW_LEFT_SRC;
  protected readonly paginationArrowRightSrc = PAGINATION_ARROW_RIGHT_SRC;

  protected readonly tableColumns: readonly UiDataTableColumn<LaCodeListDto>[] =
    [
      { key: 'type', header: 'Type', width: '22%' },
      { key: 'value', header: 'Valeur', width: '18%' },
      { key: 'description', header: 'Description', width: '32%' },
      { key: 'source', header: 'Source', width: '12%' },
      { key: 'actions', header: 'Action', width: '16%', align: 'end' },
    ];

  protected readonly form = this.formBuilder.group({
    type: ['', [Validators.required, Validators.maxLength(80)]],
    value: ['', [Validators.required, Validators.maxLength(80)]],
    description: ['', [Validators.maxLength(255)]],
    systemAssign: [false],
  });

  protected readonly knownTypes = computed(() =>
    extractCodeListTypes(this.codeLists()),
  );

  protected readonly typeSelectOptions = computed<FilterOption[]>(() => [
    ...this.knownTypes().map((type) => ({
      label: formatTypeLabel(type),
      value: type,
    })),
    {
      label: 'Saisir un nouveau type',
      value: CUSTOM_TYPE_VALUE,
    },
  ]);

  protected readonly isCustomTypeSelected = computed(
    () => this.selectedTypeOption() === CUSTOM_TYPE_VALUE,
  );

  protected readonly searchFilters = computed<
    { label: string; options: FilterOption[] }[]
  >(() => [
    {
      label: TYPE_FILTER_LABEL,
      options: [
        { label: TYPE_FILTER_LABEL, value: 'all' },
        ...this.knownTypes().map((type) => ({
          label: formatTypeLabel(type),
          value: type,
        })),
      ],
    },
    {
      label: SOURCE_FILTER_LABEL,
      options: SOURCE_FILTER_OPTIONS,
    },
  ]);

  protected readonly selectedEntry = computed(
    () =>
      this.codeLists().find((entry) => entry.id === this.selectedId()) ?? null,
  );

  protected readonly focusEntry = computed(() => {
    const filteredEntries = this.filteredCodeLists();
    const selectedEntry = this.selectedEntry();

    if (
      selectedEntry &&
      filteredEntries.some((entry) => entry.id === selectedEntry.id)
    ) {
      return selectedEntry;
    }

    return this.pagedRows()[0] ?? filteredEntries[0] ?? null;
  });

  protected readonly filteredCodeLists = computed(() => {
    const query = normalizeText(this.searchQuery());
    const selectedType = this.selectedType();
    const selectedSource = this.selectedSource();

    return this.codeLists().filter((entry) => {
      const matchesType = selectedType === 'all' || entry.type === selectedType;
      const matchesSource =
        selectedSource === 'all' ||
        (selectedSource === 'system' && !!entry.systemAssign) ||
        (selectedSource === 'manual' && !entry.systemAssign);

      if (!matchesType || !matchesSource) return false;

      if (!query) return true;

      const haystack = normalizeText(
        [entry.type, entry.value, entry.description].filter(Boolean).join(' '),
      );

      return haystack.includes(query);
    });
  });

  protected readonly totalEntries = computed(() => this.codeLists().length);
  protected readonly filteredCount = computed(
    () => this.filteredCodeLists().length,
  );
  protected readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.filteredCount() / PAGE_SIZE)),
  );
  protected readonly pagedRows = computed(() => {
    const startIndex = (this.currentPage() - 1) * PAGE_SIZE;
    return this.filteredCodeLists().slice(startIndex, startIndex + PAGE_SIZE);
  });
  protected readonly totalTypes = computed(() => this.knownTypes().length);
  protected readonly activeFilterSummary = computed(() => {
    const summary: string[] = [];

    if (this.selectedType() !== 'all') {
      summary.push(`Type: ${formatTypeLabel(this.selectedType())}`);
    }

    if (this.selectedSource() !== 'all') {
      summary.push(
        this.selectedSource() === 'system'
          ? 'Source: Système'
          : 'Source: Manuelle',
      );
    }

    if (this.searchQuery().trim()) {
      summary.push(`Recherche: ${this.searchQuery().trim()}`);
    }

    return summary.length
      ? summary.join(' · ')
      : 'Aucun filtre actif. Toute la taxonomie est visible.';
  });
  protected readonly visibleRangeLabel = computed(() => {
    const count = this.filteredCount();

    if (!count) {
      return 'Aucune entrée visible';
    }

    const start = (this.currentPage() - 1) * PAGE_SIZE + 1;
    const end = Math.min(count, start + PAGE_SIZE - 1);

    return `Affichage ${start}-${end} sur ${count}`;
  });
  protected readonly systemEntries = computed(
    () => this.codeLists().filter((entry) => !!entry.systemAssign).length,
  );
  protected readonly manualEntries = computed(
    () => this.totalEntries() - this.systemEntries(),
  );
  protected readonly typeHighlights = computed(() => {
    const counters = new Map<string, number>();

    for (const entry of this.codeLists()) {
      const type = entry.type ?? 'Sans type';
      counters.set(type, (counters.get(type) ?? 0) + 1);
    }

    return [...counters.entries()]
      .sort(
        (left, right) => right[1] - left[1] || left[0].localeCompare(right[0]),
      )
      .slice(0, 6)
      .map(([type, count]) => ({
        type,
        count,
        label: formatTypeLabel(type),
      }));
  });

  ngOnInit(): void {
    this.prepareCreateMode();
    void this.loadCodeLists();
  }

  protected async reload(): Promise<void> {
    const selectedEntry = this.selectedEntry();

    await this.loadCodeLists(
      selectedEntry ? buildPreference(selectedEntry) : undefined,
    );
  }

  protected onSearchChange(value: string): void {
    this.searchQuery.set(value);
    this.currentPage.set(1);
  }

  protected onFilterChange(event: { filter: string; value: unknown }): void {
    if (event.filter === TYPE_FILTER_LABEL) {
      this.selectedType.set((event.value as string) ?? 'all');
      this.currentPage.set(1);
      return;
    }

    if (event.filter === SOURCE_FILTER_LABEL) {
      this.selectedSource.set((event.value as SourceFilter) ?? 'all');
      this.currentPage.set(1);
    }
  }

  protected onPageChange(page: number): void {
    this.currentPage.set(page);
  }

  protected onTypeOptionChange(value: string | null): void {
    const nextValue = value ?? CUSTOM_TYPE_VALUE;

    this.selectedTypeOption.set(nextValue);

    if (nextValue === CUSTOM_TYPE_VALUE) {
      this.form.controls.type.setValue('');
      this.form.controls.type.markAsPristine();
      this.form.controls.type.markAsUntouched();
      return;
    }

    this.form.controls.type.setValue(nextValue);
    this.form.controls.type.markAsDirty();
    this.form.controls.type.markAsTouched();
  }

  protected switchToCustomTypeInput(): void {
    this.selectedTypeOption.set(CUSTOM_TYPE_VALUE);
    this.form.controls.type.setValue('');
    this.form.controls.type.markAsPristine();
    this.form.controls.type.markAsUntouched();
  }

  protected switchToKnownTypeSelect(): void {
    this.selectedTypeOption.set(null);
    this.form.controls.type.setValue('');
    this.form.controls.type.markAsPristine();
    this.form.controls.type.markAsUntouched();
  }

  protected openCreateModal(): void {
    this.prepareCreateMode();
    this.editorOpen.set(true);
  }

  protected editCodeList(entry: LaCodeListDto): void {
    this.selectEntry(entry);
    this.editorOpen.set(true);
  }

  protected closeEditorModal(): void {
    this.editorOpen.set(false);
  }

  protected resetEditorForm(): void {
    const selectedEntry = this.selectedEntry();

    if (this.editorMode() === 'edit' && selectedEntry) {
      this.selectEntry(selectedEntry);
      return;
    }

    this.prepareCreateMode();
  }

  protected async save(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const payload = this.buildPayload();
    const mode = this.editorMode();
    const selectedEntry = this.selectedEntry();

    this.saving.set(true);

    try {
      const savedEntry =
        this.editorMode() === 'edit' && selectedEntry?.id
          ? await firstValueFrom(
              this.service.updateCodeList(selectedEntry.id, payload),
            )
          : await firstValueFrom(this.service.createCodeList(payload));

      await this.loadCodeLists(buildPreference({ ...payload, ...savedEntry }));
      this.closeEditorModal();

      this.notifications.success(
        mode === 'edit'
          ? 'L’entrée de la liste de codes a été mise à jour.'
          : 'La nouvelle entrée de la liste de codes a été créée.',
      );
    } catch (error) {
      this.notifications.error(
        resolveHttpErrorMessage(
          error,
          "Impossible d'enregistrer cette entrée de la liste de codes.",
        ),
      );
    } finally {
      this.saving.set(false);
    }
  }

  protected formatType(type?: string): string {
    return formatTypeLabel(type);
  }

  protected sourceLabel(entry: LaCodeListDto): string {
    return entry.systemAssign ? 'Système' : 'Manuelle';
  }

  protected descriptionLabel(entry: LaCodeListDto): string {
    return entry.description?.trim() || 'Aucune description';
  }

  protected metaLabel(entry: LaCodeListDto): string {
    return entry.type ?? 'Type libre';
  }

  protected isControlInvalid(
    controlName: 'type' | 'value' | 'description',
  ): boolean {
    const control = this.form.controls[controlName];
    return control.invalid && (control.touched || control.dirty);
  }

  protected hasActiveFilters(): boolean {
    return (
      !!this.searchQuery() ||
      this.selectedType() !== 'all' ||
      this.selectedSource() !== 'all'
    );
  }

  private async loadCodeLists(preferred?: {
    id?: string;
    type?: string;
    value?: string;
  }): Promise<void> {
    this.loading.set(true);

    try {
      const entries = await firstValueFrom(this.service.listCodeLists());
      this.codeLists.set(entries);
      this.clampCurrentPage();
      this.restoreEditorState(preferred);
    } catch (error) {
      this.notifications.error(
        resolveHttpErrorMessage(
          error,
          'Impossible de charger les listes de codes.',
        ),
      );
    } finally {
      this.loading.set(false);
    }
  }

  private restoreEditorState(preferred?: {
    id?: string;
    type?: string;
    value?: string;
  }): void {
    if (!preferred) {
      const selectedEntry = this.selectedEntry();
      if (selectedEntry) {
        this.selectEntry(selectedEntry);
        return;
      }

      if (this.editorMode() === 'create') {
        this.prepareCreateMode();
      }
      return;
    }

    const match = this.codeLists().find(
      (entry) =>
        (preferred.id && entry.id === preferred.id) ||
        (!!preferred.type &&
          !!preferred.value &&
          entry.type === preferred.type &&
          entry.value === preferred.value),
    );

    if (
      match?.type &&
      this.selectedType() !== 'all' &&
      this.selectedType() !== match.type
    ) {
      this.selectedType.set(match.type);
    }

    if (match) {
      this.selectEntry(match);
      return;
    }

    this.prepareCreateMode();
  }

  private buildPayload(): LaCodeListDto {
    const raw = this.form.getRawValue();
    const description = raw.description.trim();

    return {
      type: raw.type.trim().toUpperCase(),
      value: raw.value.trim().toUpperCase(),
      description: description || undefined,
      systemAssign: !!raw.systemAssign,
    };
  }

  private clampCurrentPage(): void {
    const lastPage = Math.max(
      1,
      Math.ceil(this.filteredCodeLists().length / PAGE_SIZE),
    );
    if (this.currentPage() > lastPage) {
      this.currentPage.set(lastPage);
    }
  }

  private prepareCreateMode(): void {
    this.editorMode.set('create');
    this.selectedId.set(null);
    this.form.reset({
      type: this.selectedType() === 'all' ? '' : this.selectedType(),
      value: '',
      description: '',
      systemAssign: false,
    });
    this.syncTypeOption(this.form.controls.type.value);
  }

  private selectEntry(entry: LaCodeListDto): void {
    this.editorMode.set('edit');
    this.selectedId.set(entry.id ?? null);
    this.form.reset({
      type: entry.type ?? '',
      value: entry.value ?? '',
      description: entry.description ?? '',
      systemAssign: !!entry.systemAssign,
    });
    this.syncTypeOption(this.form.controls.type.value);
  }

  private syncTypeOption(type: string): void {
    if (!type) {
      this.selectedTypeOption.set(null);
      return;
    }

    this.selectedTypeOption.set(
      this.knownTypes().includes(type) ? type : CUSTOM_TYPE_VALUE,
    );
  }
}

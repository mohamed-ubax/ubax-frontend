export type ArchivageFiltersState = {
  readonly keyword: string;
  readonly startDate: Date | null;
  readonly endDate: Date | null;
  readonly owner: string;
  readonly archivedBy: string;
  readonly type: string;
};

export type ArchivageSelectOption = {
  readonly label: string;
  readonly value: string;
};

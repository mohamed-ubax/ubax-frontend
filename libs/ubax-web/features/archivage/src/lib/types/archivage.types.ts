export type ArchivageTabId =
  | 'biens'
  | 'locataires'
  | 'factures'
  | 'tickets'
  | 'documents';

export type ArchivageFieldId =
  | 'keyword'
  | 'startDate'
  | 'endDate'
  | 'owner'
  | 'archivedBy'
  | 'type';

export type ArchivageCellTone = 'success' | 'warning' | 'danger';

export type ArchivageFilterField = {
  readonly id: ArchivageFieldId;
  readonly label: string;
  readonly kind: 'text' | 'date' | 'select';
  readonly options?: readonly string[];
};

export type ArchivageTextCell = {
  readonly kind: 'text';
  readonly value: string;
  readonly emphasis?: boolean;
};

export type ArchivageAvatarCell = {
  readonly kind: 'avatar';
  readonly imageSrc: string;
  readonly value: string;
};

export type ArchivageBadgeCell = {
  readonly kind: 'badge';
  readonly label: string;
  readonly tone: ArchivageCellTone;
};

export type ArchivageActionsCell = {
  readonly kind: 'actions';
  readonly primaryLabel: string;
  readonly secondaryLabel: string;
};

export type ArchivageCell =
  | ArchivageTextCell
  | ArchivageAvatarCell
  | ArchivageBadgeCell
  | ArchivageActionsCell;

export type ArchivageRow = {
  readonly id: string;
  readonly searchIndex: string;
  readonly startDate: string;
  readonly endDate: string;
  readonly owner?: string;
  readonly archivedBy?: string;
  readonly type?: string;
  readonly cells: readonly ArchivageCell[];
};

export type ArchivageTabDefinition = {
  readonly id: ArchivageTabId;
  readonly label: string;
  readonly title: string;
  readonly filterVariant: 'pill' | 'advanced';
  readonly columns: readonly string[];
  readonly filterFields: readonly ArchivageFilterField[];
  readonly rows: readonly ArchivageRow[];
};

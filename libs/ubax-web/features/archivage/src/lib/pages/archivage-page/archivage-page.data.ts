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

export interface ArchivageFilterField {
  readonly id: ArchivageFieldId;
  readonly label: string;
  readonly kind: 'text' | 'date' | 'select';
  readonly options?: readonly string[];
}

export interface ArchivageTextCell {
  readonly kind: 'text';
  readonly value: string;
  readonly emphasis?: boolean;
}

export interface ArchivageAvatarCell {
  readonly kind: 'avatar';
  readonly imageSrc: string;
  readonly value: string;
}

export interface ArchivageBadgeCell {
  readonly kind: 'badge';
  readonly label: string;
  readonly tone: ArchivageCellTone;
}

export interface ArchivageActionsCell {
  readonly kind: 'actions';
  readonly primaryLabel: string;
  readonly secondaryLabel: string;
}

export type ArchivageCell =
  | ArchivageTextCell
  | ArchivageAvatarCell
  | ArchivageBadgeCell
  | ArchivageActionsCell;

export interface ArchivageRow {
  readonly id: string;
  readonly searchIndex: string;
  readonly startDate: string;
  readonly endDate: string;
  readonly owner?: string;
  readonly archivedBy?: string;
  readonly type?: string;
  readonly cells: readonly ArchivageCell[];
}

export interface ArchivageTabDefinition {
  readonly id: ArchivageTabId;
  readonly label: string;
  readonly title: string;
  readonly filterVariant: 'pill' | 'advanced';
  readonly columns: readonly string[];
  readonly filterFields: readonly ArchivageFilterField[];
  readonly rows: readonly ArchivageRow[];
}

const ASSET_ROOT = '/archivages/commercial';
const ICON_ROOT = `${ASSET_ROOT}/icons`;
const PEOPLE_ROOT = `${ASSET_ROOT}/people`;
const ARCHIVED_BY = 'Aissatou Diallo';

export const ARCHIVAGE_ICONS = {
  search: `${ICON_ROOT}/search.webp`,
  toolbarCalendar: `${ICON_ROOT}/calendar-toolbar.webp`,
  filterCalendar: `${ICON_ROOT}/calendar-filter.webp`,
  export: `${ICON_ROOT}/export.webp`,
  chevronDown: `${ICON_ROOT}/chevron-down.webp`,
  paginatorPrevious: `${ICON_ROOT}/paginator-previous.webp`,
  paginatorNext: `${ICON_ROOT}/paginator-next.webp`,
} as const;

const DEFAULT_ACTIONS: ArchivageActionsCell = {
  kind: 'actions',
  primaryLabel: 'voir',
  secondaryLabel: 'Restaurer',
};

const BIENS_FILTERS: readonly ArchivageFilterField[] = [
  { id: 'keyword', label: 'Mot clé', kind: 'text' },
  { id: 'startDate', label: 'Date de début', kind: 'date' },
  { id: 'endDate', label: 'Date de fin', kind: 'date' },
  {
    id: 'owner',
    label: 'Propriétaire',
    kind: 'select',
    options: ['Alain Traoré'],
  },
  {
    id: 'archivedBy',
    label: 'Archivé par',
    kind: 'select',
    options: [ARCHIVED_BY],
  },
];

const SHORT_FILTERS: readonly ArchivageFilterField[] = [
  { id: 'keyword', label: 'Mot clé', kind: 'text' },
  { id: 'startDate', label: 'Date de début', kind: 'date' },
  { id: 'endDate', label: 'Date de fin', kind: 'date' },
];

const DOCUMENT_FILTERS: readonly ArchivageFilterField[] = [
  { id: 'keyword', label: 'Mot clé', kind: 'text' },
  {
    id: 'type',
    label: 'Type',
    kind: 'select',
    options: ['Contrat'],
  },
  { id: 'startDate', label: 'Date de début', kind: 'date' },
  { id: 'endDate', label: 'Date de fin', kind: 'date' },
  {
    id: 'owner',
    label: 'Propriétaire',
    kind: 'select',
    options: ['Alain Traoré'],
  },
  {
    id: 'archivedBy',
    label: 'Archivé par',
    kind: 'select',
    options: [ARCHIVED_BY],
  },
];

const BIENS_ROWS: readonly ArchivageRow[] = [
  {
    id: 'biens-01',
    searchIndex: 'B-1213 Appartement Cocody Angres Alain Traore Vendu',
    startDate: '01/02/2026',
    endDate: '01/02/2026',
    owner: 'Alain Traoré',
    archivedBy: ARCHIVED_BY,
    cells: [
      { kind: 'text', value: 'B-1213' },
      { kind: 'text', value: 'Appartement' },
      { kind: 'text', value: 'Cocody  Angrés' },
      { kind: 'text', value: 'Alain Traoré' },
      { kind: 'text', value: '01/02/2026' },
      { kind: 'badge', label: 'Vendu', tone: 'success' },
      DEFAULT_ACTIONS,
    ],
  },
  {
    id: 'biens-02',
    searchIndex: 'B-1213 Appartement Cocody Angres Alain Traore Retirer',
    startDate: '01/02/2026',
    endDate: '01/02/2026',
    owner: 'Alain Traoré',
    archivedBy: ARCHIVED_BY,
    cells: [
      { kind: 'text', value: 'B-1213' },
      { kind: 'text', value: 'Appartement' },
      { kind: 'text', value: 'Cocody  Angrés' },
      { kind: 'text', value: 'Alain Traoré' },
      { kind: 'text', value: '01/02/2026' },
      { kind: 'badge', label: 'Retirer', tone: 'danger' },
      DEFAULT_ACTIONS,
    ],
  },
  {
    id: 'biens-03',
    searchIndex: 'B-1213 Appartement Cocody Angres Alain Traore Vendu',
    startDate: '01/02/2026',
    endDate: '01/02/2026',
    owner: 'Alain Traoré',
    archivedBy: ARCHIVED_BY,
    cells: [
      { kind: 'text', value: 'B-1213' },
      { kind: 'text', value: 'Appartement' },
      { kind: 'text', value: 'Cocody  Angrés' },
      { kind: 'text', value: 'Alain Traoré' },
      { kind: 'text', value: '01/02/2026' },
      { kind: 'badge', label: 'Vendu', tone: 'success' },
      DEFAULT_ACTIONS,
    ],
  },
  {
    id: 'biens-04',
    searchIndex: 'B-1213 Appartement Cocody Angres Alain Traore Retirer',
    startDate: '01/02/2026',
    endDate: '01/02/2026',
    owner: 'Alain Traoré',
    archivedBy: ARCHIVED_BY,
    cells: [
      { kind: 'text', value: 'B-1213' },
      { kind: 'text', value: 'Appartement' },
      { kind: 'text', value: 'Cocody  Angrés' },
      { kind: 'text', value: 'Alain Traoré' },
      { kind: 'text', value: '01/02/2026' },
      { kind: 'badge', label: 'Retirer', tone: 'danger' },
      DEFAULT_ACTIONS,
    ],
  },
  {
    id: 'biens-05',
    searchIndex: 'B-1213 Appartement Cocody Angres Alain Traore Vendu',
    startDate: '01/02/2026',
    endDate: '01/02/2026',
    owner: 'Alain Traoré',
    archivedBy: ARCHIVED_BY,
    cells: [
      { kind: 'text', value: 'B-1213' },
      { kind: 'text', value: 'Appartement' },
      { kind: 'text', value: 'Cocody  Angrés' },
      { kind: 'text', value: 'Alain Traoré' },
      { kind: 'text', value: '01/02/2026' },
      { kind: 'badge', label: 'Vendu', tone: 'success' },
      DEFAULT_ACTIONS,
    ],
  },
  {
    id: 'biens-06',
    searchIndex: 'B-1213 Appartement Cocody Angres Alain Traore Vendu',
    startDate: '01/02/2026',
    endDate: '01/02/2026',
    owner: 'Alain Traoré',
    archivedBy: ARCHIVED_BY,
    cells: [
      { kind: 'text', value: 'B-1213' },
      { kind: 'text', value: 'Appartement' },
      { kind: 'text', value: 'Cocody  Angrés' },
      { kind: 'text', value: 'Alain Traoré' },
      { kind: 'text', value: '01/02/2026' },
      { kind: 'badge', label: 'Vendu', tone: 'success' },
      DEFAULT_ACTIONS,
    ],
  },
];

const LOCATAIRES_ROWS: readonly ArchivageRow[] = [
  {
    id: 'locataires-01',
    searchIndex:
      'Kevin Kouassi Immeuble kalia 01/02/2026 01/02/2027 05/02/2027 Resilie',
    startDate: '01/02/2026',
    endDate: '01/02/2027',
    archivedBy: ARCHIVED_BY,
    cells: [
      {
        kind: 'avatar',
        imageSrc: `${PEOPLE_ROOT}/locataire-01.webp`,
        value: 'Kevin Kouassi',
      },
      { kind: 'text', value: 'Immeuble kalia' },
      { kind: 'text', value: '01/02/2026' },
      { kind: 'text', value: '01/02/2027' },
      { kind: 'text', value: '05/02/2027' },
      { kind: 'badge', label: 'Résilié', tone: 'warning' },
      DEFAULT_ACTIONS,
    ],
  },
  {
    id: 'locataires-02',
    searchIndex:
      'Patrick Koffi Immeuble kalia 01/02/2026 01/02/2027 05/02/2027 Litige',
    startDate: '01/02/2026',
    endDate: '01/02/2027',
    archivedBy: ARCHIVED_BY,
    cells: [
      {
        kind: 'avatar',
        imageSrc: `${PEOPLE_ROOT}/locataire-02.webp`,
        value: 'Patrick Koffi',
      },
      { kind: 'text', value: 'Immeuble kalia' },
      { kind: 'text', value: '01/02/2026' },
      { kind: 'text', value: '01/02/2027' },
      { kind: 'text', value: '05/02/2027' },
      { kind: 'badge', label: 'Litige', tone: 'danger' },
      DEFAULT_ACTIONS,
    ],
  },
  {
    id: 'locataires-03',
    searchIndex:
      'Patrick Koffi Immeuble kalia 01/02/2026 01/02/2027 05/02/2027 Litige',
    startDate: '01/02/2026',
    endDate: '01/02/2027',
    archivedBy: ARCHIVED_BY,
    cells: [
      {
        kind: 'avatar',
        imageSrc: `${PEOPLE_ROOT}/locataire-03.webp`,
        value: 'Patrick Koffi',
      },
      { kind: 'text', value: 'Immeuble kalia' },
      { kind: 'text', value: '01/02/2026' },
      { kind: 'text', value: '01/02/2027' },
      { kind: 'text', value: '05/02/2027' },
      { kind: 'badge', label: 'Litige', tone: 'danger' },
      DEFAULT_ACTIONS,
    ],
  },
  {
    id: 'locataires-04',
    searchIndex:
      'Patrick Koffi Immeuble kalia 01/02/2026 01/02/2027 05/02/2027 Litige',
    startDate: '01/02/2026',
    endDate: '01/02/2027',
    archivedBy: ARCHIVED_BY,
    cells: [
      {
        kind: 'avatar',
        imageSrc: `${PEOPLE_ROOT}/locataire-04.webp`,
        value: 'Patrick Koffi',
      },
      { kind: 'text', value: 'Immeuble kalia' },
      { kind: 'text', value: '01/02/2026' },
      { kind: 'text', value: '01/02/2027' },
      { kind: 'text', value: '05/02/2027' },
      { kind: 'badge', label: 'Litige', tone: 'danger' },
      DEFAULT_ACTIONS,
    ],
  },
  {
    id: 'locataires-05',
    searchIndex:
      'Kevin Kouassi Immeuble kalia 01/02/2026 01/02/2027 05/02/2027 Resilie',
    startDate: '01/02/2026',
    endDate: '01/02/2027',
    archivedBy: ARCHIVED_BY,
    cells: [
      {
        kind: 'avatar',
        imageSrc: `${PEOPLE_ROOT}/locataire-05.webp`,
        value: 'Kevin Kouassi',
      },
      { kind: 'text', value: 'Immeuble kalia' },
      { kind: 'text', value: '01/02/2026' },
      { kind: 'text', value: '01/02/2027' },
      { kind: 'text', value: '05/02/2027' },
      { kind: 'badge', label: 'Résilié', tone: 'warning' },
      DEFAULT_ACTIONS,
    ],
  },
  {
    id: 'locataires-06',
    searchIndex:
      'Kevin Kouassi Immeuble kalia 01/02/2026 01/02/2027 05/02/2027 Resilie',
    startDate: '01/02/2026',
    endDate: '01/02/2027',
    archivedBy: ARCHIVED_BY,
    cells: [
      {
        kind: 'avatar',
        imageSrc: `${PEOPLE_ROOT}/locataire-06.webp`,
        value: 'Kevin Kouassi',
      },
      { kind: 'text', value: 'Immeuble kalia' },
      { kind: 'text', value: '01/02/2026' },
      { kind: 'text', value: '01/02/2027' },
      { kind: 'text', value: '05/02/2027' },
      { kind: 'badge', label: 'Résilié', tone: 'warning' },
      DEFAULT_ACTIONS,
    ],
  },
];

const FACTURES_ROWS: readonly ArchivageRow[] = [
  {
    id: 'factures-01',
    searchIndex:
      'FAC-0012 Immeuble kalia Kevin Kouassi 01/02/2027 250 000 FCFA Loyer janvier 2025',
    startDate: '01/02/2027',
    endDate: '01/02/2027',
    archivedBy: ARCHIVED_BY,
    cells: [
      { kind: 'text', value: 'FAC-0012' },
      { kind: 'text', value: 'Immeuble kalia' },
      {
        kind: 'avatar',
        imageSrc: `${PEOPLE_ROOT}/facture-01.webp`,
        value: 'Kevin Kouassi',
      },
      { kind: 'text', value: '01/02/2027' },
      { kind: 'text', value: '250 000 FCFA', emphasis: true },
      { kind: 'badge', label: 'Loyer janvier 2025', tone: 'warning' },
      DEFAULT_ACTIONS,
    ],
  },
  {
    id: 'factures-02',
    searchIndex:
      'FAC-0012 Immeuble kalia Kevin Kouassi 01/02/2027 250 000 FCFA Loyer janvier 2025',
    startDate: '01/02/2027',
    endDate: '01/02/2027',
    archivedBy: ARCHIVED_BY,
    cells: [
      { kind: 'text', value: 'FAC-0012' },
      { kind: 'text', value: 'Immeuble kalia' },
      {
        kind: 'avatar',
        imageSrc: `${PEOPLE_ROOT}/facture-02.webp`,
        value: 'Kevin Kouassi',
      },
      { kind: 'text', value: '01/02/2027' },
      { kind: 'text', value: '250 000 FCFA', emphasis: true },
      { kind: 'badge', label: 'Loyer janvier 2025', tone: 'warning' },
      DEFAULT_ACTIONS,
    ],
  },
  {
    id: 'factures-03',
    searchIndex:
      'FAC-0012 Immeuble kalia Kevin Kouassi 01/02/2027 250 000 FCFA Loyer janvier 2025',
    startDate: '01/02/2027',
    endDate: '01/02/2027',
    archivedBy: ARCHIVED_BY,
    cells: [
      { kind: 'text', value: 'FAC-0012' },
      { kind: 'text', value: 'Immeuble kalia' },
      {
        kind: 'avatar',
        imageSrc: `${PEOPLE_ROOT}/facture-03.webp`,
        value: 'Kevin Kouassi',
      },
      { kind: 'text', value: '01/02/2027' },
      { kind: 'text', value: '250 000 FCFA', emphasis: true },
      { kind: 'badge', label: 'Loyer janvier 2025', tone: 'warning' },
      DEFAULT_ACTIONS,
    ],
  },
  {
    id: 'factures-04',
    searchIndex:
      'FAC-0012 Immeuble kalia Kevin Kouassi 01/02/2027 250 000 FCFA Loyer janvier 2025',
    startDate: '01/02/2027',
    endDate: '01/02/2027',
    archivedBy: ARCHIVED_BY,
    cells: [
      { kind: 'text', value: 'FAC-0012' },
      { kind: 'text', value: 'Immeuble kalia' },
      {
        kind: 'avatar',
        imageSrc: `${PEOPLE_ROOT}/locataire-03.webp`,
        value: 'Kevin Kouassi',
      },
      { kind: 'text', value: '01/02/2027' },
      { kind: 'text', value: '250 000 FCFA', emphasis: true },
      { kind: 'badge', label: 'Loyer janvier 2025', tone: 'warning' },
      DEFAULT_ACTIONS,
    ],
  },
  {
    id: 'factures-05',
    searchIndex:
      'FAC-0012 Immeuble kalia Kevin Kouassi 01/02/2027 250 000 FCFA Loyer janvier 2025',
    startDate: '01/02/2027',
    endDate: '01/02/2027',
    archivedBy: ARCHIVED_BY,
    cells: [
      { kind: 'text', value: 'FAC-0012' },
      { kind: 'text', value: 'Immeuble kalia' },
      {
        kind: 'avatar',
        imageSrc: `${PEOPLE_ROOT}/facture-05.webp`,
        value: 'Kevin Kouassi',
      },
      { kind: 'text', value: '01/02/2027' },
      { kind: 'text', value: '250 000 FCFA', emphasis: true },
      { kind: 'badge', label: 'Loyer janvier 2025', tone: 'warning' },
      DEFAULT_ACTIONS,
    ],
  },
];

const TICKETS_ROWS: readonly ArchivageRow[] = [
  {
    id: 'tickets-01',
    searchIndex:
      'UBX-TK-0012 Immeuble kalia Kevin Kouassi Panne electrique 15/07/2026 Repare',
    startDate: '15/07/2026',
    endDate: '15/07/2026',
    archivedBy: ARCHIVED_BY,
    cells: [
      { kind: 'text', value: 'UBX-TK-0012' },
      { kind: 'text', value: 'Immeuble kalia' },
      {
        kind: 'avatar',
        imageSrc: `${PEOPLE_ROOT}/ticket-01.webp`,
        value: 'Kevin Kouassi',
      },
      { kind: 'text', value: 'Panne électrique' },
      { kind: 'text', value: '15/07/2026' },
      { kind: 'badge', label: 'Réparé', tone: 'success' },
      DEFAULT_ACTIONS,
    ],
  },
  {
    id: 'tickets-02',
    searchIndex:
      'UBX-TK-0012 Immeuble kalia Kevin Kouassi Peinture 15/07/2026 Repare',
    startDate: '15/07/2026',
    endDate: '15/07/2026',
    archivedBy: ARCHIVED_BY,
    cells: [
      { kind: 'text', value: 'UBX-TK-0012' },
      { kind: 'text', value: 'Immeuble kalia' },
      {
        kind: 'avatar',
        imageSrc: `${PEOPLE_ROOT}/ticket-02.webp`,
        value: 'Kevin Kouassi',
      },
      { kind: 'text', value: 'Peinture' },
      { kind: 'text', value: '15/07/2026' },
      { kind: 'badge', label: 'Réparé', tone: 'success' },
      DEFAULT_ACTIONS,
    ],
  },
  {
    id: 'tickets-03',
    searchIndex:
      'UBX-TK-0012 Immeuble kalia Kevin Kouassi Panne electrique 15/07/2026 Repare',
    startDate: '15/07/2026',
    endDate: '15/07/2026',
    archivedBy: ARCHIVED_BY,
    cells: [
      { kind: 'text', value: 'UBX-TK-0012' },
      { kind: 'text', value: 'Immeuble kalia' },
      {
        kind: 'avatar',
        imageSrc: `${PEOPLE_ROOT}/ticket-03.webp`,
        value: 'Kevin Kouassi',
      },
      { kind: 'text', value: 'Panne électrique' },
      { kind: 'text', value: '15/07/2026' },
      { kind: 'badge', label: 'Réparé', tone: 'success' },
      DEFAULT_ACTIONS,
    ],
  },
  {
    id: 'tickets-04',
    searchIndex:
      'UBX-TK-0012 Immeuble kalia Kevin Kouassi Panne electrique 15/07/2026 Repare',
    startDate: '15/07/2026',
    endDate: '15/07/2026',
    archivedBy: ARCHIVED_BY,
    cells: [
      { kind: 'text', value: 'UBX-TK-0012' },
      { kind: 'text', value: 'Immeuble kalia' },
      {
        kind: 'avatar',
        imageSrc: `${PEOPLE_ROOT}/ticket-04.webp`,
        value: 'Kevin Kouassi',
      },
      { kind: 'text', value: 'Panne électrique' },
      { kind: 'text', value: '15/07/2026' },
      { kind: 'badge', label: 'Réparé', tone: 'success' },
      DEFAULT_ACTIONS,
    ],
  },
  {
    id: 'tickets-05',
    searchIndex:
      'UBX-TK-0012 Immeuble kalia Kevin Kouassi Panne electrique 15/07/2026 Repare',
    startDate: '15/07/2026',
    endDate: '15/07/2026',
    archivedBy: ARCHIVED_BY,
    cells: [
      { kind: 'text', value: 'UBX-TK-0012' },
      { kind: 'text', value: 'Immeuble kalia' },
      {
        kind: 'avatar',
        imageSrc: `${PEOPLE_ROOT}/locataire-04.webp`,
        value: 'Kevin Kouassi',
      },
      { kind: 'text', value: 'Panne électrique' },
      { kind: 'text', value: '15/07/2026' },
      { kind: 'badge', label: 'Réparé', tone: 'success' },
      DEFAULT_ACTIONS,
    ],
  },
  {
    id: 'tickets-06',
    searchIndex:
      'UBX-TK-0012 Immeuble kalia Kevin Kouassi Panne electrique 15/07/2026 Repare',
    startDate: '15/07/2026',
    endDate: '15/07/2026',
    archivedBy: ARCHIVED_BY,
    cells: [
      { kind: 'text', value: 'UBX-TK-0012' },
      { kind: 'text', value: 'Immeuble kalia' },
      {
        kind: 'avatar',
        imageSrc: `${PEOPLE_ROOT}/ticket-06.webp`,
        value: 'Kevin Kouassi',
      },
      { kind: 'text', value: 'Panne électrique' },
      { kind: 'text', value: '15/07/2026' },
      { kind: 'badge', label: 'Réparé', tone: 'success' },
      DEFAULT_ACTIONS,
    ],
  },
];

const DOCUMENT_ROWS: readonly ArchivageRow[] = Array.from(
  { length: 6 },
  (_, index) => ({
    id: `documents-0${index + 1}`,
    searchIndex: 'Contrat Immeuble kalia Kevin Kouassi 15/07/2026 expire',
    startDate: '15/07/2026',
    endDate: '15/07/2026',
    owner: 'Alain Traoré',
    archivedBy: ARCHIVED_BY,
    type: 'Contrat',
    cells: [
      { kind: 'text', value: 'Contrat' },
      { kind: 'text', value: 'Immeuble kalia' },
      {
        kind: 'avatar',
        imageSrc: `${PEOPLE_ROOT}/document-01.webp`,
        value: 'Kevin Kouassi',
      },
      { kind: 'text', value: '15/07/2026' },
      { kind: 'text', value: '15/07/2026' },
      { kind: 'badge', label: 'expiré', tone: 'danger' },
      DEFAULT_ACTIONS,
    ],
  }),
);

export const ARCHIVAGE_TAB_DEFINITIONS: readonly ArchivageTabDefinition[] = [
  {
    id: 'biens',
    label: 'Biens Archivés',
    title: 'Biens Archivés',
    filterVariant: 'pill',
    columns: [
      'Référence',
      'Type',
      'Localisation',
      'Propriétaire',
      'Date d’archivage',
      'Raison',
      'Actions',
    ],
    filterFields: BIENS_FILTERS,
    rows: BIENS_ROWS,
  },
  {
    id: 'locataires',
    label: 'Locataires Archivés',
    title: 'Locataires Archivés',
    filterVariant: 'pill',
    columns: [
      'Locataire',
      'Biens occupés',
      'Date d’entrée',
      'Date de sortie',
      'Date d’archivage',
      'Raison',
      'Actions',
    ],
    filterFields: SHORT_FILTERS,
    rows: LOCATAIRES_ROWS,
  },
  {
    id: 'factures',
    label: 'Factures archivés',
    title: 'Factures archivés',
    filterVariant: 'pill',
    columns: [
      'Facture',
      'Biens',
      'Locataire /Fournisseur',
      'Date de Facture',
      'Montant',
      'Raison',
      'Actions',
    ],
    filterFields: SHORT_FILTERS,
    rows: FACTURES_ROWS,
  },
  {
    id: 'tickets',
    label: 'Tickets SAV Archivés',
    title: 'Tickets SAV Archivés',
    filterVariant: 'pill',
    columns: [
      'N ticket',
      'Biens',
      'Techniciens',
      'Description du probléme',
      'Date',
      'Statut final',
      'Actions',
    ],
    filterFields: SHORT_FILTERS,
    rows: TICKETS_ROWS,
  },
  {
    id: 'documents',
    label: 'Documents Archivés',
    title: 'Documents Archivés',
    filterVariant: 'advanced',
    columns: [
      'Type',
      'Biens',
      'client',
      'Date de debut',
      'Date',
      'Statut',
      'Actions',
    ],
    filterFields: DOCUMENT_FILTERS,
    rows: DOCUMENT_ROWS,
  },
];

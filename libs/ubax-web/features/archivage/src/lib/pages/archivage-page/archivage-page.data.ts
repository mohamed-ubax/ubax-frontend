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
  readonly options?: readonly string[];};

export type ArchivageTextCell = {
  readonly kind: 'text';
  readonly value: string;
  readonly emphasis?: boolean;};

export type ArchivageAvatarCell = {
  readonly kind: 'avatar';
  readonly imageSrc: string;
  readonly value: string;};

export type ArchivageBadgeCell = {
  readonly kind: 'badge';
  readonly label: string;
  readonly tone: ArchivageCellTone;};

export type ArchivageActionsCell = {
  readonly kind: 'actions';
  readonly primaryLabel: string;
  readonly secondaryLabel: string;};

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
  readonly cells: readonly ArchivageCell[];};

export type ArchivageTabDefinition = {
  readonly id: ArchivageTabId;
  readonly label: string;
  readonly title: string;
  readonly filterVariant: 'pill' | 'advanced';
  readonly columns: readonly string[];
  readonly filterFields: readonly ArchivageFilterField[];
  readonly rows: readonly ArchivageRow[];};

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

const BIENS_OWNER_OPTIONS = [
  'Alain Traoré',
  'Mariam Koné',
  'Didier Kouassi',
  'Fatou Bamba',
] as const;

const DOCUMENT_TYPE_OPTIONS = [
  'Contrat',
  'Bail',
  'Quittance',
  'État des lieux',
] as const;

const BIENS_TYPE_VALUES = [
  'Appartement',
  'Villa',
  'Duplex',
  'Studio',
  'Bureau',
  'Entrepôt',
] as const;

const BIENS_LOCATION_VALUES = [
  'Cocody Angré',
  'Riviera Palmeraie',
  'Marcory Résidentiel',
  'Zone 4',
  'Deux Plateaux Vallons',
  'Bingerville Cité Marina',
] as const;

const BIENS_DATE_VALUES = [
  '01/02/2026',
  '12/02/2026',
  '24/02/2026',
  '05/03/2026',
  '17/03/2026',
  '29/03/2026',
] as const;

const BIENS_REASON_VALUES = [
  { label: 'Vendu', tone: 'success' },
  { label: 'Retiré', tone: 'danger' },
  { label: 'Transféré', tone: 'warning' },
] as const satisfies readonly { label: string; tone: ArchivageCellTone }[];

const LOCATAIRE_NAME_VALUES = [
  'Kevin Kouassi',
  'Patrick Koffi',
  'Aïcha Coulibaly',
  'Serge Yao',
  'Nadia Konan',
  'Moussa Bamba',
] as const;

const LOCATAIRE_PROPERTY_VALUES = [
  'Immeuble Kalia',
  'Résidence Ébène',
  'Cité Azur',
  'Les Terrasses du Parc',
  'Résidence Horizon',
  'Villa Nandjelet',
] as const;

const LOCATAIRE_ENTRY_DATE_VALUES = [
  '01/02/2025',
  '14/03/2025',
  '06/05/2025',
  '21/06/2025',
  '08/08/2025',
  '17/09/2025',
] as const;

const LOCATAIRE_EXIT_DATE_VALUES = [
  '31/01/2026',
  '12/03/2026',
  '04/05/2026',
  '19/06/2026',
  '30/07/2026',
  '16/09/2026',
] as const;

const LOCATAIRE_ARCHIVE_DATE_VALUES = [
  '05/02/2026',
  '18/03/2026',
  '09/05/2026',
  '24/06/2026',
  '06/08/2026',
  '20/09/2026',
] as const;

const LOCATAIRE_REASON_VALUES = [
  { label: 'Résilié', tone: 'warning' },
  { label: 'Litige', tone: 'danger' },
  { label: 'Déménagement', tone: 'success' },
] as const satisfies readonly { label: string; tone: ArchivageCellTone }[];

const FACTURE_PROPERTY_VALUES = [
  'Immeuble Kalia',
  'Résidence Ébène',
  'Tour Laguna',
  'Villa Prestige',
  'Bureau Plateau',
  'Résidence Horizon',
] as const;

const FACTURE_CONTACT_VALUES = [
  'Kevin Kouassi',
  'Awa Bakayoko',
  'Mariam Coulibaly',
  'Yves Nguessan',
  'Nadia Konan',
  'Laura Koné',
] as const;

const FACTURE_DATE_VALUES = [
  '01/02/2027',
  '14/02/2027',
  '03/03/2027',
  '18/03/2027',
  '04/04/2027',
  '20/04/2027',
] as const;

const FACTURE_AMOUNT_VALUES = [
  '250 000 FCFA',
  '325 000 FCFA',
  '480 000 FCFA',
  '185 000 FCFA',
  '710 000 FCFA',
  '96 000 FCFA',
] as const;

const FACTURE_REASON_VALUES = [
  { label: 'Loyer janvier 2025', tone: 'warning' },
  { label: 'Charges copropriété', tone: 'warning' },
  { label: 'Maintenance climatisation', tone: 'danger' },
  { label: 'Régularisation eau', tone: 'success' },
] as const satisfies readonly { label: string; tone: ArchivageCellTone }[];

const TICKET_PROPERTY_VALUES = [
  'Immeuble Kalia',
  'Résidence Ébène',
  'Villa Nandjelet',
  'Bureau Plateau',
  'Tour Laguna',
  'Résidence Horizon',
] as const;

const TICKET_TECHNICIAN_VALUES = [
  'Kevin Kouassi',
  'Jean-René Nguessan',
  'Moussa Traoré',
  'Laura Koné',
  'Armand Tano',
  'Awa Bakayoko',
] as const;

const TICKET_DESCRIPTION_VALUES = [
  'Panne électrique',
  'Climatisation défaillante',
  'Fuite d’eau',
  'Peinture à reprendre',
  'Serrure bloquée',
  'Ascenseur en panne',
] as const;

const TICKET_DATE_VALUES = [
  '15/07/2026',
  '22/07/2026',
  '03/08/2026',
  '18/08/2026',
  '06/09/2026',
  '21/09/2026',
] as const;

const TICKET_STATUS_VALUES = [
  { label: 'Réparé', tone: 'success' },
  { label: 'Clôturé', tone: 'warning' },
  { label: 'Résolu', tone: 'success' },
] as const satisfies readonly { label: string; tone: ArchivageCellTone }[];

const DOCUMENT_PROPERTY_VALUES = [
  'Immeuble Kalia',
  'Résidence Ébène',
  'Villa Prestige',
  'Tour Laguna',
  'Bureau Plateau',
  'Résidence Horizon',
] as const;

const DOCUMENT_CLIENT_VALUES = [
  'Kevin Kouassi',
  'Awa Bakayoko',
  'Mariam Coulibaly',
  'Yves Nguessan',
  'Fatou Bamba',
  'Laura Koné',
] as const;

const DOCUMENT_START_DATE_VALUES = [
  '01/01/2026',
  '15/01/2026',
  '01/02/2026',
  '20/02/2026',
  '05/03/2026',
  '22/03/2026',
] as const;

const DOCUMENT_END_DATE_VALUES = [
  '31/12/2026',
  '14/01/2027',
  '31/01/2027',
  '19/02/2027',
  '04/03/2027',
  '21/03/2027',
] as const;

const DOCUMENT_STATUS_VALUES = [
  { label: 'expiré', tone: 'danger' },
  { label: 'renouvelé', tone: 'success' },
  { label: 'clos', tone: 'warning' },
] as const satisfies readonly { label: string; tone: ArchivageCellTone }[];

function pickValue<T>(values: readonly T[], index: number): T {
  return values[index % values.length];
}

function cloneArchivageRow(row: ArchivageRow, id: string): ArchivageRow {
  return {
    ...row,
    id,
    cells: row.cells.map((cell) => ({ ...cell })),
  };
}

function expandArchivageRows(
  rows: readonly ArchivageRow[],
  total: number,
  prefix: string,
): readonly ArchivageRow[] {
  return Array.from({ length: total }, (_, index) => {
    const source = rows[index % rows.length];
    const suffix = String(index + 1).padStart(2, '0');
    const baseId = `${prefix}-${suffix}`;

    switch (prefix) {
      case 'biens': {
        const reference = `B-${String(1213 + index * 7).padStart(4, '0')}`;
        const type = pickValue(BIENS_TYPE_VALUES, index);
        const location = pickValue(BIENS_LOCATION_VALUES, index + 1);
        const owner = pickValue(BIENS_OWNER_OPTIONS, index);
        const archivedAt = pickValue(BIENS_DATE_VALUES, index);
        const reason = pickValue(BIENS_REASON_VALUES, index);

        return {
          id: baseId,
          searchIndex: [reference, type, location, owner, reason.label].join(
            ' ',
          ),
          startDate: archivedAt,
          endDate: archivedAt,
          owner,
          archivedBy: ARCHIVED_BY,
          cells: [
            { kind: 'text', value: reference },
            { kind: 'text', value: type },
            { kind: 'text', value: location },
            { kind: 'text', value: owner },
            { kind: 'text', value: archivedAt },
            { kind: 'badge', label: reason.label, tone: reason.tone },
            DEFAULT_ACTIONS,
          ],
        };
      }

      case 'locataires': {
        const avatarCell = source.cells[0] as ArchivageAvatarCell;
        const tenant = pickValue(LOCATAIRE_NAME_VALUES, index);
        const property = pickValue(LOCATAIRE_PROPERTY_VALUES, index + 2);
        const entryDate = pickValue(LOCATAIRE_ENTRY_DATE_VALUES, index);
        const exitDate = pickValue(LOCATAIRE_EXIT_DATE_VALUES, index);
        const archivedAt = pickValue(LOCATAIRE_ARCHIVE_DATE_VALUES, index);
        const reason = pickValue(LOCATAIRE_REASON_VALUES, index);

        return {
          id: baseId,
          searchIndex: [
            tenant,
            property,
            entryDate,
            exitDate,
            archivedAt,
            reason.label,
          ].join(' '),
          startDate: entryDate,
          endDate: exitDate,
          archivedBy: ARCHIVED_BY,
          cells: [
            {
              kind: 'avatar',
              imageSrc: avatarCell.imageSrc,
              value: tenant,
            },
            { kind: 'text', value: property },
            { kind: 'text', value: entryDate },
            { kind: 'text', value: exitDate },
            { kind: 'text', value: archivedAt },
            { kind: 'badge', label: reason.label, tone: reason.tone },
            DEFAULT_ACTIONS,
          ],
        };
      }

      case 'factures': {
        const avatarCell = source.cells[2] as ArchivageAvatarCell;
        const reference = `FAC-${String(1200 + index * 5).padStart(4, '0')}`;
        const property = pickValue(FACTURE_PROPERTY_VALUES, index + 1);
        const contact = pickValue(FACTURE_CONTACT_VALUES, index);
        const invoiceDate = pickValue(FACTURE_DATE_VALUES, index);
        const amount = pickValue(FACTURE_AMOUNT_VALUES, index);
        const reason = pickValue(FACTURE_REASON_VALUES, index);

        return {
          id: baseId,
          searchIndex: [
            reference,
            property,
            contact,
            invoiceDate,
            amount,
            reason.label,
          ].join(' '),
          startDate: invoiceDate,
          endDate: invoiceDate,
          archivedBy: ARCHIVED_BY,
          cells: [
            { kind: 'text', value: reference },
            { kind: 'text', value: property },
            {
              kind: 'avatar',
              imageSrc: avatarCell.imageSrc,
              value: contact,
            },
            { kind: 'text', value: invoiceDate },
            { kind: 'text', value: amount, emphasis: true },
            { kind: 'badge', label: reason.label, tone: reason.tone },
            DEFAULT_ACTIONS,
          ],
        };
      }

      case 'tickets': {
        const avatarCell = source.cells[2] as ArchivageAvatarCell;
        const reference = `UBX-TK-${String(1200 + index * 3).padStart(4, '0')}`;
        const property = pickValue(TICKET_PROPERTY_VALUES, index + 1);
        const technician = pickValue(TICKET_TECHNICIAN_VALUES, index);
        const description = pickValue(TICKET_DESCRIPTION_VALUES, index);
        const ticketDate = pickValue(TICKET_DATE_VALUES, index);
        const status = pickValue(TICKET_STATUS_VALUES, index);

        return {
          id: baseId,
          searchIndex: [
            reference,
            property,
            technician,
            description,
            ticketDate,
            status.label,
          ].join(' '),
          startDate: ticketDate,
          endDate: ticketDate,
          archivedBy: ARCHIVED_BY,
          cells: [
            { kind: 'text', value: reference },
            { kind: 'text', value: property },
            {
              kind: 'avatar',
              imageSrc: avatarCell.imageSrc,
              value: technician,
            },
            { kind: 'text', value: description },
            { kind: 'text', value: ticketDate },
            { kind: 'badge', label: status.label, tone: status.tone },
            DEFAULT_ACTIONS,
          ],
        };
      }

      case 'documents': {
        const avatarCell = source.cells[2] as ArchivageAvatarCell;
        const type = pickValue(DOCUMENT_TYPE_OPTIONS, index);
        const property = pickValue(DOCUMENT_PROPERTY_VALUES, index + 2);
        const client = pickValue(DOCUMENT_CLIENT_VALUES, index);
        const startDate = pickValue(DOCUMENT_START_DATE_VALUES, index);
        const endDate = pickValue(DOCUMENT_END_DATE_VALUES, index);
        const owner = pickValue(BIENS_OWNER_OPTIONS, index + 1);
        const status = pickValue(DOCUMENT_STATUS_VALUES, index);

        return {
          id: baseId,
          searchIndex: [
            type,
            property,
            client,
            startDate,
            endDate,
            owner,
            status.label,
          ].join(' '),
          startDate,
          endDate,
          owner,
          archivedBy: ARCHIVED_BY,
          type,
          cells: [
            { kind: 'text', value: type },
            { kind: 'text', value: property },
            {
              kind: 'avatar',
              imageSrc: avatarCell.imageSrc,
              value: client,
            },
            { kind: 'text', value: startDate },
            { kind: 'text', value: endDate },
            { kind: 'badge', label: status.label, tone: status.tone },
            DEFAULT_ACTIONS,
          ],
        };
      }

      default:
        return cloneArchivageRow(source, baseId);
    }
  });
}

const BIENS_FILTERS: readonly ArchivageFilterField[] = [
  { id: 'keyword', label: 'Mot clé', kind: 'text' },
  { id: 'startDate', label: 'Date de début', kind: 'date' },
  { id: 'endDate', label: 'Date de fin', kind: 'date' },
  {
    id: 'owner',
    label: 'Propriétaire',
    kind: 'select',
    options: BIENS_OWNER_OPTIONS,
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
    options: DOCUMENT_TYPE_OPTIONS,
  },
  { id: 'startDate', label: 'Date de début', kind: 'date' },
  { id: 'endDate', label: 'Date de fin', kind: 'date' },
  {
    id: 'owner',
    label: 'Propriétaire',
    kind: 'select',
    options: BIENS_OWNER_OPTIONS,
  },
  {
    id: 'archivedBy',
    label: 'Archivé par',
    kind: 'select',
    options: [ARCHIVED_BY],
  },
];

const BIENS_SEED_ROWS: readonly ArchivageRow[] = [
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

const BIENS_ROWS: readonly ArchivageRow[] = expandArchivageRows(
  BIENS_SEED_ROWS,
  30,
  'biens',
);

const LOCATAIRES_SEED_ROWS: readonly ArchivageRow[] = [
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

const LOCATAIRES_ROWS: readonly ArchivageRow[] = expandArchivageRows(
  LOCATAIRES_SEED_ROWS,
  30,
  'locataires',
);

const FACTURES_SEED_ROWS: readonly ArchivageRow[] = [
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

const FACTURES_ROWS: readonly ArchivageRow[] = expandArchivageRows(
  FACTURES_SEED_ROWS,
  30,
  'factures',
);

const TICKETS_SEED_ROWS: readonly ArchivageRow[] = [
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

const TICKETS_ROWS: readonly ArchivageRow[] = expandArchivageRows(
  TICKETS_SEED_ROWS,
  30,
  'tickets',
);

const DOCUMENT_SEED_ROWS: readonly ArchivageRow[] = Array.from(
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

const DOCUMENT_ROWS: readonly ArchivageRow[] = expandArchivageRows(
  DOCUMENT_SEED_ROWS,
  30,
  'documents',
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

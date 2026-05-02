export type FinanceTransactionType = 'loyer' | 'depense';
export type FinanceTransactionStatus = 'payee' | 'en-attente';
export type FinanceTransactionFilterValue = 'all' | FinanceTransactionType;

export type FinanceSummaryCard = {
  readonly label: string;
  readonly amount: string;
  readonly tone: 'success' | 'info' | 'warning' | 'balance';
  readonly icon?: string;
  readonly iconAlt?: string;};

export type FinanceSelectOption<T extends string = string> = {
  readonly value: T;
  readonly label: string;};

export type FinanceTransactionRow = {
  readonly date: string;
  readonly reference: string;
  readonly type: FinanceTransactionType;
  readonly property: string;
  readonly tenant: string;
  readonly amount: string;
  readonly status: FinanceTransactionStatus;};

export type FinanceOverdueSidebarItem = {
  readonly name: string;
  readonly property: string;
  readonly amount: string;
  readonly avatar: string;};

export type FinanceOverdueRow = {
  readonly id: string;
  readonly tenant: string;
  readonly property: string;
  readonly amount: string;
  readonly dueDate: string;
  readonly delay: string;
  readonly penalty: string;
  readonly period: string;};

export type FinanceExpenseLegendItem = {
  readonly label: string;
  readonly ratio: string;
  readonly value: number;
  readonly tone: 'blue' | 'yellow' | 'green' | 'purple' | 'orange';};

export type FinanceRevenuePoint = {
  readonly label: string;
  readonly amount: number;
  readonly amountLabel: string;
  readonly highlighted?: boolean;};

export type FinanceTenantProfile = {
  readonly name: string;
  readonly role: string;
  readonly avatar: string;
  readonly cardAvatar: string;
  readonly propertyImage: string;
  readonly propertyTitle: string;
  readonly propertyLocation: string;
  readonly rentAmount: string;
  readonly propertyStatus: string;
  readonly paymentDuration: string;
  readonly rating: string;
  readonly ratingCount: string;};

export type FinanceTenantPaymentState = {
  readonly unpaid: string;
  readonly remaining: string;
  readonly paid: string;};

export type FinanceTenantInfoCard = {
  readonly items: readonly { icon: string; text: string }[];};

export type FinanceTenantDocument = {
  readonly name: string;};

export type FinanceTenantPayment = {
  readonly logo: string;
  readonly title: string;
  readonly date: string;
  readonly amount: string;
  readonly period: string;};

export const FINANCE_ASSETS = {
  chartGrid: 'finances/shared/chart-grid.webp',
  chartGradient: 'finances/shared/chart-gradient.webp',
  chartLine: 'finances/shared/chart-line.webp',
  chartIndicator: 'finances/shared/chart-indicator.webp',
  chartTooltip: 'finances/shared/chart-tooltip.webp',
  expensePie: 'finances/shared/expense-pie.webp',
  kpiMoney: 'finances/shared/kpi-money.webp',
  kpiExpenses: 'finances/shared/kpi-expenses.webp',
  kpiPending: 'finances/shared/kpi-pending.webp',
  balanceEyeOff: 'finances/shared/balance-eye-off.webp',
  searchIcon: 'finances/shared/search-icon.webp',
  calendarIcon: 'finances/shared/calendar-icon.webp',
  exportIcon: 'finances/shared/export-icon.webp',
  addIcon: 'finances/shared/add-icon.webp',
  chevronDown: 'finances/shared/chevron-down.webp',
  tableSearchIcon: 'finances/shared/table-search-icon.webp',
  actionEdit: 'finances/shared/action-edit.webp',
  actionMore: 'finances/shared/action-more.webp',
  sortArrow: 'finances/shared/sort-arrow.webp',
  overdueRowEye: 'finances/overdue/row-eye.webp',
  overdueRowMore: 'finances/overdue/row-more.webp',
  overdueDropdown: 'finances/overdue/dropdown-icon.webp',
  overdueBackIcon: 'finances/overdue/back-icon.webp',
  overdueHeaderCalendarIcon: 'finances/overdue/header-calendar-icon.webp',
  overdueHeaderExportIcon: 'finances/overdue/header-export-icon.webp',
  overduePeriodCalendarIcon: 'finances/overdue/period-calendar-icon.webp',
  overduePeriodDropdownIcon: 'finances/overdue/period-dropdown-icon.webp',
  overdueSearchIcon: 'finances/overdue/search-icon.webp',
  overduePaginatorPreviousIcon: 'finances/overdue/paginator-prev-icon.webp',
  overduePaginatorNextIcon: 'finances/overdue/paginator-next-icon.webp',
} as const;

export const FINANCE_SUMMARY_CARDS: readonly FinanceSummaryCard[] = [
  {
    label: 'Encaissement',
    amount: '15 750 000 FCFA',
    tone: 'success',
    icon: FINANCE_ASSETS.kpiMoney,
    iconAlt: 'Icône encaissement',
  },
  {
    label: 'Dépenses',
    amount: '8 750 000 FCFA',
    tone: 'info',
    icon: FINANCE_ASSETS.kpiExpenses,
    iconAlt: 'Icône dépenses',
  },
  {
    label: 'Loyer en attente',
    amount: '6 000 000 FCFA',
    tone: 'warning',
    icon: FINANCE_ASSETS.kpiPending,
    iconAlt: 'Icône loyer en attente',
  },
  {
    label: 'Solde disponible',
    amount: '15 750 000 FCFA',
    tone: 'balance',
    icon: FINANCE_ASSETS.balanceEyeOff,
    iconAlt: 'Masquer le solde',
  },
] as const;

export const FINANCE_TRANSACTION_TYPE_OPTIONS: readonly FinanceSelectOption<FinanceTransactionFilterValue>[] =
  [
    { value: 'all', label: 'Tout type' },
    { value: 'loyer', label: 'Loyer' },
    { value: 'depense', label: 'Dépense' },
  ] as const;

export const FINANCE_OVERVIEW_TRANSACTIONS: readonly FinanceTransactionRow[] = [
  {
    date: '22/04/2026',
    reference: 'LOY-0023',
    type: 'loyer',
    property: 'Résidence Plateau',
    tenant: 'Koné Ibrahim',
    amount: '750 000 FCFA',
    status: 'payee',
  },
  {
    date: '22/04/2026',
    reference: 'LOY-0023',
    type: 'depense',
    property: 'Résidence Plateau',
    tenant: 'Koné Ibrahim',
    amount: '750 000 FCFA',
    status: 'payee',
  },
  {
    date: '22/04/2026',
    reference: 'LOY-0023',
    type: 'loyer',
    property: 'Résidence Plateau',
    tenant: 'Koné Ibrahim',
    amount: '750 000 FCFA',
    status: 'payee',
  },
  {
    date: '22/04/2026',
    reference: 'LOY-0023',
    type: 'loyer',
    property: 'Résidence Plateau',
    tenant: 'Koné Ibrahim',
    amount: '750 000 FCFA',
    status: 'payee',
  },
  {
    date: '22/04/2026',
    reference: 'LOY-0023',
    type: 'loyer',
    property: 'Résidence Plateau',
    tenant: 'Koné Ibrahim',
    amount: '750 000 FCFA',
    status: 'payee',
  },
] as const;

export const FINANCE_TRANSACTION_HISTORY: readonly FinanceTransactionRow[] = [
  {
    date: '22/04/2026',
    reference: 'LOY-0023',
    type: 'loyer',
    property: 'Résidence Plateau',
    tenant: 'Koné Ibrahim',
    amount: '750 000 FCFA',
    status: 'payee',
  },
  {
    date: '22/04/2026',
    reference: 'LOY-0024',
    type: 'depense',
    property: 'Résidence Plateau',
    tenant: 'Landry Bamba',
    amount: '350 000 FCFA',
    status: 'payee',
  },
  {
    date: '23/04/2026',
    reference: 'LOY-0023',
    type: 'loyer',
    property: 'Résidence Plateau',
    tenant: 'Koné Ibrahim',
    amount: '750 000 FCFA',
    status: 'en-attente',
  },
  {
    date: '23/04/2026',
    reference: 'LOY-0023',
    type: 'loyer',
    property: 'Résidence Plateau',
    tenant: 'Koné Ibrahim',
    amount: '750 000 FCFA',
    status: 'en-attente',
  },
  {
    date: '22/04/2026',
    reference: 'LOY-0024',
    type: 'depense',
    property: 'Résidence Plateau',
    tenant: 'Landry Bamba',
    amount: '350 000 FCFA',
    status: 'payee',
  },
  {
    date: '22/04/2026',
    reference: 'LOY-0024',
    type: 'depense',
    property: 'Résidence Plateau',
    tenant: 'Landry Bamba',
    amount: '350 000 FCFA',
    status: 'payee',
  },
  {
    date: '22/04/2026',
    reference: 'LOY-0024',
    type: 'depense',
    property: 'Résidence Plateau',
    tenant: 'Landry Bamba',
    amount: '350 000 FCFA',
    status: 'payee',
  },
  {
    date: '22/04/2026',
    reference: 'LOY-0024',
    type: 'depense',
    property: 'Résidence Plateau',
    tenant: 'Landry Bamba',
    amount: '350 000 FCFA',
    status: 'payee',
  },
] as const;

export const FINANCE_EXPENSE_LEGEND: readonly FinanceExpenseLegendItem[] = [
  { label: 'Entretien', ratio: '33 %', value: 33, tone: 'blue' },
  { label: 'Marketing', ratio: '33 %', value: 33, tone: 'yellow' },
  { label: 'Salaire', ratio: '28 %', value: 28, tone: 'green' },
  { label: 'Taxes', ratio: '33 %', value: 33, tone: 'purple' },
  { label: 'Charges', ratio: '22 %', value: 22, tone: 'orange' },
] as const;

// Derived from the Figma curve asset so the PrimeNG line chart keeps the original shape.
export const FINANCE_REVENUE_SERIES: readonly FinanceRevenuePoint[] = [
  { label: 'JAN', amount: 1_900_000, amountLabel: '1 900 000 FCFA' },
  { label: 'FEB', amount: 3_300_000, amountLabel: '3 300 000 FCFA' },
  { label: 'MAR', amount: 600_000, amountLabel: '600 000 FCFA' },
  { label: 'APR', amount: 2_300_000, amountLabel: '2 300 000 FCFA' },
  { label: 'MAY', amount: 5_600_000, amountLabel: '5 600 000 FCFA' },
  {
    label: 'JUN',
    amount: 3_500_000,
    amountLabel: '3 500 000 FCFA',
    highlighted: true,
  },
  { label: 'JUL', amount: 4_800_000, amountLabel: '4 800 000 FCFA' },
  { label: 'AUG', amount: 4_100_000, amountLabel: '4 100 000 FCFA' },
  { label: 'SEP', amount: 3_700_000, amountLabel: '3 700 000 FCFA' },
  { label: 'OCT', amount: 1_800_000, amountLabel: '1 800 000 FCFA' },
  { label: 'NOV', amount: 600_000, amountLabel: '600 000 FCFA' },
  { label: 'DEC', amount: 3_600_000, amountLabel: '3 600 000 FCFA' },
] as const;

export const FINANCE_MONTH_LABELS = [
  'JAN',
  'FEB',
  'MAR',
  'APR',
  'MAY',
  'JUN',
  'JUL',
  'AUG',
  'SEP',
  'OCT',
  'NOV',
  'DEC',
] as const;

export const FINANCE_Y_AXIS_LABELS = [
  '10M',
  '5M',
  '3M',
  '1M',
  '500K',
  '0',
] as const;

export const FINANCE_OVERVIEW_OVERDUE: readonly FinanceOverdueSidebarItem[] = [
  {
    name: 'Koné Ibrahim',
    property: 'Villa Riviera',
    amount: '450 000 FCFA',
    avatar: 'finances/overdue/avatar-01.webp',
  },
  {
    name: 'Koné Ibrahim',
    property: 'Villa Riviera',
    amount: '250 000 FCFA',
    avatar: 'finances/overdue/avatar-02.webp',
  },
  {
    name: 'Koné Ibrahim',
    property: 'Villa Riviera',
    amount: '400 000 FCFA',
    avatar: 'finances/overdue/avatar-03.webp',
  },
  {
    name: 'Koné Ibrahim',
    property: 'Villa Riviera',
    amount: '600 000 FCFA',
    avatar: 'finances/overdue/avatar-04.webp',
  },
  {
    name: 'Koné Ibrahim',
    property: 'Villa Riviera',
    amount: '800 000 FCFA',
    avatar: 'finances/overdue/avatar-05.webp',
  },
  {
    name: 'Koné Ibrahim',
    property: 'Villa Riviera',
    amount: '750 000 FCFA',
    avatar: 'finances/overdue/avatar-06.webp',
  },
  {
    name: 'Koné Ibrahim',
    property: 'Villa Riviera',
    amount: '450 000 FCFA',
    avatar: 'finances/overdue/avatar-07.webp',
  },
] as const;

export const FINANCE_OVERDUE_ROWS: readonly FinanceOverdueRow[] = [
  {
    id: '1',
    tenant: 'Landry Bamba',
    property: 'Résidence Plateau',
    amount: '350 000 FCFA',
    dueDate: '22/04/2026',
    delay: '14 jours',
    penalty: '14 000 FCFA',
    period: 'Avril 2025',
  },
  {
    id: '2',
    tenant: 'Landry Bamba',
    property: 'Résidence Plateau',
    amount: '350 000 FCFA',
    dueDate: '22/04/2026',
    delay: '14 jours',
    penalty: '14 000 FCFA',
    period: 'Avril 2025',
  },
  {
    id: '3',
    tenant: 'Landry Bamba',
    property: 'Résidence Plateau',
    amount: '350 000 FCFA',
    dueDate: '22/04/2026',
    delay: '14 jours',
    penalty: '14 000 FCFA',
    period: 'Avril 2025',
  },
  {
    id: '4',
    tenant: 'Landry Bamba',
    property: 'Résidence Plateau',
    amount: '350 000 FCFA',
    dueDate: '22/04/2026',
    delay: '14 jours',
    penalty: '14 000 FCFA',
    period: 'Avril 2025',
  },
  {
    id: '5',
    tenant: 'Landry Bamba',
    property: 'Résidence Plateau',
    amount: '350 000 FCFA',
    dueDate: '22/04/2026',
    delay: '14 jours',
    penalty: '14 000 FCFA',
    period: 'Avril 2025',
  },
  {
    id: '6',
    tenant: 'Landry Bamba',
    property: 'Résidence Plateau',
    amount: '350 000 FCFA',
    dueDate: '22/04/2026',
    delay: '14 jours',
    penalty: '14 000 FCFA',
    period: 'Avril 2025',
  },
] as const;

export const FINANCE_TENANT_PROFILE: FinanceTenantProfile = {
  name: 'Aïcha Kouadio',
  role: 'Locataire',
  avatar: 'biens/list/list-tenant-01.webp',
  cardAvatar: 'hotel-dashboard/properties/tenant-aicha.webp',
  propertyImage: 'shared/rooms/room-photo-01.webp',
  propertyTitle: 'Immeuble kalia',
  propertyLocation: 'Abidjan, Cocody',
  rentAmount: '400 000 FCFA',
  propertyStatus: 'Location',
  paymentDuration: '12 mois',
  rating: '★★★★',
  ratingCount: '4',
} as const;

export const FINANCE_TENANT_PAYMENT_STATE: FinanceTenantPaymentState = {
  unpaid: '0',
  remaining: '4',
  paid: '8',
} as const;

export const FINANCE_TENANT_INFO: readonly FinanceTenantInfoCard[] = [
  {
    items: [
      { icon: 'pi pi-phone', text: '+225 07 58 23 41 89' },
      { icon: 'pi pi-envelope', text: 'jm.koffi@gmail.com' },
      { icon: 'pi pi-id-card', text: 'UBX-LOC-0245' },
    ],
  },
  {
    items: [
      { icon: 'pi pi-briefcase', text: 'Ingénieur BTP' },
      { icon: 'pi pi-file', text: 'Salarié' },
    ],
  },
  {
    items: [
      { icon: 'pi pi-calendar', text: 'Date d’entrée : 12 Janvier 2025' },
      { icon: 'pi pi-calendar', text: 'Fin du bail : 12 Janvier 2026' },
      { icon: 'pi pi-calendar', text: 'Durée du bail : 12 mois' },
    ],
  },
] as const;

export const FINANCE_TENANT_DOCUMENTS: readonly FinanceTenantDocument[] = [
  { name: 'Contrat de bail signé' },
  { name: 'État des lieux d’entrée' },
  { name: 'Reçu de caution' },
  { name: 'Reçu avance' },
  { name: 'CNI ivoirienne' },
] as const;

export const FINANCE_TENANT_PAYMENTS: readonly FinanceTenantPayment[] = [
  {
    logo: 'biens/bailleur/payment-orange.webp',
    title: 'Paiement Location',
    date: '2 Avril 2026 à 17 : 41',
    amount: '+ 600 000 FCFA',
    period: 'Février 2026',
  },
  {
    logo: 'biens/bailleur/payment-wave.webp',
    title: 'Paiement Location',
    date: '5 Avril 2026 à 12 : 30',
    amount: '+ 450 000 FCFA',
    period: 'Mars 2026',
  },
  {
    logo: 'biens/bailleur/payment-wave.webp',
    title: 'Paiement Location',
    date: '5 Avril 2026 à 12 : 30',
    amount: '+ 450 000 FCFA',
    period: 'Mars 2026',
  },
  {
    logo: 'biens/bailleur/payment-wave.webp',
    title: 'Paiement Location',
    date: '5 Avril 2026 à 12 : 30',
    amount: '+ 450 000 FCFA',
    period: 'Mars 2026',
  },
] as const;

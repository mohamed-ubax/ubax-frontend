export type FinanceTransactionType = 'loyer' | 'depense';
export type FinanceTransactionStatus = 'payee' | 'en-attente';

export interface FinanceSummaryCard {
  readonly label: string;
  readonly amount: string;
  readonly tone: 'success' | 'info' | 'warning' | 'balance';
  readonly icon?: string;
  readonly iconAlt?: string;
}

export interface FinanceTransactionRow {
  readonly date: string;
  readonly reference: string;
  readonly type: FinanceTransactionType;
  readonly property: string;
  readonly tenant: string;
  readonly amount: string;
  readonly status: FinanceTransactionStatus;
}

export interface FinanceOverdueSidebarItem {
  readonly name: string;
  readonly property: string;
  readonly amount: string;
  readonly avatar: string;
}

export interface FinanceOverdueRow {
  readonly id: string;
  readonly tenant: string;
  readonly property: string;
  readonly amount: string;
  readonly dueDate: string;
  readonly delay: string;
  readonly penalty: string;
}

export interface FinanceExpenseLegendItem {
  readonly label: string;
  readonly ratio: string;
  readonly tone: 'blue' | 'yellow' | 'green' | 'purple' | 'orange';
}

export interface FinanceTenantInfoCard {
  readonly items: readonly { icon: string; text: string }[];
}

export interface FinanceTenantDocument {
  readonly name: string;
}

export interface FinanceTenantPayment {
  readonly logo: string;
  readonly title: string;
  readonly date: string;
  readonly amount: string;
  readonly period: string;
}

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
  { label: 'Entretien', ratio: '33 %', tone: 'blue' },
  { label: 'Marketing', ratio: '33 %', tone: 'yellow' },
  { label: 'Salaire', ratio: '28 %', tone: 'green' },
  { label: 'Taxes', ratio: '35 %', tone: 'purple' },
  { label: 'Charges', ratio: '22 %', tone: 'orange' },
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
  },
  {
    id: '2',
    tenant: 'Landry Bamba',
    property: 'Résidence Plateau',
    amount: '350 000 FCFA',
    dueDate: '22/04/2026',
    delay: '14 jours',
    penalty: '14 000 FCFA',
  },
  {
    id: '3',
    tenant: 'Landry Bamba',
    property: 'Résidence Plateau',
    amount: '350 000 FCFA',
    dueDate: '22/04/2026',
    delay: '14 jours',
    penalty: '14 000 FCFA',
  },
  {
    id: '4',
    tenant: 'Landry Bamba',
    property: 'Résidence Plateau',
    amount: '350 000 FCFA',
    dueDate: '22/04/2026',
    delay: '14 jours',
    penalty: '14 000 FCFA',
  },
  {
    id: '5',
    tenant: 'Landry Bamba',
    property: 'Résidence Plateau',
    amount: '350 000 FCFA',
    dueDate: '22/04/2026',
    delay: '14 jours',
    penalty: '14 000 FCFA',
  },
  {
    id: '6',
    tenant: 'Landry Bamba',
    property: 'Résidence Plateau',
    amount: '350 000 FCFA',
    dueDate: '22/04/2026',
    delay: '14 jours',
    penalty: '14 000 FCFA',
  },
] as const;

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

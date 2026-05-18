import type { Plugin } from 'chart.js';
import type {
  DashboardExpense,
  DashboardExpensePropertyOption,
  DashboardKpiCard,
  DashboardOverdueItem,
  DashboardPeriod,
  DashboardTransaction,
  RevenuePoint,
  RevenueSplitItem,
} from '../types/dashboard-comptable.types';

export const DASHBOARD_COMPTABLE_ASSETS = {
  search: 'finances/shared/search-icon.webp',
  calendar: 'finances/shared/calendar-icon.webp',
  export: 'finances/shared/export-icon.webp',
  balanceEyeOff: 'dashboard-comptable/balance-eye-off.webp',
  kpiRevenue: 'dashboard-comptable/kpi-revenue.webp',
  kpiRent: 'dashboard-comptable/kpi-rent.webp',
  kpiPending: 'dashboard-comptable/kpi-pending.webp',
  kpiCommission: 'dashboard-comptable/kpi-commission.webp',
  addExpense: 'dashboard-comptable/cta-add-expense.webp',
  expenseMaintenance: 'dashboard-comptable/expense-entretien.webp',
  expenseMarketing: 'dashboard-comptable/expense-marketing.webp',
  expenseSalaries: 'dashboard-comptable/expense-salaires.webp',
  expenseLocale: 'dashboard-comptable/expense-locale.webp',
  expenseTotal: 'dashboard-comptable/expense-total.webp',
  transactionCheck: 'dashboard-comptable/transaction-check.webp',
  transactionArrow: 'dashboard-comptable/transaction-arrow.webp',
  transactionOrange: 'biens/bailleur/payment-orange.webp',
  transactionWave: 'biens/bailleur/payment-wave.webp',
  transactionMomo: 'dashboard-comptable/payment-momo.webp',
  warning: 'dashboard-comptable/warning.webp',
  modalClose: 'dashboard-comptable/modal-close.webp',
  modalChevron: 'dashboard-comptable/modal-chevron.webp',
  modalCategoryIcon: 'dashboard-comptable/modal-category-icon.webp',
  modalCalendar: 'dashboard-comptable/modal-calendar.webp',
  modalFile: 'dashboard-comptable/modal-file.webp',
  modalFileCheck: 'dashboard-comptable/modal-file-check.webp',
} as const;

export const KPI_CARDS: readonly DashboardKpiCard[] = [
  {
    label: 'Revenus du Mois',
    amount: 15_750_000,
    tone: 'revenue',
    icon: DASHBOARD_COMPTABLE_ASSETS.kpiRevenue,
    iconAlt: 'Icône revenus du mois',
  },
  {
    label: 'Loyer encaissés',
    amount: 8_750_000,
    tone: 'rent',
    icon: DASHBOARD_COMPTABLE_ASSETS.kpiRent,
    iconAlt: 'Icône loyers encaissés',
  },
  {
    label: 'Paiements en attente',
    amount: 6_000_000,
    tone: 'pending',
    icon: DASHBOARD_COMPTABLE_ASSETS.kpiPending,
    iconAlt: 'Icône paiements en attente',
  },
  {
    label: 'Commission Agence',
    amount: 1_750_000,
    tone: 'commission',
    icon: DASHBOARD_COMPTABLE_ASSETS.kpiCommission,
    iconAlt: 'Icône commission agence',
  },
] as const;

export const REVENUE_SERIES: Record<DashboardPeriod, readonly RevenuePoint[]> = {
  Jour: [
    { label: 'JAN', amount: 800_000, tooltipLabel: '800 000 FCFA' },
    { label: 'FEB', amount: 1_300_000, tooltipLabel: '1 300 000 FCFA' },
    { label: 'MAR', amount: 600_000, tooltipLabel: '600 000 FCFA' },
    { label: 'APR', amount: 1_100_000, tooltipLabel: '1 100 000 FCFA' },
    { label: 'MAY', amount: 1_850_000, tooltipLabel: '1 850 000 FCFA' },
    {
      label: 'JUN',
      amount: 1_250_000,
      tooltipLabel: '1 250 000 FCFA',
      highlighted: true,
    },
    { label: 'JUL', amount: 1_650_000, tooltipLabel: '1 650 000 FCFA' },
    { label: 'AUG', amount: 1_500_000, tooltipLabel: '1 500 000 FCFA' },
    { label: 'SEP', amount: 1_320_000, tooltipLabel: '1 320 000 FCFA' },
    { label: 'OCT', amount: 950_000, tooltipLabel: '950 000 FCFA' },
    { label: 'NOV', amount: 600_000, tooltipLabel: '600 000 FCFA' },
    { label: 'DEC', amount: 1_700_000, tooltipLabel: '1 700 000 FCFA' },
  ],
  Mois: [
    { label: 'JAN', amount: 1_400_000, tooltipLabel: '1 400 000 FCFA' },
    { label: 'FEB', amount: 2_200_000, tooltipLabel: '2 200 000 FCFA' },
    { label: 'MAR', amount: 800_000, tooltipLabel: '800 000 FCFA' },
    { label: 'APR', amount: 1_900_000, tooltipLabel: '1 900 000 FCFA' },
    { label: 'MAY', amount: 4_450_000, tooltipLabel: '4 450 000 FCFA' },
    {
      label: 'JUN',
      amount: 2_900_000,
      tooltipLabel: '2 900 000 FCFA',
      highlighted: true,
    },
    { label: 'JUL', amount: 3_850_000, tooltipLabel: '3 850 000 FCFA' },
    { label: 'AUG', amount: 3_250_000, tooltipLabel: '3 250 000 FCFA' },
    { label: 'SEP', amount: 2_950_000, tooltipLabel: '2 950 000 FCFA' },
    { label: 'OCT', amount: 1_550_000, tooltipLabel: '1 550 000 FCFA' },
    { label: 'NOV', amount: 700_000, tooltipLabel: '700 000 FCFA' },
    { label: 'DEC', amount: 3_200_000, tooltipLabel: '3 200 000 FCFA' },
  ],
  Année: [
    { label: 'JAN', amount: 1_900_000, tooltipLabel: '1 900 000 FCFA' },
    { label: 'FEB', amount: 3_300_000, tooltipLabel: '3 300 000 FCFA' },
    { label: 'MAR', amount: 600_000, tooltipLabel: '600 000 FCFA' },
    { label: 'APR', amount: 2_300_000, tooltipLabel: '2 300 000 FCFA' },
    { label: 'MAY', amount: 5_600_000, tooltipLabel: '5 600 000 FCFA' },
    {
      label: 'JUN',
      amount: 3_500_000,
      tooltipLabel: '3 500 000 FCFA',
      highlighted: true,
    },
    { label: 'JUL', amount: 4_800_000, tooltipLabel: '4 800 000 FCFA' },
    { label: 'AUG', amount: 4_100_000, tooltipLabel: '4 100 000 FCFA' },
    { label: 'SEP', amount: 3_700_000, tooltipLabel: '3 700 000 FCFA' },
    { label: 'OCT', amount: 1_800_000, tooltipLabel: '1 800 000 FCFA' },
    { label: 'NOV', amount: 600_000, tooltipLabel: '600 000 FCFA' },
    { label: 'DEC', amount: 3_600_000, tooltipLabel: '3 600 000 FCFA' },
  ],
};

export const Y_AXIS_LABELS: Record<DashboardPeriod, readonly string[]> = {
  Jour: ['2M', '1.5M', '1M', '500K', '250K', '0'],
  Mois: ['6M', '4M', '3M', '2M', '1M', '0'],
  Année: ['10M', '5M', '3M', '1M', '500K', '0'],
};

export const REVENUE_SPLIT: Record<DashboardPeriod, readonly RevenueSplitItem[]> = {
  Jour: [
    { label: 'courte durée', value: 22, percentage: '22%', tone: 'short' },
    { label: 'Location', value: 54, percentage: '54%', tone: 'location' },
    { label: 'Vente', value: 24, percentage: '24%', tone: 'sale' },
  ],
  Mois: [
    { label: 'courte durée', value: 18, percentage: '18%', tone: 'short' },
    { label: 'Location', value: 61, percentage: '61%', tone: 'location' },
    { label: 'Vente', value: 21, percentage: '21%', tone: 'sale' },
  ],
  Année: [
    { label: 'courte durée', value: 15, percentage: '15%', tone: 'short' },
    { label: 'Location', value: 65, percentage: '65%', tone: 'location' },
    { label: 'Vente', value: 25, percentage: '25%', tone: 'sale' },
  ],
};

export const INITIAL_TRANSACTIONS: readonly DashboardTransaction[] = [
  {
    id: 'transaction-1',
    title: 'Réception paiement Location',
    date: '5 Avril 2026 à 12 : 30',
    customer: 'Koné Ibrahim',
    amount: 450_000,
    month: 'Mars 2026',
    logo: DASHBOARD_COMPTABLE_ASSETS.transactionWave,
    logoAlt: 'Logo Wave',
  },
  {
    id: 'transaction-2',
    title: 'Réception paiement Location',
    date: '2 Avril 2026 à 17 : 41',
    customer: 'Koffi Didier',
    amount: 600_000,
    month: 'Mars 2026',
    logo: DASHBOARD_COMPTABLE_ASSETS.transactionOrange,
    logoAlt: 'Logo Orange Money',
  },
  {
    id: 'transaction-3',
    title: 'Réception paiement Location',
    date: '2 Avril 2026 à 17 : 41',
    customer: 'Konan Olivier',
    amount: 250_000,
    month: 'Mars 2026',
    logo: DASHBOARD_COMPTABLE_ASSETS.transactionMomo,
    logoAlt: 'Logo MTN Mobile Money',
  },
  {
    id: 'transaction-4',
    title: 'Réception paiement Location',
    date: '2 Avril 2026 à 17 : 41',
    customer: 'Koffi Didier',
    amount: 600_000,
    month: 'Mars 2026',
    logo: DASHBOARD_COMPTABLE_ASSETS.transactionOrange,
    logoAlt: 'Logo Orange Money',
  },
  {
    id: 'transaction-5',
    title: 'Réception paiement Location',
    date: '5 Avril 2026 à 12 : 30',
    customer: 'Koné Ibrahim',
    amount: 450_000,
    month: 'Mars 2026',
    logo: DASHBOARD_COMPTABLE_ASSETS.transactionWave,
    logoAlt: 'Logo Wave',
  },
  {
    id: 'transaction-6',
    title: 'Réception paiement Location',
    date: '5 Avril 2026 à 12 : 30',
    customer: 'Koné Ibrahim',
    amount: 450_000,
    month: 'Mars 2026',
    logo: DASHBOARD_COMPTABLE_ASSETS.transactionWave,
    logoAlt: 'Logo Wave',
  },
] as const;

export const INITIAL_EXPENSES: readonly DashboardExpense[] = [
  {
    id: 'expense-1',
    label: 'Entretien',
    amount: 250_000,
    icon: DASHBOARD_COMPTABLE_ASSETS.expenseMaintenance,
    iconAlt: 'Icône entretien',
  },
  {
    id: 'expense-2',
    label: 'Marketing',
    amount: 250_000,
    icon: DASHBOARD_COMPTABLE_ASSETS.expenseMarketing,
    iconAlt: 'Icône marketing',
  },
  {
    id: 'expense-3',
    label: 'Salaires',
    amount: 800_000,
    icon: DASHBOARD_COMPTABLE_ASSETS.expenseSalaries,
    iconAlt: 'Icône salaires',
  },
  {
    id: 'expense-4',
    label: 'Locale',
    amount: 300_000,
    icon: DASHBOARD_COMPTABLE_ASSETS.expenseLocale,
    iconAlt: 'Icône local',
  },
] as const;

export const INITIAL_OVERDUE_ITEMS: readonly DashboardOverdueItem[] = [
  {
    id: 'overdue-1',
    name: 'Affoué Sandrine',
    property: 'résidence Plateau',
    type: 'Appartement',
  },
  {
    id: 'overdue-2',
    name: 'Kouamé Patrick',
    property: 'Immeuble kalia',
    type: 'Appartement',
  },
  {
    id: 'overdue-3',
    name: 'Konan Olivier',
    property: 'Villa Riviera',
    type: 'Villa',
  },
  {
    id: 'overdue-4',
    name: 'Koné Ibrahim',
    property: 'résidence Plateau',
    type: 'Appartement',
  },
  {
    id: 'overdue-5',
    name: 'Affoué Sandrine',
    property: 'résidence Plateau',
    type: 'Appartement',
  },
  {
    id: 'overdue-6',
    name: 'Traoré Aïcha',
    property: 'résidence Plateau',
    type: 'Appartement',
  },
] as const;

export const DRAWER_CATEGORIES = [
  'Réparation',
  'Entretien',
  'Marketing',
  'Salaires',
  'Locale',
  'Autre',
] as const;

export const EXPENSE_PAYMENT_METHODS = [
  'Espèces',
  'Mobile Money',
  'Virement',
] as const;

export const EXPENSE_PROPERTIES: readonly DashboardExpensePropertyOption[] = [
  {
    id: 'property-ubx-102',
    label: 'UBX-102 - Appartement 0015 immeuble kalia',
    owner: 'Kouamé Patrick',
  },
  {
    id: 'property-plateau',
    label: 'UBX-208 - Résidence Plateau B12',
    owner: 'Affoué Sandrine',
  },
  {
    id: 'property-riviera',
    label: 'UBX-315 - Villa Riviera 03',
    owner: 'Konan Olivier',
  },
] as const;

export const EXPENSE_PROVIDER_OPTIONS = [
  'Serge Kouamé',
  'Affoué Sandrine',
  'Kouamé Patrick',
] as const;

export const MODAL_CLOSE_DURATION_MS = 220;
export const DEFAULT_EXPENSE_DATE = new Date(2026, 10, 14);

export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function formatFileSize(size: number): string {
  if (size >= 1024 * 1024) {
    return `${(size / (1024 * 1024)).toFixed(1).replace(/\.0$/, '')} MB`;
  }

  return `${Math.max(1, Math.round(size / 1024))} KB`;
}

export function formatFcfa(amount: number): string {
  return `${new Intl.NumberFormat('fr-FR').format(amount).replace(/\u202f/g, ' ')} FCFA`;
}

export function formatShortDate(date: Date): string {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  }).format(date);
}

export function normalizeForSearch(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

export function parseAmountInput(value: string): number {
  const numericValue = Number(value.replace(/[^\d]/g, ''));
  return Number.isFinite(numericValue) ? numericValue : 0;
}

// Private: used only within createRevenueFocusPlugin
function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
): void {
  const safeRadius = Math.min(radius, width / 2, height / 2);

  ctx.beginPath();
  ctx.moveTo(x + safeRadius, y);
  ctx.lineTo(x + width - safeRadius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + safeRadius);
  ctx.lineTo(x + width, y + height - safeRadius);
  ctx.quadraticCurveTo(
    x + width,
    y + height,
    x + width - safeRadius,
    y + height,
  );
  ctx.lineTo(x + safeRadius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - safeRadius);
  ctx.lineTo(x, y + safeRadius);
  ctx.quadraticCurveTo(x, y, x + safeRadius, y);
  ctx.closePath();
}

export function createRevenueFocusPlugin(
  activeIndex: number,
  tooltipLabel: string,
): Plugin<'line'> {
  return {
    id: 'ubaxDashboardComptableRevenueFocus',
    afterDatasetsDraw(chart) {
      const activePoint = chart.getDatasetMeta(0).data[activeIndex] as
        | { x: number; y: number }
        | undefined;

      if (!activePoint) {
        return;
      }

      const { ctx, chartArea } = chart;
      const bubbleWidth = 149;
      const bubbleHeight = 52;
      const bubbleX = Math.min(
        Math.max(activePoint.x, chartArea.left + bubbleWidth / 2),
        chartArea.right - bubbleWidth / 2,
      );
      const bubbleY = chartArea.top + 18;

      ctx.save();

      ctx.strokeStyle = 'rgba(232, 125, 30, 0.42)';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(activePoint.x, bubbleY + bubbleHeight + 10);
      ctx.lineTo(activePoint.x, chartArea.bottom);
      ctx.stroke();

      ctx.fillStyle = '#e87d1e';
      ctx.beginPath();
      ctx.arc(activePoint.x, activePoint.y, 6, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(activePoint.x, activePoint.y, 2.8, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#1a3047';
      drawRoundedRect(
        ctx,
        bubbleX - bubbleWidth / 2,
        bubbleY,
        bubbleWidth,
        bubbleHeight,
        6,
      );
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = '500 13px Lexend';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(tooltipLabel, bubbleX, bubbleY + bubbleHeight / 2 + 1);

      ctx.restore();
    },
  };
}

export function resolveExpenseIcon(category: string): {
  icon: string;
  iconAlt: string;
} {
  switch (normalizeForSearch(category)) {
    case 'reparation':
    case 'entretien':
      return {
        icon: DASHBOARD_COMPTABLE_ASSETS.expenseMaintenance,
        iconAlt: 'Icône entretien',
      };
    case 'marketing':
      return {
        icon: DASHBOARD_COMPTABLE_ASSETS.expenseMarketing,
        iconAlt: 'Icône marketing',
      };
    case 'salaires':
      return {
        icon: DASHBOARD_COMPTABLE_ASSETS.expenseSalaries,
        iconAlt: 'Icône salaires',
      };
    case 'locale':
    case 'local':
      return {
        icon: DASHBOARD_COMPTABLE_ASSETS.expenseLocale,
        iconAlt: 'Icône local',
      };
    default:
      return {
        icon: DASHBOARD_COMPTABLE_ASSETS.expenseTotal,
        iconAlt: 'Icône dépense',
      };
  }
}

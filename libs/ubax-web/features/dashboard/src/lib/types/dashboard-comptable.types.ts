export type DashboardPeriod = 'Jour' | 'Mois' | 'Année';
export type DashboardExpenseLinkMode = 'property' | 'agency';

export type DashboardKpiCard = {
  readonly label: string;
  readonly amount: number;
  readonly tone: 'revenue' | 'rent' | 'pending' | 'commission';
  readonly icon: string;
  readonly iconAlt: string;
};

export type RevenuePoint = {
  readonly label: string;
  readonly amount: number;
  readonly tooltipLabel: string;
  readonly highlighted?: boolean;
};

export type RevenueSplitItem = {
  readonly label: string;
  readonly value: number;
  readonly percentage: string;
  readonly tone: 'short' | 'location' | 'sale';
};

export type DashboardTransaction = {
  readonly id: string;
  readonly title: string;
  readonly date: string;
  readonly customer: string;
  readonly amount: number;
  readonly month: string;
  readonly logo: string;
  readonly logoAlt: string;
};

export type DashboardExpense = {
  readonly id: string;
  readonly label: string;
  readonly amount: number;
  readonly icon: string;
  readonly iconAlt: string;
};

export type DashboardExpensePropertyOption = {
  readonly id: string;
  readonly label: string;
  readonly owner: string;
};

export type DashboardExpenseUpload = {
  readonly id: string;
  readonly name: string;
  readonly sizeLabel: string;
};

export type DashboardOverdueItem = {
  readonly id: string;
  readonly name: string;
  readonly property: string;
  readonly type: string;
};

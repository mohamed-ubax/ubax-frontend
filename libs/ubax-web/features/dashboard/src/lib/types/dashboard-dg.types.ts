export type DashboardKpiCard = {
  readonly label: string;
  readonly value: string;
  readonly trend?: string;
  readonly tone: 'all' | 'active' | 'rented' | 'sold';
  readonly iconSrc: string;
};

export type DashboardPropertyRow = {
  readonly uid: string;
  readonly id: string;
  readonly name: string;
  readonly type: string;
  readonly location: string;
  readonly price: string;
  readonly tenant: string;
  readonly status: string;
  readonly avatar: string;
};

export type DashboardDonutLegendItem = {
  readonly count: number;
  readonly label: string;
  readonly tone: 'occupied' | 'available' | 'reserved' | 'maintenance';
};

export type DashboardRevenueBar = {
  readonly label: string;
  readonly slug:
    | 'jan'
    | 'fev'
    | 'mar'
    | 'avr'
    | 'mai'
    | 'jui-1'
    | 'jui-2'
    | 'aou'
    | 'sep'
    | 'oct'
    | 'nov'
    | 'dec';
  readonly value: number;
  readonly highlighted?: boolean;
};

export type DashboardTransaction = {
  readonly uid: string;
  readonly title: string;
  readonly date: string;
  readonly customer: string;
  readonly amount: string;
  readonly month: string;
  readonly logo: string;
};

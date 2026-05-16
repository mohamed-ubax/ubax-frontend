export type BailleurRevenueCard = {
  readonly label: string;
  readonly value: string;
  readonly tone: 'accent' | 'navy' | 'success';
};

export type BailleurDocument = {
  readonly name: string;
};

export type BailleurPayment = {
  readonly logo: string;
  readonly title: string;
  readonly property: string;
  readonly amount: string;
  readonly period: string;
  readonly date: string;
};

export type BailleurProperty = {
  readonly image: string;
  readonly title: string;
  readonly location: string;
  readonly tenant: string;
  readonly tenantRole: string;
  readonly tenantAvatar: string;
  readonly price: string;
  readonly status: string;
  readonly statusTone: 'accent' | 'success' | 'info';
};

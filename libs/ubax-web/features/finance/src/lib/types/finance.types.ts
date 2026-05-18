export type FinanceTransactionType = 'loyer' | 'depense';
export type FinanceTransactionStatus = 'payee' | 'en-attente';
export type FinanceTransactionFilterValue = 'all' | FinanceTransactionType;

export type FinanceSummaryCard = {
  readonly label: string;
  readonly amount: string;
  readonly tone: 'success' | 'info' | 'warning' | 'balance';
  readonly icon?: string;
  readonly iconAlt?: string;
};

export type FinanceSelectOption<T extends string = string> = {
  readonly value: T;
  readonly label: string;
};

export type FinanceTransactionRow = {
  readonly date: string;
  readonly reference: string;
  readonly type: FinanceTransactionType;
  readonly property: string;
  readonly tenant: string;
  readonly amount: string;
  readonly status: FinanceTransactionStatus;
};

export type FinanceOverdueSidebarItem = {
  readonly name: string;
  readonly property: string;
  readonly amount: string;
  readonly avatar: string;
};

export type FinanceOverdueRow = {
  readonly id: string;
  readonly tenant: string;
  readonly property: string;
  readonly amount: string;
  readonly dueDate: string;
  readonly delay: string;
  readonly penalty: string;
  readonly period: string;
};

export type FinanceExpenseLegendItem = {
  readonly label: string;
  readonly ratio: string;
  readonly value: number;
  readonly tone: 'blue' | 'yellow' | 'green' | 'purple' | 'orange';
};

export type FinanceRevenuePoint = {
  readonly label: string;
  readonly amount: number;
  readonly amountLabel: string;
  readonly highlighted?: boolean;
};

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
  readonly ratingCount: string;
};

export type FinanceTenantPaymentState = {
  readonly unpaid: string;
  readonly remaining: string;
  readonly paid: string;
};

export type FinanceTenantInfoCard = {
  readonly items: readonly { icon: string; text: string }[];
};

export type FinanceTenantDocument = {
  readonly name: string;
};

export type FinanceTenantPayment = {
  readonly logo: string;
  readonly title: string;
  readonly date: string;
  readonly amount: string;
  readonly period: string;
};

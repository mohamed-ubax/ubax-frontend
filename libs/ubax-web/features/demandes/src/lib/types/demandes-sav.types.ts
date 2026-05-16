export type SavPriorityTone = 'urgent' | 'normal';
export type SavStatusTone = 'open' | 'progress' | 'success';
export type SavTicketStatusFilter = 'all' | SavStatusTone;
export type SavTicketPriorityFilter = 'all' | SavPriorityTone;

export type SavSummaryMetric = {
  readonly label: string;
  readonly value: number;
  readonly accent: string;
  readonly background: string;
  readonly icon: string;
};

export type SavIssueCard = {
  readonly id: string;
  readonly title: string;
  readonly client: string;
  readonly location: string;
  readonly phone: string;
  readonly image: string;
  readonly createdAt: Date;
};

export type SavSelectOption<TValue> = {
  readonly label: string;
  readonly value: TValue;
};

export type SavTicketFilterState = {
  readonly status: SavTicketStatusFilter;
  readonly priority: SavTicketPriorityFilter;
  readonly issue: string;
  readonly createdAt: Date | null;
};

export type SavTicketRow = {
  readonly id: string;
  readonly client: string;
  readonly avatar: string;
  readonly property: string;
  readonly issue: string;
  readonly issueKey: string;
  readonly priority: string;
  readonly priorityTone: SavPriorityTone;
  readonly createdAt: string;
  readonly createdAtDate: Date;
  readonly status: string;
  readonly statusTone: SavStatusTone;
};

export type SavNotificationItem = {
  readonly id: string;
  readonly title: string;
  readonly message: string;
  readonly time: string;
  readonly createdAt: Date;
};

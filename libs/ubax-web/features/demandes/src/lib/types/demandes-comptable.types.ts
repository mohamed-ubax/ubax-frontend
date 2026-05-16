export type ComptableToolbarField = {
  readonly label: string;
  readonly icon: string;
  readonly kind: 'search' | 'date' | 'export';
};

export type ComptableSummaryMetric = {
  readonly label: string;
  readonly value: number;
  readonly accent: string;
  readonly icon: string;
};

export type ComptableCalendarDay = {
  readonly label: string;
  readonly isActive?: boolean;
  readonly isMuted?: boolean;
};

export type ComptableRequestRow = {
  readonly ref: string;
  readonly client: string;
  readonly image: string;
  readonly property: string;
  readonly requestType: string;
  readonly amount: string;
  readonly status: string;
  readonly date: string;
};

export type ComptableNotificationItem = {
  readonly title: string;
  readonly message: string;
  readonly time: string;
};

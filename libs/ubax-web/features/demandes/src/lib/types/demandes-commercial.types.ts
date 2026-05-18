import type { CommercialRequestDetail } from './demandes.types';

export type SummaryMetric = {
  readonly label: string;
  readonly value: number;
  readonly accent: string;
  readonly iconBackground: string;
  readonly icon: string;
};

export type CalendarDay = {
  readonly label: string;
  readonly isActive?: boolean;
  readonly isMuted?: boolean;
};

export type CommercialRequestRow = {
  readonly id: string;
  readonly client: string;
  readonly property: string;
  readonly requestType: string;
  readonly summary: string;
  readonly date: string;
  readonly detail: CommercialRequestDetail;
};

export type CommercialVisitCard = {
  readonly id: string;
  readonly client: string;
  readonly phone: string;
  readonly location: string;
  readonly schedule: string;
  readonly avatar: string;
};

export type CommercialNotificationItem = {
  readonly id: string;
  readonly title: string;
  readonly message: string;
  readonly time: string;
};

import type { CountryDialCode } from '@ubax-workspace/shared-data-access';

export type DashboardSavStatusTone = 'open' | 'progress' | 'success';
export type DashboardSavPriorityTone = 'urgent' | 'normal';
export type DashboardSavNotificationTone = 'alert' | 'ticket' | 'success' | 'water';
export type DashboardSavTicketStatusFilter = 'all' | DashboardSavStatusTone;
export type DashboardSavTicketPriorityFilter = 'all' | DashboardSavPriorityTone;
export type DashboardSavInterventionPeriod = 'current-month' | 'quarter' | 'year';
export type DashboardSavStarTone = 'full' | 'half';
export type DashboardSavTechMutationKind = 'create' | 'update';

export type DashboardSavSelectOption<TValue> = {
  readonly label: string;
  readonly value: TValue;
};

export type DashboardSavTicketFilterState = {
  readonly status: DashboardSavTicketStatusFilter;
  readonly priority: DashboardSavTicketPriorityFilter;
  readonly issue: string;
  readonly createdAt: Date | null;
};

export type DashboardSavTicket = {
  readonly id: string;
  readonly client: string;
  readonly avatar: string;
  readonly property: string;
  readonly issue: string;
  readonly issueKey: string;
  readonly priority: string;
  readonly priorityTone: DashboardSavPriorityTone;
  readonly createdAtLabel: string;
  readonly createdAtDate: Date;
  readonly status: string;
  readonly statusTone: DashboardSavStatusTone;
};

export type DashboardSavSummaryMetric = {
  readonly label: string;
  readonly value: number;
  readonly background: string;
  readonly accent: string;
  readonly orbSrc: string;
  readonly iconSrc: string;
};

export type DashboardSavNotificationItem = {
  readonly id: string;
  readonly title: string;
  readonly property: string;
  readonly ticketId: string;
  readonly time: string;
  readonly createdAt: Date;
  readonly tone: DashboardSavNotificationTone;
  readonly iconBackground: string;
  readonly iconSrc: string;
  readonly accent: string;
};

export type DashboardSavInterventionSnapshot = {
  readonly pending: number;
  readonly progress: number;
  readonly completed: number;
};

export type DashboardSavTechnician = {
  readonly id: string;
  readonly name: string;
  readonly initials: string;
  readonly specialty: string;
  readonly professionCode?: string;
  readonly rating: number;
  readonly tickets: number;
  readonly phone: string;
  readonly email?: string;
  readonly address?: string;
  readonly available?: boolean;
  readonly createdAt?: string;
  readonly color: string;
  readonly image: string;
};

export type DashboardSavTechIntervention = {
  readonly id: string;
  readonly client: string;
  readonly avatar: string;
  readonly property: string;
  readonly city: string;
  readonly issue: string;
  readonly status: string;
  readonly date: string;
};

export type DashboardSavTechnicianDetail = {
  readonly joinedOn: string;
  readonly contractStatus: string;
  readonly employeeCode: string;
  readonly resolvedTickets: string;
  readonly totalPaid: string;
  readonly history: readonly DashboardSavTechIntervention[];
};

export type DashboardSavSelectedTechnicianDetail = DashboardSavTechnician &
  DashboardSavTechnicianDetail & {
    readonly profileImage: string;
  };

export type DashboardSavCountryCodeOption = CountryDialCode & {
  readonly sampleNational: string;
  readonly sampleE164: string;
};

export type DashboardSavScrollLockState = {
  readonly htmlOverflow: string;
  readonly bodyOverflow: string;
  readonly bodyTouchAction: string;
  readonly bodyPosition: string;
  readonly bodyTop: string;
  readonly bodyWidth: string;
  readonly bodyHadOverlayClass: boolean;
  readonly scrollY: number;
};

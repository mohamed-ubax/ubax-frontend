import type { TicketStatus } from '@ubax-workspace/ubax-web-data-access';

export type AllowedNextStatus =
  | 'IN_ANALYSIS'
  | 'TECHNICIAN_SENT'
  | 'RESOLVED'
  | 'CLOSED'
  | 'CANCELLED';

export type DrawerMode = 'intervention' | null;

export type SelectOption = {
  label: string;
  value: string;
};

export type { TicketStatus };

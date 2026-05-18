import type {
  TicketStatus,
} from '@ubax-workspace/ubax-web-data-access';
import type { AllowedNextStatus } from '../types/ticket-detail-page.types';

export const ALLOWED_TRANSITIONS: Partial<Record<TicketStatus, AllowedNextStatus[]>> =
  {
    OPEN: ['IN_ANALYSIS'],
    IN_ANALYSIS: ['TECHNICIAN_SENT', 'RESOLVED'],
    TECHNICIAN_SENT: ['RESOLVED'],
    RESOLVED: ['CLOSED'],
  };

export const STATUS_FLOW: TicketStatus[] = [
  'OPEN',
  'IN_ANALYSIS',
  'TECHNICIAN_SENT',
  'RESOLVED',
  'CLOSED',
];

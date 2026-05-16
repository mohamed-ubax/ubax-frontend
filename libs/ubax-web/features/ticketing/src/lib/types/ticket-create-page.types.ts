import type {
  TicketCategory,
  TicketPriority,
} from '@ubax-workspace/ubax-web-data-access';

export type PriorityOption = {
  value: TicketPriority;
  label: string;
  color: string;
  bg: string;
  icon: string;
};

export type CategoryOption = {
  value: TicketCategory;
  label: string;
  icon: string;
};

export type CategoryIconRule = {
  icon: string;
  keywords: readonly string[];
};

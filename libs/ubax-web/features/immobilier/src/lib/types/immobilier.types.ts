import type { ListMine1$Params } from '@ubax-workspace/shared-api-types';

export type BienViewMode = 'grid' | 'list';
export type FilterDropdownKey = 'type' | 'category' | 'status';

export type BienSummaryCard = {
  readonly label: string;
  readonly value: string;
  readonly trend?: string;
  readonly orbKey: string;
  readonly iconKey: string;
  readonly iconAlt: string;
};

export type FilterOption = {
  readonly label: string;
  readonly value: string;
  readonly tone: 'neutral' | 'accent' | 'success' | 'warning';
};

export type PropertyMineStatus = NonNullable<ListMine1$Params['status']>;

export type GridBienCard = {
  readonly id: string;
  readonly title: string;
  readonly location: string;
  readonly tenant: string;
  readonly tenantRole: string;
  readonly price: string;
  readonly image: string;
  readonly avatar: string | null;
  readonly type: string;
  readonly category: string;
  readonly statusRaw: PropertyMineStatus;
  readonly status: string;
  readonly boosted: boolean;
  readonly rejectionReason: string | null;
};

export type ListBienCard = GridBienCard;

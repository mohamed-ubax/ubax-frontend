import type { EspaceStatus } from '@ubax-workspace/ubax-web-data-access';

export type RoomViewMode = 'grid' | 'list';
export type FilterDropdownKey = 'type' | 'status';

export type FilterOption = {
  readonly label: string;
  readonly value: string;
  readonly tone: 'neutral' | 'accent' | 'success' | 'warning';
};

export type EspaceCard = {
  readonly id: string;
  readonly title: string;
  readonly image: string;
  readonly city: string;
  readonly typeLabel: string;
  readonly typeRaw: string;
  readonly statusRaw: EspaceStatus;
  readonly statusLabel: string;
  readonly price: string;
  readonly boosted: boolean;
  readonly rejectionReason: string | null;
  readonly createdAt: string | null;
  readonly canEdit: boolean;
  readonly canSubmit: boolean;
  readonly canArchive: boolean;
};

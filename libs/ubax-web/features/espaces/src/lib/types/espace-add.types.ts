import type { EspaceStatus } from '@ubax-workspace/ubax-web-data-access';

export type PropertyTypeOption = {
  readonly value: string;
  readonly label: string;
  readonly icon: string;
  readonly description: string;
};

export type SelectOption = {
  readonly value: string;
  readonly label: string;
};

export type UploadTimelineStep = {
  key: 'presigning' | 'uploading' | 'registering';
  label: string;
  description: string;
  status: 'done' | 'active' | 'pending';
};

export type EditFinalAction = 'save' | 'submit' | 'finish';

export type EquipmentItem = {
  readonly id: string;
  readonly label: string;
  readonly icon: string;
  readonly code: string;
};

export interface EspaceStep1 {
  title: string;
  propertyType: string;
  transactionType: string;
  condition: string;
}

export interface EspaceStep2 {
  rooms: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  balconies: number | null;
  surfaceTotal: number | null;
  surfaceLiving: number | null;
  floor: string;
  totalFloors: number | null;
  bedType: string;
  maxOccupancy: number | null;
}

export interface EspaceStep3 {
  city: string;
  district: string;
  address: string;
  street: string;
  latitude: number | null;
  longitude: number | null;
}

export interface EspaceStep4 {
  price: number;
  description: string;
  mealPlan: string;
  paymentFrequency: string;
  amenities: string[];
}

export type TimeoutHandle = ReturnType<typeof setTimeout>;

// Re-export for use in constants/component without re-importing ubax-web-data-access there
export type { EspaceStatus };

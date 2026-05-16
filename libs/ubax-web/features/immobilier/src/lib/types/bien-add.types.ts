export type AmenityOption = { code: string; label: string; icon: string };

export type DocTypeOption = { value: string; label: string };

export type UploadTimelineStep = {
  key: 'presigning' | 'uploading' | 'registering';
  label: string;
  description: string;
  status: 'done' | 'active' | 'pending';
};

export interface BienStep1 {
  title: string;
  propertyType: string;
  transactionType: string;
  condition: string;
  yearBuilt: number | null;
  /** Optional – falls back to the current user id when not provided. */
  ownerId: string;
}

export interface BienStep2 {
  rooms: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  balconies: number | null;
  surfaceTotal: number | null;
  surfaceLiving: number | null;
  floor: number | null;
  totalFloors: number | null;
}

export interface BienStep3 {
  city: string;
  district: string;
  street: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
}

export interface BienStep4 {
  price: number;
  description: string;
  /** Codes des commodités standard sélectionnées (ex: 'AC', 'PARKING'). */
  amenities: string[];
}

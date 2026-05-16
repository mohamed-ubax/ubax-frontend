import type { FormControl } from '@angular/forms';

export type SelectOption = {
  readonly value: string;
  readonly label: string;
};

export type EspaceStep1Form = {
  title: FormControl<string>;
  propertyType: FormControl<string>;
  condition: FormControl<string>;
};

export type EspaceStep2Form = {
  bedrooms: FormControl<number | null>;
  bathrooms: FormControl<number | null>;
  maxOccupancy: FormControl<number | null>;
  bedType: FormControl<string>;
  surfaceTotal: FormControl<number | null>;
};

export type EspaceStep3Form = {
  city: FormControl<string>;
  district: FormControl<string>;
  address: FormControl<string>;
};

export type EspaceStep4Form = {
  price: FormControl<number>;
  mealPlan: FormControl<string>;
  paymentFrequency: FormControl<string>;
  description: FormControl<string>;
  amenities: FormControl<string[]>;
};

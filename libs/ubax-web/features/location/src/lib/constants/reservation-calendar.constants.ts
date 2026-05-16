import type { PropertyFilterOption } from '../types/reservation-calendar.types';

export const PROPERTY_FILTER_ORDER = ['Résidence', 'Villa', 'Appartement'] as const;

export const PROPERTY_FILTER_TONES: Record<string, PropertyFilterOption['tone']> = {
  Résidence: 'green',
  Appartement: 'orange',
  Villa: 'blue',
};

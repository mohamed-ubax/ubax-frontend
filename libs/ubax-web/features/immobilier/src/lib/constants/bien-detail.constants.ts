export const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Brouillon',
  PENDING: 'En attente',
  PUBLISHED: 'Publie',
  RESERVED: 'Reserve',
  SOLD: 'Vendu',
  ARCHIVED: 'Archive',
  REJECTED: 'Rejete',
};

export const PROPERTY_TYPE_LABELS: Record<string, string> = {
  APARTMENT: 'Appartement',
  VILLA: 'Villa',
  HOUSE: 'Maison',
  LAND: 'Terrain',
  OFFICE: 'Bureau',
  HOTEL_ROOM: 'Chambre hotel',
};

export const TRANSACTION_TYPE_LABELS: Record<string, string> = {
  SALE: 'Vente',
  RENT: 'Location',
  RENT_FURNISHED: 'Location meublee',
  SHORT_STAY: 'Court sejour',
};

export const CONDITION_LABELS: Record<string, string> = {
  NEW: 'Neuf',
  GOOD: 'Bon etat',
  RENOVATE: 'A renover',
};

export const MIN_GALLERY_SLOTS = 4;

export function readAmenityPayloadLabel(item: {
  readonly code?: string;
  readonly customDescription?: string;
  readonly customValue?: string;
  readonly description?: string;
  readonly value?: string;
}): string {
  return (
    item.description?.trim() ||
    item.value?.trim() ||
    item.customDescription?.trim() ||
    item.customValue?.trim() ||
    item.code?.trim() ||
    ''
  );
}

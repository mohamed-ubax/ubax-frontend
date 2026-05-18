import { resolvePropertyCardImage } from '@ubax-workspace/ubax-web-data-access';
import type { LaCodeListDto, PropertyResponse } from '@ubax-workspace/shared-api-types';
import type { FilterOption, GridBienCard, PropertyMineStatus } from '../types/immobilier.types';

export const DEFAULT_TYPE_OPTIONS: readonly FilterOption[] = [
  { label: 'Type de bien', value: 'all', tone: 'neutral' },
  { label: 'Appartement', value: 'APARTMENT', tone: 'accent' },
  { label: 'Villa', value: 'VILLA', tone: 'accent' },
  { label: 'Bureau', value: 'OFFICE', tone: 'accent' },
];

export const DEFAULT_CATEGORY_OPTIONS: readonly FilterOption[] = [
  { label: 'Catégorie', value: 'all', tone: 'neutral' },
  { label: 'Location', value: 'RENT', tone: 'success' },
  { label: 'Vente', value: 'SALE', tone: 'warning' },
];

export const DEFAULT_STATUS_OPTIONS: readonly FilterOption[] = [
  { label: 'Statut', value: 'all', tone: 'neutral' },
  { label: 'Brouillon', value: 'DRAFT', tone: 'neutral' },
  { label: 'En attente', value: 'PENDING', tone: 'warning' },
  { label: 'Publié', value: 'PUBLISHED', tone: 'success' },
  { label: 'Rejeté', value: 'REJECTED', tone: 'accent' },
  { label: 'Archivé', value: 'ARCHIVED', tone: 'neutral' },
];

export const IMAGE_POOL = [
  'shared/rooms/room-photo-01.webp',
  'biens/list/grid-property-02.webp',
  'hotel-dashboard/properties/property-kevin.webp',
  'biens/list/grid-property-04.webp',
  'biens/list/grid-property-05.webp',
  'biens/list/grid-property-06.webp',
  'biens/list/list-property-02.webp',
  'biens/list/list-property-06.webp',
  'biens/list/list-property-07.webp',
] as const;

export const STATUS_LABEL_MAP: Record<PropertyMineStatus, string> = {
  DRAFT: 'Brouillon',
  PENDING: 'En attente',
  PUBLISHED: 'Publié',
  RESERVED: 'Réservé',
  SOLD: 'Vendu',
  ARCHIVED: 'Archivé',
  REJECTED: 'Rejeté',
};

export const TRANSACTION_LABEL_MAP: Record<string, string> = {
  RENT: 'Location',
  SALE: 'Vente',
  RENT_FURNISHED: 'Location meublée',
  SHORT_STAY: 'Court séjour',
};

export const TRANSACTION_TONE_MAP: Record<string, FilterOption['tone']> = {
  RENT: 'success',
  SALE: 'warning',
  RENT_FURNISHED: 'success',
  SHORT_STAY: 'accent',
};

export const STATUS_TONE_MAP: Record<string, FilterOption['tone']> = {
  DRAFT: 'neutral',
  PENDING: 'warning',
  PUBLISHED: 'success',
  RESERVED: 'success',
  SOLD: 'accent',
  ARCHIVED: 'neutral',
  REJECTED: 'accent',
};

export function capitalizeWords(value: string): string {
  return value
    .toLowerCase()
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function codeListLabel(item: LaCodeListDto): string {
  if (item.description && item.description.trim().length > 0) {
    return item.description;
  }
  if (item.value && item.value.trim().length > 0) {
    return capitalizeWords(item.value);
  }
  return '';
}

export function formatPrice(price?: number): string {
  if (typeof price !== 'number' || Number.isNaN(price)) {
    return 'N/A';
  }
  return `${new Intl.NumberFormat('fr-FR').format(price)} FCFA`;
}

export function toDisplayLocation(property: PropertyResponse): string {
  const parts = [property.city, property.district].filter(
    (part): part is string =>
      typeof part === 'string' && part.trim().length > 0,
  );
  return parts.length > 0 ? parts.join(', ') : 'Ville non renseignée';
}

export function asPropertyStatus(value: string): PropertyMineStatus | undefined {
  if (
    value === 'DRAFT' ||
    value === 'PENDING' ||
    value === 'PUBLISHED' ||
    value === 'RESERVED' ||
    value === 'SOLD' ||
    value === 'ARCHIVED' ||
    value === 'REJECTED'
  ) {
    return value;
  }
  return undefined;
}

export function toBienCard(
  property: PropertyResponse,
  index: number,
): GridBienCard {
  const status = (property.status ?? 'DRAFT') as PropertyMineStatus;
  const transactionValue = property.transactionType ?? '';
  const transactionLabel =
    TRANSACTION_LABEL_MAP[transactionValue] ||
    capitalizeWords(transactionValue || 'TRANSACTION');

  return {
    id: property.id ?? `property-${index + 1}`,
    title: property.title?.trim() || 'Bien sans titre',
    location: toDisplayLocation(property),
    tenant: property.ownerName?.trim() || 'Propriétaire non renseigné',
    tenantRole: 'Propriétaire',
    price: formatPrice(property.price),
    image: resolvePropertyCardImage(
      property,
      IMAGE_POOL[index % IMAGE_POOL.length],
    ),
    avatar: null,
    type: property.propertyType || 'N/A',
    category: transactionLabel,
    statusRaw: status,
    status: STATUS_LABEL_MAP[status] ?? status,
    boosted: Boolean(property.boosted),
    rejectionReason: property.rejectionReason?.trim() || null,
  };
}

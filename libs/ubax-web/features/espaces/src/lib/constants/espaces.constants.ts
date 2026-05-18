import {
  EspaceStatus,
  ESPACE_STATUS_LABELS,
  resolvePropertyCardImage,
} from '@ubax-workspace/ubax-web-data-access';
import type { LaCodeListDto, PropertyResponse } from '@ubax-workspace/shared-api-types';
import type { EspaceCard, FilterOption } from '../types/espaces.types';

export const PAGE_SIZE_GRID = 12;
export const PAGE_SIZE_LIST = 10;
export const DEFAULT_ESPACE_IMAGE = 'shared/rooms/room-photo-01.webp';

export const STATUS_TONE_MAP: Record<EspaceStatus, FilterOption['tone']> = {
  DRAFT: 'neutral',
  PENDING: 'warning',
  PUBLISHED: 'success',
  RESERVED: 'accent',
  SOLD: 'accent',
  ARCHIVED: 'neutral',
  REJECTED: 'accent',
};

export function formatPrice(price: number | null | undefined): string {
  if (price == null) return '—';
  return new Intl.NumberFormat('fr-FR').format(price);
}

export function readCodeListValue(item: LaCodeListDto): string {
  return item.value ?? '';
}

export function readCodeListLabel(item: LaCodeListDto): string {
  return item.description ?? item.value ?? '';
}

export function mapToEspaceCard(
  property: PropertyResponse,
  index: number,
  propertyTypeLabels: ReadonlyMap<string, string>,
): EspaceCard {
  const statusRaw = (property.status ?? 'DRAFT') as EspaceStatus;
  const typeRaw = property.propertyType ?? '';
  const typeLabel = propertyTypeLabels.get(typeRaw) ?? typeRaw;

  return {
    id: property.id ?? `espace-${index}`,
    title: property.title?.trim() || 'Espace sans titre',
    image: resolvePropertyCardImage(property, DEFAULT_ESPACE_IMAGE),
    city: property.city ?? '—',
    typeLabel,
    typeRaw,
    statusRaw,
    statusLabel: ESPACE_STATUS_LABELS[statusRaw] ?? statusRaw,
    price: formatPrice(property.price),
    boosted: Boolean(property.boosted),
    rejectionReason: property.rejectionReason?.trim() || null,
    createdAt: property.createdAt ?? null,
    canEdit: statusRaw === 'DRAFT' || statusRaw === 'REJECTED',
    canSubmit: statusRaw === 'DRAFT',
    canArchive: statusRaw === 'PUBLISHED' || statusRaw === 'DRAFT',
  };
}

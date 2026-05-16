import type { UploadTimelineStep } from '../types/bien-add.types';

export const WIZARD_STEPS = [
  { label: 'Informations' },
  { label: 'Surfaces & pièces' },
  { label: 'Localisation' },
  { label: 'Équipements & Prix' },
  { label: 'Médias' },
  { label: 'Finalisation' },
] as const;

export const DEFAULT_DOC_TYPE_LABELS: Record<string, string> = {
  TITRE_FONCIER: 'Titre foncier',
  PERMIS_CONSTRUIRE: 'Permis de construire',
  DIAGNOSTIC: 'Diagnostic',
  CONTRAT_BAIL: 'Contrat de bail',
  AUTRE: 'Autre',
};

export const ACCEPTED_MEDIA =
  'image/jpeg,image/png,image/webp,video/mp4,video/quicktime';

export const ACCEPTED_DOCS = 'application/pdf,image/jpeg,image/png,image/webp';

export const MAX_DOC_SIZE_MB = 20;

export const PROPERTY_STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Brouillon',
  PENDING: 'En attente',
  PUBLISHED: 'Publié',
  RESERVED: 'Réservé',
  SOLD: 'Vendu',
  ARCHIVED: 'Archivé',
  REJECTED: 'Rejeté',
};

export const AMENITY_ICON_BY_CODE: Record<string, string> = {
  AC: 'pi-wind',
  PARKING: 'pi-car',
  POOL: 'pi-circle',
  GENERATOR: 'pi-bolt',
  SECURITY: 'pi-shield',
  ELEVATOR: 'pi-arrow-up',
  WATER_TANK: 'pi-filter',
  GARDEN: 'pi-sun',
  FURNISHED: 'pi-home',
  PETS_ALLOWED: 'pi-heart',
  PMR: 'pi-user',
};

export function resolveTimelineStatus(
  activeIndex: number,
  stepIndex: number,
): UploadTimelineStep['status'] {
  if (activeIndex > stepIndex) {
    return 'done';
  }

  if (activeIndex === stepIndex) {
    return 'active';
  }

  return 'pending';
}

export function isEditablePropertyStatus(status: string | null | undefined): boolean {
  return status === 'DRAFT' || status === 'REJECTED';
}

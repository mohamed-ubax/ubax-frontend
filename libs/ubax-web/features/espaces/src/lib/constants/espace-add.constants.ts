import type { EspaceStatus, UploadTimelineStep } from '../types/espace-add.types';

export const WIZARD_STEPS = [
  { label: 'Identité' },
  { label: 'Capacité' },
  { label: 'Localisation' },
  { label: 'Équipements & Prix' },
  { label: 'Médias' },
  { label: 'Finalisation' },
] as const;

export const DEFAULT_DOC_TYPE_LABELS: Readonly<Record<string, string>> = {
  TITLE_DEED: 'Titre foncier',
  BUILDING_PERMIT: 'Permis de construire',
  DIAGNOSTIC: 'Diagnostic',
  CADASTRAL_PLAN: 'Plan cadastral',
  INSURANCE: 'Assurance',
  CONFORMITY_CERTIFICATE: 'Certificat de conformite',
  OTHER: 'Autre',
};

export const DEFAULT_PROPERTY_TYPE_ICON = 'space-add/icons/bed-double.svg';

export const PROPERTY_TYPE_SKELETON_ITEMS = [1, 2, 3, 4] as const;

export const PROPERTY_TYPE_SUPPORTING_TEXT: Readonly<Record<string, string>> = {
  APARTMENT: 'Logement independant',
  STUDIO: 'Format compact et autonome',
  LOFT: 'Volume ouvert et moderne',
  ROOM: 'Hebergement individuel',
  HOTEL_ROOM: 'Hebergement individuel',
  SUITE: 'Hebergement premium',
  CONFERENCE_ROOM: 'Usage evenementiel',
  VILLA: 'Hebergement privatif',
  HOUSE: 'Hebergement privatif',
  LAND: 'Espace a amenager',
};

export const FLOOR_OPTIONS = [
  'RDC',
  '1',
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9',
  '10+',
];

export const DEFAULT_AMENITY_ICON = 'space-add/icons/mode-cool.svg';

export const AMENITY_ICON_BY_CODE: Readonly<Record<string, string>> = {
  AC: 'space-add/icons/mode-cool.svg',
  WIFI: 'space-add/icons/mode-cool.svg',
  TV: 'space-add/icons/mode-cool.svg',
  POOL: 'space-add/icons/mode-cool.svg',
  PARKING: 'space-add/icons/mode-cool.svg',
  GENERATOR: 'space-add/icons/mode-cool.svg',
  SECURITY: 'space-add/icons/mode-cool.svg',
  ELEVATOR: 'space-add/icons/mode-cool.svg',
  GARDEN: 'space-add/icons/mode-cool.svg',
  FURNISHED: 'space-add/icons/mode-cool.svg',
  PETS_ALLOWED: 'space-add/icons/mode-cool.svg',
  PMR: 'space-add/icons/mode-cool.svg',
};

export const ACCEPTED_MEDIA =
  'image/jpeg,image/png,image/webp,video/mp4,video/quicktime,video/mpeg';

export const ACCEPTED_DOCS = 'application/pdf,image/jpeg,image/png,image/webp';

export const MAX_IMAGE_MB = 10;
export const MAX_VIDEO_MB = 100;
export const MAX_DOC_SIZE_MB = 20;

export function humanizePropertyTypeValue(value: string): string {
  return value
    .toLowerCase()
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function resolvePropertyTypeSupportingText(value: string): string {
  return (
    PROPERTY_TYPE_SUPPORTING_TEXT[value] ??
    `Format ${humanizePropertyTypeValue(value)}`
  );
}

export function resolveTimelineStatus(
  activeIndex: number,
  stepIndex: number,
): UploadTimelineStep['status'] {
  if (activeIndex > stepIndex) return 'done';
  if (activeIndex === stepIndex) return 'active';
  return 'pending';
}

export function isEditableEspaceStatus(
  status: EspaceStatus | null | undefined,
): boolean {
  return status === 'DRAFT' || status === 'REJECTED';
}

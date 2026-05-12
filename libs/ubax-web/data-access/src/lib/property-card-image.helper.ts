import { PropertyResponse } from '@ubax-workspace/shared-api-types';

type PropertyResponseWithCoverPhotoUrl = PropertyResponse & {
  coverPhotoUrl?: string | null;
};

function normalizeImageUrl(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmedValue = value.trim();
  return trimmedValue.length > 0 ? trimmedValue : null;
}

export function readPropertyCoverPhotoUrl(
  property: PropertyResponse,
): string | null {
  return normalizeImageUrl(
    (property as PropertyResponseWithCoverPhotoUrl).coverPhotoUrl,
  );
}

export function resolvePropertyCardImage(
  property: PropertyResponse,
  fallbackImage: string,
): string {
  return readPropertyCoverPhotoUrl(property) ?? fallbackImage;
}

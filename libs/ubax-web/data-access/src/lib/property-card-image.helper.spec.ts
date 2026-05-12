import { PropertyResponse } from '@ubax-workspace/shared-api-types';

import {
  readPropertyCoverPhotoUrl,
  resolvePropertyCardImage,
} from './property-card-image.helper';

describe('property-card-image.helper', () => {
  it('reads the cover photo url from the API payload when present', () => {
    const property = {
      id: 'property-1',
      coverPhotoUrl: ' https://cdn.ubax.test/property-cover.webp ',
    } as PropertyResponse & { coverPhotoUrl: string };

    expect(readPropertyCoverPhotoUrl(property)).toBe(
      'https://cdn.ubax.test/property-cover.webp',
    );
  });

  it('returns null when the payload has no usable cover photo url', () => {
    const property = {
      id: 'property-2',
      coverPhotoUrl: '   ',
    } as PropertyResponse & { coverPhotoUrl: string };

    expect(readPropertyCoverPhotoUrl(property)).toBeNull();
  });

  it('falls back to the provided image when the API does not expose coverPhotoUrl', () => {
    const property = { id: 'property-3' } as PropertyResponse;

    expect(resolvePropertyCardImage(property, 'fallback-image.webp')).toBe(
      'fallback-image.webp',
    );
  });
});

import '@angular/compiler';

import {
  buildAdminScopedPropertyQueryParams,
  normalizePropertyPageResponse,
} from './admin-properties.helpers';

describe('admin-properties helpers', () => {
  it('normalizes paginated property payloads from nested data envelopes', () => {
    expect(
      normalizePropertyPageResponse(
        {
          data: {
            results: [{ id: 'prop-1' }, { id: 'prop-2' }],
            totalItems: 41,
            total_pages: 3,
          },
        },
        20,
      ),
    ).toEqual({
      items: [{ id: 'prop-1' }, { id: 'prop-2' }],
      totalElements: 41,
      totalPages: 3,
    });
  });

  it('falls back to the requested page size when total-pages is absent', () => {
    expect(
      normalizePropertyPageResponse(
        {
          results: [{ id: 'prop-1' }],
          total_items: 21,
        },
        20,
      ),
    ).toEqual({
      items: [{ id: 'prop-1' }],
      totalElements: 21,
      totalPages: 2,
    });
  });

  it('builds the scoped admin query params and omits empty filters', () => {
    expect(
      buildAdminScopedPropertyQueryParams({
        page: 2,
        size: 250,
        status: 'PENDING',
        agencyId: 'agency-1',
      }).toString(),
    ).toBe(
      'page=2&size=200&sort=createdAt,desc&status=PENDING&agencyId=agency-1',
    );

    expect(
      buildAdminScopedPropertyQueryParams({ hotelId: 'hotel-1' }).toString(),
    ).toBe('page=0&size=20&sort=createdAt,desc&hotelId=hotel-1');
  });
});

import {
  getPrimaryAdminRole,
  normalizeAdminCollection,
  normalizeAdminSubRoles,
  normalizeMemberCollection,
  readCollection,
} from './admin-users.helpers';

describe('admin-users.service helpers', () => {
  it('reads collections from nested response envelopes', () => {
    expect(
      readCollection({
        status: 'SUCCESS',
        data: {
          content: [{ id: 'a' }, { id: 'b' }],
        },
      }),
    ).toEqual([{ id: 'a' }, { id: 'b' }]);
  });

  it('normalizes admin collections from array and wrapped payloads', () => {
    expect(
      normalizeAdminCollection({
        data: [
          {
            userId: 'admin-1',
            email: 'admin1@ubax.com',
            roles: ['ADMIN'],
          },
        ],
      }),
    ).toEqual([
      {
        userId: 'admin-1',
        email: 'admin1@ubax.com',
        roles: ['ADMIN'],
      },
    ]);

    expect(
      normalizeAdminCollection([
        {
          userId: 'admin-2',
          email: 'admin2@ubax.com',
          roles: ['SUPER_ADMIN'],
        },
      ]),
    ).toEqual([
      {
        userId: 'admin-2',
        email: 'admin2@ubax.com',
        roles: ['SUPER_ADMIN'],
      },
    ]);
  });

  it('derives the primary admin role from the roles list', () => {
    expect(getPrimaryAdminRole({ roles: ['SUPER_ADMIN'] } as never)).toBe(
      'SUPER_ADMIN',
    );
    expect(getPrimaryAdminRole({ roles: ['ADMIN'] } as never)).toBe('ADMIN');
    expect(getPrimaryAdminRole({ roles: ['CLIENT'] } as never)).toBeNull();
  });

  it('normalizes sub-role payloads from arrays of objects and strings', () => {
    expect(
      normalizeAdminSubRoles({
        data: [
          {
            id: 'sub-1',
            userId: 'admin-1',
            role: 'FINANCE',
            scope: 'UBAX_INTERNAL',
            createdAt: '2026-04-30T10:00:00',
          },
          'COMMERCIAL',
        ],
      }),
    ).toEqual([
      {
        id: 'sub-1',
        userId: 'admin-1',
        role: 'FINANCE',
        scope: 'UBAX_INTERNAL',
        createdAt: '2026-04-30T10:00:00',
      },
      {
        id: 'COMMERCIAL',
        userId: '',
        role: 'COMMERCIAL',
        scope: 'UBAX_INTERNAL',
        createdAt: '',
      },
    ]);
  });

  it('normalizes member collections from the agency and hotel views', () => {
    expect(
      normalizeMemberCollection({
        members: [
          {
            userId: 'member-1',
            firstName: 'Aicha',
            lastName: 'Koné',
          },
        ],
      }),
    ).toEqual([
      {
        userId: 'member-1',
        firstName: 'Aicha',
        lastName: 'Koné',
      },
    ]);
  });
});

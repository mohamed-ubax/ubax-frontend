import {
  extractCodeListTypes,
  normalizeCodeListCollection,
  normalizeCodeListItem,
  readCodeListCollection,
} from './admin-code-lists.helpers';

describe('admin-code-lists helpers', () => {
  it('reads code-list collections from wrapped responses', () => {
    expect(
      readCodeListCollection({
        status: 'SUCCESS',
        data: {
          content: [{ id: 'cl-1' }, { id: 'cl-2' }],
        },
      }),
    ).toEqual([{ id: 'cl-1' }, { id: 'cl-2' }]);
  });

  it('normalizes items from direct and nested payloads', () => {
    expect(
      normalizeCodeListItem({
        data: {
          id: 'cl-1',
          type: 'PROPERTY_TYPE',
          value: 'VILLA',
          description: 'Villa',
          isSystemAssign: true,
        },
      }),
    ).toEqual({
      id: 'cl-1',
      type: 'PROPERTY_TYPE',
      value: 'VILLA',
      description: 'Villa',
      systemAssign: true,
    });
  });

  it('sorts normalized collections by type then value', () => {
    expect(
      normalizeCodeListCollection([
        {
          id: 'cl-2',
          type: 'CITY',
          value: 'YAMOUSSOUKRO',
          description: 'Yamoussoukro',
        },
        {
          id: 'cl-1',
          type: 'CITY',
          value: 'ABIDJAN',
          description: 'Abidjan',
        },
      ]),
    ).toEqual([
      {
        id: 'cl-1',
        type: 'CITY',
        value: 'ABIDJAN',
        description: 'Abidjan',
        systemAssign: false,
      },
      {
        id: 'cl-2',
        type: 'CITY',
        value: 'YAMOUSSOUKRO',
        description: 'Yamoussoukro',
        systemAssign: false,
      },
    ]);
  });

  it('extracts a distinct sorted list of types', () => {
    expect(
      extractCodeListTypes([
        { type: 'ROLE_UBAX_INTERNAL' },
        { type: 'CITY' },
        { type: 'CITY' },
        { type: 'PROPERTY_TYPE' },
      ]),
    ).toEqual(['CITY', 'PROPERTY_TYPE', 'ROLE_UBAX_INTERNAL']);
  });
});

import { mapClientList } from './client-list.mapper';

describe('mapClientList', () => {
  it('extracts clients from data.results payloads', () => {
    const clients = mapClientList({
      status: 'SUCCESS',
      data: {
        results: [
          {
            id: 'client-1',
            firstName: 'Selle',
            lastName: 'Diop',
            email: 'selle.diop@example.com',
          },
        ],
      },
    });

    expect(clients).toEqual([
      expect.objectContaining({
        id: 'client-1',
        firstName: 'Selle',
        lastName: 'Diop',
      }),
    ]);
  });

  it('keeps compatibility with data.content payloads', () => {
    const clients = mapClientList({
      data: {
        content: [
          {
            id: 'client-2',
            firstName: 'Awa',
            lastName: 'Kone',
          },
        ],
      },
    });

    expect(clients).toEqual([
      expect.objectContaining({
        id: 'client-2',
        firstName: 'Awa',
        lastName: 'Kone',
      }),
    ]);
  });
});

import '@angular/compiler';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Injector, ProviderToken, Type } from '@angular/core';
import { of } from 'rxjs';
import {
  ApiConfiguration,
  type StrictHttpResponse,
} from '@ubax-workspace/shared-api-types';
import * as apiTypes from '@ubax-workspace/shared-api-types';
import { Mandate, MandatesStore } from './mandates.store';

vi.mock('@ubax-workspace/shared-api-types', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@ubax-workspace/shared-api-types')>();
  return {
    ...actual,
    list4: vi.fn(),
    getById7: vi.fn(),
    create6: vi.fn(),
    submit1: vi.fn(),
    terminate: vi.fn(),
    cancel: vi.fn(),
  };
});

function toStrictResponse<T>(body: T): StrictHttpResponse<T> {
  return new HttpResponse({ body }) as StrictHttpResponse<T>;
}

type MandatesStoreContract = {
  entities(): Mandate[];
  selectedItem(): Mandate | null;
  load(params?: unknown): void;
  createMandate(body: unknown): void;
  submitMandate(id: string): void;
  terminateMandate(params: {
    id: string;
    body: { terminationReason: string };
  }): void;
  lastCreatedId(): string | null;
  lastSubmittedId(): string | null;
  lastTerminatedId(): string | null;
  createError(): string | null;
};

describe('MandatesStore', () => {
  const storeToken =
    MandatesStore as unknown as ProviderToken<MandatesStoreContract>;
  const storeClass = MandatesStore as unknown as Type<unknown>;

  let store: MandatesStoreContract;

  beforeEach(() => {
    vi.mocked(apiTypes.list4).mockReset();
    vi.mocked(apiTypes.getById7).mockReset();
    vi.mocked(apiTypes.create6).mockReset();
    vi.mocked(apiTypes.submit1).mockReset();
    vi.mocked(apiTypes.terminate).mockReset();
    vi.mocked(apiTypes.cancel).mockReset();

    vi.mocked(apiTypes.list4).mockReturnValue(
      of(
        toStrictResponse({
          status: 'SUCCESS',
          statusCode: 200,
          data: {
            results: [
              {
                id: 'mandate-1',
                referenceNumber: 'MAN-2026-A1B2C3',
                status: 'DRAFT',
                agencyName: 'Ubax Cocody',
                ownerFullName: 'Kouamé Yao',
                ownerPhone: '+2250712345678',
                startDate: '2026-06-01',
              },
            ],
            totalElements: 1,
            totalPages: 1,
            size: 20,
            number: 0,
          },
        }),
      ),
    );

    vi.mocked(apiTypes.getById7).mockReturnValue(
      of(
        toStrictResponse({
          status: 'SUCCESS',
          statusCode: 200,
          data: {
            id: 'mandate-1',
            referenceNumber: 'MAN-2026-A1B2C3',
            status: 'DRAFT',
          },
        }),
      ),
    );

    vi.mocked(apiTypes.create6).mockReturnValue(
      of(
        toStrictResponse({
          status: 'SUCCESS',
          statusCode: 201,
          data: {
            id: 'mandate-2',
            referenceNumber: 'MAN-2026-D4E5F6',
            status: 'DRAFT',
            ownerFullName: 'Awa Nguessan',
          },
        }),
      ),
    );

    vi.mocked(apiTypes.submit1).mockReturnValue(
      of(
        toStrictResponse({
          status: 'SUCCESS',
          statusCode: 200,
          data: {
            id: 'mandate-1',
            status: 'PENDING_SIGNATURE',
          },
        }),
      ),
    );

    vi.mocked(apiTypes.terminate).mockReturnValue(
      of(
        toStrictResponse({
          status: 'SUCCESS',
          statusCode: 200,
          data: {
            id: 'mandate-1',
            status: 'TERMINATED',
          },
        }),
      ),
    );

    const injector = Injector.create({
      providers: [
        { provide: HttpClient, useValue: {} },
        {
          provide: ApiConfiguration,
          useValue: { rootUrl: 'https://test.local' },
        },
        { provide: storeToken, useClass: storeClass },
      ],
    });

    store = injector.get(storeToken);
  });

  it('charge les mandats depuis data.results', () => {
    store.load({ pageable: { page: 0, size: 20, sort: ['createdAt,desc'] } });

    expect(store.entities()).toHaveLength(1);
    expect(store.entities()[0]).toMatchObject({
      id: 'mandate-1',
      referenceNumber: 'MAN-2026-A1B2C3',
      status: 'DRAFT',
    });
  });

  it('crée un mandat et expose son identifiant', () => {
    store.createMandate({
      ownerId: 'owner-1',
      startDate: '2026-06-01',
    });

    expect(store.lastCreatedId()).toBe('mandate-2');
    expect(store.createError()).toBeNull();
    expect(store.entities().some((mandate) => mandate.id === 'mandate-2')).toBe(
      true,
    );
  });

  it('soumet puis résilie un mandat en mettant à jour son statut local', () => {
    store.load({ pageable: { page: 0, size: 20, sort: ['createdAt,desc'] } });
    store.submitMandate('mandate-1');

    expect(store.lastSubmittedId()).toBe('mandate-1');
    expect(store.entities()[0]?.status).toBe('PENDING_SIGNATURE');

    store.terminateMandate({
      id: 'mandate-1',
      body: { terminationReason: 'Fin de collaboration' },
    });

    expect(store.lastTerminatedId()).toBe('mandate-1');
    expect(store.entities()[0]?.status).toBe('TERMINATED');
    expect(store.entities()[0]?.terminationReason).toBe('Fin de collaboration');
  });
});

import '@angular/compiler';
import {
  HttpClient,
  HttpErrorResponse,
  HttpResponse,
} from '@angular/common/http';
import { Injector, ProviderToken, Type } from '@angular/core';
import { of, throwError } from 'rxjs';
import {
  ApiConfiguration,
  type StrictHttpResponse,
} from '@ubax-workspace/shared-api-types';
import * as apiTypes from '@ubax-workspace/shared-api-types';
import {
  BailleurApplication,
  BailleurApplicationsStore,
} from './bailleur-applications.store';

vi.mock('@ubax-workspace/shared-api-types', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@ubax-workspace/shared-api-types')>();
  return {
    ...actual,
    listByAgency: vi.fn(),
    getById9: vi.fn(),
    processDecision: vi.fn(),
  };
});

function toStrictResponse<T>(body: T): StrictHttpResponse<T> {
  return new HttpResponse({ body }) as StrictHttpResponse<T>;
}

type BailleurApplicationsStoreContract = {
  entities(): BailleurApplication[];
  selectedItem(): BailleurApplication | null;
  load(params?: unknown): void;
  loadOne(id: string): void;
  decide(params: {
    id: string;
    body: { decision: 'APPROVE' | 'REJECT'; comment?: string };
  }): void;
  lastDecidedId(): string | null;
  decisionError(): string | null;
};

describe('BailleurApplicationsStore', () => {
  const storeToken =
    BailleurApplicationsStore as unknown as ProviderToken<BailleurApplicationsStoreContract>;
  const storeClass = BailleurApplicationsStore as unknown as Type<unknown>;

  let store: BailleurApplicationsStoreContract;

  beforeEach(() => {
    vi.mocked(apiTypes.listByAgency).mockReset();
    vi.mocked(apiTypes.getById9).mockReset();
    vi.mocked(apiTypes.processDecision).mockReset();

    vi.mocked(apiTypes.listByAgency).mockReturnValue(
      of(
        toStrictResponse({
          status: 'SUCCESS',
          statusCode: 200,
          message: 'Applications retrieved',
          data: {
            results: [
              {
                id: 'application-1',
                agencyName: 'Ubax Cocody',
                firstName: 'Awa',
                lastName: 'Kouassi',
                email: 'awa@example.com',
                phone: '+2250700000001',
                status: 'PENDING',
                createdAt: '2026-04-30T10:00:00',
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

    vi.mocked(apiTypes.getById9).mockReturnValue(
      of(
        toStrictResponse({
          status: 'SUCCESS',
          statusCode: 200,
          data: {
            id: 'application-1',
            agencyName: 'Ubax Cocody',
            firstName: 'Awa',
            lastName: 'Kouassi',
            email: 'awa@example.com',
            phone: '+2250700000001',
            status: 'PENDING',
          },
        }),
      ),
    );

    vi.mocked(apiTypes.processDecision).mockReturnValue(
      of(
        toStrictResponse({
          status: 'SUCCESS',
          statusCode: 200,
          data: {
            id: 'application-1',
            status: 'APPROVED',
            reviewedByName: 'Jean Dupont',
            reviewedAt: '2026-05-02T08:30:00',
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

  it('charge les demandes bailleur depuis data.results', () => {
    store.load({ page: 0, size: 20, sort: ['createdAt,desc'] });

    expect(store.entities()).toHaveLength(1);
    expect(store.entities()[0]).toMatchObject({
      id: 'application-1',
      firstName: 'Awa',
      lastName: 'Kouassi',
      status: 'PENDING',
    });
  });

  it('charge un détail puis applique une décision en local', () => {
    store.loadOne('application-1');
    store.decide({
      id: 'application-1',
      body: { decision: 'APPROVE' },
    });

    expect(store.selectedItem()?.status).toBe('APPROVED');
    expect(store.lastDecidedId()).toBe('application-1');
    expect(store.decisionError()).toBeNull();
  });

  it('stocke une erreur de décision quand le backend refuse la transition', () => {
    vi.mocked(apiTypes.processDecision).mockReturnValueOnce(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 400,
            statusText: 'Bad Request',
            url: '/v1/bailleur/agency/applications/application-1/decision',
          }),
      ),
    );

    store.decide({
      id: 'application-1',
      body: { decision: 'REJECT', comment: 'Dossier incomplet' },
    });

    expect(store.lastDecidedId()).toBeNull();
    expect(store.decisionError()).not.toBeNull();
  });
});

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
  type LaCodeListDto,
  type StrictHttpResponse,
} from '@ubax-workspace/shared-api-types';
import * as apiTypes from '@ubax-workspace/shared-api-types';
import { TicketingStore } from './ticketing.store';

vi.mock('@ubax-workspace/shared-api-types', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@ubax-workspace/shared-api-types')>();
  return {
    ...actual,
    findAllByType: vi.fn(),
  };
});

function toStrictResponse<T>(body: T): StrictHttpResponse<T> {
  return new HttpResponse({ body }) as StrictHttpResponse<T>;
}

type TicketingStoreContract = {
  categoryCodeList(): LaCodeListDto[];
  categoryCodeListLoading(): boolean;
  categoryCodeListError(): string | null;
  ticketCategoryOptions(): readonly {
    value: string;
    label: string;
    description: string;
  }[];
  priorityCodeList(): LaCodeListDto[];
  priorityCodeListLoading(): boolean;
  priorityCodeListError(): string | null;
  ticketPriorityOptions(): readonly {
    value: string;
    label: string;
    description: string;
  }[];
  loadTicketCategories(): void;
  loadTicketPriorities(): void;
};

describe('TicketingStore', () => {
  const storeToken =
    TicketingStore as unknown as ProviderToken<TicketingStoreContract>;
  const storeClass = TicketingStore as unknown as Type<unknown>;

  let store: TicketingStoreContract;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(apiTypes.findAllByType).mockImplementation(
      (_http, _rootUrl, params) =>
        of(
          toStrictResponse({
            data:
              params.type === 'TICKET_PRIORITY'
                ? [
                    { value: 'LOW', description: 'Faible' },
                    { value: 'NORMAL', description: 'Normale' },
                    { value: 'HIGH', description: 'Haute' },
                    { value: 'URGENT', description: 'Urgente' },
                  ]
                : [
                    {
                      value: 'PLOMBIER',
                      description: 'Plomberie et sanitaire',
                    },
                    {
                      value: 'ELECTRICIEN',
                      description: 'Electricite generale et domotique',
                    },
                    {
                      value: 'SERRURIER',
                      description: "Serrurerie, blindage et controle d'acces",
                    },
                  ],
          }),
        ) as any,
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

  it('charge les categories SAV depuis le codelist TICKET_CATEGORY', () => {
    store.loadTicketCategories();

    expect(apiTypes.findAllByType).toHaveBeenCalledWith(
      {},
      'https://test.local',
      { type: 'TICKET_CATEGORY' },
    );
    expect(store.categoryCodeListLoading()).toBe(false);
    expect(store.categoryCodeListError()).toBeNull();
    expect(store.ticketCategoryOptions()).toEqual([
      {
        value: 'PLOMBIER',
        label: 'Plomberie et sanitaire',
        description: 'Plomberie et sanitaire',
      },
      {
        value: 'ELECTRICIEN',
        label: 'Electricite generale et domotique',
        description: 'Electricite generale et domotique',
      },
      {
        value: 'SERRURIER',
        label: "Serrurerie, blindage et controle d'acces",
        description: "Serrurerie, blindage et controle d'acces",
      },
    ]);
  });

  it('charge les priorites SAV depuis le codelist TICKET_PRIORITY', () => {
    store.loadTicketPriorities();

    expect(apiTypes.findAllByType).toHaveBeenCalledWith(
      {},
      'https://test.local',
      { type: 'TICKET_PRIORITY' },
    );
    expect(store.priorityCodeListLoading()).toBe(false);
    expect(store.priorityCodeListError()).toBeNull();
    expect(store.ticketPriorityOptions()).toEqual([
      {
        value: 'LOW',
        label: 'Faible',
        description: 'Faible',
      },
      {
        value: 'NORMAL',
        label: 'Normale',
        description: 'Normale',
      },
      {
        value: 'HIGH',
        label: 'Haute',
        description: 'Haute',
      },
      {
        value: 'URGENT',
        label: 'Urgente',
        description: 'Urgente',
      },
    ]);
  });

  it('capture une erreur de chargement sans exposer de categories mockees', () => {
    vi.mocked(apiTypes.findAllByType).mockReturnValueOnce(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 503,
            url: '/v1/code-lists/TICKET_CATEGORY',
          }),
      ) as any,
    );

    store.loadTicketCategories();

    expect(store.categoryCodeListLoading()).toBe(false);
    expect(store.ticketCategoryOptions()).toEqual([]);
    expect(store.categoryCodeListError()).toMatch(/503|maintenance/i);
  });

  it('capture une erreur de chargement sans exposer de priorites mockees', () => {
    vi.mocked(apiTypes.findAllByType).mockReturnValueOnce(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 503,
            url: '/v1/code-lists/TICKET_PRIORITY',
          }),
      ) as any,
    );

    store.loadTicketPriorities();

    expect(store.priorityCodeListLoading()).toBe(false);
    expect(store.ticketPriorityOptions()).toEqual([]);
    expect(store.priorityCodeListError()).toMatch(/503|maintenance/i);
  });
});

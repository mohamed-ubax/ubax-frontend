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
  loadTicketCategories(): void;
};

describe('TicketingStore', () => {
  const storeToken =
    TicketingStore as unknown as ProviderToken<TicketingStoreContract>;
  const storeClass = TicketingStore as unknown as Type<unknown>;

  let store: TicketingStoreContract;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(apiTypes.findAllByType).mockImplementation(
      () =>
        of(
          toStrictResponse({
            data: [
              { value: 'PLOMBIER', description: 'Plomberie et sanitaire' },
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

  it('charge les categories SAV depuis le codelist TECHNICIEN_PROFESSION', () => {
    store.loadTicketCategories();

    expect(apiTypes.findAllByType).toHaveBeenCalledWith(
      {},
      'https://test.local',
      { type: 'TECHNICIEN_PROFESSION' },
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

  it('capture une erreur de chargement sans exposer de categories mockees', () => {
    vi.mocked(apiTypes.findAllByType).mockReturnValueOnce(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 503,
            url: '/v1/code-lists/TECHNICIEN_PROFESSION',
          }),
      ) as any,
    );

    store.loadTicketCategories();

    expect(store.categoryCodeListLoading()).toBe(false);
    expect(store.ticketCategoryOptions()).toEqual([]);
    expect(store.categoryCodeListError()).toMatch(/503|maintenance/i);
  });
});

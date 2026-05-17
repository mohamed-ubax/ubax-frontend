import '@angular/compiler';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Injector, ProviderToken, Type } from '@angular/core';
import { of } from 'rxjs';
import {
  ApiConfiguration,
  type StrictHttpResponse,
} from '@ubax-workspace/shared-api-types';
import * as apiTypes from '@ubax-workspace/shared-api-types';
import { type ContractResponse, ContratsStore } from './contrats.store';

vi.mock('@ubax-workspace/shared-api-types', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@ubax-workspace/shared-api-types')>();
  return {
    ...actual,
    list5: vi.fn(),
  };
});

function toStrictResponse<T>(body: T): StrictHttpResponse<T> {
  return new HttpResponse({ body }) as StrictHttpResponse<T>;
}

type ContratsStoreContract = {
  entities(): ContractResponse[];
  load(params?: unknown): void;
};

describe('ContratsStore', () => {
  const storeToken =
    ContratsStore as unknown as ProviderToken<ContratsStoreContract>;
  const storeClass = ContratsStore as unknown as Type<unknown>;

  let store: ContratsStoreContract;

  beforeEach(() => {
    vi.mocked(apiTypes.list5).mockImplementation(() =>
      of(
        toStrictResponse({
          status: 'SUCCESS',
          statusCode: 200,
          message: 'CONTRACT_GET_LIST_SUCCESS',
          data: {
            results: [
              {
                id: '1abf05cb-71a1-4be8-9a2e-a952ddd36e4d',
                referenceNumber: 'CTR-2026-LEA-1ABF05',
                propertyId: '394e1b94-6d87-41b2-8b31-031a9f45944d',
                propertyTitle: 'Villa Contemporaine "Les Jardins d\'Almadies"',
                propertyCity: 'DAKAR',
                ownerId: 'a913779e-792a-43d2-9948-6f1bbda6229a',
                ownerFullName: 'selle diop',
                tenantId: '8b716e32-6926-4397-9837-580538a48059',
                tenantFullName: 'selle diop',
                createdById: 'b2aa5838-af1e-4963-b719-c0dd2370549c',
                createdByFullName: 'Immobilière Dakar SARL Texilin Amusa',
                contractType: 'LEASE',
                status: 'ACTIVE',
                startDate: '2026-07-01',
                endDate: '2027-06-30',
                monthlyRent: 2000000,
                monthlyCharges: 150000,
                totalMonthlyAmount: 2150000,
                depositAmount: 40000000,
                depositReturned: false,
                agencyCommissionRate: 5,
                paymentDay: 5,
                specialClauses:
                  "Bail meublé – Villa Les Jardins d'Almadies. Loyer payable le 5 de chaque mois.",
                terminationConditions: 'Preavis de 3 mois',
              },
            ],
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

  it('charge les contrats depuis data.results et normalise les champs attendus par l UI', () => {
    store.load({ pageable: { page: 0, size: 100, sort: [] } });

    expect(store.entities()).toHaveLength(1);
    expect(store.entities()[0]).toMatchObject({
      id: '1abf05cb-71a1-4be8-9a2e-a952ddd36e4d',
      referenceNumber: 'CTR-2026-LEA-1ABF05',
      tenantName: 'selle diop',
      ownerName: 'selle diop',
      agencyName: 'Immobilière Dakar SARL Texilin Amusa',
      propertyAddress: 'Villa Contemporaine "Les Jardins d\'Almadies", DAKAR',
      status: 'ACTIVE',
      monthlyRent: 2000000,
      monthlyCharges: 150000,
      totalMonthlyAmount: 2150000,
      depositAmount: 40000000,
      depositReturned: false,
      agencyCommissionRate: 5,
      paymentDay: 5,
      specialClauses:
        "Bail meublé – Villa Les Jardins d'Almadies. Loyer payable le 5 de chaque mois.",
      terminationConditions: 'Preavis de 3 mois',
    });
  });
});

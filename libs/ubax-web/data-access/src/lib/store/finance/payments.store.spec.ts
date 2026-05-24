import '@angular/compiler';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Injector, ProviderToken, Type } from '@angular/core';
import { of } from 'rxjs';
import {
  ApiConfiguration,
  type StrictHttpResponse,
} from '@ubax-workspace/shared-api-types';
import * as apiTypes from '@ubax-workspace/shared-api-types';
import {
  type Payment,
  PaymentsStore,
  mapLatePaymentToRow,
  mapPaymentToRow,
} from './payments.store';

vi.mock('@ubax-workspace/shared-api-types', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@ubax-workspace/shared-api-types')>();
  return {
    ...actual,
    list3: vi.fn(),
    getById6: vi.fn(),
    create5: vi.fn(),
    updateStatus2: vi.fn(),
    delete2: vi.fn(),
    getAgencyDashboard: vi.fn(),
    listLate: vi.fn(),
    getById4: vi.fn(),
  };
});

function toStrictResponse<T>(body: T): StrictHttpResponse<T> {
  return new HttpResponse({ body }) as StrictHttpResponse<T>;
}

type PaymentRow = ReturnType<typeof mapPaymentToRow>;
type LatePaymentRow = ReturnType<typeof mapLatePaymentToRow>;

type PaymentsStoreContract = {
  paymentRows(): PaymentRow[];
  latePaymentRows(): LatePaymentRow[];
  paymentTenantIds(): string[];
  load(params?: unknown): void;
  loadLatePayments(): void;
  ensureTenantNames(ids: readonly string[]): void;
};

describe('PaymentsStore', () => {
  const storeToken =
    PaymentsStore as unknown as ProviderToken<PaymentsStoreContract>;
  const storeClass = PaymentsStore as unknown as Type<unknown>;

  let store: PaymentsStoreContract;

  beforeEach(() => {
    vi.mocked(apiTypes.list3).mockReset();
    vi.mocked(apiTypes.getById6).mockReset();
    vi.mocked(apiTypes.create5).mockReset();
    vi.mocked(apiTypes.updateStatus2).mockReset();
    vi.mocked(apiTypes.delete2).mockReset();
    vi.mocked(apiTypes.getAgencyDashboard).mockReset();
    vi.mocked(apiTypes.listLate).mockReset();
    vi.mocked(apiTypes.getById4).mockReset();

    vi.mocked(apiTypes.list3).mockReturnValue(
      of(
        toStrictResponse({
          status: 'SUCCESS',
          data: {
            results: [
              {
                id: 'payment-1',
                paymentType: 'RENT',
                amount: 2_150_000,
                paidDate: '2026-05-24',
                periodLabel: 'Juillet 2026',
                reference: 'PAY-2026-08-RENT-1A',
                recordedByName: 'Agence Ubax',
                status: 'PAID',
                tenantId: 'tenant-1',
              },
            ],
          },
        }),
      ),
    );

    vi.mocked(apiTypes.listLate).mockReturnValue(
      of(
        toStrictResponse({
          data: [
            {
              id: 'payment-late-1',
              paymentType: 'RENT',
              amount: 980_000,
              dueDate: '2026-05-01',
              periodLabel: 'Mai 2026',
              status: 'LATE',
              tenantId: 'tenant-2',
            },
          ],
        }),
      ),
    );

    vi.mocked(apiTypes.getById4).mockImplementation(
      (_http, _rootUrl, params: { id: string }) =>
        of(
          toStrictResponse({
            status: 'SUCCESS',
            data: {
              id: params.id,
              fullName: params.id === 'tenant-1' ? 'Awa Diallo' : 'Mariam Koné',
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

  it('privilégie le nom du locataire enrichi sur recordedByName', () => {
    const row = mapPaymentToRow(
      {
        id: 'payment-1',
        paymentType: 'RENT',
        recordedByName: 'Agence Ubax',
        tenantId: 'tenant-1',
      } as Payment,
      { 'tenant-1': 'Awa Diallo' },
    );

    expect(row.tenant).toBe('Awa Diallo');
  });

  it('hydrate les noms de locataires pour les tableaux finance et historique', () => {
    store.load({ pageable: { page: 0, size: 10, sort: [] } });
    store.loadLatePayments();

    expect(store.paymentRows()[0]?.tenant).toBe('—');
    expect(store.latePaymentRows()[0]?.tenant).toBe('—');
    expect(store.paymentTenantIds()).toEqual(['tenant-1', 'tenant-2']);

    store.ensureTenantNames(store.paymentTenantIds());

    expect(apiTypes.getById4).toHaveBeenCalledTimes(2);
    expect(store.paymentRows()[0]?.tenant).toBe('Awa Diallo');
    expect(store.latePaymentRows()[0]?.tenant).toBe('Mariam Koné');
  });
});

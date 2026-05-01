import '@angular/compiler';
import { HttpClient, HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { Injector, ProviderToken, Type } from '@angular/core';
import { of, throwError } from 'rxjs';
import {
  ApiConfiguration,
  type StrictHttpResponse,
  type TenantResponse,
} from '@ubax-workspace/shared-api-types';
import * as apiTypes from '@ubax-workspace/shared-api-types';
import { LocationStore } from './location.store';

vi.mock('@ubax-workspace/shared-api-types', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@ubax-workspace/shared-api-types')>();
  return {
    ...actual,
    list4: vi.fn(),
    getById2: vi.fn(),
    qualify: vi.fn(),
    reject: vi.fn(),
  };
});

function toStrictResponse<T>(body: T): StrictHttpResponse<T> {
  return new HttpResponse({ body }) as StrictHttpResponse<T>;
}

type Tenant = TenantResponse & { id: string };

const TENANTS: Tenant[] = [
  { id: 'loc-1', userId: 'loc-1', status: 'QUALIFIED', firstName: 'Awa', lastName: 'Diallo' },
  { id: 'loc-2', userId: 'loc-2', status: 'PENDING_REVIEW', firstName: 'Kone', lastName: 'Ibrahim' },
  { id: 'loc-3', userId: 'loc-3', status: 'PENDING_REVIEW', firstName: 'Sara', lastName: 'Coulibaly' },
  { id: 'loc-4', userId: 'loc-4', status: 'REJECTED', firstName: 'Ali', lastName: 'Touré' },
  { id: 'loc-5', userId: 'loc-5', status: 'QUALIFIED', firstName: 'Nina', lastName: 'Bamba' },
];

type LocationStoreContract = {
  entities(): Tenant[];
  isLoading(): boolean;
  isSaving(): boolean;
  hasError(): boolean;
  error(): string | null;
  locatairesActifs(): Tenant[];
  locatairesEnAttente(): Tenant[];
  locatairesRejetes(): Tenant[];
  locatairesFiltres(): Tenant[];
  totalLocataires(): number;
  load(params?: unknown): void;
  setFilterStatut(statut: Tenant['status'] | null): void;
  qualifier(id: string): void;
  rejeter(params: { id: string; reason: string }): void;
};

describe('LocationStore', () => {
  const storeToken = LocationStore as unknown as ProviderToken<LocationStoreContract>;
  const storeClass = LocationStore as unknown as Type<unknown>;

  let store: LocationStoreContract;

  beforeEach(() => {
    vi.mocked(apiTypes.list4).mockImplementation(() =>
      of(toStrictResponse(TENANTS)),
    );
    vi.mocked(apiTypes.qualify).mockImplementation(
      (_http, _rootUrl, params: any) =>
        of(
          toStrictResponse({
            id: params.id,
            userId: params.id,
            status: 'QUALIFIED',
          } as Tenant),
        ),
    );
    vi.mocked(apiTypes.reject).mockImplementation(
      (_http, _rootUrl, params: any) =>
        of(
          toStrictResponse({
            id: params.id,
            userId: params.id,
            status: 'REJECTED',
          } as Tenant),
        ),
    );

    const injector = Injector.create({
      providers: [
        { provide: HttpClient, useValue: {} },
        { provide: ApiConfiguration, useValue: { rootUrl: 'https://test.local' } },
        { provide: storeToken, useClass: storeClass },
      ],
    });

    store = injector.get(storeToken);
  });

  describe('computed selectors', () => {
    beforeEach(() => {
      store.load();
    });

    it('expose le bon nombre total de locataires', () => {
      expect(store.totalLocataires()).toBe(TENANTS.length);
    });

    it('filtre les locataires actifs (QUALIFIED)', () => {
      expect(store.locatairesActifs()).toHaveLength(2);
      expect(
        store.locatairesActifs().every((l) => l.status === 'QUALIFIED'),
      ).toBe(true);
    });

    it('filtre les locataires en attente (PENDING_REVIEW)', () => {
      expect(store.locatairesEnAttente()).toHaveLength(2);
      expect(
        store.locatairesEnAttente().every((l) => l.status === 'PENDING_REVIEW'),
      ).toBe(true);
    });

    it('filtre les locataires rejetés (REJECTED)', () => {
      expect(store.locatairesRejetes()).toHaveLength(1);
      expect(store.locatairesRejetes()[0]?.id).toBe('loc-4');
    });
  });

  describe('setFilterStatut', () => {
    beforeEach(() => {
      store.load();
    });

    it('retourne tous les locataires quand le filtre est null', () => {
      store.setFilterStatut(null);
      expect(store.locatairesFiltres()).toHaveLength(TENANTS.length);
    });

    it('filtre par statut PENDING_REVIEW', () => {
      store.setFilterStatut('PENDING_REVIEW');
      expect(store.locatairesFiltres()).toHaveLength(2);
      expect(
        store.locatairesFiltres().every((l) => l.status === 'PENDING_REVIEW'),
      ).toBe(true);
    });

    it('retourne une liste vide pour un statut inexistant', () => {
      store.setFilterStatut('CANCELLED' as Tenant['status']);
      expect(store.locatairesFiltres()).toHaveLength(0);
    });
  });

  describe('qualifier', () => {
    beforeEach(() => {
      store.load();
    });

    it('passe un locataire en attente au statut QUALIFIED', () => {
      store.qualifier('loc-2');

      const updated = store.entities().find((l) => l.id === 'loc-2');
      expect(updated?.status).toBe('QUALIFIED');
      expect(store.isSaving()).toBe(false);
      expect(store.hasError()).toBe(false);
    });

    it('capture une erreur si la qualification échoue', () => {
      vi.mocked(apiTypes.qualify).mockReturnValueOnce(
        throwError(
          () =>
            new HttpErrorResponse({
              status: 409,
              url: '/api/tenants/loc-2/qualify',
            }),
        ),
      );

      store.qualifier('loc-2');

      expect(store.hasError()).toBe(true);
      expect(store.isSaving()).toBe(false);
    });
  });

  describe('rejeter', () => {
    beforeEach(() => {
      store.load();
    });

    it('passe un locataire en attente au statut REJECTED', () => {
      store.rejeter({ id: 'loc-3', reason: 'Dossier incomplet' });

      const updated = store.entities().find((l) => l.id === 'loc-3');
      expect(updated?.status).toBe('REJECTED');
      expect(store.isSaving()).toBe(false);
    });

    it('capture une erreur si le rejet échoue', () => {
      vi.mocked(apiTypes.reject).mockReturnValueOnce(
        throwError(
          () =>
            new HttpErrorResponse({
              status: 500,
              url: '/api/tenants/loc-3/reject',
            }),
        ),
      );

      store.rejeter({ id: 'loc-3', reason: 'Erreur serveur' });

      expect(store.hasError()).toBe(true);
    });
  });
});

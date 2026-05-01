import '@angular/compiler';
import { HttpClient, HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { Injector, ProviderToken, Type } from '@angular/core';
import { of, throwError } from 'rxjs';
import {
  ApiConfiguration,
  type StrictHttpResponse,
} from '@ubax-workspace/shared-api-types';
import * as apiTypes from '@ubax-workspace/shared-api-types';
import { DemandesStore, type Ticket } from './demandes.store';

vi.mock('@ubax-workspace/shared-api-types', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@ubax-workspace/shared-api-types')>();
  return {
    ...actual,
    list: vi.fn(),
    getById1: vi.fn(),
    create: vi.fn(),
    updateStatus: vi.fn(),
    assign: vi.fn(),
  };
});

function toStrictResponse<T>(body: T): StrictHttpResponse<T> {
  return new HttpResponse({ body }) as StrictHttpResponse<T>;
}

const TICKETS: Ticket[] = [
  { id: 't1', status: 'OPEN', priority: 'URGENT', title: 'Fuite eau' },
  { id: 't2', status: 'OPEN', priority: 'NORMAL', title: 'Ampoule grillée' },
  { id: 't3', status: 'IN_ANALYSIS', priority: 'HIGH', title: 'Serrure bloquée' },
  { id: 't4', status: 'RESOLVED', priority: 'LOW', title: 'Peinture écaillée' },
  { id: 't5', status: 'TECHNICIAN_SENT', priority: 'URGENT', title: 'Climatisation HS' },
];

type DemandesStoreContract = {
  entities(): Ticket[];
  isLoading(): boolean;
  isSaving(): boolean;
  hasError(): boolean;
  error(): string | null;
  ticketsOuverts(): Ticket[];
  ticketsEnAnalyse(): Ticket[];
  ticketsTechnicienEnvoye(): Ticket[];
  ticketsResolus(): Ticket[];
  ticketsUrgents(): Ticket[];
  ticketsFiltres(): Ticket[];
  filterStatut(): Ticket['status'] | null;
  load(params?: unknown): void;
  setFilterStatut(statut: Ticket['status'] | null): void;
  changerStatut(params: { ticketId: string; body: unknown }): void;
  assignerTechnicien(params: { ticketId: string; body: unknown }): void;
};

describe('DemandesStore', () => {
  const storeToken = DemandesStore as unknown as ProviderToken<DemandesStoreContract>;
  const storeClass = DemandesStore as unknown as Type<unknown>;

  let store: DemandesStoreContract;

  beforeEach(() => {
    vi.mocked(apiTypes.list).mockImplementation(() =>
      of(toStrictResponse({ data: TICKETS })),
    );
    vi.mocked(apiTypes.updateStatus).mockImplementation(
      (_http, _rootUrl, params: any) =>
        of(toStrictResponse({ id: params.ticketId, status: 'RESOLVED' } as Ticket)),
    );
    vi.mocked(apiTypes.assign).mockImplementation(
      (_http, _rootUrl, params: any) =>
        of(
          toStrictResponse({
            id: params.ticketId,
            assignedToId: params.body?.technicianId ?? 'tech-1',
            status: 'TECHNICIAN_SENT',
          } as Ticket),
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

    it('filtre les tickets ouverts', () => {
      expect(store.ticketsOuverts()).toHaveLength(2);
      expect(store.ticketsOuverts().every((t) => t.status === 'OPEN')).toBe(true);
    });

    it('filtre les tickets en analyse', () => {
      expect(store.ticketsEnAnalyse()).toHaveLength(1);
      expect(store.ticketsEnAnalyse()[0]?.id).toBe('t3');
    });

    it('filtre les tickets technicien envoyé', () => {
      expect(store.ticketsTechnicienEnvoye()).toHaveLength(1);
      expect(store.ticketsTechnicienEnvoye()[0]?.id).toBe('t5');
    });

    it('filtre les tickets résolus', () => {
      expect(store.ticketsResolus()).toHaveLength(1);
      expect(store.ticketsResolus()[0]?.id).toBe('t4');
    });

    it('filtre les tickets urgents (toutes priorités URGENT)', () => {
      expect(store.ticketsUrgents()).toHaveLength(2);
      expect(store.ticketsUrgents().every((t) => t.priority === 'URGENT')).toBe(true);
    });
  });

  describe('setFilterStatut', () => {
    beforeEach(() => {
      store.load();
    });

    it('retourne tous les tickets quand le filtre est null', () => {
      store.setFilterStatut(null);
      expect(store.ticketsFiltres()).toHaveLength(TICKETS.length);
    });

    it('filtre ticketsFiltres par statut', () => {
      store.setFilterStatut('OPEN');
      expect(store.ticketsFiltres()).toHaveLength(2);
      expect(store.ticketsFiltres().every((t) => t.status === 'OPEN')).toBe(true);
    });

    it('retourne une liste vide pour un statut sans résultats', () => {
      store.setFilterStatut('CLOSED');
      expect(store.ticketsFiltres()).toHaveLength(0);
    });
  });

  describe('changerStatut', () => {
    beforeEach(() => {
      store.load();
    });

    it('met à jour le statut du ticket dans le store', () => {
      store.changerStatut({ ticketId: 't1', body: { status: 'RESOLVED' } });

      const updated = store.entities().find((t) => t.id === 't1');
      expect(updated?.status).toBe('RESOLVED');
      expect(store.isSaving()).toBe(false);
    });

    it('capture une erreur HTTP et la stocke dans error()', () => {
      vi.mocked(apiTypes.updateStatus).mockReturnValueOnce(
        throwError(
          () =>
            new HttpErrorResponse({
              status: 422,
              statusText: 'Unprocessable',
              url: '/api/tickets/t1/status',
            }),
        ),
      );

      store.changerStatut({ ticketId: 't1', body: { status: 'INVALID' } });

      expect(store.hasError()).toBe(true);
      expect(store.isSaving()).toBe(false);
    });
  });

  describe('assignerTechnicien', () => {
    beforeEach(() => {
      store.load();
    });

    it('assigne un technicien et met à jour le ticket', () => {
      store.assignerTechnicien({
        ticketId: 't2',
        body: { technicianId: 'tech-42' },
      });

      const updated = store.entities().find((t) => t.id === 't2');
      expect(updated?.assignedToId).toBe('tech-42');
      expect(updated?.status).toBe('TECHNICIAN_SENT');
      expect(store.isSaving()).toBe(false);
    });

    it('capture une erreur si le technicien est introuvable', () => {
      vi.mocked(apiTypes.assign).mockReturnValueOnce(
        throwError(
          () =>
            new HttpErrorResponse({
              status: 404,
              url: '/api/tickets/t2/assign',
            }),
        ),
      );

      store.assignerTechnicien({ ticketId: 't2', body: { technicianId: 'ghost' } });

      expect(store.hasError()).toBe(true);
    });
  });
});

import { computed, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { tapResponse } from '@ngrx/operators';
import {
  patchState,
  signalStore,
  withComputed,
  withMethods,
  withState,
} from '@ngrx/signals';
import { updateEntity } from '@ngrx/signals/entities';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { withApiResource } from '@ubax-workspace/shared-data-access';
import {
  ApiConfiguration,
  assign,
  AssignTicketRequest,
  create,
  getById1,
  list,
  updateStatus,
  UpdateTicketStatusRequest,
} from '@ubax-workspace/shared-api-types';
import { map, pipe, switchMap, tap } from 'rxjs';

/**
 * Type ticket local (CustomResponse.data contient les tickets).
 * Le swagger type la réponse list en CustomResponse — on l'extrait via mapList.
 */
export interface Ticket {
  id: string;
  title?: string;
  description?: string;
  status?:
    | 'OPEN'
    | 'IN_ANALYSIS'
    | 'TECHNICIAN_SENT'
    | 'RESOLVED'
    | 'CLOSED'
    | 'CANCELLED';
  priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  category?: string;
  assignedToId?: string;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

/**
 * DemandesStore — gestion des tickets SAV / maintenance.
 * Branché sur les vrais endpoints /v1/tickets.
 *
 * Méthodes disponibles (héritées de withApiResource) :
 *   store.load(params?)   — GET /v1/tickets (filtre par statut, assignedToId, page, size)
 *   store.loadOne(id)     — GET /v1/tickets/:id
 *   store.create(params)  — POST /v1/tickets
 *
 * Méthodes spécifiques :
 *   store.changerStatut({ ticketId, body })  — PATCH statut du ticket
 *   store.assignerTechnicien({ ticketId, body }) — assigner un technicien
 */
export const DemandesStore = signalStore(
  { providedIn: 'root' },
  withApiResource({
    list,
    getById: getById1,
    buildGetByIdParams: (id) => ({ ticketId: id }),
    mapGetById: (raw, requestedId) => {
      if (raw && typeof raw === 'object') {
        const data = (raw as { data?: unknown }).data;
        if (data && typeof data === 'object') {
          const ticket = data as Ticket;
          return { ...ticket, id: ticket.id ?? requestedId };
        }
      }

      const ticket = raw as Ticket;
      return { ...ticket, id: ticket.id ?? requestedId };
    },
    create,
    mapList: (raw: unknown) => {
      if (Array.isArray(raw)) return raw;

      if (raw && typeof raw === 'object') {
        const data = (raw as { data?: unknown }).data;
        if (Array.isArray(data)) return data;
        if (data && typeof data === 'object') {
          const nested = (data as { content?: unknown }).content;
          if (Array.isArray(nested)) {
            return nested;
          }
        }
      }

      return [];
    },
  }),
  withState({
    filterStatut: null as Ticket['status'] | null,
  }),
  withComputed(({ entities, filterStatut }) => ({
    ticketsOuverts: computed(() =>
      entities().filter((t) => t.status === 'OPEN'),
    ),
    ticketsEnAnalyse: computed(() =>
      entities().filter((t) => t.status === 'IN_ANALYSIS'),
    ),
    ticketsTechnicienEnvoye: computed(() =>
      entities().filter((t) => t.status === 'TECHNICIAN_SENT'),
    ),
    ticketsResolus: computed(() =>
      entities().filter((t) => t.status === 'RESOLVED'),
    ),
    ticketsUrgents: computed(() =>
      entities().filter((t) => t.priority === 'URGENT'),
    ),
    ticketsFiltres: computed(() => {
      const s = filterStatut();
      return s ? entities().filter((t) => t.status === s) : entities();
    }),
  })),
  withMethods(
    (
      store,
      http = inject(HttpClient),
      apiConfig = inject(ApiConfiguration),
    ) => ({
      setFilterStatut(statut: Ticket['status'] | null): void {
        patchState(store, { filterStatut: statut });
      },

      changerStatut: rxMethod<{
        ticketId: string;
        body: UpdateTicketStatusRequest;
      }>(
        pipe(
          tap(() => patchState(store, { saving: true, error: null })),
          switchMap(({ ticketId, body }) =>
            updateStatus(http, apiConfig.rootUrl, { ticketId, body }).pipe(
              map((r) => r.body as Ticket),
              tapResponse({
                next: (ticket: Ticket) =>
                  patchState(
                    store,
                    updateEntity({ id: ticket.id, changes: ticket }),
                    { saving: false },
                  ),
                error: (err: HttpErrorResponse) =>
                  patchState(store, { saving: false, error: err.message }),
              }),
            ),
          ),
        ),
      ),

      assignerTechnicien: rxMethod<{
        ticketId: string;
        body: AssignTicketRequest;
      }>(
        pipe(
          tap(() => patchState(store, { saving: true, error: null })),
          switchMap(({ ticketId, body }) =>
            assign(http, apiConfig.rootUrl, { ticketId, body }).pipe(
              map((r) => r.body as Ticket),
              tapResponse({
                next: (ticket: Ticket) =>
                  patchState(
                    store,
                    updateEntity({ id: ticket.id, changes: ticket }),
                    { saving: false },
                  ),
                error: (err: HttpErrorResponse) =>
                  patchState(store, { saving: false, error: err.message }),
              }),
            ),
          ),
        ),
      ),
    }),
  ),
);

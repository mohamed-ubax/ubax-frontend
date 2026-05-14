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
  addMessage,
  AddMessage$Params,
  ApiConfiguration,
  assign,
  Assign$Params,
  create,
  getById3,
  list,
  listMessages,
  scheduleIntervention,
  ScheduleIntervention$Params,
  updateRepairCost,
  UpdateRepairCost$Params,
  updateStatus,
  UpdateStatus$Params,
} from '@ubax-workspace/shared-api-types';
import { exhaustMap, map, pipe, tap } from 'rxjs';

export type TicketStatus =
  | 'OPEN'
  | 'IN_ANALYSIS'
  | 'TECHNICIAN_SENT'
  | 'RESOLVED'
  | 'CLOSED'
  | 'CANCELLED';

export type TicketPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

export type TicketCategory =
  | 'LEAK'
  | 'ELECTRICAL'
  | 'LOCK'
  | 'PLUMBING'
  | 'APPLIANCE'
  | 'STRUCTURE'
  | 'PEST'
  | 'COMMON_AREA'
  | 'OTHER';

export type TicketAttachment = {
  id: string;
  fileUrl: string;
  type: string;
  createdAt: string;
};

export type TicketMessage = {
  id: string;
  ticketId: string;
  message: string;
  messageType: 'PUBLIC' | 'INTERNAL';
  senderId: string;
  senderName?: string;
  senderAvatar?: string;
  createdAt: string;
};

export type Ticket = {
  id: string;
  title?: string;
  description?: string;
  status?: TicketStatus;
  priority?: TicketPriority;
  category?: TicketCategory;
  contractId?: string;
  propertyId?: string;
  agencyId?: string;
  createdBy?: string;
  assignedToId?: string;
  assignedToName?: string;
  technicianName?: string;
  technicianPhone?: string;
  interventionScheduledAt?: string;
  repairCost?: number;
  costImputedTo?: 'OWNER' | 'TENANT' | 'SHARED';
  resolutionNote?: string;
  attachments?: TicketAttachment[];
  createdAt?: string;
  updatedAt?: string;
};

function extractTicketFromResponse(raw: unknown, requestedId?: string): Ticket {
  if (raw && typeof raw === 'object') {
    const data = (raw as Record<string, unknown>)['data'];
    if (data && typeof data === 'object') {
      const ticket = data as Partial<Ticket> & { id?: string };
      return { ...ticket, id: ticket.id ?? requestedId ?? '' } as Ticket;
    }
  }
  const ticket = raw as Partial<Ticket> & { id?: string };
  return { ...ticket, id: ticket.id ?? requestedId ?? '' } as Ticket;
}

function extractListFromResponse(raw: unknown): Ticket[] {
  if (Array.isArray(raw)) return raw as Ticket[];
  if (raw && typeof raw === 'object') {
    const data = (raw as Record<string, unknown>)['data'];
    if (Array.isArray(data)) return data as Ticket[];
    if (data && typeof data === 'object') {
      const nested = (data as Record<string, unknown>)['content'];
      if (Array.isArray(nested)) return nested as Ticket[];
    }
  }
  return [];
}

/**
 * TicketingStore — module SAV complet.
 *
 * Méthodes héritées de withApiResource :
 *   store.load(params?)   — GET /v1/tickets
 *   store.loadOne(id)     — GET /v1/tickets/:id
 *   store.create(params)  — POST /v1/tickets
 *
 * Méthodes spécifiques :
 *   store.changerStatut({ ticketId, body })
 *   store.assignerAgent({ ticketId, body })
 *   store.planifierIntervention({ ticketId, body })
 *   store.mettreAJourCout({ ticketId, body })
 *   store.chargerMessages(ticketId)
 *   store.envoyerMessage({ ticketId, body })
 */
export const TicketingStore = signalStore(
  { providedIn: 'root' },
  withApiResource({
    list,
    getById: getById3,
    buildGetByIdParams: (id) => ({ ticketId: id }),
    mapGetById: extractTicketFromResponse,
    create,
    mapList: extractListFromResponse,
  }),
  withState({
    messages: [] as TicketMessage[],
    messagesLoading: false,
    messagesError: null as string | null,
    filterStatus: null as TicketStatus | null,
    filterPriority: null as TicketPriority | null,
    filterCategory: null as TicketCategory | null,
  }),
  withComputed(({ entities, filterStatus, filterPriority, filterCategory }) => ({
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
      let result = entities();
      const s = filterStatus();
      const p = filterPriority();
      const c = filterCategory();
      if (s) result = result.filter((t) => t.status === s);
      if (p) result = result.filter((t) => t.priority === p);
      if (c) result = result.filter((t) => t.category === c);
      return result;
    }),
  })),
  withMethods(
    (
      store,
      http = inject(HttpClient),
      apiConfig = inject(ApiConfiguration),
    ) => ({
      setFilterStatus(status: TicketStatus | null): void {
        patchState(store, { filterStatus: status });
      },

      setFilterPriority(priority: TicketPriority | null): void {
        patchState(store, { filterPriority: priority });
      },

      setFilterCategory(category: TicketCategory | null): void {
        patchState(store, { filterCategory: category });
      },

      changerStatut: rxMethod<UpdateStatus$Params>(
        pipe(
          tap(() => patchState(store, { saving: true, error: null })),
          exhaustMap((params) =>
            updateStatus(http, apiConfig.rootUrl, params).pipe(
              map((r) => extractTicketFromResponse(r.body, params.ticketId)),
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

      assignerAgent: rxMethod<Assign$Params>(
        pipe(
          tap(() => patchState(store, { saving: true, error: null })),
          exhaustMap((params) =>
            assign(http, apiConfig.rootUrl, params).pipe(
              map((r) => extractTicketFromResponse(r.body, params.ticketId)),
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

      planifierIntervention: rxMethod<ScheduleIntervention$Params>(
        pipe(
          tap(() => patchState(store, { saving: true, error: null })),
          exhaustMap((params) =>
            scheduleIntervention(http, apiConfig.rootUrl, params).pipe(
              map((r) => extractTicketFromResponse(r.body, params.ticketId)),
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

      mettreAJourCout: rxMethod<UpdateRepairCost$Params>(
        pipe(
          tap(() => patchState(store, { saving: true, error: null })),
          exhaustMap((params) =>
            updateRepairCost(http, apiConfig.rootUrl, params).pipe(
              map((r) => extractTicketFromResponse(r.body, params.ticketId)),
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

      chargerMessages: rxMethod<string>(
        pipe(
          tap(() =>
            patchState(store, { messagesLoading: true, messagesError: null }),
          ),
          exhaustMap((ticketId) =>
            listMessages(http, apiConfig.rootUrl, { ticketId }).pipe(
              map((r) => {
                const raw = r.body;
                if (raw && typeof raw === 'object') {
                  const data = (raw as { data?: unknown }).data;
                  if (Array.isArray(data)) return data as TicketMessage[];
                }
                return [] as TicketMessage[];
              }),
              tapResponse({
                next: (messages: TicketMessage[]) =>
                  patchState(store, { messages, messagesLoading: false }),
                error: (err: HttpErrorResponse) =>
                  patchState(store, {
                    messagesLoading: false,
                    messagesError: err.message,
                  }),
              }),
            ),
          ),
        ),
      ),

      envoyerMessage: rxMethod<AddMessage$Params>(
        pipe(
          exhaustMap((params) =>
            addMessage(http, apiConfig.rootUrl, params).pipe(
              map((r) => {
                const raw = r.body;
                if (raw && typeof raw === 'object') {
                  const data = (raw as { data?: unknown }).data;
                  if (data) return data as TicketMessage;
                }
                return raw as TicketMessage;
              }),
              tapResponse({
                next: (msg: TicketMessage) =>
                  patchState(store, (s) => ({
                    messages: [...s.messages, msg],
                  })),
                error: (err: HttpErrorResponse) =>
                  patchState(store, { messagesError: err.message }),
              }),
            ),
          ),
        ),
      ),
    }),
  ),
);

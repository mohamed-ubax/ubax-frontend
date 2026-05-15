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
import {
  withApiResource,
  resolveHttpErrorMessage,
} from '@ubax-workspace/shared-data-access';
import {
  addMessage,
  AddMessage$Params,
  ApiConfiguration,
  assign,
  Assign$Params,
  create,
  CreateTicketRequest,
  findAllByType,
  getById3,
  LaCodeListDto,
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

export type TicketRequestCategory = NonNullable<
  CreateTicketRequest['category']
>;

export type TicketCategory = string & {};

export type TicketCategoryOption = {
  value: TicketCategory;
  label: string;
  description: string;
};

export type TicketPriorityOption = {
  value: TicketPriority;
  label: string;
  description: string;
};

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
  technicienId?: string;
  technicienProfession?: string;
  technicianName?: string;
  technicianPhone?: string;
  interventionScheduledAt?: string;
  interventionPrice?: number;
  repairCost?: number;
  costImputedTo?: 'OWNER' | 'TENANT' | 'SHARED';
  resolutionNote?: string;
  attachments?: TicketAttachment[];
  createdAt?: string;
  updatedAt?: string;
};

type TicketingState = {
  messages: TicketMessage[];
  messagesLoading: boolean;
  messagesError: string | null;
  filterStatus: TicketStatus | null;
  filterPriority: TicketPriority | null;
  filterCategory: TicketCategory | null;
  categoryCodeList: LaCodeListDto[];
  categoryCodeListLoading: boolean;
  categoryCodeListError: string | null;
  priorityCodeList: LaCodeListDto[];
  priorityCodeListLoading: boolean;
  priorityCodeListError: string | null;
};

const initialTicketingState: TicketingState = {
  messages: [],
  messagesLoading: false,
  messagesError: null,
  filterStatus: null,
  filterPriority: null,
  filterCategory: null,
  categoryCodeList: [],
  categoryCodeListLoading: false,
  categoryCodeListError: null,
  priorityCodeList: [],
  priorityCodeListLoading: false,
  priorityCodeListError: null,
};

const TICKET_PRIORITY_VALUES = ['LOW', 'NORMAL', 'HIGH', 'URGENT'] as const;

const DEFAULT_PRIORITY_LABELS: Record<TicketPriority, string> = {
  LOW: 'Faible',
  NORMAL: 'Normale',
  HIGH: 'Haute',
  URGENT: 'Urgente',
};

function extractCodeListFromResponse(body: unknown): LaCodeListDto[] {
  if (Array.isArray(body)) {
    return body as LaCodeListDto[];
  }

  if (!body || typeof body !== 'object') {
    return [];
  }

  const record = body as Record<string, unknown>;
  const data = record['data'];

  if (Array.isArray(data)) {
    return data as LaCodeListDto[];
  }

  if (data && typeof data === 'object') {
    const nested = (data as Record<string, unknown>)['content'];
    if (Array.isArray(nested)) {
      return nested as LaCodeListDto[];
    }
  }

  return [];
}

function readCategoryCodeListValue(item: LaCodeListDto): TicketCategory | null {
  const candidate = item.value?.trim() || item.id?.trim() || '';
  return candidate.length > 0 ? candidate : null;
}

function readCategoryCodeListLabel(item: LaCodeListDto): string {
  return (
    item.description?.trim() || item.value?.trim() || item.id?.trim() || 'Autre'
  );
}

function readPriorityCodeListValue(item: LaCodeListDto): TicketPriority | null {
  const candidate = item.value?.trim() || item.id?.trim() || '';

  if (
    TICKET_PRIORITY_VALUES.includes(
      candidate as (typeof TICKET_PRIORITY_VALUES)[number],
    )
  ) {
    return candidate as TicketPriority;
  }

  return null;
}

function readPriorityCodeListLabel(item: LaCodeListDto): string {
  const value = readPriorityCodeListValue(item);

  return (
    item.description?.trim() ||
    item.value?.trim() ||
    (value ? DEFAULT_PRIORITY_LABELS[value] : '') ||
    'Normale'
  );
}

function extractTicketFromResponse(raw: unknown, requestedId?: string): Ticket {
  if (raw && typeof raw === 'object') {
    const data = (raw as Record<string, unknown>)['data'];
    if (data && typeof data === 'object') {
      const ticket = data as Partial<Ticket> & { id?: string };
      return { ...ticket, id: ticket.id ?? requestedId ?? '' };
    }
  }
  const ticket = raw as Partial<Ticket> & { id?: string };
  return { ...ticket, id: ticket.id ?? requestedId ?? '' };
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
  withState(initialTicketingState),
  withComputed(
    ({
      entities,
      filterStatus,
      filterPriority,
      filterCategory,
      categoryCodeList,
      priorityCodeList,
    }) => ({
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
      ticketCategoryOptions: computed<readonly TicketCategoryOption[]>(() =>
        categoryCodeList()
          .map((item) => {
            const value = readCategoryCodeListValue(item);

            if (!value) {
              return null;
            }

            return {
              value,
              label: readCategoryCodeListLabel(item),
              description: readCategoryCodeListLabel(item),
            } satisfies TicketCategoryOption;
          })
          .filter((item): item is TicketCategoryOption => item !== null),
      ),
      ticketPriorityOptions: computed<readonly TicketPriorityOption[]>(() =>
        priorityCodeList()
          .map((item) => {
            const value = readPriorityCodeListValue(item);

            if (!value) {
              return null;
            }

            return {
              value,
              label: readPriorityCodeListLabel(item),
              description: readPriorityCodeListLabel(item),
            } satisfies TicketPriorityOption;
          })
          .filter((item): item is TicketPriorityOption => item !== null),
      ),
    }),
  ),
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

      loadTicketCategories: rxMethod<void>(
        pipe(
          tap(() =>
            patchState(store, {
              categoryCodeListLoading: true,
              categoryCodeListError: null,
            }),
          ),
          exhaustMap(() =>
            findAllByType(http, apiConfig.rootUrl, {
              type: 'TICKET_CATEGORY',
            }).pipe(
              map((response) => extractCodeListFromResponse(response.body)),
              tapResponse({
                next: (categoryCodeList: LaCodeListDto[]) =>
                  patchState(store, {
                    categoryCodeList,
                    categoryCodeListLoading: false,
                    categoryCodeListError: null,
                  }),
                error: (err: HttpErrorResponse) =>
                  patchState(store, {
                    categoryCodeListLoading: false,
                    categoryCodeListError: resolveHttpErrorMessage(
                      err,
                      'Erreur lors du chargement des catégories SAV',
                    ),
                  }),
              }),
            ),
          ),
        ),
      ),

      loadTicketPriorities: rxMethod<void>(
        pipe(
          tap(() =>
            patchState(store, {
              priorityCodeListLoading: true,
              priorityCodeListError: null,
            }),
          ),
          exhaustMap(() =>
            findAllByType(http, apiConfig.rootUrl, {
              type: 'TICKET_PRIORITY',
            }).pipe(
              map((response) => extractCodeListFromResponse(response.body)),
              tapResponse({
                next: (priorityCodeList: LaCodeListDto[]) =>
                  patchState(store, {
                    priorityCodeList,
                    priorityCodeListLoading: false,
                    priorityCodeListError: null,
                  }),
                error: (err: HttpErrorResponse) =>
                  patchState(store, {
                    priorityCodeListLoading: false,
                    priorityCodeListError: resolveHttpErrorMessage(
                      err,
                      'Erreur lors du chargement des priorités SAV',
                    ),
                  }),
              }),
            ),
          ),
        ),
      ),

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
                  patchState(store, {
                    saving: false,
                    error: resolveHttpErrorMessage(
                      err,
                      'Erreur lors de la mise à jour',
                    ),
                  }),
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
                  patchState(store, {
                    saving: false,
                    error: resolveHttpErrorMessage(
                      err,
                      'Erreur lors de la mise à jour',
                    ),
                  }),
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
                  patchState(store, {
                    saving: false,
                    error: resolveHttpErrorMessage(
                      err,
                      'Erreur lors de la mise à jour',
                    ),
                  }),
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
                  patchState(store, {
                    saving: false,
                    error: resolveHttpErrorMessage(
                      err,
                      'Erreur lors de la mise à jour',
                    ),
                  }),
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
                    messagesError: resolveHttpErrorMessage(
                      err,
                      'Erreur lors du chargement des messages',
                    ),
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
                  patchState(store, {
                    messagesError: resolveHttpErrorMessage(
                      err,
                      "Erreur lors de l'envoi du message",
                    ),
                  }),
              }),
            ),
          ),
        ),
      ),
    }),
  ),
);

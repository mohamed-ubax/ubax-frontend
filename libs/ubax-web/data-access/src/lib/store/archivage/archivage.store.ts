import { inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { tapResponse } from '@ngrx/operators';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { resolveHttpErrorMessage } from '@ubax-workspace/shared-data-access';
import {
  ApiConfiguration,
  getArchivedById,
  getArchivedById1,
  getArchivedById2,
  listMine1,
  listArchived,
  listArchived1,
  listArchived2,
  listArchivedDocuments,
  restore,
  restore1,
  restore2,
  restore3,
  restoreDocument,
} from '@ubax-workspace/shared-api-types';
import { exhaustMap, forkJoin, map, of, pipe, switchMap, tap } from 'rxjs';

type ArchivedTabData = {
  items: Record<string, unknown>[];
  loading: boolean;
  error: string | null;
  totalElements: number;
  totalPages: number;
};

export type RestoreStatus = 'idle' | 'pending' | 'success' | 'error';

type ArchivageState = {
  biens: ArchivedTabData;
  locataires: ArchivedTabData;
  factures: ArchivedTabData;
  tickets: ArchivedTabData;
  documents: ArchivedTabData;
  selectedItem: Record<string, unknown> | null;
  selectedItemLoading: boolean;
  selectedItemError: string | null;
  restoreStatus: RestoreStatus;
  restoreError: string | null;
};

function emptyTab(): ArchivedTabData {
  return { items: [], loading: false, error: null, totalElements: 0, totalPages: 0 };
}

const initialState: ArchivageState = {
  biens: emptyTab(),
  locataires: emptyTab(),
  factures: emptyTab(),
  tickets: emptyTab(),
  documents: emptyTab(),
  selectedItem: null,
  selectedItemLoading: false,
  selectedItemError: null,
  restoreStatus: 'idle',
  restoreError: null,
};

function extractPageData(raw: unknown): {
  items: Record<string, unknown>[];
  totalElements: number;
  totalPages: number;
} {
  if (!raw || typeof raw !== 'object') {
    return { items: [], totalElements: 0, totalPages: 0 };
  }

  const obj = raw as Record<string, unknown>;
  const data = obj['data'] ?? obj;

  if (data && typeof data === 'object' && !Array.isArray(data)) {
    const d = data as Record<string, unknown>;
    const content = d['content'] ?? d['results'] ?? d['items'];

    if (Array.isArray(content)) {
      return {
        items: content as Record<string, unknown>[],
        totalElements: Number(d['totalElements']) || content.length,
        totalPages: Number(d['totalPages']) || 1,
      };
    }
  }

  if (Array.isArray(data)) {
    return {
      items: data as Record<string, unknown>[],
      totalElements: (data as unknown[]).length,
      totalPages: 1,
    };
  }

  return { items: [], totalElements: 0, totalPages: 0 };
}

function extractItemData(raw: unknown): Record<string, unknown> | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;
  const data = obj['data'];
  if (data && typeof data === 'object' && !Array.isArray(data)) {
    return data as Record<string, unknown>;
  }
  return obj;
}

export type LoadPageParams = { page: number; size: number };
export type RestoreDocumentParams = { propertyId: string; docId: string };

export const ArchivageStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods(
    (store, http = inject(HttpClient), apiConfig = inject(ApiConfiguration)) => ({

      loadBiens: rxMethod<LoadPageParams>(
        pipe(
          tap(() =>
            patchState(store, (s) => ({
              biens: { ...s.biens, loading: true, error: null },
            })),
          ),
          exhaustMap(({ page, size }) =>
            listMine1(http, apiConfig.rootUrl, {
              status: 'ARCHIVED',
              pageable: { page, size },
            }).pipe(
              map((r) => extractPageData(r.body)),
              tapResponse({
                next: (result) =>
                  patchState(store, (s) => ({
                    biens: { ...s.biens, ...result, loading: false },
                  })),
                error: (err: HttpErrorResponse) =>
                  patchState(store, (s) => ({
                    biens: {
                      ...s.biens,
                      loading: false,
                      error: resolveHttpErrorMessage(
                        err,
                        'Erreur lors du chargement des biens archivés',
                      ),
                    },
                  })),
              }),
            ),
          ),
        ),
      ),

      loadLocataires: rxMethod<LoadPageParams>(
        pipe(
          tap(() =>
            patchState(store, (s) => ({
              locataires: { ...s.locataires, loading: true, error: null },
            })),
          ),
          exhaustMap(({ page, size }) =>
            listArchived1(http, apiConfig.rootUrl, {
              pageable: { page, size },
            }).pipe(
              map((r) => extractPageData(r.body)),
              tapResponse({
                next: (result) =>
                  patchState(store, (s) => ({
                    locataires: { ...s.locataires, ...result, loading: false },
                  })),
                error: (err: HttpErrorResponse) =>
                  patchState(store, (s) => ({
                    locataires: {
                      ...s.locataires,
                      loading: false,
                      error: resolveHttpErrorMessage(
                        err,
                        'Erreur lors du chargement des locataires archivés',
                      ),
                    },
                  })),
              }),
            ),
          ),
        ),
      ),

      loadFactures: rxMethod<LoadPageParams>(
        pipe(
          tap(() =>
            patchState(store, (s) => ({
              factures: { ...s.factures, loading: true, error: null },
            })),
          ),
          exhaustMap(({ page, size }) =>
            listArchived2(http, apiConfig.rootUrl, {
              pageable: { page, size },
            }).pipe(
              map((r) => extractPageData(r.body)),
              tapResponse({
                next: (result) =>
                  patchState(store, (s) => ({
                    factures: { ...s.factures, ...result, loading: false },
                  })),
                error: (err: HttpErrorResponse) =>
                  patchState(store, (s) => ({
                    factures: {
                      ...s.factures,
                      loading: false,
                      error: resolveHttpErrorMessage(
                        err,
                        'Erreur lors du chargement des factures archivées',
                      ),
                    },
                  })),
              }),
            ),
          ),
        ),
      ),

      loadTickets: rxMethod<LoadPageParams>(
        pipe(
          tap(() =>
            patchState(store, (s) => ({
              tickets: { ...s.tickets, loading: true, error: null },
            })),
          ),
          exhaustMap(({ page, size }) =>
            listArchived(http, apiConfig.rootUrl, { page, size }).pipe(
              map((r) => extractPageData(r.body)),
              tapResponse({
                next: (result) =>
                  patchState(store, (s) => ({
                    tickets: { ...s.tickets, ...result, loading: false },
                  })),
                error: (err: HttpErrorResponse) =>
                  patchState(store, (s) => ({
                    tickets: {
                      ...s.tickets,
                      loading: false,
                      error: resolveHttpErrorMessage(
                        err,
                        'Erreur lors du chargement des tickets archivés',
                      ),
                    },
                  })),
              }),
            ),
          ),
        ),
      ),

      loadDocuments: rxMethod<void>(
        pipe(
          tap(() =>
            patchState(store, (s) => ({
              documents: { ...s.documents, loading: true, error: null },
            })),
          ),
          switchMap(() =>
            listMine1(http, apiConfig.rootUrl, {
              status: 'ARCHIVED',
              pageable: { page: 0, size: 20 },
            }).pipe(
              map((r) => {
                const { items } = extractPageData(r.body);
                return items
                  .map((p) => p['id'] as string | undefined)
                  .filter((id): id is string => Boolean(id));
              }),
              switchMap((propertyIds) => {
                if (propertyIds.length === 0) {
                  return of([] as Record<string, unknown>[][]);
                }
                return forkJoin(
                  propertyIds.map((id) =>
                    listArchivedDocuments(http, apiConfig.rootUrl, { id }).pipe(
                      map((r) => {
                        const { items } = extractPageData(r.body);
                        return items.map((doc) => ({ ...doc, _propertyId: id }));
                      }),
                    ),
                  ),
                );
              }),
              map((docArrays) => docArrays.flat()),
              tapResponse({
                next: (items: Record<string, unknown>[]) =>
                  patchState(store, (s) => ({
                    documents: {
                      ...s.documents,
                      items,
                      totalElements: items.length,
                      totalPages: 1,
                      loading: false,
                    },
                  })),
                error: (err: HttpErrorResponse) =>
                  patchState(store, (s) => ({
                    documents: {
                      ...s.documents,
                      loading: false,
                      error: resolveHttpErrorMessage(
                        err,
                        'Erreur lors du chargement des documents archivés',
                      ),
                    },
                  })),
              }),
            ),
          ),
        ),
      ),

      loadTicketDetail: rxMethod<string>(
        pipe(
          tap(() =>
            patchState(store, {
              selectedItem: null,
              selectedItemLoading: true,
              selectedItemError: null,
            }),
          ),
          exhaustMap((ticketId) =>
            getArchivedById(http, apiConfig.rootUrl, { ticketId }).pipe(
              map((r) => extractItemData(r.body)),
              tapResponse({
                next: (item) =>
                  patchState(store, {
                    selectedItem: item,
                    selectedItemLoading: false,
                  }),
                error: (err: HttpErrorResponse) =>
                  patchState(store, {
                    selectedItemLoading: false,
                    selectedItemError: resolveHttpErrorMessage(
                      err,
                      'Erreur lors du chargement du détail',
                    ),
                  }),
              }),
            ),
          ),
        ),
      ),

      loadTenantDetail: rxMethod<string>(
        pipe(
          tap(() =>
            patchState(store, {
              selectedItem: null,
              selectedItemLoading: true,
              selectedItemError: null,
            }),
          ),
          exhaustMap((id) =>
            getArchivedById1(http, apiConfig.rootUrl, { id }).pipe(
              map((r) => extractItemData(r.body)),
              tapResponse({
                next: (item) =>
                  patchState(store, {
                    selectedItem: item,
                    selectedItemLoading: false,
                  }),
                error: (err: HttpErrorResponse) =>
                  patchState(store, {
                    selectedItemLoading: false,
                    selectedItemError: resolveHttpErrorMessage(
                      err,
                      'Erreur lors du chargement du détail',
                    ),
                  }),
              }),
            ),
          ),
        ),
      ),

      loadPaymentDetail: rxMethod<string>(
        pipe(
          tap(() =>
            patchState(store, {
              selectedItem: null,
              selectedItemLoading: true,
              selectedItemError: null,
            }),
          ),
          exhaustMap((id) =>
            getArchivedById2(http, apiConfig.rootUrl, { id }).pipe(
              map((r) => extractItemData(r.body)),
              tapResponse({
                next: (item) =>
                  patchState(store, {
                    selectedItem: item,
                    selectedItemLoading: false,
                  }),
                error: (err: HttpErrorResponse) =>
                  patchState(store, {
                    selectedItemLoading: false,
                    selectedItemError: resolveHttpErrorMessage(
                      err,
                      'Erreur lors du chargement du détail',
                    ),
                  }),
              }),
            ),
          ),
        ),
      ),

      setDetailItem(item: Record<string, unknown>): void {
        patchState(store, {
          selectedItem: item,
          selectedItemLoading: false,
          selectedItemError: null,
        });
      },

      clearDetail(): void {
        patchState(store, {
          selectedItem: null,
          selectedItemLoading: false,
          selectedItemError: null,
        });
      },

      restoreBien: rxMethod<string>(
        pipe(
          tap(() =>
            patchState(store, { restoreStatus: 'pending', restoreError: null }),
          ),
          exhaustMap((id) =>
            restore2(http, apiConfig.rootUrl, { id }).pipe(
              tapResponse({
                next: () => patchState(store, { restoreStatus: 'success' }),
                error: (err: HttpErrorResponse) =>
                  patchState(store, {
                    restoreStatus: 'error',
                    restoreError: resolveHttpErrorMessage(
                      err,
                      'Erreur lors de la restauration du bien',
                    ),
                  }),
              }),
            ),
          ),
        ),
      ),

      restoreLocataire: rxMethod<string>(
        pipe(
          tap(() =>
            patchState(store, { restoreStatus: 'pending', restoreError: null }),
          ),
          exhaustMap((id) =>
            restore1(http, apiConfig.rootUrl, { id }).pipe(
              tapResponse({
                next: () => patchState(store, { restoreStatus: 'success' }),
                error: (err: HttpErrorResponse) =>
                  patchState(store, {
                    restoreStatus: 'error',
                    restoreError: resolveHttpErrorMessage(
                      err,
                      'Erreur lors de la restauration du locataire',
                    ),
                  }),
              }),
            ),
          ),
        ),
      ),

      restoreFacture: rxMethod<string>(
        pipe(
          tap(() =>
            patchState(store, { restoreStatus: 'pending', restoreError: null }),
          ),
          exhaustMap((id) =>
            restore3(http, apiConfig.rootUrl, { id }).pipe(
              tapResponse({
                next: () => patchState(store, { restoreStatus: 'success' }),
                error: (err: HttpErrorResponse) =>
                  patchState(store, {
                    restoreStatus: 'error',
                    restoreError: resolveHttpErrorMessage(
                      err,
                      'Erreur lors de la restauration de la facture',
                    ),
                  }),
              }),
            ),
          ),
        ),
      ),

      restoreTicket: rxMethod<string>(
        pipe(
          tap(() =>
            patchState(store, { restoreStatus: 'pending', restoreError: null }),
          ),
          exhaustMap((ticketId) =>
            restore(http, apiConfig.rootUrl, { ticketId }).pipe(
              tapResponse({
                next: () => patchState(store, { restoreStatus: 'success' }),
                error: (err: HttpErrorResponse) =>
                  patchState(store, {
                    restoreStatus: 'error',
                    restoreError: resolveHttpErrorMessage(
                      err,
                      'Erreur lors de la restauration du ticket',
                    ),
                  }),
              }),
            ),
          ),
        ),
      ),

      restoreDocumentItem: rxMethod<RestoreDocumentParams>(
        pipe(
          tap(() =>
            patchState(store, { restoreStatus: 'pending', restoreError: null }),
          ),
          exhaustMap(({ propertyId, docId }) =>
            restoreDocument(http, apiConfig.rootUrl, {
              id: propertyId,
              docId,
            }).pipe(
              tapResponse({
                next: () => patchState(store, { restoreStatus: 'success' }),
                error: (err: HttpErrorResponse) =>
                  patchState(store, {
                    restoreStatus: 'error',
                    restoreError: resolveHttpErrorMessage(
                      err,
                      'Erreur lors de la restauration du document',
                    ),
                  }),
              }),
            ),
          ),
        ),
      ),

      setRestoreIdle(): void {
        patchState(store, { restoreStatus: 'idle', restoreError: null });
      },
    }),
  ),
);

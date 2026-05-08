import { inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { tapResponse } from '@ngrx/operators';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import {
  addDocument,
  addMedia,
  ApiConfiguration,
  BailleurApplicationResponse,
  create2,
  deleteDocument,
  deleteMedia,
  findAllByType,
  LaCodeListDto,
  listByAgency,
  PropertyCreateRequest,
  PropertyDocumentResponse,
  PropertyMediaResponse,
  PresignedUrlResponse,
  PropertyResponse,
  setCover,
  submit,
  uploadMedia,
} from '@ubax-workspace/shared-api-types';
import { storageApiConfig } from '../../api-configs/storage.config';
import { EMPTY, exhaustMap, forkJoin, map, pipe, switchMap, tap } from 'rxjs';

export type BienCreationState = {
  propertyId: string | null;
  property: PropertyResponse | null;
  medias: PropertyMediaResponse[];
  documents: PropertyDocumentResponse[];
  bailleurs: BailleurApplicationResponse[];
  codeListPropertyTypes: LaCodeListDto[];
  codeListTransactionTypes: LaCodeListDto[];
  codeListCities: LaCodeListDto[];
  codeListAmenities: LaCodeListDto[];
  codeListDocumentTypes: LaCodeListDto[];
  lastPresignedDocument: PresignedUrlResponse | null;
  documentUploadStage: 'idle' | 'presigning' | 'uploading' | 'registering';
  saving: boolean;
  error: string | null;
};

const initialState: BienCreationState = {
  propertyId: null,
  property: null,
  medias: [],
  documents: [],
  bailleurs: [],
  codeListPropertyTypes: [],
  codeListTransactionTypes: [],
  codeListCities: [],
  codeListAmenities: [],
  codeListDocumentTypes: [],
  lastPresignedDocument: null,
  documentUploadStage: 'idle',
  saving: false,
  error: null,
};

function extractList<T>(body: unknown): T[] {
  if (Array.isArray(body)) return body as T[];
  if (body && typeof body === 'object') {
    const b = body as { data?: unknown; content?: unknown };
    if (Array.isArray(b.data)) return b.data as T[];
    if (Array.isArray(b.content)) return b.content as T[];
    if (b.data && typeof b.data === 'object') {
      const nested = (b.data as { content?: unknown }).content;
      if (Array.isArray(nested)) return nested as T[];
    }
  }
  return [];
}

function extractHttpErrorMessage(err: HttpErrorResponse): string {
  const raw = err.error as unknown;

  if (typeof raw === 'string' && raw.trim().length > 0) {
    return raw;
  }

  if (raw && typeof raw === 'object') {
    const obj = raw as Record<string, unknown>;
    const message = obj['message'];
    const detail = obj['detail'];
    const error = obj['error'];

    if (typeof message === 'string' && message.trim().length > 0) {
      return message;
    }
    if (typeof detail === 'string' && detail.trim().length > 0) {
      return detail;
    }
    if (typeof error === 'string' && error.trim().length > 0) {
      return error;
    }
  }

  return err.message;
}

function extractProperty(body: unknown): PropertyResponse {
  if (body && typeof body === 'object') {
    const obj = body as { data?: unknown };
    if (obj.data && typeof obj.data === 'object') {
      return obj.data as PropertyResponse;
    }
    return body as PropertyResponse;
  }

  return {} as PropertyResponse;
}

function extractEntity<T>(body: unknown): T | null {
  if (!body || typeof body !== 'object') return null;

  const obj = body as { data?: unknown };
  const source = obj.data ?? body;

  return source && typeof source === 'object' ? (source as T) : null;
}

type ReadyPresignedUpload = PresignedUrlResponse & {
  uploadUrl: string;
  publicUrl: string;
};

function hasValidPresignedUpload(
  payload: PresignedUrlResponse | null,
): payload is ReadyPresignedUpload {
  return (
    typeof payload?.uploadUrl === 'string' &&
    payload.uploadUrl.length > 0 &&
    typeof payload?.publicUrl === 'string' &&
    payload.publicUrl.length > 0
  );
}

function requestPresignedPropertyDocumentUpload(
  http: HttpClient,
  rootUrl: string,
  params: { propertyId: string; fileName: string; contentType: string },
) {
  return http
    .get<unknown>(`${rootUrl}/v1/storage/presign/property-document`, {
      params,
    })
    .pipe(map((body) => extractEntity<PresignedUrlResponse>(body)));
}

export const BienCreationStore = signalStore(
  withState(initialState),
  withMethods(
    (
      store,
      http = inject(HttpClient),
      apiConfig = inject(ApiConfiguration),
    ) => ({
      reset(): void {
        patchState(store, initialState);
      },

      chargerReferentiels: rxMethod<void>(
        pipe(
          tap(() => patchState(store, { error: null })),
          exhaustMap(() =>
            forkJoin({
              propertyTypes: findAllByType(http, apiConfig.rootUrl, {
                type: 'PROPERTY_TYPE',
              }).pipe(map((r) => extractList<LaCodeListDto>(r.body))),
              transactionTypes: findAllByType(http, apiConfig.rootUrl, {
                type: 'TRANSACTION_TYPE',
              }).pipe(map((r) => extractList<LaCodeListDto>(r.body))),
              cities: findAllByType(http, apiConfig.rootUrl, {
                type: 'CITY',
              }).pipe(map((r) => extractList<LaCodeListDto>(r.body))),
              amenities: findAllByType(http, apiConfig.rootUrl, {
                type: 'PROPERTY_AMENITY',
              }).pipe(map((r) => extractList<LaCodeListDto>(r.body))),
              documentTypes: findAllByType(http, apiConfig.rootUrl, {
                type: 'PROPERTY_DOCUMENT_TYPE',
              }).pipe(map((r) => extractList<LaCodeListDto>(r.body))),
              bailleurs: listByAgency(http, apiConfig.rootUrl, {
                size: 200,
              }).pipe(
                map((r) => extractList<BailleurApplicationResponse>(r.body)),
              ),
            }).pipe(
              tapResponse({
                next: ({
                  propertyTypes,
                  transactionTypes,
                  cities,
                  amenities,
                  documentTypes,
                  bailleurs,
                }) =>
                  patchState(store, {
                    codeListPropertyTypes: propertyTypes,
                    codeListTransactionTypes: transactionTypes,
                    codeListCities: cities,
                    codeListAmenities: amenities,
                    codeListDocumentTypes: documentTypes,
                    bailleurs,
                  }),
                error: (err: HttpErrorResponse) =>
                  patchState(store, { error: err.message }),
              }),
            ),
          ),
        ),
      ),

      creerBrouillon: rxMethod<PropertyCreateRequest>(
        pipe(
          tap(() => patchState(store, { saving: true, error: null })),
          exhaustMap((body) =>
            create2(http, apiConfig.rootUrl, { body }).pipe(
              map((r) => extractProperty(r.body)),
              tapResponse({
                next: (property: PropertyResponse) =>
                  patchState(store, {
                    propertyId: property.id ?? null,
                    property,
                    saving: false,
                  }),
                error: (err: HttpErrorResponse) =>
                  patchState(store, {
                    saving: false,
                    error: extractHttpErrorMessage(err),
                  }),
              }),
            ),
          ),
        ),
      ),

      uploaderMediaDirect: rxMethod<{
        file: File;
        mediaType: 'PHOTO' | 'VIDEO' | 'PLAN';
        cover?: boolean;
      }>(
        pipe(
          tap(() => patchState(store, { saving: true, error: null })),
          exhaustMap(({ file, mediaType, cover }) => {
            const propertyId = store.propertyId();
            if (!propertyId) return EMPTY;
            return uploadMedia(http, apiConfig.rootUrl, {
              id: propertyId,
              mediaType,
              cover: cover ?? false,
              body: { file },
            }).pipe(
              map((r) => extractEntity<PropertyMediaResponse>(r.body)),
              tapResponse({
                next: (media: PropertyMediaResponse | null) => {
                  if (!media) {
                    patchState(store, {
                      saving: false,
                      error: "Réponse média invalide après l'upload.",
                    });
                    return;
                  }

                  patchState(store, (s) => ({
                    medias: [...s.medias, media],
                    saving: false,
                  }));
                },
                error: (err: HttpErrorResponse) =>
                  patchState(store, { saving: false, error: err.message }),
              }),
            );
          }),
        ),
      ),

      uploaderMediaPresign: rxMethod<{
        file: File;
        mediaType: 'PHOTO' | 'VIDEO' | 'PLAN';
      }>(
        pipe(
          tap(() => patchState(store, { saving: true, error: null })),
          exhaustMap(({ file, mediaType }) => {
            const propertyId = store.propertyId();
            if (!propertyId) return EMPTY;
            return storageApiConfig
              .presignPropertyMedia(http, apiConfig.rootUrl, {
                propertyId,
                contentType: file.type,
              })
              .pipe(
                map((r) => extractEntity<PresignedUrlResponse>(r.body)),
                switchMap((presign) => {
                  if (!hasValidPresignedUpload(presign)) {
                    patchState(store, {
                      saving: false,
                      error:
                        "Impossible d'obtenir une URL d'upload média valide.",
                    });
                    return EMPTY;
                  }

                  return http
                    .put(presign.uploadUrl, file, {
                      headers: { 'Content-Type': file.type },
                    })
                    .pipe(
                      switchMap(() =>
                        addMedia(http, apiConfig.rootUrl, {
                          id: propertyId,
                          body: {
                            cover: false,
                            fileName: file.name,
                            fileSize: file.size,
                            fileUrl: presign.publicUrl,
                            mediaType,
                            mimeType: file.type,
                          },
                        }),
                      ),
                      map((r) => extractEntity<PropertyMediaResponse>(r.body)),
                    );
                }),
                tapResponse({
                  next: (media: PropertyMediaResponse | null) => {
                    if (!media) {
                      patchState(store, {
                        saving: false,
                        error: "Réponse média invalide après l'upload.",
                      });
                      return;
                    }

                    patchState(store, (s) => ({
                      medias: [...s.medias, media],
                      saving: false,
                    }));
                  },
                  error: (err: HttpErrorResponse) =>
                    patchState(store, { saving: false, error: err.message }),
                }),
              );
          }),
        ),
      ),

      definirCouverture: rxMethod<string>(
        pipe(
          tap(() => patchState(store, { saving: true, error: null })),
          exhaustMap((mediaId) => {
            const propertyId = store.propertyId();
            if (!propertyId) return EMPTY;
            return setCover(http, apiConfig.rootUrl, {
              id: propertyId,
              mediaId,
            }).pipe(
              tapResponse({
                next: () =>
                  patchState(store, (s) => ({
                    medias: s.medias.map((m) => ({
                      ...m,
                      cover: m.id === mediaId,
                    })),
                    saving: false,
                  })),
                error: (err: HttpErrorResponse) =>
                  patchState(store, { saving: false, error: err.message }),
              }),
            );
          }),
        ),
      ),

      supprimerMedia: rxMethod<string>(
        pipe(
          tap(() => patchState(store, { saving: true, error: null })),
          exhaustMap((mediaId) => {
            const propertyId = store.propertyId();
            if (!propertyId) return EMPTY;
            return deleteMedia(http, apiConfig.rootUrl, {
              id: propertyId,
              mediaId,
            }).pipe(
              tapResponse({
                next: () =>
                  patchState(store, (s) => ({
                    medias: s.medias.filter((m) => m.id !== mediaId),
                    saving: false,
                  })),
                error: (err: HttpErrorResponse) =>
                  patchState(store, { saving: false, error: err.message }),
              }),
            );
          }),
        ),
      ),

      uploaderDocument: rxMethod<{
        file: File;
        docType: string;
        title: string;
      }>(
        pipe(
          tap(() =>
            patchState(store, {
              saving: true,
              error: null,
              documentUploadStage: 'presigning',
            }),
          ),
          exhaustMap(({ file, docType, title }) => {
            const propertyId = store.propertyId();
            if (!propertyId) return EMPTY;
            return requestPresignedPropertyDocumentUpload(
              http,
              apiConfig.rootUrl,
              {
                propertyId,
                fileName: file.name,
                contentType: file.type,
              },
            ).pipe(
              tap((presign) =>
                patchState(store, {
                  lastPresignedDocument: presign ?? null,
                  documentUploadStage: presign ? 'uploading' : 'idle',
                }),
              ),
              switchMap((presign) => {
                if (!hasValidPresignedUpload(presign)) {
                  patchState(store, {
                    saving: false,
                    documentUploadStage: 'idle',
                    error:
                      "Impossible d'obtenir une URL présignée valide pour le document.",
                  });
                  return EMPTY;
                }

                return http
                  .put(presign.uploadUrl, file, {
                    headers: { 'Content-Type': file.type },
                  })
                  .pipe(
                    tap(() =>
                      patchState(store, {
                        documentUploadStage: 'registering',
                      }),
                    ),
                    switchMap(() =>
                      addDocument(http, apiConfig.rootUrl, {
                        id: propertyId,
                        body: {
                          docType,
                          title,
                          fileName: file.name,
                          fileSize: file.size,
                          fileUrl: presign.publicUrl,
                          mimeType: file.type,
                        },
                      }),
                    ),
                    map((r) => extractEntity<PropertyDocumentResponse>(r.body)),
                  );
              }),
              tapResponse({
                next: (doc: PropertyDocumentResponse | null) => {
                  if (!doc) {
                    patchState(store, {
                      saving: false,
                      documentUploadStage: 'idle',
                      error: 'Réponse document invalide après upload.',
                    });
                    return;
                  }

                  patchState(store, {
                    documents: [...store.documents(), doc],
                    documentUploadStage: 'idle',
                    saving: false,
                  });
                },
                error: (err: HttpErrorResponse) =>
                  patchState(store, {
                    saving: false,
                    documentUploadStage: 'idle',
                    error: extractHttpErrorMessage(err),
                  }),
              }),
            );
          }),
        ),
      ),

      supprimerDocument: rxMethod<string>(
        pipe(
          tap(() => patchState(store, { saving: true, error: null })),
          exhaustMap((documentId) => {
            const propertyId = store.propertyId();
            if (!propertyId) return EMPTY;
            return deleteDocument(http, apiConfig.rootUrl, {
              id: propertyId,
              docId: documentId,
            }).pipe(
              tapResponse({
                next: () =>
                  patchState(store, (s) => ({
                    documents: s.documents.filter((d) => d.id !== documentId),
                    saving: false,
                  })),
                error: (err: HttpErrorResponse) =>
                  patchState(store, { saving: false, error: err.message }),
              }),
            );
          }),
        ),
      ),

      soumettre: rxMethod<void>(
        pipe(
          tap(() => patchState(store, { saving: true, error: null })),
          exhaustMap(() => {
            const propertyId = store.propertyId();
            if (!propertyId) return EMPTY;
            return submit(http, apiConfig.rootUrl, { id: propertyId }).pipe(
              map((r) => extractEntity<PropertyResponse>(r.body) ?? r.body),
              tapResponse({
                next: (property: PropertyResponse) =>
                  patchState(store, { property, saving: false }),
                error: (err: HttpErrorResponse) =>
                  patchState(store, { saving: false, error: err.message }),
              }),
            );
          }),
        ),
      ),
    }),
  ),
);

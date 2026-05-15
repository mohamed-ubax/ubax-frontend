import { inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { tapResponse } from '@ngrx/operators';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import {
  addDocument,
  addMedia,
  ApiConfiguration,
  create4,
  deleteDocument,
  deleteMedia,
  findAllByType,
  LaCodeListDto,
  presignPropertyMedia,
  PropertyDocumentResponse,
  PropertyCreateRequest,
  PropertyMediaResponse,
  PropertyResponse,
  PresignedUrlResponse,
  setCover,
  submit,
  uploadMedia,
} from '@ubax-workspace/shared-api-types';
import { resolveHttpErrorMessage } from '@ubax-workspace/shared-data-access';
import { EMPTY, exhaustMap, forkJoin, map, pipe, switchMap, tap } from 'rxjs';

export type EspaceCreationState = {
  propertyId: string | null;
  property: PropertyResponse | null;
  medias: PropertyMediaResponse[];
  documents: PropertyDocumentResponse[];
  codeListPropertyTypes: LaCodeListDto[];
  codeListBedTypes: LaCodeListDto[];
  codeListMealPlans: LaCodeListDto[];
  codeListPaymentFrequencies: LaCodeListDto[];
  codeListTransactionTypes: LaCodeListDto[];
  codeListPropertyConditions: LaCodeListDto[];
  codeListAmenities: LaCodeListDto[];
  codeListCities: LaCodeListDto[];
  codeListDocumentTypes: LaCodeListDto[];
  lastPresignedDocument: PresignedUrlResponse | null;
  documentUploadStage: 'idle' | 'presigning' | 'uploading' | 'registering';
  codeListsLoading: boolean;
  saving: boolean;
  error: string | null;
  mediaUploadProgress: Record<string, number>;
};

const initialState: EspaceCreationState = {
  propertyId: null,
  property: null,
  medias: [],
  documents: [],
  codeListPropertyTypes: [],
  codeListBedTypes: [],
  codeListMealPlans: [],
  codeListPaymentFrequencies: [],
  codeListTransactionTypes: [],
  codeListPropertyConditions: [],
  codeListAmenities: [],
  codeListCities: [],
  codeListDocumentTypes: [],
  lastPresignedDocument: null,
  documentUploadStage: 'idle',
  codeListsLoading: false,
  saving: false,
  error: null,
  mediaUploadProgress: {},
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


function extractProperty(body: unknown): PropertyResponse {
  if (body && typeof body === 'object') {
    const obj = body as { data?: unknown };
    if (obj.data && typeof obj.data === 'object')
      return obj.data as PropertyResponse;
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

function markCoverMedia(
  medias: PropertyMediaResponse[],
  mediaId: string,
): PropertyMediaResponse[] {
  return medias.map((media) => ({
    ...media,
    cover: media.id === mediaId,
  }));
}

function removeMediaById(
  medias: PropertyMediaResponse[],
  mediaId: string,
): PropertyMediaResponse[] {
  return medias.filter((media) => media.id !== mediaId);
}

/**
 * EspaceCreationStore — gestion de la création d'un espace hôtelier.
 *
 * Couvre les tâches :
 *   SCRUM-194 (FE-704) — Créer un espace : POST /v1/properties
 *   SCRUM-197 (FE-707) — Uploader des médias : POST /v1/properties/{id}/media/upload
 *   SCRUM-198 (FE-708) — Définir la couverture : PATCH /v1/properties/{id}/media/{mediaId}/cover
 *   SCRUM-199 (FE-709) — Supprimer un média : DELETE /v1/properties/{id}/media/{mediaId}
 *
 * Contraintes hôtelières :
 *   - transactionType toujours RENT_FURNISHED (pré-sélectionné, non modifiable)
 *   - propertyType limité à ROOM | SUITE | CONFERENCE_ROOM | APARTMENT
 *   - price = tarif par nuit en XOF
 */
export const EspaceCreationStore = signalStore(
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

      hydrateExistingDraftContext(payload: {
        propertyId: string;
        property: PropertyResponse | null;
        medias: PropertyMediaResponse[];
        documents: PropertyDocumentResponse[];
      }): void {
        patchState(store, {
          propertyId: payload.propertyId,
          property: payload.property,
          medias: payload.medias,
          documents: payload.documents,
          saving: false,
          error: null,
          documentUploadStage: 'idle',
        });
      },

      /**
       * Charge les référentiels nécessaires à la création d'un espace.
       */
      chargerReferentiels: rxMethod<void>(
        pipe(
          tap(() => patchState(store, { error: null, codeListsLoading: true })),
          exhaustMap(() =>
            forkJoin({
              propertyTypes: findAllByType(http, apiConfig.rootUrl, {
                type: 'PROPERTY_TYPE',
              }).pipe(map((r) => extractList<LaCodeListDto>(r.body))),
              bedTypes: findAllByType(http, apiConfig.rootUrl, {
                type: 'BED_TYPE',
              }).pipe(map((r) => extractList<LaCodeListDto>(r.body))),
              mealPlans: findAllByType(http, apiConfig.rootUrl, {
                type: 'MEAL_PLAN',
              }).pipe(map((r) => extractList<LaCodeListDto>(r.body))),
              paymentFrequencies: findAllByType(http, apiConfig.rootUrl, {
                type: 'PAYMENT_FREQUENCY',
              }).pipe(map((r) => extractList<LaCodeListDto>(r.body))),
              transactionTypes: findAllByType(http, apiConfig.rootUrl, {
                type: 'TRANSACTION_TYPE',
              }).pipe(map((r) => extractList<LaCodeListDto>(r.body))),
              propertyConditions: findAllByType(http, apiConfig.rootUrl, {
                type: 'PROPERTY_CONDITION',
              }).pipe(map((r) => extractList<LaCodeListDto>(r.body))),
              amenities: findAllByType(http, apiConfig.rootUrl, {
                type: 'PROPERTY_AMENITY',
              }).pipe(map((r) => extractList<LaCodeListDto>(r.body))),
              cities: findAllByType(http, apiConfig.rootUrl, {
                type: 'CITY',
              }).pipe(map((r) => extractList<LaCodeListDto>(r.body))),
              documentTypes: findAllByType(http, apiConfig.rootUrl, {
                type: 'PROPERTY_DOCUMENT_TYPE',
              }).pipe(map((r) => extractList<LaCodeListDto>(r.body))),
            }).pipe(
              tapResponse({
                next: ({
                  propertyTypes,
                  bedTypes,
                  mealPlans,
                  paymentFrequencies,
                  transactionTypes,
                  propertyConditions,
                  amenities,
                  cities,
                  documentTypes,
                }) =>
                  patchState(store, {
                    codeListPropertyTypes: propertyTypes,
                    codeListBedTypes: bedTypes,
                    codeListMealPlans: mealPlans,
                    codeListPaymentFrequencies: paymentFrequencies,
                    codeListTransactionTypes: transactionTypes,
                    codeListPropertyConditions: propertyConditions,
                    codeListAmenities: amenities,
                    codeListCities: cities,
                    codeListDocumentTypes: documentTypes,
                    codeListsLoading: false,
                  }),
                error: (err: HttpErrorResponse) =>
                  patchState(store, {
                    codeListsLoading: false,
                    error: resolveHttpErrorMessage(err, 'Erreur lors de la sauvegarde de l\'espace'),
                  }),
              }),
            ),
          ),
        ),
      ),

      /**
       * Alias conservé pour compatibilité avec les composants existants.
       */
      chargerVilles: rxMethod<void>(
        pipe(
          tap(() => patchState(store, { error: null })),
          exhaustMap(() =>
            findAllByType(http, apiConfig.rootUrl, { type: 'CITY' }).pipe(
              map((r) => extractList<LaCodeListDto>(r.body)),
              tapResponse({
                next: (cities) => patchState(store, { codeListCities: cities }),
                error: (err: HttpErrorResponse) =>
                  patchState(store, { error: resolveHttpErrorMessage(err, 'Erreur lors de la sauvegarde de l\'espace') }),
              }),
            ),
          ),
        ),
      ),

      /**
       * Crée un espace en statut DRAFT.
       * Endpoint : POST /v1/properties
       * transactionType est forcé à RENT_FURNISHED.
       */
      creerEspace: rxMethod<PropertyCreateRequest>(
        pipe(
          tap(() => patchState(store, { saving: true, error: null })),
          exhaustMap((body) =>
            create4(http, apiConfig.rootUrl, {
              body,
            }).pipe(
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
                    error: resolveHttpErrorMessage(err, 'Erreur lors de la sauvegarde de l\'espace'),
                  }),
              }),
            ),
          ),
        ),
      ),

      /**
       * Upload direct multipart d'un média.
       * Endpoint : POST /v1/properties/{id}/media/upload
       * Recommandé pour fichiers ≤ 50 Mo.
       */
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
                  patchState(store, { saving: false, error: resolveHttpErrorMessage(err, 'Erreur lors de la sauvegarde de l\'espace') }),
              }),
            );
          }),
        ),
      ),

      /**
       * Upload via presigned URL (recommandé web / fichiers volumineux).
       * Étape 1 : GET /v1/storage/presign/property-media
       * Étape 2 : PUT {uploadUrl}
       * Étape 3 : POST /v1/properties/{id}/media
       */
      uploaderMediaPresign: rxMethod<{
        file: File;
        mediaType: 'PHOTO' | 'VIDEO' | 'PLAN';
      }>(
        pipe(
          tap(() => patchState(store, { saving: true, error: null })),
          exhaustMap(({ file, mediaType }) => {
            const propertyId = store.propertyId();
            if (!propertyId) return EMPTY;
            return presignPropertyMedia(http, apiConfig.rootUrl, {
              propertyId,
              contentType: file.type,
            }).pipe(
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
                  patchState(store, { saving: false, error: resolveHttpErrorMessage(err, 'Erreur lors de la sauvegarde de l\'espace') }),
              }),
            );
          }),
        ),
      ),

      /**
       * Définit un média comme photo de couverture.
       * Endpoint : PATCH /v1/properties/{propertyId}/media/{mediaId}/cover
       * L'ancienne couverture est automatiquement désactivée côté backend.
       */
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
                    medias: markCoverMedia(s.medias, mediaId),
                    saving: false,
                  })),
                error: (err: HttpErrorResponse) =>
                  patchState(store, { saving: false, error: resolveHttpErrorMessage(err, 'Erreur lors de la sauvegarde de l\'espace') }),
              }),
            );
          }),
        ),
      ),

      /**
       * Supprime un média (fichier MinIO + entrée DB).
       * Endpoint : DELETE /v1/properties/{propertyId}/media/{mediaId}
       */
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
                    medias: removeMediaById(s.medias, mediaId),
                    saving: false,
                  })),
                error: (err: HttpErrorResponse) =>
                  patchState(store, { saving: false, error: resolveHttpErrorMessage(err, 'Erreur lors de la sauvegarde de l\'espace') }),
              }),
            );
          }),
        ),
      ),

      /**
       * Upload d'un document légal via URL présignée.
       * Étapes: presign -> upload storage -> rattachement du document.
       */
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
                    error: resolveHttpErrorMessage(err, 'Erreur lors de la sauvegarde de l\'espace'),
                  }),
              }),
            );
          }),
        ),
      ),

      /**
       * Supprime un document légal déjà rattaché au bien.
       */
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
                  patchState(store, { saving: false, error: resolveHttpErrorMessage(err, 'Erreur lors de la sauvegarde de l\'espace') }),
              }),
            );
          }),
        ),
      ),

      /**
       * Soumet l'espace à la modération (DRAFT → PENDING).
       * Endpoint : POST /v1/properties/{id}/submit
       */
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
                  patchState(store, { saving: false, error: resolveHttpErrorMessage(err, 'Erreur lors de la sauvegarde de l\'espace') }),
              }),
            );
          }),
        ),
      ),
    }),
  ),
);

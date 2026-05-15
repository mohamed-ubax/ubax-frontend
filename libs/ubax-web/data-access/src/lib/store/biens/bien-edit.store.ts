import { inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { tapResponse } from '@ngrx/operators';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { withApiResource, resolveHttpErrorMessage } from '@ubax-workspace/shared-data-access';
import {
  ApiConfiguration,
  findAllByType,
  getById,
  LaCodeListDto,
  PropertyResponse,
  update,
} from '@ubax-workspace/shared-api-types';
import { exhaustMap, forkJoin, map, pipe, tap } from 'rxjs';

export type BienEditState = {
  codeListPropertyTypes: LaCodeListDto[];
  codeListTransactionTypes: LaCodeListDto[];
  codeListCities: LaCodeListDto[];
  codeListAmenities: LaCodeListDto[];
  codeListDocumentTypes: LaCodeListDto[];
  medias: Array<{ id: string; fileUrl: string; cover?: boolean }>;
  documents: Array<{ id: string; name: string; fileUrl: string }>;
  saving: boolean;
  error: string | null;
  loading: boolean;
};

const initialState: BienEditState = {
  codeListPropertyTypes: [],
  codeListTransactionTypes: [],
  codeListCities: [],
  codeListAmenities: [],
  codeListDocumentTypes: [],
  medias: [],
  documents: [],
  saving: false,
  error: null,
  loading: false,
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
    if (obj.data && typeof obj.data === 'object') {
      return obj.data as PropertyResponse;
    }
    return body as PropertyResponse;
  }
  return {} as PropertyResponse;
}

function selectPropertyId(property: PropertyResponse): string {
  return (
    property.id ??
    `${property.title ?? 'property'}-${property.createdAt ?? 'unknown'}`
  );
}

export const BienEditStore = signalStore(
  withApiResource<
    PropertyResponse,
    undefined,
    typeof getById,
    undefined,
    undefined,
    undefined
  >({
    getById: getById,
    idSelector: selectPropertyId,
    mapGetById: (raw: unknown) => extractProperty(raw),
  }),
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
            }).pipe(
              tapResponse({
                next: ({
                  propertyTypes,
                  transactionTypes,
                  cities,
                  amenities,
                  documentTypes,
                }) =>
                  patchState(store, {
                    codeListPropertyTypes: propertyTypes,
                    codeListTransactionTypes: transactionTypes,
                    codeListCities: cities,
                    codeListAmenities: amenities,
                    codeListDocumentTypes: documentTypes,
                  }),
                error: (err: HttpErrorResponse) =>
                  patchState(store, { error: resolveHttpErrorMessage(err, 'Erreur lors du chargement') }),
              }),
            ),
          ),
        ),
      ),

      updateProperty: rxMethod<Record<string, unknown>>(
        pipe(
          tap(({ id, ...rest }) =>
            patchState(store, { saving: true, error: null }),
          ),
          exhaustMap(({ id, ...body }) =>
            update(http, apiConfig.rootUrl, {
              id: String(id ?? ''),
              body,
            }).pipe(
              tapResponse({
                next: () => {
                  patchState(store, { saving: false });
                },
                error: (err: HttpErrorResponse) =>
                  patchState(store, {
                    saving: false,
                    error: resolveHttpErrorMessage(err, 'Erreur lors de la modification'),
                  }),
              }),
            ),
          ),
        ),
      ),
    }),
  ),
);

import { inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { tapResponse } from '@ngrx/operators';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import {
  ApiConfiguration,
  findAllByType,
  getById1 as getPropertyById,
  LaCodeListDto,
  update,
} from '@ubax-workspace/shared-api-types';
import { resolveHttpErrorMessage } from '@ubax-workspace/shared-data-access';
import { EMPTY, exhaustMap, forkJoin, map, pipe, tap } from 'rxjs';

export type EspaceEditState = {
  espace: Record<string, unknown> | null;
  codeListPropertyTypes: LaCodeListDto[];
  codeListBedTypes: LaCodeListDto[];
  codeListMealPlans: LaCodeListDto[];
  codeListPaymentFrequencies: LaCodeListDto[];
  codeListPropertyConditions: LaCodeListDto[];
  codeListAmenities: LaCodeListDto[];
  codeListCities: LaCodeListDto[];
  saving: boolean;
  loading: boolean;
  error: string | null;
};

const initialState: EspaceEditState = {
  espace: null,
  codeListPropertyTypes: [],
  codeListBedTypes: [],
  codeListMealPlans: [],
  codeListPaymentFrequencies: [],
  codeListPropertyConditions: [],
  codeListAmenities: [],
  codeListCities: [],
  saving: false,
  loading: false,
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

function extractEntity(body: unknown): Record<string, unknown> | null {
  if (!body || typeof body !== 'object') {
    return null;
  }

  const source = (body as { data?: unknown }).data ?? body;
  return source && typeof source === 'object'
    ? (source as Record<string, unknown>)
    : null;
}

export const EspaceEditStore = signalStore(
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

      loadEspace: rxMethod<unknown>(
        pipe(
          tap(() => patchState(store, { loading: true, error: null })),
          exhaustMap((idParam) => {
            let id = '';
            if (typeof idParam === 'string') {
              id = idParam;
            } else if (
              typeof idParam === 'object' &&
              idParam !== null &&
              'id' in idParam
            ) {
              const idValue = (idParam as { id?: unknown }).id;
              if (typeof idValue === 'string') {
                id = idValue;
              }
            }

            if (!id) {
              patchState(store, {
                loading: false,
                error: 'Identifiant espace introuvable',
              });
              return EMPTY;
            }

            return getPropertyById(http, apiConfig.rootUrl, { id }).pipe(
              tapResponse({
                next: (resp) =>
                  patchState(store, {
                    espace: extractEntity(resp.body),
                    loading: false,
                  }),
                error: (err: HttpErrorResponse) =>
                  patchState(store, {
                    loading: false,
                    error: resolveHttpErrorMessage(
                      err,
                      "Erreur lors de la mise à jour de l'espace",
                    ),
                  }),
              }),
            );
          }),
        ),
      ),

      loadCodeLists: rxMethod<void>(
        pipe(
          tap(() => patchState(store, { loading: true, error: null })),
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
              propertyConditions: findAllByType(http, apiConfig.rootUrl, {
                type: 'PROPERTY_CONDITION',
              }).pipe(map((r) => extractList<LaCodeListDto>(r.body))),
              amenities: findAllByType(http, apiConfig.rootUrl, {
                type: 'PROPERTY_AMENITY',
              }).pipe(map((r) => extractList<LaCodeListDto>(r.body))),
              cities: findAllByType(http, apiConfig.rootUrl, {
                type: 'CITY',
              }).pipe(map((r) => extractList<LaCodeListDto>(r.body))),
            }).pipe(
              tapResponse({
                next: ({
                  propertyTypes,
                  bedTypes,
                  mealPlans,
                  paymentFrequencies,
                  propertyConditions,
                  amenities,
                  cities,
                }) =>
                  patchState(store, {
                    codeListPropertyTypes: propertyTypes,
                    codeListBedTypes: bedTypes,
                    codeListMealPlans: mealPlans,
                    codeListPaymentFrequencies: paymentFrequencies,
                    codeListPropertyConditions: propertyConditions,
                    codeListAmenities: amenities,
                    codeListCities: cities,
                    loading: false,
                  }),
                error: (err: HttpErrorResponse) =>
                  patchState(store, {
                    loading: false,
                    error: resolveHttpErrorMessage(
                      err,
                      "Erreur lors de la mise à jour de l'espace",
                    ),
                  }),
              }),
            ),
          ),
        ),
      ),

      updateEspace: rxMethod<Record<string, unknown>>(
        pipe(
          tap(() => patchState(store, { saving: true, error: null })),
          exhaustMap((payload) => {
            const id = String(payload['id'] ?? '');
            const { id: _ignored, ...body } = payload;

            if (!id) {
              patchState(store, {
                saving: false,
                error: 'Identifiant espace introuvable',
              });
              return EMPTY;
            }

            return update(http, apiConfig.rootUrl, {
              id,
              body,
            }).pipe(
              tapResponse({
                next: () =>
                  patchState(store, {
                    saving: false,
                  }),
                error: (err: HttpErrorResponse) =>
                  patchState(store, {
                    saving: false,
                    error: resolveHttpErrorMessage(
                      err,
                      "Erreur lors de la mise à jour de l'espace",
                    ),
                  }),
              }),
            );
          }),
        ),
      ),
    }),
  ),
);

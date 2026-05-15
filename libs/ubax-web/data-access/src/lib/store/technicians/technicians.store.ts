import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { computed, inject } from '@angular/core';
import { tapResponse } from '@ngrx/operators';
import {
  patchState,
  signalStore,
  withComputed,
  withMethods,
  withState,
} from '@ngrx/signals';
import {
  addEntity,
  removeEntity,
  setAllEntities,
  updateEntity,
} from '@ngrx/signals/entities';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import {
  resolveHttpErrorMessage,
  withApiResource,
} from '@ubax-workspace/shared-data-access';
import {
  ApiConfiguration,
  create2,
  CreateTechnicienRequest,
  delete$,
  findAllByType,
  getById,
  LaCodeListDto,
  list1,
  List1$Params,
  Pageable,
  toggleAvailability,
  upload,
  update,
  UpdateTechnicienRequest,
} from '@ubax-workspace/shared-api-types';
import { catchError, exhaustMap, map, of, pipe, switchMap, tap } from 'rxjs';

export type Technician = {
  id: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
  avatarUrl?: string;
  profession?: string;
  address?: string;
  available: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type TechnicianProfessionOption = {
  value: string;
  label: string;
  description: string;
};

type TechniciansState = {
  professionCodeList: LaCodeListDto[];
  professionCodeListLoading: boolean;
  professionCodeListError: string | null;
};

type SaveTechnicianRequest = CreateTechnicienRequest & {
  avatarFile?: File;
};

type UpdateTechnicianPayload = UpdateTechnicienRequest & {
  avatarFile?: File;
};

const DEFAULT_PAGEABLE: Pageable = {
  page: 0,
  size: 100,
  sort: ['createdAt,desc'],
};

const initialTechniciansState: TechniciansState = {
  professionCodeList: [],
  professionCodeListLoading: false,
  professionCodeListError: null,
};

function readString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0
    ? value.trim()
    : undefined;
}

function readBoolean(value: unknown): boolean | null {
  return typeof value === 'boolean' ? value : null;
}

function extractResponseData(body: unknown): unknown {
  if (!body || typeof body !== 'object') {
    return body;
  }

  if ('data' in (body as Record<string, unknown>)) {
    return (body as Record<string, unknown>)['data'];
  }

  return body;
}

function extractContentArray(body: unknown): unknown[] {
  const data = extractResponseData(body);

  if (Array.isArray(data)) {
    return data;
  }

  if (data && typeof data === 'object') {
    const record = data as Record<string, unknown>;

    for (const key of ['content', 'results', 'items']) {
      const collection = record[key];

      if (Array.isArray(collection)) {
        return collection;
      }
    }
  }

  return [];
}

function normalizeTechnician(raw: unknown, fallbackId?: string): Technician {
  const record =
    raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};

  return {
    id:
      readString(record['id']) ??
      readString(record['technicianId']) ??
      fallbackId ??
      '',
    firstName: readString(record['firstName']),
    lastName: readString(record['lastName']),
    phone: readString(record['phone']),
    email: readString(record['email']),
    avatarUrl: readString(record['avatarUrl']),
    profession: readString(record['profession']),
    address: readString(record['address']),
    available:
      readBoolean(record['available']) ??
      readBoolean(record['isAvailable']) ??
      readBoolean(record['active']) ??
      true,
    createdAt: readString(record['createdAt']),
    updatedAt: readString(record['updatedAt']),
  };
}

function mapTechnicianListResponse(body: unknown): Technician[] {
  return extractContentArray(body)
    .map((item) => normalizeTechnician(item))
    .filter((item) => item.id.length > 0);
}

function mapTechnicianResponse(
  body: unknown,
  requestedId?: string,
): Technician {
  return normalizeTechnician(extractResponseData(body), requestedId);
}

function extractCodeListFromResponse(body: unknown): LaCodeListDto[] {
  if (Array.isArray(body)) {
    return body as LaCodeListDto[];
  }

  const data = extractResponseData(body);

  if (Array.isArray(data)) {
    return data as LaCodeListDto[];
  }

  if (data && typeof data === 'object') {
    const content = (data as Record<string, unknown>)['content'];
    if (Array.isArray(content)) {
      return content as LaCodeListDto[];
    }
  }

  return [];
}

function readProfessionValue(item: LaCodeListDto): string | null {
  const candidate = item.value?.trim() || item.id?.trim() || '';
  return candidate.length > 0 ? candidate : null;
}

function readProfessionLabel(item: LaCodeListDto): string {
  return (
    item.description?.trim() || item.value?.trim() || item.id?.trim() || 'Autre'
  );
}

function uploadTechnicianAvatar(
  http: HttpClient,
  rootUrl: string,
  avatarFile?: File,
) {
  if (!avatarFile) {
    return of<string | undefined>(undefined);
  }

  return upload(http, rootUrl, {
    bucket: 'users-avatars',
    body: { file: avatarFile },
  }).pipe(
    map((response) => readString(response.body?.fileUrl) ?? undefined),
    catchError(() => of(undefined)),
  );
}

export const TechniciansStore = signalStore(
  { providedIn: 'root' },
  withApiResource<Technician, typeof list1, typeof getById>({
    list: list1,
    getById,
    buildGetByIdParams: (id) => ({ id }),
    mapList: mapTechnicianListResponse,
    mapGetById: mapTechnicianResponse,
  }),
  withState(initialTechniciansState),
  withComputed(({ entities, professionCodeList }) => ({
    availableTechnicians: computed(() =>
      entities().filter((technician) => technician.available),
    ),
    professionOptions: computed<readonly TechnicianProfessionOption[]>(() =>
      professionCodeList()
        .map((item) => {
          const value = readProfessionValue(item);

          if (!value) {
            return null;
          }

          const label = readProfessionLabel(item);

          return {
            value,
            label,
            description: label,
          } satisfies TechnicianProfessionOption;
        })
        .filter((item): item is TechnicianProfessionOption => item !== null),
    ),
  })),
  withMethods(
    (
      store,
      http = inject(HttpClient),
      apiConfig = inject(ApiConfiguration),
    ) => {
      const selectTechnicianId = (entity: Technician) => entity.id;
      const setSavingState = () =>
        patchState(store, { saving: true, error: null });
      const handleSaveError = (
        error: HttpErrorResponse,
        fallbackMessage: string,
      ) =>
        patchState(store, {
          saving: false,
          error: resolveHttpErrorMessage(error, fallbackMessage),
        });
      const handleCreateSuccess = (technician: Technician) =>
        patchState(
          store,
          addEntity(technician, { selectId: selectTechnicianId }),
          { saving: false },
        );
      const handleUpdateSuccess = (technician: Technician) =>
        patchState(
          store,
          updateEntity({ id: technician.id, changes: technician }),
          { saving: false },
        );
      const handleCreateError = (error: HttpErrorResponse) =>
        handleSaveError(error, 'Erreur lors de la création du technicien');
      const handleUpdateError = (error: HttpErrorResponse) =>
        handleSaveError(error, 'Erreur lors de la mise à jour du technicien');

      return {
        loadProfessions: rxMethod<void>(
          pipe(
            tap(() =>
              patchState(store, {
                professionCodeListLoading: true,
                professionCodeListError: null,
              }),
            ),
            exhaustMap(() =>
              findAllByType(http, apiConfig.rootUrl, {
                type: 'TECHNICIEN_PROFESSION',
              }).pipe(
                map((response) => extractCodeListFromResponse(response.body)),
                tapResponse({
                  next: (professionCodeList: LaCodeListDto[]) =>
                    patchState(store, {
                      professionCodeList,
                      professionCodeListLoading: false,
                      professionCodeListError: null,
                    }),
                  error: (error: HttpErrorResponse) =>
                    patchState(store, {
                      professionCodeListLoading: false,
                      professionCodeListError: resolveHttpErrorMessage(
                        error,
                        'Erreur lors du chargement des professions technicien',
                      ),
                    }),
                }),
              ),
            ),
          ),
        ),

        createTechnician: rxMethod<SaveTechnicianRequest>(
          pipe(
            tap(setSavingState),
            exhaustMap(({ avatarFile, ...body }) =>
              uploadTechnicianAvatar(http, apiConfig.rootUrl, avatarFile).pipe(
                map((avatarUrl) => ({
                  ...body,
                  avatarUrl: avatarUrl ?? body.avatarUrl,
                })),
                switchMap((preparedBody) =>
                  create2(http, apiConfig.rootUrl, { body: preparedBody }).pipe(
                    map((response) => mapTechnicianResponse(response.body)),
                    tapResponse({
                      next: handleCreateSuccess,
                      error: handleCreateError,
                    }),
                  ),
                ),
              ),
            ),
          ),
        ),

        updateTechnician: rxMethod<{
          id: string;
          body: UpdateTechnicianPayload;
        }>(
          pipe(
            tap(setSavingState),
            exhaustMap(({ id, body }) => {
              const { avatarFile, ...nextBody } = body;

              return uploadTechnicianAvatar(
                http,
                apiConfig.rootUrl,
                avatarFile,
              ).pipe(
                map((avatarUrl) => ({
                  ...nextBody,
                  avatarUrl: avatarUrl ?? nextBody.avatarUrl,
                })),
                switchMap((preparedBody) =>
                  update(http, apiConfig.rootUrl, {
                    id,
                    body: preparedBody,
                  }).pipe(
                    map((response) => mapTechnicianResponse(response.body, id)),
                    tapResponse({
                      next: handleUpdateSuccess,
                      error: handleUpdateError,
                    }),
                  ),
                ),
              );
            }),
          ),
        ),

        toggleTechnicianAvailability: rxMethod<string>(
          pipe(
            tap(() => patchState(store, { saving: true, error: null })),
            exhaustMap((id) =>
              toggleAvailability(http, apiConfig.rootUrl, { id }).pipe(
                map((response) => mapTechnicianResponse(response.body, id)),
                tapResponse({
                  next: (technician: Technician) =>
                    patchState(
                      store,
                      updateEntity({ id: technician.id, changes: technician }),
                      { saving: false },
                    ),
                  error: (error: HttpErrorResponse) =>
                    patchState(store, {
                      saving: false,
                      error: resolveHttpErrorMessage(
                        error,
                        'Erreur lors du changement de disponibilite',
                      ),
                    }),
                }),
              ),
            ),
          ),
        ),

        archiveTechnician: rxMethod<string>(
          pipe(
            tap(() => patchState(store, { saving: true, error: null })),
            exhaustMap((id) =>
              delete$(http, apiConfig.rootUrl, { id }).pipe(
                tapResponse({
                  next: () =>
                    patchState(store, removeEntity(id), { saving: false }),
                  error: (error: HttpErrorResponse) =>
                    patchState(store, {
                      saving: false,
                      error: resolveHttpErrorMessage(
                        error,
                        'Erreur lors de l archivage du technicien',
                      ),
                    }),
                }),
              ),
            ),
          ),
        ),

        replaceAllTechnicians(technicians: Technician[]): void {
          patchState(
            store,
            setAllEntities(technicians, {
              selectId: (entity: Technician) => entity.id,
            }),
          );
        },

        defaultListParams(available?: boolean): List1$Params {
          return {
            available,
            pageable: DEFAULT_PAGEABLE,
          };
        },
      };
    },
  ),
);

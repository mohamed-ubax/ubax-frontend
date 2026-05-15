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
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import {
  addEntity,
  removeEntity,
  setAllEntities,
} from '@ngrx/signals/entities';
import {
  UbaxScope,
  withApiResource,
  resolveHttpErrorMessage,
} from '@ubax-workspace/shared-data-access';
import {
  addMember,
  addMember1,
  AddTeamMemberRequest,
  AdminUserResponse,
  ApiConfiguration,
  assignSubRoles,
  assignSubRoles1,
  AssignSubRolesRequest,
  findAllByType,
  getByKeycloakId,
  getSubRoles,
  getSubRoles1,
  getTeamMembers,
  getTeamMembers1,
  LaCodeListDto,
  removeMember,
  removeMember1,
  revokeSubRole,
  revokeSubRole1,
  StorageUploadResponse,
  upload,
} from '@ubax-workspace/shared-api-types';
import {
  catchError,
  exhaustMap,
  from,
  map,
  mergeMap,
  Observable,
  of,
  pipe,
  switchMap,
  tap,
} from 'rxjs';
import {
  mapTeamList,
  readResolvedTeamMemberRoles,
  readTeamMemberActive,
  resolveTeamMemberId,
  teamMemberIdSelector,
  extractSubRolesFromTeamResponse,
  extractAvatarUrlsFromTeamResponse,
  type TeamMemberSubRolesMap,
} from '../team/team-member.helpers';

type MemberLoadingState = Record<string, boolean>;
type MemberErrorState = Record<string, string | null>;

type AgencyStoreState = {
  filterRole: string | null;
  memberSubRoles: TeamMemberSubRolesMap;
  memberSubRolesLoading: MemberLoadingState;
  memberSubRolesError: MemberErrorState;
  codelistRoles: LaCodeListDto[];
  codelistRolesLoading: boolean;
  codelistRolesError: string | null;
  currentUserDbId: string | null;
  teamScope: UbaxScope | null;
  memberAvatars: Record<string, string>;
};

const initialAgencyStoreState: AgencyStoreState = {
  filterRole: null,
  memberSubRoles: {},
  memberSubRolesLoading: {},
  memberSubRolesError: {},
  codelistRoles: [],
  codelistRolesLoading: false,
  codelistRolesError: null,
  currentUserDbId: null,
  teamScope: null,
  memberAvatars: {},
};

function extractStringArray(data: unknown): string[] {
  if (!Array.isArray(data)) {
    return [];
  }

  // Handle array of strings directly
  const stringItems = data.filter(
    (item): item is string => typeof item === 'string',
  );
  if (stringItems.length > 0) return stringItems;

  // Handle array of objects with 'role' property (API returns [{ role: 'DIRECTEUR_AGENCE', ... }])
  const roleItems = data
    .filter(
      (item) => typeof item === 'object' && item !== null && 'role' in item,
    )
    .map((item) => (item as { role: unknown }).role)
    .filter((role): role is string => typeof role === 'string');
  return roleItems;
}

function setMemberRoles(
  current: TeamMemberSubRolesMap,
  userId: string,
  roles: readonly string[],
): TeamMemberSubRolesMap {
  return {
    ...current,
    [userId]: [...roles],
  };
}

function setMemberLoading(
  current: MemberLoadingState,
  userId: string,
  loading: boolean,
): MemberLoadingState {
  return {
    ...current,
    [userId]: loading,
  };
}

function setMemberError(
  current: MemberErrorState,
  userId: string,
  error: string | null,
): MemberErrorState {
  return {
    ...current,
    [userId]: error,
  };
}

function mergeUniqueRoles(
  current: readonly string[],
  next: readonly string[],
): string[] {
  return Array.from(new Set([...current, ...next]));
}

function removeMemberKey<T extends Record<string, unknown>>(
  current: T,
  userId: string,
): T {
  const { [userId]: _removed, ...rest } = current;
  return rest as T;
}

function parseResponseBody(body: unknown): Observable<unknown> {
  if (typeof Blob === 'undefined' || !(body instanceof Blob)) {
    return of(body);
  }

  return from(
    body
      .text()
      .then((text) => {
        const trimmed = text.trim();
        if (!trimmed) {
          return {};
        }

        try {
          return JSON.parse(trimmed) as unknown;
        } catch {
          return {};
        }
      })
      .catch(() => ({})),
  );
}

function mapPartnerTypeToScope(partnerType: unknown): UbaxScope | null {
  if (typeof partnerType !== 'string') {
    return null;
  }

  const normalized = partnerType.trim().toUpperCase();

  if (normalized === 'HOTEL') {
    return 'HOTEL';
  }

  if (
    normalized === 'AGENCE_IMMOBILIERE' ||
    normalized === 'AGENCE' ||
    normalized === 'IMMOBILIER'
  ) {
    return 'AGENCE';
  }

  return null;
}

function isHotelScope(scope: UbaxScope): boolean {
  return scope === 'HOTEL';
}

export const AgencyStore = signalStore(
  { providedIn: 'root' },
  withApiResource<AdminUserResponse>({
    idSelector: teamMemberIdSelector,
  }),
  withState(initialAgencyStoreState),
  withComputed(({ entities, filterRole, memberSubRoles, codelistRoles }) => ({
    membresActifs: computed(() => entities().filter(readTeamMemberActive)),
    membresFiltres: computed(() => {
      const role = filterRole();

      if (!role) {
        return entities();
      }

      const cachedSubRoles = memberSubRoles();

      return entities().filter((member) =>
        readResolvedTeamMemberRoles(member, cachedSubRoles).includes(role),
      );
    }),
    totalMembres: computed(() => entities().length),
    codelistRoleOptions: computed(() =>
      codelistRoles()
        .filter((item) => !!item.id)
        .map((item) => ({
          id: item.id as string,
          value: item.value ?? '',
          label: item.description ?? item.value ?? '',
        })),
    ),
  })),
  withMethods(
    (
      store,
      http = inject(HttpClient),
      apiConfig = inject(ApiConfiguration),
    ) => {
      const resolveScope = (scope?: UbaxScope | null): UbaxScope =>
        scope ?? store.teamScope() ?? 'AGENCE';

      const getTeamRequest = (scope: UbaxScope) =>
        isHotelScope(scope)
          ? getTeamMembers(http, apiConfig.rootUrl, {})
          : getTeamMembers1(http, apiConfig.rootUrl, {});

      const getSubRolesRequest = (scope: UbaxScope, userId: string) =>
        isHotelScope(scope)
          ? getSubRoles(http, apiConfig.rootUrl, { userId })
          : getSubRoles1(http, apiConfig.rootUrl, { userId });

      const addMemberRequest = (
        scope: UbaxScope,
        body: AddTeamMemberRequest,
      ) =>
        isHotelScope(scope)
          ? addMember(http, apiConfig.rootUrl, { body })
          : addMember1(http, apiConfig.rootUrl, { body });

      const assignSubRolesRequest = (
        scope: UbaxScope,
        userId: string,
        roles: readonly string[],
      ) =>
        isHotelScope(scope)
          ? assignSubRoles(http, apiConfig.rootUrl, {
              userId,
              body: [...roles],
            })
          : assignSubRoles1(http, apiConfig.rootUrl, {
              userId,
              body: [...roles],
            });

      const revokeSubRoleRequest = (
        scope: UbaxScope,
        userId: string,
        role: string,
      ) =>
        isHotelScope(scope)
          ? revokeSubRole(http, apiConfig.rootUrl, { userId, role })
          : revokeSubRole1(http, apiConfig.rootUrl, { userId, role });

      const removeMemberRequest = (scope: UbaxScope, userId: string) =>
        isHotelScope(scope)
          ? removeMember(http, apiConfig.rootUrl, { userId })
          : removeMember1(http, apiConfig.rootUrl, { userId });

      return {
        setFilterRole(role: string | null): void {
          patchState(store, { filterRole: role });
        },

        reset(): void {
          patchState(
            store,
            setAllEntities<AdminUserResponse>([], {
              selectId: teamMemberIdSelector,
            }),
            {
              filterRole: null,
              memberSubRoles: {},
              memberSubRolesLoading: {},
              memberSubRolesError: {},
              codelistRoles: [],
              codelistRolesLoading: false,
              codelistRolesError: null,
              currentUserDbId: null,
              teamScope: null,
              memberAvatars: {},
            },
          );
        },

        load: rxMethod<{ scope?: UbaxScope }>(
          pipe(
            tap(() => patchState(store, { loading: true, error: null })),
            exhaustMap((params) => {
              const scope = resolveScope(params?.scope);
              const request = getTeamRequest(scope);

              return request.pipe(
                mergeMap((response) => parseResponseBody(response.body)),
                switchMap((body) => {
                  const teamData =
                    body &&
                    typeof body === 'object' &&
                    'data' in (body as Record<string, unknown>)
                      ? (body as Record<string, unknown>)['data']
                      : body;
                  const members = mapTeamList(teamData);
                  const subRoles = extractSubRolesFromTeamResponse(teamData);
                  const avatarsFromResponse =
                    extractAvatarUrlsFromTeamResponse(teamData);

                  patchState(store, {
                    memberSubRoles: subRoles,
                    memberAvatars: avatarsFromResponse,
                    teamScope: scope,
                    loading: false,
                    error: null,
                  });

                  patchState(
                    store,
                    setAllEntities<AdminUserResponse>(members, {
                      selectId: teamMemberIdSelector,
                    }),
                  );

                  return of(null);
                }),
                catchError((err: HttpErrorResponse) => {
                  patchState(store, {
                    loading: false,
                    error: resolveHttpErrorMessage(
                      err,
                      'Erreur lors du chargement des membres',
                    ),
                  });
                  return of(null);
                }),
              );
            }),
          ),
        ),

        loadCodelistRoles: rxMethod<string>(
          pipe(
            tap(() =>
              patchState(store, {
                codelistRolesLoading: true,
                codelistRolesError: null,
              }),
            ),
            exhaustMap((type) =>
              findAllByType(http, apiConfig.rootUrl, { type }).pipe(
                map((response) => {
                  const body = response.body as unknown;
                  if (Array.isArray(body)) return body as LaCodeListDto[];
                  if (body && typeof body === 'object') {
                    const data = (body as Record<string, unknown>)['data'];
                    if (Array.isArray(data)) return data as LaCodeListDto[];
                  }
                  return [];
                }),
                tapResponse({
                  next: (roles) =>
                    patchState(store, {
                      codelistRoles: roles,
                      codelistRolesLoading: false,
                      codelistRolesError: null,
                    }),
                  error: (err: HttpErrorResponse) =>
                    patchState(store, {
                      codelistRoles: [],
                      codelistRolesLoading: false,
                      codelistRolesError: resolveHttpErrorMessage(
                        err,
                        'Erreur lors du chargement des rôles',
                      ),
                    }),
                }),
              ),
            ),
          ),
        ),

        loadMemberSubRoles: rxMethod<string>(
          pipe(
            tap((userId) => {
              if (!userId) {
                return;
              }

              patchState(store, {
                memberSubRolesLoading: setMemberLoading(
                  store.memberSubRolesLoading(),
                  userId,
                  true,
                ),
                memberSubRolesError: setMemberError(
                  store.memberSubRolesError(),
                  userId,
                  null,
                ),
              });
            }),
            mergeMap((userId) => {
              if (!userId) {
                return of([] as string[]);
              }

              const scope = resolveScope();
              const request = getSubRolesRequest(scope, userId);

              return request.pipe(
                map((response) => extractStringArray(response.body?.data)),
                tapResponse({
                  next: (subRoles) =>
                    patchState(store, {
                      memberSubRoles: setMemberRoles(
                        store.memberSubRoles(),
                        userId,
                        subRoles,
                      ),
                      memberSubRolesLoading: setMemberLoading(
                        store.memberSubRolesLoading(),
                        userId,
                        false,
                      ),
                      memberSubRolesError: setMemberError(
                        store.memberSubRolesError(),
                        userId,
                        null,
                      ),
                    }),
                  error: (err: HttpErrorResponse) =>
                    patchState(store, {
                      memberSubRoles: setMemberRoles(
                        store.memberSubRoles(),
                        userId,
                        [],
                      ),
                      memberSubRolesLoading: setMemberLoading(
                        store.memberSubRolesLoading(),
                        userId,
                        false,
                      ),
                      memberSubRolesError: setMemberError(
                        store.memberSubRolesError(),
                        userId,
                        resolveHttpErrorMessage(
                          err,
                          'Erreur lors du chargement des sous-rôles',
                        ),
                      ),
                    }),
                }),
              );
            }),
          ),
        ),

        inviterMembre: rxMethod<AddTeamMemberRequest & { avatarFile?: File }>(
          pipe(
            tap(() => patchState(store, { saving: true, error: null })),
            exhaustMap(
              (params: AddTeamMemberRequest & { avatarFile?: File }) => {
                const { avatarFile, ...body } = params;
                const scope = resolveScope();
                const request = addMemberRequest(scope, body);

                return request.pipe(
                  mergeMap((response) => parseResponseBody(response.body)),
                  map((parsed) => {
                    // La réponse est { data: AdminUserResponse, ... } (CustomResponse)
                    const raw = parsed as Record<string, unknown> | null;
                    const membre: AdminUserResponse =
                      raw?.['data'] && typeof raw['data'] === 'object'
                        ? raw['data']
                        : ((raw as AdminUserResponse) ?? {});
                    return membre;
                  }),
                  switchMap((membre: AdminUserResponse) => {
                    const memberId = resolveTeamMemberId(membre);

                    if (!avatarFile || !memberId) {
                      return of({ membre, avatarUrl: null });
                    }

                    return upload(http, apiConfig.rootUrl, {
                      bucket: 'users-avatars',
                      body: { file: avatarFile },
                    }).pipe(
                      map((res) => {
                        const uploadBody =
                          res.body as StorageUploadResponse | null;
                        return {
                          membre,
                          avatarUrl: uploadBody?.fileUrl ?? null,
                        };
                      }),
                      catchError(() => of({ membre, avatarUrl: null })),
                    );
                  }),
                  tapResponse({
                    next: ({
                      membre,
                      avatarUrl,
                    }: {
                      membre: AdminUserResponse;
                      avatarUrl: string | null;
                    }) => {
                      const memberId = resolveTeamMemberId(membre);

                      const nextAvatars =
                        memberId && avatarUrl
                          ? { ...store.memberAvatars(), [memberId]: avatarUrl }
                          : store.memberAvatars();

                      // Add new member directly to entities and update sub-roles cache
                      patchState(
                        store,
                        addEntity<AdminUserResponse>(membre, {
                          selectId: teamMemberIdSelector,
                        }),
                        {
                          saving: false,
                          memberAvatars: nextAvatars,
                          memberSubRoles: memberId
                            ? setMemberRoles(
                                store.memberSubRoles(),
                                memberId,
                                body.subRoles ?? [],
                              )
                            : store.memberSubRoles(),
                          memberSubRolesLoading: memberId
                            ? setMemberLoading(
                                store.memberSubRolesLoading(),
                                memberId,
                                false,
                              )
                            : store.memberSubRolesLoading(),
                          memberSubRolesError: memberId
                            ? setMemberError(
                                store.memberSubRolesError(),
                                memberId,
                                null,
                              )
                            : store.memberSubRolesError(),
                        },
                      );
                    },
                    error: (err: HttpErrorResponse) =>
                      patchState(store, {
                        saving: false,
                        error: resolveHttpErrorMessage(
                          err,
                          'Erreur lors de la mise à jour',
                        ),
                      }),
                  }),
                );
              },
            ),
          ),
        ),

        assignerSousRoles: rxMethod<{
          userId: string;
          body: AssignSubRolesRequest;
        }>(
          pipe(
            tap(() => patchState(store, { saving: true, error: null })),
            exhaustMap(({ userId, body }) => {
              const scope = resolveScope(body.scope ?? null);
              const request = assignSubRolesRequest(
                scope,
                userId,
                body.roles ?? [],
              );

              return request.pipe(
                tapResponse({
                  next: () =>
                    patchState(store, {
                      saving: false,
                      teamScope: scope,
                      memberSubRoles: setMemberRoles(
                        store.memberSubRoles(),
                        userId,
                        mergeUniqueRoles(
                          store.memberSubRoles()[userId] ?? [],
                          body.roles ?? [],
                        ),
                      ),
                      memberSubRolesError: setMemberError(
                        store.memberSubRolesError(),
                        userId,
                        null,
                      ),
                    }),
                  error: (err: HttpErrorResponse) =>
                    patchState(store, {
                      saving: false,
                      error: resolveHttpErrorMessage(
                        err,
                        'Erreur lors de la mise à jour',
                      ),
                    }),
                }),
              );
            }),
          ),
        ),

        revoquerSousRole: rxMethod<{ userId: string; role: string }>(
          pipe(
            tap(() => patchState(store, { saving: true, error: null })),
            exhaustMap(({ userId, role }) => {
              const scope = resolveScope();
              const request = revokeSubRoleRequest(scope, userId, role);

              return request.pipe(
                tapResponse({
                  next: () =>
                    patchState(store, {
                      saving: false,
                      memberSubRoles: setMemberRoles(
                        store.memberSubRoles(),
                        userId,
                        (store.memberSubRoles()[userId] ?? []).filter(
                          (item) => item !== role,
                        ),
                      ),
                      memberSubRolesError: setMemberError(
                        store.memberSubRolesError(),
                        userId,
                        null,
                      ),
                    }),
                  error: (err: HttpErrorResponse) =>
                    patchState(store, {
                      saving: false,
                      error: resolveHttpErrorMessage(
                        err,
                        'Erreur lors de la mise à jour',
                      ),
                    }),
                }),
              );
            }),
          ),
        ),

        desactiverMembre: rxMethod<string>(
          pipe(
            tap(() => patchState(store, { saving: true, error: null })),
            exhaustMap((userId) => {
              const scope = resolveScope();
              const request = removeMemberRequest(scope, userId);

              return request.pipe(
                tapResponse({
                  next: () =>
                    patchState(store, removeEntity(userId), {
                      saving: false,
                      memberSubRoles: removeMemberKey(
                        store.memberSubRoles(),
                        userId,
                      ),
                      memberSubRolesLoading: removeMemberKey(
                        store.memberSubRolesLoading(),
                        userId,
                      ),
                      memberSubRolesError: removeMemberKey(
                        store.memberSubRolesError(),
                        userId,
                      ),
                    }),
                  error: (err: HttpErrorResponse) =>
                    patchState(store, {
                      saving: false,
                      error: resolveHttpErrorMessage(
                        err,
                        'Erreur lors de la mise à jour',
                      ),
                    }),
                }),
              );
            }),
          ),
        ),

        loadCurrentUserDbId: rxMethod<string>(
          pipe(
            exhaustMap((keycloakId) =>
              getByKeycloakId(http, apiConfig.rootUrl, { keycloakId }).pipe(
                map((response) => {
                  const rawBody = response.body as Record<
                    string,
                    unknown
                  > | null;
                  const data =
                    rawBody &&
                    typeof rawBody === 'object' &&
                    rawBody['data'] &&
                    typeof rawBody['data'] === 'object'
                      ? (rawBody['data'] as Record<string, unknown>)
                      : rawBody;

                  const userId =
                    (typeof data?.['userId'] === 'string'
                      ? data['userId']
                      : null) ?? null;

                  const partnerType = data?.['partnerType'];
                  const partnerScopeFromType =
                    mapPartnerTypeToScope(partnerType);
                  let scopeFromIds: UbaxScope | null = null;
                  if (
                    typeof data?.['hotelId'] === 'string' &&
                    data['hotelId']
                  ) {
                    scopeFromIds = 'HOTEL';
                  } else if (
                    typeof data?.['agencyId'] === 'string' &&
                    data['agencyId']
                  ) {
                    scopeFromIds = 'AGENCE';
                  }

                  return {
                    userId,
                    teamScope: partnerScopeFromType ?? scopeFromIds,
                  };
                }),
                tapResponse({
                  next: ({ userId, teamScope }) => {
                    if (userId || teamScope) {
                      patchState(store, {
                        currentUserDbId: userId ?? store.currentUserDbId(),
                        teamScope: teamScope ?? store.teamScope(),
                      });
                    }
                  },
                  // eslint-disable-next-line @typescript-eslint/no-empty-function
                  error: () => {},
                }),
              ),
            ),
          ),
        ),
      };
    },
  ),
);

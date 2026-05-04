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
import { withApiResource } from '@ubax-workspace/shared-data-access';
import {
  addMember1,
  AddTeamMemberRequest,
  AdminUserResponse,
  ApiConfiguration,
  assignSubRoles1,
  AssignSubRolesRequest,
  findAllByType,
  getByKeycloakId,
  getSubRoles1,
  getTeamMembers1,
  LaCodeListDto,
  removeMember1,
  revokeSubRole1,
} from '@ubax-workspace/shared-api-types';
import {
  exhaustMap,
  from,
  map,
  mergeMap,
  Observable,
  of,
  pipe,
  tap,
} from 'rxjs';
import {
  mapTeamList,
  readResolvedTeamMemberRoles,
  readTeamMemberActive,
  resolveTeamMemberId,
  teamMemberIdSelector,
  extractSubRolesFromTeamResponse,
  type TeamMemberSubRolesMap,
} from '../team/team-member.helpers';

type MemberLoadingState = Record<string, boolean>;
type MemberErrorState = Record<string, string | null>;

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

export const AgencyStore = signalStore(
  { providedIn: 'root' },
  withApiResource<AdminUserResponse>({
    idSelector: teamMemberIdSelector,
  }),
  withState({
    filterRole: null as string | null,
    memberSubRoles: {} as TeamMemberSubRolesMap,
    memberSubRolesLoading: {} as MemberLoadingState,
    memberSubRolesError: {} as MemberErrorState,
    codelistRoles: [] as LaCodeListDto[],
    codelistRolesLoading: false,
    codelistRolesError: null as string | null,
    currentUserDbId: null as string | null,
  }),
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
    ) => ({
      setFilterRole(role: string | null): void {
        patchState(store, { filterRole: role });
      },

      load: rxMethod<Record<string, never>>(
        pipe(
          tap(() => patchState(store, { loading: true, error: null })),
          exhaustMap(() =>
            getTeamMembers1(http, apiConfig.rootUrl, {}).pipe(
              mergeMap((response) => parseResponseBody(response.body)),
              tapResponse({
                next: (body) => {
                  const teamData =
                    body &&
                    typeof body === 'object' &&
                    'data' in (body as Record<string, unknown>)
                      ? (body as Record<string, unknown>)['data']
                      : body;
                  const members = mapTeamList(teamData);
                  const subRoles = extractSubRolesFromTeamResponse(teamData);

                  patchState(store, {
                    memberSubRoles: subRoles,
                    loading: false,
                    error: null,
                  });

                  patchState(
                    store,
                    setAllEntities<AdminUserResponse>(members, {
                      selectId: teamMemberIdSelector,
                    }),
                  );
                },
                error: (err: HttpErrorResponse) =>
                  patchState(store, {
                    loading: false,
                    error: err.message,
                  }),
              }),
            ),
          ),
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
                    codelistRolesError: err.message,
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

            return getSubRoles1(http, apiConfig.rootUrl, { userId }).pipe(
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
                      err.message,
                    ),
                  }),
              }),
            );
          }),
        ),
      ),

      inviterMembre: rxMethod<AddTeamMemberRequest>(
        pipe(
          tap(() => patchState(store, { saving: true, error: null })),
          exhaustMap((body: AddTeamMemberRequest) =>
            addMember1(http, apiConfig.rootUrl, { body }).pipe(
              map((response) => response.body as AdminUserResponse),
              tapResponse({
                next: (membre: AdminUserResponse) => {
                  const memberId = resolveTeamMemberId(membre);

                  // Add new member directly to entities and update sub-roles cache
                  patchState(
                    store,
                    addEntity<AdminUserResponse>(membre, {
                      selectId: teamMemberIdSelector,
                    }),
                    {
                      saving: false,
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
                  patchState(store, { saving: false, error: err.message }),
              }),
            ),
          ),
        ),
      ),

      assignerSousRoles: rxMethod<{
        userId: string;
        body: AssignSubRolesRequest;
      }>(
        pipe(
          tap(() => patchState(store, { saving: true, error: null })),
          exhaustMap(({ userId, body }) =>
            assignSubRoles1(http, apiConfig.rootUrl, {
              userId,
              body: body.roles ?? [],
            }).pipe(
              tapResponse({
                next: () =>
                  patchState(store, {
                    saving: false,
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
                  patchState(store, { saving: false, error: err.message }),
              }),
            ),
          ),
        ),
      ),

      revoquerSousRole: rxMethod<{ userId: string; role: string }>(
        pipe(
          tap(() => patchState(store, { saving: true, error: null })),
          exhaustMap(({ userId, role }) =>
            revokeSubRole1(http, apiConfig.rootUrl, { userId, role }).pipe(
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
                  patchState(store, { saving: false, error: err.message }),
              }),
            ),
          ),
        ),
      ),

      desactiverMembre: rxMethod<string>(
        pipe(
          tap(() => patchState(store, { saving: true, error: null })),
          exhaustMap((userId) =>
            removeMember1(http, apiConfig.rootUrl, { userId }).pipe(
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
                  patchState(store, { saving: false, error: err.message }),
              }),
            ),
          ),
        ),
      ),

      loadCurrentUserDbId: rxMethod<string>(
        pipe(
          exhaustMap((keycloakId) =>
            getByKeycloakId(http, apiConfig.rootUrl, { keycloakId }).pipe(
              map(
                (response) =>
                  ((
                    (response.body as Record<string, unknown>)?.[
                      'data'
                    ] as Record<string, unknown>
                  )?.['userId'] as string) ??
                  ((response.body as { userId?: unknown })?.userId as string) ??
                  null,
              ),
              tapResponse({
                next: (userId) => {
                  if (userId) patchState(store, { currentUserDbId: userId });
                },
                // eslint-disable-next-line @typescript-eslint/no-empty-function
                error: () => {},
              }),
            ),
          ),
        ),
      ),
    }),
  ),
);

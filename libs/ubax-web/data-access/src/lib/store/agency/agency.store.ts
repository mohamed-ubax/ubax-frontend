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
import { addEntity } from '@ngrx/signals/entities';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
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
  revokeSubRole1,
} from '@ubax-workspace/shared-api-types';
import { exhaustMap, map, of, pipe, tap } from 'rxjs';
import {
  mapTeamList,
  readResolvedTeamMemberRoles,
  readTeamMemberActive,
  resolveTeamMemberId,
  teamMemberIdSelector,
  type TeamMemberSubRolesMap,
} from '../team/team-member.helpers';

type MemberLoadingState = Record<string, boolean>;
type MemberErrorState = Record<string, string | null>;

function extractStringArray(data: unknown): string[] {
  if (!Array.isArray(data)) {
    return [];
  }

  return data.filter((item): item is string => typeof item === 'string');
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

export const AgencyStore = signalStore(
  { providedIn: 'root' },
  withApiResource({
    list: getTeamMembers1,
    mapList: mapTeamList,
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
          exhaustMap((userId) => {
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

                  patchState(
                    store,
                    addEntity(membre, {
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

      loadCurrentUserDbId: rxMethod<string>(
        pipe(
          exhaustMap((keycloakId) =>
            getByKeycloakId(http, apiConfig.rootUrl, { keycloakId }).pipe(
              map((response) => response.body?.userId ?? null),
              tapResponse({
                next: (userId) => {
                  if (userId) patchState(store, { currentUserDbId: userId });
                },
                // eslint-disable-next-line @typescript-eslint/no-empty-function
                error: (_err: unknown) => {},
              }),
            ),
          ),
        ),
      ),
    }),
  ),
);

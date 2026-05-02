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
  getTeamMembers1,
  revokeSubRole1,
} from '@ubax-workspace/shared-api-types';
import { exhaustMap, map, pipe, tap } from 'rxjs';
import {
  mapTeamList,
  readTeamMemberActive,
  readTeamMemberRoles,
  teamMemberIdSelector,
} from '../team/team-member.helpers';

export const AgencyStore = signalStore(
  { providedIn: 'root' },
  withApiResource({
    list: getTeamMembers1,
    mapList: mapTeamList,
    idSelector: teamMemberIdSelector,
  }),
  withState({
    filterRole: null as string | null,
  }),
  withComputed(({ entities, filterRole }) => ({
    membresActifs: computed(() => entities().filter(readTeamMemberActive)),
    membresFiltres: computed(() => {
      const role = filterRole();
      if (!role) return entities();
      return entities().filter((member) =>
        readTeamMemberRoles(member).includes(role),
      );
    }),
    totalMembres: computed(() => entities().length),
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

      inviterMembre: rxMethod<AddTeamMemberRequest>(
        pipe(
          tap(() => patchState(store, { saving: true, error: null })),
          exhaustMap((body: AddTeamMemberRequest) =>
            addMember1(http, apiConfig.rootUrl, { body }).pipe(
              map((r) => r.body as AdminUserResponse),
              tapResponse({
                next: (membre: AdminUserResponse) =>
                  patchState(
                    store,
                    addEntity(membre, {
                      selectId: teamMemberIdSelector,
                    }),
                    { saving: false },
                  ),
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
                next: () => patchState(store, { saving: false }),
                error: (err: HttpErrorResponse) =>
                  patchState(store, { saving: false, error: err.message }),
              }),
            ),
          ),
        ),
      ),

      revoquerSousRole: rxMethod<{ userId: string; role: string }>(
        pipe(
          exhaustMap(({ userId, role }) =>
            revokeSubRole1(http, apiConfig.rootUrl, { userId, role }).pipe(
              tapResponse({
                next: () => undefined,
                error: (err: HttpErrorResponse) =>
                  patchState(store, { error: err.message }),
              }),
            ),
          ),
        ),
      ),
    }),
  ),
);

import { computed, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
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
  addMember,
  AddTeamMemberRequest,
  AdminUserResponse,
  ApiConfiguration,
  assignSubRoles,
  AssignSubRolesRequest,
  getTeamMembers,
  revokeSubRole,
} from '@ubax-workspace/shared-api-types';
import { exhaustMap, map, pipe, tap } from 'rxjs';
import {
  mapTeamList,
  readTeamMemberActive,
  readTeamMemberRoles,
  teamMemberIdSelector,
} from '../team/team-member.helpers';

/**
 * HotelStore — gestion de l'équipe hôtel.
 * Branché sur /v1/hotel/team (AdminUserResponse).
 *
 * Méthodes disponibles (héritées de withApiResource) :
 *   store.load()      — GET /v1/hotel/team
 *   store.select(id)  — sélection locale
 *
 * Méthodes spécifiques :
 *   store.inviterMembre(body)                     — POST /v1/hotel/team
 *   store.assignerSousRoles({ userId, body })     — POST /v1/hotel/team/:userId/sub-roles
 *   store.revoquerSousRole({ userId, role })      — DELETE /v1/hotel/team/:userId/sub-roles/:role
 */
export const HotelStore = signalStore(
  { providedIn: 'root' },
  withApiResource({
    list: getTeamMembers,
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
            addMember(http, apiConfig.rootUrl, { body }).pipe(
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
            assignSubRoles(http, apiConfig.rootUrl, {
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
            revokeSubRole(http, apiConfig.rootUrl, { userId, role }).pipe(
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

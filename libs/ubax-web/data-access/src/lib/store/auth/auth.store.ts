import { computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { tapResponse } from '@ngrx/operators';
import {
  patchState,
  signalStore,
  withComputed,
  withMethods,
  withState,
} from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { EMPTY, of, pipe, switchMap, tap } from 'rxjs';
import {
  AuthService,
  DEFAULT_UBAX_WEB_HOME_PATH,
  UbaxRole,
  UbaxScope,
  UbaxSubRole,
  clearStoredAuthSession,
  deriveUserFromAuthToken,
  persistAuthToken,
  readUserIdCandidatesFromAuthToken,
  readStoredRefreshToken,
  readStoredAuthToken,
  redirectBrowserToPortalLogin,
  type User,
} from '@ubax-workspace/shared-data-access';
import {
  pickPrimarySubRole,
  resolveWebHomePath,
} from '../../models/role-access.model';

const initialToken = readStoredAuthToken();

type AuthState = {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
};

const initialState: AuthState = {
  user: deriveUserFromAuthToken(initialToken),
  token: initialToken,
  loading: false,
  error: null,
};

/** Roles whose sub-roles live in the DB and must be fetched after login */
function needsSubRoles(mainRole: UbaxRole): boolean {
  return (
    mainRole === UbaxRole.PARTNER_ADMIN ||
    mainRole === UbaxRole.ADMIN ||
    mainRole === UbaxRole.SUPER_ADMIN
  );
}

function maybeRedirectToResolvedHome(router: Router, user: User | null): void {
  if (user?.mainRole !== UbaxRole.PARTNER_ADMIN || user.scope === null) {
    return;
  }

  const currentUrl = router.url.split('?')[0].split('#')[0];

  if (currentUrl !== '/' && currentUrl !== '/tableau-de-bord') {
    return;
  }

  const homePath = resolveWebHomePath(user);

  if (homePath !== currentUrl) {
    void router.navigateByUrl(homePath, { replaceUrl: true });
  }
}

export const AuthStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed(({ user, token }) => ({
    isAuthenticated: computed(() => !!token() && !!user()),
    mainRole: computed(() => user()?.mainRole ?? null),
    subRole: computed(() => user()?.subRole ?? null),
    scope: computed(() => user()?.scope ?? null),
    isSuperAdmin: computed(() => user()?.mainRole === UbaxRole.SUPER_ADMIN),
    isAdminOrSuperAdmin: computed(
      () =>
        user()?.mainRole === UbaxRole.ADMIN ||
        user()?.mainRole === UbaxRole.SUPER_ADMIN,
    ),
    isPartner: computed(() => user()?.mainRole === UbaxRole.PARTNER_ADMIN),
    fullName: computed(() => {
      const u = user();
      return u ? `${u.prenom} ${u.nom}` : '';
    }),
  })),

  // ── Bloc 1 : méthodes sync + loadSubRoles ─────────────────────────────────
  withMethods(
    (store, authSvc = inject(AuthService), router = inject(Router)) => ({
      setToken(token: string): void {
        persistAuthToken(token);
        patchState(store, {
          token,
          user: deriveUserFromAuthToken(token) ?? store.user(),
        });
      },

      setUser(user: User): void {
        patchState(store, { user });
      },

      /** Appelé après GET /auth/me/sub-roles pour hydrater le profil complet */
      setSubRole(subRole: UbaxSubRole | null, scope: UbaxScope | null): void {
        const currentUser = store.user();
        if (!currentUser) return;
        patchState(store, { user: { ...currentUser, subRole, scope } });
      },

      /** Vide la session sans appel réseau — utilisé par l'intercepteur en cas d'échec du refresh */
      expireSession(): void {
        clearStoredAuthSession();
        patchState(store, {
          user: null,
          token: null,
          error: 'Session expirée',
        });
        if (redirectBrowserToPortalLogin()) return;
        router.navigate(['/connexion']);
      },

      /**
       * Charge le scope et les sous-rôles depuis GET /auth/me/sub-roles.
       * Doit être dans ce bloc afin d'être visible par loadMe (bloc 2).
       * Échec silencieux : si l'endpoint n'est pas encore prêt, l'app continue
       * avec subRole = null — la navigation se base sur mainRole + scope jusqu'à
       * ce que les sous-rôles soient disponibles.
       */
      loadSubRoles: rxMethod<void>(
        pipe(
          switchMap(() => {
            const currentUser = store.user();

            if (!currentUser || !needsSubRoles(currentUser.mainRole)) {
              return EMPTY;
            }

            return authSvc
              .getMySubRoles(
                currentUser.mainRole,
                [
                  currentUser.id,
                  ...readUserIdCandidatesFromAuthToken(store.token()),
                ],
                currentUser.email,
              )
              .pipe(
                tapResponse({
                  next: ({ scope, subRoles }) => {
                    const latestUser = store.user();
                    if (!latestUser) return;

                    const subRole =
                      pickPrimarySubRole(subRoles) ??
                      (scope === 'UBAX_INTERNAL' &&
                      (latestUser.mainRole === UbaxRole.ADMIN ||
                        latestUser.mainRole === UbaxRole.SUPER_ADMIN)
                        ? UbaxSubRole.DIRECTEUR_GENERAL
                        : null);

                    const nextUser = { ...latestUser, subRole, scope };

                    patchState(store, {
                      user: nextUser,
                    });
                    maybeRedirectToResolvedHome(router, nextUser);
                  },
                  error: () => {
                    // Non-fatal : sub-roles indisponibles, on continue sans eux
                  },
                }),
              );
          }),
        ),
      ),
    }),
  ),

  // ── Bloc 2 : flux réseau qui dépendent de loadSubRoles ───────────────────
  withMethods(
    (store, authSvc = inject(AuthService), router = inject(Router)) => ({
      loadMe: rxMethod<void>(
        pipe(
          tap(() => {
            patchState(store, { loading: true, error: null });

            const derivedUser = deriveUserFromAuthToken(store.token());

            if (derivedUser) {
              patchState(store, {
                user: derivedUser,
                loading: false,
                error: null,
              });

              if (needsSubRoles(derivedUser.mainRole)) {
                store.loadSubRoles();
              }

              maybeRedirectToResolvedHome(router, derivedUser);

              return;
            }

            clearStoredAuthSession();
            patchState(store, {
              user: null,
              token: null,
              loading: false,
              error: 'Session expirée',
            });
            if (redirectBrowserToPortalLogin()) return;

            router.navigate(['/connexion'], {
              queryParams: { redirect: DEFAULT_UBAX_WEB_HOME_PATH },
            });
          }),
        ),
      ),

      logout: rxMethod<void>(
        pipe(
          switchMap(() => {
            const refreshToken = readStoredRefreshToken();

            return (
              refreshToken ? authSvc.logout(refreshToken) : of(void 0)
            ).pipe(
              tapResponse({
                next: () => {
                  clearStoredAuthSession();
                  patchState(store, { user: null, token: null });
                  if (redirectBrowserToPortalLogin()) return;
                  router.navigate(['/connexion'], {
                    queryParams: { redirect: DEFAULT_UBAX_WEB_HOME_PATH },
                  });
                },
                error: () => {
                  clearStoredAuthSession();
                  patchState(store, { user: null, token: null });
                  if (redirectBrowserToPortalLogin()) return;
                  router.navigate(['/connexion'], {
                    queryParams: { redirect: DEFAULT_UBAX_WEB_HOME_PATH },
                  });
                },
              }),
            );
          }),
        ),
      ),
    }),
  ),
);

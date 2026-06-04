import { computed, inject } from '@angular/core';
import { Location } from '@angular/common';
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
  type ResolvedUserProfile,
  UbaxRole,
  UbaxScope,
  UbaxSubRole,
  clearStoredAuthSession,
  clearResolvedProfile,
  deriveUserFromAuthToken,
  persistResolvedProfile,
  readKeycloakIdCandidatesFromAuthToken,
  readResolvedProfile,
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

function mergeResolvedProfile(
  currentUser: User,
  profile: ResolvedUserProfile,
): User {
  return {
    ...currentUser,
    id: profile.userId ?? currentUser.id,
    avatar: profile.avatarUrl ?? currentUser.avatar,
    scope: profile.scope ?? currentUser.scope,
  };
}

const initialToken = readStoredAuthToken();

type AuthState = {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  profileLoaded: boolean;
};

function buildInitialState(token: string | null): AuthState {
  const baseUser = deriveUserFromAuthToken(token);
  const keycloakSub = readKeycloakIdCandidatesFromAuthToken(token)[0] ?? null;
  const cached = keycloakSub ? readResolvedProfile(keycloakSub) : null;

  if (!baseUser || !cached) {
    return { user: baseUser, token, loading: false, error: null, profileLoaded: false };
  }

  return {
    token,
    loading: false,
    error: null,
    profileLoaded: true,
    user: {
      ...baseUser,
      id: cached.userId ?? baseUser.id,
      avatar: cached.avatarUrl ?? baseUser.avatar,
      scope: cached.scope,
      subRole: cached.subRole,
    },
  };
}

const initialState: AuthState = buildInitialState(initialToken);

/** Roles whose sub-roles live in the DB and must be fetched after login */
function needsSubRoles(mainRole: UbaxRole): boolean {
  return (
    mainRole === UbaxRole.PARTNER ||
    mainRole === UbaxRole.PARTNER_ADMIN ||
    mainRole === UbaxRole.ADMIN ||
    mainRole === UbaxRole.SUPER_ADMIN
  );
}

function maybeRedirectToResolvedHome(
  router: Router,
  location: Location,
  user: User | null,
): void {
  if (!user) return;

  const isPartner = user.mainRole === UbaxRole.PARTNER;
  const isPartnerAdmin = user.mainRole === UbaxRole.PARTNER_ADMIN;

  if (!isPartner && !isPartnerAdmin) {
    return;
  }

  // During APP_INITIALIZER, router.url is still '/' before initial navigation
  // completes. Location.path() reads window.location synchronously and returns
  // the actual browser path the user refreshed on.
  const currentUrl =
    location.path().split('?')[0].split('#')[0] ||
    router.url.split('?')[0].split('#')[0] ||
    '/';

  const isHotelContext = user.scope === 'HOTEL';
  const isAgencyContext = user.scope === 'AGENCE';
  const isOnHotelRoute = currentUrl.startsWith('/hotel');

  const isScopeMismatch =
    (isHotelContext && !isOnHotelRoute) || (isAgencyContext && isOnHotelRoute);

  const shouldRedirect =
    currentUrl === '/' || currentUrl === '/tableau-de-bord' || isScopeMismatch;

  if (!shouldRedirect) {
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
    isPartner: computed(() => user()?.mainRole === UbaxRole.PARTNER),
    fullName: computed(() => {
      const u = user();
      return u ? `${u.prenom} ${u.nom}` : '';
    }),
  })),

  // ── Bloc 1 : méthodes sync + loadSubRoles ─────────────────────────────────
  withMethods(
    (
      store,
      authSvc = inject(AuthService),
      router = inject(Router),
      location = inject(Location),
    ) => ({
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
        clearResolvedProfile();
        patchState(store, {
          user: null,
          token: null,
          error: 'Session expirée',
          profileLoaded: false,
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

            const userIdCandidates = Array.from(
              new Set([
                currentUser.id,
                ...readUserIdCandidatesFromAuthToken(store.token()),
              ]),
            );

            return authSvc
              .getMySubRoles(
                currentUser.mainRole,
                userIdCandidates,
                currentUser.email,
                currentUser.scope ?? null,
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

                    patchState(store, { user: nextUser });

                    const keycloakSub =
                      readKeycloakIdCandidatesFromAuthToken(store.token())[0] ?? null;
                    if (keycloakSub) {
                      persistResolvedProfile({
                        keycloakSub,
                        userId: nextUser.id,
                        scope: nextUser.scope,
                        avatarUrl: nextUser.avatar ?? null,
                        subRole: nextUser.subRole,
                      });
                    }

                    maybeRedirectToResolvedHome(router, location, nextUser);
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
    (
      store,
      authSvc = inject(AuthService),
      router = inject(Router),
      location = inject(Location),
    ) => ({
      loadMe: rxMethod<void>(
        pipe(
          switchMap(() => {
            // Idempotency guard: skip if profile was already fetched this session
            if (store.profileLoaded()) return EMPTY;

            patchState(store, { loading: true, error: null });

            const derivedUser = deriveUserFromAuthToken(store.token());

            if (derivedUser) {
              patchState(store, {
                user: derivedUser,
                error: null,
              });

              const keycloakId =
                readKeycloakIdCandidatesFromAuthToken(store.token())[0] ?? null;

              return (
                keycloakId
                  ? authSvc.getMyProfile(keycloakId)
                  : of({ userId: null, scope: null, avatarUrl: null })
              ).pipe(
                tapResponse({
                  next: (profile) => {
                    const latestUser = store.user() ?? derivedUser;
                    const hydratedUser = mergeResolvedProfile(
                      latestUser,
                      profile,
                    );

                    patchState(store, {
                      user: hydratedUser,
                      loading: false,
                      error: null,
                      profileLoaded: true,
                    });

                    if (needsSubRoles(hydratedUser.mainRole)) {
                      store.loadSubRoles();
                    } else if (keycloakId) {
                      persistResolvedProfile({
                        keycloakSub: keycloakId,
                        userId: hydratedUser.id,
                        scope: hydratedUser.scope,
                        avatarUrl: hydratedUser.avatar ?? null,
                        subRole: hydratedUser.subRole,
                      });
                    }

                    maybeRedirectToResolvedHome(router, location, hydratedUser);
                  },
                  error: () => {
                    patchState(store, {
                      loading: false,
                      error: null,
                      profileLoaded: true,
                    });

                    if (needsSubRoles(derivedUser.mainRole)) {
                      store.loadSubRoles();
                    }

                    maybeRedirectToResolvedHome(router, location, derivedUser);
                  },
                }),
              );
            }

            clearStoredAuthSession();
            patchState(store, {
              user: null,
              token: null,
              loading: false,
              error: 'Session expirée',
            });
            if (redirectBrowserToPortalLogin()) return EMPTY;

            router.navigate(['/connexion'], {
              queryParams: { redirect: DEFAULT_UBAX_WEB_HOME_PATH },
            });
            return EMPTY;
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
                  clearResolvedProfile();
                  patchState(store, { user: null, token: null, profileLoaded: false });
                  if (redirectBrowserToPortalLogin()) return;
                  router.navigate(['/connexion'], {
                    queryParams: { redirect: DEFAULT_UBAX_WEB_HOME_PATH },
                  });
                },
                error: () => {
                  clearStoredAuthSession();
                  clearResolvedProfile();
                  patchState(store, { user: null, token: null, profileLoaded: false });
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

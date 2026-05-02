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
import { of, pipe, switchMap, tap } from 'rxjs';
import {
  AuthService,
  DEFAULT_UBAX_WEB_HOME_PATH,
  Role,
  clearStoredAuthSession,
  deriveUserFromAuthToken,
  persistAuthToken,
  readStoredRefreshToken,
  readStoredAuthToken,
  redirectBrowserToPortalLogin,
  type User,
} from '@ubax-workspace/shared-data-access';

const initialToken = readStoredAuthToken();

type AuthState = {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;};

const initialState: AuthState = {
  user: deriveUserFromAuthToken(initialToken),
  token: initialToken,
  loading: false,
  error: null,
};

export const AuthStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed(({ user, token }) => ({
    isAuthenticated: computed(() => !!token() && !!user()),
    role: computed(() => user()?.role ?? null),
    fullName: computed(() => {
      const u = user();
      return u ? `${u.prenom} ${u.nom}` : '';
    }),
  })),
  withMethods(
    (store, authSvc = inject(AuthService), router = inject(Router)) => ({
      setToken(token: string): void {
        persistAuthToken(token);
        patchState(store, {
          token,
          user: deriveUserFromAuthToken(token) ?? store.user(),
        });
      },

      /** Hydrate le store après login ou depuis le mock dev */
      setUser(user: User): void {
        patchState(store, { user });
      },

      /** Vide la session localement sans appel réseau — utilisé par l'intercepteur quand le refresh échoue */
      expireSession(): void {
        clearStoredAuthSession();
        patchState(store, { user: null, token: null, error: 'Session expirée' });
        if (redirectBrowserToPortalLogin()) return;
        router.navigate(['/connexion']);
      },

      setRole(role: Role): void {
        const currentUser = store.user();

        if (!currentUser) {
          return;
        }

        patchState(store, { user: { ...currentUser, role } });
      },

      loadMe: rxMethod<void>(
        pipe(
          tap(() => patchState(store, { loading: true, error: null })),
          switchMap(() =>
            authSvc.getMe().pipe(
              tapResponse({
                next: (user) => patchState(store, { user, loading: false }),
                error: () => {
                  const fallbackUser = deriveUserFromAuthToken(store.token());

                  if (fallbackUser) {
                    patchState(store, {
                      user: fallbackUser,
                      loading: false,
                      error: null,
                    });
                    return;
                  }

                  clearStoredAuthSession();
                  patchState(store, {
                    user: null,
                    token: null,
                    loading: false,
                    error: 'Session expirée',
                  });
                  if (redirectBrowserToPortalLogin()) {
                    return;
                  }

                  router.navigate(['/connexion'], {
                    queryParams: { redirect: DEFAULT_UBAX_WEB_HOME_PATH },
                  });
                },
              }),
            ),
          ),
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
                  if (redirectBrowserToPortalLogin()) {
                    return;
                  }

                  router.navigate(['/connexion'], {
                    queryParams: { redirect: DEFAULT_UBAX_WEB_HOME_PATH },
                  });
                },
                error: () => {
                  clearStoredAuthSession();
                  patchState(store, { user: null, token: null });
                  if (redirectBrowserToPortalLogin()) {
                    return;
                  }

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

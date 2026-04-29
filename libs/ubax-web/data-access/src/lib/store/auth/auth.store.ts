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
import { pipe, switchMap, tap } from 'rxjs';
import {
  DEFAULT_UBAX_WEB_HOME_PATH,
  clearStoredAuthToken,
  persistAuthToken,
  readStoredAuthToken,
  redirectBrowserToPortalLogin,
} from '../../auth/auth-session';
import { Role, User } from '../../models/user.model';
import { AuthService } from '../../services/auth.service';

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  token: readStoredAuthToken(),
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
        patchState(store, { token });
      },

      /** Hydrate le store après login ou depuis le mock dev */
      setUser(user: User): void {
        patchState(store, { user });
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
                  clearStoredAuthToken();
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
          switchMap(() =>
            authSvc.logout().pipe(
              tapResponse({
                next: () => {
                  clearStoredAuthToken();
                  patchState(store, { user: null, token: null });
                  if (redirectBrowserToPortalLogin()) {
                    return;
                  }

                  router.navigate(['/connexion'], {
                    queryParams: { redirect: DEFAULT_UBAX_WEB_HOME_PATH },
                  });
                },
                error: () => {
                  clearStoredAuthToken();
                  patchState(store, { user: null, token: null });
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
    }),
  ),
);

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
import { Role, User } from '../../models/user.model';
import { AuthService } from '../../services/auth.service';

const AUTH_TOKEN_STORAGE_KEY = 'ubax_token';

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
}

function getLocalStorage(): Storage | null {
  if (typeof globalThis === 'undefined' || !('localStorage' in globalThis)) {
    return null;
  }

  return globalThis.localStorage;
}

function readStoredToken(): string | null {
  return getLocalStorage()?.getItem(AUTH_TOKEN_STORAGE_KEY) ?? null;
}

function persistToken(token: string): void {
  getLocalStorage()?.setItem(AUTH_TOKEN_STORAGE_KEY, token);
}

function clearStoredToken(): void {
  getLocalStorage()?.removeItem(AUTH_TOKEN_STORAGE_KEY);
}

const initialState: AuthState = {
  user: null,
  token: readStoredToken(),
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
        persistToken(token);
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
                  patchState(store, {
                    loading: false,
                    error: 'Session expirée',
                  });
                  router.navigate(['/connexion']);
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
                  clearStoredToken();
                  patchState(store, { user: null, token: null });
                  router.navigate(['/connexion']);
                },
                error: () => {
                  clearStoredToken();
                  patchState(store, { user: null, token: null });
                  router.navigate(['/connexion']);
                },
              }),
            ),
          ),
        ),
      ),
    }),
  ),
);

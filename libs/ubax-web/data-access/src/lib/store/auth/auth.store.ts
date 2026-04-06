import { computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { tapResponse } from '@ngrx/operators';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap } from 'rxjs';
import { User } from '../../models/user.model';
import { AuthService } from '../../services/auth.service';

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  token: localStorage.getItem('ubax_token'),
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
  withMethods((store, authSvc = inject(AuthService), router = inject(Router)) => ({
    setToken(token: string): void {
      localStorage.setItem('ubax_token', token);
      patchState(store, { token });
    },

    /** Hydrate le store après login ou depuis le mock dev */
    setUser(user: User): void {
      patchState(store, { user });
    },

    loadMe: rxMethod<void>(
      pipe(
        tap(() => patchState(store, { loading: true, error: null })),
        switchMap(() =>
          authSvc.getMe().pipe(
            tapResponse({
              next: (user) => patchState(store, { user, loading: false }),
              error: () => {
                patchState(store, { loading: false, error: 'Session expirée' });
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
                localStorage.removeItem('ubax_token');
                patchState(store, { user: null, token: null });
                router.navigate(['/connexion']);
              },
              error: () => {
                localStorage.removeItem('ubax_token');
                patchState(store, { user: null, token: null });
                router.navigate(['/connexion']);
              },
            }),
          ),
        ),
      ),
    ),
  })),
);

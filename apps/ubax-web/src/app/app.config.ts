import {
  ApplicationConfig,
  inject,
  isDevMode,
  provideBrowserGlobalErrorListeners,
  provideAppInitializer,
} from '@angular/core';
import {
  provideRouter,
  withComponentInputBinding,
  withPreloading,
  withViewTransitions,
} from '@angular/router';
import {
  provideHttpClient,
  withFetch,
  withInterceptors,
} from '@angular/common/http';
import { providePrimeNG } from 'primeng/config';
import { appRoutes } from './app.routes';
import { authInterceptor } from '@ubax-workspace/ubax-web-shell/interceptors';
import { UbaxPreset } from '@ubax-workspace/ubax-web-shell/theme';
import {
  AuthStore,
  Role,
  readStoredDevRole,
} from '@ubax-workspace/ubax-web-data-access';
import { SelectivePreloadStrategy } from './selective-preload.strategy';

/**
 * En dev, initialise l'utilisateur mock AVANT que le router évalue les
 * canMatch guards — garantit que authStore.role() !== null dès le premier
 * chargement de la page.
 */
function provideMockUserInDev() {
  if (!isDevMode()) return [];
  return [
    provideAppInitializer(() => {
      const authStore = inject(AuthStore);
      const initialRole = readStoredDevRole() ?? Role.HOTEL;

      if (!authStore.token()) {
        authStore.setToken('dev-mock-token');
      }
      if (!authStore.user()) {
        authStore.setUser({
          id: 'dev-001',
          nom: 'Kouassi',
          prenom: 'Jean-Marc',
          email: 'jm.kouassi@ubax.io',
          avatar: 'header/header-user-avatar.webp',
          role: initialRole,
        });
      }
    }),
  ];
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(
      appRoutes,
      withComponentInputBinding(),
      withPreloading(SelectivePreloadStrategy),
      withViewTransitions(),
    ),
    provideHttpClient(withFetch(), withInterceptors([authInterceptor])),
    providePrimeNG({
      theme: {
        preset: UbaxPreset,
        options: {
          darkModeSelector: '.dark',
          cssLayer: {
            name: 'primeng',
            order: 'tailwind-base, primeng, tailwind-utilities',
          },
        },
      },
      ripple: true,
    }),
    ...provideMockUserInDev(),
  ],
};

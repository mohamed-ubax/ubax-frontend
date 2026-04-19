import {
  APP_INITIALIZER,
  ApplicationConfig,
  inject,
  isDevMode,
  provideBrowserGlobalErrorListeners,
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
import { AuthStore, Role } from '@ubax-workspace/ubax-web-data-access';
import { SelectivePreloadStrategy } from './selective-preload.strategy';

/**
 * En dev, initialise l'utilisateur mock AVANT que le router évalue les
 * canMatch guards — garantit que authStore.role() !== null dès le premier
 * chargement de la page.
 */
function provideMockUserInDev() {
  if (!isDevMode()) return [];
  return [
    {
      provide: APP_INITIALIZER,
      useFactory: () => {
        const authStore = inject(AuthStore);
        return () => {
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
              role: Role.COMPTABLE,
            });
          }
        };
      },
      multi: true,
    },
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

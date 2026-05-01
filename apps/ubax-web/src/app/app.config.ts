import {
  ApplicationConfig,
  inject,
  isDevMode,
  LOCALE_ID,
  provideBrowserGlobalErrorListeners,
  provideAppInitializer,
} from '@angular/core';
import { registerLocaleData } from '@angular/common';
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
import type { Translation } from 'primeng/api';
import localeFr from '@angular/common/locales/fr';
import { appRoutes } from './app.routes';
import { authInterceptor } from '@ubax-workspace/ubax-web-shell/interceptors';
import { UbaxPreset } from '@ubax-workspace/ubax-web-shell/theme';
import { provideApiConfiguration } from '@ubax-workspace/shared-api-types';
import {
  AuthStore,
  Role,
  readStoredDevRole,
} from '@ubax-workspace/ubax-web-data-access';
import { NOTIFICATION_HANDLER } from '@ubax-workspace/shared-data-access';
import { NotificationService } from '@ubax-workspace/ubax-web-shell';
import { MessageService } from 'primeng/api';
import { SelectivePreloadStrategy } from './selective-preload.strategy';
import { environment } from '../environments/environment';

registerLocaleData(localeFr);

const DEV_AUTH_MOCK_STORAGE_KEY = 'ubax_enable_dev_auth_mock';
const DEV_AUTH_MOCK_QUERY_PARAM = 'ubaxDevMockAuth';

const PRIMENG_FRENCH_TRANSLATION: Translation = {
  dayNames: [
    'dimanche',
    'lundi',
    'mardi',
    'mercredi',
    'jeudi',
    'vendredi',
    'samedi',
  ],
  dayNamesShort: ['dim.', 'lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.'],
  dayNamesMin: ['Di', 'Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa'],
  monthNames: [
    'janvier',
    'février',
    'mars',
    'avril',
    'mai',
    'juin',
    'juillet',
    'août',
    'septembre',
    'octobre',
    'novembre',
    'décembre',
  ],
  monthNamesShort: [
    'janv.',
    'févr.',
    'mars',
    'avr.',
    'mai',
    'juin',
    'juil.',
    'août',
    'sept.',
    'oct.',
    'nov.',
    'déc.',
  ],
  today: "Aujourd'hui",
  clear: 'Effacer',
  chooseDate: 'Choisir une date',
  chooseMonth: 'Choisir un mois',
  chooseYear: 'Choisir une année',
  prevMonth: 'Mois précédent',
  nextMonth: 'Mois suivant',
  prevYear: 'Année précédente',
  nextYear: 'Année suivante',
  dateFormat: 'dd/mm/yy',
  weekHeader: 'Sem',
  firstDayOfWeek: 1,
};

function shouldEnableDevAuthMock(): boolean {
  if (!isDevMode() || typeof globalThis === 'undefined') {
    return false;
  }

  if ('location' in globalThis) {
    const queryValue = new URLSearchParams(globalThis.location.search).get(
      DEV_AUTH_MOCK_QUERY_PARAM,
    );

    if (queryValue !== null) {
      return queryValue === '1' || queryValue === 'true';
    }
  }

  if (!('localStorage' in globalThis)) {
    return false;
  }

  return globalThis.localStorage.getItem(DEV_AUTH_MOCK_STORAGE_KEY) === 'true';
}

/**
 * En dev, le mock d'auth n'est activé que de façon explicite pour laisser le
 * flux réel de login/logout et ses redirections testables par défaut.
 */
function provideMockUserInDev() {
  if (!shouldEnableDevAuthMock()) return [];
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
    { provide: LOCALE_ID, useValue: 'fr-FR' },
    provideRouter(
      appRoutes,
      withComponentInputBinding(),
      withPreloading(SelectivePreloadStrategy),
      withViewTransitions(),
    ),
    provideApiConfiguration(environment.apiRootUrl),
    provideHttpClient(withFetch(), withInterceptors([authInterceptor])),
    MessageService,
    { provide: NOTIFICATION_HANDLER, useExisting: NotificationService },
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
      translation: PRIMENG_FRENCH_TRANSLATION,
    }),
    ...provideMockUserInDev(),
  ],
};

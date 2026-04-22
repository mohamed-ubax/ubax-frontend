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
import {
  AuthStore,
  Role,
  readStoredDevRole,
} from '@ubax-workspace/ubax-web-data-access';
import { SelectivePreloadStrategy } from './selective-preload.strategy';

registerLocaleData(localeFr);

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
    { provide: LOCALE_ID, useValue: 'fr-FR' },
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
      translation: PRIMENG_FRENCH_TRANSLATION,
    }),
    ...provideMockUserInDev(),
  ],
};

import {
  ApplicationConfig,
  LOCALE_ID,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { registerLocaleData } from '@angular/common';
import {
  provideRouter,
  withComponentInputBinding,
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
import { authInterceptor } from '@ubax-workspace/ubax-admin-shell/interceptors';
import { UbaxPreset } from '@ubax-workspace/ubax-web-shell/theme';
import { ApiConfiguration } from '@ubax-workspace/shared-api-types';
import { NOTIFICATION_HANDLER } from '@ubax-workspace/shared-data-access';
import { NotificationService } from '@ubax-workspace/ubax-admin-shell/notification-service';
import { MessageService } from 'primeng/api';
import { environment } from '../environments/environment';

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

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    { provide: LOCALE_ID, useValue: 'fr-FR' },
    provideRouter(
      appRoutes,
      withComponentInputBinding(),
      withViewTransitions(),
    ),
    {
      provide: ApiConfiguration,
      useValue: { rootUrl: environment.apiRootUrl },
    },
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
  ],
};

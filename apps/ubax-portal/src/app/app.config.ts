import { ApplicationConfig } from '@angular/core';
import { provideHttpClient, withFetch } from '@angular/common/http';
import {
  provideRouter,
  withPreloading,
  withViewTransitions,
} from '@angular/router';
import { SelectivePreloadStrategy } from './selective-preload.strategy';
import { providePrimeNG } from 'primeng/config';
import { definePreset } from '@primeuix/styled';
import Aura from '@primeuix/themes/aura';
import { provideApiConfiguration } from '@ubax-workspace/shared-api-types';
import { appRoutes } from './app.routes';
import { environment } from '../environments/environment';

const UbaxPreset = definePreset(Aura, {
  semantic: {
    primary: {
      50: '#e8edf1',
      100: '#c6d0da',
      200: '#a0b1c1',
      300: '#7792a8',
      400: '#587b94',
      500: '#3a6480',
      600: '#2d5472',
      700: '#1a3047',
      800: '#162740',
      900: '#101e33',
      950: '#0a1628',
    },
    colorScheme: {
      light: {
        primary: {
          color: '#1a3047',
          contrastColor: '#ffffff',
          hoverColor: '#2d5472',
          activeColor: '#162740',
        },
        highlight: {
          background: '#1a3047',
          focusBackground: '#2d5472',
          color: '#ffffff',
          focusColor: '#ffffff',
        },
      },
    },
  },
});

export const appConfig: ApplicationConfig = {
  providers: [
    provideApiConfiguration(environment.apiRootUrl),
    provideHttpClient(withFetch()),
    provideRouter(
      appRoutes,
      withViewTransitions(),
      withPreloading(SelectivePreloadStrategy),
    ),
    providePrimeNG({
      theme: {
        preset: UbaxPreset,
        options: {
          darkModeSelector: false,
          cssLayer: {
            name: 'primeng',
            order: 'tailwind-base, primeng, app-styles',
          },
        },
      },
    }),
  ],
};

import { bootstrapApplication } from '@angular/platform-browser';
import { provideBrowserGlobalErrorListeners, mergeApplicationConfig } from '@angular/core';
import { appConfig } from './app/app.config';
import { App } from './app/app';

bootstrapApplication(App, mergeApplicationConfig(appConfig, {
  providers: [provideBrowserGlobalErrorListeners()],
})).catch((err) => console.error(err));

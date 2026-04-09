import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

// ── DEV ONLY : mock auth pour tester sans backend ────────────────────────────
// Retire ce bloc dès que le vrai backend est connecté
if (!localStorage.getItem('ubax_token')) {
  localStorage.setItem('ubax_token', 'dev-mock-token');
}
// ────────────────────────────────────────────────────────────────────────────

bootstrapApplication(App, appConfig).catch((err) => console.error(err));

import { Routes } from '@angular/router';

export const publicRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/home-page.component').then((m) => m.HomePageComponent),
  },
  {
    path: 'connexion',
    loadComponent: () =>
      import('./pages/login-page.component').then((m) => m.LoginPageComponent),
  },
  {
    path: 'mot-de-passe-oublie',
    loadComponent: () =>
      import('./pages/forgot-password-page.component').then(
        (m) => m.ForgotPasswordPageComponent,
      ),
  },
  {
    path: 'verification-code',
    loadComponent: () =>
      import('./pages/otp-page.component').then((m) => m.OtpPageComponent),
  },
  {
    path: 'nouveau-mot-de-passe',
    loadComponent: () =>
      import('./pages/reset-password-page.component').then(
        (m) => m.ResetPasswordPageComponent,
      ),
  },
  {
    path: 'faq',
    loadComponent: () =>
      import('./pages/faq-page.component').then((m) => m.FaqPageComponent),
  },
  {
    path: 'contact',
    loadComponent: () =>
      import('./pages/contact-page.component').then(
        (m) => m.ContactPageComponent,
      ),
  },
  {
    path: 'tarifs',
    loadComponent: () =>
      import('./pages/pricing-page.component').then(
        (m) => m.PricingPageComponent,
      ),
  },
  {
    path: 'temoignages',
    loadComponent: () =>
      import('./pages/testimonials-page.component').then(
        (m) => m.TestimonialsPageComponent,
      ),
  },
  {
    path: 'mentions-legales',
    loadComponent: () =>
      import('./pages/legal-page.component').then((m) => m.LegalPageComponent),
  },
];

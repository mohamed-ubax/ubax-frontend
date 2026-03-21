import { Routes } from '@angular/router';

export const publicRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/splash-page.component').then(
        (m) => m.SplashPageComponent,
      ),
  },
  {
    path: 'accueil',
    data: { preload: true },
    loadComponent: () =>
      import('./pages/home-page.component').then((m) => m.HomePageComponent),
  },
  {
    path: 'connexion',
    data: { preload: true },
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
    path: 'fonctionnalites',
    data: { preload: true },
    loadComponent: () =>
      import('./pages/fonctionnalites-page.component').then(
        (m) => m.FonctionnalitesPageComponent,
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
    path: 'offres',
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
    path: 'formations/:slug',
    loadComponent: () =>
      import('./pages/formation-detail-page.component').then(
        (m) => m.FormationDetailPageComponent,
      ),
  },
  {
    path: 'formations',
    loadComponent: () =>
      import('./pages/formations-page.component').then(
        (m) => m.FormationsPageComponent,
      ),
  },
  {
    path: 'mentions-legales',
    loadComponent: () =>
      import('./pages/legal-page.component').then((m) => m.LegalPageComponent),
  },
  {
    path: 'politique-de-confidentialite',
    loadComponent: () =>
      import('./pages/politique-confidentialite-page.component').then(
        (m) => m.PolitiqueConfidentialitePageComponent,
      ),
  },
  {
    path: '**',
    redirectTo: '',
    pathMatch: 'full',
  },
];

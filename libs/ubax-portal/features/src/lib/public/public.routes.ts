import { Routes } from '@angular/router';

export const publicRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/splash/splash-page.component').then(
        (m) => m.SplashPageComponent,
      ),
  },
  {
    path: 'accueil',
    data: { preload: true },
    loadComponent: () =>
      import('./pages/marketing/home/home-page.component').then(
        (m) => m.HomePageComponent,
      ),
  },
  {
    path: 'connexion',
    data: { preload: true },
    loadComponent: () =>
      import('./pages/auth/login/login-page.component').then(
        (m) => m.LoginPageComponent,
      ),
  },
  {
    path: 'mot-de-passe-oublie',
    loadComponent: () =>
      import('./pages/auth/forgot-password/forgot-password-page.component').then(
        (m) => m.ForgotPasswordPageComponent,
      ),
  },
  {
    path: 'verification-code',
    loadComponent: () =>
      import('./pages/auth/otp/otp-page.component').then(
        (m) => m.OtpPageComponent,
      ),
  },
  {
    path: 'nouveau-mot-de-passe',
    loadComponent: () =>
      import('./pages/auth/reset-password/reset-password-page.component').then(
        (m) => m.ResetPasswordPageComponent,
      ),
  },
  {
    path: 'fonctionnalites',
    data: { preload: true },
    loadComponent: () =>
      import('./pages/marketing/fonctionnalites/fonctionnalites-page.component').then(
        (m) => m.FonctionnalitesPageComponent,
      ),
  },
  {
    path: 'faq',
    loadComponent: () =>
      import('./pages/info/faq/faq-page.component').then(
        (m) => m.FaqPageComponent,
      ),
  },
  {
    path: 'contact',
    loadComponent: () =>
      import('./pages/info/contact/contact-page.component').then(
        (m) => m.ContactPageComponent,
      ),
  },
  {
    path: 'offres',
    loadComponent: () =>
      import('./pages/marketing/pricing/pricing-page.component').then(
        (m) => m.PricingPageComponent,
      ),
  },
  {
    path: 'temoignages',
    loadComponent: () =>
      import('./pages/marketing/testimonials/testimonials-page.component').then(
        (m) => m.TestimonialsPageComponent,
      ),
  },
  {
    path: 'formations/:slug',
    loadComponent: () =>
      import('./pages/formations/formation-detail/formation-detail-page.component').then(
        (m) => m.FormationDetailPageComponent,
      ),
  },
  {
    path: 'formations',
    loadComponent: () =>
      import('./pages/formations/formations-list/formations-page.component').then(
        (m) => m.FormationsPageComponent,
      ),
  },
  {
    path: 'carrieres',
    loadComponent: () =>
      import('./pages/carrieres/carrieres-list/carrieres-page.component').then(
        (m) => m.CarrieresPageComponent,
      ),
  },
  {
    path: 'carrieres/postuler',
    loadComponent: () =>
      import('./pages/carrieres/carrieres-candidature/carrieres-candidature-page.component').then(
        (m) => m.CarrieresCandidaturePage,
      ),
  },
  {
    path: 'carrieres/:id/postuler',
    loadComponent: () =>
      import('./pages/carrieres/carrieres-candidature/carrieres-candidature-page.component').then(
        (m) => m.CarrieresCandidaturePage,
      ),
  },
  {
    path: 'carrieres/:id',
    loadComponent: () =>
      import('./pages/carrieres/carrieres-detail/carrieres-detail-page.component').then(
        (m) => m.CarrieresDetailPageComponent,
      ),
  },
  {
    path: 'adhesion',
    loadComponent: () =>
      import('./pages/adhesion/adhesion-form-page.component').then(
        (m) => m.AdhesionFormPageComponent,
      ),
  },
  {
    path: 'mentions-legales',
    loadComponent: () =>
      import('./pages/info/legal/legal-page.component').then(
        (m) => m.LegalPageComponent,
      ),
  },
  {
    path: 'politique-de-confidentialite',
    loadComponent: () =>
      import('./pages/info/politique-confidentialite/politique-confidentialite-page.component').then(
        (m) => m.PolitiqueConfidentialitePageComponent,
      ),
  },
  {
    path: '**',
    redirectTo: '',
    pathMatch: 'full',
  },
];

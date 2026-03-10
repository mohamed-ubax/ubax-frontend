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
        (m) => m.ForgotPasswordPageComponent
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
        (m) => m.ResetPasswordPageComponent
      ),
  },
  {
    path: 'faq',
    loadComponent: () =>
      import('./pages/info-page.component').then((m) => m.InfoPageComponent),
    data: {
      pageTitle: 'Foire Aux Questions (FAQ)',
      pageDescription:
        "Retrouvez ici les reponses aux questions les plus frequentes concernant UBAX.",
    },
  },
  {
    path: 'contact',
    loadComponent: () =>
      import('./pages/info-page.component').then((m) => m.InfoPageComponent),
    data: {
      pageTitle: "Besoin d'aide ? Notre equipe est a votre ecoute",
      pageDescription:
        "Contactez-nous facilement pour toute assistance technique ou commerciale.",
    },
  },
  {
    path: 'tarifs',
    loadComponent: () =>
      import('./pages/info-page.component').then((m) => m.InfoPageComponent),
    data: {
      pageTitle: 'Une tarification simple, claire et evolutive',
      pageDescription:
        'Choisissez un plan UBAX adapte a la taille de votre activite immobiliere.',
    },
  },
  {
    path: 'temoignages',
    loadComponent: () =>
      import('./pages/info-page.component').then((m) => m.InfoPageComponent),
    data: {
      pageTitle: 'Ils font confiance a UBAX',
      pageDescription:
        "Decouvrez les retours d'experience de nos utilisateurs et agences immobilieres.",
    },
  },
  {
    path: 'mentions-legales',
    loadComponent: () =>
      import('./pages/info-page.component').then((m) => m.InfoPageComponent),
    data: {
      pageTitle: 'Mentions legales',
      pageDescription:
        'Les informations juridiques et conditions de fonctionnement de la plateforme.',
    },
  },
];

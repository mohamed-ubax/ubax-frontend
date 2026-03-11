import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PublicShellComponent } from '@ubax-workspace/ubax-portal-layout';
import { UiButtonComponent, UiCardComponent } from '@ubax-workspace/shared-ui';

@Component({
  selector: 'ubax-home-page',
  imports: [
    CommonModule,
    RouterLink,
    PublicShellComponent,
    UiButtonComponent,
    UiCardComponent,
  ],
  templateUrl: './home-page.component.html',
  styleUrl: './home-page.component.scss',
})
export class HomePageComponent {
  protected readonly testimonials = [
    {
      name: 'Jean-Marc Bedi',
      role: 'Locataire',
      image: '/assets/portal-assets/11.png',
    },
    {
      name: 'Ibrahim Diabate',
      role: 'Locataire',
      image: '/assets/portal-assets/12.png',
    },
    {
      name: 'Nadia Coulibaly',
      role: 'Locataire',
      image: '/assets/portal-assets/13.png',
    },
    { name: 'Serge Koffi', role: 'Bailleur', image: '/assets/portal-assets/14.png' },
    { name: 'Fatou Kone', role: 'Locataire', image: '/assets/portal-assets/15.png' },
  ];

  protected readonly paymentLogos = [
    '/assets/portal-assets/logo-flottant/stripe-logo-revised-2016-svg.png',
    '/assets/portal-assets/logo-flottant/mastercard-logo.svg',
    '/assets/portal-assets/logo-flottant/mtn-mobile-money-momo-payment-provider.png',
    '/assets/portal-assets/logo-flottant/visa-logo-03.png',
    '/assets/portal-assets/logo-flottant/logo-paydunya.png',
    '/assets/portal-assets/logo-flottant/paypal-2014-logo.png',
  ];
}


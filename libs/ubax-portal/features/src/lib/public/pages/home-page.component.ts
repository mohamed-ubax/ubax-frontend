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
    { name: 'Jean-Marc Bedi', role: 'Locataire', image: '/assets/portal/11.png' },
    {
      name: 'Ibrahim Diabate',
      role: 'Locataire',
      image: '/assets/portal/12.png',
    },
    { name: 'Nadia Coulibaly', role: 'Locataire', image: '/assets/portal/13.png' },
    { name: 'Serge Koffi', role: 'Bailleur', image: '/assets/portal/14.png' },
    { name: 'Fatou Kone', role: 'Locataire', image: '/assets/portal/15.png' },
  ];

  protected readonly paymentLogos = [
    '/assets/portal/logo-flottant/stripe-logo-revised-2016-svg.png',
    '/assets/portal/logo-flottant/mastercard-logo.svg',
    '/assets/portal/logo-flottant/mtn-mobile-money-momo-payment-provider.png',
    '/assets/portal/logo-flottant/visa-logo-03.png',
    '/assets/portal/logo-flottant/logo-paydunya.png',
    '/assets/portal/logo-flottant/paypal-2014-logo.png',
  ];
}

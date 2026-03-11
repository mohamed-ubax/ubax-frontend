import { Component } from '@angular/core';
import { PublicShellComponent } from '@ubax-workspace/ubax-portal-layout';
import { UiButtonComponent, UiCardComponent } from '@ubax-workspace/shared-ui';

@Component({
  selector: 'ubax-pricing-page',
  imports: [PublicShellComponent, UiButtonComponent, UiCardComponent],
  templateUrl: './pricing-page.component.html',
  styleUrl: './pricing-page.component.scss',
})
export class PricingPageComponent {
  protected readonly plans = [
    {
      name: 'Starter',
      subtitle: 'L essentiel pour demarrer la gestion de vos biens.',
      price: '0 FCFA',
      featured: false,
      features: [
        'Gestion de biens (limitee)',
        'Gestion des locataires (limitee)',
        'Contrats de location',
        'Tableau de bord basique',
      ],
    },
    {
      name: 'Pro',
      subtitle: 'La solution complete pour piloter efficacement une agence.',
      price: '0 FCFA',
      featured: true,
      features: [
        'Biens illimites',
        'Locataires illimites',
        'Gestion avancee des contrats',
        'Suivi des loyers et paiements',
      ],
    },
    {
      name: 'Enterprise',
      subtitle: 'Pour grandes structures multi-sites et multi-utilisateurs.',
      price: '0 FCFA',
      featured: false,
      features: [
        'Biens et locataires illimites',
        'Multi-agences',
        'Multi-utilisateurs',
        'Rapports personnalises',
      ],
    },
  ];
}

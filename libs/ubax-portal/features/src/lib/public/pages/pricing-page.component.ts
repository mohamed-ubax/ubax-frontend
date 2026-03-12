import { Component, signal } from '@angular/core';
import { PublicShellComponent } from '@ubax-workspace/ubax-portal-layout';
import { UiButtonComponent, UiCardComponent } from '@ubax-workspace/shared-ui';

@Component({
  selector: 'ubax-pricing-page',
  imports: [PublicShellComponent, UiButtonComponent, UiCardComponent],
  templateUrl: './pricing-page.component.html',
  styleUrl: './pricing-page.component.scss',
})
export class PricingPageComponent {
  protected readonly billingCycle = signal<'mensuel' | 'annuel'>('mensuel');

  protected readonly plans = [
    {
      name: 'Starter',
      subtitle: "L'essentiel pour démarrer la gestion de vos biens immobiliers simplement.",
      price: '0 FCFA',
      featured: false,
      features: [
        'Gestion de biens (limitée)',
        'Gestion des locataires (limitée)',
        'Contrats de location',
        'Tableau de bord basique',
        'Historique des paiements',
      ],
    },
    {
      name: 'Pro',
      subtitle: 'La solution complète pour piloter efficacement une agence immobilière en croissance.',
      price: '0 FCFA',
      featured: true,
      features: [
        'Biens illimités',
        'Locataires illimités',
        'Gestion avancée des contrats',
        'Suivi des loyers & paiements',
        'Tableaux de bord avancés',
      ],
    },
    {
      name: 'Entreprise',
      subtitle: 'Une plateforme sur mesure pour les grandes agences et les structures multi-sites.',
      price: '0 FCFA',
      featured: false,
      features: [
        'Biens & locataires illimités',
        'Multi-agences',
        'Multi-utilisateurs',
        'Rapports personnalisés',
        'Intégration paiements',
      ],
    },
  ];
}

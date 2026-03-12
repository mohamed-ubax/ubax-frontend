import { Component } from '@angular/core';
import { PublicShellComponent } from '@ubax-workspace/ubax-portal-layout';
import {
  UiAccordionComponent,
  UiAccordionItem,
  UiButtonComponent,
} from '@ubax-workspace/shared-ui';

@Component({
  selector: 'ubax-faq-page',
  imports: [PublicShellComponent, UiAccordionComponent, UiButtonComponent],
  templateUrl: './faq-page.component.html',
  styleUrl: './faq-page.component.scss',
})
export class FaqPageComponent {
  protected readonly items: UiAccordionItem[] = [
    {
      title: "Qu'est-ce que UBAX ?",
      content:
        'UBAX est une application web de gestion immobilière destinée aux agences. Elle permet de gérer les biens, les locataires, les contrats, les paiements et le support depuis une seule plateforme.',
    },
    {
      title: "À qui s'adresse UBAX ?",
      content:
        "UBAX s'adresse aux agences immobilières, aux bailleurs et aux gestionnaires de biens souhaitant centraliser toute leur activité sur une seule plateforme.",
    },
    {
      title: 'Puis-je utiliser UBAX gratuitement ?',
      content:
        'Oui, UBAX propose une offre de base gratuite. Des plans premium sont disponibles pour accéder à des fonctionnalités avancées selon vos besoins.',
    },
    {
      title: 'Quels types de biens puis-je gérer sur UBAX ?',
      content:
        'UBAX prend en charge tous types de biens : appartements, villas, bureaux, locaux commerciaux et terrains, en location longue ou courte durée.',
    },
    {
      title: 'UBAX est-elle accessible sur mobile ?',
      content:
        "Oui, UBAX est disponible sur Android et iOS. Téléchargez l'application depuis Google Play, l'App Store ou AppGallery.",
    },
  ];
}

import { Component } from '@angular/core';
import { PublicShellComponent } from '@ubax-workspace/ubax-portal-layout';
import {
  UiAccordionComponent,
  UiAccordionItem,
  UiButtonComponent,
  UiCardComponent,
} from '@ubax-workspace/shared-ui';

@Component({
  selector: 'ubax-faq-page',
  imports: [
    PublicShellComponent,
    UiAccordionComponent,
    UiButtonComponent,
    UiCardComponent,
  ],
  templateUrl: './faq-page.component.html',
  styleUrl: './faq-page.component.scss',
})
export class FaqPageComponent {
  protected readonly items: UiAccordionItem[] = [
    {
      title: "Qu'est-ce que UBAX ?",
      content:
        'UBAX est une application web de gestion immobiliere destinee aux agences.',
    },
    {
      title: "A qui s'adresse UBAX ?",
      content: 'Aux agences immobilieres, bailleurs et gestionnaires de biens.',
    },
    {
      title: 'Puis-je utiliser UBAX gratuitement ?',
      content: 'Oui, une offre de base est disponible selon votre profil.',
    },
    {
      title: 'UBAX est-elle accessible sur mobile ?',
      content: 'Oui, via les stores Android et iOS.',
    },
  ];
}

import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { PublicShellComponent } from '@ubax-workspace/ubax-portal-layout';
import {
  UiAccordionComponent,
  UiAccordionItem,
  UiButtonComponent,
  UiCardComponent,
} from '@ubax-workspace/shared-ui';

@Component({
  selector: 'ubax-info-page',
  imports: [
    PublicShellComponent,
    RouterLink,
    UiAccordionComponent,
    UiButtonComponent,
    UiCardComponent,
  ],
  templateUrl: './info-page.component.html',
  styleUrl: './info-page.component.scss',
})
export class InfoPageComponent {
  private readonly route = inject(ActivatedRoute);

  protected readonly title = this.route.snapshot.data['pageTitle'] as string;
  protected readonly description = this.route.snapshot.data[
    'pageDescription'
  ] as string;

  protected readonly faqItems: UiAccordionItem[] = [
    {
      title: "Qu'est-ce que UBAX ?",
      content:
        'UBAX est une plateforme web qui centralise gestion de biens, locations, paiements et support.',
    },
    {
      title: "A qui s'adresse UBAX ?",
      content:
        'La plateforme est concue pour les agences immobilieres, bailleurs et gestionnaires de patrimoine.',
    },
    {
      title: 'UBAX est-elle accessible sur mobile ?',
      content:
        'Oui, les flux essentiels sont disponibles via les applications Android et iOS.',
    },
  ];

  protected get isFaqPage(): boolean {
    return this.title.includes('FAQ');
  }
}

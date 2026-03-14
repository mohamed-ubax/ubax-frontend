import {
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  inject,
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { PublicShellComponent } from '@ubax-workspace/ubax-portal-layout';
import {
  UiAccordionComponent,
  UiAccordionItem,
  UiButtonComponent,
  UiCardComponent,
} from '@ubax-workspace/shared-ui';
import { gsap } from 'gsap';

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
  private readonly _el = inject(ElementRef<HTMLElement>);
  private readonly _destroyRef = inject(DestroyRef);
  private _gsapCtx: gsap.Context | null = null;

  protected readonly title = this.route.snapshot.data['pageTitle'] as string;
  protected readonly description = this.route.snapshot.data[
    'pageDescription'
  ] as string;

  constructor() {
    afterNextRender(() => this._initAnimations());
  }

  private _initAnimations(): void {
    const el = this._el.nativeElement as HTMLElement;

    this._gsapCtx = gsap.context(() => {
      gsap.from('.content-card', {
        y: 45,
        opacity: 0,
        scale: 0.97,
        duration: 0.9,
        ease: 'back.out(1.6)',
      });
    }, el);

    this._destroyRef.onDestroy(() => {
      this._gsapCtx?.revert();
      this._gsapCtx = null;
    });
  }

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

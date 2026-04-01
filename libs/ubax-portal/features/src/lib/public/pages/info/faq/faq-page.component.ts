import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  inject,
} from '@angular/core';
import { PublicShellComponent } from '@ubax-workspace/ubax-portal-layout';
import {
  UiAccordionComponent,
  UiAccordionItem,
  UiButtonComponent,
} from '@ubax-workspace/shared-ui';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

@Component({
  selector: 'ubax-faq-page',
  imports: [PublicShellComponent, UiAccordionComponent, UiButtonComponent],
  templateUrl: './faq-page.component.html',
  styleUrl: './faq-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FaqPageComponent {
  private readonly _el = inject(ElementRef<HTMLElement>);
  private readonly _destroyRef = inject(DestroyRef);
  private _gsapCtx: gsap.Context | null = null;

  constructor() {
    afterNextRender(() => this._initAnimations());
  }

  private _initAnimations(): void {
    const el = this._el.nativeElement as HTMLElement;
    gsap.registerPlugin(ScrollTrigger);

    this._gsapCtx = gsap.context(() => {
      const section = el.querySelector('.faq-section');

      gsap.from('.faq-heading', {
        x: -55,
        opacity: 0,
        duration: 0.85,
        ease: 'power3.out',
        scrollTrigger: { trigger: section, start: 'top 78%' },
      });

      gsap.from('.faq-desc', {
        x: -40,
        opacity: 0,
        duration: 0.75,
        delay: 0.15,
        ease: 'power3.out',
        scrollTrigger: { trigger: section, start: 'top 78%' },
      });

      gsap.from('.faq-contact-card', {
        y: 50,
        opacity: 0,
        scale: 0.96,
        duration: 0.9,
        delay: 0.3,
        ease: 'back.out(1.8)',
        scrollTrigger: { trigger: section, start: 'top 78%' },
      });

      gsap.from('.faq-list', {
        x: 65,
        opacity: 0,
        duration: 1,
        ease: 'power3.out',
        scrollTrigger: { trigger: section, start: 'top 75%' },
      });
    }, el);

    this._destroyRef.onDestroy(() => {
      this._gsapCtx?.revert();
      this._gsapCtx = null;
    });
  }

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

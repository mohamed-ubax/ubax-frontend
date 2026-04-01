import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  signal,
} from '@angular/core';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { UiCardComponent } from '@ubax-workspace/shared-ui';
import { PublicShellComponent } from '@ubax-workspace/ubax-portal-layout';

@Component({
  selector: 'ubax-pricing-page',
  imports: [PublicShellComponent, UiCardComponent],
  templateUrl: './pricing-page.component.html',
  styleUrl: './pricing-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PricingPageComponent {
  private readonly elRef = inject(ElementRef);
  private readonly destroyRef = inject(DestroyRef);
  private gsapCtx: gsap.Context | undefined;

  protected readonly billingCycle = signal<'mensuel' | 'annuel'>('mensuel');

  protected readonly plans = [
    {
      name: 'Starter',
      subtitle:
        "L'essentiel pour démarrer la gestion de vos biens immobiliers simplement.",
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
      subtitle:
        'La solution complète pour piloter efficacement une agence immobilière en croissance.',
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
      subtitle:
        'Une plateforme sur mesure pour les grandes agences et les structures multi-sites.',
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

  constructor() {
    afterNextRender(() => {
      gsap.registerPlugin(ScrollTrigger);
      this.gsapCtx = gsap.context(
        () => this.initAnimations(),
        this.elRef.nativeElement,
      );
    });

    this.destroyRef.onDestroy(() => {
      this.gsapCtx?.revert();
    });
  }

  private initAnimations(): void {
    const ease = 'power3.out';

    // Header entrance
    gsap.from('.pricing-header h1', {
      y: -30,
      opacity: 0,
      duration: 0.8,
      ease,
    });
    gsap.from('.pricing-header p', {
      y: -20,
      opacity: 0,
      duration: 0.7,
      delay: 0.15,
      ease,
    });
    gsap.from('.toggle', {
      scale: 0.85,
      opacity: 0,
      duration: 0.65,
      delay: 0.3,
      ease: 'back.out(2)',
    });

    // Non-featured cards: staggered 3D flip-in from edges
    gsap.from('.plan:not(.plan--featured)', {
      scrollTrigger: { trigger: '.plans', start: 'top 82%' },
      y: 70,
      opacity: 0,
      rotateX: 10,
      duration: 0.82,
      stagger: { amount: 0.24, from: 'edges' },
      ease: 'power3.out',
      transformOrigin: 'top center',
    });

    // Featured card: entrance then chains into infinite float
    gsap.from('.plan--featured', {
      scrollTrigger: { trigger: '.plans', start: 'top 82%' },
      y: 70,
      opacity: 0,
      rotateX: 10,
      duration: 0.82,
      delay: 0.12,
      ease: 'power3.out',
      transformOrigin: 'top center',
      onComplete() {
        gsap.fromTo(
          '.plan--featured',
          { y: 0 },
          { y: -15, duration: 2.6, yoyo: true, repeat: -1, ease: 'sine.inOut' },
        );
      },
    });

    // Feature list items cascade
    gsap.from('.plan__feature', {
      scrollTrigger: { trigger: '.plans', start: 'top 70%' },
      x: -20,
      opacity: 0,
      duration: 0.45,
      stagger: 0.04,
      ease: 'power2.out',
    });
  }
}

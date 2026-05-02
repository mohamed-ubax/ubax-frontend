import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  inject,
} from '@angular/core';
import { PublicShellComponent } from '@ubax-workspace/ubax-portal-layout';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { AboutCtaSectionComponent } from '../../../shared/about-cta-section.component';

type AboutPoint = {
  readonly emoji: string;
  readonly title: string;
  readonly description: string;};

type AboutPlatformCard = {
  readonly title: string;
  readonly description: string;
  readonly emoji: string;};

@Component({
  selector: 'ubax-about-page',
  standalone: true,
  imports: [PublicShellComponent, AboutCtaSectionComponent],
  templateUrl: './about-page.component.html',
  styleUrl: './about-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AboutPageComponent {
  private readonly _el = inject(ElementRef<HTMLElement>);
  private readonly _destroyRef = inject(DestroyRef);
  private _gsapCtx: gsap.Context | null = null;

  constructor() {
    afterNextRender(() => this._initAnimations());
  }

  protected readonly points: readonly AboutPoint[] = [
    {
      emoji: '🧩',
      title: 'Une solution tout-en-un',
      description:
        'Gérez vos biens, vos locataires et vos paiements depuis une seule plateforme simple et intuitive.',
    },
    {
      emoji: '🤝',
      title: 'Une mise en relation efficace',
      description:
        'Nous facilitons les échanges entre propriétaires, agences et locataires pour des transactions rapides et sécurisées.',
    },
    {
      emoji: '💡',
      title: 'Une innovation au service de l’immobilier',
      description:
        'Ubax utilise la technologie pour moderniser et améliorer l’expérience immobilière au quotidien.',
    },
  ];

  protected readonly platformCards: readonly AboutPlatformCard[] = [
    {
      title: 'Gestion intelligente des hôtels',
      description:
        'Centralisez l’ensemble des opérations de votre hôtel : gestion des chambres, suivi des réservations, disponibilité en temps réel et encaissement des paiements. Tout est automatisé pour améliorer l’efficacité et l’expérience client.',
      emoji: '🏨',
    },
    {
      title: 'Pilotage complet des agences immobilières',
      description:
        'Gérez vos biens immobiliers, mandats, clients et annonces depuis un tableau de bord unique. Ubax vous aide à structurer votre activité et à optimiser la gestion de vos locations.',
      emoji: '🏢',
    },
    {
      title: 'Application mobile de location simplifiée',
      description:
        'Une application pensée pour les utilisateurs permettant de louer facilement une maison ou un appartement au mois ou à l’année, avec une expérience rapide, intuitive et accessible partout.',
      emoji: '📱',
    },
    {
      title: 'Réservations courte durée',
      description:
        'Proposez ou réservez des logements pour des séjours courts en toute simplicité. Système de réservation instantanée, paiement sécurisé et gestion fluide des disponibilités.',
      emoji: '🏠',
    },
  ];

  private _initAnimations(): void {
    const host = this._el.nativeElement;
    gsap.registerPlugin(ScrollTrigger);

    this._gsapCtx = gsap.context(() => {
      gsap.from('.about-hero__title', {
        y: 42,
        opacity: 0,
        duration: 0.9,
        ease: 'power3.out',
      });

      gsap.from('.about-hero__description', {
        y: 28,
        opacity: 0,
        duration: 0.85,
        delay: 0.12,
        ease: 'power3.out',
      });

      gsap.from('.about-story__intro-media', {
        x: -56,
        opacity: 0,
        duration: 0.95,
        ease: 'power3.out',
        scrollTrigger: { trigger: '.about-story__intro', start: 'top 78%' },
      });

      gsap.from('.about-story__intro-copy > *', {
        y: 26,
        opacity: 0,
        duration: 0.72,
        stagger: 0.1,
        ease: 'power3.out',
        scrollTrigger: { trigger: '.about-story__intro', start: 'top 78%' },
      });

      gsap.from('.about-point', {
        y: 18,
        opacity: 0,
        duration: 0.65,
        stagger: 0.12,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: '.about-story__points',
          start: 'top 82%',
        },
      });

      gsap.from('.about-story__feature-copy > *', {
        y: 24,
        opacity: 0,
        duration: 0.72,
        stagger: 0.11,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: '.about-story__feature-copy',
          start: 'top 82%',
        },
      });

      gsap.from('.about-story__feature-media', {
        scale: 0.94,
        opacity: 0,
        duration: 0.95,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: '.about-story__feature-media',
          start: 'top 84%',
        },
      });

      gsap.from('.about-platform__title', {
        y: 26,
        opacity: 0,
        duration: 0.8,
        ease: 'power3.out',
        scrollTrigger: { trigger: '.about-platform', start: 'top 82%' },
      });

      gsap.from('.about-platform-card', {
        y: 42,
        opacity: 0,
        duration: 0.8,
        stagger: 0.12,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: '.about-platform__grid',
          start: 'top 84%',
        },
      });

      gsap.from('.about-platform-card__emoji', {
        scale: 0.45,
        rotate: 10,
        opacity: 0,
        duration: 0.72,
        stagger: 0.1,
        ease: 'back.out(1.7)',
        scrollTrigger: {
          trigger: '.about-platform__grid',
          start: 'top 84%',
        },
      });

      gsap.from(
        '.about-cta__badge, .about-cta__title, .about-cta__description, .about-cta__actions',
        {
          y: 26,
          opacity: 0,
          duration: 0.76,
          stagger: 0.1,
          ease: 'power3.out',
          scrollTrigger: { trigger: '.about-cta', start: 'top 82%' },
        },
      );

      gsap.from('.about-cta__surface', {
        scale: 0.97,
        opacity: 0,
        duration: 0.9,
        ease: 'power3.out',
        scrollTrigger: { trigger: '.about-cta', start: 'top 84%' },
      });
    }, host);

    this._destroyRef.onDestroy(() => {
      this._gsapCtx?.revert();
      this._gsapCtx = null;
    });
  }
}

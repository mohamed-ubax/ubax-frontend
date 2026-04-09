import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  NgZone,
  signal,
} from '@angular/core';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { NgOptimizedImage } from '@angular/common';
import { RouterLink } from '@angular/router';
import {
  BackToTopComponent,
  PublicShellComponent,
} from '@ubax-workspace/ubax-portal-layout';
import { UiPaginationComponent } from '@ubax-workspace/shared-ui';

interface JobOffer {
  id: number;
  company: string;
  type: string;
  title: string;
  location: string;
  langue: string;
  sexe: string;
  echeance: string;
  postedAt: string;
}

interface CultureCard {
  title: string;
  body: string;
  accent?: boolean;
}

@Component({
  selector: 'ubax-carrieres-page',
  imports: [
    PublicShellComponent,
    BackToTopComponent,
    RouterLink,
    UiPaginationComponent,
    NgOptimizedImage,
  ],
  templateUrl: './carrieres-page.component.html',
  styleUrl: './carrieres-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CarrieresPageComponent {
  private readonly elRef = inject(ElementRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly zone = inject(NgZone);
  private gsapCtx: gsap.Context | undefined;

  protected readonly currentPage = signal(1);
  protected readonly totalPages = 5;

  // ── Assets ─────────────────────────────────────────────────────────────
  protected readonly heroPersonImg =
    'assets/portal-assets/careers/images/hero-person.webp';
  protected readonly heroEllipseOuter =
    'assets/portal-assets/careers/icons/Ellipse 1.svg';
  protected readonly heroCommunityAvatars = [
    'assets/portal-assets/careers/images/image.png',
    'assets/portal-assets/careers/images/image-1.png',
    'assets/portal-assets/careers/images/image-2.png',
    'assets/portal-assets/careers/images/image-3.png',
  ];
  protected readonly searchIcon =
    'assets/portal-assets/careers/icons/mynaui_search.svg';
  protected readonly ubaxIcon =
    'assets/portal-assets/careers/icons/Group 1171274746.svg';
  protected readonly goalsIcon =
    'assets/portal-assets/careers/icons/mage_goals.svg';
  protected readonly starIcon =
    'assets/portal-assets/careers/icons/material-symbols_star.svg';
  protected readonly subtractImg =
    'assets/portal-assets/careers/images/Subtract.webp';
  protected readonly infoOrbitLogo =
    'assets/portal-assets/careers/icons/Group 1171274746-2.svg';
  protected readonly womanImg =
    'assets/portal-assets/careers/images/woman.webp';
  protected readonly arrowLeftIcon =
    'assets/portal-assets/careers/icons/Alt Arrow Left.svg';
  protected readonly arrowRightIcon =
    'assets/portal-assets/careers/icons/Alt Arrow Right.svg';

  // ── Culture cards ───────────────────────────────────────────────────────
  protected readonly cultureCards: CultureCard[] = [
    {
      title: "L'Audace Technologique",
      body: "Nous ne cherchons pas simplement à améliorer ce qui existe, mais à redéfinir les standards de la gestion financière par l'innovation constante. Chez Ubax, chaque collaborateur est encouragé à explorer des solutions disruptives et à transformer des idées complexes en outils technologiques d'une simplicité radicale.",
      accent: true,
    },
    {
      title: "La Responsabilité par l'Autonomie",
      body: "Nous croyons que la liberté de mouvement est le moteur de la créativité, c'est pourquoi nous offrons à chacun la pleine propriété de ses projets. En contrepartie, nous cultivons un sens aigu de la responsabilité où la qualité du livrable et le respect des engagements sont les seuls véritables juges de la performance.",
    },
    {
      title: 'La Transparence Radicale',
      body: "La confiance ne se décrète pas, elle se construit par une circulation fluide de l'information, qu'il s'agisse de nos succès ou de nos défis techniques. Cette clarté s'applique aussi bien à nos relations internes qu'à nos clients, garantissant que chaque décision est prise de manière éclairée et honnête.",
    },
    {
      title: "L'Obsession du Succès Client",
      body: 'Chaque ligne de code écrite et chaque stratégie commerciale élaborée ont pour unique but ultime de générer une valeur mesurable pour ceux qui utilisent nos services. Nous écoutons activement les besoins du terrain pour que la plateforme Ubax soit un véritable partenaire de croissance pour les entreprises.',
    },
    {
      title: "L'Esprit de Corps et Diversité",
      body: "La force d'Ubax réside dans la fusion de talents aux horizons variés, unis par une volonté commune de bâtir un projet qui nous dépasse. Nous cultivons un environnement inclusif où la confrontation bienveillante des idées est perçue comme la clé de notre intelligence collective et de notre résilience.",
    },
  ];

  // ── Job offers ──────────────────────────────────────────────────────────
  protected readonly offers: JobOffer[] = [
    {
      id: 1,
      company: 'Ubax',
      type: 'Temps plein',
      title: 'Responsable Commercial',
      location: 'Cocody, Abidjan',
      langue: 'Français, Anglais',
      sexe: 'Homme, Femme',
      echeance: '15 Mai 2026',
      postedAt: "Posté il y'a 1 heure",
    },
    {
      id: 2,
      company: 'Ubax',
      type: 'Temps plein',
      title: 'Assistant(e) Comptable',
      location: 'Cocody, Abidjan',
      langue: 'Français',
      sexe: 'Homme, Femme',
      echeance: '08 Mai 2026',
      postedAt: "Posté il y'a 12 heures",
    },
    {
      id: 3,
      company: 'Ubax',
      type: 'Temps plein',
      title: 'Assistante de Direction',
      location: 'Cocody, Abidjan',
      langue: 'Français, Anglais',
      sexe: 'Femme',
      echeance: '01 Mai 2026',
      postedAt: "Posté il y'a 2 jours",
    },
  ];

  constructor() {
    afterNextRender(() => {
      this.zone.runOutsideAngular(() => {
        gsap.registerPlugin(ScrollTrigger);
        this.gsapCtx = gsap.context(
          () => this.initAnimations(),
          this.elRef.nativeElement,
        );
      });
    });

    this.destroyRef.onDestroy(() => {
      this.gsapCtx?.revert();
    });
  }

  private initAnimations(): void {
    const ease = 'power3.out';

    // ── Hero timeline ───────────────────────────────────────────────────────
    const heroTl = gsap.timeline({
      defaults: { ease },
      onComplete: () => {
        // Start infinite dashed-ring rotation only after entry finishes
        this.elRef.nativeElement
          .querySelector('.hero__dashed-ring')
          ?.classList.add('hero__dashed-ring--spinning');
      },
    });

    heroTl
      .from('.hero__visual', {
        x: -70,
        opacity: 0,
        duration: 1,
        ease: 'power2.out',
      })
      .from('.hero__title', { y: 45, opacity: 0, duration: 0.85 }, '-=0.55')
      .from('.hero__subtitle', { y: 28, opacity: 0, duration: 0.75 }, '-=0.45')
      .from('.hero__search', { y: 22, opacity: 0, duration: 0.65 }, '-=0.35')
      .from('.hero__community', { y: 18, opacity: 0, duration: 0.5 }, '-=0.25');

    // ── Culture section ─────────────────────────────────────────────────────
    const cultureTrigger = { trigger: '.culture', start: 'top 80%' };

    gsap.from('.culture__heading', {
      scrollTrigger: cultureTrigger,
      x: -35,
      opacity: 0,
      duration: 0.75,
      ease,
    });
    gsap.from('.culture__desc', {
      scrollTrigger: cultureTrigger,
      x: -25,
      opacity: 0,
      duration: 0.7,
      delay: 0.15,
      ease,
    });
    gsap.from('.culture__card', {
      scrollTrigger: { trigger: '.culture', start: 'top 75%' },
      y: 65,
      opacity: 0,
      rotateX: 8,
      duration: 0.75,
      stagger: 0.12,
      ease,
      // Preserve CSS rotate(-3deg) on the accent card
      clearProps: 'transform',
    });

    // ── Mission section ─────────────────────────────────────────────────────
    const missionTrigger = { trigger: '.mission', start: 'top 82%' };

    gsap.from('.mission__icon-box', {
      scrollTrigger: missionTrigger,
      scale: 0,
      rotation: -90,
      opacity: 0,
      duration: 0.8,
      ease: 'back.out(1.7)',
    });
    gsap.from('.mission__title', {
      scrollTrigger: missionTrigger,
      y: 30,
      opacity: 0,
      duration: 0.8,
      delay: 0.18,
      ease,
    });
    gsap.from('.mission__text', {
      scrollTrigger: missionTrigger,
      y: 22,
      opacity: 0,
      duration: 0.75,
      delay: 0.32,
      ease,
    });

    // ── Info section ────────────────────────────────────────────────────────
    const infoTrigger = { trigger: '.info-section', start: 'top 82%' };

    gsap.from('.info-section__title', {
      scrollTrigger: infoTrigger,
      y: 30,
      opacity: 0,
      duration: 0.8,
      ease,
    });
    gsap.from('.info-section__subtitle', {
      scrollTrigger: infoTrigger,
      y: 20,
      opacity: 0,
      duration: 0.7,
      delay: 0.14,
      ease,
    });
    gsap.from('.info-card', {
      scrollTrigger: { trigger: '.info-section', start: 'top 80%' },
      y: 55,
      opacity: 0,
      duration: 0.75,
      stagger: 0.16,
      ease,
    });
    gsap.from('.info-section__orbit', {
      scrollTrigger: infoTrigger,
      scale: 0.86,
      opacity: 0,
      duration: 0.82,
      delay: 0.18,
      ease: 'back.out(1.4)',
      clearProps: 'transform',
    });

    // ── Explore + jobs ──────────────────────────────────────────────────────
    gsap.from('.explore__heading', {
      scrollTrigger: { trigger: '.explore', start: 'top 85%' },
      y: 30,
      opacity: 0,
      duration: 0.8,
      ease,
    });
    gsap.from('.job-card', {
      scrollTrigger: { trigger: '.jobs-grid', start: 'top 82%' },
      y: 65,
      opacity: 0,
      scale: 0.96,
      duration: 0.75,
      stagger: 0.13,
      ease,
      clearProps: 'transform',
    });

    // ── Bottom CTA ──────────────────────────────────────────────────────────
    // Use 'top bottom' so the trigger fires as soon as the section enters
    // the viewport. Each element has its own tween to avoid array/stagger
    // issues leaving any element permanently at opacity:0.
    const ctaTrigger = { trigger: '.cta-bottom', start: 'top bottom' };

    // Animate y only — the visual has `transform: translateX(-50%)` on mobile
    // so animating x would override that CSS transform and leave the image
    // off-centre after the tween completes. clearProps restores CSS ownership.
    gsap.from('.cta-bottom__visual', {
      scrollTrigger: ctaTrigger,
      y: -30,
      opacity: 0,
      duration: 0.95,
      ease,
      clearProps: 'transform',
    });
    gsap.from('.cta-bottom__title', {
      scrollTrigger: ctaTrigger,
      x: 50,
      opacity: 0,
      duration: 0.75,
      ease,
    });
    gsap.from('.cta-bottom__text', {
      scrollTrigger: ctaTrigger,
      x: 50,
      opacity: 0,
      duration: 0.75,
      delay: 0.13,
      ease,
    });
    gsap.from('.cta-bottom__btn', {
      scrollTrigger: ctaTrigger,
      y: 18,
      opacity: 0,
      duration: 0.6,
      delay: 0.26,
      ease: 'back.out(1.4)',
    });
  }

  protected goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage.set(page);
    }
  }
}

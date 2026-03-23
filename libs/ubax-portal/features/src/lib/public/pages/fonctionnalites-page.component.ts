import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  inject,
} from '@angular/core';
import {
  PublicShellComponent,
  BackToTopComponent,
} from '@ubax-workspace/ubax-portal-layout';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

const ASSETS = 'assets/portal-assets/fonctionnalites';

@Component({
  selector: 'ubax-fonctionnalites-page',
  imports: [PublicShellComponent, BackToTopComponent],
  templateUrl: './fonctionnalites-page.component.html',
  styleUrl: './fonctionnalites-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FonctionnalitesPageComponent {
  private readonly _el = inject(ElementRef<HTMLElement>);
  private readonly _destroyRef = inject(DestroyRef);
  private _gsapCtx: gsap.Context | null = null;

  protected readonly stepsRow1 = [
    {
      icon: `${ASSETS}/icons/SignIn.svg`,
      title: 'Créer votre compte',
      description:
        "Inscrivez-vous avec votre numéro pour accéder rapidement à toutes les fonctionnalités de l'application.",
    },
    {
      icon: `${ASSETS}/icons/ri_search-line.svg`,
      title: 'Rechercher un bien',
      description:
        'Utilisez la recherche avancée pour trouver facilement maisons, terrains ou appartements selon vos critères.',
    },
    {
      icon: `${ASSETS}/icons/mdi_rotate-360.svg`,
      title: 'Visiter en 3D',
      description:
        'Explorez les biens en visite virtuelle 3D pour voir les détails avant de faire une réservation ou un achat.',
    },
  ];

  protected readonly stepsRow2 = [
    {
      icon: `${ASSETS}/icons/hugeicons_money-send-circle.svg`,
      title: 'Réserver le bien',
      description:
        "Choisissez le bien qui vous plaît et faites une réservation directement depuis l'application en quelques secondes.",
    },
    {
      icon: `${ASSETS}/icons/material-symbols_key-outline.svg`,
      title: "Finaliser l'achat",
      description:
        "Contactez l'agence ou le propriétaire et finalisez votre achat en toute sécurité depuis la plateforme UBAX.",
    },
  ];

  protected readonly agencyRoles = [
    {
      number: '1',
      title: 'Tableau de bord administrateur',
      description:
        "Supervise la plateforme, gère les utilisateurs, contrôle les biens et assure le bon fonctionnement de l'agence.",
    },
    {
      number: '2',
      title: 'Tableau de bord Commercial',
      description:
        'Ajoute les biens, suit les clients, traite les demandes et gère les réservations directement depuis la plateforme.',
    },
    {
      number: '3',
      title: 'Tableau de bord Équipe SAV',
      description:
        'Traite les tickets, répond aux demandes clients et assure le suivi des réservations et des réclamations.',
    },
    {
      number: '4',
      title: 'Tableau de bord Comptable',
      description:
        'Suit les paiements, les commissions et les transactions financières grâce au dashboard comptable intégré.',
    },
  ];

  protected readonly hotelFeaturesLeft = [
    {
      icon: `${ASSETS}/icons/mingcute_dashboard-line.svg`,
      title: 'Dashboard Admin',
      description:
        'Suivez en temps réel les réservations, revenus et performances de votre hôtel depuis un tableau clair et intuitif.',
    },
    {
      icon: `${ASSETS}/icons/ComputerTower.svg`,
      title: 'Gestion des réservations',
      description:
        'Consultez, ajoutez et modifiez les réservations rapidement pour un suivi client efficace.',
    },
    {
      icon: `${ASSETS}/icons/ArrowFatUp.svg`,
      title: "Suivi du taux d'occupation",
      description:
        "Visualisez facilement le taux d'occupation de chaque chambre ou catégorie pour optimiser la gestion.",
    },
  ];

  protected readonly hotelFeaturesRight = [
    {
      icon: `${ASSETS}/icons/mdi_users-group.svg`,
      title: 'Gestion des clients',
      description:
        'Accédez aux informations clients, historique de séjours et préférences pour un service personnalisé.',
    },
    {
      icon: `${ASSETS}/icons/TrendUp.svg`,
      title: 'Statistiques financières',
      description:
        'Analysez les revenus, dépenses et profits pour prendre des décisions stratégiques rapidement.',
    },
    {
      icon: `${ASSETS}/icons/ri_notification-line.svg`,
      title: 'Notifications & alertes',
      description:
        'Recevez des alertes sur les réservations, annulations ou demandes spéciales pour rester toujours informé.',
    },
  ];

  constructor() {
    afterNextRender(() => this._initAnimations());
  }

  private _initAnimations(): void {
    const el = this._el.nativeElement as HTMLElement;
    gsap.registerPlugin(ScrollTrigger);

    this._gsapCtx = gsap.context(() => {
      // ── Hero timeline (mirrors home-page technique + original touches) ────
      const heroTl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      heroTl
        // ① Arch rises from the bottom (original — home page has no arch)
        .from('.fnc-hero__phone-bg', {
          scaleY: 0, transformOrigin: 'bottom center', duration: 1.2, ease: 'power4.out',
        }, 0)
        // ② Phone slides up inside the arch
        .from('.fnc-hero__phone-img', { y: 80, opacity: 0, duration: 1.3 }, 0.1)
        // ③ Title lines clip-path reveal bottom→top  ← same as home page
        .to('.fnc-hero__line-inner', {
          clipPath: 'inset(0% 0 0% 0)', duration: 0.9, stagger: 0.22,
        }, 0.85)
        // ④ Subtitle fades up  ← same as home page tagline
        .from('.fnc-hero__subtitle', { y: 30, opacity: 0, duration: 1.0 }, '-=0.35')
        // ⑤ Pill pops in with back-out bounce  ← original (home page has no pill)
        .from('.fnc-hero__pill', { y: 20, opacity: 0, duration: 0.8, ease: 'back.out(2)' }, '-=0.4')
        // ⑥ Store buttons bounce in with stagger  ← same ease as home page
        .from('.fnc-store-btn', {
          y: 26, opacity: 0, duration: 0.9, stagger: 0.16, ease: 'back.out(1.8)',
        }, '-=0.5')
        // ⑦ Overlays slide in from opposite sides (original — home page has one image)
        .from('.fnc-hero__card-overlay',  { x: 55, opacity: 0, duration: 0.9 }, '-=0.7')
        .from('.fnc-hero__stats-overlay', { x: -55, opacity: 0, duration: 0.9 }, '<0.1');


      // ── How-to steps ───────────────────────────────────────────────────────
      gsap.from('.fnc-how__heading', {
        scrollTrigger: { trigger: '.fnc-how', start: 'top 78%' },
        y: 40, opacity: 0, duration: 0.85, ease: 'power3.out',
      });
      gsap.from('.fnc-step-card', {
        scrollTrigger: { trigger: '.fnc-how__rows', start: 'top 80%' },
        y: 60, opacity: 0, duration: 0.85, stagger: 0.1, ease: 'power3.out',
      });

      // ── Agency section ──────────────────────────────────────────────────────

      // Background: subtle Ken Burns zoom on scroll through section
      gsap.to('.fnc-agency__bg-img', {
        scrollTrigger: {
          trigger: '.fnc-agency',
          start: 'top bottom',
          end: 'bottom top',
          scrub: 1.5,
        },
        scale: 1.08,
        ease: 'none',
      });

      // Heading: blur-to-clear reveal (immersive entrance)
      gsap.from('.fnc-agency__heading', {
        scrollTrigger: { trigger: '.fnc-agency', start: 'top 72%' },
        y: 50,
        opacity: 0,
        filter: 'blur(6px)',
        duration: 1.1,
        ease: 'power3.out',
      });

      // ── Dashboard convergence sequence ─────────────────────────────────────
      // Pre-set: side dashes spread wide + hidden; main hidden; panels hidden.
      // All inside gsap.context() → automatically reverted on destroy.
      gsap.set('.fnc-agency__dash--left', {
        x: -220, opacity: 0, rotateY: 10, transformPerspective: 1200,
      });
      gsap.set('.fnc-agency__dash--right', {
        x: 220, opacity: 0, rotateY: -10, transformPerspective: 1200,
      });
      // Do NOT animate scale/transform on main dash — it relies on CSS
      // transform: translateX(-50%) for centering. GSAP would overwrite that.
      // Opacity-only fade preserves the CSS centering intact.
      gsap.set('.fnc-agency__dash--main', { opacity: 0 });
      gsap.set('.fnc-agency__panel', { opacity: 0, y: 14 });

      const dashTl = gsap.timeline({
        scrollTrigger: {
          trigger: '.fnc-agency__dashboards',
          start: 'top 72%',
          toggleActions: 'play none none none',
        },
        defaults: { ease: 'power3.out' },
      });

      dashTl
        // Phase 1 — side dashes slide in from outside and settle at "exposed" position
        //           (viewer clearly sees both lateral dashboards before anything hides them)
        .to('.fnc-agency__dash--left',  { x: -65, opacity: 1, rotateY:  3, duration: 0.8 })
        .to('.fnc-agency__dash--right', { x:  65, opacity: 1, rotateY: -3, duration: 0.8 }, '<')
        // Phase 2 — brief pause (+=0.15s), then both converge behind the main dashboard;
        //           the main dashboard rises simultaneously, completing the "hide" effect
        .to('.fnc-agency__dash--left',  { x: 0, rotateY: 0, duration: 1.0, ease: 'power3.inOut' }, '+=0.15')
        .to('.fnc-agency__dash--right', { x: 0, rotateY: 0, duration: 1.0, ease: 'power3.inOut' }, '<')
        .to('.fnc-agency__dash--main',  { opacity: 1, duration: 0.9 }, '<0.05')
        // Phase 3 — floating UI panels stagger in over the settled stack
        .to('.fnc-agency__panel--nav',    { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }, '>-0.3')
        .to('.fnc-agency__panel--widget', { opacity: 1, y: 0, duration: 0.45, ease: 'power2.out' }, '<0.12')
        .to('.fnc-agency__panel--chart',  { opacity: 1, y: 0, duration: 0.45, ease: 'power2.out' }, '<0.12');

      // Mobile-only single dashboard image (replaces stack on ≤1024 px)
      gsap.from('.fnc-agency__dash--mobile', {
        scrollTrigger: { trigger: '.fnc-agency__dashboards', start: 'top 75%' },
        y: 30, opacity: 0, duration: 0.9, delay: 0.2, ease: 'power3.out',
      });

      // Role cards: subtle 3D-tilt reveal with stagger
      gsap.from('.fnc-agency__role-card', {
        scrollTrigger: { trigger: '.fnc-agency__roles', start: 'top 85%' },
        y: 50,
        opacity: 0,
        rotateX: 15,
        transformPerspective: 900,
        duration: 0.75,
        stagger: 0.12,
        ease: 'power3.out',
      });

      // ── Hotels section ─────────────────────────────────────────────────────
      gsap.from('.fnc-hotels__heading', {
        scrollTrigger: { trigger: '.fnc-hotels', start: 'top 78%' },
        y: 40, opacity: 0, duration: 0.85, ease: 'power3.out',
      });
      gsap.from('.fnc-feature-item', {
        scrollTrigger: { trigger: '.fnc-hotels__layout', start: 'top 80%' },
        y: 30, opacity: 0, duration: 0.7, stagger: 0.1, ease: 'power3.out',
      });
    }, el);

    this._destroyRef.onDestroy(() => {
      this._gsapCtx?.revert();
      this._gsapCtx = null;
    });
  }
}

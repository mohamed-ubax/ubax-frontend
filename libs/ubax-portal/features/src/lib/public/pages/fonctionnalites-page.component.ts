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
      gsap.from('.fnc-hero__title', {
        y: 40,
        opacity: 0,
        duration: 0.9,
        ease: 'power3.out',
      });
      gsap.from('.fnc-hero__subtitle', {
        y: 30,
        opacity: 0,
        duration: 0.8,
        delay: 0.15,
        ease: 'power3.out',
      });
      gsap.from('.fnc-hero__pill, .fnc-hero__stores', {
        y: 20,
        opacity: 0,
        duration: 0.7,
        delay: 0.3,
        stagger: 0.12,
        ease: 'power3.out',
      });
      gsap.from('.fnc-hero__visual', {
        x: 60,
        opacity: 0,
        duration: 1,
        delay: 0.2,
        ease: 'power3.out',
      });

      gsap.from('.fnc-how__heading', {
        scrollTrigger: { trigger: '.fnc-how', start: 'top 78%' },
        y: 40,
        opacity: 0,
        duration: 0.85,
        ease: 'power3.out',
      });
      gsap.from('.fnc-step-card', {
        scrollTrigger: { trigger: '.fnc-how__rows', start: 'top 80%' },
        y: 60,
        opacity: 0,
        duration: 0.85,
        stagger: 0.1,
        ease: 'power3.out',
      });

      gsap.from('.fnc-agency__heading', {
        scrollTrigger: { trigger: '.fnc-agency', start: 'top 78%' },
        y: 40,
        opacity: 0,
        duration: 0.85,
        ease: 'power3.out',
      });
      gsap.from('.fnc-agency__role-card', {
        scrollTrigger: { trigger: '.fnc-agency__roles', start: 'top 82%' },
        y: 40,
        opacity: 0,
        duration: 0.7,
        stagger: 0.1,
        ease: 'power3.out',
      });

      gsap.from('.fnc-hotels__heading', {
        scrollTrigger: { trigger: '.fnc-hotels', start: 'top 78%' },
        y: 40,
        opacity: 0,
        duration: 0.85,
        ease: 'power3.out',
      });
      gsap.from('.fnc-feature-item', {
        scrollTrigger: { trigger: '.fnc-hotels__layout', start: 'top 80%' },
        y: 30,
        opacity: 0,
        duration: 0.7,
        stagger: 0.1,
        ease: 'power3.out',
      });
    }, el);

    this._destroyRef.onDestroy(() => {
      this._gsapCtx?.revert();
      this._gsapCtx = null;
    });
  }
}

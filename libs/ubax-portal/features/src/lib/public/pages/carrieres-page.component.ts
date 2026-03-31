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
  imports: [PublicShellComponent, BackToTopComponent, RouterLink, UiPaginationComponent],
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
    "assets/portal-assets/careers/images/ab90ad05-1ffc-4cfb-a21a-0b3bc3fbb1ca-2026-03-25 1.png";
  protected readonly heroEllipseOuter =
    'assets/portal-assets/careers/icons/Ellipse 1.svg';
  protected readonly searchIcon =
    'assets/portal-assets/careers/icons/mynaui_search.svg';
  protected readonly ubaxIcon =
    'assets/portal-assets/careers/icons/Group 1171274746.svg';
  protected readonly goalsIcon =
    'assets/portal-assets/careers/icons/mage_goals.svg';
  protected readonly starIcon =
    'assets/portal-assets/careers/icons/material-symbols_star.svg';
  protected readonly subtractImg =
    'assets/portal-assets/careers/images/Subtract.png';
  protected readonly womanImg =
    'assets/portal-assets/careers/images/woman-looking-through-magnifying-glass.png';
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
      body: "Chaque ligne de code écrite et chaque stratégie commerciale élaborée ont pour unique but ultime de générer une valeur mesurable pour ceux qui utilisent nos services. Nous écoutons activement les besoins du terrain pour que la plateforme Ubax soit un véritable partenaire de croissance pour les entreprises.",
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

    gsap.from('.hero__title', { y: 30, opacity: 0, duration: 0.8, ease });
    gsap.from('.hero__subtitle', { y: 20, opacity: 0, duration: 0.7, delay: 0.15, ease });
    gsap.from('.hero__search', { y: 20, opacity: 0, duration: 0.7, delay: 0.3, ease });
    gsap.from('.hero__visual', { x: -50, opacity: 0, duration: 0.9, delay: 0.2, ease });

    gsap.from('.culture__card', {
      scrollTrigger: { trigger: '.culture', start: 'top 80%' },
      y: 50,
      opacity: 0,
      duration: 0.7,
      stagger: 0.12,
      ease,
      // Clear inline transform after animation so CSS rotate(-3deg) on the
      // featured card (nth-child 2) is not overridden by GSAP's residual style.
      clearProps: 'transform',
    });

    gsap.from('.mission__title', {
      scrollTrigger: { trigger: '.mission', start: 'top 82%' },
      y: 30,
      opacity: 0,
      duration: 0.8,
      ease,
    });

    gsap.from('.info-card', {
      scrollTrigger: { trigger: '.info-section', start: 'top 82%' },
      y: 50,
      opacity: 0,
      duration: 0.75,
      stagger: 0.15,
      ease,
    });

    gsap.from('.job-card', {
      scrollTrigger: { trigger: '.jobs-grid', start: 'top 82%' },
      y: 60,
      opacity: 0,
      duration: 0.75,
      stagger: 0.12,
      ease,
    });
  }

  protected goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage.set(page);
    }
  }
}

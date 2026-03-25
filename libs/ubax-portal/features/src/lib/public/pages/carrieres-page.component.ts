import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  NgZone,
  signal,
} from '@angular/core';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  BackToTopComponent,
  PublicShellComponent,
} from '@ubax-workspace/ubax-portal-layout';
import { UiButtonComponent, UiCardComponent } from '@ubax-workspace/shared-ui';

interface JobOffer {
  id: number;
  company: string;
  type: string;
  title: string;
  location: string;
  skills: string[];
  postedAt: string;
}

@Component({
  selector: 'ubax-carrieres-page',
  imports: [PublicShellComponent, BackToTopComponent, UiButtonComponent, UiCardComponent],
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
  protected readonly pages = computed(() =>
    Array.from({ length: this.totalPages }, (_, i) => i + 1),
  );

  protected readonly avatarCount = Array.from({ length: 6 });

  protected readonly heroPersonImg =
    'assets/portal-assets/careers/images/ab90ad05-1ffc-4cfb-a21a-0b3bc3fbb1ca-2026-03-25 1.webp';
  protected readonly heroEllipse1 =
    'assets/portal-assets/careers/images/source/3ff49f6bce9201392913d6dd5a77326a52a20b6a.webp';
  protected readonly heroEllipse2 =
    'assets/portal-assets/careers/images/source/48a30482d7df50402bec19ecc3472507329d282e.webp';
  protected readonly heroEllipse3 =
    'assets/portal-assets/careers/images/source/a3d3289e9698a1313415ca7a82b1ce0206c9ef58.webp';
  protected readonly infoPeopleImg =
    'assets/portal-assets/careers/images/Rectangle 240648248.webp';

  protected readonly offers: JobOffer[] = [
    {
      id: 1,
      company: 'Ubax',
      type: 'Temps plein',
      title: 'Responsable Commercial',
      location: 'Cocody, Abidjan',
      skills: ['Relation client', 'Prospection', 'Analyse', 'Stratégie', 'CRM', 'Suivi client'],
      postedAt: "Posté il y'a 1 heure",
    },
    {
      id: 2,
      company: 'Ubax',
      type: 'Temps plein',
      title: 'Assistante de Direction',
      location: 'Cocody, Abidjan',
      skills: ['Relation client', 'Prospection', 'Analyse', 'Stratégie', 'CRM', 'Suivi client'],
      postedAt: "Posté il y'a 1 heure",
    },
    {
      id: 3,
      company: 'Ubax',
      type: 'Temps plein',
      title: 'Responsable Commercial',
      location: 'Cocody, Abidjan',
      skills: ['Relation client', 'Prospection', 'Analyse', 'Stratégie', 'CRM', 'Suivi client'],
      postedAt: "Posté il y'a 1 heure",
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

    gsap.from('.hero__badge', { y: -20, opacity: 0, duration: 0.6, ease });
    gsap.from('.hero__title', { y: 30, opacity: 0, duration: 0.8, delay: 0.1, ease });
    gsap.from('.hero__subtitle', { y: 20, opacity: 0, duration: 0.7, delay: 0.25, ease });
    gsap.from('.hero__search', { y: 20, opacity: 0, duration: 0.7, delay: 0.4, ease });
    gsap.from('.hero__visual', { x: 50, opacity: 0, duration: 0.9, delay: 0.3, ease });

    gsap.from('.about__heading', {
      scrollTrigger: { trigger: '.about', start: 'top 82%' },
      y: 40,
      opacity: 0,
      duration: 0.8,
      ease,
    });

    gsap.from('.info-card', {
      scrollTrigger: { trigger: '.info-cards', start: 'top 82%' },
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

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
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {
  BackToTopComponent,
  PublicShellComponent,
} from '@ubax-workspace/ubax-portal-layout';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

interface CandidatureForm {
  nom: string;
  email: string;
  telephone: string;
  metier: string;
  niveauExperience: string;
  lettreMotivation: string;
}

// Minimal job title map — mirrors the data in carrieres-detail
const JOB_TITLES: Record<number, string> = {
  1: 'Responsable Commercial',
  2: 'Assistant(e) Comptable',
  3: 'Assistante de Direction',
};

@Component({
  selector: 'ubax-carrieres-candidature-page',
  imports: [PublicShellComponent, BackToTopComponent, RouterLink, FormsModule],
  templateUrl: './carrieres-candidature-page.component.html',
  styleUrl: './carrieres-candidature-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CarrieresCandidaturePage {
  private readonly elRef = inject(ElementRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly zone = inject(NgZone);
  private gsapCtx: gsap.Context | undefined;

  protected readonly successVisible = signal(false);
  protected readonly elementsIcon =
    'assets/portal-assets/careers/icons/Elements.svg';
  protected readonly cvIcon =
    'assets/portal-assets/careers/icons/Ellipse 1.svg';

  /** Job title resolved from the route :id param, or null if not found. */
  protected readonly jobTitle: string | null;

  protected readonly niveauxExperience = [
    'Débutant',
    'Intermédiaire',
    'Confirmé',
    'Expert',
  ];

  protected readonly form: CandidatureForm;

  constructor() {
    const route = inject(ActivatedRoute);
    const id = Number(route.snapshot.paramMap.get('id'));
    this.jobTitle = JOB_TITLES[id] ?? null;

    this.form = {
      nom: '',
      email: '',
      telephone: '',
      metier: this.jobTitle ?? '',
      niveauExperience: '',
      lettreMotivation: '',
    };

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

    // ── Page hero ───────────────────────────────────────────────────────────
    gsap.timeline({ defaults: { ease } })
      .from('.page-hero__icon-box', {
        scale: 0, opacity: 0, duration: 0.7, ease: 'back.out(1.7)',
      })
      .from('.page-hero__title', { y: 28, opacity: 0, duration: 0.75 }, '-=0.35');

    // ── Main form card ──────────────────────────────────────────────────────
    gsap.from('.candidature-main__card', {
      scrollTrigger: { trigger: '.candidature-layout', start: 'top 88%' },
      y: 45, opacity: 0, duration: 0.85, ease,
    });
    gsap.from(['.candidature-main__title', '.candidature-main__subtitle'], {
      scrollTrigger: { trigger: '.candidature-main__card', start: 'top 85%' },
      y: 25, opacity: 0, duration: 0.7, stagger: 0.12, ease,
    });

    // ── Form fields staggered reveal ────────────────────────────────────────
    gsap.from('.form-field', {
      scrollTrigger: { trigger: '.candidature-form', start: 'top 88%' },
      y: 22, opacity: 0, duration: 0.5, stagger: 0.07, ease,
    });

    // ── CV sidebar slides in from the right ─────────────────────────────────
    gsap.from('.cv-card', {
      scrollTrigger: { trigger: '.candidature-layout', start: 'top 88%' },
      x: 55, opacity: 0, duration: 0.85, delay: 0.22, ease,
    });
  }

  protected submitForm(event: Event): void {
    event.preventDefault();
    this.successVisible.set(true);
  }

  protected closeSuccess(): void {
    this.successVisible.set(false);
  }
}

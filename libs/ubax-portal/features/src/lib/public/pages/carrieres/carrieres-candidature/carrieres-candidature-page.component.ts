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

  // ── CV upload ───────────────────────────────────────────────────────────────
  protected readonly cvFile = signal<File | null>(null);
  protected readonly cvObjectUrl = signal<string>('');

  protected readonly cvFileSizeLabel = () => {
    const file = this.cvFile();
    if (!file) return '';
    const kb = file.size / 1024;
    return kb < 1024 ? `${Math.round(kb)} Ko` : `${(kb / 1024).toFixed(1)} Mo`;
  };

  /** Job title resolved from the route :id param, or null if not found. */
  protected readonly jobTitle: string | null;
  protected readonly formTitle: string;
  protected readonly formSubtitle: string;
  protected readonly submitLabel: string;
  protected readonly successMessage: string;

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

    const isSpecificApplication = this.jobTitle !== null;

    this.formTitle = isSpecificApplication
      ? 'Déposez votre candidature pour ce poste'
      : 'Restez informé des opportunités qui vous correspondent';
    this.formSubtitle = isSpecificApplication
      ? 'Remplissez ce formulaire en quelques minutes et joignez votre CV. Notre équipe de recrutement analysera votre dossier avec attention.'
      : "Remplissez ce formulaire en quelques minutes. Dès qu'une offre correspondant à votre profil est disponible, vous serez contacté directement.";
    this.submitLabel = isSpecificApplication
      ? 'Déposer ma candidature'
      : 'Déposer mon profil';
    this.successMessage = isSpecificApplication
      ? `Merci ! Votre candidature a bien été reçue avec succès.
Nous vous remercions pour l’intérêt que vous portez à notre offre.`
      : 'Merci ! Votre profil a bien été enregistré. Nous vous contacterons dès qu’une opportunité correspond à votre profil.';

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
      const url = this.cvObjectUrl();
      if (url) URL.revokeObjectURL(url);
    });
  }

  private initAnimations(): void {
    const ease = 'power3.out';

    // ── Page hero ───────────────────────────────────────────────────────────
    gsap
      .timeline({ defaults: { ease } })
      .from('.page-hero__icon-box', {
        scale: 0,
        opacity: 0,
        duration: 0.7,
        ease: 'back.out(1.7)',
      })
      .from(
        '.page-hero__title',
        { y: 28, opacity: 0, duration: 0.75 },
        '-=0.35',
      );

    // ── Main form card ──────────────────────────────────────────────────────
    gsap.from('.candidature-main__card', {
      scrollTrigger: { trigger: '.candidature-layout', start: 'top 88%' },
      y: 45,
      opacity: 0,
      duration: 0.85,
      ease,
    });
    gsap.from(['.candidature-main__title', '.candidature-main__subtitle'], {
      scrollTrigger: { trigger: '.candidature-main__card', start: 'top 85%' },
      y: 25,
      opacity: 0,
      duration: 0.7,
      stagger: 0.12,
      ease,
    });

    // ── Form fields staggered reveal ────────────────────────────────────────
    gsap.from('.form-field', {
      scrollTrigger: { trigger: '.candidature-form', start: 'top 88%' },
      y: 22,
      opacity: 0,
      duration: 0.5,
      stagger: 0.07,
      ease,
    });

    // ── CV sidebar slides in from the right ─────────────────────────────────
    gsap.from('.cv-card', {
      scrollTrigger: { trigger: '.candidature-layout', start: 'top 88%' },
      x: 55,
      opacity: 0,
      duration: 0.85,
      delay: 0.22,
      ease,
    });
  }

  protected onCvSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    // Révoquer l'ancienne URL objet avant d'en créer une nouvelle
    const prev = this.cvObjectUrl();
    if (prev) URL.revokeObjectURL(prev);

    this.cvFile.set(file);
    this.cvObjectUrl.set(URL.createObjectURL(file));

    // Réinitialiser l'input pour permettre de re-sélectionner le même fichier
    input.value = '';
  }

  protected removeCv(): void {
    const url = this.cvObjectUrl();
    if (url) URL.revokeObjectURL(url);
    this.cvFile.set(null);
    this.cvObjectUrl.set('');
  }

  protected submitForm(event: Event): void {
    event.preventDefault();
    this.successVisible.set(true);
  }

  protected closeSuccess(): void {
    this.successVisible.set(false);
  }
}

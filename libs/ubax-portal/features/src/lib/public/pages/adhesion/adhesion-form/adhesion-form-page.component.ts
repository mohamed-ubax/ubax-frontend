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
import {
  FormBuilder,
  Validators,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
  BackToTopComponent,
  LenisService,
  PublicShellComponent,
} from '@ubax-workspace/ubax-portal-layout';
import { Select } from 'primeng/select';
import { COUNTRY_CODES, type CountryCode } from '../../../shared/country-codes';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

@Component({
  selector: 'ubax-adhesion-form-page',
  standalone: true,
  imports: [
    PublicShellComponent,
    BackToTopComponent,
    ReactiveFormsModule,
    FormsModule,
    RouterLink,
    Select,
  ],
  templateUrl: './adhesion-form-page.component.html',
  styleUrl: './adhesion-form-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdhesionFormPageComponent {
  private readonly _fb = inject(FormBuilder);
  private readonly _el = inject(ElementRef<HTMLElement>);
  private readonly _destroyRef = inject(DestroyRef);
  private readonly _lenis = inject(LenisService);
  private readonly _router = inject(Router);
  private readonly _zone = inject(NgZone);
  private _gsapCtx: gsap.Context | null = null;
  private _submitTimer: ReturnType<typeof setTimeout> | null = null;

  // ── UI state ─────────────────────────────────────────────────────────────
  protected readonly submitted = signal(false);
  protected readonly loading = signal(false);
  protected readonly serverError = signal<string | null>(null);

  // ── File state ────────────────────────────────────────────────────────────
  protected readonly logoFile = signal<File | null>(null);
  protected readonly documentFile = signal<File | null>(null);

  // ── Country picker (standalone from reactive form) ────────────────────────
  protected readonly countries = COUNTRY_CODES;
  protected selectedCountry: CountryCode = COUNTRY_CODES[0];

  // ── Select options ────────────────────────────────────────────────────────
  protected readonly typesPartenaire = [
    { label: 'Hôtel', value: 'hotel' },
    { label: 'Agence immobilière', value: 'agence_immo' },
  ];

  protected readonly paysList = [
    "Côte d'Ivoire",
    'Sénégal',
    'Mali',
    'Burkina Faso',
    'Guinée',
    'Niger',
    'Togo',
    'Bénin',
    'Nigeria',
    'Ghana',
    'Cameroun',
    'Maroc',
  ];

  protected readonly villesList = [
    'Abidjan',
    'Bouaké',
    'Daloa',
    'Yamoussoukro',
    'San Pedro',
    'Dakar',
    'Bamako',
    'Ouagadougou',
    'Conakry',
    'Lomé',
    'Cotonou',
    'Accra',
    'Lagos',
    'Casablanca',
  ];

  protected readonly statutsJuridiques = [
    {
      label: 'SARL (très répandue pour les agences)',
      value: 'sarl',
    },
    {
      label: 'SCI (gestion de patrimoine familial)',
      value: 'sci',
    },
    {
      label: 'SAS / SASU (flexibilité)',
      value: 'sas_sasu',
    },
    {
      label: 'SCCV (promotion immobilière)',
      value: 'sccv',
    },
  ];

  // ── Reactive form ─────────────────────────────────────────────────────────
  protected readonly form = this._fb.group({
    // Section 1 — Informations partenaires
    typePartenaire: ['', Validators.required],
    raisonSociale: ['', Validators.required],
    representantLegal: [''],
    telephone: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    // Localisation
    pays: ['', Validators.required],
    ville: ['', Validators.required],
    adressePostale: ['', Validators.required],
    quartier: ['', Validators.required],
    // Section 2 — Informations établissement
    description: [''],
    statutJuridique: ['', Validators.required],
    numeroAgrement: [''],
    acceptTerms: [false, Validators.requiredTrue],
  });

  constructor() {
    afterNextRender(() => {
      this._zone.runOutsideAngular(() => {
        gsap.registerPlugin(ScrollTrigger);
        this._gsapCtx = gsap.context(
          () => this._initAnimations(),
          this._el.nativeElement,
        );
      });
    });

    this._destroyRef.onDestroy(() => {
      this._gsapCtx?.revert();
      this._gsapCtx = null;

      if (this._submitTimer) {
        clearTimeout(this._submitTimer);
        this._submitTimer = null;
      }
    });
  }

  // ── GSAP entrance animations ──────────────────────────────────────────────
  private _initAnimations(): void {
    if (globalThis.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches) {
      return;
    }

    const ease = 'power3.out';

    gsap
      .timeline({ defaults: { ease } })
      .from('.adhesion-hero__card', {
        y: 34,
        autoAlpha: 0,
        scale: 0.985,
        duration: 0.82,
      })
      .from(
        '.adhesion-hero__logo-group',
        { x: -24, autoAlpha: 0, duration: 0.58 },
        '-=0.46',
      )
      .from(
        '.adhesion-hero__ubax-wrap',
        {
          x: -18,
          y: 18,
          autoAlpha: 0,
          scale: 0.84,
          rotate: -8,
          duration: 0.92,
          ease: 'back.out(1.45)',
        },
        '-=0.46',
      )
      .from(
        '.adhesion-hero__title',
        { y: 32, autoAlpha: 0, duration: 0.74 },
        '-=0.58',
      )
      .from(
        '.adhesion-hero__subtitle',
        { y: 18, autoAlpha: 0, duration: 0.62 },
        '-=0.45',
      );

    gsap.to('.adhesion-hero__card-bg', {
      yPercent: 4,
      scale: 1.02,
      ease: 'none',
      scrollTrigger: {
        trigger: '.adhesion-hero',
        start: 'top top',
        end: 'bottom top',
        scrub: 1.1,
      },
    });

    gsap.to('.adhesion-hero__ubax-wrap', {
      yPercent: -6,
      xPercent: -3,
      ease: 'none',
      scrollTrigger: {
        trigger: '.adhesion-hero',
        start: 'top top',
        end: 'bottom top',
        scrub: 1.15,
      },
    });

    gsap.from('.adhesion-form-wrapper', {
      scrollTrigger: {
        trigger: '.adhesion-form-wrapper',
        start: 'top 88%',
        once: true,
      },
      y: 42,
      autoAlpha: 0,
      duration: 0.88,
      ease,
    });

    gsap.utils
      .toArray<HTMLElement>('.form-section')
      .forEach((section: HTMLElement) => {
        const revealItems = [
          section.querySelector<HTMLElement>('.form-section__header'),
          ...Array.from(
            section.querySelectorAll<HTMLElement>(
              '.form-section__sub-header, .form-row, .form-field',
            ),
          ),
        ].filter((item): item is HTMLElement => item !== null);

        gsap.from(revealItems, {
          scrollTrigger: {
            trigger: section,
            start: 'top 84%',
            once: true,
          },
          y: 24,
          autoAlpha: 0,
          duration: 0.72,
          stagger: 0.05,
          ease: 'power2.out',
        });
      });

    gsap.from(['.form-consent', '.form-submit-row'], {
      scrollTrigger: {
        trigger: '.form-consent',
        start: 'top 92%',
        once: true,
      },
      y: 20,
      autoAlpha: 0,
      duration: 0.7,
      stagger: 0.12,
      ease,
    });
  }

  // ── Validation helpers ────────────────────────────────────────────────────
  protected isInvalid(name: string): boolean {
    const ctrl = this.form.get(name);
    return !!(ctrl?.invalid && (ctrl.touched || this.submitted()));
  }

  // ── Logo upload ───────────────────────────────────────────────────────────
  protected onLogoSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0] ?? null;
    this.logoFile.set(file);
    (event.target as HTMLInputElement).value = '';
  }

  protected removeLogo(): void {
    this.logoFile.set(null);
  }

  // ── Document upload ───────────────────────────────────────────────────────
  protected onDocumentSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0] ?? null;
    this.documentFile.set(file);
    (event.target as HTMLInputElement).value = '';
  }

  protected removeDocument(): void {
    this.documentFile.set(null);
  }

  // ── Submit ────────────────────────────────────────────────────────────────
  protected onSubmit(): void {
    this.submitted.set(true);
    this.serverError.set(null);
    this.form.markAllAsTouched();

    if (this.form.invalid) {
      // Scroll smoothly to the first invalid field using Lenis when available.
      const firstInvalid = this._el.nativeElement.querySelector(
        '.form-field__input.ng-invalid, .form-field__select.ng-invalid, .form-field__textarea.ng-invalid, .form-consent__checkbox.ng-invalid',
      ) as HTMLElement | null;

      if (firstInvalid) {
        const headerHeight =
          document
            .querySelector<HTMLElement>('.main-header')
            ?.getBoundingClientRect().height ?? 80;
        const absoluteTop =
          firstInvalid.getBoundingClientRect().top + globalThis.scrollY;

        firstInvalid.focus({ preventScroll: true });

        if (this._lenis.instance) {
          this._lenis.instance.scrollTo(absoluteTop - headerHeight - 24, {
            duration: 1.05,
            easing: (t: number) => 1 - Math.pow(1 - t, 4),
          });
        } else {
          globalThis.scrollTo({
            top: absoluteTop - headerHeight - 24,
            behavior: 'smooth',
          });
        }
      }

      return;
    }

    this.loading.set(true);

    // Wire to real API endpoint here — simulate for now
    this._submitTimer = setTimeout(() => {
      this.loading.set(false);
      this._submitTimer = null;
      void this._router.navigateByUrl('/adhesion/validation');
    }, 1200);
  }
}

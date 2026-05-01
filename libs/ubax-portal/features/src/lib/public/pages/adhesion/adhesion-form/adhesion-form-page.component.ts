import {
  inject,
  NgZone,
  signal,
  computed,
  Component,
  DestroyRef,
  afterNextRender,
  ElementRef,
  ChangeDetectionStrategy,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import {
  FormBuilder,
  Validators,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import {
  LenisService,
  BackToTopComponent,
  PublicShellComponent,
} from '@ubax-workspace/ubax-portal-layout';
import gsap from 'gsap';
import { firstValueFrom } from 'rxjs';
import { Select } from 'primeng/select';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { PartnerService } from '../services/partner.service';
import { CodeListService } from '../../../shared/code-list.service';
import { type PartnerApplyRequest } from '../models/partner-application.model';
import { COUNTRY_CODES, type CountryCode } from '../../../shared/country-codes';

type LegalDocumentType = 'rccm' | 'dfe' | 'contratBail';

@Component({
  selector: 'ubax-adhesion-form-page',
  standalone: true,
  imports: [
    Select,
    RouterLink,
    FormsModule,
    BackToTopComponent,
    ReactiveFormsModule,
    PublicShellComponent,
  ],
  styleUrl: './adhesion-form-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './adhesion-form-page.component.html',
})
export class AdhesionFormPageComponent {
  private readonly _fb = inject(FormBuilder);
  private readonly _el = inject(ElementRef<HTMLElement>);
  private readonly _destroyRef = inject(DestroyRef);
  private readonly _lenis = inject(LenisService);
  private readonly _router = inject(Router);
  private readonly _zone = inject(NgZone);
  private readonly _codeListService = inject(CodeListService);
  private readonly _partnerService = inject(PartnerService);
  private _gsapCtx: gsap.Context | null = null;

  // ── UI state ──────────────────────────────────────────────────────────────
  protected readonly submitted = signal(false);
  protected readonly loading = signal(false);
  protected readonly serverError = signal<string | null>(null);

  // ── Partner type (reactive) ───────────────────────────────────────────────
  protected readonly partnerType = signal<string>('');
  protected readonly isHotel = computed(() => this.partnerType() === 'HOTEL');
  protected readonly isAgence = computed(
    () => this.partnerType() === 'AGENCE_IMMOBILIERE',
  );

  // ── File state ────────────────────────────────────────────────────────────
  protected readonly logoFile = signal<File | null>(null);
  protected readonly rccmFile = signal<File | null>(null);
  protected readonly dfeFile = signal<File | null>(null);
  protected readonly contratBailFile = signal<File | null>(null);

  // ── Country picker (standalone from reactive form) ────────────────────────
  protected readonly countries = COUNTRY_CODES;
  protected selectedCountry: CountryCode = COUNTRY_CODES[0];

  // ── Select options ────────────────────────────────────────────────────────
  protected readonly typesPartenaire = toSignal(
    this._codeListService.getByType('PARTNER_TYPE'),
    { initialValue: [] },
  );

  protected readonly statutsJuridiques = toSignal(
    this._codeListService.getByType('LEGAL_STATUS'),
    { initialValue: [] },
  );

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
    'SN',
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

  // ── Reactive form ─────────────────────────────────────────────────────────
  protected readonly form = this._fb.group({
    typePartenaire: ['', Validators.required],
    raisonSociale: ['', Validators.required],
    representantLegal: ['', Validators.required],
    telephone: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    pays: ['', Validators.required],
    // ville & adressePostale : requis uniquement pour HOTEL (validateurs dynamiques)
    ville: [''],
    adressePostale: [''],
    quartier: [''],
    latitude: [null as number | null, [Validators.min(-90), Validators.max(90)]],
    longitude: [null as number | null, [Validators.min(-180), Validators.max(180)]],
    description: [''],
    statutJuridique: ['', Validators.required],
    numeroAgrement: ['', Validators.required],
    acceptTerms: [false, Validators.requiredTrue],
  });

  constructor() {
    this.form
      .get('typePartenaire')
      ?.valueChanges.pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe((type) => {
        this.partnerType.set(type ?? '');
        this._updateLocationValidators(type ?? '');
        if (type !== 'AGENCE_IMMOBILIERE') this.contratBailFile.set(null);
      });

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
    });
  }

  // ── Dynamic validators ────────────────────────────────────────────────────
  private _updateLocationValidators(type: string): void {
    const ville = this.form.get('ville');
    const adressePostale = this.form.get('adressePostale');
    if (!ville || !adressePostale) return;

    if (type === 'HOTEL') {
      ville.setValidators(Validators.required);
      adressePostale.setValidators(Validators.required);
    } else {
      ville.clearValidators();
      adressePostale.clearValidators();
    }

    ville.updateValueAndValidity({ emitEvent: false });
    adressePostale.updateValueAndValidity({ emitEvent: false });
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

  protected isFileMissing(type: 'rccm' | 'dfe' | 'bail'): boolean {
    if (!this.submitted()) return false;
    switch (type) {
      case 'rccm':
        return !this.rccmFile();
      case 'dfe':
        return !this.dfeFile();
      case 'bail':
        return this.isAgence() && !this.contratBailFile();
    }
  }

  // ── Phone input ───────────────────────────────────────────────────────────
  protected onPhoneInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const stripped = input.value.replace(/\D/g, '');
    if (stripped !== input.value) {
      input.value = stripped;
      this.form.get('telephone')?.setValue(stripped, { emitEvent: false });
    }
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
  protected onLegalDocumentSelected(
    type: LegalDocumentType,
    event: Event,
  ): void {
    const file = (event.target as HTMLInputElement).files?.[0] ?? null;
    this._setLegalDocumentFile(type, file);
    (event.target as HTMLInputElement).value = '';
  }

  protected removeLegalDocument(type: LegalDocumentType): void {
    this._setLegalDocumentFile(type, null);
  }

  protected legalDocumentFile(type: LegalDocumentType): File | null {
    switch (type) {
      case 'rccm':
        return this.rccmFile();
      case 'dfe':
        return this.dfeFile();
      case 'contratBail':
        return this.contratBailFile();
    }
  }

  private _setLegalDocumentFile(
    type: LegalDocumentType,
    file: File | null,
  ): void {
    switch (type) {
      case 'rccm':
        this.rccmFile.set(file);
        break;
      case 'dfe':
        this.dfeFile.set(file);
        break;
      case 'contratBail':
        this.contratBailFile.set(file);
        break;
    }
  }

  // ── Submit ────────────────────────────────────────────────────────────────
  protected async onSubmit(): Promise<void> {
    this.submitted.set(true);
    this.serverError.set(null);
    this.form.markAllAsTouched();

    const rccmMissing = !this.rccmFile();
    const dfeMissing = !this.dfeFile();
    const bailMissing = this.isAgence() && !this.contratBailFile();

    if (this.form.invalid || rccmMissing || dfeMissing || bailMissing) {
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

    const v = this.form.value;
    const data: PartnerApplyRequest = {
      partnerType: v.typePartenaire ?? '',
      companyName: v.raisonSociale ?? '',
      legalRepresentative: v.representantLegal ?? '',
      phone: `+${this.selectedCountry.dialCode}${v.telephone ?? ''}`,
      email: v.email ?? '',
      country: v.pays ?? '',
      city: v.ville || undefined,
      postalAddress: v.adressePostale || undefined,
      zone: v.quartier || undefined,
      latitude: v.latitude ?? undefined,
      longitude: v.longitude ?? undefined,
      description: v.description || undefined,
      legalStatus: v.statutJuridique ?? '',
      registrationNumber: v.numeroAgrement ?? '',
    };

    const rccm = this.rccmFile();
    const dfe = this.dfeFile();
    const bail = this.contratBailFile();
    const logo = this.logoFile();

    const formData = new FormData();
    // formData.append('data', JSON.stringify(data));
    formData.append(
      'data',
      new Blob([JSON.stringify(data)], { type: 'application/json' }),
    );
    if (rccm) formData.append('rccm', rccm);
    if (dfe) formData.append('dfe', dfe);
    if (bail) formData.append('bail', bail);
    if (logo) formData.append('logo', logo);

    try {
      await firstValueFrom(this._partnerService.apply(formData));
      void this._router.navigateByUrl('/adhesion/validation');
    } catch (error) {
      this.serverError.set(this._resolveError(error));
    } finally {
      this.loading.set(false);
    }
  }

  private _resolveError(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 409)
        return "Une demande d'adhésion existe déjà pour cet email.";
      if (error.status === 400)
        return 'Données invalides. Vérifiez vos informations.';
      if (error.status === 0)
        return 'Le serveur est inaccessible. Réessayez dans un instant.';
    }
    return 'Une erreur est survenue. Réessayez dans un instant.';
  }
}

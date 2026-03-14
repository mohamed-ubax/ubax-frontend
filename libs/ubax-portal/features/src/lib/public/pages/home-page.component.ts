import {
  afterNextRender,
  Component,
  DestroyRef,
  ElementRef,
  ViewChild,
  inject,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  PublicShellComponent,
  LenisService,
} from '@ubax-workspace/ubax-portal-layout';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

@Component({
  selector: 'ubax-home-page',
  imports: [RouterLink, PublicShellComponent],
  templateUrl: './home-page.component.html',
  styleUrl: './home-page.component.scss',
})
export class HomePageComponent {
  private readonly elRef = inject(ElementRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly lenis = inject(LenisService);
  private gsapCtx: gsap.Context | undefined;

  @ViewChild('bttBtn') private readonly bttRef!: ElementRef<HTMLButtonElement>;

  constructor() {
    afterNextRender(() => {
      gsap.registerPlugin(ScrollTrigger);
      this.gsapCtx = gsap.context(
        () => this.initAnimations(),
        this.elRef.nativeElement,
      );
    });

    this.destroyRef.onDestroy(() => {
      this.gsapCtx?.revert();
    });
  }

  scrollToTop(): void {
    const lenis = this.lenis.instance;
    if (lenis) {
      lenis.scrollTo(0, {
        duration: 2,
        easing: (t: number) => 1 - Math.pow(1 - t, 4), // easeOutQuart
      });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  private initAnimations(): void {
    const ease = 'power3.out';

    // -- BACK TO TOP � appears after hero leaves viewport -----------------
    const btt = this.bttRef.nativeElement;
    ScrollTrigger.create({
      trigger: '.hp-hero',
      start: 'bottom 30%',
      onEnter: () =>
        gsap.to(btt, {
          opacity: 1,
          y: 0,
          duration: 0.55,
          ease: 'power3.out',
          pointerEvents: 'auto',
          overwrite: true,
        }),
      onLeaveBack: () =>
        gsap.to(btt, {
          opacity: 0,
          y: 18,
          duration: 0.4,
          ease: 'power2.in',
          pointerEvents: 'none',
          overwrite: true,
        }),
    });

    // -- 1. HERO � image first, then copy rises in -------------------------
    const heroTl = gsap.timeline({ defaults: { ease } });
    heroTl
      .from(
        '.hp-hero__img',
        { x: 80, opacity: 0, scale: 0.95, duration: 1.4 },
        0,
      )
      .from(
        '.hp-hero__line',
        { autoAlpha: 0, y: 34, duration: 1, ease: 'power3.out', stagger: 0.24 },
        0.75,
      )
      .from('.hp-hero__tagline', { y: 26, opacity: 0, duration: 1.1 }, '-=0.55')
      .from(
        '.hp-store-pill',
        {
          y: 26,
          opacity: 0,
          duration: 0.9,
          stagger: 0.16,
          ease: 'back.out(1.8)',
        },
        '-=0.5',
      );

    // -- 2. STEPS � sequential after hero, scroll as fallback -------------
    const stepsTl = gsap.timeline({ paused: true });
    stepsTl
      .from('.hp-step', { y: 70, opacity: 0, duration: 1, stagger: 0.2, ease }, 0)
      .from(
        '.hp-step__icon',
        { scale: 0.45, opacity: 0, duration: 0.9, stagger: 0.2, ease: 'back.out(2.2)' },
        0,
      );

    // Fallback : si l'utilisateur scrolle avant la fin du hero
    ScrollTrigger.create({
      trigger: '.hp-steps',
      start: 'top 80%',
      once: true,
      onEnter: () => { if (stepsTl.progress() === 0) stepsTl.play(); },
    });

    // Declenchement sequentiel : joue des que le hero est termine
    heroTl.then(() => { if (stepsTl.progress() === 0) stepsTl.play(); });

    // -- 3. FEATURES � left/right split + phone elastic pop ---------------
    gsap.from('.hp-feat-col:first-child .hp-feat', {
      scrollTrigger: { trigger: '.hp-features__grid', start: 'top 58%' },
      x: -65,
      opacity: 0,
      duration: 1,
      stagger: 0.18,
      ease,
    });
    gsap.from('.hp-feat-col:last-child .hp-feat', {
      scrollTrigger: { trigger: '.hp-features__grid', start: 'top 58%' },
      x: 65,
      opacity: 0,
      duration: 1,
      stagger: 0.18,
      ease,
    });
    gsap.from('.hp-phone-ring', {
      scrollTrigger: { trigger: '.hp-features__grid', start: 'top 58%' },
      scale: 0.72,
      opacity: 0,
      y: 40,
      duration: 1.4,
      ease: 'elastic.out(1, 0.7)',
      onComplete: () => {
        (this.elRef.nativeElement as HTMLElement)
          .querySelector('.hp-phone-ring')
          ?.classList.add('is-pulsing');
      },
    });
    // Continuous parallax float on the features phone
    gsap.to('.hp-phone-ring', {
      scrollTrigger: {
        trigger: '.hp-features',
        start: 'top bottom',
        end: 'bottom top',
        scrub: 1.4,
      },
      y: -55,
      ease: 'none',
    });

    // -- 4. LOCATION � magazine-split entrance ----------------------------
    gsap.from('.hp-location__media', {
      scrollTrigger: { trigger: '.hp-location', start: 'top 55%' },
      x: -90,
      opacity: 0,
      duration: 1.2,
      ease,
    });
    gsap.from('.hp-location__copy h2', {
      scrollTrigger: { trigger: '.hp-location', start: 'top 55%' },
      clipPath: 'inset(0 100% 0 0)',
      duration: 1.1,
      ease: 'expo.inOut',
    });
    gsap.from('.hp-location__list li', {
      scrollTrigger: { trigger: '.hp-location__list', start: 'top 65%' },
      x: 55,
      opacity: 0,
      duration: 0.9,
      stagger: 0.18,
      ease,
    });
    gsap.from('.hp-location .hp-btn-dark', {
      scrollTrigger: { trigger: '.hp-location .hp-btn-dark', start: 'top 80%' },
      y: 22,
      opacity: 0,
      scale: 0.88,
      duration: 0.8,
      ease: 'back.out(1.8)',
    });
    // Subtle parallax on location image
    gsap.to('.hp-location__media img', {
      scrollTrigger: {
        trigger: '.hp-location',
        start: 'top bottom',
        end: 'bottom top',
        scrub: 1.2,
      },
      y: -30,
      ease: 'none',
    });

    // -- 5. HOTELS � alternating reveal + composite parallax --------------
    gsap.from('.hp-hotels__copy', {
      scrollTrigger: { trigger: '.hp-hotels', start: 'top 55%' },
      x: -70,
      opacity: 0,
      duration: 1.1,
      ease,
    });
    gsap.from('.hp-hotels__visual', {
      scrollTrigger: { trigger: '.hp-hotels', start: 'top 55%' },
      x: 70,
      opacity: 0,
      duration: 1.1,
      ease,
    });
    gsap.from('.hp-hotel-row', {
      scrollTrigger: { trigger: '.hp-hotel-rows', start: 'top 65%' },
      y: 45,
      opacity: 0,
      duration: 0.9,
      stagger: 0.18,
      ease: 'power2.out',
    });
    gsap.to('.hp-hotels__composite', {
      scrollTrigger: {
        trigger: '.hp-hotels',
        start: 'top bottom',
        end: 'bottom top',
        scrub: 1.2,
      },
      y: -40,
      ease: 'none',
    });

    // -- 6. DASHBOARD � phones swing in with rotation ---------------------
    gsap.from('.hp-dash-phone--left', {
      scrollTrigger: { trigger: '.hp-dashboard', start: 'top 55%' },
      x: -100,
      rotation: -14,
      opacity: 0,
      duration: 1.3,
      ease: 'power3.out',
    });
    gsap.from('.hp-dash-phone--right', {
      scrollTrigger: { trigger: '.hp-dashboard', start: 'top 55%' },
      x: 100,
      rotation: 14,
      opacity: 0,
      duration: 1.3,
      delay: 0.22,
      ease: 'power3.out',
    });
    gsap.from('.hp-dash-stat, .hp-dash-widget, .hp-dash-cercle', {
      scrollTrigger: { trigger: '.hp-dashboard__phones', start: 'top 60%' },
      scale: 0.65,
      opacity: 0,
      duration: 1,
      stagger: 0.15,
      ease: 'back.out(2)',
    });
    gsap.from('.hp-dashboard__copy .hp-dash-item', {
      scrollTrigger: { trigger: '.hp-dashboard__copy', start: 'top 60%' },
      x: 70,
      opacity: 0,
      duration: 0.95,
      stagger: 0.2,
      ease,
    });

    // -- 7. PAYMENTS orbit � logos pop in + center person -----------------
    gsap.from('.hp-pay-center', {
      scrollTrigger: { trigger: '.hp-payments', start: 'top 55%' },
      scale: 0.78,
      opacity: 0,
      duration: 1.2,
      ease: 'elastic.out(1, 0.72)',
    });
    // CSS animation handles orbit transform; GSAP only fades logos in
    gsap.to('.hp-pay-logo', {
      scrollTrigger: { trigger: '.hp-payments', start: 'top 55%' },
      opacity: 1,
      duration: 0.8,
      stagger: { each: 0.1, from: 'edges' },
      ease: 'power2.out',
    });
    // h2 text-wipe
    gsap.from('.hp-payments__copy h2', {
      scrollTrigger: { trigger: '.hp-payments', start: 'top 58%' },
      clipPath: 'inset(0 100% 0 0)',
      duration: 1.1,
      ease: 'expo.inOut',
    });
    gsap.from('.hp-payments__copy p', {
      scrollTrigger: { trigger: '.hp-payments', start: 'top 58%' },
      x: -50,
      opacity: 0,
      duration: 0.95,
      delay: 0.22,
      ease,
    });
  }
}

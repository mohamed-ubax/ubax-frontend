import {
  afterNextRender,
  Component,
  DestroyRef,
  ElementRef,
  inject,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { PublicShellComponent } from '@ubax-workspace/ubax-portal-layout';
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
  private gsapCtx: gsap.Context | undefined;

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

  private initAnimations(): void {
    const ease = 'power3.out';

    // ── 1. HERO — cinematic text-wipe + rising elements ──────────────────
    const heroTl = gsap.timeline({ defaults: { ease } });
    heroTl
      .from('.hp-hero__line', {
        autoAlpha: 0,
        y: 28,
        duration: 0.6,
        ease: 'power3.out',
        stagger: 0.18,
      })
      .from('.hp-hero__tagline', { y: 22, opacity: 0, duration: 0.72 }, '-=0.5')
      .from(
        '.hp-store-pill',
        {
          y: 24,
          opacity: 0,
          duration: 0.65,
          stagger: 0.12,
          ease: 'back.out(1.8)',
        },
        '-=0.4',
      )
      .from(
        '.hp-hero__img',
        { x: 90, opacity: 0, scale: 0.94, duration: 1 },
        0.15,
      );

    // ── 2. STEPS — numbered cards stagger up ─────────────────────────────
    gsap.from('.hp-step', {
      scrollTrigger: { trigger: '.hp-steps', start: 'top 82%' },
      y: 65,
      opacity: 0,
      duration: 0.72,
      stagger: 0.15,
      ease,
    });
    gsap.from('.hp-step__icon', {
      scrollTrigger: { trigger: '.hp-steps', start: 'top 82%' },
      scale: 0.45,
      opacity: 0,
      duration: 0.65,
      stagger: 0.15,
      ease: 'back.out(2.2)',
    });

    // ── 3. FEATURES — left/right split + phone elastic pop ───────────────
    gsap.from('.hp-feat-col:first-child .hp-feat', {
      scrollTrigger: { trigger: '.hp-features__grid', start: 'top 78%' },
      x: -60,
      opacity: 0,
      duration: 0.75,
      stagger: 0.14,
      ease,
    });
    gsap.from('.hp-feat-col:last-child .hp-feat', {
      scrollTrigger: { trigger: '.hp-features__grid', start: 'top 78%' },
      x: 60,
      opacity: 0,
      duration: 0.75,
      stagger: 0.14,
      ease,
    });
    gsap.from('.hp-phone-ring', {
      scrollTrigger: { trigger: '.hp-features__grid', start: 'top 78%' },
      scale: 0.72,
      opacity: 0,
      y: 40,
      duration: 1.15,
      ease: 'elastic.out(1, 0.7)',
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

    // ── 4. LOCATION — magazine-split entrance ────────────────────────────
    gsap.from('.hp-location__media', {
      scrollTrigger: { trigger: '.hp-location', start: 'top 82%' },
      x: -85,
      opacity: 0,
      duration: 0.95,
      ease,
    });
    // h2 text-wipe reveal
    gsap.from('.hp-location__copy h2', {
      scrollTrigger: { trigger: '.hp-location', start: 'top 82%' },
      clipPath: 'inset(0 100% 0 0)',
      duration: 0.9,
      ease: 'expo.inOut',
    });
    gsap.from('.hp-location__list li', {
      scrollTrigger: { trigger: '.hp-location__list', start: 'top 86%' },
      x: 50,
      opacity: 0,
      duration: 0.65,
      stagger: 0.13,
      ease,
    });
    gsap.from('.hp-location .hp-btn-dark', {
      scrollTrigger: { trigger: '.hp-location .hp-btn-dark', start: 'top 92%' },
      y: 22,
      opacity: 0,
      scale: 0.88,
      duration: 0.6,
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

    // ── 5. HOTELS — alternating reveal + composite parallax ──────────────
    gsap.from('.hp-hotels__copy', {
      scrollTrigger: { trigger: '.hp-hotels', start: 'top 82%' },
      x: -65,
      opacity: 0,
      duration: 0.88,
      ease,
    });
    gsap.from('.hp-hotels__visual', {
      scrollTrigger: { trigger: '.hp-hotels', start: 'top 82%' },
      x: 65,
      opacity: 0,
      duration: 0.88,
      ease,
    });
    gsap.from('.hp-hotel-row', {
      scrollTrigger: { trigger: '.hp-hotel-rows', start: 'top 86%' },
      y: 38,
      opacity: 0,
      duration: 0.65,
      stagger: 0.14,
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

    // ── 6. DASHBOARD — phones swing in with rotation ─────────────────────
    gsap.from('.hp-dash-phone--left', {
      scrollTrigger: { trigger: '.hp-dashboard', start: 'top 80%' },
      x: -95,
      rotation: -14,
      opacity: 0,
      duration: 1.1,
      ease: 'power3.out',
    });
    gsap.from('.hp-dash-phone--right', {
      scrollTrigger: { trigger: '.hp-dashboard', start: 'top 80%' },
      x: 95,
      rotation: 14,
      opacity: 0,
      duration: 1.1,
      delay: 0.18,
      ease: 'power3.out',
    });
    gsap.from('.hp-dash-stat, .hp-dash-widget, .hp-dash-cercle', {
      scrollTrigger: { trigger: '.hp-dashboard__phones', start: 'top 78%' },
      scale: 0.65,
      opacity: 0,
      duration: 0.75,
      stagger: 0.12,
      ease: 'back.out(2)',
    });
    gsap.from('.hp-dashboard__copy .hp-dash-item', {
      scrollTrigger: { trigger: '.hp-dashboard__copy', start: 'top 82%' },
      x: 65,
      opacity: 0,
      duration: 0.7,
      stagger: 0.15,
      ease,
    });

    // ── 7. PAYMENTS orbit — logos pop in + center person + continuous float ─
    gsap.from('.hp-pay-center', {
      scrollTrigger: { trigger: '.hp-payments', start: 'top 82%' },
      scale: 0.78,
      opacity: 0,
      duration: 1,
      ease: 'elastic.out(1, 0.72)',
    });
    // CSS animation handles orbit transform; GSAP only fades logos in
    gsap.to('.hp-pay-logo', {
      scrollTrigger: { trigger: '.hp-payments', start: 'top 82%' },
      opacity: 1,
      duration: 0.6,
      stagger: { each: 0.07, from: 'edges' },
      ease: 'power2.out',
    });
    // h2 text-wipe
    gsap.from('.hp-payments__copy h2', {
      scrollTrigger: { trigger: '.hp-payments', start: 'top 84%' },
      clipPath: 'inset(0 100% 0 0)',
      duration: 0.9,
      ease: 'expo.inOut',
    });
    gsap.from('.hp-payments__copy p', {
      scrollTrigger: { trigger: '.hp-payments', start: 'top 84%' },
      x: -45,
      opacity: 0,
      duration: 0.75,
      delay: 0.18,
      ease,
    });
  }
}

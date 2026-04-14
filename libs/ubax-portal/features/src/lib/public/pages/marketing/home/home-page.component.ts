import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  NgZone,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  PublicShellComponent,
  BackToTopComponent,
} from '@ubax-workspace/ubax-portal-layout';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { AboutCtaSectionComponent } from '../../../shared/about-cta-section.component';

@Component({
  selector: 'ubax-home-page',
  imports: [
    RouterLink,
    PublicShellComponent,
    BackToTopComponent,
    AboutCtaSectionComponent,
  ],
  templateUrl: './home-page.component.html',
  styleUrl: './home-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePageComponent {
  private readonly elRef = inject(ElementRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly zone = inject(NgZone);
  private gsapCtx: gsap.Context | undefined;

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

    // -- 1. HERO
    const heroTl = gsap.timeline({ defaults: { ease } });
    heroTl
      .from('.hp-hero__img', { x: 60, opacity: 0, scale: 0.95, duration: 1 }, 0)
      .to(
        '.hp-hero__line-inner',
        {
          clipPath: 'inset(0% 0 0% 0)',
          duration: 0.75,
          ease: 'power3.out',
          stagger: 0.18,
        },
        0.8,
      )
      .from(
        '.hp-hero__tagline',
        { y: 24, opacity: 0, duration: 0.75, ease: 'power3.out' },
        '-=0.3',
      )
      .from(
        '.hp-store-pill',
        {
          y: 20,
          opacity: 0,
          duration: 0.7,
          stagger: 0.12,
          ease: 'back.out(1.8)',
        },
        '-=0.4',
      );

    // -- 2. STEPS
    const stepsTl = gsap.timeline({ paused: true });
    stepsTl
      .from(
        '.hp-step',
        { y: 50, opacity: 0, duration: 0.75, stagger: 0.15, ease },
        0,
      )
      .from(
        '.hp-step__icon',
        {
          scale: 0.5,
          opacity: 0,
          duration: 0.7,
          stagger: 0.15,
          ease: 'back.out(2)',
        },
        0,
      );

    ScrollTrigger.create({
      trigger: '.hp-steps',
      start: 'top 80%',
      once: true,
      onEnter: () => {
        if (stepsTl.progress() === 0) stepsTl.play();
      },
    });
    heroTl.then(() => {
      if (stepsTl.progress() === 0) stepsTl.play();
    });

    // -- 3. FEATURES
    gsap.from('.hp-feat-col:first-child .hp-feat', {
      scrollTrigger: { trigger: '.hp-features__grid', start: 'top 58%' },
      x: -50,
      opacity: 0,
      duration: 0.8,
      stagger: 0.15,
      ease,
    });
    gsap.from('.hp-feat-col:last-child .hp-feat', {
      scrollTrigger: { trigger: '.hp-features__grid', start: 'top 58%' },
      x: 50,
      opacity: 0,
      duration: 0.8,
      stagger: 0.15,
      ease,
    });
    gsap.from('.hp-phone-ring', {
      scrollTrigger: { trigger: '.hp-features__grid', start: 'top 58%' },
      scale: 0.75,
      opacity: 0,
      y: 30,
      duration: 1,
      ease: 'elastic.out(1, 0.7)',
      onComplete: () => {
        (this.elRef.nativeElement as HTMLElement)
          .querySelector('.hp-phone-ring')
          ?.classList.add('is-pulsing');
      },
    });
    gsap.to('.hp-phone-ring', {
      scrollTrigger: {
        trigger: '.hp-features',
        start: 'top bottom',
        end: 'bottom top',
        scrub: 1,
      },
      y: -45,
      ease: 'none',
    });

    // -- 4. LOCATION
    gsap.from('.hp-location__media', {
      scrollTrigger: { trigger: '.hp-location', start: 'top 55%' },
      x: -70,
      opacity: 0,
      duration: 0.9,
      ease,
    });
    gsap.from('.hp-location__copy h2', {
      scrollTrigger: { trigger: '.hp-location', start: 'top 55%' },
      clipPath: 'inset(0 100% 0 0)',
      duration: 0.9,
      ease: 'expo.inOut',
    });
    gsap.from('.hp-location__list li', {
      scrollTrigger: { trigger: '.hp-location__list', start: 'top 65%' },
      x: 45,
      opacity: 0,
      duration: 0.7,
      stagger: 0.15,
      ease,
    });
    gsap.from('.hp-location .hp-btn-dark', {
      scrollTrigger: { trigger: '.hp-location .hp-btn-dark', start: 'top 80%' },
      y: 18,
      opacity: 0,
      scale: 0.9,
      duration: 0.65,
      ease: 'back.out(1.8)',
    });
    gsap.to('.hp-location__media img', {
      scrollTrigger: {
        trigger: '.hp-location',
        start: 'top bottom',
        end: 'bottom top',
        scrub: 1,
      },
      y: -25,
      ease: 'none',
    });

    // -- 5. HOTELS
    gsap.from('.hp-hotels__copy', {
      scrollTrigger: { trigger: '.hp-hotels', start: 'top 55%' },
      x: -55,
      opacity: 0,
      duration: 0.85,
      ease,
    });
    gsap.from('.hp-hotels__visual', {
      scrollTrigger: { trigger: '.hp-hotels', start: 'top 55%' },
      x: 55,
      opacity: 0,
      duration: 0.85,
      ease,
    });
    gsap.from('.hp-hotel-row', {
      scrollTrigger: { trigger: '.hp-hotel-rows', start: 'top 65%' },
      y: 35,
      opacity: 0,
      duration: 0.7,
      stagger: 0.15,
      ease: 'power2.out',
    });
    gsap.to('.hp-hotels__composite', {
      scrollTrigger: {
        trigger: '.hp-hotels',
        start: 'top bottom',
        end: 'bottom top',
        scrub: 1,
      },
      y: -32,
      ease: 'none',
    });

    // -- 6. DASHBOARD
    gsap.from('.hp-dash-phone--left', {
      scrollTrigger: { trigger: '.hp-dashboard', start: 'top 55%' },
      x: -80,
      rotation: -12,
      opacity: 0,
      duration: 1,
      ease: 'power3.out',
    });
    gsap.from('.hp-dash-phone--right', {
      scrollTrigger: { trigger: '.hp-dashboard', start: 'top 55%' },
      x: 80,
      rotation: 12,
      opacity: 0,
      duration: 1,
      delay: 0.18,
      ease: 'power3.out',
    });
    gsap.from('.hp-dash-stat, .hp-dash-widget, .hp-dash-cercle', {
      scrollTrigger: { trigger: '.hp-dashboard__phones', start: 'top 60%' },
      scale: 0.7,
      opacity: 0,
      duration: 0.8,
      stagger: 0.12,
      ease: 'back.out(2)',
    });
    gsap.from('.hp-dashboard__copy .hp-dash-item', {
      scrollTrigger: { trigger: '.hp-dashboard__copy', start: 'top 60%' },
      x: 55,
      opacity: 0,
      duration: 0.75,
      stagger: 0.15,
      ease,
    });

    // -- 7. PAYMENTS
    gsap.from('.hp-pay-center', {
      scrollTrigger: { trigger: '.hp-payments', start: 'top 55%' },
      scale: 0.8,
      opacity: 0,
      duration: 0.9,
      ease: 'elastic.out(1, 0.72)',
    });
    gsap.to('.hp-pay-logo', {
      scrollTrigger: { trigger: '.hp-payments', start: 'top 55%' },
      opacity: 1,
      duration: 0.7,
      stagger: { each: 0.08, from: 'edges' },
      ease: 'power2.out',
    });
    gsap.from('.hp-payments__copy h2', {
      scrollTrigger: { trigger: '.hp-payments', start: 'top 58%' },
      clipPath: 'inset(0 100% 0 0)',
      duration: 0.9,
      ease: 'expo.inOut',
    });
    gsap.from('.hp-payments__copy p', {
      scrollTrigger: { trigger: '.hp-payments', start: 'top 58%' },
      x: -40,
      opacity: 0,
      duration: 0.75,
      delay: 0.18,
      ease,
    });

    gsap.from('.home-page__final-cta .about-cta__surface', {
      scrollTrigger: { trigger: '.home-page__final-cta', start: 'top 82%' },
      scale: 0.97,
      opacity: 0,
      duration: 0.9,
      ease,
    });
    gsap.from(
      '.home-page__final-cta .about-cta__badge, .home-page__final-cta .about-cta__title, .home-page__final-cta .about-cta__description, .home-page__final-cta .about-cta__actions',
      {
        scrollTrigger: { trigger: '.home-page__final-cta', start: 'top 80%' },
        y: 26,
        opacity: 0,
        duration: 0.76,
        stagger: 0.1,
        ease,
      },
    );
  }
}

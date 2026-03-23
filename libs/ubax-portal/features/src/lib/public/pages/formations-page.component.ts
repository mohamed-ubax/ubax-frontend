import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  inject,
  signal,
  computed,
} from '@angular/core';
import { PublicShellComponent } from '@ubax-workspace/ubax-portal-layout';
import { UiButtonComponent } from '@ubax-workspace/shared-ui';
import { RouterLink } from '@angular/router';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ALL_GUIDES } from './formations.data';

const PAGE_SIZE = 6;

@Component({
  selector: 'ubax-formations-page',
  imports: [PublicShellComponent, UiButtonComponent, RouterLink],
  templateUrl: './formations-page.component.html',
  styleUrl: './formations-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormationsPageComponent {
  private readonly _el = inject(ElementRef<HTMLElement>);
  private readonly _destroyRef = inject(DestroyRef);
  private _gsapCtx: gsap.Context | null = null;

  protected readonly currentPage = signal(1);
  protected readonly totalPages = computed(() =>
    Math.ceil(ALL_GUIDES.length / PAGE_SIZE),
  );
  protected readonly pageRange = computed(() =>
    Array.from({ length: this.totalPages() }, (_, i) => i + 1),
  );
  protected readonly guides = computed(() => {
    const start = (this.currentPage() - 1) * PAGE_SIZE;
    return ALL_GUIDES.slice(start, start + PAGE_SIZE);
  });

  protected readonly floatingIcons = [
    {
      cls: 'fp-float--tl',
      src: 'assets/portal-assets/formations/icons/emojione_house-with-garden.svg',
      alt: '',
    },
    {
      cls: 'fp-float--ml',
      src: 'assets/portal-assets/formations/icons/fluent-color_chat-bubbles-question-16.svg',
      alt: '',
    },
    {
      cls: 'fp-float--bl',
      src: 'assets/portal-assets/formations/icons/flat-color-icons_home.svg',
      alt: '',
    },
    {
      cls: 'fp-float--tr',
      src: 'assets/portal-assets/formations/icons/streamline-ultimate-color_real-estate-deal-shake-building.svg',
      alt: '',
    },
    {
      cls: 'fp-float--mr',
      src: 'assets/portal-assets/formations/icons/fluent-color_building-home-20.svg',
      alt: '',
    },
    {
      cls: 'fp-float--br',
      src: 'assets/portal-assets/formations/icons/streamline-cyber-color_business-handshake-deal.svg',
      alt: '',
    },
  ];

  constructor() {
    afterNextRender(() => this._initAnimations());
  }

  protected scrollToGuides(): void {
    const guidesEl = (this._el.nativeElement as HTMLElement).querySelector(
      '.fp-guides',
    );
    guidesEl?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  protected goToPage(page: number): void {
    if (page < 1 || page > this.totalPages()) return;
    this.currentPage.set(page);
    const guidesEl = (this._el.nativeElement as HTMLElement).querySelector(
      '.fp-guides',
    );
    guidesEl?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  private _initAnimations(): void {
    const el = this._el.nativeElement as HTMLElement;
    gsap.registerPlugin(ScrollTrigger);

    this._gsapCtx = gsap.context(() => {
      // Hero badge
      gsap.from('.fp-hero__badge', {
        y: -20,
        opacity: 0,
        duration: 0.6,
        ease: 'power3.out',
      });

      // Hero title
      gsap.from('.fp-hero__title', {
        y: 40,
        opacity: 0,
        duration: 0.9,
        delay: 0.15,
        ease: 'power3.out',
      });

      // Hero description + button
      gsap.from('.fp-hero__desc, .fp-hero__cta', {
        y: 30,
        opacity: 0,
        duration: 0.8,
        delay: 0.35,
        stagger: 0.15,
        ease: 'power3.out',
      });

      // Floating icon cards — confetti burst from centre
      // Each card starts near the hero centre (behind the text) and flies
      // outward to its final CSS position.  x/y are FROM-offsets pointing
      // from the card's natural position toward the centre, so gsap.from()
      // produces a centre → final-position trajectory.
      // ml/mr omit y so GSAP preserves their CSS translateY(-50%) centering.
      const burst: Array<{ sel: string; x: number; y?: number; delay: number }> = [
        { sel: '.fp-float--tl', x:  250, y:  220, delay: 0.20 },
        { sel: '.fp-float--tr', x: -230, y:  220, delay: 0.24 },
        { sel: '.fp-float--ml', x:  290,           delay: 0.30 },
        { sel: '.fp-float--mr', x: -280,           delay: 0.34 },
        { sel: '.fp-float--bl', x:  255, y: -210,  delay: 0.40 },
        { sel: '.fp-float--br', x: -250, y: -210,  delay: 0.44 },
      ];
      burst.forEach(({ sel, x, y, delay }) => {
        const from: gsap.TweenVars = {
          x, scale: 0.05, opacity: 0, duration: 1.1, delay, ease: 'back.out(1.6)',
        };
        if (y !== undefined) from['y'] = y;
        gsap.from(sel, from);
      });

      // Guides section heading
      gsap.from('.fp-guides__title', {
        scrollTrigger: { trigger: '.fp-guides', start: 'top 78%' },
        y: 40,
        opacity: 0,
        duration: 0.85,
        ease: 'power3.out',
      });

      // Guide cards
      gsap.from('.fp-guide-card', {
        scrollTrigger: { trigger: '.fp-guides__grid', start: 'top 78%' },
        y: 60,
        opacity: 0,
        duration: 0.85,
        stagger: 0.1,
        ease: 'power3.out',
      });

      // CTA section
      gsap.from('.fp-cta__title', {
        scrollTrigger: { trigger: '.fp-cta', start: 'top 78%' },
        y: 30,
        opacity: 0,
        duration: 0.8,
        ease: 'power3.out',
      });
      gsap.from('.fp-cta__desc, .fp-cta__btn', {
        scrollTrigger: { trigger: '.fp-cta', start: 'top 78%' },
        y: 20,
        opacity: 0,
        duration: 0.7,
        delay: 0.15,
        stagger: 0.12,
        ease: 'power3.out',
      });
    }, el);

    this._destroyRef.onDestroy(() => {
      this._gsapCtx?.revert();
      this._gsapCtx = null;
    });
  }
}

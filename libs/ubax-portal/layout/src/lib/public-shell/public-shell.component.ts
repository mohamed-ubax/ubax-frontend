import {
  afterNextRender,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  ElementRef,
  HostListener,
  inject,
  NgZone,
  OnDestroy,
} from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { LenisService } from '../lenis.service';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'ubax-public-shell',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './public-shell.component.html',
  styleUrl: './public-shell.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PublicShellComponent implements OnDestroy {
  private readonly lenisService = inject(LenisService);
  private readonly _el = inject(ElementRef<HTMLElement>);
  private readonly _destroyRef = inject(DestroyRef);
  private readonly _zone = inject(NgZone);
  private readonly _cdr = inject(ChangeDetectorRef);
  private _gsapCtx: gsap.Context | null = null;
  private _scrollListener: (() => void) | null = null;

  // Cached DOM references (set once in afterNextRender) — panel + prelayer
  // are driven by CSS transitions, not GSAP, so they don't need caching here.
  private _overlay!: HTMLElement;
  private _itemLabels!: NodeListOf<Element>;
  private _logoWrap!: HTMLElement;
  private _ctaEl!: HTMLElement;

  protected menuOpen = false;
  protected scrolled = false;

  constructor() {
    afterNextRender(() => {
      this.lenisService.init();

      const host = this._el.nativeElement;
      this._overlay = host.querySelector('.nav-overlay');
      this._itemLabels = host.querySelectorAll('.offcanvas-item-label');
      this._logoWrap = host.querySelector('.offcanvas-logo-wrap');
      this._ctaEl = host.querySelector('.offcanvas-cta');

      this._zone.runOutsideAngular(() => {
        gsap.registerPlugin(ScrollTrigger);
        this._gsapCtx = gsap.context(() => {
          this._animateHeader();
          this._initMenu();
        }, host);

        // Scroll listener runs outside Angular zone; only triggers CD on state change
        this._scrollListener = () => {
          const isScrolled = window.scrollY > 20;
          if (isScrolled !== this.scrolled) {
            this.scrolled = isScrolled;
            this._zone.run(() => this._cdr.markForCheck());
          }
        };
        window.addEventListener('scroll', this._scrollListener, {
          passive: true,
        });
      });
    });

    this._destroyRef.onDestroy(() => {
      this._gsapCtx?.revert();
      this._gsapCtx = null;
    });
  }

  ngOnDestroy(): void {
    if (this._scrollListener) {
      window.removeEventListener('scroll', this._scrollListener);
      this._scrollListener = null;
    }
    this.lenisService.destroy();
  }

  // ── Header entrance ───────────────────────────────────────────────────────
  private _animateHeader(): void {
    gsap.from('.main-header', {
      y: -72,
      opacity: 0,
      duration: 0.7,
      ease: 'power3.out',
    });
    gsap.from('.brand', {
      x: -22,
      opacity: 0,
      duration: 0.55,
      delay: 0.12,
      ease: 'power3.out',
    });
    gsap.from('.main-nav a', {
      y: -14,
      opacity: 0,
      duration: 0.5,
      stagger: 0.07,
      delay: 0.2,
      ease: 'power2.out',
    });
    gsap.from('.pro-space-btn', {
      x: 22,
      opacity: 0,
      scale: 0.88,
      duration: 0.55,
      delay: 0.3,
      ease: 'back.out(1.7)',
    });
  }

  // ── Menu — initial hidden state ───────────────────────────────────────────
  private _initMenu(): void {
    // Panel + prelayer: CSS transitions handle the slide (transform is in CSS).
    // GSAP only initialises the non-transform properties it will later animate.
    gsap.set(this._overlay, { opacity: 0 });
    gsap.set(this._itemLabels, { yPercent: 140, rotate: 10 });
    gsap.set([this._logoWrap, this._ctaEl], { opacity: 0, y: 20 });
  }

  // ── Menu OPEN — overlay + items stagger (slide handled by CSS transition) ──
  private _openMenu(): void {
    this.menuOpen = true; // triggers [class.is-open] → CSS transition on panel + prelayer
    document.body.style.overflow = 'hidden';

    // Items start when panel has slid ~15% of its 0.65s course (after 0.07s delay)
    // = 0.07 + 0.65 * 0.15 ≈ 0.17s
    const itemsStart = 0.17;

    const tl = gsap.timeline();

    tl.to(this._overlay, { opacity: 1, duration: 0.4, ease: 'power2.out' }, 0);

    tl.fromTo(
      this._logoWrap,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' },
      itemsStart,
    );

    // Nav items — yPercent + rotate stagger (ReactBits signature)
    tl.fromTo(
      this._itemLabels,
      { yPercent: 140, rotate: 10 },
      {
        yPercent: 0,
        rotate: 0,
        duration: 1,
        ease: 'power4.out',
        stagger: { each: 0.1, from: 'start' },
      },
      itemsStart + 0.05,
    );

    tl.fromTo(
      this._ctaEl,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' },
      itemsStart + 0.4,
    );
  }

  // ── Menu CLOSE — CSS transition closes slide, GSAP fades overlay + resets ─
  private _closeMenu(): void {
    this.menuOpen = false; // removes [class.is-open] → CSS transition slides panel + prelayer out
    document.body.style.overflow = '';

    gsap.to(this._overlay, {
      opacity: 0,
      duration: 0.32, // matches CSS close transition duration
      ease: 'power2.in',
      overwrite: 'auto',
      onComplete: () => {
        // Reset item state for next open
        gsap.set(this._itemLabels, { yPercent: 140, rotate: 10 });
        gsap.set([this._logoWrap, this._ctaEl], { opacity: 0, y: 20 });
      },
    });
  }

  protected toggleMenu(): void {
    if (this.menuOpen) {
      this._closeMenu();
      return;
    }

    this._openMenu();
  }

  protected closeMenu(): void {
    if (this.menuOpen) this._closeMenu();
  }

  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    if (this.menuOpen) this._closeMenu();
  }

  protected readonly menuItems = [
    { label: 'Accueil', path: '/accueil', exact: true },
    { label: 'Fonctionnalités', path: '/fonctionnalites', exact: false },
    { label: 'Offres', path: '/offres', exact: false },
    { label: 'Témoignages', path: '/temoignages', exact: false },
    { label: 'Formations', path: '/formations', exact: false },
    { label: 'FAQs', path: '/faq', exact: false },
  ];
}

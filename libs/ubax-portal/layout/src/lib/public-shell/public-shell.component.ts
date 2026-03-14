import { CommonModule } from '@angular/common';
import {
  afterNextRender,
  Component,
  DestroyRef,
  ElementRef,
  HostListener,
  inject,
  OnDestroy,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { LenisService } from '../lenis.service';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

@Component({
  selector: 'ubax-public-shell',
  imports: [CommonModule, RouterLink],
  templateUrl: './public-shell.component.html',
  styleUrl: './public-shell.component.scss',
})
export class PublicShellComponent implements OnDestroy {
  private readonly lenisService = inject(LenisService);
  private readonly _el = inject(ElementRef<HTMLElement>);
  private readonly _destroyRef = inject(DestroyRef);
  private _gsapCtx: gsap.Context | null = null;

  protected menuOpen = false;
  protected scrolled = false;

  constructor() {
    afterNextRender(() => {
      this.lenisService.init();
      gsap.registerPlugin(ScrollTrigger);
      this._gsapCtx = gsap.context(() => {
        this._animateHeader();
        this._animateFooter();
      }, this._el.nativeElement);
    });

    this._destroyRef.onDestroy(() => {
      this._gsapCtx?.revert();
      this._gsapCtx = null;
    });
  }

  ngOnDestroy(): void {
    this.lenisService.destroy();
  }

  // ── Header entrance (delayed on first load to let preloader finish) ──────
  private _animateHeader(): void {
    const isFirstLoad = !sessionStorage.getItem('ubax-loaded');
    const d = isFirstLoad ? 3.4 : 0;

    gsap.from('.main-header', {
      y: -72,
      opacity: 0,
      duration: 0.7,
      delay: d,
      ease: 'power3.out',
    });
    gsap.from('.brand', {
      x: -22,
      opacity: 0,
      duration: 0.55,
      delay: d + 0.12,
      ease: 'power3.out',
    });
    gsap.from('.main-nav a', {
      y: -14,
      opacity: 0,
      duration: 0.5,
      stagger: 0.07,
      delay: d + 0.2,
      ease: 'power2.out',
    });
    gsap.from('.pro-space-btn', {
      x: 22,
      opacity: 0,
      scale: 0.88,
      duration: 0.55,
      delay: d + 0.3,
      ease: 'back.out(1.7)',
    });
  }

  // ── Footer reveal via ScrollTrigger ────────────────────────────────────
  private _animateFooter(): void {
    gsap.from('.footer-col', {
      scrollTrigger: { trigger: '.main-footer', start: 'top 88%' },
      y: 55,
      opacity: 0,
      stagger: 0.13,
      duration: 0.82,
      ease: 'power3.out',
    });

    gsap.from('.footer-col__heading', {
      scrollTrigger: { trigger: '.footer-top', start: 'top 88%' },
      clipPath: 'inset(0 100% 0 0)',
      duration: 0.75,
      stagger: 0.12,
      ease: 'power3.inOut',
    });

    gsap.from('.footer-social__link', {
      scrollTrigger: { trigger: '.footer-bottom', start: 'top 92%' },
      scale: 0,
      opacity: 0,
      stagger: 0.09,
      duration: 0.55,
      ease: 'back.out(2.2)',
    });

    gsap.from('.store-badge', {
      scrollTrigger: { trigger: '.footer-stores', start: 'top 92%' },
      y: 28,
      opacity: 0,
      stagger: 0.11,
      duration: 0.65,
      ease: 'back.out(1.8)',
    });

    gsap.from('.footer-copyright', {
      scrollTrigger: { trigger: '.footer-copyright', start: 'top 99%' },
      opacity: 0,
      y: 12,
      duration: 0.6,
      ease: 'power2.out',
    });
  }

  protected toggleMenu(): void {
    this.menuOpen = !this.menuOpen;
  }

  protected closeMenu(): void {
    this.menuOpen = false;
  }

  @HostListener('window:scroll')
  protected onScroll(): void {
    this.scrolled = window.scrollY > 20;
  }

  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    this.menuOpen = false;
  }

  protected readonly menuItems = [
    { label: 'Accueil', path: '/accueil' },
    { label: 'Fonctionnalités', path: '/accueil' },
    { label: 'Témoignages', path: '/temoignages' },
    { label: 'Tarifs', path: '/tarifs' },
    { label: 'FAQs', path: '/faq' },
    { label: 'Contacts', path: '/contact' },
  ];
}

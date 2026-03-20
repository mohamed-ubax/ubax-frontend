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
import { RouterLink, RouterLinkActive } from '@angular/router';
import { LenisService } from '../lenis.service';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

@Component({
  selector: 'ubax-public-shell',
  imports: [CommonModule, RouterLink, RouterLinkActive],
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

  // ── Header entrance ──────────────────────────────────────────────────────
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

  protected toggleMenu(): void {
    this.menuOpen = !this.menuOpen;
    document.body.style.overflow = this.menuOpen ? 'hidden' : '';
  }

  protected closeMenu(): void {
    this.menuOpen = false;
    document.body.style.overflow = '';
  }

  @HostListener('window:scroll')
  protected onScroll(): void {
    this.scrolled = window.scrollY > 20;
  }

  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    this.menuOpen = false;
    document.body.style.overflow = '';
  }

  protected readonly menuItems = [
    { label: 'Accueil', path: '/accueil', exact: true },
    { label: 'Fonctionnalités', path: '/fonctionnalites', exact: false },
    { label: 'Tarifs', path: '/tarifs', exact: false },
    { label: 'Témoignages', path: '/temoignages', exact: false },
    { label: 'Formations', path: '/formations', exact: false },
    { label: 'FAQs', path: '/faq', exact: false },
  ];
}

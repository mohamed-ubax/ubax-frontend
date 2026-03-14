import {
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  inject,
} from '@angular/core';
import { PublicShellComponent } from '@ubax-workspace/ubax-portal-layout';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

@Component({
  selector: 'ubax-legal-page',
  imports: [PublicShellComponent],
  templateUrl: './legal-page.component.html',
  styleUrl: './legal-page.component.scss',
})
export class LegalPageComponent {
  private readonly _el = inject(ElementRef<HTMLElement>);
  private readonly _destroyRef = inject(DestroyRef);
  private _gsapCtx: gsap.Context | null = null;
  private _observer: IntersectionObserver | null = null;

  constructor() {
    afterNextRender(() => this._initAnimations());
  }

  private _initAnimations(): void {
    const el = this._el.nativeElement as HTMLElement;
    gsap.registerPlugin(ScrollTrigger);

    this._gsapCtx = gsap.context(() => {
      // Header entrance
      gsap.from('.legal-page__title', {
        y: -30,
        opacity: 0,
        duration: 0.85,
        ease: 'power3.out',
      });

      // Each article section fades in on scroll
      const sections = el.querySelectorAll<HTMLElement>(
        '.legal-article section',
      );
      sections.forEach((section) => {
        gsap.from(section, {
          y: 35,
          opacity: 0,
          duration: 0.75,
          ease: 'power3.out',
          scrollTrigger: { trigger: section, start: 'top 82%' },
        });
      });
    }, el);

    // Active TOC via IntersectionObserver
    this._setupActiveToc(el);

    this._destroyRef.onDestroy(() => {
      this._gsapCtx?.revert();
      this._gsapCtx = null;
      this._observer?.disconnect();
      this._observer = null;
    });
  }

  private _setupActiveToc(el: HTMLElement): void {
    const sections = el.querySelectorAll<HTMLElement>('.legal-article section');
    const tocItems = el.querySelectorAll<HTMLElement>('.legal-toc li');
    if (!sections.length || !tocItems.length) return;

    // Map h2 text → toc li element for precise matching
    const tocMap = new Map<string, HTMLElement>();
    tocItems.forEach((li) => tocMap.set(li.textContent?.trim() ?? '', li));

    this._observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const h2 = entry.target.querySelector('h2');
          if (!h2) return;
          tocItems.forEach((li) => li.classList.remove('is-active'));
          const match = tocMap.get(h2.textContent?.trim() ?? '');
          match?.classList.add('is-active');
        });
      },
      { rootMargin: '-25% 0px -60% 0px', threshold: 0 },
    );

    sections.forEach((s) => this._observer!.observe(s));
  }
}

import {
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  inject,
} from '@angular/core';
import { PublicShellComponent, LenisService } from '@ubax-workspace/ubax-portal-layout';
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
  private readonly _lenis = inject(LenisService);
  private _gsapCtx: gsap.Context | null = null;
  private _scrollHandler: (() => void) | null = null;

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

      // TOC items stagger from left
      gsap.from('.legal-toc li', {
        x: -24,
        opacity: 0,
        duration: 0.5,
        stagger: 0.08,
        delay: 0.35,
        ease: 'power2.out',
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

    // Active TOC with animated sliding indicator
    this._setupActiveToc(el);
    this._setupTocClicks(el);

    this._destroyRef.onDestroy(() => {
      this._gsapCtx?.revert();
      this._gsapCtx = null;
      if (this._scrollHandler) {
        this._lenis.instance?.off('scroll', this._scrollHandler);
        this._scrollHandler = null;
      }
    });
  }

  private _setupTocClicks(el: HTMLElement): void {
    const tocItems = el.querySelectorAll<HTMLElement>('.legal-toc li');
    const sections = el.querySelectorAll<HTMLElement>('.legal-article section');

    tocItems.forEach((li, index) => {
      li.addEventListener('click', () => {
        const target = sections[index];
        if (!target) return;

        const headerHeight =
          document.querySelector<HTMLElement>('.main-header')?.getBoundingClientRect().height ?? 80;
        const absoluteTop = target.getBoundingClientRect().top + window.scrollY;

        this._lenis.instance?.scrollTo(absoluteTop - headerHeight, {
          duration: 1.2,
        });
      });
    });
  }

  private _setupActiveToc(el: HTMLElement): void {
    const sections = Array.from(
      el.querySelectorAll<HTMLElement>('.legal-article section'),
    );
    const tocItems = Array.from(
      el.querySelectorAll<HTMLElement>('.legal-toc li'),
    );
    const indicator = el.querySelector<HTMLElement>('.legal-toc__indicator');
    if (!sections.length || !tocItems.length || !indicator) return;

    // Read real computed values — independent of offsetParent quirks
    const tocEl = el.querySelector<HTMLElement>('.legal-toc')!;
    const tocPaddingTop = Number.parseFloat(getComputedStyle(tocEl).paddingTop);
    const liHeight = tocItems[0].getBoundingClientRect().height;
    const indicatorHeight = indicator.getBoundingClientRect().height;

    const indicatorY = (index: number) =>
      tocPaddingTop + index * liHeight + (liHeight - indicatorHeight) / 2;

    // Initialise immediately on the first item — no jump, no delay
    tocItems[0].classList.add('is-active');
    gsap.set(indicator, { y: indicatorY(0), opacity: 1 });

    let lastIndex = 0;

    const update = () => {
      const headerBottom =
        document.querySelector<HTMLElement>('.main-header')
          ?.getBoundingClientRect().bottom ?? 80;

      // Find the last section whose top edge has crossed the header bottom
      let activeIndex = 0;
      for (let i = sections.length - 1; i >= 0; i--) {
        if (sections[i].getBoundingClientRect().top <= headerBottom + 1) {
          activeIndex = i;
          break;
        }
      }

      if (activeIndex === lastIndex) return;
      lastIndex = activeIndex;

      const activeLi = tocItems[activeIndex];
      tocItems.forEach((li) => li.classList.remove('is-active'));
      activeLi.classList.add('is-active');

      gsap.to(indicator, {
        y: indicatorY(activeIndex),
        opacity: 1,
        duration: 0.35,
        ease: 'power2.inOut',
      });
    };

    this._scrollHandler = update;
    this._lenis.instance?.on('scroll', update);
  }
}

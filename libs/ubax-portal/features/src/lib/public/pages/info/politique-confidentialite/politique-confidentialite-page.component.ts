import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  inject,
} from '@angular/core';
import {
  LenisService,
  PublicShellComponent,
} from '@ubax-workspace/ubax-portal-layout';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

@Component({
  selector: 'ubax-politique-confidentialite-page',
  imports: [PublicShellComponent],
  templateUrl: './politique-confidentialite-page.component.html',
  styleUrl: './politique-confidentialite-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PolitiqueConfidentialitePageComponent {
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
      gsap.from('.privacy-page__title', {
        y: -30,
        opacity: 0,
        duration: 0.85,
        ease: 'power3.out',
      });

      gsap.from('.privacy-toc li', {
        x: -24,
        opacity: 0,
        duration: 0.5,
        stagger: 0.08,
        delay: 0.35,
        ease: 'power2.out',
      });

      el.querySelectorAll<HTMLElement>('.privacy-article section').forEach(
        (section) => {
          gsap.from(section, {
            y: 35,
            opacity: 0,
            duration: 0.75,
            ease: 'power3.out',
            scrollTrigger: { trigger: section, start: 'top 82%' },
          });
        },
      );
    }, el);

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
    const tocItems = el.querySelectorAll<HTMLElement>('.privacy-toc li');
    const sections = el.querySelectorAll<HTMLElement>(
      '.privacy-article section',
    );

    tocItems.forEach((li, index) => {
      li.addEventListener('click', () => {
        const target = sections[index];
        if (!target) return;

        const headerHeight =
          document
            .querySelector<HTMLElement>('.main-header')
            ?.getBoundingClientRect().height ?? 80;
        const absoluteTop = target.getBoundingClientRect().top + window.scrollY;

        this._lenis.instance?.scrollTo(absoluteTop - headerHeight, {
          duration: 1.2,
        });
      });
    });
  }

  private _setupActiveToc(el: HTMLElement): void {
    const sections = Array.from(
      el.querySelectorAll<HTMLElement>('.privacy-article section'),
    );
    const tocItems = Array.from(
      el.querySelectorAll<HTMLElement>('.privacy-toc li'),
    );
    const indicator = el.querySelector<HTMLElement>('.privacy-toc__indicator');
    if (!sections.length || !tocItems.length || !indicator) return;

    const tocEl = el.querySelector<HTMLElement>('.privacy-toc');
    if (!tocEl) return;

    const liHeight = tocItems[0].getBoundingClientRect().height;
    const indicatorHeight = indicator.getBoundingClientRect().height;
    // Compute first li offset relative to TOC container to account for the heading above the list
    const firstLiOffsetTop =
      tocItems[0].getBoundingClientRect().top -
      tocEl.getBoundingClientRect().top;

    const indicatorY = (index: number) =>
      firstLiOffsetTop + index * liHeight + (liHeight - indicatorHeight) / 2;

    tocItems[0].classList.add('is-active');
    gsap.set(indicator, { y: indicatorY(0), opacity: 1 });

    let lastIndex = 0;

    const update = () => {
      const headerBottom =
        document
          .querySelector<HTMLElement>('.main-header')
          ?.getBoundingClientRect().bottom ?? 80;

      let activeIndex = 0;
      for (let i = sections.length - 1; i >= 0; i--) {
        if (sections[i].getBoundingClientRect().top <= headerBottom + 1) {
          activeIndex = i;
          break;
        }
      }

      if (activeIndex === lastIndex) return;
      lastIndex = activeIndex;

      tocItems.forEach((li) => li.classList.remove('is-active'));
      tocItems[activeIndex].classList.add('is-active');

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

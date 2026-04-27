import { isPlatformBrowser } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  AfterViewInit,
  DestroyRef,
  Directive,
  ElementRef,
  NgZone,
  PLATFORM_ID,
  inject,
} from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';

type MotionKind = 'page' | 'surface' | 'item';

const MAX_SURFACES = 32;
const MAX_ITEMS = 56;
const MAX_SCAN_DEPTH = 5;

const WRAPPER_TOKEN_RE =
  /(layout|grid|column|row|content|main|body|shell|viewport|track|group|wrapper|wrap|toolbar|filters|actions|strip)/i;
const HEADER_BLOCK_TOKEN_RE =
  /(page-header|rooms-toolbar|reservations-header|table-header|card-header)/i;
const SURFACE_TOKEN_RE =
  /(card|panel|banner|gallery|preview|status|profile|notification|transaction|booking|guest|table|calendar|history|hero|chart|summary)/i;
const ITEM_TOKEN_RE =
  /(__item|__row|__stat|__option)$|^(summary-card|kpi-card|room-card|room-list-card|tech-stat-card|tx-item|legend-item|equipment-card)$/i;

@Directive({
  selector: '[ubaxAutoMotion]',
  standalone: true,
})
export class UbaxAutoMotionDirective implements AfterViewInit {
  private readonly host =
    inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly zone = inject(NgZone);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly platformId = inject(PLATFORM_ID);
  private observer: IntersectionObserver | null = null;
  private mutationObserver: MutationObserver | null = null;
  private refreshFrame = 0;

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    if (globalThis.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    this.zone.runOutsideAngular(() => {
      this.observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) {
              return;
            }

            entry.target.classList.add('is-visible');
            this.observer?.unobserve(entry.target);
          });
        },
        {
          rootMargin: '0px 0px -12% 0px',
          threshold: 0.12,
        },
      );

      this.mutationObserver = new MutationObserver(() => {
        this.scheduleRefresh();
      });

      this.mutationObserver.observe(this.host, {
        childList: true,
        subtree: true,
      });

      this.router.events
        .pipe(
          filter(
            (event): event is NavigationEnd => event instanceof NavigationEnd,
          ),
          takeUntilDestroyed(this.destroyRef),
        )
        .subscribe(() => {
          this.scheduleRefresh(true);
        });

      this.scheduleRefresh(true);
    });

    this.destroyRef.onDestroy(() => {
      cancelAnimationFrame(this.refreshFrame);
      this.observer?.disconnect();
      this.mutationObserver?.disconnect();
    });
  }

  private scheduleRefresh(reset = false): void {
    if (reset) {
      this.resetTargets();
    }

    cancelAnimationFrame(this.refreshFrame);
    this.refreshFrame = requestAnimationFrame(() => {
      this.refreshTargets();
    });
  }

  private resetTargets(): void {
    this.observer?.disconnect();

    this.host
      .querySelectorAll<HTMLElement>('[data-ubax-motion]')
      .forEach((element) => {
        element.classList.remove('is-visible');
        delete element.dataset['ubaxMotion'];
        delete element.dataset['ubaxMotionRegistered'];
        element.style.removeProperty('--ubax-motion-delay');
      });
  }

  private refreshTargets(): void {
    const pageRoots = Array.from(this.host.children).filter(
      (element): element is HTMLElement => element instanceof HTMLElement,
    );
    let declaredSurfaceCount = 0;
    let declaredItemCount = 0;

    pageRoots.forEach((pageRoot, pageIndex) => {
      this.registerTarget(pageRoot, 'page', pageIndex);
      this.scanPageRoot(pageRoot);

      pageRoot
        .querySelectorAll<HTMLElement>('[data-ubax-motion]')
        .forEach((element) => {
          const declaredMotionKind = this.readDeclaredMotionKind(element);

          if (
            !declaredMotionKind ||
            element.dataset['ubaxMotionSkip'] !== undefined
          ) {
            return;
          }

          if (declaredMotionKind === 'page') {
            this.registerTarget(element, declaredMotionKind, pageIndex + 1);
            return;
          }

          if (declaredMotionKind === 'surface') {
            this.registerTarget(
              element,
              declaredMotionKind,
              declaredSurfaceCount++,
            );
            return;
          }

          this.registerTarget(element, declaredMotionKind, declaredItemCount++);
        });
    });
  }

  private scanPageRoot(pageRoot: HTMLElement): void {
    const queue = Array.from(pageRoot.children)
      .filter(
        (element): element is HTMLElement => element instanceof HTMLElement,
      )
      .map((element) => ({ element, depth: 1 }));

    let surfaceCount = 0;
    let itemCount = 0;

    while (queue.length) {
      const current = queue.shift();

      if (!current) {
        continue;
      }

      const { element, depth } = current;

      if (depth > MAX_SCAN_DEPTH) {
        continue;
      }

      if (element.dataset['ubaxMotionSkip'] !== undefined) {
        continue;
      }

      const motionKind = this.classifyElement(element, depth);

      if (motionKind === 'surface' && surfaceCount < MAX_SURFACES) {
        this.registerTarget(element, 'surface', surfaceCount++);
      }

      if (motionKind === 'item' && itemCount < MAX_ITEMS) {
        this.registerTarget(element, 'item', itemCount++);
      }

      if (motionKind === 'item') {
        continue;
      }

      Array.from(element.children)
        .filter((child): child is HTMLElement => child instanceof HTMLElement)
        .forEach((child) => {
          queue.push({ element: child, depth: depth + 1 });
        });
    }
  }

  private classifyElement(
    element: HTMLElement,
    depth: number,
  ): MotionKind | null {
    const allTokens = Array.from(element.classList);
    const rootTokens = allTokens.filter((token) => !token.includes('__'));
    const isTableItem = element.tagName === 'TR' || element.tagName === 'LI';

    if (isTableItem || this.matchesAnyToken(allTokens, ITEM_TOKEN_RE)) {
      return 'item';
    }

    const isHeaderBlock = this.matchesAnyToken(
      rootTokens,
      HEADER_BLOCK_TOKEN_RE,
    );
    const isWrapper = this.matchesAnyToken(rootTokens, WRAPPER_TOKEN_RE);
    const isSurface =
      isHeaderBlock ||
      (!isWrapper && this.matchesAnyToken(rootTokens, SURFACE_TOKEN_RE)) ||
      (depth <= 2 &&
        (element.tagName === 'SECTION' || element.tagName === 'ARTICLE'));

    if (!isSurface) {
      return null;
    }

    const parent = element.parentElement;

    if (parent && this.isSurfaceContainer(parent)) {
      return null;
    }

    return 'surface';
  }

  private isSurfaceContainer(element: HTMLElement): boolean {
    const rootTokens = Array.from(element.classList).filter(
      (token) => !token.includes('__'),
    );

    return (
      this.matchesAnyToken(rootTokens, HEADER_BLOCK_TOKEN_RE) ||
      (!this.matchesAnyToken(rootTokens, WRAPPER_TOKEN_RE) &&
        this.matchesAnyToken(rootTokens, SURFACE_TOKEN_RE))
    );
  }

  private registerTarget(
    element: HTMLElement,
    motionKind: MotionKind,
    index: number,
  ): void {
    element.dataset['ubaxMotion'] = motionKind;

    if (element.dataset['ubaxMotionRegistered'] === 'true') {
      return;
    }

    const cappedIndex = Math.min(index, motionKind === 'item' ? 8 : 5);
    let delay = 0;

    if (motionKind === 'surface') {
      delay = cappedIndex * 70;
    } else if (motionKind === 'item') {
      delay = cappedIndex * 46;
    }

    element.dataset['ubaxMotionRegistered'] = 'true';
    element.style.setProperty('--ubax-motion-delay', `${delay}ms`);

    this.observer?.observe(element);
  }

  private readDeclaredMotionKind(element: HTMLElement): MotionKind | null {
    const declaredMotion = element.dataset['ubaxMotion'];

    if (
      declaredMotion === 'page' ||
      declaredMotion === 'surface' ||
      declaredMotion === 'item'
    ) {
      return declaredMotion;
    }

    return null;
  }

  private matchesAnyToken(tokens: string[], pattern: RegExp): boolean {
    return tokens.some((token) => pattern.test(token));
  }
}

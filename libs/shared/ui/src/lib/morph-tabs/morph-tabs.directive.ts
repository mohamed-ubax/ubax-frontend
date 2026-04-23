import { isPlatformBrowser } from '@angular/common';
import {
  AfterViewInit,
  DestroyRef,
  Directive,
  ElementRef,
  NgZone,
  PLATFORM_ID,
  effect,
  inject,
  input,
} from '@angular/core';

type MorphTabsMode = 'pill' | 'underline';

@Directive({
  selector: '[ubaxMorphTabs]',
  standalone: true,
  host: {
    class: 'ubax-morph-tabs',
    '[attr.data-ubax-morph-mode]': 'mode()',
  },
})
export class UbaxMorphTabsDirective implements AfterViewInit {
  readonly mode = input<MorphTabsMode>('pill', {
    alias: 'ubaxMorphTabsMode',
  });
  readonly itemSelector = input('button, a, [role="tab"]', {
    alias: 'ubaxMorphTabsItemSelector',
  });

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly zone = inject(NgZone);
  private readonly destroyRef = inject(DestroyRef);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);
  private resizeObserver: ResizeObserver | null = null;
  private mutationObserver: MutationObserver | null = null;
  private readonly observedItems = new Set<HTMLElement>();
  private indicator: HTMLSpanElement | null = null;
  private animationFrameId = 0;

  constructor() {
    effect(() => {
      this.mode();
      this.itemSelector();

      if (!this.isBrowser) {
        return;
      }

      this.queueSync();
    });
  }

  ngAfterViewInit(): void {
    if (!this.isBrowser) {
      return;
    }

    this.zone.runOutsideAngular(() => {
      this.ensureIndicator();
      this.observeResizes();
      this.observeMutations();

      const document = this.host.nativeElement.ownerDocument;
      const fonts = document.fonts;

      if (fonts) {
        void fonts.ready.then(() => this.queueSync());
      }

      this.queueSync();

      this.destroyRef.onDestroy(() => {
        cancelAnimationFrame(this.animationFrameId);
        this.resizeObserver?.disconnect();
        this.mutationObserver?.disconnect();
      });
    });
  }

  private ensureIndicator(): void {
    if (this.indicator?.isConnected) {
      return;
    }

    const indicator =
      this.host.nativeElement.ownerDocument.createElement('span');
    indicator.className = 'ubax-morph-tabs__indicator';
    indicator.setAttribute('aria-hidden', 'true');
    this.host.nativeElement.append(indicator);
    this.indicator = indicator;
  }

  private observeResizes(): void {
    const observer = new ResizeObserver(() => this.queueSync());
    this.resizeObserver = observer;
    observer.observe(this.host.nativeElement);
    this.syncObservedItems();
  }

  private observeMutations(): void {
    const observer = new MutationObserver(() => {
      this.syncObservedItems();
      this.queueSync();
    });

    observer.observe(this.host.nativeElement, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ['class', 'style', 'aria-current', 'aria-selected'],
    });

    this.mutationObserver = observer;
  }

  private syncObservedItems(): void {
    const observer = this.resizeObserver;

    if (!observer) {
      return;
    }

    const items = this.resolveItems();
    const nextItems = new Set(items);

    this.observedItems.forEach((item) => {
      if (nextItems.has(item)) {
        return;
      }

      observer.unobserve(item);
      this.observedItems.delete(item);
    });

    items.forEach((item) => {
      if (this.observedItems.has(item)) {
        return;
      }

      observer.observe(item);
      this.observedItems.add(item);
    });
  }

  private resolveItems(): HTMLElement[] {
    const selector = this.itemSelector().trim();

    if (!selector) {
      return [];
    }

    return Array.from(
      this.host.nativeElement.querySelectorAll<HTMLElement>(selector),
    ).filter((item) => item.getClientRects().length > 0);
  }

  private resolveActiveItem(items: HTMLElement[]): HTMLElement | null {
    return (
      items.find(
        (item) =>
          item.classList.contains('is-active') ||
          item.getAttribute('aria-selected') === 'true' ||
          item.getAttribute('aria-current') === 'page',
      ) ?? null
    );
  }

  private queueSync(): void {
    cancelAnimationFrame(this.animationFrameId);
    this.animationFrameId = requestAnimationFrame(() => this.syncIndicator());
  }

  private syncIndicator(): void {
    const host = this.host.nativeElement;
    const indicator = this.indicator;

    if (!indicator) {
      return;
    }

    this.syncObservedItems();

    const items = this.resolveItems();
    const activeItem = this.resolveActiveItem(items);

    if (!activeItem) {
      host.classList.remove('ubax-morph-tabs--ready');
      return;
    }

    const width = activeItem.offsetWidth;
    const height = activeItem.offsetHeight;

    if (!width || !height) {
      host.classList.remove('ubax-morph-tabs--ready');
      return;
    }

    host.style.setProperty('--ubax-morph-x', `${activeItem.offsetLeft}px`);
    host.style.setProperty('--ubax-morph-y', `${activeItem.offsetTop}px`);
    host.style.setProperty('--ubax-morph-width', `${width}px`);
    host.style.setProperty('--ubax-morph-height', `${height}px`);
    host.classList.add('ubax-morph-tabs--ready');
  }
}

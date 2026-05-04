import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  HostListener,
  NgZone,
  PLATFORM_ID,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { UbaxMorphTabsDirective } from '@ubax-workspace/shared-ui';
import {
  AuthStore,
  NavItemConfig,
  ROLE_BADGE_CONFIG,
  SUB_ROLE_LABELS,
  topbarNavItemsForUser,
} from '@ubax-workspace/ubax-web-data-access';
import { filter, map } from 'rxjs';

const COMPACT_EXIT_BUFFER = 8;

function normalizeUrl(url: string): string {
  return url.split('?')[0].split('#')[0];
}

function readFlexGap(element: HTMLElement): number {
  const styles = globalThis.getComputedStyle(element);
  const gapValue = styles.columnGap || styles.gap || '0';
  const parsedGap = Number.parseFloat(gapValue);

  return Number.isFinite(parsedGap) ? parsedGap : 0;
}

@Component({
  selector: 'ubax-topbar',
  standalone: true,
  imports: [RouterLink, UbaxMorphTabsDirective],
  templateUrl: './topbar.component.html',
  styleUrl: './topbar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TopbarComponent implements AfterViewInit {
  readonly authStore = inject(AuthStore);
  private readonly router = inject(Router);
  private readonly zone = inject(NgZone);
  private readonly destroyRef = inject(DestroyRef);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly elementRef = inject(ElementRef);
  protected readonly notificationCount = 3;
  protected readonly isMobileNavOpen = signal(false);
  protected readonly isCompactNav = signal(false);
  protected readonly isScrolled = signal(false);
  protected readonly isUserMenuOpen = signal(false);
  private inlineNavRequiredWidth = 0;
  private readonly topbarInner =
    viewChild<ElementRef<HTMLElement>>('topbarInner');
  private readonly topbarLogo =
    viewChild<ElementRef<HTMLElement>>('topbarLogo');
  private readonly topbarActions =
    viewChild<ElementRef<HTMLElement>>('topbarActions');
  private readonly navShell = viewChild<ElementRef<HTMLElement>>('navShell');
  private readonly navList = viewChild<ElementRef<HTMLElement>>('navList');
  private readonly menuButton =
    viewChild<ElementRef<HTMLElement>>('menuButton');
  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map((event) => normalizeUrl(event.urlAfterRedirects)),
    ),
    { initialValue: normalizeUrl(this.router.url) },
  );

  protected roleLabel(): string {
    const user = this.authStore.user();
    if (!user) return '';
    if (user.subRole) return SUB_ROLE_LABELS[user.subRole] ?? user.subRole;
    return ROLE_BADGE_CONFIG[user.mainRole]?.label ?? user.mainRole;
  }

  protected avatarSrc(): string | null {
    return this.authStore.user()?.avatar ?? null;
  }

  protected avatarLabel(): string {
    const user = this.authStore.user();
    const initials = `${user?.prenom?.charAt(0) ?? ''}${user?.nom?.charAt(0) ?? ''}`;

    return initials || '?';
  }

  protected visibleItems(): readonly NavItemConfig[] {
    return topbarNavItemsForUser(this.authStore.user());
  }

  protected logoSrc(): string {
    return this.authStore.scope() === 'HOTEL'
      ? 'header/header-hotel-logo.webp'
      : 'header/header-logo.webp';
  }

  ngAfterViewInit(): void {
    this.observeCompactNavState();
    this.observeScrollState();
  }

  protected isItemActive(item: NavItemConfig): boolean {
    const currentUrl = this.currentUrl();
    const activePaths = item.activePaths ?? [item.path];

    return activePaths.some(
      (path) => currentUrl === path || currentUrl.startsWith(`${path}/`),
    );
  }

  protected toggleMobileMenu(): void {
    this.isMobileNavOpen.update((isOpen) => !isOpen);
  }

  protected closeMobileMenu(): void {
    this.isMobileNavOpen.set(false);
  }

  protected toggleUserMenu(event: MouseEvent): void {
    event.stopPropagation();
    this.isUserMenuOpen.update((open) => !open);
  }

  protected closeUserMenu(): void {
    this.isUserMenuOpen.set(false);
  }

  protected logout(): void {
    this.isUserMenuOpen.set(false);
    this.authStore.logout();
  }

  @HostListener('document:click', ['$event.target'])
  onDocumentClick(target: EventTarget | null): void {
    if (
      this.isUserMenuOpen() &&
      (!(target instanceof Node) ||
        !this.elementRef.nativeElement.contains(target))
    ) {
      this.isUserMenuOpen.set(false);
    }
  }

  private observeCompactNavState(): void {
    const observedElements = this.collectObservedElements();

    if (!observedElements.length) {
      return;
    }

    this.zone.runOutsideAngular(() => {
      const animationFrameState = { id: 0 };

      const scheduleMeasure = () => {
        this.scheduleCompactNavMeasure(animationFrameState);
      };

      const resizeObserver = new ResizeObserver(scheduleMeasure);

      observedElements.forEach((element) => resizeObserver.observe(element));
      scheduleMeasure();

      this.destroyRef.onDestroy(() => {
        cancelAnimationFrame(animationFrameState.id);
        resizeObserver.disconnect();
      });
    });
  }

  private observeScrollState(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.zone.runOutsideAngular(() => {
      const updateScrollState = () => {
        const nextValue = globalThis.scrollY > 18;

        if (nextValue === this.isScrolled()) {
          return;
        }

        this.zone.run(() => {
          this.isScrolled.set(nextValue);
        });
      };

      updateScrollState();
      globalThis.addEventListener('scroll', updateScrollState, {
        passive: true,
      });

      this.destroyRef.onDestroy(() => {
        globalThis.removeEventListener('scroll', updateScrollState);
      });
    });
  }

  private collectObservedElements(): HTMLElement[] {
    return [
      this.topbarInner()?.nativeElement,
      this.topbarLogo()?.nativeElement,
      this.topbarActions()?.nativeElement,
      this.navShell()?.nativeElement,
      this.navList()?.nativeElement,
    ].filter((element): element is HTMLElement => Boolean(element));
  }

  private updateCompactNavState(): void {
    const navShell = this.navShell()?.nativeElement;
    const navList = this.navList()?.nativeElement;

    if (!navShell || !navList) {
      return;
    }

    if (this.isMobileNavOpen()) {
      return;
    }

    this.updateInlineNavRequiredWidth(navList);

    const requiredInlineWidth =
      this.inlineNavRequiredWidth || navList.scrollWidth;

    if (!requiredInlineWidth) {
      return;
    }

    const availableInlineWidth = this.availableInlineNavWidth(navShell);
    const nextCompactState = this.isCompactNav()
      ? requiredInlineWidth > availableInlineWidth - COMPACT_EXIT_BUFFER
      : requiredInlineWidth > availableInlineWidth + 1;

    this.isCompactNav.set(nextCompactState);

    if (!nextCompactState && this.isMobileNavOpen()) {
      this.isMobileNavOpen.set(false);
    }
  }

  private availableInlineNavWidth(navShell: HTMLElement): number {
    const menuButton = this.menuButton()?.nativeElement;
    const topbarActions = this.topbarActions()?.nativeElement;
    const reclaimedWidth =
      menuButton && topbarActions
        ? menuButton.offsetWidth + readFlexGap(topbarActions)
        : 0;

    return navShell.clientWidth + reclaimedWidth;
  }

  private updateInlineNavRequiredWidth(navList: HTMLElement): void {
    if (this.isCompactNav()) {
      return;
    }

    const measuredWidth = navList.scrollWidth;

    if (measuredWidth > 0) {
      this.inlineNavRequiredWidth = measuredWidth;
    }
  }

  private scheduleCompactNavMeasure(animationFrameState: { id: number }): void {
    cancelAnimationFrame(animationFrameState.id);
    animationFrameState.id = requestAnimationFrame(() => {
      this.runCompactNavMeasure();
    });
  }

  private runCompactNavMeasure(): void {
    this.zone.run(() => this.updateCompactNavState());
  }
}

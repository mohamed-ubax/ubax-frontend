import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  NgZone,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { AuthStore, Role } from '@ubax-workspace/ubax-web-data-access';
import { AvatarModule } from 'primeng/avatar';
import { BadgeModule } from 'primeng/badge';
import { ButtonModule } from 'primeng/button';
import { filter, map } from 'rxjs';

interface NavItem {
  label: string;
  path: string;
  activePaths?: string[];
}

const ROLE_LABELS: Record<string, string> = {
  DG: "Directeur d'agence",
  COMMERCIAL: 'Commercial',
  COMPTABLE: 'Comptable',
  SAV: 'Service client',
  HOTEL: 'Responsable hôtel',
};

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
  imports: [RouterLink, ButtonModule, AvatarModule, BadgeModule],
  templateUrl: './topbar.component.html',
  styleUrl: './topbar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TopbarComponent implements AfterViewInit {
  readonly authStore = inject(AuthStore);
  private readonly router = inject(Router);
  private readonly zone = inject(NgZone);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly isMobileNavOpen = signal(false);
  protected readonly isCompactNav = signal(false);
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
    const role = this.authStore.user()?.role;
    return role ? (ROLE_LABELS[role] ?? role) : '';
  }

  private readonly agencyNavItems: NavItem[] = [
    { label: 'Tableau de bord', path: '/tableau-de-bord' },
    { label: 'Biens', path: '/biens' },
    { label: 'Réservations', path: '/reservations' },
    { label: 'Demandes clientèles', path: '/demandes' },
    { label: 'Finances', path: '/finances' },
    { label: 'Archivages', path: '/archivages' },
  ];

  private readonly hotelNavItems: NavItem[] = [
    { label: 'Tableau de bord', path: '/tableau-de-bord' },
    {
      label: 'Réservations',
      path: '/hotel/reservations',
      activePaths: ['/hotel/reservations', '/reservations'],
    },
    { label: 'Espaces', path: '/hotel/espaces' },
    { label: 'Clients', path: '/hotel/clients' },
    { label: 'Employés', path: '/hotel/employes' },
    { label: 'Facturation', path: '/hotel/facturation' },
  ];

  protected visibleItems(): NavItem[] {
    return this.authStore.role() === Role.HOTEL
      ? this.hotelNavItems
      : this.agencyNavItems;
  }

  protected logoSrc(): string {
    return this.authStore.role() === Role.HOTEL
      ? 'header/header-hotel-logo.png'
      : 'header/header-logo.png';
  }

  ngAfterViewInit(): void {
    this.observeCompactNavState();
  }

  protected isItemActive(item: NavItem): boolean {
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

  protected logout(): void {
    this.authStore.logout();
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

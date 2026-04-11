import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
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

function normalizeUrl(url: string): string {
  return url.split('?')[0].split('#')[0];
}

@Component({
  selector: 'ubax-topbar',
  standalone: true,
  imports: [RouterLink, ButtonModule, AvatarModule, BadgeModule],
  templateUrl: './topbar.component.html',
  styleUrl: './topbar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TopbarComponent {
  readonly authStore = inject(AuthStore);
  private readonly router = inject(Router);
  protected readonly isMobileNavOpen = signal(false);
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
}

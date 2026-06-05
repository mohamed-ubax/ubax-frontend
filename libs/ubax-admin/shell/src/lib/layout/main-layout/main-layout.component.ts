import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  NavigationEnd,
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from '@angular/router';
import { AuthStore } from '@ubax-workspace/ubax-web-data-access/auth-store';
import {
  AdminAgenciesStore,
  AdminHotelsStore,
} from '@ubax-workspace/ubax-admin-data-access';
import { NOTIFICATION_HANDLER } from '@ubax-workspace/shared-data-access';
import {
  NotificationService,
  type AdminNotification,
} from '../../services/notification.service';
import { filter, map, startWith } from 'rxjs/operators';

@Component({
  selector: 'ubax-admin-main-layout',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
  ],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.scss',
  providers: [
    NotificationService,
    { provide: NOTIFICATION_HANDLER, useExisting: NotificationService },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MainLayoutComponent implements OnInit {
  private readonly authStore = inject(AuthStore);
  private readonly router = inject(Router);
  private readonly hotelsStore = inject(AdminHotelsStore);
  private readonly agenciesStore = inject(AdminAgenciesStore);
  private readonly notificationService = inject(NotificationService);

  protected readonly user = this.authStore.user;
  protected readonly fullName = this.authStore.fullName;
  protected readonly isSuperAdmin = this.authStore.isSuperAdmin;
  protected readonly notifications = this.notificationService.notifications;

  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects),
      startWith(this.router.url),
    ),
    { initialValue: this.router.url },
  );

  protected readonly currentPageTitle = computed(() =>
    this.resolveCurrentPageTitle(this.currentUrl()),
  );
  protected readonly avatarUrl = computed(() => this.user()?.avatar ?? null);

  protected readonly proprietesExpanded = signal(false);
  protected readonly hotelsExpanded = signal(true);
  protected readonly agenciesExpanded = signal(true);

  protected readonly isHotelsRoute = computed(() => {
    const pathname = this.currentUrl().split('?')[0].replace(/\/+$/, '');
    return pathname.endsWith('/hotels') || pathname.includes('/hotels/');
  });

  protected readonly isAgenciesRoute = computed(() => {
    const pathname = this.currentUrl().split('?')[0].replace(/\/+$/, '');
    return pathname.endsWith('/agences') || pathname.includes('/agences/');
  });

  protected readonly hotelsSubItemCounts = computed(() => {
    const hotels = this.hotelsStore.hotels();
    const active = hotels.filter(
      (hotel) => this.resolveHotelStatus(hotel) === 'active',
    ).length;
    const pending = hotels.filter(
      (hotel) => this.resolveHotelStatus(hotel) === 'pending',
    ).length;
    const suspended = hotels.filter(
      (hotel) => this.resolveHotelStatus(hotel) === 'suspended',
    ).length;

    return {
      all: hotels.length,
      active,
      pending,
      suspended,
    };
  });

  protected readonly agenciesSubItemCounts = computed(() => {
    const agencies = this.agenciesStore.agencies();
    const active = agencies.filter(
      (agency) => this.resolveAgencyStatus(agency) === 'active',
    ).length;
    const pending = agencies.filter(
      (agency) => this.resolveAgencyStatus(agency) === 'pending',
    ).length;
    const suspended = agencies.filter(
      (agency) => this.resolveAgencyStatus(agency) === 'suspended',
    ).length;

    return {
      all: agencies.length,
      active,
      pending,
      suspended,
    };
  });

  // navGroups gardé pour référence future si on revient au composant ubax-sidebar
  protected readonly navGroups = [];

  protected toggleProprietes(): void {
    this.proprietesExpanded.update((v) => !v);
  }

  protected toggleHotels(): void {
    this.hotelsExpanded.update((v) => !v);
  }

  protected toggleAgencies(): void {
    this.agenciesExpanded.update((v) => !v);
  }

  protected dismissNotification(notification: AdminNotification): void {
    this.notificationService.dismiss(notification.id);
  }

  protected logout(): void {
    this.authStore.logout();
  }

  ngOnInit(): void {
    if (!this.isSuperAdmin()) {
      return;
    }

    if (!this.hotelsStore.hotels().length && !this.hotelsStore.loading()) {
      void this.hotelsStore.load().catch(() => undefined);
    }

    if (
      !this.agenciesStore.agencies().length &&
      !this.agenciesStore.loading()
    ) {
      void this.agenciesStore.load().catch(() => undefined);
    }
  }

  private resolveCurrentPageTitle(url: string): string {
    const [rawPath, rawQuery] = url.split('?');
    const pathname = rawPath.replace(/\/+$/, '');
    const queryParams = new URLSearchParams(rawQuery ?? '');
    const segments = pathname.split('/').filter(Boolean);
    const adminIndex = segments.indexOf('admin');
    const routeSegments =
      adminIndex >= 0 ? segments.slice(adminIndex + 1) : segments;

    if (routeSegments.length === 0) {
      return 'Tableau de bord';
    }

    const first = routeSegments[0] ?? '';
    const pair = routeSegments.slice(0, 2).join('/');

    if (first === 'hotels') {
      return this.resolveHotelsTitle(queryParams.get('status'));
    }

    if (first === 'agences') {
      if (routeSegments.length >= 2 && routeSegments[1] !== 'membres') {
        return "Détail de l'agence";
      }

      if (routeSegments.length >= 3 && routeSegments[2] === 'membres') {
        return "Membres de l'agence";
      }

      return this.resolveAgenciesTitle(queryParams.get('status'));
    }

    const labels: Record<string, string> = {
      'tableau-de-bord': 'Tableau de bord',
      hotels: 'Hôtels',
      agences: 'Agences Immobilières',
      candidatures: 'Candidatures',
      bailleurs: 'Demandes bailleur',
      proprietes: 'Modération',
      'proprietes/agences': 'Liste propriétés agence',
      'proprietes/hotels': 'Liste propriétés hôtels',
      reservations: 'Réservations',
      administrateurs: 'Administrateurs',
      clients: 'Clients',
      'code-lists': 'Listes de codes',
    };

    return labels[pair] ?? labels[first] ?? 'Back-office UBAX';
  }

  private resolveHotelsTitle(status: string | null): string {
    if (status === 'suspended') {
      return 'Hôtels suspendus';
    }
    if (status === 'active') {
      return 'Hôtels actifs';
    }
    if (status === 'pending') {
      return 'Hôtels en attente';
    }

    return 'Tous les hôtels';
  }

  private resolveAgenciesTitle(status: string | null): string {
    if (status === 'suspended') {
      return 'Agences suspendues';
    }
    if (status === 'active') {
      return 'Agences actives';
    }
    if (status === 'pending') {
      return 'Agences en attente';
    }

    return 'Toutes les agences';
  }

  private resolveHotelStatus(hotel: {
    active?: boolean;
    subscriptionActive?: boolean;
    subscriptionExpiresAt?: string;
  }): 'active' | 'pending' | 'suspended' {
    if (!hotel.active) {
      return 'suspended';
    }

    if (
      !hotel.subscriptionActive ||
      this.isExpired(hotel.subscriptionExpiresAt)
    ) {
      return 'pending';
    }

    return 'active';
  }

  private resolveAgencyStatus(agency: {
    active?: boolean;
    subscriptionActive?: boolean;
    subscriptionExpiresAt?: string;
  }): 'active' | 'pending' | 'suspended' {
    if (!agency.active) {
      return 'suspended';
    }

    if (
      !agency.subscriptionActive ||
      this.isExpired(agency.subscriptionExpiresAt)
    ) {
      return 'pending';
    }

    return 'active';
  }

  private isExpired(value?: string): boolean {
    if (!value) {
      return false;
    }

    const expiry = new Date(value);
    if (Number.isNaN(expiry.getTime())) {
      return false;
    }

    return expiry.getTime() < Date.now();
  }
}

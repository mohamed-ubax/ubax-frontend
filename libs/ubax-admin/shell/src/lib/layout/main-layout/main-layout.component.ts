import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  NavigationEnd,
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from '@angular/router';
import { DatePickerModule } from 'primeng/datepicker';
import { Toast } from 'primeng/toast';
import { AuthStore } from '@ubax-workspace/ubax-web-data-access/auth-store';
import { AdminHotelsStore } from '@ubax-workspace/ubax-admin-data-access';
import { filter, map, startWith } from 'rxjs/operators';

@Component({
  selector: 'ubax-admin-main-layout',
  standalone: true,
  imports: [
    FormsModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    DatePickerModule,
    Toast,
  ],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MainLayoutComponent implements OnInit {
  private readonly authStore = inject(AuthStore);
  private readonly router = inject(Router);
  private readonly hotelsStore = inject(AdminHotelsStore);

  protected readonly user = this.authStore.user;
  protected readonly fullName = this.authStore.fullName;
  protected readonly isSuperAdmin = this.authStore.isSuperAdmin;

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

  protected readonly selectedRange = signal<Date[] | null>(
    this.createCurrentWeekRange(),
  );

  protected readonly proprietesExpanded = signal(false);
  protected readonly hotelsExpanded = signal(true);

  protected readonly isHotelsRoute = computed(() => {
    const pathname = this.currentUrl().split('?')[0].replace(/\/+$/, '');
    return pathname.endsWith('/hotels') || pathname.includes('/hotels/');
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

  // navGroups gardé pour référence future si on revient au composant ubax-sidebar
  protected readonly navGroups = [];

  protected toggleProprietes(): void {
    this.proprietesExpanded.update((v) => !v);
  }

  protected toggleHotels(): void {
    this.hotelsExpanded.update((v) => !v);
  }

  protected formatRangeDisplay(range: Date[] | null): string {
    if (!range?.length) {
      return '';
    }

    const [start, end] = range;
    if (!start || !end) {
      return '';
    }

    const formatter = new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

    return `${formatter.format(start)} - ${formatter.format(end)}`;
  }

  protected logout(): void {
    this.authStore.logout();
  }

  ngOnInit(): void {
    if (!this.isSuperAdmin()) {
      return;
    }

    if (this.hotelsStore.hotels().length > 0 || this.hotelsStore.loading()) {
      return;
    }

    void this.hotelsStore.load().catch(() => undefined);
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
      const status = queryParams.get('status');
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

  private createCurrentWeekRange(): Date[] {
    const today = new Date();
    const start = new Date(today);
    const day = start.getDay();
    const diffToMonday = day === 0 ? -6 : 1 - day;
    start.setDate(start.getDate() + diffToMonday);
    start.setHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);

    return [start, end];
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

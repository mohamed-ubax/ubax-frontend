import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
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
import { Toast } from 'primeng/toast';
import { AuthStore } from '@ubax-workspace/ubax-web-data-access/auth-store';
import { filter, map, startWith } from 'rxjs/operators';

@Component({
  selector: 'ubax-admin-main-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, Toast],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MainLayoutComponent {
  private readonly authStore = inject(AuthStore);
  private readonly router = inject(Router);

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

  protected readonly proprietesExpanded = signal(false);

  // navGroups gardé pour référence future si on revient au composant ubax-sidebar
  protected readonly navGroups = [];

  protected toggleProprietes(): void {
    this.proprietesExpanded.update((v) => !v);
  }

  protected logout(): void {
    this.authStore.logout();
  }

  private resolveCurrentPageTitle(url: string): string {
    const pathname = url.split('?')[0].replace(/\/+$/, '');
    const segments = pathname.split('/').filter(Boolean);
    const adminIndex = segments.indexOf('admin');
    const routeSegments =
      adminIndex >= 0 ? segments.slice(adminIndex + 1) : segments;

    if (routeSegments.length === 0) {
      return 'Tableau de bord';
    }

    const first = routeSegments[0] ?? '';
    const pair = routeSegments.slice(0, 2).join('/');

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
}

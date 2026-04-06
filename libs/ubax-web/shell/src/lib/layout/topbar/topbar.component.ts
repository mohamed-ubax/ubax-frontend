import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthStore, Role } from '@ubax-workspace/ubax-web-data-access';
import { AvatarModule } from 'primeng/avatar';
import { BadgeModule } from 'primeng/badge';
import { ButtonModule } from 'primeng/button';

interface NavItem {
  label: string;
  path: string;
  roles?: Role[];
}

const ROLE_LABELS: Record<string, string> = {
  DG: "Directeur d'agence",
  COMMERCIAL: 'Commercial',
  COMPTABLE: 'Comptable',
  SAV: 'Service client',
  HOTEL: 'Responsable hôtel',
};

@Component({
  selector: 'ubax-topbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, ButtonModule, AvatarModule, BadgeModule],
  templateUrl: './topbar.component.html',
  styleUrl: './topbar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TopbarComponent {
  readonly authStore = inject(AuthStore);

  protected roleLabel(): string {
    const role = this.authStore.user()?.role;
    return role ? (ROLE_LABELS[role] ?? role) : '';
  }

  protected readonly navItems: NavItem[] = [
    { label: 'Tableau de bord',   path: '/tableau-de-bord' },
    { label: 'Biens',             path: '/biens' },
    { label: 'Réservations',      path: '/reservations' },
    { label: 'Demandes clientèles', path: '/demandes' },
    { label: 'Finances',          path: '/finances' },
    { label: 'Archivages',        path: '/archivages' },
    { label: 'Hôtel',             path: '/hotel', roles: [Role.HOTEL] },
  ];

  protected visibleItems(): NavItem[] {
    const role = this.authStore.role();
    return this.navItems.filter(
      (item) => !item.roles?.length || (role && item.roles.includes(role)),
    );
  }

  protected logout(): void {
    this.authStore.logout();
  }
}

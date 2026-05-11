import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Toast } from 'primeng/toast';
import { AuthStore } from '@ubax-workspace/ubax-web-data-access/auth-store';
import { SidebarComponent, NavGroup } from '@ubax-workspace/shared-design-system';

@Component({
  selector: 'ubax-admin-main-layout',
  standalone: true,
  imports: [RouterOutlet, Toast, SidebarComponent],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MainLayoutComponent {
  private readonly authStore = inject(AuthStore);

  protected readonly user     = this.authStore.user;
  protected readonly fullName = this.authStore.fullName;

  protected readonly navGroups: NavGroup[] = [
    {
      items: [
        { label: 'Tableau de bord', icon: 'pi pi-th-large',  routerLink: '/tableau-de-bord', exact: true },
        { label: 'Hôtels',          icon: 'pi pi-building',  routerLink: '/hotels' },
        { label: 'Agences',         icon: 'pi pi-home',      routerLink: '/agences' },
        { label: 'Candidatures',    icon: 'pi pi-inbox',     routerLink: '/candidatures' },
        { label: 'Propriétés',      icon: 'pi pi-map-marker',routerLink: '/proprietes',      disabled: true },
        { label: 'Réservations',    icon: 'pi pi-calendar',  routerLink: '/reservations',    disabled: true },
        { label: 'Administrateurs', icon: 'pi pi-users',     routerLink: '/administrateurs' },
        { label: 'Paiements',       icon: 'pi pi-wallet',    routerLink: '/paiements',       disabled: true },
        { label: 'Statistiques',    icon: 'pi pi-chart-bar', routerLink: '/statistiques',    disabled: true },
        { label: 'Logs système',    icon: 'pi pi-list',      routerLink: '/logs',            disabled: true },
      ],
    },
  ];

  protected logout(): void {
    this.authStore.logout();
  }
}

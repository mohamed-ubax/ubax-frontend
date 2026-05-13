import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { Toast } from 'primeng/toast';
import { AuthStore } from '@ubax-workspace/ubax-web-data-access/auth-store';

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

  protected readonly user     = this.authStore.user;
  protected readonly fullName = this.authStore.fullName;

  protected readonly proprietesExpanded = signal(false);

  // navGroups gardé pour référence future si on revient au composant ubax-sidebar
  protected readonly navGroups = [];

  protected toggleProprietes(): void {
    this.proprietesExpanded.update(v => !v);
  }

  protected logout(): void {
    this.authStore.logout();
  }
}

import { NgComponentOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  Type,
  computed,
  inject,
} from '@angular/core';
import {
  AuthStore,
  UbaxRole,
  UbaxSubRole,
} from '@ubax-workspace/ubax-web-data-access';
import { DashboardCommercialPageComponent } from '../../pages/dashboard-commercial-page/dashboard-commercial-page.component';
import { DashboardComptablePageComponent } from '../../pages/dashboard-comptable-page/dashboard-comptable-page.component';
import { DashboardDgPageComponent } from '../../pages/dashboard-dg-page/dashboard-dg-page.component';
import { DashboardSavPageComponent } from '../../pages/dashboard-sav-page/dashboard-sav-page-redesign.component';

@Component({
  selector: 'ubax-internal-dashboard-router',
  standalone: true,
  imports: [NgComponentOutlet],
  template: `
    @if (dashboardComponent(); as dashboardComponent) {
      <ng-container *ngComponentOutlet="dashboardComponent" />
    } @else {
      <section class="internal-dashboard-router__loading" aria-live="polite">
        <p>Chargement du tableau de bord...</p>
      </section>
    }
  `,
  styles: `
    .internal-dashboard-router__loading {
      min-height: 18rem;
      display: grid;
      place-items: center;
      padding: 2rem;
      color: rgba(17, 24, 39, 0.72);
      font-size: 1rem;
      font-weight: 600;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InternalDashboardRouterComponent {
  private readonly authStore = inject(AuthStore);
  protected readonly dashboardComponent = computed<Type<unknown> | null>(() => {
    const user = this.authStore.user();

    if (
      user?.mainRole !== UbaxRole.ADMIN &&
      user?.mainRole !== UbaxRole.SUPER_ADMIN
    ) {
      return null;
    }

    switch (user?.subRole) {
      case UbaxSubRole.COMMERCIAL:
        return DashboardCommercialPageComponent;
      case UbaxSubRole.FINANCE:
        return DashboardComptablePageComponent;
      case UbaxSubRole.SUPPORT_CLIENT:
      case UbaxSubRole.OPERATIONS:
        return DashboardSavPageComponent;
      case UbaxSubRole.DIRECTEUR_GENERAL:
      default:
        return DashboardDgPageComponent;
    }
  });
}

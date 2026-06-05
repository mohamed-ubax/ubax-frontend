import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AdminAgenciesStore } from '@ubax-workspace/ubax-admin-data-access';
import type { AdminAgencyResponse } from '@ubax-workspace/shared-api-types';
import { NOTIFICATION_HANDLER } from '@ubax-workspace/shared-data-access';
import {
  EmptyStateComponent,
  SectionCardComponent,
  StatusBadgeComponent,
} from '@ubax-workspace/shared-design-system';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'ubax-admin-agency-detail-page',
  standalone: true,
  imports: [
    ButtonModule,
    EmptyStateComponent,
    SectionCardComponent,
    StatusBadgeComponent,
  ],
  templateUrl: './agency-detail-page.component.html',
  styleUrls: ['./agency-detail-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AgencyDetailPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly store = inject(AdminAgenciesStore);
  private readonly notif = inject(NOTIFICATION_HANDLER);

  protected readonly loading = this.store.loading;
  protected readonly agencies = this.store.agencies;

  protected readonly agencyId =
    this.route.snapshot.paramMap.get('agencyId') ?? '';

  protected readonly agency = computed<AdminAgencyResponse | null>(() => {
    return (
      this.agencies().find((agency) => agency.id === this.agencyId) ?? null
    );
  });

  ngOnInit(): void {
    void this.ensureAgencyLoaded();
  }

  protected goBack(): void {
    void this.router.navigate(['/agences']);
  }

  protected viewMembers(): void {
    if (!this.agencyId) {
      return;
    }

    void this.router.navigate(['/agences', this.agencyId, 'membres']);
  }

  protected statusLabel(agency: AdminAgencyResponse): string {
    if (!agency.active) {
      return 'Suspendu';
    }

    if (
      !agency.subscriptionActive ||
      this.isExpired(agency.subscriptionExpiresAt)
    ) {
      return 'En attente';
    }

    return 'Actif';
  }

  protected statusVariant(
    agency: AdminAgencyResponse,
  ): 'active' | 'warning' | 'suspended' {
    if (!agency.active) {
      return 'suspended';
    }

    if (
      !agency.subscriptionActive ||
      this.isExpired(agency.subscriptionExpiresAt)
    ) {
      return 'warning';
    }

    return 'active';
  }

  protected formatDate(value?: string): string {
    if (!value) {
      return '—';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return '—';
    }

    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(date);
  }

  private async ensureAgencyLoaded(): Promise<void> {
    if (!this.agencyId) {
      return;
    }

    if (this.agency()) {
      return;
    }

    try {
      await this.store.load();
    } catch {
      this.notif.error(
        this.store.error() ?? "Impossible de charger le détail de l'agence.",
      );
    }
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

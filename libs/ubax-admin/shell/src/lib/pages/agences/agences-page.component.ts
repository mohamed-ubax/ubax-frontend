import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import type { AdminAgencyResponse } from '@ubax-workspace/shared-api-types';
import {
  ConfirmDialogComponent,
  EmptyStateComponent,
  SearchFilterBarComponent,
  SectionCardComponent,
  StatusBadgeComponent,
  type FilterOption,
} from '@ubax-workspace/shared-design-system';
import { AuthStore } from '@ubax-workspace/ubax-web-data-access/auth-store';
import { NOTIFICATION_HANDLER, resolveHttpErrorMessage } from '@ubax-workspace/shared-data-access';
import { AvatarModule } from 'primeng/avatar';
import { TableModule } from 'primeng/table';
import { AdminPartnersService } from '../../services/admin-partners.service';

type StatusFilter = 'all' | 'active' | 'suspended';

const STATUS_FILTER_OPTIONS: { label: string; value: StatusFilter }[] = [
  { label: 'Tous les statuts', value: 'all' },
  { label: 'Actives', value: 'active' },
  { label: 'Suspendues', value: 'suspended' },
];

@Component({
  selector: 'ubax-admin-agences-page',
  standalone: true,
  imports: [
    TableModule,
    AvatarModule,
    SearchFilterBarComponent,
    SectionCardComponent,
    StatusBadgeComponent,
    EmptyStateComponent,
    ConfirmDialogComponent,
  ],
  templateUrl: './agences-page.component.html',
  styleUrl: './agences-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AgencesPageComponent implements OnInit {
  private readonly svc = inject(AdminPartnersService);
  private readonly authStore = inject(AuthStore);
  private readonly notif = inject(NOTIFICATION_HANDLER);
  private readonly router = inject(Router);

  protected readonly loading = signal(false);
  protected readonly actionLoading = signal(false);
  protected readonly agencies = signal<AdminAgencyResponse[]>([]);
  protected readonly searchQuery = signal('');
  protected readonly statusFilter = signal<StatusFilter>('all');

  protected readonly isSuperAdmin = this.authStore.isSuperAdmin;

  protected readonly showConfirm = signal(false);
  protected readonly confirmAction = signal<'activate' | 'suspend' | null>(null);
  protected readonly selectedAgency = signal<AdminAgencyResponse | null>(null);

  protected readonly searchFilters: { label: string; options: FilterOption[] }[] = [
    { label: 'Tous les statuts', options: STATUS_FILTER_OPTIONS },
  ];

  protected readonly filteredAgencies = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const status = this.statusFilter();
    return this.agencies().filter((a) => {
      const matchesQuery =
        !query ||
        (a.name ?? '').toLowerCase().includes(query) ||
        (a.city ?? '').toLowerCase().includes(query) ||
        (a.email ?? '').toLowerCase().includes(query);
      const matchesStatus =
        status === 'all' ||
        (status === 'active' && a.active) ||
        (status === 'suspended' && !a.active);
      return matchesQuery && matchesStatus;
    });
  });

  protected readonly agencyCount = computed(() => this.agencies().length);

  ngOnInit(): void {
    void this.loadAgencies();
  }

  private async loadAgencies(): Promise<void> {
    this.loading.set(true);
    try {
      this.agencies.set(await firstValueFrom(this.svc.listAgencies()));
    } catch (err) {
      this.notif.error(resolveHttpErrorMessage(err, 'Impossible de charger la liste des agences.'));
    } finally {
      this.loading.set(false);
    }
  }

  protected initials(a: AdminAgencyResponse): string {
    return (a.name ?? 'AG').slice(0, 2).toUpperCase();
  }

  protected onSearchChange(value: string): void {
    this.searchQuery.set(value);
  }

  protected onFilterChange(event: { filter: string; value: unknown }): void {
    this.statusFilter.set((event.value as StatusFilter) ?? 'all');
  }

  protected viewMembers(agency: AdminAgencyResponse): void {
    void this.router.navigate(['/agences', agency.id, 'membres']);
  }

  protected promptToggle(agency: AdminAgencyResponse): void {
    this.selectedAgency.set(agency);
    this.confirmAction.set(agency.active ? 'suspend' : 'activate');
    this.showConfirm.set(true);
  }

  protected async confirmToggle(): Promise<void> {
    const agency = this.selectedAgency();
    if (!agency?.id) return;

    this.actionLoading.set(true);
    try {
      const action = this.confirmAction();
      const updated =
        action === 'activate'
          ? await firstValueFrom(this.svc.activateAgency(agency.id))
          : await firstValueFrom(this.svc.suspendAgency(agency.id));

      this.agencies.update((list) =>
        list.map((a) => (a.id === updated.id ? updated : a)),
      );
      this.notif.success(
        action === 'activate' ? 'Agence activée.' : 'Agence suspendue.',
      );
      this.showConfirm.set(false);
    } catch (err) {
      this.notif.error(resolveHttpErrorMessage(err, "L'opération a échoué."));
    } finally {
      this.actionLoading.set(false);
    }
  }

  protected get confirmTitle(): string {
    return this.confirmAction() === 'activate'
      ? "Activer l'agence"
      : "Suspendre l'agence";
  }

  protected get confirmMessage(): string {
    const name = this.selectedAgency()?.name ?? 'cette agence';
    return this.confirmAction() === 'activate'
      ? `Activer ${name} lui permettra d'accéder à nouveau à la plateforme.`
      : `Suspendre ${name} bloquera l'accès à la plateforme pour cette agence.`;
  }

  protected get confirmLabel(): string {
    return this.confirmAction() === 'activate' ? 'Activer' : 'Suspendre';
  }

  protected get confirmSeverity(): 'success' | 'warn' {
    return this.confirmAction() === 'activate' ? 'success' : 'warn';
  }
}

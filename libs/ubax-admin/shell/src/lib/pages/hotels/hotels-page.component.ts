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
import type { AdminHotelResponse } from '@ubax-workspace/shared-api-types';
import {
  ConfirmDialogComponent,
  EmptyStateComponent,
  SearchFilterBarComponent,
  SectionCardComponent,
  StatusBadgeComponent,
  type FilterOption,
} from '@ubax-workspace/shared-design-system';
import { AuthStore } from '@ubax-workspace/ubax-web-data-access/auth-store';
import { NOTIFICATION_HANDLER } from '@ubax-workspace/shared-data-access';
import { AvatarModule } from 'primeng/avatar';
import { TableModule } from 'primeng/table';
import { AdminPartnersService } from '../../services/admin-partners.service';

type StatusFilter = 'all' | 'active' | 'suspended';

const STATUS_FILTER_OPTIONS: { label: string; value: StatusFilter }[] = [
  { label: 'Tous les statuts', value: 'all' },
  { label: 'Actifs', value: 'active' },
  { label: 'Suspendus', value: 'suspended' },
];

@Component({
  selector: 'ubax-admin-hotels-page',
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
  templateUrl: './hotels-page.component.html',
  styleUrl: './hotels-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HotelsPageComponent implements OnInit {
  private readonly svc = inject(AdminPartnersService);
  private readonly authStore = inject(AuthStore);
  private readonly notif = inject(NOTIFICATION_HANDLER);
  private readonly router = inject(Router);

  protected readonly loading = signal(false);
  protected readonly actionLoading = signal(false);
  protected readonly hotels = signal<AdminHotelResponse[]>([]);
  protected readonly searchQuery = signal('');
  protected readonly statusFilter = signal<StatusFilter>('all');

  protected readonly isSuperAdmin = this.authStore.isSuperAdmin;

  protected readonly showConfirm = signal(false);
  protected readonly confirmAction = signal<'activate' | 'suspend' | null>(null);
  protected readonly selectedHotel = signal<AdminHotelResponse | null>(null);

  protected readonly searchFilters: { label: string; options: FilterOption[] }[] = [
    { label: 'Tous les statuts', options: STATUS_FILTER_OPTIONS },
  ];

  protected readonly filteredHotels = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const status = this.statusFilter();
    return this.hotels().filter((h) => {
      const matchesQuery =
        !query ||
        (h.name ?? '').toLowerCase().includes(query) ||
        (h.city ?? '').toLowerCase().includes(query) ||
        (h.email ?? '').toLowerCase().includes(query);
      const matchesStatus =
        status === 'all' ||
        (status === 'active' && h.active) ||
        (status === 'suspended' && !h.active);
      return matchesQuery && matchesStatus;
    });
  });

  protected readonly hotelCount = computed(() => this.hotels().length);

  ngOnInit(): void {
    void this.loadHotels();
  }

  private async loadHotels(): Promise<void> {
    this.loading.set(true);
    try {
      this.hotels.set(await firstValueFrom(this.svc.listHotels()));
    } catch {
      this.notif.error('Impossible de charger la liste des hôtels.');
    } finally {
      this.loading.set(false);
    }
  }

  protected initials(h: AdminHotelResponse): string {
    return (h.name ?? 'HT').slice(0, 2).toUpperCase();
  }

  protected stars(h: AdminHotelResponse): string {
    return h.stars ? '★'.repeat(h.stars) : '—';
  }

  protected onSearchChange(value: string): void {
    this.searchQuery.set(value);
  }

  protected onFilterChange(event: { filter: string; value: unknown }): void {
    this.statusFilter.set((event.value as StatusFilter) ?? 'all');
  }

  protected viewMembers(hotel: AdminHotelResponse): void {
    void this.router.navigate(['/hotels', hotel.id, 'membres']);
  }

  protected promptToggle(hotel: AdminHotelResponse): void {
    this.selectedHotel.set(hotel);
    this.confirmAction.set(hotel.active ? 'suspend' : 'activate');
    this.showConfirm.set(true);
  }

  protected async confirmToggle(): Promise<void> {
    const hotel = this.selectedHotel();
    if (!hotel?.id) return;

    this.actionLoading.set(true);
    try {
      const action = this.confirmAction();
      const updated =
        action === 'activate'
          ? await firstValueFrom(this.svc.activateHotel(hotel.id))
          : await firstValueFrom(this.svc.suspendHotel(hotel.id));

      this.hotels.update((list) =>
        list.map((h) => (h.id === updated.id ? updated : h)),
      );
      this.notif.success(
        action === 'activate' ? 'Hôtel activé.' : 'Hôtel suspendu.',
      );
      this.showConfirm.set(false);
    } catch {
      this.notif.error("L'opération a échoué.");
    } finally {
      this.actionLoading.set(false);
    }
  }

  protected get confirmTitle(): string {
    return this.confirmAction() === 'activate'
      ? "Activer l'hôtel"
      : "Suspendre l'hôtel";
  }

  protected get confirmMessage(): string {
    const name = this.selectedHotel()?.name ?? 'cet hôtel';
    return this.confirmAction() === 'activate'
      ? `Activer ${name} lui permettra d'accéder à nouveau à la plateforme.`
      : `Suspendre ${name} bloquera l'accès à la plateforme pour cet hôtel.`;
  }

  protected get confirmLabel(): string {
    return this.confirmAction() === 'activate' ? 'Activer' : 'Suspendre';
  }

  protected get confirmSeverity(): 'success' | 'warn' {
    return this.confirmAction() === 'activate' ? 'success' : 'warn';
  }
}

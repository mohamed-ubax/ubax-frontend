import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { UbaxPaginatorComponent } from '@ubax-workspace/shared-ui';
import {
  ADMIN_RESERVATION_STATUSES,
  AdminReservation,
  AdminReservationStatus,
  AdminReservationsStore,
} from '@ubax-workspace/ubax-admin-data-access';

const PAGE_SIZE = 20;

type ReservationFilter = AdminReservationStatus | 'ALL';

const STATUS_LABELS: Record<AdminReservationStatus, string> = {
  PENDING: 'A venir',
  CONFIRMED: 'En cours',
  CANCELLED: 'Annulée',
  COMPLETED: 'Terminée',
  NO_SHOW: 'No-show',
};

const STATUS_TONES: Record<AdminReservationStatus, string> = {
  PENDING: 'upcoming',
  CONFIRMED: 'ongoing',
  CANCELLED: 'cancelled',
  COMPLETED: 'completed',
  NO_SHOW: 'noshow',
};

interface KpiCard {
  key: string;
  label: string;
  count: number;
  tone: string;
  icon: string;
}

@Component({
  selector: 'ubax-admin-reservations-list-page',
  standalone: true,
  imports: [UbaxPaginatorComponent],
  templateUrl: './reservations-list-page.component.html',
  styleUrl: './reservations-list-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReservationsListPageComponent implements OnInit {
  protected readonly store = inject(AdminReservationsStore);

  protected readonly searchTerm = signal('');
  protected readonly currentPage = signal(1);
  protected readonly selectedFilter = signal<ReservationFilter>('ALL');

  protected readonly statusTabs = computed(() => {
    const counts = this.store.statusCounts();
    const total = ADMIN_RESERVATION_STATUSES.reduce(
      (sum, status) => sum + counts[status],
      0,
    );

    return [
      { label: 'Toutes', value: 'ALL' as const, count: total },
      {
        label: 'A venir',
        value: 'PENDING' as const,
        count: counts['PENDING'],
      },
      {
        label: 'En cours',
        value: 'CONFIRMED' as const,
        count: counts['CONFIRMED'],
      },
      {
        label: 'Terminées',
        value: 'COMPLETED' as const,
        count: counts['COMPLETED'],
      },
      {
        label: 'Annulées',
        value: 'CANCELLED' as const,
        count: counts['CANCELLED'] + counts['NO_SHOW'],
      },
    ];
  });

  protected readonly kpiCards = computed<KpiCard[]>(() => {
    const counts = this.store.statusCounts();
    const total = ADMIN_RESERVATION_STATUSES.reduce(
      (sum, status) => sum + counts[status],
      0,
    );

    return [
      {
        key: 'total',
        label: 'Toutes',
        count: total,
        tone: 'orange',
        icon: 'pi pi-calendar',
      },
      {
        key: 'pending',
        label: 'A venir',
        count: counts['PENDING'],
        tone: 'blue',
        icon: 'pi pi-calendar',
      },
      {
        key: 'confirmed',
        label: 'En cours',
        count: counts['CONFIRMED'],
        tone: 'purple',
        icon: 'pi pi-building',
      },
      {
        key: 'completed',
        label: 'Terminées',
        count: counts['COMPLETED'],
        tone: 'green',
        icon: 'pi pi-check-circle',
      },
      {
        key: 'cancelled',
        label: 'Annulées',
        count: counts['CANCELLED'] + counts['NO_SHOW'],
        tone: 'red',
        icon: 'pi pi-times-circle',
      },
    ];
  });

  protected readonly filteredReservations = computed(() => {
    const query = this.normalizeText(this.searchTerm());

    return this.store.reservations().filter((reservation) => {
      if (!query) return true;

      const haystack = this.normalizeText(
        [
          reservation.propertyTitle,
          reservation.propertyCity,
          reservation.clientFullName,
          reservation.clientEmail,
          reservation.status,
        ]
          .filter(Boolean)
          .join(' '),
      );

      return haystack.includes(query);
    });
  });

  protected readonly viewState = computed(() => {
    if (this.store.loading() && this.store.reservations().length === 0) {
      return 'loading';
    }

    if (this.store.error() && this.store.reservations().length === 0) {
      return 'error';
    }

    if (!this.store.loading() && this.filteredReservations().length === 0) {
      return 'empty';
    }

    return 'success';
  });

  ngOnInit(): void {
    this.loadReservations();
    this.loadStatusCounts();
  }

  protected selectFilter(filter: ReservationFilter): void {
    this.selectedFilter.set(filter);
    this.currentPage.set(1);
    this.loadReservations();
  }

  protected onPageChange(page: number): void {
    this.currentPage.set(page);
    this.loadReservations();
  }

  protected retry(): void {
    this.loadReservations();
    this.loadStatusCounts();
  }

  protected statusLabel(status: AdminReservationStatus): string {
    return STATUS_LABELS[status];
  }

  protected statusTone(status: AdminReservationStatus): string {
    return STATUS_TONES[status] ?? 'default';
  }

  protected reservationCode(id?: string): string {
    if (!id) return 'RES-0000000';
    const clean = id.replace(/-/g, '').toUpperCase();
    return `RES-${clean.slice(-7).padStart(7, '0')}`;
  }

  protected clientInitials(fullName?: string): string {
    if (!fullName?.trim()) return '?';
    const parts = fullName.trim().split(/\s+/);
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }

  protected currentDateLabel(): string {
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }).format(new Date());
  }

  protected paginationLabel(): string {
    const page = this.currentPage();
    const total = this.store.totalElements();
    if (total === 0) return '';
    const start = (page - 1) * PAGE_SIZE + 1;
    const end = Math.min(page * PAGE_SIZE, total);
    return `Affichage ${start} à ${end} sur ${total} reservations`;
  }

  protected formatDate(value?: string): string {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(date);
  }

  protected formatCurrency(value?: number): string {
    if (typeof value !== 'number') return '—';
    return `${new Intl.NumberFormat('fr-FR', {
      maximumFractionDigits: 0,
    }).format(value)} FCFA`;
  }

  protected formatDateRange(reservation: AdminReservation): string {
    return `${this.formatDate(reservation.checkInDate)} - ${this.formatDate(reservation.checkOutDate)}`;
  }

  private loadReservations(): void {
    this.store
      .load({
        page: this.currentPage() - 1,
        size: PAGE_SIZE,
        status: this.selectedFilterValue(),
      })
      .catch(() => {
        // store exposes the error for the UI
      });
  }

  private loadStatusCounts(): void {
    this.store.loadStatusCounts().catch(() => {
      // store exposes the error for the UI
    });
  }

  private normalizeText(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }

  private selectedFilterValue(): AdminReservationStatus | undefined {
    const filter = this.selectedFilter();
    return filter === 'ALL' ? undefined : filter;
  }
}

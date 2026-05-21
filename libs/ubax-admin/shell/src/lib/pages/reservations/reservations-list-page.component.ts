import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
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
  PENDING: 'En attente',
  CONFIRMED: 'Confirmée',
  CANCELLED: 'Annulée',
  COMPLETED: 'Séjour terminé',
  NO_SHOW: 'No-show',
};

@Component({
  selector: 'ubax-admin-reservations-list-page',
  standalone: true,
  imports: [CommonModule, FormsModule, UbaxPaginatorComponent],
  templateUrl: './reservations-list-page.component.html',
  styleUrl: './reservations-list-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReservationsListPageComponent implements OnInit {
  protected readonly store = inject(AdminReservationsStore);
  private readonly router = inject(Router);

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
      ...ADMIN_RESERVATION_STATUSES.map((status) => ({
        label: STATUS_LABELS[status],
        value: status,
        count: counts[status],
      })),
    ];
  });

  protected readonly filteredReservations = computed(() => {
    const query = this.normalizeText(this.searchTerm());

    return this.store.reservations().filter((reservation) => {
      if (!query) {
        return true;
      }

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

  protected onSearch(value: string): void {
    this.searchTerm.set(value);
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

  protected openReservation(reservation: AdminReservation): void {
    this.router.navigate(['/reservations', reservation.id]);
  }

  protected retry(): void {
    this.loadReservations();
    this.loadStatusCounts();
  }

  protected statusLabel(status: AdminReservationStatus): string {
    return STATUS_LABELS[status];
  }

  protected formatDateRange(reservation: AdminReservation): string {
    return `${this.formatDate(reservation.checkInDate)} - ${this.formatDate(reservation.checkOutDate)}`;
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

  protected formatDateTime(value?: string): string {
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
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  }

  protected formatCurrency(value?: number): string {
    if (typeof value !== 'number') {
      return '—';
    }

    return `${new Intl.NumberFormat('fr-FR', {
      maximumFractionDigits: 0,
    }).format(value)} FCFA`;
  }

  private loadReservations(): void {
    this.store
      .load({
        page: this.currentPage() - 1,
        size: PAGE_SIZE,
        status: this.selectedFilterValue(),
      })
      .catch(() => {
        // Le store expose déjà l'erreur pour l'UI.
      });
  }

  private loadStatusCounts(): void {
    this.store.loadStatusCounts().catch(() => {
      // Le store expose déjà l'erreur pour l'UI.
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

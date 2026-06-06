import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import {
  AdminReservation,
  AdminReservationsStore,
} from '@ubax-workspace/ubax-admin-data-access';

const STATUS_STEP: Record<string, number> = {
  PENDING: 1,
  CONFIRMED: 2,
  NO_SHOW: 2,
  CANCELLED: 1,
  COMPLETED: 4,
};

@Component({
  selector: 'ubax-admin-reservation-detail-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reservation-detail-page.component.html',
  styleUrl: './reservation-detail-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReservationDetailPageComponent {
  protected readonly store = inject(AdminReservationsStore);
  private readonly route = inject(ActivatedRoute);

  private readonly reservationId = toSignal(
    this.route.paramMap.pipe(map((params) => params.get('id'))),
    { initialValue: this.route.snapshot.paramMap.get('id') },
  );

  protected readonly reservation = this.store.selectedReservation;
  protected readonly viewState = computed(() => {
    if (this.store.loading() && !this.reservation()) return 'loading';
    if (this.store.detailStatusCode() === 404) return 'not-found';
    if (this.store.error() && !this.reservation()) return 'error';
    return 'success';
  });

  protected readonly timelineSteps = [
    { key: 'reserved', label: 'Réservé', icon: 'pi pi-check-square' },
    { key: 'upcoming', label: 'A venir', icon: 'pi pi-calendar' },
    { key: 'in-progress', label: 'En cours', icon: 'pi pi-building' },
    { key: 'completed', label: 'Terminé', icon: 'pi pi-check-circle' },
  ] as const;

  constructor() {
    effect(() => {
      const id = this.reservationId();
      if (!id) return;
      void this.loadDetail(id);
    });
  }

  protected statusLabel(status: string): string {
    const map: Record<string, string> = {
      PENDING: 'A venir',
      CONFIRMED: 'En cours',
      COMPLETED: 'Terminé',
      CANCELLED: 'Annulé',
      NO_SHOW: 'No-show',
    };
    return map[status] ?? status;
  }

  protected statusBadgeClass(status: string): Record<string, boolean> {
    return {
      'res-badge--blue': status === 'CONFIRMED',
      'res-badge--green': status === 'COMPLETED',
      'res-badge--red': status === 'CANCELLED' || status === 'NO_SHOW',
      'res-badge--gray': status === 'PENDING',
    };
  }

  protected paymentStatusLabel(status: string): string {
    if (status === 'CONFIRMED' || status === 'COMPLETED')
      return 'Paiement éffectué';
    if (status === 'CANCELLED') return 'Remboursé';
    return '—';
  }

  protected paymentStatusClass(status: string): Record<string, boolean> {
    return {
      'res-value--green': status === 'CONFIRMED' || status === 'COMPLETED',
    };
  }

  protected computeSousTotal(r: AdminReservation): number | undefined {
    if (r.pricePerNight != null && r.numberOfNights != null) {
      return r.pricePerNight * r.numberOfNights;
    }
    return undefined;
  }

  protected computeTaxes(r: AdminReservation): number | undefined {
    const sousTotal = this.computeSousTotal(r);
    if (
      sousTotal != null &&
      r.totalAmount != null &&
      r.totalAmount > sousTotal
    ) {
      return r.totalAmount - sousTotal;
    }
    return undefined;
  }

  protected isStepActive(status: string, stepKey: string): boolean {
    const activeCount = STATUS_STEP[status] ?? 1;
    const index = this.timelineSteps.findIndex((s) => s.key === stepKey) + 1;
    return index <= activeCount;
  }

  protected isLineActive(status: string, stepKey: string): boolean {
    const activeCount = STATUS_STEP[status] ?? 1;
    const index = this.timelineSteps.findIndex((s) => s.key === stepKey) + 1;
    return index < activeCount;
  }

  protected timelineDate(r: AdminReservation, stepKey: string): string {
    switch (stepKey) {
      case 'reserved':
        return this.formatDate(r.createdAt);
      case 'upcoming':
        return this.formatDate(r.checkInDate);
      case 'completed':
        return this.formatDate(r.checkOutDate ?? r.completedAt);
      default:
        return '';
    }
  }

  protected formatDate(value?: string): string {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })
      .format(date)
      .replace(/\b\p{L}/gu, (char) => char.toUpperCase());
  }

  protected formatDateTime(value?: string): string {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    const dayMonthYear = this.formatDate(value);
    const hour = date.getHours().toString().padStart(2, '0');
    return `${dayMonthYear} à ${hour}h`;
  }

  protected formatCurrency(value?: number): string {
    if (typeof value !== 'number') return '—';
    return `${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(value)} FCFA`;
  }

  private async loadDetail(id: string): Promise<void> {
    try {
      await this.store.loadDetail(id);
    } catch {
      // Le store expose déjà l'erreur pour l'UI.
    }
  }
}

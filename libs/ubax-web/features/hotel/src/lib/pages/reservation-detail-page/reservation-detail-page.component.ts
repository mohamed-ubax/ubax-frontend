import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { ConfirmDialogComponent } from '@ubax-workspace/shared-design-system';
import {
  HotelReservation,
  HotelReservationsStore,
} from '@ubax-workspace/ubax-web-data-access';

type ReservationAction = 'confirm' | 'complete' | 'noShow';

@Component({
  selector: 'ubax-hotel-reservation-detail-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, ConfirmDialogComponent],
  templateUrl: './reservation-detail-page.component.html',
  styleUrl: './reservation-detail-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReservationDetailPageComponent {
  protected readonly store = inject(HotelReservationsStore);
  private readonly route = inject(ActivatedRoute);

  private readonly reservationId = toSignal(
    this.route.paramMap.pipe(map((params) => params.get('id'))),
    { initialValue: this.route.snapshot.paramMap.get('id') },
  );

  protected readonly confirmAction = signal<ReservationAction | null>(null);
  protected readonly showConfirmDialog = signal(false);
  protected readonly showCancelDialog = signal(false);
  protected readonly cancelReason = signal('');
  protected readonly pendingRefresh = signal(false);

  protected readonly reservation = computed(
    () => this.store.selectedItem() as HotelReservation | null,
  );

  protected readonly viewState = computed(() => {
    if (this.store.loading() && !this.reservation()) {
      return 'loading';
    }

    if (this.store.detailStatusCode() === 403) {
      return 'unauthorized';
    }

    if (this.store.detailStatusCode() === 404) {
      return 'not-found';
    }

    if (this.store.error() && !this.reservation()) {
      return 'error';
    }

    return 'success';
  });

  protected readonly actionMessage = computed(() => {
    const reservation = this.reservation();

    if (!reservation) {
      return 'Aucune réservation sélectionnée.';
    }

    switch (reservation.status) {
      case 'PENDING':
        return 'Cette réservation attend encore une confirmation de l’hôtel.';
      case 'CONFIRMED':
        return 'Le client est attendu. Vous pouvez terminer le séjour, l’annuler ou le marquer en no-show.';
      case 'CANCELLED':
        return 'Cette réservation a été annulée. Le motif apparaît ci-dessous.';
      case 'COMPLETED':
        return 'Séjour terminé. Merci d’avoir accompagné ce client jusqu’au bout.';
      case 'NO_SHOW':
        return 'Le client ne s’est pas présenté. Cette réservation est désormais clôturée.';
    }
  });

  protected readonly confirmDialogTitle = computed(() => {
    switch (this.confirmAction()) {
      case 'confirm':
        return 'Confirmer la réservation';
      case 'complete':
        return 'Terminer le séjour';
      case 'noShow':
        return 'Déclarer un no-show';
      default:
        return 'Confirmer';
    }
  });

  protected readonly confirmDialogMessage = computed(() => {
    const reservation = this.reservation();

    if (!reservation) {
      return 'Confirmez cette action.';
    }

    const customer = reservation.clientFullName ?? 'ce client';
    const stay = `du ${this.formatDate(reservation.checkInDate)} au ${this.formatDate(reservation.checkOutDate)}`;

    switch (this.confirmAction()) {
      case 'confirm':
        return `Confirmer la réservation de ${customer} ${stay} ?`;
      case 'complete':
        return `Marquer le séjour de ${customer} ${stay} comme terminé ?`;
      case 'noShow':
        return `Marquer ${customer} comme absent ? Cette action est irréversible.`;
      default:
        return 'Confirmez cette action.';
    }
  });

  constructor() {
    effect(() => {
      const id = this.reservationId();

      if (!id) {
        return;
      }

      this.store.loadDetail(id);
    });

    effect(() => {
      const id = this.reservationId();

      if (!id || !this.pendingRefresh() || this.store.saving()) {
        return;
      }

      this.pendingRefresh.set(false);

      if (this.store.actionError()) {
        return;
      }

      this.store.loadDetail(id);
      this.store.loadStatusCounts();
    });
  }

  protected openConfirmAction(action: ReservationAction): void {
    this.confirmAction.set(action);
    this.showConfirmDialog.set(true);
  }

  protected submitConfirmAction(): void {
    const reservation = this.reservation();

    if (!reservation || !this.confirmAction()) {
      return;
    }

    this.showConfirmDialog.set(false);
    this.pendingRefresh.set(true);

    switch (this.confirmAction()) {
      case 'confirm':
        this.store.confirmReservation(reservation.id);
        break;
      case 'complete':
        this.store.completeReservation(reservation.id);
        break;
      case 'noShow':
        this.store.markNoShow(reservation.id);
        break;
    }
  }

  protected openCancelDialog(): void {
    this.cancelReason.set(this.reservation()?.cancellationReason ?? '');
    this.showCancelDialog.set(true);
  }

  protected submitCancel(): void {
    const reservation = this.reservation();
    const reason = this.cancelReason().trim();

    if (!reservation || !reason) {
      return;
    }

    this.showCancelDialog.set(false);
    this.pendingRefresh.set(true);
    this.store.cancelReservation({ id: reservation.id, reason });
  }

  protected canConfirm(): boolean {
    return this.reservation()?.status === 'PENDING';
  }

  protected canCancel(): boolean {
    const status = this.reservation()?.status;
    return status === 'PENDING' || status === 'CONFIRMED';
  }

  protected canComplete(): boolean {
    return this.reservation()?.status === 'CONFIRMED';
  }

  protected canMarkNoShow(): boolean {
    return this.reservation()?.status === 'CONFIRMED';
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
      month: 'long',
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
}

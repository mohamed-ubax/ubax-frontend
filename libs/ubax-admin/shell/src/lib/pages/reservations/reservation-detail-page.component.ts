import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { AdminReservationsStore } from '@ubax-workspace/ubax-admin-data-access';

@Component({
  selector: 'ubax-admin-reservation-detail-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
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
    if (this.store.loading() && !this.reservation()) {
      return 'loading';
    }

    if (this.store.detailStatusCode() === 404) {
      return 'not-found';
    }

    if (this.store.error() && !this.reservation()) {
      return 'error';
    }

    return 'success';
  });

  constructor() {
    effect(() => {
      const id = this.reservationId();

      if (!id) {
        return;
      }

      void this.loadDetail(id);
    });
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

  private async loadDetail(id: string): Promise<void> {
    try {
      await this.store.loadDetail(id);
    } catch {
      // Le store expose déjà l'erreur pour l'UI.
    }
  }
}

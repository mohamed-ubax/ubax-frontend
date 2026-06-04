import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { AdminHotelsStore } from '@ubax-workspace/ubax-admin-data-access';
import { NOTIFICATION_HANDLER } from '@ubax-workspace/shared-data-access';
import { StatusBadgeComponent } from '@ubax-workspace/shared-design-system';

@Component({
  selector: 'ubax-admin-hotel-detail-page',
  standalone: true,
  imports: [StatusBadgeComponent],
  template: `
    <section class="hotel-detail">
      <header class="hotel-detail__header">
        <button type="button" class="hotel-detail__back" (click)="goBack()">
          <i class="pi pi-arrow-left"></i>
          Retour à la liste
        </button>

        <h1 class="hotel-detail__title">Détail de l'hôtel</h1>
      </header>

      @if (selectedHotel(); as hotel) {
        <article class="hotel-detail__card">
          <div class="hotel-detail__identity">
            @if (hotel.logoUrl) {
              <img
                [src]="hotel.logoUrl"
                [alt]="hotel.name"
                class="hotel-detail__logo"
              />
            } @else {
              <div class="hotel-detail__logo hotel-detail__logo--fallback">
                {{ initials(hotel.name ?? 'HT') }}
              </div>
            }

            <div>
              <h2 class="hotel-detail__name">{{ hotel.name ?? '—' }}</h2>
              <p class="hotel-detail__meta">{{ hotel.city ?? '—' }}</p>
            </div>
          </div>

          <div class="hotel-detail__grid">
            <div class="hotel-detail__field">
              <span class="hotel-detail__label">Email</span>
              <span class="hotel-detail__value">{{ hotel.email ?? '—' }}</span>
            </div>
            <div class="hotel-detail__field">
              <span class="hotel-detail__label">Téléphone</span>
              <span class="hotel-detail__value">{{ hotel.phone ?? '—' }}</span>
            </div>
            <div class="hotel-detail__field">
              <span class="hotel-detail__label">Chambres</span>
              <span class="hotel-detail__value">{{
                hotel.totalRooms ?? '—'
              }}</span>
            </div>
            <div class="hotel-detail__field">
              <span class="hotel-detail__label">Catégorie</span>
              <span class="hotel-detail__value">{{
                stars(hotel.stars ?? 0)
              }}</span>
            </div>
            <div class="hotel-detail__field hotel-detail__field--status">
              <span class="hotel-detail__label">Statut</span>
              <ubax-status-badge
                [variant]="hotel.active ? 'active' : 'suspended'"
              >
                {{ hotel.active ? 'Actif' : 'Suspendu' }}
              </ubax-status-badge>
            </div>
          </div>
        </article>
      } @else {
        <div class="hotel-detail__empty">
          Aucun hôtel trouvé pour cet identifiant.
        </div>
      }
    </section>
  `,
  styles: `
    :host {
      display: block;
    }

    .hotel-detail {
      display: grid;
      gap: 1rem;
      padding: 1.35rem;
    }

    .hotel-detail__header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
    }

    .hotel-detail__back {
      border: 1px solid #dce5ee;
      background: #fff;
      color: #1a3047;
      border-radius: 10px;
      padding: 0.55rem 0.9rem;
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      cursor: pointer;
      font-family: 'Lexend', sans-serif;
      font-size: 0.84rem;
    }

    .hotel-detail__title {
      margin: 0;
      color: #1a3047;
      font-family: 'Lexend', sans-serif;
      font-size: 1.45rem;
      font-weight: 600;
    }

    .hotel-detail__card {
      border: 1px solid #e5ebf2;
      border-radius: 14px;
      background: #fff;
      padding: 1.1rem;
      display: grid;
      gap: 1rem;
    }

    .hotel-detail__identity {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .hotel-detail__logo {
      width: 52px;
      height: 52px;
      border-radius: 8px;
      object-fit: cover;
    }

    .hotel-detail__logo--fallback {
      background: #dfe8f2;
      color: #1a3047;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-family: 'Lexend', sans-serif;
    }

    .hotel-detail__name {
      margin: 0;
      font-family: 'Lexend', sans-serif;
      color: #1f2937;
      font-size: 1rem;
    }

    .hotel-detail__meta {
      margin: 0.2rem 0 0;
      color: #6b7280;
      font-size: 0.83rem;
      font-family: 'Lexend', sans-serif;
    }

    .hotel-detail__grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 0.8rem 1rem;
    }

    .hotel-detail__field {
      display: grid;
      gap: 0.25rem;
    }

    .hotel-detail__label {
      color: #64748b;
      font-size: 0.78rem;
      font-family: 'Lexend', sans-serif;
    }

    .hotel-detail__value {
      color: #111827;
      font-size: 0.9rem;
      font-family: 'Lexend', sans-serif;
      font-weight: 500;
    }

    .hotel-detail__field--status :deep(span) {
      border-radius: 999px;
      padding: 0.3rem 0.75rem;
      width: fit-content;
      font-size: 0.76rem;
    }

    .hotel-detail__empty {
      border: 1px dashed #cbd5e1;
      border-radius: 12px;
      padding: 1rem;
      color: #475569;
      font-family: 'Lexend', sans-serif;
      font-size: 0.88rem;
      background: #f8fafc;
    }

    @media (max-width: 46rem) {
      .hotel-detail__grid {
        grid-template-columns: 1fr;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HotelDetailPageComponent implements OnInit {
  private readonly store = inject(AdminHotelsStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly notif = inject(NOTIFICATION_HANDLER);

  private readonly params = toSignal(this.route.paramMap, {
    initialValue: this.route.snapshot.paramMap,
  });

  protected readonly hotelId = computed(() => this.params().get('hotelId'));

  protected readonly selectedHotel = computed(() => {
    const id = this.hotelId();
    if (!id) {
      return null;
    }

    return this.store.hotels().find((hotel) => hotel.id === id) ?? null;
  });

  ngOnInit(): void {
    if (this.selectedHotel()) {
      return;
    }

    this.store.load().catch(() => {
      this.notif.error("Impossible de charger les détails de l'hôtel.");
    });
  }

  protected goBack(): void {
    void this.router.navigate(['/hotels']);
  }

  protected initials(label: string): string {
    return label.slice(0, 2).toUpperCase();
  }

  protected stars(value: number): string {
    return value > 0 ? '★'.repeat(value) : '—';
  }
}

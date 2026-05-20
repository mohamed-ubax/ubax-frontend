import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
} from '@angular/core';
import { AdminDashboardStore } from '@ubax-workspace/ubax-admin-data-access';
import {
  EmptyStateComponent,
  KpiCardComponent,
  SectionCardComponent,
  StatusBadgeComponent,
} from '@ubax-workspace/shared-design-system';
import { NOTIFICATION_HANDLER } from '@ubax-workspace/shared-data-access';

interface DashboardAlert {
  description: string;
  label: string;
  value: number;
  variant: 'danger' | 'warning' | 'success' | 'info';
}

@Component({
  selector: 'ubax-admin-dashboard',
  standalone: true,
  imports: [
    KpiCardComponent,
    SectionCardComponent,
    StatusBadgeComponent,
    EmptyStateComponent,
  ],
  template: `
    <div class="dashboard-page">
      <div class="dashboard-page__header">
        <div>
          <p class="dashboard-page__eyebrow">Back-office UBAX</p>
          <h1 class="dashboard-page__title">Tableau de bord global</h1>
          <p class="dashboard-page__subtitle">
            Supervisez l'activité de la plateforme, les partenaires actifs et
            les opérations qui demandent une intervention.
          </p>
        </div>

        <div class="dashboard-page__spotlight">
          <span class="dashboard-page__spotlight-label"
            >Empreinte partenaire</span
          >
          <strong class="dashboard-page__spotlight-value">{{
            partnerFootprint()
          }}</strong>
          <span class="dashboard-page__spotlight-meta"
            >agences et hôtels actifs</span
          >
        </div>
      </div>

      @if (dashboard(); as dashboardData) {
        <div class="dashboard-kpi-grid">
          @for (card of cards(); track card.label) {
            <ubax-kpi-card [label]="card.label" [value]="card.value">
              <i icon [class]="card.iconClass"></i>
            </ubax-kpi-card>
          }
        </div>

        <div class="dashboard-panels">
          <ubax-section-card title="Priorités du jour">
            <div class="dashboard-alerts">
              @for (alert of alerts(); track alert.label) {
                <article class="dashboard-alert">
                  <div class="dashboard-alert__head">
                    <h3 class="dashboard-alert__title">{{ alert.label }}</h3>
                    <ubax-status-badge [variant]="alert.variant">{{
                      alert.value
                    }}</ubax-status-badge>
                  </div>
                  <p class="dashboard-alert__description">
                    {{ alert.description }}
                  </p>
                </article>
              }
            </div>
          </ubax-section-card>

          <ubax-section-card title="Santé de la plateforme">
            <div class="dashboard-health-list">
              <div class="dashboard-health-item">
                <div class="dashboard-health-item__head">
                  <span>Taux de confirmation des réservations</span>
                  <strong>{{ reservationCompletion() }}%</strong>
                </div>
                <div class="dashboard-progress">
                  <div
                    class="dashboard-progress__fill dashboard-progress__fill--blue"
                    [style.width.%]="reservationCompletion()"
                  ></div>
                </div>
              </div>

              <div class="dashboard-health-item">
                <div class="dashboard-health-item__head">
                  <span>Couverture de publication</span>
                  <strong>{{ publicationCoverage() }}%</strong>
                </div>
                <div class="dashboard-progress">
                  <div
                    class="dashboard-progress__fill dashboard-progress__fill--orange"
                    [style.width.%]="publicationCoverage()"
                  ></div>
                </div>
              </div>

              <div class="dashboard-health-item">
                <div class="dashboard-health-item__head">
                  <span>Volume partenaires actifs</span>
                  <strong>{{ partnerFootprint() }}</strong>
                </div>
                <p class="dashboard-health-item__meta">
                  {{ dashboardData.totalActiveAgencies ?? 0 }} agences ·
                  {{ dashboardData.totalActiveHotels ?? 0 }} hôtels
                </p>
              </div>
            </div>
          </ubax-section-card>
        </div>
      } @else if (!loading()) {
        <ubax-section-card>
          <ubax-empty-state
            icon="pi pi-chart-bar"
            title="Aucune donnée disponible"
            description="Le tableau de bord n'a retourné aucune métrique exploitable pour le moment."
          />
        </ubax-section-card>
      }
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .dashboard-page {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
        min-height: 100%;
        padding: 2rem;
        background:
          radial-gradient(
            circle at top right,
            rgba(255, 255, 255, 0.78),
            transparent 30%
          ),
          linear-gradient(
            180deg,
            rgba(236, 242, 247, 0.92),
            rgba(236, 242, 247, 1)
          );
      }

      .dashboard-page__header {
        display: flex;
        align-items: stretch;
        justify-content: space-between;
        gap: 1.5rem;
        flex-wrap: wrap;
      }

      .dashboard-page__eyebrow {
        margin: 0 0 0.35rem;
        color: #6b7280;
        font-size: 0.8125rem;
        font-weight: 500;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }

      .dashboard-page__title {
        margin: 0;
        color: #1c1c1c;
        font-size: 2rem;
        font-weight: 700;
      }

      .dashboard-page__subtitle {
        max-width: 48rem;
        margin: 0.65rem 0 0;
        color: #6b7280;
        font-size: 0.95rem;
        line-height: 1.6;
      }

      .dashboard-page__spotlight {
        display: grid;
        gap: 0.25rem;
        min-width: 15rem;
        padding: 1.2rem 1.35rem;
        border: 1px solid rgba(26, 48, 71, 0.08);
        border-radius: 1rem;
        background: linear-gradient(
          135deg,
          rgba(26, 48, 71, 0.98),
          rgba(43, 127, 255, 0.9)
        );
        color: #fff;
        box-shadow: 0 18px 34px rgba(26, 48, 71, 0.14);
      }

      .dashboard-page__spotlight-label {
        font-size: 0.75rem;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        opacity: 0.82;
      }

      .dashboard-page__spotlight-value {
        font-size: 2.2rem;
        line-height: 1;
      }

      .dashboard-page__spotlight-meta {
        font-size: 0.875rem;
        opacity: 0.88;
      }

      .dashboard-kpi-grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 1rem;
      }

      .dashboard-panels {
        display: grid;
        grid-template-columns: minmax(0, 1.15fr) minmax(0, 0.85fr);
        gap: 1rem;
      }

      .dashboard-alerts {
        display: grid;
        gap: 0.9rem;
      }

      .dashboard-alert {
        padding: 1rem 1.1rem;
        border-radius: 1rem;
        background: #f8fbff;
        border: 1px solid rgba(26, 48, 71, 0.08);
      }

      .dashboard-alert__head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
      }

      .dashboard-alert__title {
        margin: 0;
        color: #1c1c1c;
        font-size: 1rem;
        font-weight: 600;
      }

      .dashboard-alert__description {
        margin: 0.6rem 0 0;
        color: #6b7280;
        font-size: 0.9rem;
        line-height: 1.5;
      }

      .dashboard-health-list {
        display: grid;
        gap: 1rem;
      }

      .dashboard-health-item {
        display: grid;
        gap: 0.55rem;
      }

      .dashboard-health-item__head {
        display: flex;
        justify-content: space-between;
        gap: 1rem;
        color: #1c1c1c;
        font-size: 0.95rem;
        font-weight: 600;
      }

      .dashboard-health-item__meta {
        margin: 0;
        color: #6b7280;
        font-size: 0.85rem;
      }

      .dashboard-progress {
        overflow: hidden;
        height: 0.8rem;
        border-radius: 999px;
        background: #e1e4ed;
      }

      .dashboard-progress__fill {
        height: 100%;
        border-radius: inherit;
      }

      .dashboard-progress__fill--blue {
        background: linear-gradient(90deg, #2b7fff, #65a8ff);
      }

      .dashboard-progress__fill--orange {
        background: linear-gradient(90deg, #e87d1e, #f7b05b);
      }

      @media (max-width: 72rem) {
        .dashboard-kpi-grid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        .dashboard-panels {
          grid-template-columns: 1fr;
        }
      }

      @media (max-width: 50rem) {
        .dashboard-page {
          padding: 1.25rem;
        }

        .dashboard-kpi-grid {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent implements OnInit {
  private readonly store = inject(AdminDashboardStore);
  private readonly notif = inject(NOTIFICATION_HANDLER);

  protected readonly loading = this.store.loading;
  protected readonly dashboard = this.store.dashboard;

  protected readonly cards = computed(() => {
    const data = this.dashboard();
    if (!data) {
      return [] as Array<{
        iconClass: string;
        label: string;
        value: number;
      }>;
    }

    return [
      {
        iconClass: 'pi pi-home text-xl text-brand-blue',
        label: 'Agences actives',
        value: data.totalActiveAgencies ?? 0,
      },
      {
        iconClass: 'pi pi-building text-xl text-brand-teal',
        label: 'Hôtels actifs',
        value: data.totalActiveHotels ?? 0,
      },
      {
        iconClass: 'pi pi-users text-xl text-brand-orange',
        label: 'Clients inscrits',
        value: data.totalClients ?? 0,
      },
      {
        iconClass: 'pi pi-key text-xl text-danger',
        label: 'Bailleurs',
        value: data.totalOwners ?? 0,
      },
      {
        iconClass: 'pi pi-clock text-xl text-warning',
        label: 'Réservations en attente',
        value: data.pendingReservations ?? 0,
      },
      {
        iconClass: 'pi pi-check-circle text-xl text-success',
        label: 'Réservations confirmées',
        value: data.confirmedReservations ?? 0,
      },
      {
        iconClass: 'pi pi-eye text-xl text-warning',
        label: 'Biens à modérer',
        value: data.propertiesPendingReview ?? 0,
      },
      {
        iconClass: 'pi pi-map text-xl text-brand-blue',
        label: 'Biens publiés',
        value: data.publishedProperties ?? 0,
      },
      {
        iconClass: 'pi pi-wrench text-xl text-danger',
        label: 'Tickets ouverts',
        value: data.openTickets ?? 0,
      },
    ];
  });

  protected readonly alerts = computed<DashboardAlert[]>(() => {
    const data = this.dashboard();
    if (!data) {
      return [];
    }

    const items: DashboardAlert[] = [];
    if ((data.propertiesPendingReview ?? 0) > 0) {
      items.push({
        description: 'Des biens attendent une modération avant publication.',
        label: 'Modération',
        value: data.propertiesPendingReview ?? 0,
        variant: 'warning',
      });
    }

    if ((data.openTickets ?? 0) > 0) {
      items.push({
        description: 'Des tickets SAV nécessitent une prise en charge rapide.',
        label: 'Support',
        value: data.openTickets ?? 0,
        variant: 'danger',
      });
    }

    if ((data.pendingReservations ?? 0) > 0) {
      items.push({
        description:
          'Des réservations attendent encore une confirmation partenaire.',
        label: 'Réservations',
        value: data.pendingReservations ?? 0,
        variant: 'info',
      });
    }

    if (items.length === 0) {
      items.push({
        description:
          "Aucune alerte critique détectée sur la plateforme aujourd'hui.",
        label: 'Plateforme',
        value: 0,
        variant: 'success',
      });
    }

    return items;
  });

  protected readonly reservationCompletion = computed(() => {
    const data = this.dashboard();
    if (!data) {
      return 0;
    }

    const total =
      (data.pendingReservations ?? 0) + (data.confirmedReservations ?? 0);
    if (total === 0) {
      return 0;
    }

    return Math.round(((data.confirmedReservations ?? 0) / total) * 100);
  });

  protected readonly publicationCoverage = computed(() => {
    const data = this.dashboard();
    if (!data) {
      return 0;
    }

    const total =
      (data.publishedProperties ?? 0) + (data.propertiesPendingReview ?? 0);
    if (total === 0) {
      return 0;
    }

    return Math.round(((data.publishedProperties ?? 0) / total) * 100);
  });

  protected readonly partnerFootprint = computed(() => {
    const data = this.dashboard();
    if (!data) {
      return 0;
    }

    return (data.totalActiveAgencies ?? 0) + (data.totalActiveHotels ?? 0);
  });

  ngOnInit(): void {
    void this.loadDashboard();
  }

  private async loadDashboard(): Promise<void> {
    try {
      await this.store.load();
    } catch {
      this.notif.error(
        this.store.error() ??
          'Impossible de charger le tableau de bord administrateur.',
      );
    }
  }
}

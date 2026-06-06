import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * UbaxKpiCard — Metric card matching the Figma dashboard KPI cards
 *
 * Usage:
 * ```html
 * <ubax-kpi-card
 *   label="Hôtels actifs"
 *   [value]="152"
 *   trend="+12 ce mois ci"
 *   trendPositive
 * >
 *   <ng-template #icon>
 *     <i class="pi pi-building text-brand-blue text-xl"></i>
 *   </ng-template>
 * </ubax-kpi-card>
 * ```
 */
@Component({
  selector: 'ubax-kpi-card',
  standalone: true,
  imports: [CommonModule],
  styles: `
    :host {
      display: block;
    }

    .ubax-kpi-card__surface {
      min-height: 98px;
      padding: 0.68rem 0.72rem;
      gap: 0.58rem;
    }

    .ubax-kpi-card__icon {
      width: 40px;
      height: 40px;
    }

    .ubax-kpi-card__content {
      flex: 1 1 auto;
      min-width: 0;
      gap: 8px;
    }

    .ubax-kpi-card__label {
      white-space: normal;
      overflow: visible;
      text-overflow: clip;
      line-height: 1.15;
      font-size: 0.72rem;
    }

    .ubax-kpi-card__value {
      font-size: 1.65rem;
      line-height: 1.03;
    }

    .ubax-kpi-card__trend {
      font-size: 0.64rem;
      line-height: 1.15;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .ubax-kpi-card__graph {
      margin-left: 0.12rem;
      flex-shrink: 0;
    }

    :host(.dashboard-kpi--revenue) .ubax-kpi-card__surface {
      border-color: #00a565;
      background: #009b5f;
    }

    :host(.dashboard-kpi--revenue) .ubax-kpi-card__label,
    :host(.dashboard-kpi--revenue) .ubax-kpi-card__value,
    :host(.dashboard-kpi--revenue) .ubax-kpi-card__trend {
      color: #ffffff;
    }
  `,
  template: `
    <div
      class="ubax-kpi-card__surface bg-surface-card rounded-xl border border-neutral-300 shadow-card
            flex items-center gap-4 p-6 min-w-0"
      data-ubax-motion="surface"
    >
      <!-- Icon circle -->
      <div
        class="ubax-kpi-card__icon flex-shrink-0 flex items-center justify-center
         rounded-full size-16 bg-neutral-200"
      >
        <ng-content select="[icon]" />
      </div>

      <!-- Content -->
      <div class="ubax-kpi-card__content flex flex-col gap-1 min-w-0">
        <p class="ubax-kpi-card__label text-md font-medium text-neutral-900">
          {{ label() }}
        </p>
        <p
          class="ubax-kpi-card__value text-5xl font-semibold text-neutral-900 leading-tight"
        >
          {{ value() }}
        </p>
        @if (trend()) {
          <p
            class="ubax-kpi-card__trend text-sm font-regular"
            [class.text-success]="trendPositive()"
            [class.text-danger]="!trendPositive()"
          >
            {{ trend() }}
          </p>
        }
      </div>

      <!-- Optional sparkline / graph slot -->
      @if (hasGraph) {
        <div class="ubax-kpi-card__graph">
          <ng-content select="[graph]" />
        </div>
      }
    </div>
  `,
})
export class KpiCardComponent {
  readonly label = input.required<string>();
  readonly value = input.required<string | number>();
  readonly trend = input<string>();
  readonly trendPositive = input<boolean>(true);

  /** @internal — true when a [graph] slot is projected */
  get hasGraph(): boolean {
    return true;
  }
}

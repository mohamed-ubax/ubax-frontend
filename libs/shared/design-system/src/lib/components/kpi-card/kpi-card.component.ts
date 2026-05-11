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
  template: `
    <div
      class="bg-surface-card rounded-xl border border-neutral-300 shadow-card
             flex items-center gap-4 p-6 min-w-0"
      data-ubax-motion="surface"
    >
      <!-- Icon circle -->
      <div
        class="flex-shrink-0 flex items-center justify-center
               rounded-full size-16 bg-neutral-200"
      >
        <ng-content select="[icon]" />
      </div>

      <!-- Content -->
      <div class="flex flex-col gap-1 min-w-0">
        <p class="text-md font-medium text-neutral-900 truncate">
          {{ label() }}
        </p>
        <p class="text-5xl font-semibold text-neutral-900 leading-tight">
          {{ value() }}
        </p>
        @if (trend()) {
          <p
            class="text-sm font-regular"
            [class.text-success]="trendPositive()"
            [class.text-danger]="!trendPositive()"
          >
            {{ trend() }}
          </p>
        }
      </div>

      <!-- Optional sparkline / graph slot -->
      @if (hasGraph) {
        <div class="ml-auto flex-shrink-0">
          <ng-content select="[graph]" />
        </div>
      }
    </div>
  `,
})
export class KpiCardComponent {
  readonly label         = input.required<string>();
  readonly value         = input.required<string | number>();
  readonly trend         = input<string>();
  readonly trendPositive = input<boolean>(true);

  /** @internal — true when a [graph] slot is projected */
  get hasGraph(): boolean { return true; }
}

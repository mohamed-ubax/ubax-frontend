import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * UbaxPageHeader — Top header bar matching the Figma header
 *
 * Usage:
 * ```html
 * <ubax-page-header title="Tableau de bord">
 *   <ng-template #actions>
 *     <p-button label="Exporter" icon="pi pi-download" severity="secondary" />
 *   </ng-template>
 * </ubax-page-header>
 * ```
 */
@Component({
  selector: 'ubax-page-header',
  standalone: true,
  imports: [CommonModule],
  template: `
    <header
      class="bg-surface-header h-header flex items-center justify-between
             px-8 border-b border-neutral-300 sticky top-0 z-header"
    >
      <!-- Title -->
      <h1 class="text-5xl font-semibold text-neutral-900 leading-normal">
        {{ title() }}
      </h1>

      <!-- Actions slot -->
      <div class="flex items-center gap-3">
        <ng-content select="[actions]" />

        <!-- Date range picker slot -->
        <ng-content select="[dateRange]" />

        <!-- User info -->
        <ng-content select="[user]" />
      </div>
    </header>
  `,
})
export class PageHeaderComponent {
  readonly title = input.required<string>();
}

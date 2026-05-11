import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * UbaxSectionCard — White card container matching Figma panels
 *
 * Usage:
 * ```html
 * <ubax-section-card title="Réservations récentes">
 *   <ng-template #headerActions>
 *     <p-button label="Voir toutes" severity="secondary" size="small" />
 *   </ng-template>
 *   <!-- content -->
 * </ubax-section-card>
 * ```
 */
@Component({
  selector: 'ubax-section-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="bg-surface-card rounded-xl shadow-card overflow-hidden"
      data-ubax-motion="surface"
    >
      <!-- Card header -->
      @if (title()) {
        <div
          class="flex items-center justify-between px-6 py-4
                 border-b border-neutral-300"
        >
          <h2 class="text-2xl font-semibold text-brand-navy leading-tight">
            {{ title() }}
          </h2>
          <div class="flex items-center gap-3">
            <ng-content select="[headerActions]" />
          </div>
        </div>
      }

      <!-- Card body -->
      <div [class]="bodyClass()">
        <ng-content />
      </div>

      <!-- Card footer -->
      <ng-content select="[footer]" />
    </div>
  `,
})
export class SectionCardComponent {
  readonly title     = input<string>();
  readonly bodyClass = input<string>('p-6');
}

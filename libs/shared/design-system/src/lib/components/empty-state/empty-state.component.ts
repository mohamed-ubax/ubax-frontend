import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * UbaxEmptyState — Empty state placeholder
 *
 * Usage:
 * ```html
 * <ubax-empty-state
 *   icon="pi pi-inbox"
 *   title="Aucun hôtel trouvé"
 *   description="Aucun hôtel ne correspond à vos critères de recherche."
 * >
 *   <p-button label="Ajouter un hôtel" icon="pi pi-plus" />
 * </ubax-empty-state>
 * ```
 */
@Component({
  selector: 'ubax-empty-state',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="flex flex-col items-center justify-center gap-4
             py-16 px-8 text-center"
    >
      @if (icon()) {
        <div
          class="flex items-center justify-center size-16
                 rounded-full bg-neutral-100"
        >
          <i [class]="icon() + ' text-3xl text-neutral-500'"></i>
        </div>
      }

      @if (title()) {
        <h3 class="text-2xl font-semibold text-neutral-900">
          {{ title() }}
        </h3>
      }

      @if (description()) {
        <p class="text-md font-regular text-neutral-500 max-w-sm">
          {{ description() }}
        </p>
      }

      <ng-content />
    </div>
  `,
})
export class EmptyStateComponent {
  readonly icon        = input<string>();
  readonly title       = input<string>();
  readonly description = input<string>();
}

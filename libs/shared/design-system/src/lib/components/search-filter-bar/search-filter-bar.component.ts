import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { ButtonModule } from 'primeng/button';

export interface FilterOption {
  label: string;
  value: string | number | null;
}

/**
 * UbaxSearchFilterBar — Search + filter bar matching Figma table headers
 *
 * Usage:
 * ```html
 * <ubax-search-filter-bar
 *   placeholder="Rechercher par titre, référence..."
 *   [(searchValue)]="search"
 *   [filters]="[
 *     { label: 'Tous les types', options: typeOptions },
 *     { label: 'Toutes les villes', options: cityOptions }
 *   ]"
 *   (searchChange)="onSearch($event)"
 * >
 *   <ng-template #actions>
 *     <p-button label="Ajouter" icon="pi pi-plus" />
 *   </ng-template>
 * </ubax-search-filter-bar>
 * ```
 */
@Component({
  selector: 'ubax-search-filter-bar',
  standalone: true,
  imports: [CommonModule, FormsModule, InputTextModule, SelectModule, ButtonModule],
  template: `
    <div
      class="flex flex-wrap items-center gap-3 px-6 py-4
             border-b border-neutral-300"
    >
      <!-- Search input -->
      <div class="relative flex-1 min-w-48">
        <i
          class="pi pi-search absolute left-3 top-1/2 -translate-y-1/2
                 text-neutral-500 text-base pointer-events-none"
        ></i>
        <input
          pInputText
          type="text"
          [placeholder]="placeholder()"
          [(ngModel)]="searchValue"
          (ngModelChange)="searchChange.emit($event)"
          class="w-full pl-9 pr-4 py-2.5 text-md rounded-md
                 border border-neutral-300 bg-surface-card
                 placeholder:text-neutral-500
                 focus:border-brand-blue focus:ring-1 focus:ring-brand-blue
                 transition-colors duration-fast"
        />
      </div>

      <!-- Dynamic filter dropdowns -->
      @for (filter of filters(); track filter.label) {
        <p-select
          [options]="filter.options"
          [(ngModel)]="filterValues[filter.label]"
          [placeholder]="filter.label"
          optionLabel="label"
          optionValue="value"
          (onChange)="filterChange.emit({ filter: filter.label, value: $event.value })"
          styleClass="ubax-select min-w-36"
        />
      }

      <!-- Actions slot (buttons) -->
      <div class="ml-auto flex items-center gap-3">
        <ng-content select="[actions]" />
      </div>
    </div>
  `,
})
export class SearchFilterBarComponent {
  readonly placeholder  = input<string>('Rechercher...');
  readonly filters      = input<{ label: string; options: FilterOption[] }[]>([]);

  searchValue = '';
  filterValues: Record<string, unknown> = {};

  readonly searchChange = output<string>();
  readonly filterChange = output<{ filter: string; value: unknown }>();
}

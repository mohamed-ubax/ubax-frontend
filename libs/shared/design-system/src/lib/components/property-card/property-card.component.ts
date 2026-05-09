import { CommonModule } from '@angular/common';
import { Component, computed, input, output } from '@angular/core';

export interface PropertyCardData {
  id: string | number;
  title: string;
  city: string;
  type: 'location' | 'vente';
  status: 'disponible' | 'loue' | 'vendu' | 'indisponible';
  price: string;
  agencyName: string;
  agencyLogo?: string;
  bedrooms?: number;
  bathrooms?: number;
  surface?: number;
  coverImage?: string;
}

const TYPE_LABELS: Record<PropertyCardData['type'], string> = {
  location: 'Location',
  vente: 'Vente',
};

const STATUS_CLASSES: Record<PropertyCardData['status'], string> = {
  disponible: 'bg-success-bg text-success',
  loue: 'bg-info-bg text-info',
  vendu: 'bg-warning-bg text-warning',
  indisponible: 'bg-neutral-100 text-neutral-500',
};

const STATUS_LABELS: Record<PropertyCardData['status'], string> = {
  disponible: 'Disponible',
  loue: 'Loué',
  vendu: 'Vendu',
  indisponible: 'Indisponible',
};

@Component({
  selector: 'ubax-property-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <article
      class="flex w-full max-w-[334px] flex-col overflow-hidden rounded-xl bg-surface-card shadow-card"
      data-ubax-motion="surface"
    >
      <div class="relative h-[206px] bg-neutral-100">
        @if (property().coverImage) {
          <img
            [src]="property().coverImage"
            [alt]="property().title"
            class="h-full w-full object-cover"
          />
        } @else {
          <div class="flex h-full items-center justify-center text-neutral-400">
            <i class="pi pi-image text-5xl"></i>
          </div>
        }

        <div
          class="absolute left-3 top-3 rounded-sm bg-surface-card px-2 py-1 text-sm font-medium text-neutral-900 shadow-card"
        >
          {{ typeLabel() }}
        </div>

        <div
          class="absolute right-3 top-3 rounded-xs px-2 py-1 text-sm font-medium"
          [ngClass]="statusClasses()"
        >
          {{ statusLabel() }}
        </div>
      </div>

      <div class="flex flex-1 flex-col gap-3 p-6">
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <h3 class="truncate text-2xl font-semibold text-neutral-900">
              {{ property().title }}
            </h3>
            <p class="text-md text-neutral-500">{{ property().city }}</p>
          </div>
          <p class="text-md font-medium text-neutral-900 whitespace-nowrap">
            {{ property().price }}
          </p>
        </div>

        <div class="flex items-center gap-2 text-md text-neutral-500">
          @if (property().agencyLogo) {
            <img
              [src]="property().agencyLogo"
              [alt]="property().agencyName"
              class="size-[26px] rounded-full object-cover"
            />
          } @else {
            <span
              class="flex size-[26px] items-center justify-center rounded-full bg-neutral-100 text-sm font-medium text-neutral-500"
            >
              {{ agencyInitials() }}
            </span>
          }
          <span class="truncate">{{ property().agencyName }}</span>
        </div>

        <div
          class="mt-auto flex items-center justify-between border-t border-neutral-300 pt-4 text-md text-neutral-500"
        >
          <div class="flex items-center gap-4">
            @if (property().bedrooms !== undefined) {
              <span class="flex items-center gap-1"
                ><i class="pi pi-bed"></i>{{ property().bedrooms }}</span
              >
            }
            @if (property().bathrooms !== undefined) {
              <span class="flex items-center gap-1"
                ><i class="pi pi-building"></i>{{ property().bathrooms }}</span
              >
            }
            @if (property().surface !== undefined) {
              <span class="flex items-center gap-1"
                ><i class="pi pi-arrows-alt"></i
                >{{ property().surface }} m²</span
              >
            }
          </div>

          <div class="flex items-center gap-2">
            <button
              type="button"
              class="inline-flex size-9 items-center justify-center rounded-sm border border-neutral-300 text-neutral-500 transition-colors hover:border-brand-blue hover:bg-info-bg hover:text-brand-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
              [attr.aria-label]="'Voir ' + property().title"
              (click)="viewClick.emit(property())"
            >
              <i class="pi pi-eye"></i>
            </button>
            <button
              type="button"
              class="inline-flex size-9 items-center justify-center rounded-sm border border-neutral-300 text-neutral-500 transition-colors hover:border-brand-orange hover:bg-warning-bg hover:text-brand-orange focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
              [attr.aria-label]="'Modifier ' + property().title"
              (click)="editClick.emit(property())"
            >
              <i class="pi pi-pen-to-square"></i>
            </button>
          </div>
        </div>
      </div>
    </article>
  `,
})
export class PropertyCardComponent {
  readonly property = input.required<PropertyCardData>();

  readonly viewClick = output<PropertyCardData>();
  readonly editClick = output<PropertyCardData>();

  readonly typeLabel = computed(() => TYPE_LABELS[this.property().type]);
  readonly statusLabel = computed(() => STATUS_LABELS[this.property().status]);
  readonly statusClasses = computed(
    () => STATUS_CLASSES[this.property().status],
  );
  readonly agencyInitials = computed(() =>
    this.property()
      .agencyName.split(' ')
      .map((word) => word[0])
      .slice(0, 2)
      .join('')
      .toUpperCase(),
  );
}

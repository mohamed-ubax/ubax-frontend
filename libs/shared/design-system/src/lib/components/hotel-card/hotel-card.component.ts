import { CommonModule } from '@angular/common';
import { Component, computed, input, output } from '@angular/core';
import { StarRatingComponent } from '../star-rating/star-rating.component';

export interface HotelCardData {
  id: string | number;
  name: string;
  city: string;
  image?: string;
  stars?: number;
  roomCount?: number;
  status: 'active' | 'pending' | 'suspended';
}

const STATUS_CLASSES: Record<HotelCardData['status'], string> = {
  active: 'bg-success-bg text-success',
  pending: 'bg-warning-bg text-warning',
  suspended: 'bg-danger-bg text-danger',
};

const STATUS_LABELS: Record<HotelCardData['status'], string> = {
  active: 'Actif',
  pending: 'En attente',
  suspended: 'Suspendu',
};

@Component({
  selector: 'ubax-hotel-card',
  standalone: true,
  imports: [CommonModule, StarRatingComponent],
  template: `
    <article
      class="flex w-full max-w-[320px] flex-col rounded-xl bg-surface-card p-6 shadow-card"
      data-ubax-motion="surface"
    >
      <div class="flex items-start justify-between gap-3">
        <span
          class="rounded-xs px-2 py-1 text-sm font-medium"
          [ngClass]="statusClasses()"
        >
          {{ hotel().roomCount ?? 0 }} chambres
        </span>
      </div>

      <div class="mt-4 flex flex-1 flex-col items-center text-center">
        <div
          class="flex size-[73px] items-center justify-center overflow-hidden rounded-full bg-neutral-100 text-2xl font-semibold text-brand-navy"
        >
          @if (hotel().image) {
            <img
              [src]="hotel().image"
              [alt]="hotel().name"
              class="size-full object-cover"
            />
          } @else {
            <i class="pi pi-building text-3xl text-brand-navy"></i>
          }
        </div>

        <h3 class="mt-4 text-3xl font-semibold text-neutral-900">
          {{ hotel().name }}
        </h3>
        <p class="mt-1 text-md text-neutral-500">{{ hotel().city }}</p>

        <div class="mt-3">
          <ubax-star-rating
            [value]="hotel().stars ?? 0"
            [interactive]="false"
            size="sm"
          />
        </div>
      </div>

      <button
        type="button"
        class="mt-6 inline-flex items-center justify-center rounded-sm bg-neutral-100 px-4 py-2 text-md font-medium text-neutral-900 transition-colors hover:bg-info-bg hover:text-brand-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
        (click)="detailClick.emit(hotel())"
      >
        Voir les détails
      </button>
    </article>
  `,
})
export class HotelCardComponent {
  readonly hotel = input.required<HotelCardData>();
  readonly detailClick = output<HotelCardData>();

  readonly statusClasses = computed(() => STATUS_CLASSES[this.hotel().status]);
  readonly statusLabel = computed(() => STATUS_LABELS[this.hotel().status]);
}

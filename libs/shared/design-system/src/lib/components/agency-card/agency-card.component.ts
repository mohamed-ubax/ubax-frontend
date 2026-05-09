import { CommonModule } from '@angular/common';
import { Component, computed, input, output } from '@angular/core';

export interface AgencyCardData {
  id: string | number;
  name: string;
  city: string;
  logo?: string;
  propertyCount?: number;
  status: 'active' | 'pending' | 'suspended';
}

const STATUS_CLASSES: Record<AgencyCardData['status'], string> = {
  active: 'bg-success-bg text-success',
  pending: 'bg-warning-bg text-warning',
  suspended: 'bg-danger-bg text-danger',
};

const STATUS_LABELS: Record<AgencyCardData['status'], string> = {
  active: 'Active',
  pending: 'En attente',
  suspended: 'Suspendue',
};

@Component({
  selector: 'ubax-agency-card',
  standalone: true,
  imports: [CommonModule],
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
          {{ propertyCountLabel() }}
        </span>
      </div>

      <div class="mt-4 flex flex-1 flex-col items-center text-center">
        <div
          class="flex size-[73px] items-center justify-center overflow-hidden rounded-full bg-neutral-100 text-2xl font-semibold text-brand-navy"
        >
          @if (agency().logo) {
            <img
              [src]="agency().logo"
              [alt]="agency().name"
              class="size-full object-cover"
            />
          } @else {
            {{ initials() }}
          }
        </div>

        <h3 class="mt-4 text-3xl font-semibold text-neutral-900">
          {{ agency().name }}
        </h3>
        <p class="mt-1 text-md text-neutral-500">{{ agency().city }}</p>
      </div>

      <button
        type="button"
        class="mt-6 inline-flex items-center justify-center rounded-sm bg-neutral-100 px-4 py-2 text-md font-medium text-neutral-900 transition-colors hover:bg-info-bg hover:text-brand-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
        (click)="detailClick.emit(agency())"
      >
        Voir les détails
      </button>
    </article>
  `,
})
export class AgencyCardComponent {
  readonly agency = input.required<AgencyCardData>();
  readonly detailClick = output<AgencyCardData>();

  readonly statusClasses = computed(() => STATUS_CLASSES[this.agency().status]);
  readonly propertyCountLabel = computed(
    () => `${this.agency().propertyCount ?? 0} biens`,
  );
  readonly initials = computed(() =>
    this.agency()
      .name.split(' ')
      .map((word) => word[0])
      .slice(0, 2)
      .join('')
      .toUpperCase(),
  );
}

import { CommonModule } from '@angular/common';
import { Component, computed, input } from '@angular/core';

export type BookingStatus =
  | 'reserved'
  | 'upcoming'
  | 'ongoing'
  | 'completed'
  | 'cancelled';

export interface TimelineStep {
  label: string;
  date?: string;
  status: 'completed' | 'active' | 'pending';
}

const STATUS_LABELS: Record<BookingStatus, string> = {
  reserved: 'Réservé',
  upcoming: 'À venir',
  ongoing: 'En cours',
  completed: 'Terminé',
  cancelled: 'Annulé',
};

const STEP_CLASSES: Record<TimelineStep['status'], string> = {
  completed: 'bg-success border-success text-white',
  active: 'bg-info border-info text-white',
  pending: 'bg-white border-neutral-300 text-neutral-500',
};

@Component({
  selector: 'ubax-booking-timeline',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section
      class="rounded-xl bg-surface-card p-6 shadow-card"
      data-ubax-motion="surface"
    >
      <div class="mb-6 flex items-start justify-between gap-3">
        <div>
          <h3 class="text-2xl font-semibold text-neutral-900">
            Chronologie de la réservation
          </h3>
          <p class="mt-1 text-md text-neutral-500">{{ statusLabel() }}</p>
        </div>
        <span
          class="rounded-full bg-info-bg px-3 py-1 text-sm font-medium text-brand-blue"
        >
          {{ statusLabel() }}
        </span>
      </div>

      <div class="grid gap-4 md:grid-cols-4">
        @for (
          step of steps();
          track step.label;
          let index = $index;
          let last = $last
        ) {
          <div class="flex min-w-0 flex-col">
            <div class="flex items-center gap-3">
              <div
                class="flex h-1 flex-1 rounded-full bg-neutral-300"
                [class.bg-success]="hasProgress(index)"
              ></div>
              <div
                class="flex size-12 shrink-0 items-center justify-center rounded-full border-2 text-md font-semibold"
                [ngClass]="stepClasses(step)"
              >
                @if (step.status === 'completed') {
                  <i class="pi pi-check"></i>
                } @else if (step.status === 'active') {
                  <i class="pi pi-clock"></i>
                } @else {
                  {{ index + 1 }}
                }
              </div>
              <div
                class="flex h-1 flex-1 rounded-full bg-neutral-300"
                [class.bg-success]="!last && hasProgress(index + 1)"
              ></div>
            </div>

            <div class="mt-3 text-center md:text-left">
              <p class="text-2xl font-medium text-neutral-900">
                {{ step.label }}
              </p>
              @if (step.date) {
                <p class="mt-1 text-md text-neutral-500">{{ step.date }}</p>
              }
            </div>
          </div>
        }
      </div>
    </section>
  `,
})
export class BookingTimelineComponent {
  readonly steps = input.required<TimelineStep[]>();
  readonly currentStatus = input<BookingStatus>('reserved');

  readonly statusLabel = computed(() => STATUS_LABELS[this.currentStatus()]);

  hasProgress(index: number): boolean {
    const currentIndex = this.steps().findIndex(
      (step) => step.status === 'active' || step.status === 'completed',
    );
    return index <= Math.max(currentIndex, 0);
  }

  stepClasses(step: TimelineStep): string {
    return STEP_CLASSES[step.status];
  }
}

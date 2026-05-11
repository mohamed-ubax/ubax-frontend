import { Component, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface StepperStep {
  label:     string;
  completed: boolean;
  active:    boolean;
}

/**
 * UbaxStepperForm — Multi-step form progress indicator
 * Matches the Figma "Ajouter un hôtel / agence" stepper
 *
 * Usage:
 * ```html
 * <ubax-stepper-form
 *   [steps]="[
 *     { label: 'Informations Générales', completed: true, active: false },
 *     { label: 'Localisation', completed: false, active: true },
 *     { label: 'Information légales', completed: false, active: false }
 *   ]"
 * />
 * ```
 */
@Component({
  selector: 'ubax-stepper-form',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="relative flex items-center w-full">
      <!-- Progress track -->
      <div
        class="absolute top-1/2 -translate-y-1/2 left-0 right-0
               h-1 bg-neutral-300 z-0"
      ></div>
      <!-- Active progress fill -->
      <div
        class="absolute top-1/2 -translate-y-1/2 left-0 h-1
               bg-brand-blue z-0 transition-all duration-slow"
        [style.width]="progressWidth()"
      ></div>

      <!-- Steps -->
      @for (step of steps(); track step.label; let i = $index) {
        <div
          class="relative z-10 flex flex-col items-center gap-2"
          [class.flex-1]="i < steps().length - 1"
        >
          <!-- Circle -->
          <div
            class="flex items-center justify-center size-[70px] rounded-full
                   border-4 transition-all duration-base font-semibold text-3xl"
            [class.bg-brand-blue]="step.active"
            [class.border-brand-blue]="step.active"
            [class.text-white]="step.active"
            [class.bg-brand-blue]="step.completed"
            [class.border-brand-blue]="step.completed"
            [class.text-white]="step.completed"
            [class.bg-white]="!step.active && !step.completed"
            [class.border-neutral-300]="!step.active && !step.completed"
            [class.text-neutral-500]="!step.active && !step.completed"
          >
            @if (step.completed && !step.active) {
              <i class="pi pi-check text-2xl"></i>
            } @else {
              {{ i + 1 }}
            }
          </div>

          <!-- Label -->
          <span
            class="text-md font-regular whitespace-nowrap"
            [class.text-brand-blue]="step.active"
            [class.text-neutral-900]="step.completed && !step.active"
            [class.text-neutral-500]="!step.active && !step.completed"
          >
            {{ step.label }}
          </span>
        </div>
      }
    </div>
  `,
})
export class StepperFormComponent {
  readonly steps = input<StepperStep[]>([]);

  readonly progressWidth = computed(() => {
    const total     = this.steps().length - 1;
    const completed = this.steps().filter(s => s.completed).length;
    if (total <= 0) return '0%';
    return `${(completed / total) * 100}%`;
  });
}

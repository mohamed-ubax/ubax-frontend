import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type StepperStep = {
  label: string;};

@Component({
  selector: 'ubax-stepper-header',
  standalone: true,
  imports: [],
  templateUrl: './stepper-header.component.html',
  styleUrl: './stepper-header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StepperHeaderComponent {
  readonly steps = input.required<StepperStep[]>();
  /** Index de l'étape active (0-based) */
  readonly activeStep = input.required<number>();
}

import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PageHeaderComponent, StepperHeaderComponent, StepperStep } from '@ubax-workspace/shared-ui';

@Component({
  selector: 'ubax-bien-add-page',
  standalone: true,
  imports: [PageHeaderComponent, StepperHeaderComponent],
  template: `
    <ubax-page-header title="Ajouter un bien" />
    <ubax-stepper-header [steps]="steps" [activeStep]="activeStep()" />
    <p class="text-slate-400 text-sm">En cours de développement…</p>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BienAddPageComponent {
  protected readonly steps: StepperStep[] = [
    { label: 'Informations générales' },
    { label: 'Détails & Tarification' },
    { label: 'Finalisation' },
  ];
  protected readonly activeStep = signal(0);
}

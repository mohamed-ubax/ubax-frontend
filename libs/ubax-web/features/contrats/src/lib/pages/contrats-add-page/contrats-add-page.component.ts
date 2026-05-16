import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import {
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
  FormsModule,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ContratsStore } from '@ubax-workspace/ubax-web-data-access';
import {
  BreadcrumbNavComponent,
  DetailInfoBlockComponent,
  type InfoItem,
} from '@ubax-workspace/shared-design-system';
import type { StepConfig } from '../../types/contrats-add.types';
import { CONTRATS_ADD_STEP_CONFIG } from '../../constants/contrats-add.constants';

@Component({
  selector: 'ubax-contrats-add-page',
  standalone: true,
  imports: [
    RouterLink,
    ReactiveFormsModule,
    FormsModule,
    BreadcrumbNavComponent,
    DetailInfoBlockComponent,
  ],
  templateUrl: './contrats-add-page.component.html',
  styleUrl: './contrats-add-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContratsAddPageComponent {
  private readonly fb = inject(NonNullableFormBuilder);
  readonly store = inject(ContratsStore);
  private readonly router = inject(Router);

  readonly currentStep = signal(1);
  readonly totalSteps = 4;
  readonly openEnded = signal(false);

  readonly stepConfig: readonly StepConfig[] = CONTRATS_ADD_STEP_CONFIG;

  readonly currentStepConfig = computed(() =>
    this.stepConfig[this.currentStep() - 1],
  );

  readonly step1Form = this.fb.group({
    propertyId: ['', Validators.required],
    ownerId: ['', Validators.required],
  });

  readonly step2Form = this.fb.group({
    tenantId: ['', Validators.required],
  });

  readonly step3Form = this.fb.group({
    monthlyRent: [0, [Validators.required, Validators.min(1)]],
    depositAmount: [0, [Validators.required, Validators.min(0)]],
    startDate: ['', Validators.required],
    endDate: [''],
  });

  readonly summaryItems = computed<InfoItem[]>(() => [
    { label: 'Bien (ID)', value: this.step1Form.getRawValue().propertyId || '—' },
    { label: 'Propriétaire (ID)', value: this.step1Form.getRawValue().ownerId || '—' },
    { label: 'Locataire (ID)', value: this.step2Form.getRawValue().tenantId || '—' },
    { label: 'Loyer mensuel', value: this.formatAmount(this.step3Form.getRawValue().monthlyRent) },
    { label: 'Caution', value: this.formatAmount(this.step3Form.getRawValue().depositAmount) },
    { label: 'Date de début', value: this.step3Form.getRawValue().startDate || '—' },
    { label: 'Date de fin', value: this.openEnded() ? 'Durée indéterminée' : (this.step3Form.getRawValue().endDate || '—') },
  ]);

  constructor() {
    // Redirect after successful creation
    effect(() => {
      const entities = this.store.entities();
      if (!this.store.saving() && entities.length > 0) {
        const last = entities[entities.length - 1];
        if (last?.id) {
          this.router.navigate(['/contrats', last.id]);
        }
      }
    });
  }

  nextStep(): void {
    const form = this.currentStep() === 1
      ? this.step1Form
      : this.currentStep() === 2
        ? this.step2Form
        : this.step3Form;

    if (form.invalid) {
      form.markAllAsTouched();
      return;
    }
    if (this.currentStep() < this.totalSteps) {
      this.currentStep.update((s) => s + 1);
    }
  }

  prevStep(): void {
    if (this.currentStep() > 1) this.currentStep.update((s) => s - 1);
  }

  submit(): void {
    if (this.step1Form.invalid || this.step2Form.invalid || this.step3Form.invalid) {
      this.step1Form.markAllAsTouched();
      this.step2Form.markAllAsTouched();
      this.step3Form.markAllAsTouched();
      return;
    }

    const v1 = this.step1Form.getRawValue();
    const v2 = this.step2Form.getRawValue();
    const v3 = this.step3Form.getRawValue();

    this.store.create!({
      body: {
        propertyId: v1.propertyId,
        ownerId: v1.ownerId,
        tenantId: v2.tenantId,
        contractType: 'LEASE',
        monthlyRent: v3.monthlyRent,
        depositAmount: v3.depositAmount,
        startDate: v3.startDate,
        endDate: this.openEnded() ? undefined : (v3.endDate || undefined),
      },
    });
  }

  formatAmount(amount: number | undefined): string {
    if (!amount) return '—';
    return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA';
  }
}

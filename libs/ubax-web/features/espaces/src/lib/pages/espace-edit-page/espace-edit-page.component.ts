import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import {
  ReactiveFormsModule,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  NOTIFICATION_HANDLER,
  type NotificationHandler,
} from '@ubax-workspace/shared-data-access';
import { LaCodeListDto } from '@ubax-workspace/shared-api-types';
import {
  AuthStore,
  EspaceEditStore,
} from '@ubax-workspace/ubax-web-data-access';

type SelectOption = {
  readonly value: string;
  readonly label: string;
};

type EspaceStep1Form = {
  title: FormControl<string>;
  propertyType: FormControl<string>;
  condition: FormControl<string>;
};

type EspaceStep2Form = {
  bedrooms: FormControl<number | null>;
  bathrooms: FormControl<number | null>;
  maxOccupancy: FormControl<number | null>;
  bedType: FormControl<string>;
  surfaceTotal: FormControl<number | null>;
};

type EspaceStep3Form = {
  city: FormControl<string>;
  district: FormControl<string>;
  address: FormControl<string>;
};

type EspaceStep4Form = {
  price: FormControl<number>;
  mealPlan: FormControl<string>;
  paymentFrequency: FormControl<string>;
  description: FormControl<string>;
  amenities: FormControl<string[]>;
};

const WIZARD_STEPS = [
  { label: 'Identite' },
  { label: 'Capacite' },
  { label: 'Localisation' },
  { label: 'Equipements & Prix' },
] as const;

@Component({
  selector: 'ubax-espace-edit-page',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  providers: [EspaceEditStore],
  templateUrl: './espace-edit-page.component.html',
  styleUrl: './espace-edit-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EspaceEditPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly store = inject(EspaceEditStore);
  private readonly authStore = inject(AuthStore);
  private readonly notifications = inject(NOTIFICATION_HANDLER, {
    optional: true,
  }) as NotificationHandler | null;

  protected readonly wizardSteps = WIZARD_STEPS;
  protected readonly activeStep = signal(0);

  protected readonly espace = this.store.espace;
  protected readonly saving = this.store.saving;
  protected readonly loading = this.store.loading;
  protected readonly error = this.store.error;

  protected readonly hasError = computed(() => !!this.error());

  protected readonly isSessionError = computed(() => {
    const msg = this.error() ?? '';
    return (
      msg.includes('401') ||
      /session expir/i.test(msg) ||
      /unauthorized/i.test(msg) ||
      /non autoris/i.test(msg) ||
      /token/i.test(msg)
    );
  });

  protected readonly formStep1 = new FormGroup<EspaceStep1Form>({
    title: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    propertyType: new FormControl('', { nonNullable: true }),
    condition: new FormControl('', { nonNullable: true }),
  });

  protected readonly formStep2 = new FormGroup<EspaceStep2Form>({
    bedrooms: new FormControl<number | null>(null),
    bathrooms: new FormControl<number | null>(null),
    maxOccupancy: new FormControl<number | null>(null),
    bedType: new FormControl('', { nonNullable: true }),
    surfaceTotal: new FormControl<number | null>(null),
  });

  protected readonly formStep3 = new FormGroup<EspaceStep3Form>({
    city: new FormControl('', { nonNullable: true }),
    district: new FormControl('', { nonNullable: true }),
    address: new FormControl('', { nonNullable: true }),
  });

  protected readonly formStep4 = new FormGroup<EspaceStep4Form>({
    price: new FormControl(0, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(0)],
    }),
    mealPlan: new FormControl('', { nonNullable: true }),
    paymentFrequency: new FormControl('', { nonNullable: true }),
    description: new FormControl('', { nonNullable: true }),
    amenities: new FormControl<string[]>([], { nonNullable: true }),
  });

  protected readonly propertyTypeOptions = computed<SelectOption[]>(() =>
    this.mapToSelectOptions(this.store.codeListPropertyTypes()),
  );

  protected readonly bedTypeOptions = computed<SelectOption[]>(() =>
    this.mapToSelectOptions(this.store.codeListBedTypes()),
  );

  protected readonly mealPlanOptions = computed<SelectOption[]>(() =>
    this.mapToSelectOptions(this.store.codeListMealPlans()),
  );

  protected readonly paymentFrequencyOptions = computed<SelectOption[]>(() =>
    this.mapToSelectOptions(this.store.codeListPaymentFrequencies()),
  );

  protected readonly conditionOptions = computed<SelectOption[]>(() =>
    this.mapToSelectOptions(this.store.codeListPropertyConditions()),
  );

  protected readonly amenityOptions = computed<SelectOption[]>(() =>
    this.mapToSelectOptions(this.store.codeListAmenities()),
  );

  protected readonly cityOptions = computed<SelectOption[]>(() =>
    this.mapToSelectOptions(this.store.codeListCities()),
  );

  constructor() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.store.loadEspace(id);
    }
    this.store.loadCodeLists();

    effect(() => {
      const entity = this.espace();
      if (entity) {
        this.populateForms(entity);
      }
    });
  }

  protected isReachedStep(stepIndex: number): boolean {
    return this.activeStep() >= stepIndex;
  }

  protected previousStep(): void {
    if (this.activeStep() > 0) {
      this.activeStep.update((s) => s - 1);
    }
  }

  protected proceedStep1(): void {
    if (this.formStep1.valid) {
      this.activeStep.set(1);
    }
  }

  protected proceedStep2(): void {
    if (this.formStep2.valid) {
      this.activeStep.set(2);
    }
  }

  protected proceedStep3(): void {
    if (this.formStep3.valid) {
      this.activeStep.set(3);
    }
  }

  protected proceedStep4(): void {
    if (!this.formStep4.valid) {
      return;
    }

    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.notifications?.error?.('Identifiant espace introuvable');
      return;
    }

    const payload: Record<string, unknown> = {
      id,
      ...this.formStep1.getRawValue(),
      ...this.formStep2.getRawValue(),
      ...this.formStep3.getRawValue(),
      ...this.formStep4.getRawValue(),
    };

    this.store.updateEspace(payload);

    this.notifications?.success?.('Espace modifie avec succes');
    void this.router.navigate(['/hotel/espaces', id]);
  }

  protected expireAndRedirect(): void {
    this.authStore.expireSession();
  }

  protected readonly step1Controls = this.formStep1.controls;
  protected readonly step2Controls = this.formStep2.controls;
  protected readonly step3Controls = this.formStep3.controls;
  protected readonly step4Controls = this.formStep4.controls;

  private mapToSelectOptions(items: readonly LaCodeListDto[]): SelectOption[] {
    return items
      .map((item) => ({
        value: item.value ?? '',
        label: item.description ?? item.value ?? '',
      }))
      .filter((item) => item.value.length > 0);
  }

  private populateForms(entity: Record<string, unknown>): void {
    this.formStep1.patchValue({
      title: this.stringValue(entity['title']),
      propertyType: this.stringValue(entity['propertyType']),
      condition: this.stringValue(entity['condition']),
    });

    this.formStep2.patchValue({
      bedrooms: this.numberOrNull(entity['bedrooms']),
      bathrooms: this.numberOrNull(entity['bathrooms']),
      maxOccupancy: this.numberOrNull(entity['maxOccupancy']),
      bedType: this.stringValue(entity['bedType']),
      surfaceTotal: this.numberOrNull(entity['surfaceTotal']),
    });

    this.formStep3.patchValue({
      city: this.stringValue(entity['city']),
      district: this.stringValue(entity['district']),
      address: this.stringValue(entity['address']),
    });

    this.formStep4.patchValue({
      price: this.numberValue(entity['price']),
      mealPlan: this.stringValue(entity['mealPlan']),
      paymentFrequency: this.stringValue(entity['paymentFrequency']),
      description: this.stringValue(entity['description']),
      amenities: this.stringArrayValue(entity['amenities']),
    });
  }

  private stringValue(value: unknown): string {
    return typeof value === 'string' ? value : '';
  }

  private numberValue(value: unknown): number {
    return typeof value === 'number' && Number.isFinite(value) ? value : 0;
  }

  private numberOrNull(value: unknown): number | null {
    return typeof value === 'number' && Number.isFinite(value) ? value : null;
  }

  private stringArrayValue(value: unknown): string[] {
    if (!Array.isArray(value)) {
      return [];
    }
    return value.filter((item): item is string => typeof item === 'string');
  }
}

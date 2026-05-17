import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
  FormsModule,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { DatePickerModule } from 'primeng/datepicker';
import { Select } from 'primeng/select';
import {
  AuthStore,
  ContratsStore,
  LocationStore,
  MesBiensStore,
} from '@ubax-workspace/ubax-web-data-access';
import {
  DetailInfoBlockComponent,
  type InfoItem,
} from '@ubax-workspace/shared-design-system';
import type { CreateContractRequest } from '@ubax-workspace/shared-api-types';
import type { StepConfig } from '../../types/contrats-add.types';
import { CONTRATS_ADD_STEP_CONFIG } from '../../constants/contrats-add.constants';

type ContractType = NonNullable<CreateContractRequest['contractType']>;
type ContractDateValue = Date | null;
type RichSelectOption<T extends string = string> = {
  value: T;
  label: string;
  meta?: string;
  icon: string;
};

@Component({
  selector: 'ubax-contrats-add-page',
  standalone: true,
  imports: [
    DatePickerModule,
    Select,
    RouterLink,
    ReactiveFormsModule,
    FormsModule,
    DetailInfoBlockComponent,
  ],
  templateUrl: './contrats-add-page.component.html',
  styleUrl: './contrats-add-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContratsAddPageComponent {
  readonly contractTypeOptions: RichSelectOption<ContractType>[] = [
    {
      value: 'LEASE',
      label: 'Bail location',
      meta: 'Loyer mensuel et echeances regulieres',
      icon: 'pi-home',
    },
    {
      value: 'SALE',
      label: 'Vente',
      meta: 'Cession definitive du bien',
      icon: 'pi-building-columns',
    },
    {
      value: 'RESERVATION',
      label: 'Reservation',
      meta: 'Blocage temporaire du bien',
      icon: 'pi-calendar-clock',
    },
    {
      value: 'MANDATE',
      label: 'Mandat',
      meta: 'Gestion ou commercialisation pour le compte du proprietaire',
      icon: 'pi-briefcase',
    },
  ];

  private readonly fb = inject(NonNullableFormBuilder);
  readonly store = inject(ContratsStore);
  readonly biensStore = inject(MesBiensStore);
  readonly locationStore = inject(LocationStore);
  readonly authStore = inject(AuthStore);
  private readonly router = inject(Router);

  readonly currentStep = signal(1);
  readonly totalSteps = 4;
  readonly openEnded = signal(false);
  private readonly awaitingCreation = signal(false);
  private readonly knownContractIds = signal<string[]>([]);

  readonly stepConfig: readonly StepConfig[] = CONTRATS_ADD_STEP_CONFIG;

  readonly currentStepConfig = computed(
    () => this.stepConfig[this.currentStep() - 1],
  );

  readonly propertyOptions = computed<RichSelectOption[]>(() =>
    this.biensStore
      .entities()
      .filter((property) => Boolean(property.id))
      .map((property) => ({
        value: property.id ?? '',
        label: property.title?.trim() || 'Bien sans titre',
        meta: this.formatPropertyMeta(property),
        icon: 'pi-home',
      })),
  );

  readonly tenantOptions = computed<RichSelectOption[]>(() => {
    const currentId = this.selectedTenantId();

    return this.locationStore
      .entities()
      .filter(
        (tenant) =>
          Boolean(tenant.id) &&
          (tenant.status === 'QUALIFIED' || tenant.id === currentId),
      )
      .map((tenant) => ({
        value: tenant.id,
        label: tenant.fullName?.trim() || 'Locataire sans nom',
        meta: this.formatTenantMeta(tenant),
        icon: 'pi-user',
      }));
  });

  readonly selectedPropertyLabel = computed(() => {
    const propertyId = this.step2Form.controls.propertyId.value;
    if (!propertyId) return '—';

    return (
      this.propertyOptions().find((option) => option.value === propertyId)
        ?.label ?? propertyId
    );
  });

  readonly selectedTenantLabel = computed(() => {
    const tenantId = this.selectedTenantId();
    if (!tenantId) return '—';

    return (
      this.tenantOptions().find((option) => option.value === tenantId)?.label ??
      tenantId
    );
  });

  readonly ownerDisplayName = computed(() => {
    const user = this.authStore.user();
    const fullName = [user?.prenom, user?.nom].filter(Boolean).join(' ').trim();

    if (fullName) return fullName;

    const selectedProperty = this.biensStore
      .entities()
      .find(
        (property) => property.id === this.step2Form.controls.propertyId.value,
      );

    return selectedProperty?.ownerName ?? 'Utilisateur connecté';
  });

  readonly step1Form = this.fb.group({
    tenantId: ['', Validators.required],
  });

  private readonly selectedTenantId = toSignal(
    this.step1Form.controls.tenantId.valueChanges,
    { initialValue: '' },
  );

  readonly step2Form = this.fb.group({
    propertyId: ['', Validators.required],
    ownerId: ['', Validators.required],
  });

  readonly step3Form = this.fb.group({
    contractType: this.fb.control<ContractType>('LEASE', Validators.required),
    monthlyRent: [0, [Validators.required, Validators.min(1)]],
    depositAmount: [0, [Validators.required, Validators.min(0)]],
    paymentDay: [
      5,
      [Validators.required, Validators.min(1), Validators.max(28)],
    ],
    startDate: this.fb.control<ContractDateValue>(null, Validators.required),
    endDate: this.fb.control<ContractDateValue>(null),
  });

  readonly summaryItems = computed<InfoItem[]>(() => [
    {
      label: 'Bien',
      value: this.selectedPropertyLabel(),
    },
    {
      label: 'Propriétaire',
      value: this.ownerDisplayName(),
    },
    {
      label: 'Locataire',
      value: this.selectedTenantLabel(),
    },
    {
      label: 'Type de contrat',
      value:
        this.contractTypeOptions.find(
          (option) =>
            option.value === this.step3Form.getRawValue().contractType,
        )?.label ?? this.step3Form.getRawValue().contractType,
    },
    {
      label: 'Loyer mensuel',
      value: this.formatAmount(this.step3Form.getRawValue().monthlyRent),
    },
    {
      label: 'Caution',
      value: this.formatAmount(this.step3Form.getRawValue().depositAmount),
    },
    {
      label: "Jour d'echeance",
      value: String(this.step3Form.getRawValue().paymentDay || '—'),
    },
    {
      label: 'Date de début',
      value: this.formatDisplayDate(this.step3Form.getRawValue().startDate),
    },
    {
      label: 'Date de fin',
      value: this.openEnded()
        ? 'Durée indéterminée'
        : this.formatDisplayDate(this.step3Form.getRawValue().endDate),
    },
  ]);

  constructor() {
    this.biensStore.load?.({ pageable: {} });
    this.locationStore.loadSansContrat();

    effect(() => {
      const tenantId = this.selectedTenantId();
      if (!tenantId) return;

      const tenant = this.locationStore.entities().find((t) => t.id === tenantId);
      if (!tenant?.propertyId) return;

      this.step2Form.controls.propertyId.setValue(tenant.propertyId);

      const property = this.biensStore
        .entities()
        .find((p) => p.id === tenant.propertyId);
      if (!property) return;

      if (property.price) {
        this.step3Form.controls.monthlyRent.setValue(property.price);
      }

      type PropertyExtended = typeof property & {
        depositAmount?: number;
        paymentDay?: number;
      };
      const ext = property as PropertyExtended;
      if (ext.depositAmount != null) {
        this.step3Form.controls.depositAmount.setValue(ext.depositAmount);
      }
      if (ext.paymentDay != null) {
        this.step3Form.controls.paymentDay.setValue(ext.paymentDay);
      }
    });

    effect(() => {
      const currentOwnerId = this.step2Form.controls.ownerId.value.trim();
      if (currentOwnerId) {
        return;
      }

      const authUserId = this.authStore.user()?.id?.trim() ?? '';
      const selectedPropertyOwnerId =
        this.biensStore
          .entities()
          .find(
            (property) =>
              property.id === this.step2Form.controls.propertyId.value,
          )
          ?.ownerId?.trim() ?? '';
      const nextOwnerId = authUserId || selectedPropertyOwnerId;

      if (nextOwnerId) {
        this.step2Form.controls.ownerId.setValue(nextOwnerId);
      }
    });

    effect(() => {
      const awaitingCreation = this.awaitingCreation();
      const saving = this.store.saving();
      const error = this.store.error();
      const entities = this.store.entities();

      if (!awaitingCreation || saving) {
        return;
      }

      if (error) {
        this.awaitingCreation.set(false);
        return;
      }

      const previousIds = new Set(this.knownContractIds());
      const createdContract = entities.find(
        (entity) => entity.id && !previousIds.has(entity.id),
      );

      if (createdContract?.id) {
        this.awaitingCreation.set(false);
        void this.router.navigate(['/contrats', createdContract.id]);
      }
    });
  }

  backToContracts(): void {
    void this.router.navigate(['/contrats']);
  }

  nextStep(): void {
    let form: { invalid: boolean; markAllAsTouched(): void } = this.step1Form;

    if (this.currentStep() === 2) {
      form = this.step2Form;
    } else if (this.currentStep() >= 3) {
      form = this.step3Form;
    }


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
    if (
      this.step1Form.invalid ||
      this.step2Form.invalid ||
      this.step3Form.invalid
    ) {
      this.step1Form.markAllAsTouched();
      this.step2Form.markAllAsTouched();
      this.step3Form.markAllAsTouched();
      return;
    }

    const v1 = this.step1Form.getRawValue();
    const v2 = this.step2Form.getRawValue();
    const v3 = this.step3Form.getRawValue();
    const startDate = this.serializeDate(v3.startDate);

    if (!startDate) {
      this.step3Form.controls.startDate.markAsTouched();
      return;
    }

    this.knownContractIds.set(
      this.store
        .entities()
        .map((contract) => contract.id)
        .filter((id): id is string => Boolean(id)),
    );
    this.awaitingCreation.set(true);

    const createContract = this.store.create;
    if (!createContract) {
      this.awaitingCreation.set(false);
      return;
    }

    createContract({
      body: {
        tenantId: v1.tenantId,
        propertyId: v2.propertyId,
        ownerId: v2.ownerId,
        contractType: v3.contractType,
        monthlyRent: v3.monthlyRent,
        depositAmount: v3.depositAmount,
        paymentDay: v3.paymentDay,
        startDate,
        endDate: this.openEnded() ? undefined : this.serializeDate(v3.endDate),
      },
    });
  }

  formatAmount(amount: number | undefined): string {
    if (!amount) return '—';
    return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA';
  }

  private formatDisplayDate(value: ContractDateValue): string {
    if (!value) return '—';

    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }).format(value);
  }

  private serializeDate(value: ContractDateValue): string | undefined {
    if (!value) return undefined;

    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  private formatPropertyMeta(property: {
    city?: string;
    propertyType?: string;
  }): string {
    const segments = [property.city, property.propertyType]
      .filter((value): value is string => Boolean(value?.trim()))
      .map((value) => value.trim());

    return segments.join(' · ') || 'Information indisponible';
  }

  private formatTenantMeta(tenant: { email?: string; id: string }): string {
    const segments = [tenant.email, `Ref ${tenant.id}`]
      .filter((value): value is string => Boolean(value?.trim()))
      .map((value) => value.trim());

    return segments.join(' · ');
  }
}

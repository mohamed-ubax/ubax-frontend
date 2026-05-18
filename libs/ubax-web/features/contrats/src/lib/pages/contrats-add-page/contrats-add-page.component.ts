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
import { HttpClient } from '@angular/common/http';
import { DatePickerModule } from 'primeng/datepicker';
import { Select } from 'primeng/select';
import { map } from 'rxjs';
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
import {
  type CreateContractRequest,
  type LaCodeListDto,
  findAllByType,
  ApiConfiguration,
} from '@ubax-workspace/shared-api-types';
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

/** Champs affichés selon le type de contrat */
const CONTRACT_TYPE_FIELDS: Record<
  ContractType,
  {
    showMonthlyRent: boolean;
    showSalePrice: boolean;
    showMonthlyInstallment: boolean;
    showDepositAmount: boolean;
    showPaymentDay: boolean;
    showEndDate: boolean;
    endDateRequired: boolean;
    showReservationDeposit: boolean;
    showReservationDurationDays: boolean;
    showAgencyCommissionRate: boolean;
    showSpecialClauses: boolean;
    showTerminationConditions: boolean;
    showRentToOwnSummary: boolean;
    requiresTenant: boolean;
  }
> = {
  LEASE: {
    showMonthlyRent: true,
    showSalePrice: false,
    showMonthlyInstallment: false,
    showDepositAmount: true,
    showPaymentDay: true,
    showEndDate: true,
    endDateRequired: false,
    showReservationDeposit: false,
    showReservationDurationDays: false,
    showAgencyCommissionRate: false,
    showSpecialClauses: false,
    showTerminationConditions: false,
    showRentToOwnSummary: false,
    requiresTenant: true,
  },
  SALE: {
    showMonthlyRent: false,
    showSalePrice: true,
    showMonthlyInstallment: false,
    showDepositAmount: false,
    showPaymentDay: false,
    showEndDate: false,
    endDateRequired: false,
    showReservationDeposit: false,
    showReservationDurationDays: false,
    showAgencyCommissionRate: false,
    showSpecialClauses: false,
    showTerminationConditions: false,
    showRentToOwnSummary: false,
    requiresTenant: false,
  },
  RENT_TO_OWN: {
    showMonthlyRent: false,
    showSalePrice: true,
    showMonthlyInstallment: true,
    showDepositAmount: true,
    showPaymentDay: true,
    showEndDate: true,
    endDateRequired: true,
    showReservationDeposit: false,
    showReservationDurationDays: false,
    showAgencyCommissionRate: false,
    showSpecialClauses: false,
    showTerminationConditions: false,
    showRentToOwnSummary: true,
    requiresTenant: true,
  },
  RESERVATION: {
    showMonthlyRent: false,
    showSalePrice: false,
    showMonthlyInstallment: false,
    showDepositAmount: false,
    showPaymentDay: false,
    showEndDate: false,
    endDateRequired: false,
    showReservationDeposit: true,
    showReservationDurationDays: true,
    showAgencyCommissionRate: false,
    showSpecialClauses: false,
    showTerminationConditions: false,
    showRentToOwnSummary: false,
    requiresTenant: false,
  },
  MANDATE: {
    showMonthlyRent: false,
    showSalePrice: false,
    showMonthlyInstallment: false,
    showDepositAmount: false,
    showPaymentDay: false,
    showEndDate: true,
    endDateRequired: false,
    showReservationDeposit: false,
    showReservationDurationDays: false,
    showAgencyCommissionRate: true,
    showSpecialClauses: true,
    showTerminationConditions: true,
    showRentToOwnSummary: false,
    requiresTenant: false,
  },
};

/** Options statiques de fallback (utilisées si le codelist n'est pas encore chargé) */
const STATIC_CONTRACT_TYPE_OPTIONS: RichSelectOption<ContractType>[] = [
  {
    value: 'LEASE',
    label: 'Bail location',
    meta: 'Loyer mensuel et échéances régulières',
    icon: 'pi-home',
  },
  {
    value: 'SALE',
    label: 'Vente',
    meta: 'Cession définitive du bien',
    icon: 'pi-building-columns',
  },
  {
    value: 'RENT_TO_OWN',
    label: 'Location-vente',
    meta: 'Mensualités imputées sur le prix total du bien',
    icon: 'pi-key',
  },
  {
    value: 'RESERVATION',
    label: 'Réservation',
    meta: 'Blocage temporaire du bien',
    icon: 'pi-calendar-clock',
  },
  {
    value: 'MANDATE',
    label: 'Mandat',
    meta: 'Gestion ou commercialisation pour le compte du propriétaire',
    icon: 'pi-briefcase',
  },
];

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
  // ─── Injections ─────────────────────────────────────────────────────────────
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly http = inject(HttpClient);
  private readonly apiConfig = inject(ApiConfiguration);
  readonly store = inject(ContratsStore);
  readonly biensStore = inject(MesBiensStore);
  readonly locationStore = inject(LocationStore);
  readonly authStore = inject(AuthStore);
  private readonly router = inject(Router);

  // ─── Codelist CONTRACT_TYPE ──────────────────────────────────────────────────
  readonly contractTypeCodeList = signal<LaCodeListDto[]>([]);
  readonly contractTypeCodeListLoading = signal(false);

  /** Options du sélecteur de type de contrat (depuis codelist ou fallback statique) */
  readonly contractTypeOptions = computed<RichSelectOption<ContractType>[]>(() => {
    const items = this.contractTypeCodeList();
    if (items.length > 0) {
      return items
        .filter((item): item is LaCodeListDto & { value: ContractType } =>
          ['LEASE', 'SALE', 'RENT_TO_OWN', 'RESERVATION', 'MANDATE'].includes(item.value ?? ''),
        )
        .map((item) => ({
          value: item.value as ContractType,
          label: item.description?.trim() || this.fallbackLabel(item.value as ContractType),
          meta: this.contractTypeMeta(item.value as ContractType),
          icon: this.contractTypeIcon(item.value as ContractType),
        }));
    }
    // Fallback statique si le codelist n'est pas encore chargé
    return STATIC_CONTRACT_TYPE_OPTIONS;
  });

  // ─── État UI ─────────────────────────────────────────────────────────────────
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

  // ─── Formulaires ─────────────────────────────────────────────────────────────
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
    // LEASE / RENT_TO_OWN
    monthlyRent: this.fb.control<number | null>(null),
    depositAmount: this.fb.control<number | null>(null),
    paymentDay: this.fb.control<number | null>(5, [Validators.min(1), Validators.max(28)]),
    // SALE / RENT_TO_OWN
    salePrice: this.fb.control<number | null>(null),
    // RENT_TO_OWN
    monthlyInstallment: this.fb.control<number | null>(null),
    // RESERVATION
    reservationDeposit: this.fb.control<number | null>(null),
    reservationDurationDays: this.fb.control<number | null>(null, [Validators.min(1)]),
    // MANDATE
    agencyCommissionRate: this.fb.control<number | null>(null, [Validators.min(0), Validators.max(100)]),
    specialClauses: this.fb.control<string>(''),
    terminationConditions: this.fb.control<string>(''),
    // Dates
    startDate: this.fb.control<ContractDateValue>(null, Validators.required),
    endDate: this.fb.control<ContractDateValue>(null),
  });

  /** Signal sur le type de contrat sélectionné */
  private readonly selectedContractType = toSignal(
    this.step3Form.controls.contractType.valueChanges,
    { initialValue: 'LEASE' as ContractType },
  );

  /** Règles de visibilité/validation pour le type courant */
  readonly contractTypeFields = computed(
    () => CONTRACT_TYPE_FIELDS[this.selectedContractType()],
  );

  /** Récapitulatif indicatif pour RENT_TO_OWN */
  readonly rentToOwnSummary = computed(() => {
    const v = this.step3Form.getRawValue();
    const installment = v.monthlyInstallment ?? 0;
    const salePrice = v.salePrice ?? 0;
    const start = v.startDate;
    const end = v.endDate;

    if (!installment || !salePrice || !start || !end) return null;

    const months = this.monthsBetween(start, end);
    if (months <= 0) return null;

    const total = installment * months;
    return {
      installment: this.formatAmount(installment),
      months,
      total: this.formatAmount(total),
      salePrice: this.formatAmount(salePrice),
      balanced: Math.abs(total - salePrice) < 1,
    };
  });

  readonly summaryItems = computed<InfoItem[]>(() => {
    const v3 = this.step3Form.getRawValue();
    const contractType = v3.contractType;
    const fields = CONTRACT_TYPE_FIELDS[contractType];
    const typeLabel =
      this.contractTypeOptions().find((o) => o.value === contractType)?.label ??
      contractType;

    const items: InfoItem[] = [
      { label: 'Bien', value: this.selectedPropertyLabel() },
      { label: 'Propriétaire', value: this.ownerDisplayName() },
    ];

    if (fields.requiresTenant) {
      items.push({ label: 'Locataire', value: this.selectedTenantLabel() });
    }

    items.push({ label: 'Type de contrat', value: typeLabel });
    items.push({
      label: 'Date de début',
      value: this.formatDisplayDate(v3.startDate),
    });

    if (fields.showEndDate) {
      items.push({
        label: 'Date de fin',
        value:
          contractType === 'LEASE' && this.openEnded()
            ? 'Durée indéterminée'
            : this.formatDisplayDate(v3.endDate),
      });
    }

    if (fields.showMonthlyRent && v3.monthlyRent != null) {
      items.push({ label: 'Loyer mensuel', value: this.formatAmount(v3.monthlyRent) });
    }
    if (fields.showSalePrice && v3.salePrice != null) {
      items.push({ label: 'Prix total', value: this.formatAmount(v3.salePrice) });
    }
    if (fields.showMonthlyInstallment && v3.monthlyInstallment != null) {
      items.push({ label: 'Mensualité', value: this.formatAmount(v3.monthlyInstallment) });
    }
    if (fields.showDepositAmount && v3.depositAmount != null) {
      items.push({ label: 'Caution / Apport', value: this.formatAmount(v3.depositAmount) });
    }
    if (fields.showPaymentDay && v3.paymentDay != null) {
      items.push({ label: "Jour d'échéance", value: String(v3.paymentDay) });
    }
    if (fields.showReservationDeposit && v3.reservationDeposit != null) {
      items.push({ label: 'Acompte de réservation', value: this.formatAmount(v3.reservationDeposit) });
    }
    if (fields.showReservationDurationDays && v3.reservationDurationDays != null) {
      items.push({ label: 'Durée de réservation', value: `${v3.reservationDurationDays} jours` });
    }
    if (fields.showAgencyCommissionRate && v3.agencyCommissionRate != null) {
      items.push({ label: 'Commission agence', value: `${v3.agencyCommissionRate} %` });
    }
    if (fields.showSpecialClauses && v3.specialClauses) {
      items.push({ label: 'Clauses particulières', value: v3.specialClauses });
    }
    if (fields.showTerminationConditions && v3.terminationConditions) {
      items.push({ label: 'Conditions de résiliation', value: v3.terminationConditions });
    }

    return items;
  });

  constructor() {
    this.biensStore.load?.({ pageable: {} });
    this.locationStore.loadSansContrat();

    // Chargement du codelist CONTRACT_TYPE
    this.contractTypeCodeListLoading.set(true);
    findAllByType(this.http, this.apiConfig.rootUrl, { type: 'CONTRACT_TYPE' })
      .pipe(map((response) => {
        const body = response.body as unknown;
        if (Array.isArray(body)) return body as LaCodeListDto[];
        if (body && typeof body === 'object') {
          const r = body as Record<string, unknown>;
          if (Array.isArray(r['data'])) return r['data'] as LaCodeListDto[];
          if (Array.isArray(r['content'])) return r['content'] as LaCodeListDto[];
        }
        return [] as LaCodeListDto[];
      }))
      .subscribe({
        next: (items) => {
          this.contractTypeCodeList.set(items);
          this.contractTypeCodeListLoading.set(false);
        },
        error: () => {
          // Fallback silencieux : les options statiques seront utilisées
          this.contractTypeCodeListLoading.set(false);
        },
      });

    // Pré-remplissage depuis le dossier locataire
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

      // Pré-remplir le loyer depuis le prix du bien si disponible
      if (property.price) {
        this.step3Form.controls.monthlyRent.setValue(property.price);
      }

      type PropertyExtended = typeof property & {
        depositAmount?: number;
        paymentDay?: number;
        salePrice?: number;
      };
      const ext = property as PropertyExtended;
      if (ext.depositAmount != null) {
        this.step3Form.controls.depositAmount.setValue(ext.depositAmount);
      }
      if (ext.paymentDay != null) {
        this.step3Form.controls.paymentDay.setValue(ext.paymentDay);
      }
      if (ext.salePrice != null) {
        this.step3Form.controls.salePrice.setValue(ext.salePrice);
      }
    });

    // Pré-remplissage du propriétaire
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

    // Mise à jour dynamique des validateurs selon le type de contrat
    effect(() => {
      const fields = this.contractTypeFields();
      const ctrl = this.step3Form.controls;

      // monthlyRent
      if (fields.showMonthlyRent) {
        ctrl.monthlyRent.setValidators([Validators.required, Validators.min(1)]);
      } else {
        ctrl.monthlyRent.clearValidators();
        ctrl.monthlyRent.setValue(null);
      }

      // salePrice
      if (fields.showSalePrice) {
        ctrl.salePrice.setValidators([Validators.required, Validators.min(1)]);
      } else {
        ctrl.salePrice.clearValidators();
        ctrl.salePrice.setValue(null);
      }

      // monthlyInstallment
      if (fields.showMonthlyInstallment) {
        ctrl.monthlyInstallment.setValidators([Validators.required, Validators.min(1)]);
      } else {
        ctrl.monthlyInstallment.clearValidators();
        ctrl.monthlyInstallment.setValue(null);
      }

      // depositAmount
      if (fields.showDepositAmount) {
        ctrl.depositAmount.setValidators([Validators.required, Validators.min(0)]);
      } else {
        ctrl.depositAmount.clearValidators();
        ctrl.depositAmount.setValue(null);
      }

      // paymentDay
      if (fields.showPaymentDay) {
        ctrl.paymentDay.setValidators([Validators.required, Validators.min(1), Validators.max(28)]);
      } else {
        ctrl.paymentDay.clearValidators();
        ctrl.paymentDay.setValue(null);
      }

      // endDate
      if (fields.endDateRequired) {
        ctrl.endDate.setValidators(Validators.required);
        this.openEnded.set(false);
      } else {
        ctrl.endDate.clearValidators();
      }

      // reservationDeposit
      if (fields.showReservationDeposit) {
        ctrl.reservationDeposit.setValidators([Validators.required, Validators.min(1)]);
      } else {
        ctrl.reservationDeposit.clearValidators();
        ctrl.reservationDeposit.setValue(null);
      }

      // reservationDurationDays
      if (fields.showReservationDurationDays) {
        ctrl.reservationDurationDays.setValidators([Validators.required, Validators.min(1)]);
      } else {
        ctrl.reservationDurationDays.clearValidators();
        ctrl.reservationDurationDays.setValue(null);
      }

      // agencyCommissionRate
      if (fields.showAgencyCommissionRate) {
        ctrl.agencyCommissionRate.setValidators([Validators.required, Validators.min(0), Validators.max(100)]);
      } else {
        ctrl.agencyCommissionRate.clearValidators();
        ctrl.agencyCommissionRate.setValue(null);
      }

      // Mise à jour de l'état de validation
      Object.values(ctrl).forEach((c) => c.updateValueAndValidity({ emitEvent: false }));
    });

    // Redirection après création
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

    const fields = CONTRACT_TYPE_FIELDS[v3.contractType];
    const endDate = fields.endDateRequired || (!this.openEnded() && fields.showEndDate)
      ? this.serializeDate(v3.endDate)
      : undefined;

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

    const body: CreateContractRequest = {
      tenantId: fields.requiresTenant ? v1.tenantId : undefined,
      propertyId: v2.propertyId,
      ownerId: v2.ownerId,
      contractType: v3.contractType,
      startDate,
      endDate,
      ...(fields.showMonthlyRent && v3.monthlyRent != null ? { monthlyRent: v3.monthlyRent } : {}),
      ...(fields.showSalePrice && v3.salePrice != null ? { salePrice: v3.salePrice } : {}),
      ...(fields.showMonthlyInstallment && v3.monthlyInstallment != null ? { monthlyInstallment: v3.monthlyInstallment } : {}),
      ...(fields.showDepositAmount && v3.depositAmount != null ? { depositAmount: v3.depositAmount } : {}),
      ...(fields.showPaymentDay && v3.paymentDay != null ? { paymentDay: v3.paymentDay } : {}),
      ...(fields.showReservationDeposit && v3.reservationDeposit != null ? { reservationDeposit: v3.reservationDeposit } : {}),
      ...(fields.showReservationDurationDays && v3.reservationDurationDays != null ? { reservationDurationDays: v3.reservationDurationDays } : {}),
      ...(fields.showAgencyCommissionRate && v3.agencyCommissionRate != null ? { agencyCommissionRate: v3.agencyCommissionRate } : {}),
      ...(fields.showSpecialClauses && v3.specialClauses ? { specialClauses: v3.specialClauses } : {}),
      ...(fields.showTerminationConditions && v3.terminationConditions ? { terminationConditions: v3.terminationConditions } : {}),
    };

    createContract({ body });
  }

  formatAmount(amount: number | null | undefined): string {
    if (amount == null || amount === 0) return '—';
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

  private monthsBetween(start: Date, end: Date): number {
    const months =
      (end.getFullYear() - start.getFullYear()) * 12 +
      (end.getMonth() - start.getMonth());
    return Math.max(0, months);
  }

  private fallbackLabel(type: ContractType): string {
    const labels: Record<ContractType, string> = {
      LEASE: 'Bail location',
      SALE: 'Vente',
      RENT_TO_OWN: 'Location-vente',
      RESERVATION: 'Réservation',
      MANDATE: 'Mandat',
    };
    return labels[type] ?? type;
  }

  private contractTypeMeta(type: ContractType): string {
    const metas: Record<ContractType, string> = {
      LEASE: 'Loyer mensuel et échéances régulières',
      SALE: 'Cession définitive du bien',
      RENT_TO_OWN: 'Mensualités imputées sur le prix total du bien',
      RESERVATION: 'Blocage temporaire du bien',
      MANDATE: 'Gestion ou commercialisation pour le compte du propriétaire',
    };
    return metas[type] ?? '';
  }

  private contractTypeIcon(type: ContractType): string {
    const icons: Record<ContractType, string> = {
      LEASE: 'pi-home',
      SALE: 'pi-building-columns',
      RENT_TO_OWN: 'pi-key',
      RESERVATION: 'pi-calendar-clock',
      MANDATE: 'pi-briefcase',
    };
    return icons[type] ?? 'pi-file';
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

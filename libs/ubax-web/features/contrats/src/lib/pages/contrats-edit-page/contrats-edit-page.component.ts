import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
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
import {
  NOTIFICATION_HANDLER,
  type NotificationHandler,
} from '@ubax-workspace/shared-data-access';
import { deriveViewState, type ViewState } from '@ubax-workspace/shared-ui';
import type { StepConfig } from '../../types/contrats-add.types';
import { CONTRATS_ADD_STEP_CONFIG } from '../../constants/contrats-add.constants';
import { ContratsSkeletonComponent } from '../../components/contrats-skeleton/contrats-skeleton.component';

type ContractType = NonNullable<CreateContractRequest['contractType']>;
type ContractDateValue = Date | null;
type RichSelectOption<T extends string = string> = {
  value: T;
  label: string;
  meta?: string;
  icon: string;
};
type SummaryHighlight = {
  label: string;
  value: string;
  icon: string;
  tone?: 'accent' | 'default';
};

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
    showDurationYears: boolean;
    showReservationDeposit: boolean;
    showReservationDurationDays: boolean;
    showAgencyCommissionRate: boolean;
    showSpecialClauses: boolean;
    showTerminationConditions: boolean;
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
    showDurationYears: false,
    showReservationDeposit: false,
    showReservationDurationDays: false,
    showAgencyCommissionRate: false,
    showSpecialClauses: false,
    showTerminationConditions: false,
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
    showDurationYears: false,
    showReservationDeposit: false,
    showReservationDurationDays: false,
    showAgencyCommissionRate: false,
    showSpecialClauses: false,
    showTerminationConditions: false,
    requiresTenant: false,
  },
  RENT_TO_OWN: {
    showMonthlyRent: false,
    showSalePrice: true,
    showMonthlyInstallment: true,
    showDepositAmount: true,
    showPaymentDay: true,
    showEndDate: true,
    endDateRequired: false,
    showDurationYears: true,
    showReservationDeposit: false,
    showReservationDurationDays: false,
    showAgencyCommissionRate: false,
    showSpecialClauses: false,
    showTerminationConditions: false,
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
    showDurationYears: false,
    showReservationDeposit: true,
    showReservationDurationDays: true,
    showAgencyCommissionRate: false,
    showSpecialClauses: false,
    showTerminationConditions: false,
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
    showDurationYears: false,
    showReservationDeposit: false,
    showReservationDurationDays: false,
    showAgencyCommissionRate: true,
    showSpecialClauses: true,
    showTerminationConditions: true,
    requiresTenant: false,
  },
};

const CONTRACT_TYPE_OPTIONS: RichSelectOption<ContractType>[] = [
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
  selector: 'ubax-contrats-edit-page',
  standalone: true,
  imports: [
    DatePickerModule,
    Select,
    RouterLink,
    FormsModule,
    DetailInfoBlockComponent,
    ContratsSkeletonComponent,
  ],
  templateUrl: './contrats-edit-page.component.html',
  styleUrl: './contrats-edit-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContratsEditPageComponent {
  // ─── Injections ─────────────────────────────────────────────────────────────
  readonly store = inject(ContratsStore);
  readonly biensStore = inject(MesBiensStore);
  readonly locationStore = inject(LocationStore);
  readonly authStore = inject(AuthStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly notifications = inject<NotificationHandler | null>(
    NOTIFICATION_HANDLER,
    { optional: true },
  );
  readonly Math = Math;

  private readonly contractId = toSignal(
    this.route.paramMap.pipe(map((p) => p.get('id') ?? '')),
    { initialValue: '' },
  );

  // ─── UI state ────────────────────────────────────────────────────────────────
  readonly currentStep = signal(1);
  readonly totalSteps = 5;
  private readonly hasLoaded = signal(false);
  private readonly awaitingSave = signal(false);
  readonly openEnded = signal(false);
  readonly rentToOwnDurationMode = signal<'years' | 'date'>('years');
  private readonly touchedFields = signal<Set<string>>(new Set());
  readonly stepConfig: readonly StepConfig[] = CONTRATS_ADD_STEP_CONFIG;

  readonly contractTypeOptions = CONTRACT_TYPE_OPTIONS;

  // ─── Signal form fields ──────────────────────────────────────────────────────
  readonly tenantId = signal('');
  readonly propertyId = signal('');
  readonly ownerId = signal('');
  readonly contractType = signal<ContractType>('LEASE');
  readonly monthlyRent = signal<number | null>(null);
  readonly depositAmount = signal<number | null>(null);
  readonly paymentDay = signal<number | null>(5);
  readonly salePrice = signal<number | null>(null);
  readonly monthlyInstallment = signal<number | null>(null);
  readonly durationYears = signal<number | null>(5);
  readonly reservationDeposit = signal<number | null>(null);
  readonly reservationDurationDays = signal<number | null>(null);
  readonly agencyCommissionRate = signal<number | null>(null);
  readonly specialClauses = signal('');
  readonly terminationConditions = signal('');
  readonly startDate = signal<ContractDateValue>(null);
  readonly endDate = signal<ContractDateValue>(null);

  // ─── Computed: options ────────────────────────────────────────────────────────
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

  readonly selectedProperty = computed(() =>
    this.biensStore
      .entities()
      .find((property) => property.id === this.propertyId()),
  );

  readonly tenantOptions = computed<RichSelectOption[]>(() => {
    const currentTenantId = this.tenantId();
    return this.locationStore
      .entities()
      .filter(
        (tenant) =>
          Boolean(tenant.id) &&
          (tenant.status === 'QUALIFIED' || tenant.id === currentTenantId),
      )
      .map((tenant) => ({
        value: tenant.id,
        label: tenant.fullName?.trim() || 'Locataire sans nom',
        meta: this.formatTenantMeta(tenant),
        icon: 'pi-user',
      }));
  });

  readonly selectedPropertyLabel = computed(() => {
    const id = this.propertyId();
    if (!id) return '—';
    return this.propertyOptions().find((o) => o.value === id)?.label ?? id;
  });

  readonly selectedTenantLabel = computed(() => {
    const id = this.tenantId();
    if (!id) return '—';
    return (
      this.tenantOptions().find((option) => option.value === id)?.label ?? id
    );
  });

  readonly ownerDisplayName = computed(() => {
    const selectedProperty = this.selectedProperty();
    if (selectedProperty?.ownerName) return selectedProperty.ownerName;

    const user = this.authStore.user();
    const fullName = [user?.prenom, user?.nom].filter(Boolean).join(' ').trim();
    return (
      fullName || this.store.selectedItem()?.ownerName || 'Utilisateur connecté'
    );
  });

  // ─── Computed: dynamic fields ─────────────────────────────────────────────────
  readonly contractTypeFields = computed(
    () => CONTRACT_TYPE_FIELDS[this.contractType()],
  );

  readonly tenantStepRequired = computed(
    () => CONTRACT_TYPE_FIELDS[this.contractType()].requiresTenant,
  );

  readonly visibleStepConfig = computed(() => {
    if (this.tenantStepRequired()) {
      return this.stepConfig;
    }

    return this.stepConfig.filter((step) => step.step !== 1);
  });

  readonly visibleStepNumbers = computed(() =>
    this.visibleStepConfig().map((step) => step.step),
  );

  readonly currentStepConfig = computed(
    () =>
      this.visibleStepConfig().find(
        (step) => step.step === this.currentStep(),
      ) ?? this.visibleStepConfig()[0],
  );

  readonly isFirstVisibleStep = computed(
    () => this.currentStep() === this.visibleStepNumbers()[0],
  );

  readonly isLastVisibleStep = computed(() => {
    const steps = this.visibleStepNumbers();
    return this.currentStep() === steps[steps.length - 1];
  });

  readonly step1Errors = computed(() => ({
    tenantRequired: this.tenantStepRequired() && !this.tenantId(),
  }));

  readonly step1Valid = computed(() => !this.step1Errors().tenantRequired);

  readonly step2Errors = computed(() => ({
    propertyRequired: !this.propertyId(),
    ownerRequired: !this.ownerId(),
  }));

  readonly step2Valid = computed(
    () =>
      !this.step2Errors().propertyRequired && !this.step2Errors().ownerRequired,
  );

  readonly step3Valid = computed(() => !!this.contractType());

  readonly step4Valid = computed(() => {
    const errors = this.formErrors();
    return !(
      errors.startDate ||
      errors.monthlyRent ||
      errors.salePrice ||
      errors.monthlyInstallment ||
      errors.depositAmount ||
      errors.paymentDay ||
      errors.durationYears ||
      errors.endDate ||
      errors.reservationDeposit ||
      errors.reservationDurationDays ||
      errors.agencyCommissionRate
    );
  });

  // ─── Computed: validation ─────────────────────────────────────────────────────
  readonly formErrors = computed(() => {
    const fields = this.contractTypeFields();
    const mode = this.rentToOwnDurationMode();
    const needEndDate =
      fields.endDateRequired || (fields.showDurationYears && mode === 'date');
    return {
      propertyId: !this.propertyId(),
      ownerId: !this.ownerId(),
      contractType: !this.contractType(),
      tenantId: fields.requiresTenant && !this.tenantId(),
      startDate: !this.startDate(),
      monthlyRent:
        fields.showMonthlyRent &&
        (!this.monthlyRent() || this.monthlyRent()! < 1),
      salePrice:
        fields.showSalePrice && (!this.salePrice() || this.salePrice()! < 1),
      monthlyInstallment:
        fields.showMonthlyInstallment &&
        (!this.monthlyInstallment() || this.monthlyInstallment()! < 1),
      depositAmount: fields.showDepositAmount && this.depositAmount() == null,
      paymentDay:
        fields.showPaymentDay &&
        (!this.paymentDay() ||
          this.paymentDay()! < 1 ||
          this.paymentDay()! > 28),
      durationYears:
        fields.showDurationYears &&
        mode === 'years' &&
        (!this.durationYears() || this.durationYears()! < 1),
      endDate: needEndDate && !this.openEnded() && !this.endDate(),
      reservationDeposit:
        fields.showReservationDeposit &&
        (!this.reservationDeposit() || this.reservationDeposit()! < 1),
      reservationDurationDays:
        fields.showReservationDurationDays &&
        (!this.reservationDurationDays() ||
          this.reservationDurationDays()! < 1),
      agencyCommissionRate:
        fields.showAgencyCommissionRate && this.agencyCommissionRate() == null,
    };
  });

  readonly formValid = computed(
    () => !Object.values(this.formErrors()).some(Boolean),
  );

  // ─── Computed: RENT_TO_OWN summary ───────────────────────────────────────────
  readonly rentToOwnSummary = computed(() => {
    const installment = this.monthlyInstallment() ?? 0;
    const salePrice = this.salePrice() ?? 0;
    const start = this.startDate();
    if (!installment || !salePrice) return null;
    let months = 0;
    if (this.rentToOwnDurationMode() === 'years') {
      months = (this.durationYears() ?? 5) * 12;
    } else {
      const end = this.endDate();
      if (!start || !end) return null;
      months = this.monthsBetween(start, end);
    }
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
    const contractType = this.contractType();
    const fields = CONTRACT_TYPE_FIELDS[contractType];
    const typeLabel = this.contractTypeLabelFor(contractType);

    const items: InfoItem[] = [
      { label: 'Bien', value: this.selectedPropertyLabel() },
      { label: 'Propriétaire', value: this.ownerDisplayName() },
    ];

    if (fields.requiresTenant) {
      items.push({ label: 'Locataire', value: this.selectedTenantLabel() });
    }

    items.push(
      { label: 'Type de contrat', value: typeLabel },
      {
        label: 'Date de début',
        value: this.formatDisplayDate(this.startDate()),
      },
    );

    if (fields.showEndDate) {
      if (
        contractType === 'RENT_TO_OWN' &&
        this.rentToOwnDurationMode() === 'years'
      ) {
        items.push({
          label: 'Durée',
          value: `${this.durationYears() ?? 5} an(s)`,
        });
      } else {
        items.push({
          label: 'Date de fin',
          value:
            contractType === 'LEASE' && this.openEnded()
              ? 'Durée indéterminée'
              : this.formatDisplayDate(this.endDate()),
        });
      }
    }

    if (fields.showMonthlyRent && this.monthlyRent() != null) {
      items.push({
        label: 'Loyer mensuel',
        value: this.formatAmount(this.monthlyRent()),
      });
    }
    if (fields.showSalePrice && this.salePrice() != null) {
      items.push({
        label: 'Prix total',
        value: this.formatAmount(this.salePrice()),
      });
    }
    if (fields.showMonthlyInstallment && this.monthlyInstallment() != null) {
      items.push({
        label: 'Mensualité',
        value: this.formatAmount(this.monthlyInstallment()),
      });
    }
    if (fields.showDepositAmount && this.depositAmount() != null) {
      items.push({
        label: 'Caution / Apport',
        value: this.formatAmount(this.depositAmount()),
      });
    }
    if (fields.showPaymentDay && this.paymentDay() != null) {
      items.push({
        label: "Jour d'échéance",
        value: String(this.paymentDay()),
      });
    }
    if (fields.showReservationDeposit && this.reservationDeposit() != null) {
      items.push({
        label: 'Acompte de réservation',
        value: this.formatAmount(this.reservationDeposit()),
      });
    }
    if (
      fields.showReservationDurationDays &&
      this.reservationDurationDays() != null
    ) {
      items.push({
        label: 'Durée de réservation',
        value: `${this.reservationDurationDays()} jours`,
      });
    }
    if (
      fields.showAgencyCommissionRate &&
      this.agencyCommissionRate() != null
    ) {
      items.push({
        label: 'Commission agence',
        value: `${this.agencyCommissionRate()} %`,
      });
    }
    if (fields.showSpecialClauses && this.specialClauses()) {
      items.push({
        label: 'Clauses particulières',
        value: this.specialClauses(),
      });
    }
    if (fields.showTerminationConditions && this.terminationConditions()) {
      items.push({
        label: 'Conditions de résiliation',
        value: this.terminationConditions(),
      });
    }

    return items;
  });

  readonly summaryHighlights = computed<SummaryHighlight[]>(() => {
    const highlights: SummaryHighlight[] = [
      {
        label: 'Type',
        value: this.contractTypeLabelFor(this.contractType()),
        icon: this.contractTypeIcon(this.contractType()),
        tone: 'accent',
      },
      {
        label: this.tenantStepRequired() ? 'Locataire' : 'Partie ciblée',
        value: this.tenantStepRequired()
          ? this.selectedTenantLabel()
          : this.ownerDisplayName(),
        icon: this.tenantStepRequired() ? 'pi-user' : 'pi-briefcase',
      },
      {
        label: 'Démarrage',
        value: this.formatDisplayDate(this.startDate()),
        icon: 'pi-calendar',
      },
    ];

    if (
      this.contractTypeFields().showMonthlyRent &&
      this.monthlyRent() != null
    ) {
      highlights.push({
        label: 'Loyer',
        value: this.formatAmount(this.monthlyRent()),
        icon: 'pi-wallet',
      });
    } else if (
      this.contractTypeFields().showMonthlyInstallment &&
      this.monthlyInstallment() != null
    ) {
      highlights.push({
        label: 'Mensualité',
        value: this.formatAmount(this.monthlyInstallment()),
        icon: 'pi-wallet',
      });
    } else if (
      this.contractTypeFields().showSalePrice &&
      this.salePrice() != null
    ) {
      highlights.push({
        label: 'Prix',
        value: this.formatAmount(this.salePrice()),
        icon: 'pi-building-columns',
      });
    } else if (
      this.contractTypeFields().showReservationDeposit &&
      this.reservationDeposit() != null
    ) {
      highlights.push({
        label: 'Acompte',
        value: this.formatAmount(this.reservationDeposit()),
        icon: 'pi-wallet',
      });
    } else if (
      this.contractTypeFields().showAgencyCommissionRate &&
      this.agencyCommissionRate() != null
    ) {
      highlights.push({
        label: 'Commission',
        value: `${this.agencyCommissionRate()} %`,
        icon: 'pi-percentage',
      });
    }

    return highlights;
  });

  // ─── View state ──────────────────────────────────────────────────────────────
  readonly viewState = computed<ViewState>(() => {
    const c = this.store.selectedItem();
    if (this.hasLoaded() && c && c.status !== 'DRAFT') return 'error';
    return deriveViewState(
      this.store.loading(),
      this.store.error(),
      !c,
      this.hasLoaded(),
    );
  });

  constructor() {
    this.biensStore.load?.({ pageable: {} });
    this.locationStore.load?.({ pageable: {} });

    effect(() => {
      const id = this.contractId();
      if (id) this.store.loadOne!(id);
    });

    effect(() => {
      const visibleSteps = this.visibleStepNumbers();
      const step = this.currentStep();
      if (visibleSteps.length === 0) {
        return;
      }

      if (!visibleSteps.includes(step)) {
        this.currentStep.set(visibleSteps[0]);
      }
    });

    // Pre-fill signals from loaded contract
    effect(() => {
      const c = this.store.selectedItem();
      if (c && !this.store.loading()) {
        this.hasLoaded.set(true);
        this.tenantId.set(c.tenantId ?? '');
        this.propertyId.set(c.propertyId ?? '');
        this.ownerId.set(c.ownerId ?? '');
        this.contractType.set(c.contractType ?? 'LEASE');
        this.monthlyRent.set(c.monthlyRent ?? null);
        this.depositAmount.set(c.depositAmount ?? null);
        this.paymentDay.set(c.paymentDay ?? 5);
        this.agencyCommissionRate.set(c.agencyCommissionRate ?? null);
        this.specialClauses.set(c.specialClauses ?? '');
        this.terminationConditions.set(c.terminationConditions ?? '');
        this.startDate.set(this.parseApiDate(c.startDate));
        this.endDate.set(this.parseApiDate(c.endDate));
        // Fields not in ContractResponse type but may be in API response
        const extra = c as Record<string, unknown>;
        if (extra['salePrice'] != null)
          this.salePrice.set(extra['salePrice'] as number);
        if (extra['monthlyInstallment'] != null)
          this.monthlyInstallment.set(extra['monthlyInstallment'] as number);
        if (extra['reservationDeposit'] != null)
          this.reservationDeposit.set(extra['reservationDeposit'] as number);
        if (extra['reservationDurationDays'] != null)
          this.reservationDurationDays.set(
            extra['reservationDurationDays'] as number,
          );
        if (extra['durationYears'] != null)
          this.durationYears.set(extra['durationYears'] as number);
        if (!c.endDate) this.openEnded.set(true);
      }
    });

    // Owner auto-fill from selected property only
    effect(() => {
      const propertyId = this.propertyId();
      if (!propertyId) {
        this.ownerId.set(this.store.selectedItem()?.ownerId?.trim() ?? '');
        return;
      }

      const ownerId = this.selectedProperty()?.ownerId?.trim();
      if (ownerId) {
        this.ownerId.set(ownerId);
        return;
      }

      if (this.store.selectedItem()?.propertyId === propertyId) {
        this.ownerId.set(this.store.selectedItem()?.ownerId?.trim() ?? '');
        return;
      }

      this.ownerId.set('');
    });

    // Redirect after successful save
    effect(() => {
      if (!this.awaitingSave() || this.store.saving()) return;
      if (this.store.error()) {
        this.awaitingSave.set(false);
        return;
      }
      this.awaitingSave.set(false);
      this.notifications?.success('Contrat modifié avec succès');
      void this.router.navigate(['/contrats', this.contractId()]);
    });
  }

  // ─── Touch helpers ────────────────────────────────────────────────────────────

  isTouched(name: string): boolean {
    return this.touchedFields().has(name);
  }

  markFieldEdited(name: string): void {
    this.touchedFields.update((s) => {
      const n = new Set(s);
      n.add(name);
      return n;
    });
  }

  private touchStep(step: number): void {
    const stepFields: Record<number, string[]> = {
      1: ['tenantId'],
      2: ['propertyId', 'ownerId'],
      3: ['contractType'],
      4: [
        'startDate',
        'monthlyRent',
        'salePrice',
        'monthlyInstallment',
        'depositAmount',
        'paymentDay',
        'durationYears',
        'endDate',
        'reservationDeposit',
        'reservationDurationDays',
        'agencyCommissionRate',
      ],
    };
    const fields = stepFields[step] ?? [];
    this.touchedFields.update((current) => {
      const next = new Set(current);
      fields.forEach((field) => next.add(field));
      return next;
    });
  }

  private touchAll(): void {
    const all = [
      'propertyId',
      'contractType',
      'tenantId',
      'startDate',
      'endDate',
      'monthlyRent',
      'salePrice',
      'monthlyInstallment',
      'depositAmount',
      'paymentDay',
      'durationYears',
      'reservationDeposit',
      'reservationDurationDays',
      'agencyCommissionRate',
    ];
    this.touchedFields.update(() => new Set(all));
  }

  toggleRentToOwnDurationMode(mode: 'years' | 'date'): void {
    this.rentToOwnDurationMode.set(mode);
  }

  nextStep(): void {
    const step = this.currentStep();
    this.touchStep(step);

    if (!this.isStepValid(step)) {
      return;
    }

    const steps = this.visibleStepNumbers();
    const currentIndex = steps.indexOf(step);
    if (currentIndex === -1 || currentIndex >= steps.length - 1) {
      return;
    }

    this.currentStep.set(steps[currentIndex + 1]);
  }

  prevStep(): void {
    const steps = this.visibleStepNumbers();
    const currentIndex = steps.indexOf(this.currentStep());
    if (currentIndex <= 0) {
      return;
    }

    this.currentStep.set(steps[currentIndex - 1]);
  }

  backToContracts(): void {
    void this.router.navigate(['/contrats']);
  }

  // ─── Save ─────────────────────────────────────────────────────────────────────

  save(): void {
    this.touchAll();
    if (!this.formValid()) return;

    const startDate = this.serializeDate(this.startDate());
    if (!startDate) return;

    const id = this.contractId();
    const fields = CONTRACT_TYPE_FIELDS[this.contractType()];
    const mode = this.rentToOwnDurationMode();

    let endDate: string | undefined;
    let durationYears: number | undefined;

    if (fields.showDurationYears) {
      if (mode === 'years') {
        durationYears = this.durationYears() ?? 5;
      } else {
        endDate = this.serializeDate(this.endDate());
      }
    } else if (fields.showEndDate && !this.openEnded()) {
      endDate = this.serializeDate(this.endDate());
    }

    this.awaitingSave.set(true);

    this.store.update!({
      id,
      body: {
        propertyId: this.propertyId(),
        ownerId: this.ownerId(),
        tenantId: this.tenantId() || undefined,
        contractType: this.contractType(),
        startDate,
        endDate,
        ...(durationYears != null ? { durationYears } : {}),
        ...(fields.showMonthlyRent && this.monthlyRent() != null
          ? { monthlyRent: this.monthlyRent()! }
          : {}),
        ...(fields.showSalePrice && this.salePrice() != null
          ? { salePrice: this.salePrice()! }
          : {}),
        ...(fields.showMonthlyInstallment && this.monthlyInstallment() != null
          ? { monthlyInstallment: this.monthlyInstallment()! }
          : {}),
        ...(fields.showDepositAmount && this.depositAmount() != null
          ? { depositAmount: this.depositAmount()! }
          : {}),
        ...(fields.showPaymentDay && this.paymentDay() != null
          ? { paymentDay: this.paymentDay()! }
          : {}),
        ...(fields.showReservationDeposit && this.reservationDeposit() != null
          ? { reservationDeposit: this.reservationDeposit()! }
          : {}),
        ...(fields.showReservationDurationDays &&
        this.reservationDurationDays() != null
          ? { reservationDurationDays: this.reservationDurationDays()! }
          : {}),
        ...(fields.showAgencyCommissionRate &&
        this.agencyCommissionRate() != null
          ? { agencyCommissionRate: this.agencyCommissionRate()! }
          : {}),
        ...(fields.showSpecialClauses && this.specialClauses()
          ? { specialClauses: this.specialClauses() }
          : {}),
        ...(fields.showTerminationConditions && this.terminationConditions()
          ? { terminationConditions: this.terminationConditions() }
          : {}),
      },
    });
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────────

  contractTypeIcon(type: ContractType | null | undefined): string {
    const icons: Record<ContractType, string> = {
      LEASE: 'pi-home',
      SALE: 'pi-building-columns',
      RENT_TO_OWN: 'pi-key',
      RESERVATION: 'pi-calendar-clock',
      MANDATE: 'pi-briefcase',
    };
    return (type && icons[type]) || 'pi-file';
  }

  contractTypeLabelFor(type: ContractType | null | undefined): string {
    if (!type) return '';
    return (
      this.contractTypeOptions.find((option) => option.value === type)?.label ??
      type
    );
  }

  formatAmount(amount: number | null | undefined): string {
    if (amount == null || amount === 0) return '—';
    return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA';
  }

  private isStepValid(step: number): boolean {
    switch (step) {
      case 1:
        return this.step1Valid();
      case 2:
        return this.step2Valid();
      case 3:
        return this.step3Valid();
      case 4:
        return this.step4Valid();
      default:
        return true;
    }
  }

  private formatDisplayDate(value: ContractDateValue): string {
    if (!value) return '—';
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }).format(value);
  }

  private parseApiDate(value?: string | null): ContractDateValue {
    if (!value) return null;
    const parsed = new Date(`${value}T00:00:00`);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  private serializeDate(value: ContractDateValue): string | undefined {
    if (!value) return undefined;
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private monthsBetween(start: Date, end: Date): number {
    return Math.max(
      0,
      (end.getFullYear() - start.getFullYear()) * 12 +
        (end.getMonth() - start.getMonth()),
    );
  }

  private formatPropertyMeta(property: {
    city?: string;
    propertyType?: string;
  }): string {
    return (
      [property.city, property.propertyType]
        .filter((v): v is string => Boolean(v?.trim()))
        .map((v) => v.trim())
        .join(' · ') || 'Information indisponible'
    );
  }

  private formatTenantMeta(tenant: { email?: string; id: string }): string {
    return [tenant.email, `Ref ${tenant.id}`]
      .filter((v): v is string => Boolean(v?.trim()))
      .map((v) => v.trim())
      .join(' · ');
  }
}

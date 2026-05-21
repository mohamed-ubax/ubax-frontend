import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { form, max, min, required } from '@angular/forms/signals';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { DatePickerModule } from 'primeng/datepicker';
import { Select } from 'primeng/select';
import { InputNumberModule } from 'primeng/inputnumber';
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
type SummaryHighlight = {
  label: string;
  value: string;
  icon: string;
  tone?: 'accent' | 'default';
};
type ContractStep1Form = {
  tenantId: string;
};
type ContractStep2Form = {
  propertyId: string;
  ownerId: string;
};
type ContractStep3Form = {
  contractType: ContractType | '';
};
type ContractStep4Form = {
  startDate: string;
  endDate: string;
  paymentDay: number | null;
  durationYears: number | null;
  monthlyRent: number | null;
  salePrice: number | null;
  monthlyInstallment: number | null;
  depositAmount: number | null;
  reservationDeposit: number | null;
  reservationDurationDays: number | null;
};

const SUPPORTED_CONTRACT_TYPES = [
  'LEASE',
  'SALE',
  'RENT_TO_OWN',
  'RESERVATION',
] as const satisfies readonly ContractType[];

function isSupportedContractType(
  value: string | null | undefined,
): value is ContractType {
  return SUPPORTED_CONTRACT_TYPES.includes(value as ContractType);
}

/** Mapping transactionType → contractType recommandé */
const TRANSACTION_TO_CONTRACT_TYPE: Record<string, ContractType> = {
  RENT: 'LEASE',
  RENT_FURNISHED: 'LEASE',
  SALE: 'SALE',
  SHORT_STAY: 'RESERVATION',
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
    showDurationYears: boolean;
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
    showDurationYears: false,
    showReservationDeposit: false,
    showReservationDurationDays: false,
    showAgencyCommissionRate: false,
    showSpecialClauses: true,
    showTerminationConditions: true,
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
    showDurationYears: false,
    showReservationDeposit: false,
    showReservationDurationDays: false,
    showAgencyCommissionRate: false,
    showSpecialClauses: true,
    showTerminationConditions: false,
    showRentToOwnSummary: false,
    requiresTenant: true,
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
    showSpecialClauses: true,
    showTerminationConditions: true,
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
    showDurationYears: false,
    showReservationDeposit: true,
    showReservationDurationDays: true,
    showAgencyCommissionRate: false,
    showSpecialClauses: true,
    showTerminationConditions: false,
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
];

@Component({
  selector: 'ubax-contrats-add-page',
  standalone: true,
  imports: [
    DatePickerModule,
    Select,
    InputNumberModule,
    RouterLink,
    FormsModule,
    DetailInfoBlockComponent,
  ],
  templateUrl: './contrats-add-page.component.html',
  styleUrl: './contrats-add-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContratsAddPageComponent {
  // ─── Injections ─────────────────────────────────────────────────────────────
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

  // ─── État UI ─────────────────────────────────────────────────────────────────
  readonly currentStep = signal(1);
  readonly totalSteps = 5;
  readonly openEnded = signal(false);
  readonly rentToOwnDurationMode = signal<'years' | 'date'>('years');
  private readonly awaitingCreation = signal(false);
  private readonly knownContractIds = signal<string[]>([]);
  private readonly tenantLabelFallback = signal('');
  private readonly userEditedFields = signal<Set<string>>(new Set());
  private readonly touchedFields = signal<Set<string>>(new Set());

  readonly stepConfig: readonly StepConfig[] = CONTRATS_ADD_STEP_CONFIG;
  readonly Math = Math;

  // ─── Champs de formulaire (signals) ─────────────────────────────────────────

  // Étape 1 — Locataire
  readonly tenantId = signal('');

  // Étape 2 — Sélection du bien
  readonly propertyId = signal('');
  readonly ownerId = signal('');

  // Étape 3 — Type de contrat
  readonly contractType = signal<ContractType>('LEASE');

  // Étape 4 — Conditions financières et dates
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

  private readonly _step1 = signal<ContractStep1Form>({
    tenantId: '',
  });
  readonly formStep1 = form(this._step1, () => undefined);

  private readonly _step2 = signal<ContractStep2Form>({
    propertyId: '',
    ownerId: '',
  });
  readonly formStep2 = form(this._step2, (p) => {
    required(p.propertyId, { message: 'Le bien est requis' });
  });

  private readonly _step3 = signal<ContractStep3Form>({ contractType: '' });
  readonly formStep3 = form(this._step3, (p) => {
    required(p.contractType, { message: 'Le type de contrat est requis' });
  });

  private readonly _step4 = signal<ContractStep4Form>({
    startDate: '',
    endDate: '',
    paymentDay: 5,
    durationYears: 5,
    monthlyRent: null,
    salePrice: null,
    monthlyInstallment: null,
    depositAmount: null,
    reservationDeposit: null,
    reservationDurationDays: null,
  });
  readonly formStep4 = form(this._step4, (p) => {
    required(p.startDate, { message: 'La date de début est requise' });
    min(p.paymentDay, 1);
    max(p.paymentDay, 28);
    min(p.durationYears, 1);
    max(p.durationYears, 30);
    min(p.monthlyRent, 1);
    min(p.salePrice, 1);
    min(p.monthlyInstallment, 1);
    min(p.depositAmount, 0);
    min(p.reservationDeposit, 1);
    min(p.reservationDurationDays, 1);
  });

  // ─── Computed: codelist options ──────────────────────────────────────────────
  readonly contractTypeOptions = computed<RichSelectOption<ContractType>[]>(
    () => {
      const items = this.contractTypeCodeList();
      if (items.length > 0) {
        return items
          .filter((item): item is LaCodeListDto & { value: ContractType } =>
            isSupportedContractType(item.value),
          )
          .map((item) => ({
            value: item.value,
            label: item.description?.trim() || this.fallbackLabel(item.value),
            meta: this.contractTypeMeta(item.value),
            icon: this.contractTypeIconInternal(item.value),
          }));
      }
      return STATIC_CONTRACT_TYPE_OPTIONS;
    },
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

  readonly selectedProperty = computed(() =>
    this.biensStore
      .entities()
      .find((property) => property.id === this.propertyId()),
  );

  /** Seuls les locataires QUALIFIED — stable, aucune dépendance sur la sélection */
  readonly tenantOptions = computed<RichSelectOption[]>(() =>
    this.locationStore
      .entities()
      .filter((tenant) => Boolean(tenant.id) && tenant.status === 'QUALIFIED')
      .map((tenant) => ({
        value: tenant.id,
        label: tenant.fullName?.trim() || 'Locataire sans nom',
        meta: this.formatTenantMeta(tenant),
        icon: 'pi-user',
      })),
  );

  // ─── Computed: dérivés du formulaire ────────────────────────────────────────
  readonly contractTypeFields = computed(
    () => CONTRACT_TYPE_FIELDS[this.contractType()],
  );

  readonly tenantStepRequired = computed(
    () => CONTRACT_TYPE_FIELDS[this.contractType()].requiresTenant,
  );

  readonly visibleTotalSteps = computed(() =>
    this.tenantStepRequired() ? 5 : 4,
  );

  readonly visibleStepConfig = computed(() => {
    if (this.tenantStepRequired()) return this.stepConfig;
    return this.stepConfig.filter((s) => s.step !== 1);
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

  readonly selectedPropertyLabel = computed(() => {
    const propertyId = this.propertyId();
    if (!propertyId) return '—';
    return (
      this.propertyOptions().find((o) => o.value === propertyId)?.label ??
      propertyId
    );
  });

  readonly selectedTenantLabel = computed(() => {
    const tenantId = this.tenantId();
    if (!tenantId) return '—';

    const optionLabel = this.tenantOptions().find(
      (option) => option.value === tenantId,
    )?.label;

    return optionLabel || this.tenantLabelFallback() || tenantId;
  });

  readonly ownerDisplayName = computed(() => {
    const selectedProperty = this.selectedProperty();

    if (selectedProperty?.ownerName) return selectedProperty.ownerName;

    const user = this.authStore.user();
    const fullName = [user?.prenom, user?.nom].filter(Boolean).join(' ').trim();
    return fullName || 'Utilisateur connecté';
  });

  // ─── Computed: validation ─────────────────────────────────────────────────────
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

  readonly step4Errors = computed(() => {
    const fields = this.contractTypeFields();
    const mode = this.rentToOwnDurationMode();
    const needEndDate =
      fields.endDateRequired || (fields.showDurationYears && mode === 'date');
    return {
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
  readonly step4Valid = computed(
    () => !Object.values(this.step4Errors()).some(Boolean),
  );

  // ─── Computed: récapitulatif RENT_TO_OWN ────────────────────────────────────
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
      value: this.formatDisplayDate(this.startDate()),
    });

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

    if (fields.showMonthlyRent && this.monthlyRent() != null)
      items.push({
        label: 'Loyer mensuel',
        value: this.formatAmount(this.monthlyRent()),
      });
    if (fields.showSalePrice && this.salePrice() != null)
      items.push({
        label: 'Prix total',
        value: this.formatAmount(this.salePrice()),
      });
    if (fields.showMonthlyInstallment && this.monthlyInstallment() != null)
      items.push({
        label: 'Mensualité',
        value: this.formatAmount(this.monthlyInstallment()),
      });
    if (fields.showDepositAmount && this.depositAmount() != null)
      items.push({
        label: 'Caution / Apport',
        value: this.formatAmount(this.depositAmount()),
      });
    if (fields.showPaymentDay && this.paymentDay() != null)
      items.push({
        label: "Jour d'échéance",
        value: String(this.paymentDay()),
      });
    if (fields.showReservationDeposit && this.reservationDeposit() != null)
      items.push({
        label: 'Acompte de réservation',
        value: this.formatAmount(this.reservationDeposit()),
      });
    if (
      fields.showReservationDurationDays &&
      this.reservationDurationDays() != null
    )
      items.push({
        label: 'Durée de réservation',
        value: `${this.reservationDurationDays()} jours`,
      });
    if (fields.showAgencyCommissionRate && this.agencyCommissionRate() != null)
      items.push({
        label: 'Commission agence',
        value: `${this.agencyCommissionRate()} %`,
      });
    if (fields.showSpecialClauses && this.specialClauses())
      items.push({
        label: 'Clauses particulières',
        value: this.specialClauses(),
      });
    if (fields.showTerminationConditions && this.terminationConditions())
      items.push({
        label: 'Conditions de résiliation',
        value: this.terminationConditions(),
      });

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

  constructor() {
    this.biensStore.load?.({ pageable: {} });
    this.locationStore.loadSansContrat({});

    effect(() => {
      const visibleSteps = this.visibleStepNumbers();
      const step = this.currentStep();

      if (visibleSteps.length > 0 && !visibleSteps.includes(step)) {
        this.currentStep.set(visibleSteps[0]);
      }
    });

    effect(() => {
      this._step1.set({
        tenantId: this.tenantId(),
      });
    });

    effect(() => {
      this._step2.set({
        propertyId: this.propertyId(),
        ownerId: this.ownerId(),
      });
    });

    effect(() => {
      this._step3.set({ contractType: this.contractType() });
    });

    effect(() => {
      this._step4.set({
        startDate: this.serializeDate(this.startDate()) ?? '',
        endDate: this.serializeDate(this.endDate()) ?? '',
        paymentDay: this.paymentDay(),
        durationYears: this.durationYears(),
        monthlyRent: this.monthlyRent(),
        salePrice: this.salePrice(),
        monthlyInstallment: this.monthlyInstallment(),
        depositAmount: this.depositAmount(),
        reservationDeposit: this.reservationDeposit(),
        reservationDurationDays: this.reservationDurationDays(),
      });
    });

    effect(() => {
      const tenantId = this.tenantId();
      if (!tenantId) {
        this.tenantLabelFallback.set('');
        return;
      }

      const optionLabel = this.tenantOptions().find(
        (option) => option.value === tenantId,
      )?.label;

      if (optionLabel) {
        this.tenantLabelFallback.set(optionLabel);
      }
    });

    // Chargement du codelist CONTRACT_TYPE
    this.contractTypeCodeListLoading.set(true);
    findAllByType(this.http, this.apiConfig.rootUrl, { type: 'CONTRACT_TYPE' })
      .pipe(
        map((response) => {
          const body = response.body as unknown;
          if (Array.isArray(body)) return body as LaCodeListDto[];
          if (body && typeof body === 'object') {
            const r = body as Record<string, unknown>;
            if (Array.isArray(r['data'])) return r['data'] as LaCodeListDto[];
            if (Array.isArray(r['content']))
              return r['content'] as LaCodeListDto[];
          }
          return [] as LaCodeListDto[];
        }),
      )
      .subscribe({
        next: (items) => {
          this.contractTypeCodeList.set(items);
          this.contractTypeCodeListLoading.set(false);
        },
        error: () => {
          this.contractTypeCodeListLoading.set(false);
        },
      });

    // ── Étape 1 : Pré-remplissage du bien depuis le dossier locataire ─────────
    effect(() => {
      const tenantId = this.tenantId();
      if (!tenantId) return;

      const tenant = this.locationStore
        .entities()
        .find((t) => t.id === tenantId);
      if (!tenant?.propertyId) return;

      if (!this.userEditedFields().has('propertyId')) {
        this.propertyId.set(tenant.propertyId);
      }
    });

    // ── Étape 2 : Auto-remplissage depuis le bien sélectionné ─────────────────
    effect(() => {
      const propertyId = this.propertyId();
      if (!propertyId) {
        this.ownerId.set('');
        return;
      }

      const property = this.selectedProperty();
      if (!property) return;

      const ownerId = property.ownerId?.trim();
      if (ownerId) {
        this.ownerId.set(ownerId);
      } else {
        this.ownerId.set('');
      }

      // Suggérer le contractType recommandé selon transactionType
      const suggestedType =
        TRANSACTION_TO_CONTRACT_TYPE[property.transactionType ?? ''];
      if (suggestedType) {
        if (!this.userEditedFields().has('contractType')) {
          this.contractType.set(suggestedType);
        }
      }
    });

    // ── Étape 3 : Pré-remplissage des montants selon le type de contrat ────────
    effect(() => {
      const contractType = this.contractType();
      const propertyId = this.propertyId();
      if (!propertyId) return;

      const property = this.biensStore
        .entities()
        .find((p) => p.id === propertyId);
      if (!property) return;

      const price = property.price ?? 0;
      const today = new Date();

      switch (contractType) {
        case 'LEASE': {
          this.setIfNotEdited('monthlyRent', price || null);
          this.setIfNotEdited('depositAmount', price ? price * 2 : null);
          this.setIfNotEdited('paymentDay', 5);
          this.setIfNotEdited('startDate', today);
          const endDateLease = new Date(today);
          endDateLease.setFullYear(endDateLease.getFullYear() + 1);
          this.setIfNotEdited('endDate', endDateLease);
          break;
        }
        case 'SALE': {
          this.setIfNotEdited('salePrice', price || null);
          this.setIfNotEdited('startDate', today);
          break;
        }
        case 'RENT_TO_OWN': {
          const installment = price ? Math.round(price / 60) : null;
          this.setIfNotEdited('salePrice', price || null);
          this.setIfNotEdited('monthlyInstallment', installment);
          this.setIfNotEdited(
            'depositAmount',
            installment ? installment * 6 : null,
          );
          this.setIfNotEdited('durationYears', 5);
          this.setIfNotEdited('paymentDay', 5);
          this.setIfNotEdited('startDate', today);
          const endDateRto = new Date(today);
          endDateRto.setFullYear(endDateRto.getFullYear() + 5);
          this.setIfNotEdited('endDate', endDateRto);
          break;
        }
        case 'RESERVATION': {
          this.setIfNotEdited(
            'reservationDeposit',
            price ? Math.round(price * 0.05) : null,
          );
          this.setIfNotEdited('reservationDurationDays', 30);
          this.setIfNotEdited('startDate', today);
          break;
        }
      }
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

  // ─── Gestion du touch ────────────────────────────────────────────────────────

  touchField(name: string): void {
    this.touchedFields.update((s) => {
      const n = new Set(s);
      n.add(name);
      return n;
    });
  }

  isTouched(name: string): boolean {
    return this.touchedFields().has(name);
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
      ],
    };
    const fields = stepFields[step] ?? [];
    this.touchedFields.update((s) => {
      const n = new Set(s);
      fields.forEach((f) => n.add(f));
      return n;
    });
  }

  // ─── Gestion des champs édités manuellement ──────────────────────────────────

  markFieldEdited(fieldName: string): void {
    this.userEditedFields.update((s) => {
      const n = new Set(s);
      n.add(fieldName);
      return n;
    });
  }

  // ─── Navigation ──────────────────────────────────────────────────────────────

  toggleRentToOwnDurationMode(mode: 'years' | 'date'): void {
    this.rentToOwnDurationMode.set(mode);
  }

  nextStep(): void {
    const step = this.currentStep();
    this.touchStep(step);

    if (!this.isStepValid(step)) return;

    const steps = this.visibleStepNumbers();
    const currentIndex = steps.indexOf(step);
    if (currentIndex !== -1 && currentIndex < steps.length - 1) {
      this.currentStep.set(steps[currentIndex + 1]);
    }
  }

  prevStep(): void {
    const steps = this.visibleStepNumbers();
    const currentIndex = steps.indexOf(this.currentStep());
    if (currentIndex > 0) {
      this.currentStep.set(steps[currentIndex - 1]);
    }
  }

  // ─── Soumission ──────────────────────────────────────────────────────────────

  submit(): void {
    [1, 2, 3, 4].forEach((s) => this.touchStep(s));

    const allValid =
      this.step1Valid() &&
      this.step2Valid() &&
      this.step3Valid() &&
      this.step4Valid();

    if (!allValid) return;

    const startDate = this.serializeDate(this.startDate());
    if (!startDate) return;

    const fields = CONTRACT_TYPE_FIELDS[this.contractType()];
    let endDate: string | undefined;
    let durationYears: number | undefined;

    if (fields.showDurationYears) {
      if (this.rentToOwnDurationMode() === 'years') {
        durationYears = this.durationYears() ?? 5;
      } else {
        endDate = this.serializeDate(this.endDate());
      }
    } else if (
      fields.endDateRequired ||
      (!this.openEnded() && fields.showEndDate)
    ) {
      endDate = this.serializeDate(this.endDate());
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

    const body: CreateContractRequest = {
      tenantId: this.tenantId() || undefined,
      propertyId: this.propertyId(),
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
      ...(fields.showSpecialClauses && this.specialClauses()
        ? { specialClauses: this.specialClauses() }
        : {}),
      ...(fields.showTerminationConditions && this.terminationConditions()
        ? { terminationConditions: this.terminationConditions() }
        : {}),
    };

    createContract({ body });
  }

  // ─── Helpers exposés au template ────────────────────────────────────────────

  contractTypeIcon(type: ContractType | null | undefined): string {
    if (!type) return 'pi-file';
    return this.contractTypeIconInternal(type);
  }

  contractTypeLabelFor(type: ContractType | null | undefined): string {
    if (!type) return '';
    return (
      this.contractTypeOptions().find((o) => o.value === type)?.label ??
      this.fallbackLabel(type)
    );
  }

  formatAmount(amount: number | null | undefined): string {
    if (amount == null || amount === 0) return '—';
    return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA';
  }

  // ─── Helpers privés ──────────────────────────────────────────────────────────

  private setIfNotEdited(fieldName: string, value: unknown): void {
    if (this.userEditedFields().has(fieldName)) return;
    switch (fieldName) {
      case 'startDate':
        this.startDate.set(value as ContractDateValue);
        break;
      case 'endDate':
        this.endDate.set(value as ContractDateValue);
        break;
      case 'monthlyRent':
        this.monthlyRent.set(value as number | null);
        break;
      case 'depositAmount':
        this.depositAmount.set(value as number | null);
        break;
      case 'paymentDay':
        this.paymentDay.set(value as number | null);
        break;
      case 'salePrice':
        this.salePrice.set(value as number | null);
        break;
      case 'monthlyInstallment':
        this.monthlyInstallment.set(value as number | null);
        break;
      case 'durationYears':
        this.durationYears.set(value as number | null);
        break;
      case 'reservationDeposit':
        this.reservationDeposit.set(value as number | null);
        break;
      case 'reservationDurationDays':
        this.reservationDurationDays.set(value as number | null);
        break;
      case 'specialClauses':
        this.specialClauses.set(value as string);
        break;
      case 'terminationConditions':
        this.terminationConditions.set(value as string);
        break;
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
    };
    return labels[type] ?? type;
  }

  private contractTypeMeta(type: ContractType): string {
    const metas: Record<ContractType, string> = {
      LEASE: 'Loyer mensuel et échéances régulières',
      SALE: 'Cession définitive du bien',
      RENT_TO_OWN: 'Mensualités imputées sur le prix total du bien',
      RESERVATION: 'Blocage temporaire du bien',
    };
    return metas[type] ?? '';
  }

  private contractTypeIconInternal(type: ContractType): string {
    const icons: Record<ContractType, string> = {
      LEASE: 'pi-home',
      SALE: 'pi-building-columns',
      RENT_TO_OWN: 'pi-key',
      RESERVATION: 'pi-calendar-clock',
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

  private formatTenantMeta(tenant: { email?: string; id: string }): string {
    const segments = [tenant.email, `Ref ${tenant.id}`]
      .filter((value): value is string => Boolean(value?.trim()))
      .map((value) => value.trim());
    return segments.join(' · ');
  }
}

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
import { StatusBadgeComponent } from '@ubax-workspace/shared-design-system';
import type { CreateContractRequest } from '@ubax-workspace/shared-api-types';
import {
  NOTIFICATION_HANDLER,
  type NotificationHandler,
} from '@ubax-workspace/shared-data-access';
import { deriveViewState, type ViewState } from '@ubax-workspace/shared-ui';
import { ContratsSkeletonComponent } from '../../components/contrats-skeleton/contrats-skeleton.component';

type ContractType = NonNullable<CreateContractRequest['contractType']>;
type ContractDateValue = Date | null;
type RichSelectOption<T extends string = string> = {
  value: T;
  label: string;
  meta?: string;
  icon: string;
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
  { value: 'LEASE', label: 'Bail location', meta: 'Loyer mensuel et échéances régulières', icon: 'pi-home' },
  { value: 'SALE', label: 'Vente', meta: 'Cession définitive du bien', icon: 'pi-building-columns' },
  { value: 'RENT_TO_OWN', label: 'Location-vente', meta: 'Mensualités imputées sur le prix total du bien', icon: 'pi-key' },
  { value: 'RESERVATION', label: 'Réservation', meta: 'Blocage temporaire du bien', icon: 'pi-calendar-clock' },
  { value: 'MANDATE', label: 'Mandat', meta: 'Gestion ou commercialisation pour le compte du propriétaire', icon: 'pi-briefcase' },
];

@Component({
  selector: 'ubax-contrats-edit-page',
  standalone: true,
  imports: [
    DatePickerModule,
    Select,
    RouterLink,
    FormsModule,
    StatusBadgeComponent,
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
  private readonly hasLoaded = signal(false);
  private readonly awaitingSave = signal(false);
  readonly openEnded = signal(false);
  readonly rentToOwnDurationMode = signal<'years' | 'date'>('years');
  private readonly touchedFields = signal<Set<string>>(new Set());

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

  readonly ownerDisplayName = computed(() => {
    const user = this.authStore.user();
    const fullName = [user?.prenom, user?.nom].filter(Boolean).join(' ').trim();
    return fullName || this.store.selectedItem()?.ownerName || 'Utilisateur connecté';
  });

  // ─── Computed: dynamic fields ─────────────────────────────────────────────────
  readonly contractTypeFields = computed(
    () => CONTRACT_TYPE_FIELDS[this.contractType()],
  );

  // ─── Computed: validation ─────────────────────────────────────────────────────
  readonly formErrors = computed(() => {
    const fields = this.contractTypeFields();
    const mode = this.rentToOwnDurationMode();
    const needEndDate =
      fields.endDateRequired || (fields.showDurationYears && mode === 'date');
    return {
      propertyId: !this.propertyId(),
      contractType: !this.contractType(),
      tenantId: fields.requiresTenant && !this.tenantId(),
      startDate: !this.startDate(),
      monthlyRent: fields.showMonthlyRent && (!this.monthlyRent() || this.monthlyRent()! < 1),
      salePrice: fields.showSalePrice && (!this.salePrice() || this.salePrice()! < 1),
      monthlyInstallment:
        fields.showMonthlyInstallment &&
        (!this.monthlyInstallment() || this.monthlyInstallment()! < 1),
      depositAmount: fields.showDepositAmount && this.depositAmount() == null,
      paymentDay:
        fields.showPaymentDay &&
        (!this.paymentDay() || this.paymentDay()! < 1 || this.paymentDay()! > 28),
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
        (!this.reservationDurationDays() || this.reservationDurationDays()! < 1),
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
        if (extra['salePrice'] != null) this.salePrice.set(extra['salePrice'] as number);
        if (extra['monthlyInstallment'] != null) this.monthlyInstallment.set(extra['monthlyInstallment'] as number);
        if (extra['reservationDeposit'] != null) this.reservationDeposit.set(extra['reservationDeposit'] as number);
        if (extra['reservationDurationDays'] != null) this.reservationDurationDays.set(extra['reservationDurationDays'] as number);
        if (extra['durationYears'] != null) this.durationYears.set(extra['durationYears'] as number);
        if (!c.endDate) this.openEnded.set(true);
      }
    });

    // Owner auto-fill
    effect(() => {
      if (this.ownerId().trim()) return;
      const authUserId = this.authStore.user()?.id?.trim() ?? '';
      const fallbackOwnerId = this.store.selectedItem()?.ownerId?.trim() ?? '';
      const next = authUserId || fallbackOwnerId;
      if (next) this.ownerId.set(next);
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

  private touchAll(): void {
    const all = [
      'propertyId', 'contractType', 'tenantId', 'startDate', 'endDate',
      'monthlyRent', 'salePrice', 'monthlyInstallment', 'depositAmount',
      'paymentDay', 'durationYears', 'reservationDeposit', 'reservationDurationDays',
      'agencyCommissionRate',
    ];
    this.touchedFields.update(() => new Set(all));
  }

  toggleRentToOwnDurationMode(mode: 'years' | 'date'): void {
    this.rentToOwnDurationMode.set(mode);
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
        tenantId: fields.requiresTenant ? (this.tenantId() || undefined) : undefined,
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
        ...(fields.showReservationDurationDays && this.reservationDurationDays() != null
          ? { reservationDurationDays: this.reservationDurationDays()! }
          : {}),
        ...(fields.showAgencyCommissionRate && this.agencyCommissionRate() != null
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

  formatAmount(amount: number | null | undefined): string {
    if (amount == null || amount === 0) return '—';
    return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA';
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

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

@Component({
  selector: 'ubax-contrats-edit-page',
  standalone: true,
  imports: [
    DatePickerModule,
    Select,
    RouterLink,
    ReactiveFormsModule,
    FormsModule,
    StatusBadgeComponent,
    ContratsSkeletonComponent,
  ],
  templateUrl: './contrats-edit-page.component.html',
  styleUrl: './contrats-edit-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContratsEditPageComponent {
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
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly notifications = inject<NotificationHandler | null>(
    NOTIFICATION_HANDLER,
    { optional: true },
  );

  private readonly contractId = toSignal(
    this.route.paramMap.pipe(map((p) => p.get('id') ?? '')),
    { initialValue: '' },
  );

  private readonly hasLoaded = signal(false);
  private readonly awaitingSave = signal(false);
  readonly openEnded = signal(false);

  readonly editForm = this.fb.group({
    propertyId: ['', Validators.required],
    ownerId: ['', Validators.required],
    tenantId: [''],
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
    const selectedTenantId = this.editForm.controls.tenantId.value;

    return this.locationStore
      .entities()
      .filter(
        (tenant) =>
          Boolean(tenant.id) &&
          (tenant.status === 'QUALIFIED' || tenant.id === selectedTenantId),
      )
      .map((tenant) => ({
        value: tenant.id,
        label: tenant.fullName?.trim() || 'Locataire sans nom',
        meta: this.formatTenantMeta(tenant),
        icon: 'pi-user',
      }));
  });

  readonly ownerDisplayName = computed(() => {
    const user = this.authStore.user();
    const fullName = [user?.prenom, user?.nom].filter(Boolean).join(' ').trim();

    if (fullName) return fullName;

    return this.store.selectedItem()?.ownerName ?? 'Utilisateur connecté';
  });

  readonly viewState = computed<ViewState>(() => {
    const c = this.store.selectedItem();
    // Guard: only DRAFT can be edited
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

    // Pre-fill form when contract loads
    effect(() => {
      const c = this.store.selectedItem();
      if (c && !this.store.loading()) {
        this.hasLoaded.set(true);
        this.editForm.patchValue({
          propertyId: c.propertyId ?? '',
          ownerId: c.ownerId ?? '',
          tenantId: c.tenantId ?? '',
          contractType: c.contractType ?? 'LEASE',
          monthlyRent: c.monthlyRent ?? 0,
          depositAmount: c.depositAmount ?? 0,
          paymentDay: c.paymentDay ?? 5,
          startDate: this.parseApiDate(c.startDate),
          endDate: this.parseApiDate(c.endDate),
        });
        if (!c.endDate) this.openEnded.set(true);
      }
    });

    effect(() => {
      const currentOwnerId = this.editForm.controls.ownerId.value.trim();
      if (currentOwnerId) {
        return;
      }

      const authUserId = this.authStore.user()?.id?.trim() ?? '';
      const fallbackOwnerId = this.store.selectedItem()?.ownerId?.trim() ?? '';
      const nextOwnerId = authUserId || fallbackOwnerId;

      if (nextOwnerId) {
        this.editForm.controls.ownerId.setValue(nextOwnerId);
      }
    });

    // Redirect after successful update
    effect(() => {
      if (!this.awaitingSave()) {
        return;
      }

      if (this.store.saving()) {
        return;
      }

      if (this.store.error()) {
        this.awaitingSave.set(false);
        return;
      }

      this.awaitingSave.set(false);
      this.notifications?.success('Contrat modifie avec succes');
      this.router.navigate(['/contrats', this.contractId()]);
    });
  }

  backToContracts(): void {
    void this.router.navigate(['/contrats']);
  }

  save(): void {
    if (this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      return;
    }

    const id = this.contractId();
    const v = this.editForm.getRawValue();
    const startDate = this.serializeDate(v.startDate);

    if (!startDate) {
      this.editForm.controls.startDate.markAsTouched();
      return;
    }

    this.awaitingSave.set(true);

    this.store.update!({
      id,
      body: {
        propertyId: v.propertyId,
        ownerId: v.ownerId,
        tenantId: v.tenantId || undefined,
        contractType: v.contractType,
        monthlyRent: v.monthlyRent,
        depositAmount: v.depositAmount,
        paymentDay: v.paymentDay,
        startDate,
        endDate: this.openEnded() ? undefined : this.serializeDate(v.endDate),
      },
    });
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

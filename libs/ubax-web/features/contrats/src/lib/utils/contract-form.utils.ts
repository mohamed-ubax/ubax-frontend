import type { InfoItem } from '@ubax-workspace/shared-design-system';
import type {
  CreateContractRequest,
  LaCodeListDto,
} from '@ubax-workspace/shared-api-types';
import type { StepConfig } from '../types/contrats-add.types';

export type ContractType = NonNullable<CreateContractRequest['contractType']>;
export type ContractDateValue = Date | null;
export type ContractDurationMode = 'years' | 'date';

export type RichSelectOption<T extends string = string> = {
  value: T;
  label: string;
  meta?: string;
  icon: string;
};

export type SummaryHighlight = {
  label: string;
  value: string;
  icon: string;
  tone?: 'accent' | 'default';
};

export type ContractTypeFieldConfig = {
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
  showSpecialClauses: boolean;
  showTerminationConditions: boolean;
  showRentToOwnSummary: boolean;
  requiresTenant: boolean;
};

export type ContractSummarySnapshot = {
  contractType: ContractType;
  selectedPropertyLabel: string;
  ownerDisplayName: string;
  selectedTenantLabel: string;
  startDate: ContractDateValue;
  endDate: ContractDateValue;
  openEnded: boolean;
  rentToOwnDurationMode: ContractDurationMode;
  durationYears: number | null;
  monthlyRent: number | null;
  salePrice: number | null;
  monthlyInstallment: number | null;
  depositAmount: number | null;
  paymentDay: number | null;
  reservationDeposit: number | null;
  reservationDurationDays: number | null;
  specialClauses: string;
  terminationConditions: string;
};

export type ContractRequestSnapshot = {
  tenantId: string;
  propertyId: string;
  contractType: ContractType;
  startDate: ContractDateValue;
  endDate: ContractDateValue;
  openEnded: boolean;
  rentToOwnDurationMode: ContractDurationMode;
  durationYears: number | null;
  monthlyRent: number | null;
  salePrice: number | null;
  monthlyInstallment: number | null;
  depositAmount: number | null;
  paymentDay: number | null;
  reservationDeposit: number | null;
  reservationDurationDays: number | null;
  specialClauses: string;
  terminationConditions: string;
};

export type ContractAutoFillValues = Partial<
  Pick<
    ContractRequestSnapshot,
    | 'startDate'
    | 'endDate'
    | 'durationYears'
    | 'monthlyRent'
    | 'depositAmount'
    | 'paymentDay'
    | 'salePrice'
    | 'monthlyInstallment'
    | 'reservationDeposit'
    | 'reservationDurationDays'
  >
>;

export const TRANSACTION_TO_CONTRACT_TYPE: Partial<
  Record<string, ContractType>
> = {
  RENT: 'LEASE',
  RENT_FURNISHED: 'LEASE',
  SALE: 'SALE',
  SHORT_STAY: 'RESERVATION',
};

export const CONTRACT_TYPE_FIELDS: Record<
  ContractType,
  ContractTypeFieldConfig
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
    showSpecialClauses: true,
    showTerminationConditions: false,
    showRentToOwnSummary: false,
    requiresTenant: false,
  },
};

export const CONTRACT_STEP_CONFIG: readonly StepConfig[] = [
  {
    step: 1,
    icon: 'pi-user',
    title: 'Locataire ou acheteur',
    desc: 'Choisissez un dossier KYC qualifié éligible.',
  },
  {
    step: 2,
    icon: 'pi-home',
    title: 'Sélection du bien',
    desc: 'Choisissez le bien et affichez son propriétaire.',
  },
  {
    step: 3,
    icon: 'pi-file-edit',
    title: 'Type de contrat',
    desc: 'Sélectionnez le contrat adapté au bien.',
  },
  {
    step: 4,
    icon: 'pi-calendar',
    title: 'Conditions',
    desc: 'Montants, dates et clauses contractuelles.',
  },
  {
    step: 5,
    icon: 'pi-check-circle',
    title: 'Récapitulatif',
    desc: 'Vérifiez puis confirmez la création ou la modification.',
  },
];

export const STATIC_CONTRACT_TYPE_OPTIONS: RichSelectOption<ContractType>[] = [
  {
    value: 'LEASE',
    label: 'Bail de location',
    meta: 'Loyer mensuel, dépôt de garantie et échéance récurrente',
    icon: 'pi-home',
  },
  {
    value: 'SALE',
    label: 'Vente',
    meta: 'Cession du bien avec dossier acheteur obligatoire',
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
    meta: 'Blocage temporaire du bien avec acompte',
    icon: 'pi-calendar-clock',
  },
];

export function contractTypeIcon(type: ContractType): string {
  return (
    STATIC_CONTRACT_TYPE_OPTIONS.find((option) => option.value === type)
      ?.icon ?? 'pi-file'
  );
}

export function contractTypeMeta(type: ContractType): string {
  return (
    STATIC_CONTRACT_TYPE_OPTIONS.find((option) => option.value === type)
      ?.meta ?? type
  );
}

export function fallbackContractTypeLabel(type: ContractType): string {
  return (
    STATIC_CONTRACT_TYPE_OPTIONS.find((option) => option.value === type)
      ?.label ?? type
  );
}

export function buildContractTypeOptions(
  items: readonly LaCodeListDto[],
): RichSelectOption<ContractType>[] {
  if (items.length === 0) {
    return STATIC_CONTRACT_TYPE_OPTIONS;
  }

  return items
    .filter((item): item is LaCodeListDto & { value: ContractType } =>
      STATIC_CONTRACT_TYPE_OPTIONS.some(
        (option) => option.value === item.value,
      ),
    )
    .map((item) => ({
      value: item.value,
      label: item.description?.trim() || fallbackContractTypeLabel(item.value),
      meta: contractTypeMeta(item.value),
      icon: contractTypeIcon(item.value),
    }));
}

export function serializeDate(value: ContractDateValue): string | undefined {
  if (!value) {
    return undefined;
  }

  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseApiDate(value?: string | null): ContractDateValue {
  if (!value) {
    return null;
  }

  const parsed = new Date(`${value}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function monthsBetween(start: Date, end: Date): number {
  return Math.max(
    0,
    (end.getFullYear() - start.getFullYear()) * 12 +
      (end.getMonth() - start.getMonth()),
  );
}

export function resolveContractAutoFill(
  contractType: ContractType,
  propertyPrice: number | null | undefined,
  now = new Date(),
): ContractAutoFillValues {
  const price = propertyPrice ?? 0;
  const startDate = new Date(now);

  if (contractType === 'LEASE') {
    const endDate = new Date(startDate);
    endDate.setFullYear(endDate.getFullYear() + 1);
    return {
      startDate,
      endDate,
      monthlyRent: price || null,
      depositAmount: price ? price * 2 : null,
      paymentDay: 5,
    };
  }

  if (contractType === 'SALE') {
    return {
      startDate,
      salePrice: price || null,
    };
  }

  if (contractType === 'RENT_TO_OWN') {
    const monthlyInstallment = price ? Math.round(price / 60) : null;
    const endDate = new Date(startDate);
    endDate.setFullYear(endDate.getFullYear() + 5);
    return {
      startDate,
      endDate,
      durationYears: 5,
      salePrice: price || null,
      monthlyInstallment,
      depositAmount: monthlyInstallment ? monthlyInstallment * 6 : null,
      paymentDay: 5,
    };
  }

  return {
    startDate,
    reservationDeposit: price ? Math.round(price * 0.05) : null,
    reservationDurationDays: 30,
  };
}

export function buildContractRequest(
  snapshot: ContractRequestSnapshot,
): CreateContractRequest | null {
  const startDate = serializeDate(snapshot.startDate);

  if (!startDate || !snapshot.propertyId) {
    return null;
  }

  const fields = CONTRACT_TYPE_FIELDS[snapshot.contractType];
  const body: CreateContractRequest = {
    propertyId: snapshot.propertyId,
    contractType: snapshot.contractType,
    startDate,
  };

  if (fields.requiresTenant && snapshot.tenantId) {
    body.tenantId = snapshot.tenantId;
  }

  if (fields.showDurationYears) {
    if (snapshot.rentToOwnDurationMode === 'years') {
      if (snapshot.durationYears != null) {
        body.durationYears = snapshot.durationYears;
      }
    } else {
      const endDate = serializeDate(snapshot.endDate);
      if (endDate) {
        body.endDate = endDate;
      }
    }
  } else if (fields.showEndDate && !snapshot.openEnded) {
    const endDate = serializeDate(snapshot.endDate);
    if (endDate) {
      body.endDate = endDate;
    }
  }

  if (fields.showMonthlyRent && snapshot.monthlyRent != null) {
    body.monthlyRent = snapshot.monthlyRent;
  }
  if (fields.showSalePrice && snapshot.salePrice != null) {
    body.salePrice = snapshot.salePrice;
  }
  if (fields.showMonthlyInstallment && snapshot.monthlyInstallment != null) {
    body.monthlyInstallment = snapshot.monthlyInstallment;
  }
  if (fields.showDepositAmount && snapshot.depositAmount != null) {
    body.depositAmount = snapshot.depositAmount;
  }
  if (fields.showPaymentDay && snapshot.paymentDay != null) {
    body.paymentDay = snapshot.paymentDay;
  }
  if (fields.showReservationDeposit && snapshot.reservationDeposit != null) {
    body.reservationDeposit = snapshot.reservationDeposit;
  }
  if (
    fields.showReservationDurationDays &&
    snapshot.reservationDurationDays != null
  ) {
    body.reservationDurationDays = snapshot.reservationDurationDays;
  }

  const specialClauses = snapshot.specialClauses.trim();
  if (fields.showSpecialClauses && specialClauses) {
    body.specialClauses = specialClauses;
  }

  const terminationConditions = snapshot.terminationConditions.trim();
  if (fields.showTerminationConditions && terminationConditions) {
    body.terminationConditions = terminationConditions;
  }

  return body;
}

export function buildSummaryItems(
  snapshot: ContractSummarySnapshot,
  formatAmount: (value: number | null | undefined) => string,
  formatDisplayDate: (value: ContractDateValue) => string,
  resolveTypeLabel: (type: ContractType) => string,
): InfoItem[] {
  const fields = CONTRACT_TYPE_FIELDS[snapshot.contractType];
  const durationItems = !fields.showEndDate
    ? []
    : snapshot.contractType === 'RENT_TO_OWN' &&
        snapshot.rentToOwnDurationMode === 'years'
      ? [
          {
            label: 'Durée',
            value: `${snapshot.durationYears ?? 5} an(s)`,
          },
        ]
      : [
          {
            label: 'Date de fin',
            value:
              snapshot.contractType === 'LEASE' && snapshot.openEnded
                ? 'Durée indéterminée'
                : formatDisplayDate(snapshot.endDate),
          },
        ];

  return [
    { label: 'Bien', value: snapshot.selectedPropertyLabel },
    { label: 'Propriétaire', value: snapshot.ownerDisplayName },
    ...(fields.requiresTenant
      ? [{ label: 'Locataire', value: snapshot.selectedTenantLabel }]
      : []),
    {
      label: 'Type de contrat',
      value: resolveTypeLabel(snapshot.contractType),
    },
    {
      label: 'Date de début',
      value: formatDisplayDate(snapshot.startDate),
    },
    ...durationItems,
    ...(fields.showMonthlyRent && snapshot.monthlyRent != null
      ? [
          {
            label: 'Loyer mensuel',
            value: formatAmount(snapshot.monthlyRent),
          },
        ]
      : []),
    ...(fields.showSalePrice && snapshot.salePrice != null
      ? [
          {
            label: 'Prix total',
            value: formatAmount(snapshot.salePrice),
          },
        ]
      : []),
    ...(fields.showMonthlyInstallment && snapshot.monthlyInstallment != null
      ? [
          {
            label: 'Mensualité',
            value: formatAmount(snapshot.monthlyInstallment),
          },
        ]
      : []),
    ...(fields.showDepositAmount && snapshot.depositAmount != null
      ? [
          {
            label: 'Caution / Apport',
            value: formatAmount(snapshot.depositAmount),
          },
        ]
      : []),
    ...(fields.showPaymentDay && snapshot.paymentDay != null
      ? [
          {
            label: "Jour d'échéance",
            value: String(snapshot.paymentDay),
          },
        ]
      : []),
    ...(fields.showReservationDeposit && snapshot.reservationDeposit != null
      ? [
          {
            label: 'Acompte de réservation',
            value: formatAmount(snapshot.reservationDeposit),
          },
        ]
      : []),
    ...(fields.showReservationDurationDays &&
    snapshot.reservationDurationDays != null
      ? [
          {
            label: 'Durée de réservation',
            value: `${snapshot.reservationDurationDays} jours`,
          },
        ]
      : []),
    ...(fields.showSpecialClauses && snapshot.specialClauses.trim()
      ? [
          {
            label: 'Clauses particulières',
            value: snapshot.specialClauses.trim(),
          },
        ]
      : []),
    ...(fields.showTerminationConditions &&
    snapshot.terminationConditions.trim()
      ? [
          {
            label: 'Conditions de résiliation',
            value: snapshot.terminationConditions.trim(),
          },
        ]
      : []),
  ];
}

export function buildSummaryHighlights(
  snapshot: ContractSummarySnapshot,
  resolveTypeLabel: (type: ContractType) => string,
  formatAmount: (value: number | null | undefined) => string,
  formatDisplayDate: (value: ContractDateValue) => string,
): SummaryHighlight[] {
  const fields = CONTRACT_TYPE_FIELDS[snapshot.contractType];
  const highlights: SummaryHighlight[] = [
    {
      label: 'Type',
      value: resolveTypeLabel(snapshot.contractType),
      icon: contractTypeIcon(snapshot.contractType),
      tone: 'accent',
    },
    {
      label: fields.requiresTenant ? 'Locataire' : 'Partie ciblée',
      value: fields.requiresTenant
        ? snapshot.selectedTenantLabel
        : snapshot.ownerDisplayName,
      icon: fields.requiresTenant ? 'pi-user' : 'pi-briefcase',
    },
    {
      label: 'Démarrage',
      value: formatDisplayDate(snapshot.startDate),
      icon: 'pi-calendar',
    },
  ];

  if (fields.showMonthlyRent && snapshot.monthlyRent != null) {
    highlights.push({
      label: 'Loyer',
      value: formatAmount(snapshot.monthlyRent),
      icon: 'pi-wallet',
    });
  } else if (
    fields.showMonthlyInstallment &&
    snapshot.monthlyInstallment != null
  ) {
    highlights.push({
      label: 'Mensualité',
      value: formatAmount(snapshot.monthlyInstallment),
      icon: 'pi-wallet',
    });
  } else if (fields.showSalePrice && snapshot.salePrice != null) {
    highlights.push({
      label: 'Prix',
      value: formatAmount(snapshot.salePrice),
      icon: 'pi-building-columns',
    });
  } else if (
    fields.showReservationDeposit &&
    snapshot.reservationDeposit != null
  ) {
    highlights.push({
      label: 'Acompte',
      value: formatAmount(snapshot.reservationDeposit),
      icon: 'pi-wallet',
    });
  }

  return highlights;
}

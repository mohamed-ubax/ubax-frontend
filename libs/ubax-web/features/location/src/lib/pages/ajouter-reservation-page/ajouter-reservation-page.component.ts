import {
  ChangeDetectionStrategy,
  Component,
  computed,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DatePickerModule } from 'primeng/datepicker';
import { SelectModule } from 'primeng/select';

type RoomType = 'chambre' | 'conference' | 'evenement';
type DiscountType = 'none' | '5' | '10' | '15' | '30' | 'promo';
type ExtraOption = {
  id: string;
  label: string;
  selected: boolean;
  custom?: boolean;
};
type PaymentMethod = {
  label: string;
  value: string;
  logoSrc?: string;
  badge?: string;
};

const DAY_IN_MS = 24 * 60 * 60 * 1000;
const MONTH_NAMES = [
  'Janvier',
  'Fevrier',
  'Mars',
  'Avril',
  'Mai',
  'Juin',
  'Juillet',
  'Aout',
  'Septembre',
  'Octobre',
  'Novembre',
  'Decembre',
];
const DEFAULT_EXTRA_OPTIONS = [
  'Petit dejeuner inclus',
  'Navette aeroport',
  'Lit supplementaire',
  'Room service',
  'Coffre-fort',
  'Television ecran plat',
  'Bureau de travail',
  'Service de menage quotidien',
  'Piscine',
  'Mini-bar',
  'Check in anticipe',
  'Salle de bain privee',
  'Baignoire',
  'Parking gratuit',
];

function createDate(year: number, month: number, day: number): Date {
  return new Date(year, month - 1, day);
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date: Date, days: number): Date {
  const next = startOfDay(date);
  next.setDate(next.getDate() + days);
  return next;
}

@Component({
  selector: 'ubax-ajouter-reservation-page',
  standalone: true,
  imports: [RouterLink, FormsModule, DatePickerModule, SelectModule],
  templateUrl: './ajouter-reservation-page.component.html',
  styleUrl: './ajouter-reservation-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AjouterReservationPageComponent {
  currentStep = signal(1);

  // Step 1
  roomType = signal<RoomType>('chambre');
  nom = signal('');
  prenom = signal('');
  telephone = signal('');
  email = signal('');
  uploadedDocs = signal(['Passeport', 'Facture']);

  // Step 2
  arrivalDate = signal(createDate(2026, 7, 15));
  departureDate = signal(createDate(2026, 7, 17));
  adults = signal(2);
  children = signal(0);
  adultRate = signal(20);

  // Step 3
  extraOptions = signal<ExtraOption[]>(
    DEFAULT_EXTRA_OPTIONS.map((label, index) => ({
      id: `option-${index + 1}`,
      label,
      selected: false,
    })),
  );
  newOptionLabel = signal('');

  // Step 4
  discount = signal<DiscountType>('none');
  promoCode = signal('');
  taxes = signal(0);
  selectedPaymentMethod = signal('wave');

  readonly BASE_NIGHT_PRICE = 45_000;

  readonly STEP_LABELS = [
    'Informations client',
    'Détails du séjour',
    'Options supplémentaires',
    'Tarification et paiement',
    'Récapitulatif',
  ];

  readonly SIDEBAR_TITLES = [
    'Ajout réservation',
    'Détails du séjour',
    'Options supplémentaires',
    'Tarification et paiement',
    'Récapitulatif',
  ];

  readonly paymentMethods: PaymentMethod[] = [
    {
      label: 'Wave',
      value: 'wave',
      logoSrc: 'client-detail/icons/wave-logo.webp',
    },
    {
      label: 'Orange Money',
      value: 'orange-money',
      badge: 'OM',
    },
    {
      label: 'MTN Money',
      value: 'mtn-money',
      badge: 'MTN',
    },
    {
      label: 'Visa',
      value: 'visa',
      badge: 'V',
    },
  ];

  readonly roomPreviewImg =
    'https://www.figma.com/api/mcp/asset/118a55c9-7936-41df-89b5-be684fc45dd5';

  readonly roomPhotos = [
    'https://www.figma.com/api/mcp/asset/67d222df-23aa-4e25-8acd-c3fedd0abd68',
    'https://www.figma.com/api/mcp/asset/b854eabc-1ef0-4e74-bf67-d13c581e6feb',
    'https://www.figma.com/api/mcp/asset/4b37b6d8-78d3-49e2-bccf-7a8b52d29f70',
    'https://www.figma.com/api/mcp/asset/67d222df-23aa-4e25-8acd-c3fedd0abd68',
    'https://www.figma.com/api/mcp/asset/b854eabc-1ef0-4e74-bf67-d13c581e6feb',
    'https://www.figma.com/api/mcp/asset/4b37b6d8-78d3-49e2-bccf-7a8b52d29f70',
  ];

  // Computed
  readonly sidebarTitle = computed(
    () => this.SIDEBAR_TITLES[this.currentStep() - 1],
  );
  readonly nights = computed(() => {
    const diff =
      startOfDay(this.departureDate()).getTime() -
      startOfDay(this.arrivalDate()).getTime();
    return Math.max(1, Math.round(diff / DAY_IN_MS));
  });
  readonly minDepartureDate = computed(() => addDays(this.arrivalDate(), 1));
  readonly formattedArrivalDate = computed(() =>
    this.formatLongDate(this.arrivalDate()),
  );
  readonly formattedDepartureDate = computed(() =>
    this.formatLongDate(this.departureDate()),
  );
  readonly stayPeriodLabel = computed(
    () => `${this.formattedArrivalDate()} – ${this.formattedDepartureDate()}`,
  );
  readonly canAddOption = computed(
    () => this.normalizeOptionLabel(this.newOptionLabel()).length > 0,
  );

  readonly adultsTotal = computed(
    () => this.BASE_NIGHT_PRICE * this.adults() * this.nights(),
  );
  readonly childrenNightPrice = computed(() =>
    Math.round((this.BASE_NIGHT_PRICE * this.adultRate()) / 100),
  );
  readonly childrenTotal = computed(
    () => this.childrenNightPrice() * this.children() * this.nights(),
  );
  readonly subtotal = computed(() => this.adultsTotal() + this.childrenTotal());
  readonly discountAmount = computed(() => {
    const pct =
      this.discount() === '5'
        ? 0.05
        : this.discount() === '10'
          ? 0.1
          : this.discount() === '15'
            ? 0.15
            : this.discount() === '30'
              ? 0.3
              : 0;
    return Math.round(this.subtotal() * pct);
  });
  readonly totalToPay = computed(
    () => this.subtotal() + this.taxes() - this.discountAmount(),
  );
  readonly perNight = computed(() =>
    Math.round(this.subtotal() / Math.max(this.nights(), 1)),
  );

  readonly sliderPercent = computed(() => ((this.adultRate() - 20) / 40) * 100);
  readonly sliderBg = computed(() => {
    const p = this.sliderPercent();
    return `linear-gradient(to right, #e87d1e 0%, #e87d1e ${p}%, #1a3047 ${p}%, #1a3047 100%)`;
  });

  // Carousel step 5
  photoOffset = signal(0);
  readonly photosTranslate = computed(() => {
    const step = 310 + 14; // photo width + gap
    return `translateX(-${this.photoOffset() * step}px)`;
  });

  readonly selectedOptionNames = computed(() =>
    this.extraOptions()
      .filter((option) => option.selected)
      .map((option) => option.label)
      .join(', '),
  );

  nextStep(): void {
    if (this.currentStep() < 5) this.currentStep.update((s) => s + 1);
  }

  prevStep(): void {
    if (this.currentStep() > 1) this.currentStep.update((s) => s - 1);
  }

  removeDoc(index: number): void {
    this.uploadedDocs.update((docs) => docs.filter((_, i) => i !== index));
  }

  onArrivalDateChange(value: Date | null | undefined): void {
    if (!(value instanceof Date)) {
      return;
    }

    const nextArrival = startOfDay(value);
    this.arrivalDate.set(nextArrival);

    if (nextArrival.getTime() >= this.departureDate().getTime()) {
      this.departureDate.set(addDays(nextArrival, 1));
    }
  }

  onDepartureDateChange(value: Date | null | undefined): void {
    if (!(value instanceof Date)) {
      return;
    }

    const nextDeparture = startOfDay(value);
    this.departureDate.set(
      nextDeparture.getTime() <= this.arrivalDate().getTime()
        ? addDays(this.arrivalDate(), 1)
        : nextDeparture,
    );
  }

  adjustNights(d: number): void {
    this.departureDate.set(
      addDays(this.arrivalDate(), Math.max(1, this.nights() + d)),
    );
  }
  adjustAdults(d: number): void {
    this.adults.update((v) => Math.max(1, v + d));
  }
  adjustChildren(d: number): void {
    this.children.update((v) => Math.max(0, v + d));
  }

  nextPhoto(): void {
    this.photoOffset.update((i) => (i + 1) % this.roomPhotos.length);
  }

  prevPhoto(): void {
    this.photoOffset.update((i) => Math.max(0, i - 1));
  }

  goToStep(step: number): void {
    if (step < this.currentStep()) {
      this.currentStep.set(step);
    }
  }

  toggleOption(optionId: string): void {
    this.extraOptions.update((options) =>
      options.map((option) =>
        option.id === optionId
          ? { ...option, selected: !option.selected }
          : option,
      ),
    );
  }

  addCustomOption(): void {
    const label = this.normalizeOptionLabel(this.newOptionLabel());

    if (!label) {
      return;
    }

    const existingOption = this.extraOptions().find(
      (option) =>
        this.normalizeOptionLabel(option.label).toLowerCase() ===
        label.toLowerCase(),
    );

    if (existingOption) {
      this.extraOptions.update((options) =>
        options.map((option) =>
          option.id === existingOption.id
            ? { ...option, selected: true }
            : option,
        ),
      );
      this.newOptionLabel.set('');
      return;
    }

    this.extraOptions.update((options) => [
      ...options,
      {
        id: `custom-${Date.now()}`,
        label,
        selected: true,
        custom: true,
      },
    ]);
    this.newOptionLabel.set('');
  }

  removeCustomOption(optionId: string): void {
    this.extraOptions.update((options) =>
      options.filter((option) => !(option.custom && option.id === optionId)),
    );
  }

  fmt(n: number): string {
    return n.toLocaleString('fr-FR');
  }

  private formatLongDate(date: Date): string {
    return `${date.getDate()} ${MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`;
  }

  private normalizeOptionLabel(value: string): string {
    return value.replace(/\s+/g, ' ').trim();
  }
}

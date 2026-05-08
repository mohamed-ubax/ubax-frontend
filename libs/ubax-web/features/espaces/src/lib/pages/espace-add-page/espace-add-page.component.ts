import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Router } from '@angular/router';
import {
  form,
  submit,
  required,
  min,
  max,
  FormField,
} from '@angular/forms/signals';
import {
  NOTIFICATION_HANDLER,
  type NotificationHandler,
} from '@ubax-workspace/shared-data-access';
import {
  ApiConfiguration,
  findAllByType,
  LaCodeListDto,
  PropertyAmenityRequest,
} from '@ubax-workspace/shared-api-types';
import { HttpClient } from '@angular/common/http';
import { EspaceCreationStore } from '@ubax-workspace/ubax-web-data-access';
import { firstValueFrom } from 'rxjs';

// ── Wizard steps ──────────────────────────────────────────────────────────────
const WIZARD_STEPS = [
  { label: 'Identité' },
  { label: 'Capacité' },
  { label: 'Localisation' },
  { label: 'Équipements & Prix' },
  { label: 'Médias' },
  { label: 'Finalisation' },
] as const;

// ── Hotel property types ──────────────────────────────────────────────────────
type HotelPropertyType = 'HOTEL_ROOM' | 'SUITE' | 'CONFERENCE_ROOM' | 'APARTMENT';

type PropertyTypeOption = {
  readonly value: HotelPropertyType;
  readonly label: string;
  readonly icon: string;
  readonly description: string;
};

const PROPERTY_TYPE_OPTIONS: readonly PropertyTypeOption[] = [
  {
    value: 'HOTEL_ROOM',
    label: 'Chambre',
    icon: 'space-add/icons/bed-double.svg',
    description: 'Standard, Deluxe, Suite Junior, Familiale',
  },
  {
    value: 'SUITE',
    label: 'Suite',
    icon: 'space-add/icons/bed-double.svg',
    description: 'Suite Junior, Suite Présidentielle',
  },
  {
    value: 'CONFERENCE_ROOM',
    label: 'Salle de conférence',
    icon: 'space-add/icons/conference-room.svg',
    description: 'Réunion, Séminaire, Événement professionnel',
  },
  {
    value: 'APARTMENT',
    label: 'Appartement',
    icon: 'space-add/icons/bed-double.svg',
    description: 'Appartement meublé court séjour',
  },
];

// ── Bed types ─────────────────────────────────────────────────────────────────
const BED_TYPE_OPTIONS = [
  { value: 'SINGLE', label: 'Lit simple' },
  { value: 'DOUBLE', label: 'Lit double' },
  { value: 'TWIN', label: 'Lits jumeaux' },
  { value: 'KING', label: 'King size' },
  { value: 'QUEEN', label: 'Queen size' },
  { value: 'BUNK', label: 'Lits superposés' },
] as const;

// ── Meal plans ────────────────────────────────────────────────────────────────
const MEAL_PLAN_OPTIONS = [
  { value: 'ROOM_ONLY', label: 'Chambre seule' },
  { value: 'BREAKFAST', label: 'Petit-déjeuner inclus' },
  { value: 'HALF_BOARD', label: 'Demi-pension' },
  { value: 'FULL_BOARD', label: 'Pension complète' },
  { value: 'ALL_INCLUSIVE', label: 'Tout inclus' },
] as const;

// ── Payment frequencies ───────────────────────────────────────────────────────
const PAYMENT_FREQUENCY_OPTIONS = [
  { value: 'NIGHTLY', label: 'Par nuit' },
  { value: 'WEEKLY', label: 'Par semaine' },
  { value: 'MONTHLY', label: 'Par mois' },
] as const;

// ── Transaction types ─────────────────────────────────────────────────────────
const TRANSACTION_TYPE_OPTIONS = [
  { value: 'SHORT_STAY', label: 'Court séjour' },
  { value: 'RENT_FURNISHED', label: 'Location meublée' },
] as const;

// ── Condition options ─────────────────────────────────────────────────────────
const CONDITION_OPTIONS = [
  { value: 'NEW', label: 'Neuf' },
  { value: 'GOOD', label: 'Bon état' },
  { value: 'RENOVATED', label: 'Rénové' },
] as const;

// ── Floor options ─────────────────────────────────────────────────────────────
const FLOOR_OPTIONS = ['RDC', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10+'];

// ── Equipment items (mapped to amenity codes) ─────────────────────────────────
type EquipmentItem = {
  readonly id: string;
  readonly label: string;
  readonly icon: string;
  readonly code: string;
};

const EQUIPMENT_ITEMS: readonly EquipmentItem[] = [
  { id: 'ac', label: 'Climatisation', icon: 'space-add/icons/mode-cool.svg', code: 'AC' },
  { id: 'wifi', label: 'WIFI Haut débit', icon: 'space-add/icons/mode-cool.svg', code: 'WIFI' },
  { id: 'tv', label: 'Smart TV', icon: 'space-add/icons/mode-cool.svg', code: 'TV' },
  { id: 'pool', label: 'Piscine', icon: 'space-add/icons/mode-cool.svg', code: 'POOL' },
  { id: 'parking', label: 'Parking', icon: 'space-add/icons/mode-cool.svg', code: 'PARKING' },
  { id: 'generator', label: 'Groupe électrogène', icon: 'space-add/icons/mode-cool.svg', code: 'GENERATOR' },
  { id: 'security', label: 'Sécurité 24h/24', icon: 'space-add/icons/mode-cool.svg', code: 'SECURITY' },
  { id: 'elevator', label: 'Ascenseur', icon: 'space-add/icons/mode-cool.svg', code: 'ELEVATOR' },
  { id: 'garden', label: 'Jardin', icon: 'space-add/icons/mode-cool.svg', code: 'GARDEN' },
  { id: 'furnished', label: 'Meublé', icon: 'space-add/icons/mode-cool.svg', code: 'FURNISHED' },
  { id: 'pets', label: 'Animaux acceptés', icon: 'space-add/icons/mode-cool.svg', code: 'PETS_ALLOWED' },
  { id: 'pmr', label: 'Accès PMR', icon: 'space-add/icons/mode-cool.svg', code: 'PMR' },
];

// ── Form step interfaces ──────────────────────────────────────────────────────

interface EspaceStep1 {
  title: string;
  propertyType: HotelPropertyType;
  transactionType: string;
  condition: string;
}

interface EspaceStep2 {
  rooms: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  balconies: number | null;
  surfaceTotal: number | null;
  surfaceLiving: number | null;
  floor: string;
  totalFloors: number | null;
  bedType: string;
  maxOccupancy: number | null;
}

interface EspaceStep3 {
  city: string;
  district: string;
  address: string;
  street: string;
  latitude: number | null;
  longitude: number | null;
}

interface EspaceStep4 {
  price: number;
  description: string;
  mealPlan: string;
  paymentFrequency: string;
  amenities: string[];
}

const ACCEPTED_MEDIA = 'image/jpeg,image/png,image/webp,video/mp4,video/quicktime,video/mpeg';
const MAX_IMAGE_MB = 10;
const MAX_VIDEO_MB = 100;

@Component({
  selector: 'ubax-espace-add-page',
  standalone: true,
  imports: [FormField, DecimalPipe],
  providers: [EspaceCreationStore],
  templateUrl: './espace-add-page.component.html',
  styleUrl: './espace-add-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EspaceAddPageComponent implements OnInit {
  private readonly store = inject(EspaceCreationStore);
  private readonly router = inject(Router);
  private readonly http = inject(HttpClient);
  private readonly apiConfig = inject(ApiConfiguration);
  private readonly notifications = inject(NOTIFICATION_HANDLER, {
    optional: true,
  }) as NotificationHandler | null;

  // ── Store proxies ─────────────────────────────────────────────────────────
  protected readonly saving = this.store.saving;
  protected readonly error = this.store.error;
  protected readonly medias = this.store.medias;
  protected readonly propertyId = this.store.propertyId;
  protected readonly cities = this.store.codeListCities;

  // ── Static options ────────────────────────────────────────────────────────
  protected readonly steps = WIZARD_STEPS;
  protected readonly propertyTypeOptions = PROPERTY_TYPE_OPTIONS;
  protected readonly bedTypeOptions = BED_TYPE_OPTIONS;
  protected readonly mealPlanOptions = MEAL_PLAN_OPTIONS;
  protected readonly paymentFrequencyOptions = PAYMENT_FREQUENCY_OPTIONS;
  protected readonly transactionTypeOptions = TRANSACTION_TYPE_OPTIONS;
  protected readonly conditionOptions = CONDITION_OPTIONS;
  protected readonly floorOptions = FLOOR_OPTIONS;
  protected readonly equipmentItems = EQUIPMENT_ITEMS;
  protected readonly acceptedMedia = ACCEPTED_MEDIA;

  // ── UI state ──────────────────────────────────────────────────────────────
  protected readonly activeStep = signal(0);
  protected readonly isDragOver = signal(false);
  protected readonly mediaDeleteTarget = signal<string | null>(null);
  protected readonly coverWarnVisible = signal(false);
  private readonly step4Pending = signal(false);

  // ── Computed ──────────────────────────────────────────────────────────────
  protected readonly isCreated = computed(() => !!this.store.propertyId());

  protected readonly coverMediaId = computed(
    () => this.medias().find((m) => m.cover)?.id ?? null,
  );

  protected readonly photoCount = computed(
    () => this.medias().filter((m) => m.mediaType === 'PHOTO').length,
  );

  protected readonly hasMinPhotos = computed(() => this.photoCount() >= 3);

  // ── Signal Forms ──────────────────────────────────────────────────────────

  // Step 1 — Identité
  protected readonly _step1 = signal<EspaceStep1>({
    title: '',
    propertyType: 'HOTEL_ROOM',
    transactionType: 'SHORT_STAY',
    condition: 'NEW',
  });

  protected readonly formStep1 = form(this._step1, (p) => {
    required(p.title, { message: "Le titre de l'espace est requis" });
    required(p.propertyType, { message: "Le type d'espace est requis" });
    required(p.transactionType, { message: 'Le type de transaction est requis' });
  });

  // Step 2 — Capacité & Surfaces
  protected readonly _step2 = signal<EspaceStep2>({
    rooms: 1,
    bedrooms: 1,
    bathrooms: 1,
    balconies: null,
    surfaceTotal: null,
    surfaceLiving: null,
    floor: 'RDC',
    totalFloors: null,
    bedType: 'DOUBLE',
    maxOccupancy: 2,
  });

  protected readonly formStep2 = form(this._step2, (p) => {
    min(p.rooms, 0);
    min(p.bedrooms, 0);
    min(p.bathrooms, 0);
    min(p.surfaceLiving, 0);
    min(p.surfaceTotal, 0);
    min(p.maxOccupancy, 1);
    max(p.maxOccupancy, 100);
  });

  // Step 3 — Localisation
  protected readonly _step3 = signal<EspaceStep3>({
    city: '',
    district: '',
    address: '',
    street: '',
    latitude: null,
    longitude: null,
  });

  protected readonly formStep3 = form(this._step3, (p) => {
    required(p.city, { message: 'La ville est requise' });
    min(p.latitude, -90, { message: 'Latitude entre -90 et 90' });
    max(p.latitude, 90, { message: 'Latitude entre -90 et 90' });
    min(p.longitude, -180, { message: 'Longitude entre -180 et 180' });
    max(p.longitude, 180, { message: 'Longitude entre -180 et 180' });
  });

  // Step 4 — Équipements & Prix
  protected readonly _step4 = signal<EspaceStep4>({
    price: 0,
    description: '',
    mealPlan: 'ROOM_ONLY',
    paymentFrequency: 'NIGHTLY',
    amenities: ['AC', 'SECURITY', 'PARKING'],
  });

  protected readonly formStep4 = form(this._step4, (p) => {
    required(p.price, { message: 'Le tarif est requis' });
    min(p.price, 0, { message: 'Le tarif doit être positif ou nul' });
  });

  // ── Computed form values for preview ─────────────────────────────────────
  protected readonly previewTitle = computed(() => this._step1().title);
  protected readonly previewType = computed(
    () => PROPERTY_TYPE_OPTIONS.find((o) => o.value === this._step1().propertyType)?.label ?? '—',
  );
  protected readonly previewPrice = computed(() => this._step4().price);
  protected readonly previewCity = computed(() => this._step3().city);
  protected readonly previewFloor = computed(() => this._step2().floor);

  constructor() {
    // Auto-select first city once code lists load
    effect(() => {
      const firstCity = this.cities()[0]?.value ?? '';
      if (firstCity && !this._step3().city) {
        this._step3.update((s) => ({ ...s, city: firstCity }));
      }
    });

    // Navigate to detail once brouillon is created and step4 was pending
    effect(() => {
      if (this.step4Pending() && this.store.propertyId() && !this.store.saving()) {
        this.step4Pending.set(false);
        this.notifications?.success('Brouillon créé avec succès.');
        this.nextStep();
      }
    });

    // Navigate to list once submitted (status → PENDING)
    effect(() => {
      const prop = this.store.property();
      if (prop?.id && prop.status === 'PENDING') {
        this.store.reset();
        this.router.navigate(['/hotel/espaces']);
      }
    });
  }

  ngOnInit(): void {
    this.store.chargerVilles();
  }

  // ── Wizard navigation ─────────────────────────────────────────────────────
  protected isReachedStep(index: number): boolean {
    return index <= this.activeStep();
  }

  protected isCompletedStep(index: number): boolean {
    return index < this.activeStep();
  }

  protected nextStep(): void {
    this.activeStep.update((s) => Math.min(s + 1, this.steps.length - 1));
  }

  protected previousStep(): void {
    this.activeStep.update((s) => Math.max(s - 1, 0));
  }

  // ── Step 1 — type card selection ──────────────────────────────────────────
  protected selectPropertyType(value: HotelPropertyType): void {
    this._step1.update((s) => ({ ...s, propertyType: value }));
  }

  protected get selectedPropertyType(): HotelPropertyType {
    return this._step1().propertyType;
  }

  protected get isRoomOrSuite(): boolean {
    const t = this._step1().propertyType;
    return t === 'HOTEL_ROOM' || t === 'SUITE';
  }

  // ── Step 2 — floor chip selection ────────────────────────────────────────
  protected selectFloor(floor: string): void {
    this._step2.update((s) => ({ ...s, floor }));
  }

  protected get selectedFloor(): string {
    return this._step2().floor;
  }

  // ── Step 2 — bed type selection ───────────────────────────────────────────
  protected selectBedType(value: string): void {
    this._step2.update((s) => ({ ...s, bedType: value }));
  }

  protected get selectedBedType(): string {
    return this._step2().bedType;
  }

  // ── Step 4 — amenity toggle ───────────────────────────────────────────────
  protected isAmenitySelected(code: string): boolean {
    return this._step4().amenities.includes(code);
  }

  protected toggleAmenity(code: string): void {
    this._step4.update((s) => {
      const already = s.amenities.includes(code);
      return {
        ...s,
        amenities: already
          ? s.amenities.filter((c) => c !== code)
          : [...s.amenities, code],
      };
    });
  }

  // ── Step proceeds ─────────────────────────────────────────────────────────
  protected proceedStep1(): void {
    submit(this.formStep1, {
      action: async () => {
        this.nextStep();
        return null;
      },
    });
  }

  protected proceedStep2(): void {
    submit(this.formStep2, {
      action: async () => {
        this.nextStep();
        return null;
      },
    });
  }

  protected proceedStep3(): void {
    submit(this.formStep3, {
      action: async () => {
        this.nextStep();
        return null;
      },
    });
  }

  /**
   * Validates step 4, then triggers brouillon creation.
   * Navigation to step 5 (médias) happens reactively once the store confirms.
   */
  protected proceedStep4(): void {
    submit(this.formStep4, {
      action: async () => {
        const s1 = this._step1();
        const s2 = this._step2();
        const s3 = this._step3();
        const s4 = this._step4();

        const amenities: PropertyAmenityRequest[] = s4.amenities.map((code) => ({ code }));

        // Resolve floor: 'RDC' → 0, else parse int
        const floorNum = s2.floor === 'RDC' ? 0 : parseInt(s2.floor, 10) || null;

        this.store.creerEspace({
          title: s1.title,
          description: s4.description || undefined,
          propertyType: s1.propertyType,
          transactionType: s1.transactionType,
          condition: s1.condition,
          price: s4.price,
          surfaceTotal: s2.surfaceTotal ?? undefined,
          surfaceLiving: s2.surfaceLiving ?? undefined,
          rooms: s2.rooms ?? undefined,
          bedrooms: s2.bedrooms ?? undefined,
          bathrooms: s2.bathrooms ?? undefined,
          balconies: s2.balconies ?? undefined,
          floor: floorNum ?? undefined,
          totalFloors: s2.totalFloors ?? undefined,
          bedType: s2.bedType || undefined,
          maxOccupancy: s2.maxOccupancy ?? undefined,
          mealPlan: s4.mealPlan || undefined,
          paymentFrequency: s4.paymentFrequency || undefined,
          city: s3.city,
          district: s3.district || undefined,
          address: s3.address || undefined,
          street: s3.street || undefined,
          latitude: s3.latitude ?? undefined,
          longitude: s3.longitude ?? undefined,
          amenities: amenities.length > 0 ? amenities : undefined,
        });

        this.step4Pending.set(true);
        return null;
      },
    });
  }

  // ── Media handlers ────────────────────────────────────────────────────────
  protected onMediaFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files) return;
    this.uploadFiles(Array.from(input.files));
    input.value = '';
  }

  protected onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver.set(true);
  }

  protected onDragLeave(): void {
    this.isDragOver.set(false);
  }

  protected onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver.set(false);
    const files = Array.from(event.dataTransfer?.files ?? []);
    this.uploadFiles(files);
  }

  private uploadFiles(files: File[]): void {
    const propertyId = this.store.propertyId();
    if (!propertyId) {
      this.notifications?.error("Créez d'abord l'espace avant d'ajouter des médias.");
      return;
    }
    files.forEach((file) => {
      if (!this.validateFile(file)) return;
      const mediaType = file.type.startsWith('video/')
        ? 'VIDEO'
        : this._step1().propertyType === 'CONFERENCE_ROOM'
          ? 'PLAN'
          : 'PHOTO';
      this.store.uploaderMediaDirect({ file, mediaType, cover: false });
    });
  }

  private validateFile(file: File): boolean {
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');
    if (!isImage && !isVideo) {
      this.notifications?.error(`Format non supporté : ${file.name}`);
      return false;
    }
    const maxMB = isVideo ? MAX_VIDEO_MB : MAX_IMAGE_MB;
    if (file.size > maxMB * 1024 * 1024) {
      this.notifications?.error(`Fichier trop volumineux : ${file.name} (max ${maxMB} Mo)`);
      return false;
    }
    return true;
  }

  protected setCover(mediaId: string): void {
    this.store.definirCouverture(mediaId);
  }

  protected requestDeleteMedia(mediaId: string): void {
    this.mediaDeleteTarget.set(mediaId);
  }

  protected cancelDeleteMedia(): void {
    this.mediaDeleteTarget.set(null);
  }

  protected confirmDeleteMedia(): void {
    const mediaId = this.mediaDeleteTarget();
    if (!mediaId) return;
    const wasCover = this.coverMediaId() === mediaId;
    this.store.supprimerMedia(mediaId);
    this.mediaDeleteTarget.set(null);
    if (wasCover) this.coverWarnVisible.set(true);
  }

  protected dismissCoverWarn(): void {
    this.coverWarnVisible.set(false);
  }

  // ── Final actions ─────────────────────────────────────────────────────────
  protected sauvegarderBrouillon(): void {
    this.store.reset();
    this.router.navigate(['/hotel/espaces']);
  }

  protected soumettre(): void {
    this.store.soumettre();
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  protected getCityLabel(city: LaCodeListDto): string {
    return city.value ?? city.description ?? '';
  }

  protected getCityValue(city: LaCodeListDto): string {
    return city.value ?? '';
  }

  protected getMealPlanLabel(value: string): string {
    return MEAL_PLAN_OPTIONS.find((o) => o.value === value)?.label ?? value;
  }

  protected getTransactionLabel(value: string): string {
    return TRANSACTION_TYPE_OPTIONS.find((o) => o.value === value)?.label ?? value;
  }
}

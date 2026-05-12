import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
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
  generateReadUrl,
  getById,
  LaCodeListDto,
  PropertyDetailResponse,
  PropertyAmenityRequest,
  PropertyDocumentResponse,
} from '@ubax-workspace/shared-api-types';
import {
  AuthStore,
  EspaceCreationStore,
  EspaceEditStore,
} from '@ubax-workspace/ubax-web-data-access';
import { SelectModule } from 'primeng/select';
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

type PropertyTypeOption = {
  readonly value: string;
  readonly label: string;
  readonly icon: string;
  readonly description: string;
};

type SelectOption = {
  readonly value: string;
  readonly label: string;
};

type UploadTimelineStep = {
  key: 'presigning' | 'uploading' | 'registering';
  label: string;
  description: string;
  status: 'done' | 'active' | 'pending';
};

const DEFAULT_DOC_TYPE_LABELS: Readonly<Record<string, string>> = {
  TITLE_DEED: 'Titre foncier',
  BUILDING_PERMIT: 'Permis de construire',
  DIAGNOSTIC: 'Diagnostic',
  CADASTRAL_PLAN: 'Plan cadastral',
  INSURANCE: 'Assurance',
  CONFORMITY_CERTIFICATE: 'Certificat de conformite',
  OTHER: 'Autre',
};

const PROPERTY_TYPE_META: Readonly<
  Record<string, { icon: string; description: string }>
> = {
  HOTEL_ROOM: {
    icon: 'space-add/icons/bed-double.svg',
    description: 'Standard, Deluxe, Suite Junior, Familiale',
  },
  ROOM: {
    icon: 'space-add/icons/bed-double.svg',
    description: 'Standard, Deluxe, Suite Junior, Familiale',
  },
  SUITE: {
    icon: 'space-add/icons/bed-double.svg',
    description: 'Suite Junior, Suite Présidentielle',
  },
  CONFERENCE_ROOM: {
    icon: 'space-add/icons/conference-room.svg',
    description: 'Réunion, Séminaire, Événement professionnel',
  },
  APARTMENT: {
    icon: 'space-add/icons/bed-double.svg',
    description: 'Appartement meublé court séjour',
  },
};

// ── Floor options ─────────────────────────────────────────────────────────────
const FLOOR_OPTIONS = [
  'RDC',
  '1',
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9',
  '10+',
];

// ── Equipment items (mapped to amenity codes) ─────────────────────────────────
type EquipmentItem = {
  readonly id: string;
  readonly label: string;
  readonly icon: string;
  readonly code: string;
};

const DEFAULT_AMENITY_ICON = 'space-add/icons/mode-cool.svg';
const AMENITY_ICON_BY_CODE: Readonly<Record<string, string>> = {
  AC: 'space-add/icons/mode-cool.svg',
  WIFI: 'space-add/icons/mode-cool.svg',
  TV: 'space-add/icons/mode-cool.svg',
  POOL: 'space-add/icons/mode-cool.svg',
  PARKING: 'space-add/icons/mode-cool.svg',
  GENERATOR: 'space-add/icons/mode-cool.svg',
  SECURITY: 'space-add/icons/mode-cool.svg',
  ELEVATOR: 'space-add/icons/mode-cool.svg',
  GARDEN: 'space-add/icons/mode-cool.svg',
  FURNISHED: 'space-add/icons/mode-cool.svg',
  PETS_ALLOWED: 'space-add/icons/mode-cool.svg',
  PMR: 'space-add/icons/mode-cool.svg',
};

// ── Form step interfaces ──────────────────────────────────────────────────────

interface EspaceStep1 {
  title: string;
  propertyType: string;
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

const ACCEPTED_MEDIA =
  'image/jpeg,image/png,image/webp,video/mp4,video/quicktime,video/mpeg';
const ACCEPTED_DOCS = 'application/pdf,image/jpeg,image/png,image/webp';
const MAX_IMAGE_MB = 10;
const MAX_VIDEO_MB = 100;
const MAX_DOC_SIZE_MB = 20;

function resolveTimelineStatus(
  activeIndex: number,
  stepIndex: number,
): UploadTimelineStep['status'] {
  if (activeIndex > stepIndex) return 'done';
  if (activeIndex === stepIndex) return 'active';
  return 'pending';
}

@Component({
  selector: 'ubax-espace-add-page',
  standalone: true,
  imports: [FormField, DecimalPipe, FormsModule, SelectModule],
  providers: [EspaceCreationStore, EspaceEditStore],
  templateUrl: './espace-add-page.component.html',
  styleUrl: './espace-add-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EspaceAddPageComponent implements OnInit {
  private readonly store = inject(EspaceCreationStore);
  private readonly editStore = inject(EspaceEditStore);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly authStore = inject(AuthStore);
  private readonly http = inject(HttpClient);
  private readonly apiConfig = inject(ApiConfiguration);
  private readonly notifications = inject(NOTIFICATION_HANDLER, {
    optional: true,
  }) as NotificationHandler | null;

  // ── Store proxies ─────────────────────────────────────────────────────────
  protected readonly saving = this.store.saving;
  protected readonly error = this.store.error;
  protected readonly medias = this.store.medias;
  protected readonly documents = this.store.documents;
  protected readonly propertyId = this.store.propertyId;
  protected readonly propertyTypes = this.store.codeListPropertyTypes;
  protected readonly bedTypesCodeList = this.store.codeListBedTypes;
  protected readonly mealPlansCodeList = this.store.codeListMealPlans;
  protected readonly paymentFrequenciesCodeList =
    this.store.codeListPaymentFrequencies;
  protected readonly transactionTypesCodeList =
    this.store.codeListTransactionTypes;
  protected readonly propertyConditionsCodeList =
    this.store.codeListPropertyConditions;
  protected readonly amenitiesCodeList = this.store.codeListAmenities;
  protected readonly cities = this.store.codeListCities;
  protected readonly documentTypesCodeList = this.store.codeListDocumentTypes;
  protected readonly documentUploadStage = this.store.documentUploadStage;

  /** true si l'erreur est liée à une session expirée / token invalide */
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

  protected expireAndRedirect(): void {
    this.authStore.expireSession();
  }

  private readonly toSelectOptions = (
    items: readonly LaCodeListDto[],
  ): SelectOption[] =>
    items
      .map((item) => ({
        value: this.getCodeListValue(item),
        label: this.getCodeListLabel(item),
      }))
      .filter((item) => item.value.length > 0);

  protected readonly propertyTypeOptions = computed<PropertyTypeOption[]>(() =>
    this.propertyTypes()
      .map((item) => {
        const value = this.getCodeListValue(item);
        if (!value) return null;
        const meta = PROPERTY_TYPE_META[value];
        return {
          value,
          label: this.getCodeListLabel(item),
          icon: meta?.icon ?? 'space-add/icons/bed-double.svg',
          description:
            meta?.description ?? 'Type d espace disponible a la reservation',
        };
      })
      .filter((item): item is PropertyTypeOption => item !== null),
  );

  protected readonly bedTypeOptions = computed<SelectOption[]>(() =>
    this.toSelectOptions(this.bedTypesCodeList()),
  );

  protected readonly mealPlanOptions = computed<SelectOption[]>(() =>
    this.toSelectOptions(this.mealPlansCodeList()),
  );

  protected readonly paymentFrequencyOptions = computed<SelectOption[]>(() =>
    this.toSelectOptions(this.paymentFrequenciesCodeList()),
  );

  protected readonly docTypeOptions = computed<SelectOption[]>(() =>
    this.documentTypesCodeList().map((item) => {
      const value = this.getCodeListValue(item);
      const label = this.getCodeListLabel(item);
      return {
        value,
        label: label || DEFAULT_DOC_TYPE_LABELS[value] || value,
      };
    }),
  );

  protected readonly documentUploadTimeline = computed<UploadTimelineStep[]>(
    () => {
      const stage = this.documentUploadStage();

      if (stage === 'idle') return [];

      const activeIndex =
        {
          presigning: 0,
          uploading: 1,
          registering: 2,
        }[stage] ?? 0;

      return [
        {
          key: 'presigning',
          label: 'Generation URL signee',
          description: 'Preparation de l URL presignee pour le document',
          status: resolveTimelineStatus(activeIndex, 0),
        },
        {
          key: 'uploading',
          label: 'Upload document',
          description: 'Envoi du document vers le stockage',
          status: resolveTimelineStatus(activeIndex, 1),
        },
        {
          key: 'registering',
          label: 'Rattachement legal',
          description: 'Association du document a l espace',
          status: resolveTimelineStatus(activeIndex, 2),
        },
      ];
    },
  );

  protected readonly transactionTypeOptions = computed<SelectOption[]>(() =>
    this.toSelectOptions(this.transactionTypesCodeList()),
  );

  protected readonly conditionOptions = computed<SelectOption[]>(() =>
    this.toSelectOptions(this.propertyConditionsCodeList()),
  );

  protected readonly equipmentItems = computed<EquipmentItem[]>(() =>
    this.amenitiesCodeList()
      .map((item) => {
        const code = this.getCodeListValue(item);
        if (!code) return null;
        return {
          id: code,
          label: this.getCodeListLabel(item),
          icon: AMENITY_ICON_BY_CODE[code] ?? DEFAULT_AMENITY_ICON,
          code,
        };
      })
      .filter((item): item is EquipmentItem => item !== null),
  );

  // ── Static options ────────────────────────────────────────────────────────
  protected readonly steps = WIZARD_STEPS;
  protected readonly floorOptions = FLOOR_OPTIONS;
  protected readonly acceptedMedia = ACCEPTED_MEDIA;
  protected readonly acceptedDocs = ACCEPTED_DOCS;

  // ── UI state ──────────────────────────────────────────────────────────────
  protected readonly activeStep = signal(0);
  protected readonly isDragOver = signal(false);
  protected readonly mediaDeleteTarget = signal<string | null>(null);
  protected readonly docDeleteTarget = signal<string | null>(null);
  protected readonly selectedDocType = signal('');
  protected readonly docTitle = signal('');
  protected readonly docFileError = signal<string | null>(null);
  protected readonly documentOpeningId = signal<string | null>(null);
  protected readonly coverWarnVisible = signal(false);
  private readonly step4Pending = signal(false);
  private readonly editPending = signal(false);

  protected readonly editPropertyId = computed(
    () => this.route.snapshot.paramMap.get('id') ?? '',
  );
  protected readonly isEditMode = computed(
    () => this.editPropertyId().length > 0,
  );

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
    propertyType: '',
    transactionType: '',
    condition: '',
  });

  protected readonly formStep1 = form(this._step1, (p) => {
    required(p.title, { message: "Le titre de l'espace est requis" });
    required(p.propertyType, { message: "Le type d'espace est requis" });
    required(p.transactionType, {
      message: 'Le type de transaction est requis',
    });
  });

  // Step 2 — Capacité & Surfaces
  protected readonly _step2 = signal<EspaceStep2>({
    rooms: null,
    bedrooms: null,
    bathrooms: null,
    balconies: null,
    surfaceTotal: null,
    surfaceLiving: null,
    floor: '',
    totalFloors: null,
    bedType: '',
    maxOccupancy: null,
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
    mealPlan: '',
    paymentFrequency: '',
    amenities: [],
  });

  protected readonly formStep4 = form(this._step4, (p) => {
    required(p.price, { message: 'Le tarif est requis' });
    min(p.price, 0, { message: 'Le tarif doit être positif ou nul' });
  });

  // ── Computed form values for preview ─────────────────────────────────────
  protected readonly previewTitle = computed(() => this._step1().title);
  protected readonly previewType = computed(
    () =>
      this.propertyTypeOptions().find(
        (o) => o.value === this._step1().propertyType,
      )?.label ?? '—',
  );
  protected readonly previewPrice = computed(() => this._step4().price);
  protected readonly previewCity = computed(() => this._step3().city);
  protected readonly previewFloor = computed(() => this._step2().floor);

  constructor() {
    effect(() => {
      const available = new Set(this.equipmentItems().map((item) => item.code));
      if (available.size === 0) return;
      const selected = this._step4().amenities;
      const filtered = selected.filter((code) => available.has(code));

      if (filtered.length !== selected.length) {
        this._step4.update((s) => ({ ...s, amenities: filtered }));
      }
    });

    // Navigate to detail once brouillon is created and step4 was pending
    effect(() => {
      if (
        this.step4Pending() &&
        this.store.propertyId() &&
        !this.store.saving()
      ) {
        this.step4Pending.set(false);
        this.notifications?.success('Brouillon créé avec succès.');
        this.nextStep();
      }
    });

    effect(() => {
      if (
        !this.isEditMode() ||
        !this.editPending() ||
        this.editStore.saving()
      ) {
        return;
      }

      const error = this.editStore.error();
      if (error) {
        this.editPending.set(false);
        this.notifications?.error("La modification de l'espace a échoué.");
        return;
      }

      const id = this.editPropertyId();
      this.editPending.set(false);
      if (!id) {
        return;
      }

      this.notifications?.success("Informations de l'espace mises à jour.");
      this.nextStep();
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
    this.store.chargerReferentiels();
    const id = this.editPropertyId();
    if (id) {
      void this.prefillFromProperty(id);
    }
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
  protected selectPropertyType(value: string): void {
    this._step1.update((s) => ({ ...s, propertyType: value }));
  }

  protected get selectedPropertyType(): string {
    return this._step1().propertyType;
  }

  protected get isRoomOrSuite(): boolean {
    const t = this._step1().propertyType;
    return t === 'HOTEL_ROOM' || t === 'ROOM' || t === 'SUITE';
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

        const amenities: PropertyAmenityRequest[] = s4.amenities.map(
          (code) => ({ code }),
        );

        // Resolve floor: 'RDC' → 0, else parse int
        const floorNum =
          s2.floor === 'RDC' ? 0 : Number.parseInt(s2.floor, 10) || null;

        const payload = {
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
        };

        if (this.isEditMode()) {
          const id = this.editPropertyId();
          if (!id) {
            this.notifications?.error("Identifiant de l'espace introuvable.");
            return null;
          }

          this.editStore.updateEspace({ id, ...payload });
          this.editPending.set(true);
          return null;
        }

        this.store.creerEspace({
          ...payload,
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
      this.notifications?.error(
        "Créez d'abord l'espace avant d'ajouter des médias.",
      );
      return;
    }
    files.forEach((file) => {
      if (!this.validateFile(file)) return;
      let mediaType: 'PHOTO' | 'VIDEO' | 'PLAN' = 'PHOTO';
      if (file.type.startsWith('video/')) {
        mediaType = 'VIDEO';
      } else if (this._step1().propertyType === 'CONFERENCE_ROOM') {
        mediaType = 'PLAN';
      }
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
      this.notifications?.error(
        `Fichier trop volumineux : ${file.name} (max ${maxMB} Mo)`,
      );
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

  // ── Document handlers ───────────────────────────────────────────────────
  protected onDocTypeChange(value: string): void {
    this.selectedDocType.set(value ?? '');
  }

  protected onDocFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) return;

    if (file.size > MAX_DOC_SIZE_MB * 1024 * 1024) {
      this.docFileError.set(
        `Fichier trop volumineux (max ${MAX_DOC_SIZE_MB} Mo).`,
      );
      input.value = '';
      return;
    }

    const propertyId = this.propertyId();
    if (!propertyId) {
      this.docFileError.set(
        "Creez d'abord l'espace avant d'ajouter des documents.",
      );
      input.value = '';
      return;
    }

    const docType = this.selectedDocType();
    if (!docType) {
      this.docFileError.set('Selectionnez un type de document.');
      input.value = '';
      return;
    }

    this.docFileError.set(null);
    this.store.uploaderDocument({
      file,
      docType,
      title: this.docTitle().trim() || file.name,
    });
    input.value = '';
    this.docTitle.set('');
  }

  protected async openDocument(fileUrl: string, docId?: string): Promise<void> {
    if (docId) this.documentOpeningId.set(docId);

    try {
      const response = await firstValueFrom(
        generateReadUrl(this.http, this.apiConfig.rootUrl, { fileUrl }),
      );
      const readUrl = response.body?.readUrl;
      window.open(readUrl ?? fileUrl, '_blank', 'noopener,noreferrer');
    } catch {
      window.open(fileUrl, '_blank', 'noopener,noreferrer');
    } finally {
      if (docId) this.documentOpeningId.set(null);
    }
  }

  protected requestDeleteDoc(docId: string): void {
    this.docDeleteTarget.set(docId);
  }

  protected cancelDeleteDoc(): void {
    this.docDeleteTarget.set(null);
  }

  protected confirmDeleteDoc(): void {
    const docId = this.docDeleteTarget();
    if (!docId) return;

    this.store.supprimerDocument(docId);
    this.docDeleteTarget.set(null);
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
    return this.getCodeListLabel(city);
  }

  protected getCityValue(city: LaCodeListDto): string {
    return this.getCodeListValue(city);
  }

  protected getMealPlanLabel(value: string): string {
    return (
      this.mealPlanOptions().find((o) => o.value === value)?.label ?? value
    );
  }

  protected getTransactionLabel(value: string): string {
    return (
      this.transactionTypeOptions().find((o) => o.value === value)?.label ??
      value
    );
  }

  protected getCodeListLabel(item: LaCodeListDto): string {
    return item.description ?? item.value ?? '';
  }

  protected getCodeListValue(item: LaCodeListDto): string {
    return item.value ?? '';
  }

  protected docTypeLabel(value?: string): string {
    if (!value) return '—';
    return (
      this.docTypeOptions().find((item) => item.value === value)?.label ?? value
    );
  }

  protected formatBytes(bytes?: number): string {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} o`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
  }

  protected trackDocument(_: number, doc: PropertyDocumentResponse): string {
    return doc.id ?? doc.fileUrl ?? doc.title ?? `${_}`;
  }

  private async prefillFromProperty(id: string): Promise<void> {
    try {
      const response = await firstValueFrom(
        getById(this.http, this.apiConfig.rootUrl, { id }),
      );
      const detail = this.extractDetailFromResponse(response.body);
      const property = detail?.property;

      if (!property) {
        return;
      }

      this.store.hydrateExistingDraftContext({
        propertyId: id,
        property,
        medias: detail?.media ?? [],
        documents: detail?.documents ?? [],
      });

      this._step1.update((state) => ({
        ...state,
        title: property.title ?? state.title,
        propertyType: property.propertyType ?? state.propertyType,
        transactionType: property.transactionType ?? state.transactionType,
        condition: property.condition ?? state.condition,
      }));

      this._step2.update((state) => ({
        ...state,
        rooms: property.rooms ?? state.rooms,
        bedrooms: property.bedrooms ?? state.bedrooms,
        bathrooms: property.bathrooms ?? state.bathrooms,
        balconies: property.balconies ?? state.balconies,
        surfaceTotal: property.surfaceTotal ?? state.surfaceTotal,
        surfaceLiving: property.surfaceLiving ?? state.surfaceLiving,
        floor:
          typeof property.floor === 'number'
            ? property.floor === 0
              ? 'RDC'
              : `${property.floor}`
            : state.floor,
        totalFloors: property.totalFloors ?? state.totalFloors,
        bedType: property.bedType ?? state.bedType,
        maxOccupancy: property.maxOccupancy ?? state.maxOccupancy,
      }));

      this._step3.update((state) => ({
        ...state,
        city: property.city ?? state.city,
        district: property.district ?? state.district,
        address: property.address ?? state.address,
        street: property.street ?? state.street,
        latitude: property.latitude ?? state.latitude,
        longitude: property.longitude ?? state.longitude,
      }));

      this._step4.update((state) => ({
        ...state,
        price: property.price ?? state.price,
        description: property.description ?? state.description,
        mealPlan: property.mealPlan ?? state.mealPlan,
        paymentFrequency: property.paymentFrequency ?? state.paymentFrequency,
        amenities:
          property.amenities
            ?.map((item) => item.code ?? '')
            .filter((code) => code.length > 0) ?? state.amenities,
      }));
    } catch {
      this.notifications?.error(
        "Impossible de préremplir l'espace à modifier.",
      );
    }
  }

  private extractDetailFromResponse(
    body: unknown,
  ): PropertyDetailResponse | null {
    if (!body || typeof body !== 'object') {
      return null;
    }

    const direct = body as PropertyDetailResponse;
    if (direct.property || direct.media || direct.documents) {
      return direct;
    }

    const wrapped = body as { data?: unknown };
    if (wrapped.data && typeof wrapped.data === 'object') {
      return wrapped.data as PropertyDetailResponse;
    }

    return null;
  }
}

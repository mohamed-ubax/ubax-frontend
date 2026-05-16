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
import { DecimalPipe, DOCUMENT } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer, type SafeResourceUrl } from '@angular/platform-browser';
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
  getById1 as getPropertyById,
  LaCodeListDto,
  PropertyCreateRequest,
  PropertyDetailResponse,
  PropertyAmenityRequest,
  PropertyDocumentResponse,
} from '@ubax-workspace/shared-api-types';
import {
  AuthStore,
  ESPACE_STATUS_LABELS,
  EspaceCreationStore,
  EspaceEditStore,
  EspaceStatus,
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

type EditFinalAction = 'save' | 'submit' | 'finish';

const DEFAULT_DOC_TYPE_LABELS: Readonly<Record<string, string>> = {
  TITLE_DEED: 'Titre foncier',
  BUILDING_PERMIT: 'Permis de construire',
  DIAGNOSTIC: 'Diagnostic',
  CADASTRAL_PLAN: 'Plan cadastral',
  INSURANCE: 'Assurance',
  CONFORMITY_CERTIFICATE: 'Certificat de conformite',
  OTHER: 'Autre',
};
const DEFAULT_PROPERTY_TYPE_ICON = 'space-add/icons/bed-double.svg';
const PROPERTY_TYPE_SKELETON_ITEMS = [1, 2, 3, 4] as const;
const PROPERTY_TYPE_SUPPORTING_TEXT: Readonly<Record<string, string>> = {
  APARTMENT: 'Logement independant',
  STUDIO: 'Format compact et autonome',
  LOFT: 'Volume ouvert et moderne',
  ROOM: 'Hebergement individuel',
  HOTEL_ROOM: 'Hebergement individuel',
  SUITE: 'Hebergement premium',
  CONFERENCE_ROOM: 'Usage evenementiel',
  VILLA: 'Hebergement privatif',
  HOUSE: 'Hebergement privatif',
  LAND: 'Espace a amenager',
};

function humanizePropertyTypeValue(value: string): string {
  return value
    .toLowerCase()
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function resolvePropertyTypeSupportingText(value: string): string {
  return (
    PROPERTY_TYPE_SUPPORTING_TEXT[value] ??
    `Format ${humanizePropertyTypeValue(value)}`
  );
}

type TimeoutHandle = ReturnType<typeof setTimeout>;

function isEditableEspaceStatus(
  status: EspaceStatus | null | undefined,
): boolean {
  return status === 'DRAFT' || status === 'REJECTED';
}

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
  private readonly document = inject(DOCUMENT);
  private readonly http = inject(HttpClient);
  private readonly apiConfig = inject(ApiConfiguration);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly notifications = inject(NOTIFICATION_HANDLER, {
    optional: true,
  }) as NotificationHandler | null;

  // ── Store proxies ─────────────────────────────────────────────────────────
  protected readonly saving = this.store.saving;
  protected readonly error = this.store.error;
  protected readonly medias = this.store.medias;
  protected readonly documents = this.store.documents;
  protected readonly property = this.store.property;
  protected readonly propertyId = this.store.propertyId;
  protected readonly propertyTypes = this.store.codeListPropertyTypes;
  protected readonly codeListsLoading = this.store.codeListsLoading;
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
  protected readonly editSaving = this.editStore.saving;
  protected readonly isWorking = computed(
    () => this.store.saving() || this.editStore.saving(),
  );

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
        return {
          value,
          label: this.getCodeListLabel(item),
          icon: DEFAULT_PROPERTY_TYPE_ICON,
          description: resolvePropertyTypeSupportingText(value),
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
  protected readonly previewUrl = signal<string | null>(null);
  protected readonly previewName = signal('Document');
  protected readonly previewFullscreen = signal(false);
  protected readonly previewIsImage = signal(false);
  protected readonly previewIsVideo = signal(false);
  protected readonly coverWarnVisible = signal(false);
  protected readonly showPropertyTypeSkeleton = signal(true);
  protected readonly typeCardsLeavingSkeleton = signal(false);
  protected readonly propertyTypeSkeletonItems = PROPERTY_TYPE_SKELETON_ITEMS;
  private readonly hasRequestedPropertyTypes = signal(false);
  private readonly step4Pending = signal(false);
  private readonly editPending = signal(false);
  private readonly editFinalAction = signal<EditFinalAction | null>(null);
  private readonly submitPending = signal(false);

  protected readonly editPropertyId = computed(
    () => this.route.snapshot.paramMap.get('id') ?? '',
  );
  protected readonly isEditMode = computed(
    () => this.editPropertyId().length > 0,
  );
  protected readonly isModificationLocked = computed(() => {
    if (!this.isEditMode()) {
      return false;
    }

    const property = this.property();
    if (!property) {
      return false;
    }

    return !isEditableEspaceStatus(property.status ?? null);
  });
  protected readonly modificationLockedStatusLabel = computed(() => {
    const status = this.property()?.status;

    if (!status) {
      return 'inconnu';
    }

    return ESPACE_STATUS_LABELS[status as EspaceStatus] ?? status;
  });
  protected readonly canSubmitForModeration = computed(() => {
    const status = this.property()?.status;
    return status === 'DRAFT' || status === 'REJECTED' || !status;
  });

  protected readonly previewSafeUrl = computed<SafeResourceUrl | null>(() => {
    const url = this.previewUrl();
    return url ? this.sanitizer.bypassSecurityTrustResourceUrl(url) : null;
  });

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

  private showPropertyTypeSkeletonState(): void {
    if (!this.showPropertyTypeSkeleton()) {
      this.showPropertyTypeSkeleton.set(true);
    }
    if (this.typeCardsLeavingSkeleton()) {
      this.typeCardsLeavingSkeleton.set(false);
    }
  }

  private hidePropertyTypeSkeletonState(): void {
    if (this.showPropertyTypeSkeleton()) {
      this.showPropertyTypeSkeleton.set(false);
    }
    if (this.typeCardsLeavingSkeleton()) {
      this.typeCardsLeavingSkeleton.set(false);
    }
  }

  private leavePropertyTypeSkeletonState(): TimeoutHandle | null {
    if (!this.showPropertyTypeSkeleton() || this.typeCardsLeavingSkeleton()) {
      return null;
    }

    this.typeCardsLeavingSkeleton.set(true);
    return setTimeout(() => {
      this.showPropertyTypeSkeleton.set(false);
      this.typeCardsLeavingSkeleton.set(false);
    }, 220);
  }

  private syncPropertyTypeSkeletonState(
    loading: boolean,
    hasOptions: boolean,
  ): TimeoutHandle | null {
    if (loading && !hasOptions) {
      this.showPropertyTypeSkeletonState();
      return null;
    }

    if (hasOptions) {
      return this.leavePropertyTypeSkeletonState();
    }

    this.hidePropertyTypeSkeletonState();
    return null;
  }

  constructor() {
    effect((onCleanup) => {
      if (!this.hasRequestedPropertyTypes()) {
        return;
      }

      const loading = this.codeListsLoading();
      const hasOptions = this.propertyTypeOptions().length > 0;
      const leaveTimeout = this.syncPropertyTypeSkeletonState(
        loading,
        hasOptions,
      );

      onCleanup(() => {
        if (leaveTimeout !== null) {
          clearTimeout(leaveTimeout);
        }
      });
    });

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

      const action = this.editFinalAction();
      const error = this.editStore.error();

      this.editPending.set(false);
      this.editFinalAction.set(null);

      if (error) {
        this.notifications?.error("La modification de l'espace a échoué.");
        return;
      }

      const id = this.editPropertyId();
      if (!id || !action) {
        return;
      }

      if (action === 'submit') {
        this.submitPending.set(true);
        this.store.soumettre();
        return;
      }

      this.notifications?.success(
        action === 'save'
          ? 'Modifications enregistrées.'
          : 'Modification terminée.',
      );
      void this.router.navigate(['/hotel/espaces', id]);
    });

    effect(() => {
      if (!this.submitPending()) {
        return;
      }

      const prop = this.property();
      if (this.store.saving()) {
        return;
      }

      if (this.store.error()) {
        this.submitPending.set(false);
        return;
      }

      if (prop?.id && prop.status === 'PENDING') {
        this.submitPending.set(false);
        this.store.reset();
        this.router.navigate(['/hotel/espaces', prop.id]);
      }
    });

    effect(() => {
      const options = this.docTypeOptions();
      const current = this.selectedDocType();

      if (!options.length) {
        if (current) {
          this.selectedDocType.set('');
        }
        return;
      }

      if (options.some((option) => option.value === current)) {
        return;
      }

      this.selectedDocType.set(options[0]?.value ?? '');
    });

    effect((onCleanup) => {
      const hasConfirmOverlay = !!(
        this.mediaDeleteTarget() || this.docDeleteTarget()
      );
      const hasDocPreviewOverlay = !!this.previewUrl();
      const hasOverlay = hasConfirmOverlay || hasDocPreviewOverlay;

      this.document.body.classList.toggle('ubax-overlay-open', hasOverlay);

      onCleanup(() => {
        if (hasOverlay) {
          this.document.body.classList.remove('ubax-overlay-open');
        }
      });
    });
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

      const isVideo = file.type.startsWith('video/');
      const mediaType: 'PHOTO' | 'VIDEO' | 'PLAN' = isVideo
        ? 'VIDEO'
        : this._step1().propertyType === 'CONFERENCE_ROOM'
          ? 'PLAN'
          : 'PHOTO';

      if (isVideo) {
        this.store.uploaderMediaPresign({ file, mediaType });
        return;
      }

      this.store.uploaderMediaDirect({ file, mediaType, cover: false });
    });
  }

  ngOnInit(): void {
    this.hasRequestedPropertyTypes.set(true);
    this.store.chargerReferentiels();
    const id = this.editPropertyId();
    if (id) {
      const detailFromNavigation = this.readPropertyDetailFromNavigationState();

      if (detailFromNavigation?.property) {
        this.applyPropertyDetail(detailFromNavigation, id);
        return;
      }

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
    if (this.isModificationLocked()) {
      return;
    }

    submit(this.formStep1, {
      action: async () => {
        this.nextStep();
        return null;
      },
    });
  }

  protected proceedStep2(): void {
    if (this.isModificationLocked()) {
      return;
    }

    submit(this.formStep2, {
      action: async () => {
        this.nextStep();
        return null;
      },
    });
  }

  protected proceedStep3(): void {
    if (this.isModificationLocked()) {
      return;
    }

    submit(this.formStep3, {
      action: async () => {
        this.nextStep();
        return null;
      },
    });
  }

  /**
   * Valide le step 4.
   * - création : crée le brouillon puis ouvre les médias
   * - modification : passe simplement au step suivant
   */
  protected proceedStep4(): void {
    if (this.isModificationLocked()) {
      return;
    }

    submit(this.formStep4, {
      action: async () => {
        if (this.isEditMode()) {
          this.nextStep();
          return null;
        }

        this.store.creerEspace(this.buildPropertyPayload());

        this.step4Pending.set(true);
        return null;
      },
    });
  }

  // ── Media handlers ────────────────────────────────────────────────────────
  protected onMediaFilesSelected(event: Event): void {
    if (this.isModificationLocked()) {
      return;
    }

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

    if (this.isModificationLocked()) {
      return;
    }

    const files = Array.from(event.dataTransfer?.files ?? []);
    this.uploadFiles(files);
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
    if (this.isModificationLocked()) {
      return;
    }

    this.store.definirCouverture(mediaId);
  }

  protected requestDeleteMedia(mediaId: string): void {
    if (this.isModificationLocked()) {
      return;
    }

    this.mediaDeleteTarget.set(mediaId);
  }

  protected cancelDeleteMedia(): void {
    this.mediaDeleteTarget.set(null);
  }

  protected confirmDeleteMedia(): void {
    if (this.isModificationLocked()) {
      return;
    }

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
    if (this.isModificationLocked()) {
      return;
    }

    this.selectedDocType.set(value ?? '');
  }

  protected onDocFileSelected(event: Event): void {
    if (this.isModificationLocked()) {
      return;
    }

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

    const docType =
      this.selectedDocType() || this.docTypeOptions()[0]?.value || '';
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

    if (this.isPublicPropertyMediaUrl(fileUrl)) {
      this.previewName.set('Document');
      this.previewIsImage.set(this.isPreviewImage(fileUrl));
      this.previewIsVideo.set(this.isPreviewVideo(fileUrl));
      this.previewUrl.set(fileUrl);

      if (docId) {
        this.documentOpeningId.set(null);
      }
      return;
    }

    try {
      const response = await firstValueFrom(
        generateReadUrl(this.http, this.apiConfig.rootUrl, { fileUrl }),
      );
      const resolvedUrl =
        this.extractReadUrlFromResponse(response.body) ?? fileUrl;
      this.previewName.set('Document');
      this.previewIsImage.set(this.isPreviewImage(resolvedUrl));
      this.previewIsVideo.set(this.isPreviewVideo(resolvedUrl));
      this.previewUrl.set(resolvedUrl);
    } catch {
      this.previewName.set('Document');
      this.previewIsImage.set(this.isPreviewImage(fileUrl));
      this.previewIsVideo.set(this.isPreviewVideo(fileUrl));
      this.previewUrl.set(fileUrl);
    } finally {
      if (docId) this.documentOpeningId.set(null);
    }
  }

  protected closePreview(): void {
    this.previewUrl.set(null);
    this.previewName.set('Document');
    this.previewIsImage.set(false);
    this.previewIsVideo.set(false);
    this.previewFullscreen.set(false);
  }

  protected togglePreviewFullscreen(): void {
    this.previewFullscreen.update((value) => !value);
  }

  protected requestDeleteDoc(docId: string): void {
    if (this.isModificationLocked()) {
      return;
    }

    this.docDeleteTarget.set(docId);
  }

  protected cancelDeleteDoc(): void {
    this.docDeleteTarget.set(null);
  }

  protected confirmDeleteDoc(): void {
    if (this.isModificationLocked()) {
      return;
    }

    const docId = this.docDeleteTarget();
    if (!docId) return;

    this.store.supprimerDocument(docId);
    this.docDeleteTarget.set(null);
  }

  // ── Final actions ─────────────────────────────────────────────────────────
  protected sauvegarderBrouillon(): void {
    if (this.isModificationLocked()) {
      return;
    }

    if (this.isEditMode()) {
      this.persistEditChanges('save');
      return;
    }

    this.store.reset();
    void this.router.navigate(['/hotel/espaces']);
  }

  protected soumettre(): void {
    if (this.isModificationLocked()) {
      return;
    }

    if (this.isEditMode()) {
      this.persistEditChanges('submit');
      return;
    }

    this.submitPending.set(true);
    this.store.soumettre();
  }

  protected terminerModification(): void {
    if (this.isModificationLocked()) {
      return;
    }

    this.persistEditChanges('finish');
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

  private buildPropertyPayload(): PropertyCreateRequest {
    const s1 = this._step1();
    const s2 = this._step2();
    const s3 = this._step3();
    const s4 = this._step4();

    const amenities: PropertyAmenityRequest[] = s4.amenities.map((code) => ({
      code,
    }));

    const floorNum =
      s2.floor === 'RDC' ? 0 : Number.parseInt(s2.floor, 10) || null;

    return {
      title: s1.title,
      description: s4.description || undefined,
      propertyType: s1.propertyType || undefined,
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
  }

  private persistEditChanges(action: EditFinalAction): void {
    const id = this.editPropertyId();
    if (!id) {
      this.notifications?.error("Identifiant de l'espace introuvable.");
      return;
    }

    this.editFinalAction.set(action);
    this.editStore.updateEspace({ id, ...this.buildPropertyPayload() });
    this.editPending.set(true);
  }

  private async prefillFromProperty(id: string): Promise<void> {
    try {
      const response = await firstValueFrom(
        getPropertyById(this.http, this.apiConfig.rootUrl, { id }),
      );
      const detail = this.extractDetailFromResponse(response.body);
      this.applyPropertyDetail(detail, id);
    } catch {
      this.notifications?.error(
        "Impossible de préremplir l'espace à modifier.",
      );
    }
  }

  private readPropertyDetailFromNavigationState(): PropertyDetailResponse | null {
    const navigationState =
      this.router.getCurrentNavigation()?.extras.state?.['propertyDetail'] ??
      this.document.defaultView?.history.state?.['propertyDetail'];

    return this.extractDetailFromResponse(navigationState);
  }

  private applyPropertyDetail(
    detail: PropertyDetailResponse | null,
    propertyId: string,
  ): void {
    const property = detail?.property;

    if (!property) {
      return;
    }

    this.store.hydrateExistingDraftContext({
      propertyId,
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

  private extractReadUrlFromResponse(body: unknown): string | null {
    if (!body || typeof body !== 'object') {
      return null;
    }

    const direct = body as { readUrl?: unknown };
    if (typeof direct.readUrl === 'string' && direct.readUrl.length > 0) {
      return direct.readUrl;
    }

    const wrapped = body as { data?: unknown };
    if (wrapped.data && typeof wrapped.data === 'object') {
      const nested = wrapped.data as { readUrl?: unknown };
      if (typeof nested.readUrl === 'string' && nested.readUrl.length > 0) {
        return nested.readUrl;
      }
    }

    return null;
  }

  private isPublicPropertyMediaUrl(fileUrl: string): boolean {
    return /\/properties-media\//i.test(fileUrl);
  }

  private isPreviewImage(url: string): boolean {
    return /(\.png|\.jpe?g|\.webp|\.gif|\.bmp|\.svg)(\?|$|\s)/i.test(url);
  }

  private isPreviewVideo(url: string): boolean {
    return /(\.mp4|\.webm|\.ogg|\.mov|\.m4v)(\?|$|\s)/i.test(url);
  }
}

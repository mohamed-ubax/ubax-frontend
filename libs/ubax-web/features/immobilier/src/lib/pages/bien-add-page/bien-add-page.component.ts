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
import { Router } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import {
  form,
  submit,
  required,
  min,
  max,
  maxLength,
  FormField,
} from '@angular/forms/signals';
import {
  NOTIFICATION_HANDLER,
  type NotificationHandler,
  UbaxSubRole,
} from '@ubax-workspace/shared-data-access';
import {
  ApiConfiguration,
  generateReadUrl,
  PropertyAmenityRequest,
} from '@ubax-workspace/shared-api-types';
import {
  AuthStore,
  BienCreationStore,
} from '@ubax-workspace/ubax-web-data-access';
import { firstValueFrom } from 'rxjs';

const WIZARD_STEPS = [
  { label: 'Informations' },
  { label: 'Surfaces & pièces' },
  { label: 'Localisation' },
  { label: 'Équipements & Prix' },
  { label: 'Médias' },
  { label: 'Finalisation' },
] as const;

const DEFAULT_DOC_TYPE_LABELS: Record<string, string> = {
  TITRE_FONCIER: 'Titre foncier',
  PERMIS_CONSTRUIRE: 'Permis de construire',
  DIAGNOSTIC: 'Diagnostic',
  CONTRAT_BAIL: 'Contrat de bail',
  AUTRE: 'Autre',
};

const ACCEPTED_MEDIA =
  'image/jpeg,image/png,image/webp,video/mp4,video/quicktime';
const ACCEPTED_DOCS = 'application/pdf,image/jpeg,image/png,image/webp';
const MAX_DOC_SIZE_MB = 20;

const AMENITY_ICON_BY_CODE: Record<string, string> = {
  AC: 'pi-wind',
  PARKING: 'pi-car',
  POOL: 'pi-circle',
  GENERATOR: 'pi-bolt',
  SECURITY: 'pi-shield',
  ELEVATOR: 'pi-arrow-up',
  WATER_TANK: 'pi-filter',
  GARDEN: 'pi-sun',
  FURNISHED: 'pi-home',
  PETS_ALLOWED: 'pi-heart',
  PMR: 'pi-user',
};

type AmenityOption = { code: string; label: string; icon: string };
type DocTypeOption = { value: string; label: string };
type UploadTimelineStep = {
  key: 'presigning' | 'uploading' | 'registering';
  label: string;
  description: string;
  status: 'done' | 'active' | 'pending';
};

function resolveTimelineStatus(
  activeIndex: number,
  stepIndex: number,
): UploadTimelineStep['status'] {
  if (activeIndex > stepIndex) {
    return 'done';
  }

  if (activeIndex === stepIndex) {
    return 'active';
  }

  return 'pending';
}

// ── Form models (one interface per wizard step) ─────────────────────────────

interface BienStep1 {
  title: string;
  propertyType: string;
  transactionType: string;
  condition: string;
  yearBuilt: number | null;
  /** Optional – falls back to the current user id when not provided. */
  ownerId: string;
}

interface BienStep2 {
  rooms: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  balconies: number | null;
  surfaceTotal: number | null;
  surfaceLiving: number | null;
  floor: number | null;
  totalFloors: number | null;
}

interface BienStep3 {
  city: string;
  district: string;
  street: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
}

interface BienStep4 {
  price: number;
  description: string;
  /** Codes des commodités standard sélectionnées (ex: 'AC', 'PARKING'). */
  amenities: string[];
}

@Component({
  selector: 'ubax-bien-add-page',
  standalone: true,
  imports: [FormField, DecimalPipe],
  providers: [BienCreationStore],
  templateUrl: './bien-add-page.component.html',
  styleUrl: './bien-add-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BienAddPageComponent implements OnInit {
  private readonly store = inject(BienCreationStore);
  private readonly authStore = inject(AuthStore);
  private readonly router = inject(Router);
  private readonly http = inject(HttpClient);
  private readonly apiConfig = inject(ApiConfiguration);
  private readonly notifications = inject(NOTIFICATION_HANDLER, {
    optional: true,
  }) as NotificationHandler | null;

  protected readonly saving = this.store.saving;
  protected readonly error = this.store.error;
  protected readonly medias = this.store.medias;
  protected readonly documents = this.store.documents;
  protected readonly property = this.store.property;
  protected readonly propertyId = this.store.propertyId;
  protected readonly bailleurs = this.store.bailleurs;
  protected readonly propertyTypes = this.store.codeListPropertyTypes;
  protected readonly transactionTypes = this.store.codeListTransactionTypes;
  protected readonly cities = this.store.codeListCities;
  protected readonly amenitiesCodeList = this.store.codeListAmenities;
  protected readonly documentTypesCodeList = this.store.codeListDocumentTypes;
  protected readonly documentUploadStage = this.store.documentUploadStage;
  protected readonly documentOpeningId = signal<string | null>(null);

  protected readonly isSessionError = computed(() => {
    const msg = this.error() ?? '';
    return (
      msg.includes('401') ||
      /session expir/i.test(msg) ||
      /unauthorized/i.test(msg) ||
      /non autoris/i.test(msg)
    );
  });

  protected expireAndRedirect(): void {
    this.authStore.expireSession();
  }

  protected readonly canManageMedia = computed(() => {
    const sr = this.authStore.user()?.subRole;
    return sr === UbaxSubRole.DIRECTEUR_AGENCE || sr === UbaxSubRole.COMMERCIAL;
  });
  protected readonly canManageDocs = computed(
    () => this.authStore.user()?.subRole === UbaxSubRole.DIRECTEUR_AGENCE,
  );

  protected readonly steps = WIZARD_STEPS;
  protected readonly activeStep = signal(0);
  protected readonly docTypes = computed<DocTypeOption[]>(() =>
    this.documentTypesCodeList().map((item) => {
      const value = item.value ?? '';
      return {
        value,
        label:
          (item.description ?? DEFAULT_DOC_TYPE_LABELS[value] ?? value) ||
          'Type',
      };
    }),
  );
  protected readonly amenityOptions = computed<AmenityOption[]>(() =>
    this.amenitiesCodeList().map((item) => {
      const code = item.value ?? '';
      return {
        code,
        label: item.description ?? code,
        icon: AMENITY_ICON_BY_CODE[code] ?? 'pi-star',
      };
    }),
  );
  protected readonly documentUploadTimeline = computed<UploadTimelineStep[]>(
    () => {
      const stage = this.documentUploadStage();

      if (stage === 'idle') {
        return [];
      }

      const stageOrder: UploadTimelineStep['key'][] = [
        'presigning',
        'uploading',
        'registering',
      ];
      const activeIndex = stageOrder.indexOf(stage);

      return [
        {
          key: 'presigning',
          label: 'URL sécurisée',
          description: "Préparation de l'URL présignée",
          status: resolveTimelineStatus(activeIndex, 0),
        },
        {
          key: 'uploading',
          label: 'Upload du fichier',
          description: 'Envoi du document vers le stockage',
          status: resolveTimelineStatus(activeIndex, 1),
        },
        {
          key: 'registering',
          label: 'Association au bien',
          description: 'Création du document légal côté application',
          status: resolveTimelineStatus(activeIndex, 2),
        },
      ];
    },
  );
  protected readonly acceptedMedia = ACCEPTED_MEDIA;
  protected readonly acceptedDocs = ACCEPTED_DOCS;

  // ── Signal Forms – step 1 (Informations générales) ──────────────────────
  private readonly _step1 = signal<BienStep1>({
    title: 'Villa familiale avec jardin privatif',
    propertyType: '',
    transactionType: '',
    condition: 'GOOD',
    yearBuilt: 2014,
    ownerId: '',
  });
  protected readonly formStep1 = form(this._step1, (p) => {
    required(p.title, { message: 'Le titre est requis' });
    maxLength(p.title, 200, { message: '200 caractères maximum' });
    required(p.propertyType, { message: 'Le type de bien est requis' });
    required(p.transactionType, { message: "Le type d'annonce est requis" });
    min(p.yearBuilt, 1800, { message: 'Année invalide (min 1800)' });
    max(p.yearBuilt, new Date().getFullYear(), { message: 'Année invalide' });
  });

  // ── Signal Forms – step 2 (Surfaces & pièces) ────────────────────────────
  private readonly _step2 = signal<BienStep2>({
    rooms: 6,
    bedrooms: 4,
    bathrooms: 2,
    balconies: 2,
    surfaceTotal: 280,
    surfaceLiving: 210,
    floor: 0,
    totalFloors: 2,
  });
  protected readonly formStep2 = form(this._step2, (p) => {
    min(p.rooms, 0);
    min(p.bedrooms, 0);
    min(p.bathrooms, 0);
    min(p.balconies, 0);
    min(p.surfaceTotal, 0);
    min(p.surfaceLiving, 0);
    min(p.totalFloors, 0);
  });

  // ── Signal Forms – step 3 (Localisation) ─────────────────────────────────
  private readonly _step3 = signal<BienStep3>({
    city: '',
    district: 'Riviera 3',
    street: 'Boulevard Latrille',
    address: 'Lot 48, îlot 7, Riviera 3',
    latitude: 5.3568,
    longitude: -3.9669,
  });
  protected readonly formStep3 = form(this._step3, (p) => {
    required(p.city, { message: 'La ville est requise' });
    min(p.latitude, -90, { message: 'Latitude entre -90 et 90' });
    max(p.latitude, 90, { message: 'Latitude entre -90 et 90' });
    min(p.longitude, -180, { message: 'Longitude entre -180 et 180' });
    max(p.longitude, 180, { message: 'Longitude entre -180 et 180' });
  });

  // ── Signal Forms – step 4 (Équipements & Prix) ───────────────────────────
  private readonly _step4 = signal<BienStep4>({
    price: 950000,
    description:
      'Villa spacieuse en zone résidentielle calme, avec grand séjour, jardin arboré et stationnement intérieur sécurisé.',
    amenities: ['AC', 'SECURITY', 'PARKING', 'GARDEN', 'WATER_TANK'],
  });
  protected readonly formStep4 = form(this._step4, (p) => {
    required(p.price, { message: 'Le prix est requis' });
    min(p.price, 0, { message: 'Le prix doit être positif ou nul' });
  });

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

  protected readonly selectedDocType = signal<string>('');
  protected readonly docTitle = signal<string>('');
  protected readonly docFileError = signal<string | null>(null);
  protected readonly isDragOver = signal(false);
  protected readonly mediaDeleteTarget = signal<string | null>(null);
  protected readonly docDeleteTarget = signal<string | null>(null);
  protected readonly coverWarnVisible = signal(false);

  /** Becomes true once proceedStep4 triggers creerBrouillon, resets on navigation. */
  private readonly step4Pending = signal(false);

  protected readonly coverMediaId = computed(
    () => this.medias().find((m) => m.cover)?.id ?? null,
  );

  constructor() {
    // Once referentials are loaded, auto-select first valid options for test runs.
    effect(() => {
      const firstPropertyType = this.propertyTypes()[0]?.value ?? '';
      const firstTransactionType = this.transactionTypes()[0]?.value ?? '';
      const firstCity = this.cities()[0]?.value ?? '';

      this._step1.update((s) => ({
        ...s,
        propertyType: s.propertyType || firstPropertyType,
        transactionType: s.transactionType || firstTransactionType,
      }));
      this._step3.update((s) => ({
        ...s,
        city: s.city || firstCity,
      }));

      const availableDocTypes = this.docTypes();
      const firstDocType = availableDocTypes[0]?.value ?? '';
      if (
        firstDocType &&
        !availableDocTypes.some((dt) => dt.value === this.selectedDocType())
      ) {
        this.selectedDocType.set(firstDocType);
      }
    });

    // Redirect to detail page once the bien transitions to PENDING status.
    effect(() => {
      const prop = this.property();
      if (prop?.id && prop.status === 'PENDING') {
        this.store.reset();
        this.router.navigate(['/immobilier', prop.id]);
      }
    });

    // Advance to the media step as soon as the brouillon creation completes.
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
  }

  ngOnInit(): void {
    this.store.chargerReferentiels();
  }

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

  // ── Step advances ────────────────────────────────────────────────────────

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
   * Validates step 4, then triggers bien creation.
   * Navigation to step 5 happens reactively once the store confirms the creation.
   */
  protected proceedStep4(): void {
    submit(this.formStep4, {
      action: async () => {
        const s1 = this._step1();
        const s2 = this._step2();
        const s3 = this._step3();
        const s4 = this._step4();
        const ownerId = s1.ownerId || undefined;

        const amenities: PropertyAmenityRequest[] = s4.amenities.map(
          (code) => ({ code }),
        );

        this.store.creerBrouillon({
          title: s1.title || undefined,
          propertyType: s1.propertyType || undefined,
          transactionType: s1.transactionType || undefined,
          condition: s1.condition || undefined,
          yearBuilt: s1.yearBuilt ?? undefined,
          ownerId,
          rooms: s2.rooms ?? undefined,
          bedrooms: s2.bedrooms ?? undefined,
          bathrooms: s2.bathrooms ?? undefined,
          balconies: s2.balconies ?? undefined,
          surfaceTotal: s2.surfaceTotal ?? undefined,
          surfaceLiving: s2.surfaceLiving ?? undefined,
          floor: s2.floor ?? undefined,
          totalFloors: s2.totalFloors ?? undefined,
          city: s3.city || undefined,
          district: s3.district || undefined,
          street: s3.street || undefined,
          address: s3.address || undefined,
          latitude: s3.latitude ?? undefined,
          longitude: s3.longitude ?? undefined,
          price: s4.price ?? 0,
          description: s4.description || undefined,
          amenities: amenities.length > 0 ? amenities : undefined,
        });

        this.step4Pending.set(true);
        return null;
      },
    });
  }

  // ── Media handlers ───────────────────────────────────────────────────────

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
    files.forEach((file) => {
      const mediaType = file.type.startsWith('video/') ? 'VIDEO' : 'PHOTO';
      this.store.uploaderMediaDirect({
        file,
        mediaType,
        cover: false,
      });
    });
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

  // ── Document handlers ────────────────────────────────────────────────────

  protected onDocFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    if (file.size > MAX_DOC_SIZE_MB * 1024 * 1024) {
      this.docFileError.set(
        `Fichier trop volumineux (max ${MAX_DOC_SIZE_MB} Mo)`,
      );
      input.value = '';
      return;
    }
    this.docFileError.set(null);
    const title = this.docTitle() || file.name;
    this.store.uploaderDocument({
      file,
      docType: this.selectedDocType(),
      title,
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

  // ── Final actions ────────────────────────────────────────────────────────

  protected sauvegarderBrouillon(): void {
    this.store.reset();
    this.router.navigate(['/immobilier']);
  }

  protected soumettre(): void {
    this.store.soumettre();
  }

  // ── Helpers ──────────────────────────────────────────────────────────────

  protected docTypeLabel(value: string): string {
    return this.docTypes().find((d) => d.value === value)?.label ?? value;
  }

  protected formatBytes(bytes?: number): string {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} o`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
  }
}

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
import { ActivatedRoute, Router } from '@angular/router';
import { DecimalPipe, DOCUMENT } from '@angular/common';
import { DomSanitizer, type SafeResourceUrl } from '@angular/platform-browser';
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
  getById1 as getPropertyById,
  PropertyDetailResponse,
  PropertyAmenityRequest,
} from '@ubax-workspace/shared-api-types';
import {
  AuthStore,
  BienCreationStore,
  BienEditStore,
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

const PROPERTY_STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Brouillon',
  PENDING: 'En attente',
  PUBLISHED: 'Publié',
  RESERVED: 'Réservé',
  SOLD: 'Vendu',
  ARCHIVED: 'Archivé',
  REJECTED: 'Rejeté',
};

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

function isEditablePropertyStatus(status: string | null | undefined): boolean {
  return status === 'DRAFT' || status === 'REJECTED';
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
  providers: [BienCreationStore, BienEditStore],
  templateUrl: './bien-add-page.component.html',
  styleUrl: './bien-add-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BienAddPageComponent implements OnInit {
  private readonly store = inject(BienCreationStore);
  private readonly editStore = inject(BienEditStore);
  private readonly authStore = inject(AuthStore);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly http = inject(HttpClient);
  private readonly apiConfig = inject(ApiConfiguration);
  private readonly document = inject(DOCUMENT);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly notifications = inject(NOTIFICATION_HANDLER, {
    optional: true,
  }) as NotificationHandler | null;

  protected readonly saving = this.store.saving;
  protected readonly isWorking = computed(
    () => this.store.saving() || this.editStore.saving(),
  );
  private readonly guardedError = signal<string | null>(null);
  protected readonly error = computed(
    () => this.guardedError() ?? this.store.error(),
  );
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
  protected readonly previewUrl = signal<string | null>(null);
  protected readonly previewName = signal<string>('Document');
  protected readonly previewFullscreen = signal(false);
  protected readonly previewIsImage = signal(false);
  protected readonly previewIsVideo = signal(false);
  protected readonly previewSafeUrl = computed<SafeResourceUrl | null>(() => {
    const url = this.previewUrl();
    return url ? this.sanitizer.bypassSecurityTrustResourceUrl(url) : null;
  });

  protected readonly isSessionError = computed(() => {
    const msg = this.error() ?? '';
    return (
      msg.includes('401') ||
      /token.*authentification/i.test(msg) ||
      /session expir/i.test(msg) ||
      /unauthorized/i.test(msg) ||
      /non autoris/i.test(msg)
    );
  });

  protected readonly hasWritableSession = computed(() => {
    const token = this.authStore.token();
    return !!token;
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
    title: '',
    propertyType: '',
    transactionType: '',
    condition: '',
    yearBuilt: null,
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
    rooms: null,
    bedrooms: null,
    bathrooms: null,
    balconies: null,
    surfaceTotal: null,
    surfaceLiving: null,
    floor: null,
    totalFloors: null,
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
    district: '',
    street: '',
    address: '',
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

  // ── Signal Forms – step 4 (Équipements & Prix) ───────────────────────────
  private readonly _step4 = signal<BienStep4>({
    price: 0,
    description: '',
    amenities: [],
  });
  protected readonly formStep4 = form(this._step4, (p) => {
    required(p.price, { message: 'Le prix est requis' });
    min(p.price, 0, { message: 'Le prix doit être positif ou nul' });
  });

  protected isAmenitySelected(code: string): boolean {
    return this._step4().amenities.includes(code);
  }

  protected toggleAmenity(code: string): void {
    if (this.isModificationLocked()) {
      return;
    }

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
  private readonly editPending = signal(false);
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

    return !isEditablePropertyStatus(property.status ?? null);
  });
  protected readonly modificationLockedStatusLabel = computed(() => {
    const status = this.property()?.status;

    if (!status) {
      return 'inconnu';
    }

    return PROPERTY_STATUS_LABELS[status] ?? status;
  });
  protected readonly canSubmitForModeration = computed(() => {
    const status = this.property()?.status;
    return status === 'DRAFT' || status === 'REJECTED' || !status;
  });

  protected readonly coverMediaId = computed(
    () => this.medias().find((m) => m.cover)?.id ?? null,
  );

  constructor() {
    // Redirect to detail page only after an explicit submit action.
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
        this.router.navigate(['/biens', prop.id]);
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
        this.guardedError.set(null);
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
        this.notifications?.error('La modification du bien a échoué.');
        return;
      }

      const id = this.editPropertyId();
      this.editPending.set(false);
      if (!id) {
        return;
      }

      this.notifications?.success('Informations du bien mises à jour.');
      this.guardedError.set(null);
      this.nextStep();
    });

    effect(() => {
      const options = this.docTypes();
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

    // Lower topbar when any overlay is open.
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

  ngOnInit(): void {
    this.store.chargerReferentiels();
    this.guardedError.set(null);
    const id = this.editPropertyId();
    if (id) {
      void this.prefillFromProperty(id);
    }
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
   * Validates step 4, then triggers bien creation.
   * Navigation to step 5 happens reactively once the store confirms the creation.
   */
  protected proceedStep4(): void {
    if (this.isModificationLocked()) {
      return;
    }

    submit(this.formStep4, {
      action: async () => {
        if (!this.ensureWritableSession()) {
          return null;
        }

        const s1 = this._step1();
        const s2 = this._step2();
        const s3 = this._step3();
        const s4 = this._step4();
        const ownerId = s1.ownerId || undefined;

        const amenities: PropertyAmenityRequest[] = s4.amenities.map(
          (code) => ({ code }),
        );

        const payload = {
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
        };

        if (this.isEditMode()) {
          const id = this.editPropertyId();
          if (!id) {
            this.notifications?.error('Identifiant du bien introuvable.');
            return null;
          }

          this.editStore.updateProperty({ id, ...payload });
          this.editPending.set(true);
          return null;
        }

        this.store.creerBrouillon({
          ...payload,
        });

        this.step4Pending.set(true);
        return null;
      },
    });
  }

  // ── Media handlers ───────────────────────────────────────────────────────

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

  private uploadFiles(files: File[]): void {
    if (!this.ensureWritableSession()) {
      return;
    }

    files.forEach((file) => {
      const isVideo = file.type.startsWith('video/');
      const mediaType = isVideo ? 'VIDEO' : 'PHOTO';

      if (isVideo) {
        this.store.uploaderMediaPresign({
          file,
          mediaType,
        });
        return;
      }

      this.store.uploaderMediaDirect({
        file,
        mediaType,
        cover: false,
      });
    });
  }

  protected setCover(mediaId: string): void {
    if (this.isModificationLocked()) {
      return;
    }

    if (!this.ensureWritableSession()) {
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
    if (!mediaId || !this.ensureWritableSession()) return;
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
    if (this.isModificationLocked()) {
      const input = event.target as HTMLInputElement;
      input.value = '';
      return;
    }

    if (!this.ensureWritableSession()) {
      const input = event.target as HTMLInputElement;
      input.value = '';
      return;
    }

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

    const docType = this.selectedDocType() || this.docTypes()[0]?.value || '';
    if (!docType) {
      this.docFileError.set('Veuillez sélectionner un type de document.');
      input.value = '';
      return;
    }

    this.docFileError.set(null);
    const title = this.docTitle() || file.name;
    this.store.uploaderDocument({
      file,
      docType,
      title,
    });
    input.value = '';
    this.docTitle.set('');
  }

  protected async openDocument(
    fileUrl: string,
    fileName?: string,
    docId?: string,
  ): Promise<void> {
    if (!fileUrl) return;

    if (docId) this.documentOpeningId.set(docId);
    if (this.isPublicPropertyMediaUrl(fileUrl)) {
      this.previewName.set(fileName?.trim() || 'Document');
      this.previewIsImage.set(this.isPreviewImage(fileUrl, fileName));
      this.previewIsVideo.set(this.isPreviewVideo(fileUrl, fileName));
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
      this.previewName.set(fileName?.trim() || 'Document');
      this.previewIsImage.set(this.isPreviewImage(resolvedUrl, fileName));
      this.previewIsVideo.set(this.isPreviewVideo(resolvedUrl, fileName));
      this.previewUrl.set(resolvedUrl);
    } catch {
      this.previewName.set(fileName?.trim() || 'Document');
      this.previewIsImage.set(this.isPreviewImage(fileUrl, fileName));
      this.previewIsVideo.set(this.isPreviewVideo(fileUrl, fileName));
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
    if (!docId || !this.ensureWritableSession()) return;
    this.store.supprimerDocument(docId);
    this.docDeleteTarget.set(null);
  }

  // ── Final actions ────────────────────────────────────────────────────────

  protected sauvegarderBrouillon(): void {
    if (this.isModificationLocked()) {
      return;
    }

    this.store.reset();
    this.router.navigate(['/biens']);
  }

  protected soumettre(): void {
    if (this.isModificationLocked()) {
      return;
    }

    if (!this.ensureWritableSession()) {
      return;
    }

    this.submitPending.set(true);
    this.store.soumettre();
  }

  protected terminerModification(): void {
    if (this.isModificationLocked()) {
      return;
    }

    const id = this.editPropertyId();
    if (!id) {
      return;
    }

    this.notifications?.success('Modifications enregistrées.');
    void this.router.navigate(['/biens', id]);
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

  private ensureWritableSession(): boolean {
    if (this.hasWritableSession()) {
      this.guardedError.set(null);
      return true;
    }

    this.submitPending.set(false);
    this.step4Pending.set(false);
    this.editPending.set(false);

    const message =
      'Cette action requiert une session authentifiée valide. Reconnectez-vous au portail pour continuer.';

    this.guardedError.set(message);
    this.notifications?.error(message);
    return false;
  }

  private async prefillFromProperty(id: string): Promise<void> {
    try {
      const response = await firstValueFrom(
        getPropertyById(this.http, this.apiConfig.rootUrl, { id }),
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
        yearBuilt: property.yearBuilt ?? state.yearBuilt,
        ownerId: property.ownerId ?? state.ownerId,
      }));

      this._step2.update((state) => ({
        ...state,
        rooms: property.rooms ?? state.rooms,
        bedrooms: property.bedrooms ?? state.bedrooms,
        bathrooms: property.bathrooms ?? state.bathrooms,
        balconies: property.balconies ?? state.balconies,
        surfaceTotal: property.surfaceTotal ?? state.surfaceTotal,
        surfaceLiving: property.surfaceLiving ?? state.surfaceLiving,
        floor: property.floor ?? state.floor,
        totalFloors: property.totalFloors ?? state.totalFloors,
      }));

      this._step3.update((state) => ({
        ...state,
        city: property.city ?? state.city,
        district: property.district ?? state.district,
        street: property.street ?? state.street,
        address: property.address ?? state.address,
        latitude: property.latitude ?? state.latitude,
        longitude: property.longitude ?? state.longitude,
      }));

      this._step4.update((state) => ({
        ...state,
        price: property.price ?? state.price,
        description: property.description ?? state.description,
        amenities:
          property.amenities
            ?.map((item) => item.code ?? '')
            .filter((code) => code.length > 0) ?? state.amenities,
      }));
    } catch {
      this.notifications?.error(
        'Impossible de préremplir le formulaire de modification.',
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

  private isPreviewImage(url: string, fileName?: string): boolean {
    const target = `${fileName ?? ''} ${url}`.toLowerCase();
    return /(\.png|\.jpe?g|\.webp|\.gif|\.bmp|\.svg)(\?|$|\s)/.test(target);
  }

  private isPreviewVideo(url: string, fileName?: string): boolean {
    const target = `${fileName ?? ''} ${url}`.toLowerCase();
    return /(\.mp4|\.webm|\.ogg|\.mov|\.m4v)(\?|$|\s)/.test(target);
  }
}

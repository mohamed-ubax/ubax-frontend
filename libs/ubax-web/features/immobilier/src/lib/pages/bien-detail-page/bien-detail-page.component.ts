import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MesBiensStore } from '@ubax-workspace/ubax-web-data-access';
import {
  NOTIFICATION_HANDLER,
  NotificationHandler,
} from '@ubax-workspace/shared-data-access';

type BienDocument = {
  readonly name: string;
};

type BienMetric = {
  readonly label: string;
  readonly value: string;
};

type BienComment = {
  readonly author: string;
  readonly avatar: string;
  readonly rating: number;
  readonly review: string;
};

const GALLERY_IMAGES = [
  'shared/rooms/room-photo-01.webp',
  'biens/detail/property-side-01.webp',
  'biens/detail/property-side-02.webp',
  'biens/detail/property-side-03.webp',
] as const;

const PROPERTY_METRICS: readonly BienMetric[] = [
  { label: 'Chambres', value: '2' },
  { label: 'Salles de bains', value: '1' },
  { label: 'Salon', value: '1' },
  { label: 'Cuisine', value: '1' },
  { label: 'Surface', value: '200 m²' },
] as const;

const PROPERTY_DOCUMENTS: readonly BienDocument[] = [
  { name: 'Facture' },
  { name: 'État des lieux d’entrée' },
  { name: 'CNI ivoirienne' },
] as const;

const AMENITY_COLUMNS = [
  ['Climatisation', 'Placards intégrés', 'Cuisine équipée', 'Balcon'],
  [
    'Gardiennage 24h/24',
    'Caméras de surveillance',
    'Interphone',
    'Réservoir d’eau',
  ],
  ['Groupe électrogène', 'Ascenseur', 'Parking privé', 'Balcon'],
] as const;

const PROPERTY_COMMENTS: readonly BienComment[] = [
  {
    author: 'Aïcha Kouadio',
    avatar: 'biens/detail/comment-user-01.webp',
    rating: 4,
    review:
      'Appartement très propre et bien situé. La résidence est calme et sécurisée. Je recommande vivement, surtout pour les familles.',
  },
  {
    author: 'Jean-Claude N’Guessan',
    avatar: 'biens/detail/comment-user-02.webp',
    rating: 5,
    review:
      'Appartement conforme aux photos. Très spacieux et confortable. Le propriétaire est sérieux et réactif.',
  },
  {
    author: 'Mariam Koné',
    avatar: 'biens/detail/comment-user-03.webp',
    rating: 4,
    review:
      'J’ai adoré le balcon et la cuisine moderne. Le quartier est pratique avec tout à proximité. Je me sens en sécurité ici.',
  },
] as const;

@Component({
  selector: 'ubax-bien-detail-page',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './bien-detail-page.component.html',
  styleUrl: './bien-detail-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BienDetailPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly store = inject(MesBiensStore);
  private readonly document = inject(DOCUMENT);
  private readonly notifications = inject(NOTIFICATION_HANDLER, {
    optional: true,
  }) as NotificationHandler | null;

  protected readonly documents = PROPERTY_DOCUMENTS;
  protected readonly metrics = PROPERTY_METRICS;
  protected readonly amenityColumns = AMENITY_COLUMNS;
  protected readonly comments = PROPERTY_COMMENTS;
  protected readonly ratingStars = [1, 2, 3, 4, 5] as const;
  protected readonly galleryImages = GALLERY_IMAGES;
  protected readonly activeImageIndex = signal(0);
  protected readonly archiveConfirmOpen = signal(false);
  protected readonly archivePending = signal(false);
  protected readonly propertyArchived = signal(false);

  private readonly propertyId = signal<string | null>(null);

  protected readonly activeImage = computed(
    () => this.galleryImages[this.activeImageIndex()],
  );

  protected readonly propertyTitle = computed(
    () =>
      this.store.selectedItem()?.title?.trim() || 'Appartement Haut Standing',
  );

  protected readonly propertyStatus = computed(() =>
    this.propertyArchived() || this.store.selectedItem()?.status === 'ARCHIVED'
      ? 'Archivé'
      : 'Actif',
  );

  protected readonly archiveDisabled = computed(
    () => this.archivePending() || this.propertyStatus() === 'Archivé',
  );

  constructor() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.propertyId.set(id);
      this.store.loadOne?.(id);
    }

    effect(() => {
      const archivedId = this.store.lastArchivedPropertyId();
      const id = this.propertyId();

      if (!archivedId || !id || archivedId !== id) {
        return;
      }

      this.propertyArchived.set(true);
      this.archivePending.set(false);
      this.archiveConfirmOpen.set(false);
      this.notifications?.success(
        `Le bien "${this.propertyTitle()}" est maintenant archivé.`,
      );
      this.store.clearArchiveFeedback();
    });

    effect(() => {
      const archiveError = this.store.archiveError();
      if (!archiveError || !this.archivePending()) {
        return;
      }

      this.archivePending.set(false);
      this.notifications?.error(
        "Une erreur est survenue lors de l'archivage du bien.",
      );
      this.store.clearArchiveFeedback();
    });

    effect((onCleanup) => {
      const hasArchiveOverlay = this.archiveConfirmOpen();
      this.document.body.classList.toggle(
        'ubax-overlay-open',
        hasArchiveOverlay,
      );

      onCleanup(() => {
        if (hasArchiveOverlay) {
          this.document.body.classList.remove('ubax-overlay-open');
        }
      });
    });
  }

  protected selectImage(index: number): void {
    this.activeImageIndex.set(index);
  }

  protected previousImage(): void {
    this.activeImageIndex.update((current) =>
      current === 0 ? this.galleryImages.length - 1 : current - 1,
    );
  }

  protected nextImage(): void {
    this.activeImageIndex.update((current) =>
      current === this.galleryImages.length - 1 ? 0 : current + 1,
    );
  }

  protected openArchiveConfirm(): void {
    if (this.archiveDisabled()) {
      return;
    }

    this.archiveConfirmOpen.set(true);
  }

  protected closeArchiveConfirm(): void {
    if (this.archivePending()) {
      return;
    }

    this.archiveConfirmOpen.set(false);
  }

  protected confirmArchive(): void {
    const id = this.propertyId();
    if (!id || this.archivePending() || this.propertyStatus() === 'Archivé') {
      return;
    }

    this.archivePending.set(true);
    this.store.archiveProperty({
      id,
      preserveInList: true,
    });
  }
}

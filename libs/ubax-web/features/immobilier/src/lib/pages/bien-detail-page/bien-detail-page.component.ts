import {
  ChangeDetectionStrategy,
  Component,
  computed,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';

interface BienDocument {
  readonly name: string;
}

interface BienMetric {
  readonly label: string;
  readonly value: string;
}

interface BienComment {
  readonly author: string;
  readonly avatar: string;
  readonly rating: number;
  readonly review: string;
}

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
  protected readonly documents = PROPERTY_DOCUMENTS;
  protected readonly metrics = PROPERTY_METRICS;
  protected readonly amenityColumns = AMENITY_COLUMNS;
  protected readonly comments = PROPERTY_COMMENTS;
  protected readonly ratingStars = [1, 2, 3, 4, 5] as const;
  protected readonly galleryImages = GALLERY_IMAGES;
  protected readonly activeImageIndex = signal(0);

  protected readonly activeImage = computed(
    () => this.galleryImages[this.activeImageIndex()],
  );

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
}

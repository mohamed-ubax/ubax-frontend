import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map } from 'rxjs';

interface GuestProfile {
  readonly name: string;
  readonly code: string;
  readonly avatar: string;
}

interface ReservationDetail {
  readonly title: string;
  readonly type: string;
  readonly capacity: string;
  readonly bookingDate: string;
  readonly bookingTime: string;
  readonly stayDuration: string;
  readonly facilities: readonly string[];
}

interface GalleryPhoto {
  readonly src: string;
  readonly alt: string;
  readonly previewCount?: number;
}

interface HistoryRow {
  readonly id: number;
  readonly guestName: string;
  readonly property: string;
  readonly duration: string;
  readonly period: string;
  readonly status: 'Confirmé';
  readonly avatar: string;
}

interface SpaceDetailData {
  readonly guest: GuestProfile;
  readonly reservation: ReservationDetail;
  readonly totalGalleryCount: number;
  readonly galleryPhotos: readonly GalleryPhoto[];
  readonly historyRows: readonly HistoryRow[];
}

const DEFAULT_DETAIL_ID = '1';

function createHistoryRows(
  rows: ReadonlyArray<Omit<HistoryRow, 'id'>>,
): readonly HistoryRow[] {
  return rows.map((row, index) => ({
    id: index + 1,
    ...row,
  }));
}

const SPACE_DETAILS: Record<string, SpaceDetailData> = {
  '1': {
    guest: {
      name: 'Landry Bamba',
      code: '#G-001234125',
      avatar: 'room-detail/avatars/guest-landry.png',
    },
    reservation: {
      title: 'Chambre Queen A-2345 - hotel Azalai',
      type: 'Double Bed',
      capacity: '2 - 3 personnes',
      bookingDate: 'Lundi 15 juin 2026',
      bookingTime: '08:29',
      stayDuration: '2 jours',
      facilities: [
        'Climatisation',
        'LED TV',
        'Baignoire',
        'Game Console',
        'Lit double',
        'Wi-Fi',
      ],
    },
    totalGalleryCount: 8,
    galleryPhotos: [
      {
        src: 'room-detail/images/gallery-main.png',
        alt: 'Vue principale de la chambre',
      },
      {
        src: 'room-detail/images/gallery-thumb-01.png',
        alt: 'Aperçu chambre angle 1',
      },
      {
        src: 'room-detail/images/gallery-thumb-03.png',
        alt: 'Aperçu chambre angle 2',
      },
      {
        src: 'room-detail/images/gallery-thumb-04.png',
        alt: 'Aperçu chambre angle 3',
        previewCount: 8,
      },
    ],
    historyRows: createHistoryRows([
      {
        guestName: 'Koné Ibrahim',
        property: 'Résidence Plateau',
        duration: '2 jours',
        period: '14 / 04 / 2026  -  18 / 04 2026',
        status: 'Confirmé',
        avatar: 'room-detail/avatars/history-01.png',
      },
      {
        guestName: 'Soro Mireille',
        property: 'Résidence Plateau',
        duration: '2 jours',
        period: '09 / 04 / 2026  -  11 / 04 / 2026',
        status: 'Confirmé',
        avatar: 'room-detail/avatars/history-02.png',
      },
      {
        guestName: 'Bamba Ismael',
        property: 'Résidence Plateau',
        duration: '3 jours',
        period: '02 / 04 / 2026  -  05 / 04 / 2026',
        status: 'Confirmé',
        avatar: 'room-detail/avatars/history-03.png',
      },
      {
        guestName: 'Yao Charline',
        property: 'Résidence Plateau',
        duration: '1 jour',
        period: '28 / 03 / 2026  -  29 / 03 / 2026',
        status: 'Confirmé',
        avatar: 'room-detail/avatars/history-04.png',
      },
      {
        guestName: 'Boni Jordan',
        property: 'Résidence Plateau',
        duration: '4 jours',
        period: '18 / 03 / 2026  -  22 / 03 / 2026',
        status: 'Confirmé',
        avatar: 'room-detail/avatars/history-05.png',
      },
    ]),
  },
  '2': {
    guest: {
      name: 'Clarisse Kouamé',
      code: '#G-001234126',
      avatar: 'room-detail/avatars/history-02.png',
    },
    reservation: {
      title: 'Suite Premium B-1408 - hotel Azalai',
      type: 'King Size',
      capacity: '2 personnes',
      bookingDate: 'Mercredi 24 juin 2026',
      bookingTime: '11:15',
      stayDuration: '4 jours',
      facilities: [
        'Mini-bar',
        'LED TV',
        'Jacuzzi',
        'Coin salon',
        'Lit king size',
        'Wi-Fi',
      ],
    },
    totalGalleryCount: 6,
    galleryPhotos: [
      {
        src: 'room-detail/images/gallery-main.png',
        alt: 'Suite premium vue principale',
      },
      {
        src: 'room-detail/images/gallery-thumb-02.png',
        alt: 'Suite premium salon',
      },
      {
        src: 'room-detail/images/gallery-thumb-01.png',
        alt: 'Suite premium chambre',
      },
      {
        src: 'room-detail/images/gallery-thumb-04.png',
        alt: 'Suite premium salle de bain',
        previewCount: 6,
      },
    ],
    historyRows: createHistoryRows([
      {
        guestName: 'Hermann Guei',
        property: 'Hotel Azalai',
        duration: '4 jours',
        period: '24 / 06 / 2026  -  28 / 06 / 2026',
        status: 'Confirmé',
        avatar: 'room-detail/avatars/history-01.png',
      },
      {
        guestName: 'Assita Koffi',
        property: 'Hotel Azalai',
        duration: '2 jours',
        period: '17 / 06 / 2026  -  19 / 06 / 2026',
        status: 'Confirmé',
        avatar: 'room-detail/avatars/history-03.png',
      },
      {
        guestName: 'Mariam Coulibaly',
        property: 'Hotel Azalai',
        duration: '1 jour',
        period: '11 / 06 / 2026  -  12 / 06 / 2026',
        status: 'Confirmé',
        avatar: 'room-detail/avatars/history-04.png',
      },
      {
        guestName: 'Serge Zadi',
        property: 'Hotel Azalai',
        duration: '3 jours',
        period: '05 / 06 / 2026  -  08 / 06 / 2026',
        status: 'Confirmé',
        avatar: 'room-detail/avatars/history-05.png',
      },
    ]),
  },
  '3': {
    guest: {
      name: 'Nadia Touré',
      code: '#G-001234127',
      avatar: 'room-detail/avatars/history-04.png',
    },
    reservation: {
      title: 'Chambre Deluxe C-0912 - hotel Azalai',
      type: 'Twin Bed',
      capacity: '3 personnes',
      bookingDate: 'Vendredi 03 juillet 2026',
      bookingTime: '19:42',
      stayDuration: '5 jours',
      facilities: [
        'Climatisation',
        'Smart TV',
        'Douche italienne',
        'Bureau',
        'Lits jumeaux',
        'Wi-Fi',
      ],
    },
    totalGalleryCount: 5,
    galleryPhotos: [
      {
        src: 'room-detail/images/gallery-main.png',
        alt: 'Chambre deluxe vue principale',
      },
      {
        src: 'room-detail/images/gallery-thumb-03.png',
        alt: 'Chambre deluxe angle 1',
      },
      {
        src: 'room-detail/images/gallery-thumb-02.png',
        alt: 'Chambre deluxe angle 2',
      },
      {
        src: 'room-detail/images/gallery-thumb-04.png',
        alt: 'Chambre deluxe angle 3',
        previewCount: 5,
      },
    ],
    historyRows: createHistoryRows([
      {
        guestName: 'Béatrice Niamké',
        property: 'Hotel Azalai',
        duration: '5 jours',
        period: '03 / 07 / 2026  -  08 / 07 / 2026',
        status: 'Confirmé',
        avatar: 'room-detail/avatars/history-02.png',
      },
      {
        guestName: 'Cédric Yéo',
        property: 'Hotel Azalai',
        duration: '2 jours',
        period: '28 / 06 / 2026  -  30 / 06 / 2026',
        status: 'Confirmé',
        avatar: 'room-detail/avatars/history-01.png',
      },
      {
        guestName: 'Lydie Mian',
        property: 'Hotel Azalai',
        duration: '3 jours',
        period: '20 / 06 / 2026  -  23 / 06 / 2026',
        status: 'Confirmé',
        avatar: 'room-detail/avatars/history-05.png',
      },
      {
        guestName: 'Georges Yapi',
        property: 'Hotel Azalai',
        duration: '1 jour',
        period: '15 / 06 / 2026  -  16 / 06 / 2026',
        status: 'Confirmé',
        avatar: 'room-detail/avatars/history-03.png',
      },
    ]),
  },
};

const SPACE_DETAIL_KEYS = Object.keys(SPACE_DETAILS);

function resolveDetailId(rawId: string): string {
  if (SPACE_DETAILS[rawId]) {
    return rawId;
  }

  const numericId = Number(rawId);
  if (Number.isFinite(numericId) && numericId > 0 && SPACE_DETAIL_KEYS.length) {
    const normalizedIndex =
      (((Math.trunc(numericId) - 1) % SPACE_DETAIL_KEYS.length) +
        SPACE_DETAIL_KEYS.length) %
      SPACE_DETAIL_KEYS.length;

    return SPACE_DETAIL_KEYS[normalizedIndex] ?? DEFAULT_DETAIL_ID;
  }

  return DEFAULT_DETAIL_ID;
}

@Component({
  selector: 'ubax-espace-detail-page',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './espace-detail-page.component.html',
  styleUrl: './espace-detail-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EspaceDetailPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly requestedDetailId = toSignal(
    this.route.paramMap.pipe(
      map((params) => params.get('id') ?? DEFAULT_DETAIL_ID),
    ),
    {
      initialValue: this.route.snapshot.paramMap.get('id') ?? DEFAULT_DETAIL_ID,
    },
  );

  readonly detailId = computed(() => resolveDetailId(this.requestedDetailId()));
  readonly detail = computed(
    () => SPACE_DETAILS[this.detailId()] ?? SPACE_DETAILS[DEFAULT_DETAIL_ID],
  );
  readonly guest = computed(() => this.detail().guest);
  readonly reservation = computed(() => this.detail().reservation);
  readonly totalGalleryCount = computed(() => this.detail().totalGalleryCount);
  readonly galleryPhotos = computed(() => this.detail().galleryPhotos);
  readonly historyRows = computed(() => this.detail().historyRows);

  readonly activeGalleryIndex = signal(0);
  readonly activeGalleryPhoto = computed(() => {
    const photos = this.galleryPhotos();
    const fallbackPhoto = photos[0];
    const safeIndex = Math.min(this.activeGalleryIndex(), photos.length - 1);

    return photos[safeIndex] ?? fallbackPhoto;
  });
  readonly galleryCounterLabel = computed(() => {
    const photos = this.galleryPhotos();
    const safeIndex = Math.min(this.activeGalleryIndex(), photos.length - 1);

    return `${safeIndex + 1}/${this.totalGalleryCount()}`;
  });

  selectGalleryImage(index: number): void {
    this.activeGalleryIndex.set(index);
  }

  previousGalleryImage(): void {
    const photos = this.galleryPhotos();

    this.activeGalleryIndex.update((index) =>
      index === 0 ? photos.length - 1 : index - 1,
    );
  }

  nextGalleryImage(): void {
    const photos = this.galleryPhotos();

    this.activeGalleryIndex.update((index) =>
      index === photos.length - 1 ? 0 : index + 1,
    );
  }
}

import {
  ChangeDetectionStrategy,
  Component,
  computed,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { UbaxPaginatorComponent } from '@ubax-workspace/shared-ui';

type RoomStatus = 'Disponible' | 'Réservé';
type RoomViewMode = 'grid' | 'list';

interface SummaryCard {
  readonly label: string;
  readonly value: string;
  readonly icon: string;
  readonly theme: 'all' | 'reserved' | 'online' | 'occupied' | 'revenue';
}

interface RoomCard {
  readonly id: number;
  readonly title: string;
  readonly location: string;
  readonly owner: string;
  readonly ownerRole: string;
  readonly typeLabel: string;
  readonly status: RoomStatus;
  readonly rating: string;
  readonly priceValue: string;
  readonly priceUnit: string;
  readonly image: string;
  readonly avatar: string;
}

const baseRooms: Omit<RoomCard, 'id'>[] = [
  {
    title: 'Chambre Queen A-2345',
    location: 'Abidjan, Cocody',
    owner: 'Aïcha Kouadio',
    ownerRole: 'Cliente',
    typeLabel: 'Chambre',
    status: 'Disponible',
    rating: '4.1',
    priceValue: '65 000',
    priceUnit: 'FCFA/nuit',
    image: 'rooms/images/room-01.png',
    avatar: 'rooms/avatars/owner-01.png',
  },
  {
    title: 'Chambre Queen A-2345',
    location: 'Abidjan, Cocody',
    owner: 'Aïcha Kouadio',
    ownerRole: 'Cliente',
    typeLabel: 'Chambre',
    status: 'Réservé',
    rating: '4.1',
    priceValue: '65 000',
    priceUnit: 'FCFA/nuit',
    image: 'rooms/images/room-02.png',
    avatar: 'rooms/avatars/owner-02.png',
  },
  {
    title: 'Chambre Queen A-2345',
    location: 'Abidjan, Cocody',
    owner: 'Aïcha Kouadio',
    ownerRole: 'Cliente',
    typeLabel: 'Chambre',
    status: 'Disponible',
    rating: '4.1',
    priceValue: '65 000',
    priceUnit: 'FCFA/nuit',
    image: 'rooms/images/room-03.png',
    avatar: 'rooms/avatars/owner-03.png',
  },
  {
    title: 'Chambre Queen A-2345',
    location: 'Abidjan, Cocody',
    owner: 'Aïcha Kouadio',
    ownerRole: 'Cliente',
    typeLabel: 'Chambre',
    status: 'Disponible',
    rating: '4.1',
    priceValue: '65 000',
    priceUnit: 'FCFA/nuit',
    image: 'rooms/images/room-04.png',
    avatar: 'rooms/avatars/owner-04.png',
  },
  {
    title: 'Chambre Queen A-2345',
    location: 'Abidjan, Cocody',
    owner: 'Aïcha Kouadio',
    ownerRole: 'Cliente',
    typeLabel: 'Chambre',
    status: 'Disponible',
    rating: '4.1',
    priceValue: '65 000',
    priceUnit: 'FCFA/nuit',
    image: 'rooms/images/room-05.png',
    avatar: 'rooms/avatars/owner-05.png',
  },
  {
    title: 'Chambre Queen A-2345',
    location: 'Abidjan, Cocody',
    owner: 'Aïcha Kouadio',
    ownerRole: 'Cliente',
    typeLabel: 'Chambre',
    status: 'Réservé',
    rating: '4.1',
    priceValue: '65 000',
    priceUnit: 'FCFA/nuit',
    image: 'rooms/images/room-06.png',
    avatar: 'rooms/avatars/owner-06.png',
  },
  {
    title: 'Chambre Queen A-2345',
    location: 'Abidjan, Cocody',
    owner: 'Aïcha Kouadio',
    ownerRole: 'Cliente',
    typeLabel: 'Chambre',
    status: 'Réservé',
    rating: '4.1',
    priceValue: '65 000',
    priceUnit: 'FCFA/nuit',
    image: 'rooms/images/room-07.png',
    avatar: 'rooms/avatars/owner-07.png',
  },
  {
    title: 'Chambre Queen A-2345',
    location: 'Abidjan, Cocody',
    owner: 'Aïcha Kouadio',
    ownerRole: 'Cliente',
    typeLabel: 'Chambre',
    status: 'Réservé',
    rating: '4.1',
    priceValue: '65 000',
    priceUnit: 'FCFA/nuit',
    image: 'rooms/images/room-08.png',
    avatar: 'rooms/avatars/owner-08.png',
  },
  {
    title: 'Chambre Queen A-2345',
    location: 'Abidjan, Cocody',
    owner: 'Aïcha Kouadio',
    ownerRole: 'Cliente',
    typeLabel: 'Chambre',
    status: 'Disponible',
    rating: '4.1',
    priceValue: '65 000',
    priceUnit: 'FCFA/nuit',
    image: 'rooms/images/room-09.png',
    avatar: 'rooms/avatars/owner-01.png',
  },
  {
    title: 'Chambre Queen A-2345',
    location: 'Abidjan, Cocody',
    owner: 'Aïcha Kouadio',
    ownerRole: 'Cliente',
    typeLabel: 'Chambre',
    status: 'Disponible',
    rating: '4.1',
    priceValue: '65 000',
    priceUnit: 'FCFA/nuit',
    image: 'rooms/images/room-10.png',
    avatar: 'rooms/avatars/owner-02.png',
  },
  {
    title: 'Chambre Queen A-2345',
    location: 'Abidjan, Cocody',
    owner: 'Aïcha Kouadio',
    ownerRole: 'Cliente',
    typeLabel: 'Chambre',
    status: 'Disponible',
    rating: '4.1',
    priceValue: '65 000',
    priceUnit: 'FCFA/nuit',
    image: 'rooms/images/room-11.png',
    avatar: 'rooms/avatars/owner-03.png',
  },
  {
    title: 'Chambre Queen A-2345',
    location: 'Abidjan, Cocody',
    owner: 'Aïcha Kouadio',
    ownerRole: 'Cliente',
    typeLabel: 'Chambre',
    status: 'Réservé',
    rating: '4.1',
    priceValue: '65 000',
    priceUnit: 'FCFA/nuit',
    image: 'rooms/images/room-12.png',
    avatar: 'rooms/avatars/owner-04.png',
  },
];

@Component({
  selector: 'ubax-espaces-list-page',
  standalone: true,
  imports: [RouterLink, UbaxPaginatorComponent],
  templateUrl: './espaces-list-page.component.html',
  styleUrls: ['./espaces-list-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EspacesListPageComponent {
  private readonly pageSize = 12;

  readonly activePage = signal(1);
  readonly selectedType = signal('all');
  readonly selectedStatus = signal('all');
  readonly viewMode = signal<RoomViewMode>('grid');
  readonly stars = Array.from({ length: 4 });

  readonly typeOptions = [
    { label: 'Type d’espace', value: 'all' },
    { label: 'Chambre', value: 'Chambre' },
  ];

  readonly statusOptions = [
    { label: 'Statut', value: 'all' },
    { label: 'Disponible', value: 'Disponible' },
    { label: 'Réservé', value: 'Réservé' },
  ];

  readonly summaryCards: SummaryCard[] = [
    {
      label: 'Tous les espaces',
      value: '45',
      icon: 'rooms/icons/stat-all.svg',
      theme: 'all',
    },
    {
      label: 'Espaces réservés',
      value: '25',
      icon: 'rooms/icons/stat-reserved.svg',
      theme: 'reserved',
    },
    {
      label: 'Espaces en ligne',
      value: '15',
      icon: 'rooms/icons/stat-online.svg',
      theme: 'online',
    },
    {
      label: 'Espaces Occupés',
      value: '10',
      icon: 'rooms/icons/stat-occupied.svg',
      theme: 'occupied',
    },
    {
      label: 'Revenus du jour',
      value: '750 000 FCFA',
      icon: 'rooms/icons/stat-revenue.svg',
      theme: 'revenue',
    },
  ];

  readonly spaces: RoomCard[] = Array.from({ length: 60 }, (_, index) => {
    const room = baseRooms[index % baseRooms.length];

    return {
      ...room,
      id: index + 1,
    };
  });

  readonly filteredSpaces = computed(() => {
    return this.spaces.filter((space) => {
      const matchesType =
        this.selectedType() === 'all' ||
        space.typeLabel === this.selectedType();
      const matchesStatus =
        this.selectedStatus() === 'all' ||
        space.status === this.selectedStatus();

      return matchesType && matchesStatus;
    });
  });

  readonly totalPages = computed(() => {
    return Math.max(1, Math.ceil(this.filteredSpaces().length / this.pageSize));
  });

  readonly visibleSpaces = computed(() => {
    const currentPage = Math.min(this.activePage(), this.totalPages());
    const startIndex = (currentPage - 1) * this.pageSize;

    return this.filteredSpaces().slice(startIndex, startIndex + this.pageSize);
  });

  updateType(value: string): void {
    this.selectedType.set(value);
    this.activePage.set(1);
  }

  updateStatus(value: string): void {
    this.selectedStatus.set(value);
    this.activePage.set(1);
  }

  setViewMode(viewMode: RoomViewMode): void {
    this.viewMode.set(viewMode);
  }
}

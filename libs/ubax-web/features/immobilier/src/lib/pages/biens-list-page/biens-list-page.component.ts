import {
  ChangeDetectionStrategy,
  Component,
  computed,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { UbaxPaginatorComponent } from '@ubax-workspace/shared-ui';

type BienViewMode = 'grid' | 'list';

interface BienSummaryCard {
  readonly label: string;
  readonly value: string;
  readonly trend?: string;
  readonly orb: string;
  readonly icon: string;
  readonly iconAlt: string;
}

interface GridBienCard {
  readonly id: number;
  readonly title: string;
  readonly location: string;
  readonly tenant: string;
  readonly tenantRole: string;
  readonly price: string;
  readonly image: string;
  readonly avatar: string;
}

interface ListBienCard {
  readonly id: number;
  readonly title: string;
  readonly location: string;
  readonly tenant: string;
  readonly tenantRole: string;
  readonly price: string;
  readonly image: string;
  readonly avatar: string;
}

const GRID_VIEW_ICON =
  'https://www.figma.com/api/mcp/asset/a3395e9c-0140-4d15-8e27-c62f9e413242';
const LIST_VIEW_ICON =
  'https://www.figma.com/api/mcp/asset/fb3c7b52-9fec-4c87-bc40-3f8a49741320';
const CHEVRON_ICON =
  'https://www.figma.com/api/mcp/asset/86daf4b9-f7f0-44d2-bb03-7d98311f009b';
const ADD_ICON =
  'https://www.figma.com/api/mcp/asset/787c6e72-0b6a-4671-80f1-73ed60203660';
const OWNER_ICON =
  'https://www.figma.com/api/mcp/asset/7bfb33d8-6bb6-43ef-bed8-df397b326eab';
const TREND_ICON =
  'https://www.figma.com/api/mcp/asset/57d3047b-920e-47a4-ad69-e474ee443a28';
const GRID_LOCATION_ICON =
  'https://www.figma.com/api/mcp/asset/49956718-6daf-4e3d-9aa4-8f3c295cfaff';
const GRID_ARROW_ICON =
  'https://www.figma.com/api/mcp/asset/dae5dfe5-5012-458d-93c8-619314893376';
const LIST_LOCATION_ICON_OUTER =
  'https://www.figma.com/api/mcp/asset/f786dbe7-71e4-47c7-942c-08d51b50fb61';
const LIST_LOCATION_ICON_INNER =
  'https://www.figma.com/api/mcp/asset/4dcca9fa-196a-4ae5-9cee-c7372a208670';
const LIST_ARROW_ICON =
  'https://www.figma.com/api/mcp/asset/6ac6d82e-a489-4322-baf9-e4ffa4554bfa';

const GRID_SUMMARY_CARDS: readonly BienSummaryCard[] = [
  {
    label: 'Tous les biens',
    value: '45',
    trend: '+2%',
    orb: 'https://www.figma.com/api/mcp/asset/74a52733-4b72-4585-a52a-34e28faf3190',
    icon: 'https://www.figma.com/api/mcp/asset/781a21e1-737d-400e-b9ad-14a19d85dcbe',
    iconAlt: 'Tous les biens',
  },
  {
    label: 'Annonces actives',
    value: '10',
    orb: 'https://www.figma.com/api/mcp/asset/3769ce0a-f4e2-4935-aa35-6efc56057d34',
    icon: 'https://www.figma.com/api/mcp/asset/745dde1e-a423-412c-aafd-e650a8a0e55a',
    iconAlt: 'Annonces actives',
  },
  {
    label: 'Biens Loués',
    value: '33',
    orb: 'https://www.figma.com/api/mcp/asset/4817705a-6738-48ec-8a50-5b38256d3368',
    icon: 'https://www.figma.com/api/mcp/asset/4b03a51a-f8c6-41da-a747-51f5796eef28',
    iconAlt: 'Biens loués',
  },
  {
    label: 'Biens Vendus',
    value: '2',
    orb: 'https://www.figma.com/api/mcp/asset/c01cae6d-564b-4cac-a146-61321dc56338',
    icon: 'https://www.figma.com/api/mcp/asset/617aaacc-b9de-4461-89fe-474a0c272322',
    iconAlt: 'Biens vendus',
  },
];

const LIST_SUMMARY_CARDS: readonly BienSummaryCard[] = [
  {
    label: 'Tous les biens',
    value: '45',
    trend: '+2%',
    orb: 'https://www.figma.com/api/mcp/asset/1778abe4-1a8b-4529-bf97-ee61bce9c4d9',
    icon: 'https://www.figma.com/api/mcp/asset/32db3f00-3499-4860-97b7-d2654853893a',
    iconAlt: 'Tous les biens',
  },
  {
    label: 'Annonces actives',
    value: '10',
    orb: 'https://www.figma.com/api/mcp/asset/19602e45-fbc5-45ec-a7ee-7edb94d31fe1',
    icon: 'https://www.figma.com/api/mcp/asset/c121882b-eb33-45d6-93ac-db37b5167adb',
    iconAlt: 'Annonces actives',
  },
  {
    label: 'Biens Loués',
    value: '33',
    orb: 'https://www.figma.com/api/mcp/asset/601f2eb8-d4d9-4dcc-9954-7b01a3c78c87',
    icon: 'https://www.figma.com/api/mcp/asset/bcfb90c7-a66d-499f-8d66-d46a291a8543',
    iconAlt: 'Biens loués',
  },
  {
    label: 'Archives',
    value: '2',
    orb: 'https://www.figma.com/api/mcp/asset/88448aed-d8a7-4dab-ae7a-939da7f200ce',
    icon: 'https://www.figma.com/api/mcp/asset/dd2db5c4-1143-4e49-88cd-47348493fab8',
    iconAlt: 'Archives',
  },
];

const GRID_CARD_SEEDS: readonly Omit<GridBienCard, 'id'>[] = [
  {
    title: 'Immeuble kalia',
    location: 'Abidjan, Cocody',
    tenant: 'Aïcha Kouadio',
    tenantRole: 'Locataire',
    price: '400 000 FCFA',
    image: 'shared/rooms/room-photo-01.webp',
    avatar: 'hotel-dashboard/properties/tenant-aicha.webp',
  },
  {
    title: 'Immeuble kalia',
    location: 'Abidjan, Cocody',
    tenant: 'Mariam Koné',
    tenantRole: 'Locataire',
    price: '350 000 FCFA',
    image: 'biens/list/grid-property-02.webp',
    avatar: 'hotel-dashboard/properties/tenant-armand.webp',
  },
  {
    title: 'Immeuble kalia',
    location: 'Abidjan, Cocody',
    tenant: 'Lordy Bambo',
    tenantRole: 'Locataire',
    price: '600 000 FCFA',
    image: 'hotel-dashboard/properties/property-kevin.webp',
    avatar: 'hotel-dashboard/properties/tenant-kevin.webp',
  },
  {
    title: 'Immeuble kalia',
    location: 'Abidjan, Cocody',
    tenant: 'Armand Tano',
    tenantRole: 'Locataire',
    price: '765 000 FCFA',
    image: 'biens/list/grid-property-04.webp',
    avatar: 'biens/list/grid-tenant-04.webp',
  },
  {
    title: 'Immeuble kalia',
    location: 'Abidjan, Cocody',
    tenant: 'Fatoumata Traoré',
    tenantRole: 'Locataire',
    price: '900 000 FCFA',
    image: 'biens/list/grid-property-05.webp',
    avatar: 'biens/list/grid-tenant-05.webp',
  },
  {
    title: 'Immeuble kalia',
    location: 'Abidjan, Cocody',
    tenant: 'Ibrahim Coulibaly',
    tenantRole: 'Locataire',
    price: '850 000 FCFA',
    image: 'biens/list/grid-property-06.webp',
    avatar: 'biens/list/grid-tenant-06.webp',
  },
];

const LIST_CARD_SEEDS: readonly Omit<ListBienCard, 'id'>[] = [
  {
    title: 'Appartement Haut Standing',
    location: 'Abidjan, Cocody',
    tenant: 'Aïcha Kouadio',
    tenantRole: 'Locataire',
    price: '400 000 FCFA',
    image: 'biens/detail/property-side-01.webp',
    avatar: 'biens/list/list-tenant-01.webp',
  },
  {
    title: 'Appartement Haut Standing',
    location: 'Abidjan, Cocody',
    tenant: 'Aïcha Kouadio',
    tenantRole: 'Locataire',
    price: '400 000 FCFA',
    image: 'biens/list/list-property-02.webp',
    avatar: 'biens/list/list-tenant-01.webp',
  },
  {
    title: 'Appartement Haut Standing',
    location: 'Abidjan, Cocody',
    tenant: 'Aïcha Kouadio',
    tenantRole: 'Locataire',
    price: '400 000 FCFA',
    image: 'biens/list/grid-property-05.webp',
    avatar: 'biens/list/list-tenant-01.webp',
  },
  {
    title: 'Appartement Haut Standing',
    location: 'Abidjan, Cocody',
    tenant: 'Aïcha Kouadio',
    tenantRole: 'Locataire',
    price: '400 000 FCFA',
    image: 'shared/rooms/room-photo-01.webp',
    avatar: 'biens/list/list-tenant-01.webp',
  },
  {
    title: 'Appartement Haut Standing',
    location: 'Abidjan, Cocody',
    tenant: 'Aïcha Kouadio',
    tenantRole: 'Locataire',
    price: '400 000 FCFA',
    image: 'rooms/images/room-02.webp',
    avatar: 'biens/list/list-tenant-01.webp',
  },
  {
    title: 'Appartement Haut Standing',
    location: 'Abidjan, Cocody',
    tenant: 'Aïcha Kouadio',
    tenantRole: 'Locataire',
    price: '400 000 FCFA',
    image: 'biens/list/list-property-06.webp',
    avatar: 'biens/list/list-tenant-01.webp',
  },
  {
    title: 'Appartement Haut Standing',
    location: 'Abidjan, Cocody',
    tenant: 'Aïcha Kouadio',
    tenantRole: 'Locataire',
    price: '400 000 FCFA',
    image: 'biens/list/list-property-07.webp',
    avatar: 'biens/list/list-tenant-01.webp',
  },
  {
    title: 'Appartement Haut Standing',
    location: 'Abidjan, Cocody',
    tenant: 'Aïcha Kouadio',
    tenantRole: 'Locataire',
    price: '400 000 FCFA',
    image: 'biens/list/grid-property-06.webp',
    avatar: 'biens/list/list-tenant-01.webp',
  },
];

const FILTERS = [
  { label: 'Type de biens', className: 'filter-pill--type' },
  { label: 'Catégorie', className: 'filter-pill--category' },
  { label: 'Statut', className: 'filter-pill--status' },
] as const;

@Component({
  selector: 'ubax-biens-list-page',
  standalone: true,
  imports: [RouterLink, UbaxPaginatorComponent],
  templateUrl: './biens-list-page.component.html',
  styleUrl: './biens-list-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BiensListPageComponent {
  protected readonly filters = FILTERS;
  protected readonly gridViewIcon = GRID_VIEW_ICON;
  protected readonly listViewIcon = LIST_VIEW_ICON;
  protected readonly chevronIcon = CHEVRON_ICON;
  protected readonly addIcon = ADD_ICON;
  protected readonly ownerIcon = OWNER_ICON;
  protected readonly trendIcon = TREND_ICON;
  protected readonly gridLocationIcon = GRID_LOCATION_ICON;
  protected readonly gridArrowIcon = GRID_ARROW_ICON;
  protected readonly listLocationOuterIcon = LIST_LOCATION_ICON_OUTER;
  protected readonly listLocationInnerIcon = LIST_LOCATION_ICON_INNER;
  protected readonly listArrowIcon = LIST_ARROW_ICON;

  protected readonly viewMode = signal<BienViewMode>('grid');
  protected readonly currentPage = signal(3);

  private readonly gridCards: readonly GridBienCard[] = Array.from(
    { length: 60 },
    (_, index) => ({
      ...GRID_CARD_SEEDS[index % GRID_CARD_SEEDS.length],
      id: index + 1,
    }),
  );

  private readonly listCards: readonly ListBienCard[] = Array.from(
    { length: 40 },
    (_, index) => ({
      ...LIST_CARD_SEEDS[index % LIST_CARD_SEEDS.length],
      id: index + 1,
    }),
  );

  protected readonly summaryCards = computed(() =>
    this.viewMode() === 'grid' ? GRID_SUMMARY_CARDS : LIST_SUMMARY_CARDS,
  );

  protected readonly showOwnerAction = computed(
    () => this.viewMode() === 'grid',
  );

  protected readonly totalPages = computed(() => 5);

  protected readonly visibleGridCards = computed(() => {
    const start = (this.currentPage() - 1) * 12;
    return this.gridCards.slice(start, start + 12);
  });

  protected readonly visibleListCards = computed(() => {
    const start = (this.currentPage() - 1) * 8;
    return this.listCards.slice(start, start + 8);
  });

  protected setViewMode(mode: BienViewMode): void {
    if (this.viewMode() === mode) {
      return;
    }

    this.viewMode.set(mode);
    this.currentPage.set(3);
  }
}

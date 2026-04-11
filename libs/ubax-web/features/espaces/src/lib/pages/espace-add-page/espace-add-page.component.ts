import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

type EspaceType = 'chambre' | 'salle';
type InitialStatus = 'Disponible' | 'Occupé' | 'Maintenance';
type EditableDraftField =
  | 'code'
  | 'name'
  | 'standardRate'
  | 'weekendRate'
  | 'longStayRate'
  | 'notes';

interface TypeCardOption {
  readonly value: EspaceType;
  readonly title: string;
  readonly description: string;
  readonly icon: string;
}

interface TypeItem {
  readonly id: string;
  readonly label: string;
}

interface EquipmentItem {
  readonly id: string;
  readonly label: string;
  readonly icon: string;
}

interface BaseDraft {
  code: string;
  name: string;
  typeHint: string;
  typeItems: readonly TypeItem[];
  selectedFloor: string;
  previewTag: string;
  previewRate: string;
  previewCapacity: string;
  previewEquipments: string;
  heroImage: string;
  gallery: readonly string[];
  standardRate: string;
  weekendRate: string;
  longStayRate: string;
  notes: string;
}

interface RoomDraft extends BaseDraft {
  adults: string;
  children: string;
  area: string;
  bedType: string;
  bedOptions: readonly string[];
}

interface HallDraft extends BaseDraft {
  people: string;
  area: string;
}

@Component({
  selector: 'ubax-espace-add-page',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './espace-add-page.component.html',
  styleUrl: './espace-add-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EspaceAddPageComponent {
  readonly espaceType = signal<EspaceType>('chambre');
  readonly initialStatus = signal<InitialStatus>('Disponible');

  readonly typeCards: readonly TypeCardOption[] = [
    {
      value: 'chambre',
      title: 'Chambre',
      description: 'Suite , Standard , Deluxe , Familiale',
      icon: 'space-add/icons/bed-double.svg',
    },
    {
      value: 'salle',
      title: 'Salle',
      description: 'Espace de réunion , Séminaire ou évènement profésionnelle',
      icon: 'space-add/icons/conference-room.svg',
    },
  ];

  readonly floorOptions = ['RDC', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
  readonly initialStatusOptions: readonly InitialStatus[] = [
    'Disponible',
    'Occupé',
    'Maintenance',
  ];

  readonly equipmentItems: readonly EquipmentItem[] = [
    {
      id: 'clim-1',
      label: 'Climatisation',
      icon: 'space-add/icons/mode-cool.svg',
    },
    {
      id: 'wifi',
      label: 'WIFI Haut débit',
      icon: 'space-add/icons/mode-cool.svg',
    },
    { id: 'tv', label: 'Smart TV', icon: 'space-add/icons/mode-cool.svg' },
    {
      id: 'baignoire',
      label: 'Baignoire',
      icon: 'space-add/icons/mode-cool.svg',
    },
    {
      id: 'douche',
      label: 'Douche à l’italienne',
      icon: 'space-add/icons/mode-cool.svg',
    },
    {
      id: 'cafe',
      label: 'Machine à café',
      icon: 'space-add/icons/mode-cool.svg',
    },
    {
      id: 'mini-bar',
      label: 'Mini Bar',
      icon: 'space-add/icons/mode-cool.svg',
    },
    {
      id: 'coffre',
      label: 'Coffre fort',
      icon: 'space-add/icons/mode-cool.svg',
    },
    { id: 'balcon', label: 'Balcon', icon: 'space-add/icons/mode-cool.svg' },
    {
      id: 'clim-2',
      label: 'Climatisation',
      icon: 'space-add/icons/mode-cool.svg',
    },
    {
      id: 'clim-3',
      label: 'Climatisation',
      icon: 'space-add/icons/mode-cool.svg',
    },
    {
      id: 'clim-4',
      label: 'Climatisation',
      icon: 'space-add/icons/mode-cool.svg',
    },
  ];
  readonly selectedEquipmentIds = signal<string[]>(
    this.equipmentItems.map((item) => item.id),
  );

  readonly roomDraft: RoomDraft = {
    code: '# 101',
    name: 'Chambre Savane',
    typeHint: 'Ajouter modifier ou supprimer les types de chambre',
    typeItems: [
      { id: 'standard', label: 'Chambre standard' },
      { id: 'deluxe', label: 'Chambre Deluxe' },
      { id: 'junior', label: 'Suite Junior' },
      { id: 'presidential', label: 'Suite Présidentielle' },
    ],
    selectedFloor: '4',
    adults: '3',
    children: '1',
    area: '40',
    bedType: 'King size',
    bedOptions: ['King size', 'Queen size', 'Lit Simple'],
    previewTag: 'Chambre',
    previewRate: '65000 FCFA',
    previewCapacity: '3',
    previewEquipments: '3 sélectionnés',
    heroImage: 'space-add/images/preview-room.png',
    gallery: [
      'space-add/images/gallery-01.png',
      'space-add/images/gallery-02.png',
      'space-add/images/gallery-03.png',
      'space-add/images/gallery-04.png',
    ],
    standardRate: '75 000',
    weekendRate: '75 000',
    longStayRate: '75 000',
    notes: 'Description visible par les clients',
  };

  readonly hallDraft: HallDraft = {
    code: '# 101',
    name: 'Espace de réunion',
    typeHint: 'Ajouter modifier ou supprimer les types de Salon',
    typeItems: [
      { id: 'meeting', label: 'Espace de réunion' },
      { id: 'seminar', label: 'Salle de séminaire' },
      { id: 'event', label: 'Salle d’événement' },
      { id: 'party', label: 'Salle de fête' },
    ],
    selectedFloor: '4',
    people: '56',
    area: '40',
    previewTag: 'Salle',
    previewRate: '65000 FCFA',
    previewCapacity: '3',
    previewEquipments: '3 sélectionnés',
    heroImage: 'space-add/images/preview-room.png',
    gallery: [
      'space-add/images/gallery-01.png',
      'space-add/images/gallery-02.png',
      'space-add/images/gallery-03.png',
      'space-add/images/gallery-04.png',
    ],
    standardRate: '75 000',
    weekendRate: '75 000',
    longStayRate: '75 000',
    notes: 'Description visible par les clients',
  };

  get isRoom(): boolean {
    return this.espaceType() === 'chambre';
  }

  get draft(): RoomDraft | HallDraft {
    return this.isRoom ? this.roomDraft : this.hallDraft;
  }

  get currentTypeFieldLabel(): string {
    return this.isRoom ? 'Type de chambre' : 'Type de Salle';
  }

  get currentPreviewSubtitle(): string {
    return `${this.draft.previewTag} · Étage ${this.draft.selectedFloor}`;
  }

  get currentPreviewOverlayIcon(): string {
    return this.isRoom
      ? 'space-add/icons/bed-double.svg'
      : 'space-add/icons/conference-room.svg';
  }

  setEspaceType(type: EspaceType): void {
    this.espaceType.set(type);
  }

  updateDraftField(field: EditableDraftField, value: string): void {
    const draft = this.draft;
    draft[field] = value;
  }

  updateRoomField(field: 'adults' | 'children' | 'area', value: string): void {
    this.roomDraft[field] = value;
  }

  updateHallField(field: 'people' | 'area', value: string): void {
    this.hallDraft[field] = value;
  }

  selectFloor(floor: string): void {
    this.draft.selectedFloor = floor;
  }

  selectBedType(option: string): void {
    this.roomDraft.bedType = option;
  }

  isEquipmentSelected(equipmentId: string): boolean {
    return this.selectedEquipmentIds().includes(equipmentId);
  }

  toggleEquipment(equipmentId: string): void {
    this.selectedEquipmentIds.update((selectedIds) =>
      selectedIds.includes(equipmentId)
        ? selectedIds.filter((id) => id !== equipmentId)
        : [...selectedIds, equipmentId],
    );
  }

  selectInitialStatus(status: InitialStatus): void {
    this.initialStatus.set(status);
  }
}

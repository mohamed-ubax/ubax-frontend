import {
  ChangeDetectionStrategy,
  Component,
  computed,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';

import { UbaxPaginatorComponent } from '@ubax-workspace/shared-ui';

type TabId = 'all' | 'active' | 'inactive';
type EmployeStatusTone = 'active' | 'inactive';

interface EmployeRow {
  readonly id: string;
  readonly nom: string;
  readonly poste: string;
  readonly description: string;
  readonly joursTravail: string;
  readonly horaires: string;
  readonly telephone: string;
  readonly avatarSrc: string;
  readonly statusTone: EmployeStatusTone;
}

interface EmployeTab {
  readonly id: TabId;
  readonly label: string;
  readonly count: number;
}

const EMPLOYES_TABS: readonly EmployeTab[] = [
  { id: 'all', label: 'Tous les employés', count: 22 },
  { id: 'active', label: 'Employés Actives', count: 15 },
  { id: 'inactive', label: 'Employés Inactives', count: 7 },
] as const;

const EMPLOYES_ALL_ROWS: readonly EmployeRow[] = [
  {
    id: '1',
    nom: 'Koffi Yao',
    poste: 'Réceptionniste',
    description: 'Accueille les clients et gère les réservations quotidiennes.',
    joursTravail: 'Lundi → Samedi',
    horaires: '08:00 - 20:00',
    telephone: '+225 07 00 00 01',
    avatarSrc: '/employes/images/employe-koffi-yao.png',
    statusTone: 'active',
  },
  {
    id: '2',
    nom: 'Youssouf Traoré',
    poste: 'Responsable Sécurité',
    description:
      'Assure la sécurité des clients, du personnel et des installations.',
    joursTravail: 'Lundi → Samedi',
    horaires: '08:00 - 15:00',
    telephone: '+225 07 00 00 01',
    avatarSrc: '/employes/images/employe-youssouf-traore.png',
    statusTone: 'active',
  },
  {
    id: '3',
    nom: 'Aïcha Koné',
    poste: 'Responsable Restauration',
    description:
      'Supervise le restaurant, le petit-déjeuner et le room service.',
    joursTravail: 'Lundi → Samedi',
    horaires: '08:00 - 15:00',
    telephone: '+225 07 00 00 01',
    avatarSrc: '/employes/images/employe-aicha-kone.png',
    statusTone: 'active',
  },
  {
    id: '4',
    nom: 'Souleymane Diabaté',
    poste: 'Responsable Maintenance',
    description:
      'Gère les réparations, équipements et interventions techniques.',
    joursTravail: 'Lundi → Samedi',
    horaires: '08:00 - 15:00',
    telephone: '+225 07 00 00 01',
    avatarSrc: '/employes/images/employe-souleymane-diabate.png',
    statusTone: 'inactive',
  },
  {
    id: '5',
    nom: 'Adama Bamba',
    poste: 'Agent d’Entretien',
    description:
      'Assure la propreté quotidienne des chambres et des espaces communs.',
    joursTravail: 'Lundi → Samedi',
    horaires: '08:00 - 15:00',
    telephone: '+225 07 00 00 01',
    avatarSrc: '/employes/images/employe-adama-bamba.png',
    statusTone: 'active',
  },
] as const;

function cloneRowsWithStatus(
  rows: readonly EmployeRow[],
  statusTone: EmployeStatusTone,
): EmployeRow[] {
  return rows.map((row) => ({
    ...row,
    statusTone,
  }));
}

const EMPLOYES_ACTIVE_ROWS = cloneRowsWithStatus(EMPLOYES_ALL_ROWS, 'active');
const EMPLOYES_INACTIVE_ROWS = cloneRowsWithStatus(
  EMPLOYES_ALL_ROWS,
  'inactive',
);

const EMPLOYES_ROWS_BY_TAB: Record<TabId, readonly EmployeRow[]> = {
  all: EMPLOYES_ALL_ROWS,
  active: EMPLOYES_ACTIVE_ROWS,
  inactive: EMPLOYES_INACTIVE_ROWS,
};

function normalizeSearchText(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

@Component({
  selector: 'ubax-employes-list-page',
  standalone: true,
  imports: [RouterLink, UbaxPaginatorComponent],
  templateUrl: './employes-list-page.component.html',
  styleUrl: './employes-list-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmployesListPageComponent {
  readonly activeTab = signal<TabId>('all');
  readonly currentPage = signal(3);
  readonly totalPages = 5;
  readonly searchValue = signal('');

  readonly tabs = EMPLOYES_TABS;

  readonly filteredEmployes = computed(() => {
    const search = normalizeSearchText(this.searchValue().trim());
    const employes = EMPLOYES_ROWS_BY_TAB[this.activeTab()];

    if (!search) {
      return employes;
    }

    return employes.filter((employe) =>
      normalizeSearchText(
        [
          employe.nom,
          employe.poste,
          employe.description,
          employe.joursTravail,
          employe.horaires,
          employe.telephone,
        ].join(' '),
      ).includes(search),
    );
  });

  setTab(id: TabId): void {
    this.activeTab.set(id);
  }

  updateSearch(event: Event): void {
    const target = event.target;
    if (target instanceof HTMLInputElement) {
      this.searchValue.set(target.value);
    }
  }
}

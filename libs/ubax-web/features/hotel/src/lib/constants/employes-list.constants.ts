import type { EmployeRow, EmployeTab, EmployeStatusTone, TabId } from '../types/employes-list.types';

export const EMPLOYES_TABS: readonly EmployeTab[] = [
  { id: 'all', label: 'Tous les employés', count: 22 },
  { id: 'active', label: 'Employés Actives', count: 15 },
  { id: 'inactive', label: 'Employés Inactives', count: 7 },
] as const;

export const EMPLOYES_ALL_ROWS: readonly EmployeRow[] = [
  {
    id: '1',
    nom: 'Koffi Yao',
    poste: 'Réceptionniste',
    description: 'Accueille les clients et gère les réservations quotidiennes.',
    joursTravail: 'Lundi → Samedi',
    horaires: '08:00 - 20:00',
    telephone: '+225 07 00 00 01',
    avatarSrc: '/shared/people/profile-02.webp',
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
    avatarSrc: '/employes/images/employe-youssouf-traore.webp',
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
    avatarSrc: '/shared/people/billing-guest-03.webp',
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
    avatarSrc: '/shared/people/profile-03.webp',
    statusTone: 'inactive',
  },
  {
    id: '5',
    nom: 'Adama Bamba',
    poste: "Agent d'Entretien",
    description:
      'Assure la propreté quotidienne des chambres et des espaces communs.',
    joursTravail: 'Lundi → Samedi',
    horaires: '08:00 - 15:00',
    telephone: '+225 07 00 00 01',
    avatarSrc: '/shared/people/profile-01.webp',
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

export const EMPLOYES_ACTIVE_ROWS = cloneRowsWithStatus(EMPLOYES_ALL_ROWS, 'active');
export const EMPLOYES_INACTIVE_ROWS = cloneRowsWithStatus(
  EMPLOYES_ALL_ROWS,
  'inactive',
);

export const EMPLOYES_ROWS_BY_TAB: Record<TabId, readonly EmployeRow[]> = {
  all: EMPLOYES_ALL_ROWS,
  active: EMPLOYES_ACTIVE_ROWS,
  inactive: EMPLOYES_INACTIVE_ROWS,
};

export function normalizeSearchText(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replaceAll(/[̀-ͯ]/g, '');
}

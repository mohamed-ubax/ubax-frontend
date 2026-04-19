import { Role } from './user.model';

const DEV_ROLE_STORAGE_KEY = 'ubax_dev_role';

export interface NavItemConfig {
  readonly label: string;
  readonly path: string;
  readonly activePaths?: readonly string[];
  readonly roles: readonly Role[];
}

export interface RoleOption {
  readonly role: Role;
  readonly label: string;
}

export const ROLE_LABELS: Record<Role, string> = {
  [Role.DG]: "Directeur d'agence",
  [Role.COMMERCIAL]: 'Commercial',
  [Role.COMPTABLE]: 'Comptable',
  [Role.SAV]: 'Service client',
  [Role.HOTEL]: 'Responsable hôtel',
};

export const DEV_ROLE_OPTIONS: readonly RoleOption[] = [
  { role: Role.DG, label: ROLE_LABELS[Role.DG] },
  { role: Role.COMMERCIAL, label: ROLE_LABELS[Role.COMMERCIAL] },
  { role: Role.COMPTABLE, label: ROLE_LABELS[Role.COMPTABLE] },
  { role: Role.SAV, label: ROLE_LABELS[Role.SAV] },
  { role: Role.HOTEL, label: ROLE_LABELS[Role.HOTEL] },
];

export const ROUTE_ROLE_ACCESS = {
  dashboard: [Role.DG, Role.COMMERCIAL, Role.COMPTABLE, Role.SAV, Role.HOTEL],
  biens: [Role.COMMERCIAL],
  reservations: [Role.COMMERCIAL],
  demandes: [Role.COMMERCIAL, Role.COMPTABLE, Role.SAV],
  demandesCommercial: [Role.COMMERCIAL],
  demandesSav: [Role.SAV],
  demandesComptable: [Role.COMPTABLE],
  finances: [Role.DG, Role.COMPTABLE],
  archivages: [Role.COMMERCIAL],
  hotel: [Role.HOTEL],
} as const satisfies Record<string, readonly Role[]>;

const TOPBAR_NAV_ITEMS: readonly NavItemConfig[] = [
  {
    label: 'Tableau de bord',
    path: '/tableau-de-bord',
    roles: ROUTE_ROLE_ACCESS.dashboard,
  },
  {
    label: 'Biens',
    path: '/biens',
    roles: ROUTE_ROLE_ACCESS.biens,
  },
  {
    label: 'Réservations',
    path: '/reservations',
    roles: ROUTE_ROLE_ACCESS.reservations,
  },
  {
    label: 'Demandes clientèles',
    path: '/demandes',
    roles: ROUTE_ROLE_ACCESS.demandes,
  },
  {
    label: 'Finances',
    path: '/finances',
    roles: ROUTE_ROLE_ACCESS.finances,
  },
  {
    label: 'Archivages',
    path: '/archivages',
    roles: ROUTE_ROLE_ACCESS.archivages,
  },
  {
    label: 'Réservations',
    path: '/hotel/reservations',
    roles: ROUTE_ROLE_ACCESS.hotel,
  },
  {
    label: 'Espaces',
    path: '/hotel/espaces',
    roles: ROUTE_ROLE_ACCESS.hotel,
  },
  {
    label: 'Clients',
    path: '/hotel/clients',
    roles: ROUTE_ROLE_ACCESS.hotel,
  },
  {
    label: 'Employés',
    path: '/hotel/employes',
    roles: ROUTE_ROLE_ACCESS.hotel,
  },
  {
    label: 'Facturation',
    path: '/hotel/facturation',
    roles: ROUTE_ROLE_ACCESS.hotel,
  },
];

export function roleCanAccess(
  role: Role | null | undefined,
  allowedRoles: readonly Role[] | null | undefined,
): boolean {
  return !!role && !!allowedRoles?.length && allowedRoles.includes(role);
}

export function coerceRole(value: string | null | undefined): Role | null {
  return DEV_ROLE_OPTIONS.some((option) => option.role === value)
    ? (value as Role)
    : null;
}

export function readStoredDevRole(): Role | null {
  if (typeof globalThis === 'undefined' || !('localStorage' in globalThis)) {
    return null;
  }

  return coerceRole(globalThis.localStorage.getItem(DEV_ROLE_STORAGE_KEY));
}

export function persistDevRole(role: Role): void {
  if (typeof globalThis === 'undefined' || !('localStorage' in globalThis)) {
    return;
  }

  globalThis.localStorage.setItem(DEV_ROLE_STORAGE_KEY, role);
}

export function topbarNavItemsForRole(
  role: Role | null | undefined,
): readonly NavItemConfig[] {
  if (!role) {
    return [];
  }

  return TOPBAR_NAV_ITEMS.filter((item) => roleCanAccess(role, item.roles));
}

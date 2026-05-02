import {
  UbaxRole,
  UbaxScope,
  UbaxSubRole,
  type User,
} from '@ubax-workspace/shared-data-access';

// ─── Dev tool ────────────────────────────────────────────────────────────────

const DEV_ROLE_STORAGE_KEY = 'ubax_dev_role';

export type DevProfile = {
  readonly label: string;
  readonly mainRole: UbaxRole;
  readonly subRole: UbaxSubRole | null;
  readonly scope: UbaxScope | null;
};

export const DEV_PROFILES: readonly DevProfile[] = [
  {
    label: 'Super Admin',
    mainRole: UbaxRole.SUPER_ADMIN,
    subRole: null,
    scope: null,
  },
  {
    label: 'Admin',
    mainRole: UbaxRole.ADMIN,
    subRole: UbaxSubRole.DIRECTEUR_GENERAL,
    scope: 'UBAX_INTERNAL',
  },
  {
    label: "Directeur d'agence",
    mainRole: UbaxRole.PARTNER,
    subRole: UbaxSubRole.DIRECTEUR_AGENCE,
    scope: 'AGENCE',
  },
  {
    label: 'Commercial agence',
    mainRole: UbaxRole.PARTNER,
    subRole: UbaxSubRole.COMMERCIAL,
    scope: 'AGENCE',
  },
  {
    label: 'Comptable agence',
    mainRole: UbaxRole.PARTNER,
    subRole: UbaxSubRole.COMPTABLE_AGENCE,
    scope: 'AGENCE',
  },
  {
    label: 'Agent SAV',
    mainRole: UbaxRole.PARTNER,
    subRole: UbaxSubRole.AGENT_SAV,
    scope: 'AGENCE',
  },
  {
    label: 'Gérant hôtel',
    mainRole: UbaxRole.PARTNER,
    subRole: UbaxSubRole.GERANT_HOTEL,
    scope: 'HOTEL',
  },
  {
    label: 'Réceptionniste',
    mainRole: UbaxRole.PARTNER,
    subRole: UbaxSubRole.RECEPTIONNISTE,
    scope: 'HOTEL',
  },
  {
    label: 'Comptable hôtel',
    mainRole: UbaxRole.PARTNER,
    subRole: UbaxSubRole.COMPTABLE_HOTEL,
    scope: 'HOTEL',
  },
  {
    label: 'Resp. hébergement',
    mainRole: UbaxRole.PARTNER,
    subRole: UbaxSubRole.RESPONSABLE_HEBERGEMENT,
    scope: 'HOTEL',
  },
];

export function readStoredDevProfile(): DevProfile | null {
  if (typeof globalThis === 'undefined' || !('localStorage' in globalThis)) {
    return null;
  }
  const label = globalThis.localStorage.getItem(DEV_ROLE_STORAGE_KEY);
  return label ? (DEV_PROFILES.find((p) => p.label === label) ?? null) : null;
}

export function persistDevProfile(label: string): void {
  if (typeof globalThis === 'undefined' || !('localStorage' in globalThis)) {
    return;
  }
  globalThis.localStorage.setItem(DEV_ROLE_STORAGE_KEY, label);
}

// ─── Badge config par rôle principal ────────────────────────────────────────

export type RoleBadgeConfig = {
  readonly label: string;
  readonly color: string;
};

export const ROLE_BADGE_CONFIG: Record<UbaxRole, RoleBadgeConfig> = {
  [UbaxRole.SUPER_ADMIN]: { label: 'Super Admin', color: '#DC2626' },
  [UbaxRole.ADMIN]: { label: 'Admin', color: '#EA580C' },
  [UbaxRole.PARTNER]: { label: 'Partenaire', color: '#2563EB' },
  [UbaxRole.OWNER]: { label: 'Propriétaire', color: '#7C3AED' },
  [UbaxRole.CLIENT]: { label: 'Client', color: '#16A34A' },
};

// ─── Sous-rôles par scope ────────────────────────────────────────────────────

export const AGENCE_SUB_ROLES: readonly UbaxSubRole[] = [
  UbaxSubRole.DIRECTEUR_AGENCE,
  UbaxSubRole.COMMERCIAL,
  UbaxSubRole.COMPTABLE_AGENCE,
  UbaxSubRole.AGENT_SAV,
];

export const HOTEL_SUB_ROLES: readonly UbaxSubRole[] = [
  UbaxSubRole.GERANT_HOTEL,
  UbaxSubRole.RECEPTIONNISTE,
  UbaxSubRole.COMPTABLE_HOTEL,
  UbaxSubRole.RESPONSABLE_HEBERGEMENT,
];

export const INTERNAL_SUB_ROLES: readonly UbaxSubRole[] = [
  UbaxSubRole.DIRECTEUR_GENERAL,
  UbaxSubRole.SUPPORT_CLIENT,
  UbaxSubRole.OPERATIONS,
  UbaxSubRole.FINANCE,
  UbaxSubRole.COMMERCIAL,
];

export const SUB_ROLE_LABELS: Record<UbaxSubRole, string> = {
  [UbaxSubRole.DIRECTEUR_AGENCE]: "Directeur d'agence",
  [UbaxSubRole.COMMERCIAL]: 'Commercial',
  [UbaxSubRole.COMPTABLE_AGENCE]: 'Comptable',
  [UbaxSubRole.AGENT_SAV]: 'Agent SAV',
  [UbaxSubRole.GERANT_HOTEL]: 'Gérant hôtel',
  [UbaxSubRole.RECEPTIONNISTE]: 'Réceptionniste',
  [UbaxSubRole.COMPTABLE_HOTEL]: 'Comptable hôtel',
  [UbaxSubRole.RESPONSABLE_HEBERGEMENT]: 'Resp. hébergement',
  [UbaxSubRole.DIRECTEUR_GENERAL]: 'Directeur général',
  [UbaxSubRole.SUPPORT_CLIENT]: 'Support client',
  [UbaxSubRole.OPERATIONS]: 'Opérations',
  [UbaxSubRole.FINANCE]: 'Finance',
};

// ─── Helpers de permission ────────────────────────────────────────────────────

/** Module Administrateur — lecture (ADMIN + SUPER_ADMIN) */
export function canAdminRead(mainRole: UbaxRole | null | undefined): boolean {
  return mainRole === UbaxRole.ADMIN || mainRole === UbaxRole.SUPER_ADMIN;
}

/** Module Administrateur — écriture (SUPER_ADMIN uniquement) */
export function canAdminWrite(mainRole: UbaxRole | null | undefined): boolean {
  return mainRole === UbaxRole.SUPER_ADMIN;
}

/** Module Team — écriture (DIRECTEUR_AGENCE ou GERANT_HOTEL selon scope) */
export function canTeamWrite(user: User | null | undefined): boolean {
  if (!user) return false;
  if (user.scope === 'AGENCE')
    return user.subRole === UbaxSubRole.DIRECTEUR_AGENCE;
  if (user.scope === 'HOTEL') return user.subRole === UbaxSubRole.GERANT_HOTEL;
  return false;
}

/** Empêche qu'un admin agisse sur son propre compte */
export function isSelf(
  currentUserId: string | null | undefined,
  targetUserId: string,
): boolean {
  return !!currentUserId && currentUserId === targetUserId;
}

// ─── Sélection du sous-rôle primaire ─────────────────────────────────────────

/**
 * Ordre de priorité décroissant : rôle de direction > métier > support.
 * Utilisé quand le backend retourne plusieurs sous-rôles pour un même user.
 */
const SUB_ROLE_PRIORITY: readonly UbaxSubRole[] = [
  UbaxSubRole.DIRECTEUR_AGENCE,
  UbaxSubRole.GERANT_HOTEL,
  UbaxSubRole.DIRECTEUR_GENERAL,
  UbaxSubRole.COMMERCIAL,
  UbaxSubRole.COMPTABLE_AGENCE,
  UbaxSubRole.COMPTABLE_HOTEL,
  UbaxSubRole.FINANCE,
  UbaxSubRole.AGENT_SAV,
  UbaxSubRole.RECEPTIONNISTE,
  UbaxSubRole.RESPONSABLE_HEBERGEMENT,
  UbaxSubRole.SUPPORT_CLIENT,
  UbaxSubRole.OPERATIONS,
];

export function pickPrimarySubRole(
  subRoles: readonly string[],
): UbaxSubRole | null {
  for (const candidate of SUB_ROLE_PRIORITY) {
    if (subRoles.includes(candidate)) return candidate;
  }
  return null;
}

// ─── Accès par route ──────────────────────────────────────────────────────────

export type RouteAccess = {
  readonly roles: readonly UbaxRole[];
  readonly scope?: UbaxScope;
};

/**
 * Accès par route.
 * - `roles` : rôles principaux Keycloak autorisés
 * - `scope` : si précisé, le user.scope doit correspondre
 *
 * La granularité sous-rôle est gérée au niveau composant (boutons d'action)
 * et non au niveau route, car les sous-rôles arrivent de l'API async.
 */
export const ROUTE_ROLE_ACCESS = {
  // Backoffice interne UBAX
  administrateurs: { roles: [UbaxRole.ADMIN, UbaxRole.SUPER_ADMIN] },

  // Espace partenaire commun
  dashboard: { roles: [UbaxRole.PARTNER] },

  // Espace partenaire — agence
  biens: { roles: [UbaxRole.PARTNER], scope: 'AGENCE' as UbaxScope },
  reservations: { roles: [UbaxRole.PARTNER], scope: 'AGENCE' as UbaxScope },
  demandes: { roles: [UbaxRole.PARTNER], scope: 'AGENCE' as UbaxScope },
  finances: { roles: [UbaxRole.PARTNER], scope: 'AGENCE' as UbaxScope },
  archivages: { roles: [UbaxRole.PARTNER], scope: 'AGENCE' as UbaxScope },
  teamAgence: { roles: [UbaxRole.PARTNER], scope: 'AGENCE' as UbaxScope },

  // Espace partenaire — hôtel
  hotel: { roles: [UbaxRole.PARTNER], scope: 'HOTEL' as UbaxScope },
  teamHotel: { roles: [UbaxRole.PARTNER], scope: 'HOTEL' as UbaxScope },
} as const satisfies Record<string, RouteAccess>;

// ─── Navigation topbar ───────────────────────────────────────────────────────

export type NavItemConfig = {
  readonly label: string;
  readonly path: string;
  readonly activePaths?: readonly string[];
  /** Rôles principaux autorisés — undefined = tous */
  readonly mainRoles?: readonly UbaxRole[];
  /** Scope requis pour les PARTNER */
  readonly scope?: UbaxScope;
  /**
   * Sous-rôles autorisés (scope AGENCE/HOTEL uniquement).
   * undefined = tous les sous-rôles du scope.
   * Si user.subRole est null (pas encore chargé) la restriction est ignorée.
   */
  readonly subRoles?: readonly UbaxSubRole[];
};

const TOPBAR_NAV_ITEMS: readonly NavItemConfig[] = [
  // ── Partenaire — commun ──────────────────────────────────────────────────
  {
    label: 'Tableau de bord',
    path: '/tableau-de-bord',
    mainRoles: [UbaxRole.PARTNER, UbaxRole.ADMIN, UbaxRole.SUPER_ADMIN],
  },

  // ── Partenaire — agence ──────────────────────────────────────────────────
  {
    label: 'Biens',
    path: '/biens',
    mainRoles: [UbaxRole.PARTNER],
    scope: 'AGENCE',
    subRoles: [UbaxSubRole.DIRECTEUR_AGENCE, UbaxSubRole.COMMERCIAL],
  },
  {
    label: 'Réservations',
    path: '/reservations',
    mainRoles: [UbaxRole.PARTNER],
    scope: 'AGENCE',
    subRoles: [UbaxSubRole.DIRECTEUR_AGENCE, UbaxSubRole.COMMERCIAL],
  },
  {
    label: 'Demandes clientèles',
    path: '/demandes',
    mainRoles: [UbaxRole.PARTNER],
    scope: 'AGENCE',
    subRoles: [
      UbaxSubRole.DIRECTEUR_AGENCE,
      UbaxSubRole.COMMERCIAL,
      UbaxSubRole.COMPTABLE_AGENCE,
      UbaxSubRole.AGENT_SAV,
    ],
  },
  {
    label: 'Finances',
    path: '/finances',
    mainRoles: [UbaxRole.PARTNER],
    scope: 'AGENCE',
    subRoles: [UbaxSubRole.DIRECTEUR_AGENCE, UbaxSubRole.COMPTABLE_AGENCE],
  },
  {
    label: 'Archivages',
    path: '/archivages',
    mainRoles: [UbaxRole.PARTNER],
    scope: 'AGENCE',
    subRoles: [UbaxSubRole.DIRECTEUR_AGENCE, UbaxSubRole.COMMERCIAL],
  },
  {
    label: 'Mon équipe',
    path: '/equipe',
    mainRoles: [UbaxRole.PARTNER],
    scope: 'AGENCE',
  },

  // ── Partenaire — hôtel ───────────────────────────────────────────────────
  {
    label: 'Réservations',
    path: '/hotel/reservations',
    activePaths: ['/hotel/reservations'],
    mainRoles: [UbaxRole.PARTNER],
    scope: 'HOTEL',
  },
  {
    label: 'Espaces',
    path: '/hotel/espaces',
    mainRoles: [UbaxRole.PARTNER],
    scope: 'HOTEL',
  },
  {
    label: 'Clients',
    path: '/hotel/clients',
    mainRoles: [UbaxRole.PARTNER],
    scope: 'HOTEL',
  },
  {
    label: 'Employés',
    path: '/hotel/employes',
    mainRoles: [UbaxRole.PARTNER],
    scope: 'HOTEL',
  },
  {
    label: 'Facturation',
    path: '/hotel/facturation',
    mainRoles: [UbaxRole.PARTNER],
    scope: 'HOTEL',
    subRoles: [UbaxSubRole.GERANT_HOTEL, UbaxSubRole.COMPTABLE_HOTEL],
  },
  {
    label: 'Mon équipe',
    path: '/hotel/equipe',
    mainRoles: [UbaxRole.PARTNER],
    scope: 'HOTEL',
  },
];

function userCanSeeNavItem(user: User, item: NavItemConfig): boolean {
  if (item.mainRoles && !item.mainRoles.includes(user.mainRole)) return false;

  if (user.mainRole === UbaxRole.PARTNER) {
    if (item.scope && item.scope !== user.scope) return false;

    // Only filter by sub-role when both sides are known
    if (item.subRoles?.length && user.subRole !== null) {
      if (!item.subRoles.includes(user.subRole)) return false;
    }
  }

  return true;
}

export function topbarNavItemsForUser(
  user: User | null | undefined,
): readonly NavItemConfig[] {
  if (!user) return [];
  return TOPBAR_NAV_ITEMS.filter((item) => userCanSeeNavItem(user, item));
}

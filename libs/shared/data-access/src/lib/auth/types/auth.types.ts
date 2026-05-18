import type { UbaxRole, UbaxSubRole } from '../enums/auth-roles.enums';

export type UbaxScope = 'AGENCE' | 'HOTEL' | 'UBAX_INTERNAL';

export type User = {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  avatar?: string;
  mainRole: UbaxRole;
  // Populated after GET /sub-roles — null until loaded
  subRole: UbaxSubRole | null;
  scope: UbaxScope | null;
};

export type StoredAuthSession = {
  accessToken: string;
  refreshToken: string;
};

export type MySubRolesResponse = {
  scope: UbaxScope;
  subRoles: string[];
};

export type ResolvedUserProfile = {
  userId: string | null;
  scope: UbaxScope | null;
  avatarUrl: string | null;
};

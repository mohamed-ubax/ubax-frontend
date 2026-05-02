export enum UbaxRole {
  SUPER_ADMIN = 'UBAX_SUPER_ADMIN',
  ADMIN = 'UBAX_ADMIN',
  PARTNER = 'UBAX_PARTNER',
  OWNER = 'UBAX_OWNER',
  CLIENT = 'UBAX_CLIENT',
}

export enum UbaxSubRole {
  // Scope AGENCE
  DIRECTEUR_AGENCE = 'DIRECTEUR_AGENCE',
  COMMERCIAL = 'COMMERCIAL',
  COMPTABLE_AGENCE = 'COMPTABLE_AGENCE',
  AGENT_SAV = 'AGENT_SAV',
  // Scope HOTEL
  GERANT_HOTEL = 'GERANT_HOTEL',
  RECEPTIONNISTE = 'RECEPTIONNISTE',
  COMPTABLE_HOTEL = 'COMPTABLE_HOTEL',
  RESPONSABLE_HEBERGEMENT = 'RESPONSABLE_HEBERGEMENT',
  // Scope UBAX_INTERNAL
  DIRECTEUR_GENERAL = 'DIRECTEUR_GENERAL',
  SUPPORT_CLIENT = 'SUPPORT_CLIENT',
  OPERATIONS = 'OPERATIONS',
  FINANCE = 'FINANCE',
}

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

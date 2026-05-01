export enum Role {
  DG = 'DG',
  COMMERCIAL = 'COMMERCIAL',
  COMPTABLE = 'COMPTABLE',
  SAV = 'SAV',
  HOTEL = 'HOTEL',
}

export interface User {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  avatar?: string;
  role: Role;
}

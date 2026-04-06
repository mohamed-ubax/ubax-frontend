export type ChambreStatut = 'disponible' | 'occupee' | 'en_nettoyage' | 'hors_service';
export type ChambreType = 'simple' | 'double' | 'suite' | 'familiale';

export interface Chambre {
  id: string;
  numero: string;
  type: ChambreType;
  statut: ChambreStatut;
  etage: number;
  prixNuit: number;
  photos: string[];
  description?: string;
  capacite: number;
  equipements: string[];
}

export type EmployePoste =
  | 'receptionniste'
  | 'femme_de_chambre'
  | 'chef_cuisiner'
  | 'serveur'
  | 'securite'
  | 'manager'
  | 'autre';

export interface Employe {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  avatar?: string;
  poste: EmployePoste;
  dateEmbauche: string;
  salaire: number;
  actif: boolean;
}

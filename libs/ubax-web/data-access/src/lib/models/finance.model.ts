export type DepenseCategorie =
  | 'entretien'
  | 'reparation'
  | 'taxe'
  | 'assurance'
  | 'salaire'
  | 'autre';

export interface Depense {
  id: string;
  libelle: string;
  montant: number;
  categorie: DepenseCategorie;
  bienId?: string;
  date: string;
  justificatif?: string;
}

export interface Recette {
  id: string;
  libelle: string;
  montant: number;
  bienId: string;
  locataireId: string;
  date: string;
  type: 'loyer' | 'caution' | 'autre';
}

export interface Transaction {
  id: string;
  libelle: string;
  montant: number;
  type: 'credit' | 'debit';
  date: string;
  reference: string;
}

export interface Facture {
  id: string;
  numero: string;
  locataireId: string;
  bienId: string;
  montant: number;
  statut: 'payee' | 'en_attente' | 'en_retard';
  dateEmission: string;
  dateEcheance: string;
}

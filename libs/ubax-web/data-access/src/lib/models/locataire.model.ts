export type LocataireStatut = 'actif' | 'en_retard' | 'archive';

export interface Locataire {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  avatar?: string;
  statut: LocataireStatut;
  bienId: string;
  dateEntree: string;
  dateSortie?: string;
  loyerMensuel: number;
}

export type BienType = 'appartement' | 'maison' | 'villa' | 'bureau' | 'local' | 'terrain';
export type BienStatut = 'disponible' | 'loue' | 'vendu' | 'en_travaux';

export interface Bien {
  id: string;
  titre: string;
  type: BienType;
  statut: BienStatut;
  adresse: string;
  ville: string;
  superficie: number;
  prix: number;
  photos: string[];
  description?: string;
  dateAjout: string;
}

export type ReservationStatut = 'en_attente' | 'confirmee' | 'annulee' | 'terminee';

export interface Reservation {
  id: string;
  bienId: string;
  locataireId: string;
  dateDebut: string;
  dateFin: string;
  montant: number;
  statut: ReservationStatut;
  notes?: string;
  dateCreation: string;
}

import { Role } from './user.model';

export type DemandeStatut = 'nouvelle' | 'en_cours' | 'resolue' | 'rejetee';
export type DemandePriorite = 'basse' | 'normale' | 'haute' | 'urgente';

export interface Demande {
  id: string;
  titre: string;
  description: string;
  statut: DemandeStatut;
  priorite: DemandePriorite;
  clientNom: string;
  clientEmail: string;
  clientTelephone?: string;
  assigneA?: string;
  assigneRole?: Role;
  bienId?: string;
  dateCreation: string;
  dateMiseAJour: string;
  notes?: string;
}

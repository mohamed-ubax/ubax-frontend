export type Technician = {
  id: string;
  name: string;
  initials: string;
  specialty: string;
  rating: number;
  tickets: number;
  phone: string;
  color: string;
};

export type Ticket = {
  id: string;
  client: string;
  initials: string;
  bien: string;
  probleme: string;
  priorite: 'Urgent' | 'Normal';
  date: string;
  statut: 'Résolu' | 'En cours' | 'En attente';
};

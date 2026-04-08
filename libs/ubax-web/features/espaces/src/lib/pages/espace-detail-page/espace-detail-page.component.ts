import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

interface Reservation {
  id: number;
  client: string;
  dateArrivee: string;
  dateDepart: string;
  nuits: number;
  montant: string;
  statut: 'confirmee' | 'en-attente' | 'annulee';
}

@Component({
  selector: 'ubax-espace-detail-page',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './espace-detail-page.component.html',
  styleUrl: './espace-detail-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EspaceDetailPageComponent {
  readonly activeTab = signal<'reservations' | 'details' | 'avis'>(
    'reservations',
  );

  readonly espace = {
    titre: 'Chambre Queen A-2345',
    tag: 'Chambre',
    statut: 'Disponible' as 'Disponible' | 'Réservé' | 'Occupé',
    location: 'Abidjan, Cocody',
    prix: '65 000 FCFA / nuit',
    rating: 4.1,
    superficie: '35 m²',
    capacite: '2 personnes',
    etage: '3ème étage',
    description:
      "Spacieuse chambre queen avec vue sur jardin, équipée d'une climatisation, d'un minibar et d'un accès Wi-Fi haut débit. Idéale pour les séjours courts ou longs.",
    equipements: [
      { icon: 'pi-wifi', label: 'Wi-Fi inclus' },
      { icon: 'pi-sun', label: 'Climatisation' },
      { icon: 'pi-tv', label: 'TV câble' },
      { icon: 'pi-car', label: 'Parking' },
      { icon: 'pi-shopping-bag', label: 'Minibar' },
      { icon: 'pi-check-circle', label: 'Salle de bain privée' },
    ],
    proprietaire: {
      nom: 'Aïcha Kouadio',
      role: 'Propriétaire',
      telephone: '+225 07 00 00 01',
      email: 'aicha@mail.com',
    },
  };

  readonly reservations: Reservation[] = [
    {
      id: 1,
      client: 'Konan Yves',
      dateArrivee: '10 Avr 2026',
      dateDepart: '14 Avr 2026',
      nuits: 4,
      montant: '260 000 FCFA',
      statut: 'confirmee',
    },
    {
      id: 2,
      client: 'Bamba Sékou',
      dateArrivee: '18 Avr 2026',
      dateDepart: '20 Avr 2026',
      nuits: 2,
      montant: '130 000 FCFA',
      statut: 'en-attente',
    },
    {
      id: 3,
      client: 'Marie Dosso',
      dateArrivee: '25 Avr 2026',
      dateDepart: '30 Avr 2026',
      nuits: 5,
      montant: '325 000 FCFA',
      statut: 'confirmee',
    },
    {
      id: 4,
      client: 'Ibrahim Touré',
      dateArrivee: '5 Mar 2026',
      dateDepart: '7 Mar 2026',
      nuits: 2,
      montant: '130 000 FCFA',
      statut: 'annulee',
    },
  ];
}

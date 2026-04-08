import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

type EspaceType = 'chambre' | 'salle';

@Component({
  selector: 'ubax-espace-add-page',
  standalone: true,
  imports: [RouterLink, FormsModule],
  templateUrl: './espace-add-page.component.html',
  styleUrl: './espace-add-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EspaceAddPageComponent {
  readonly currentStep = signal(1);
  readonly espaceType = signal<EspaceType>('chambre');

  // ── Step 1: Informations générales ────────────────────────────────────
  readonly titre = signal('');
  readonly description = signal('');
  readonly etage = signal('');
  readonly superficie = signal('');
  readonly capacite = signal('');
  readonly location = signal('');

  // ── Step 2: Photos & Équipements ─────────────────────────────────────
  readonly equipements = signal<string[]>([]);
  readonly equipementsDisponibles = [
    'Wi-Fi',
    'Climatisation',
    'TV câble',
    'Parking',
    'Minibar',
    'Salle de bain privée',
    'Balcon',
    'Coffre-fort',
    'Kitchenette',
    'Jacuzzi',
  ];

  // Salle-specific
  readonly capaciteSalle = signal('');
  readonly equipSalle = signal<string[]>([]);
  readonly equipSalleDisponibles = [
    'Projecteur',
    'Tableau blanc',
    'Sonorisation',
    'Climatisation',
    'Wi-Fi',
    'Tables modulables',
    'Chaises empilables',
    'Catering disponible',
  ];

  // ── Step 3: Tarification ──────────────────────────────────────────────
  readonly prixNuit = signal('');
  readonly prixSemaine = signal('');
  readonly prixMois = signal('');
  readonly prixHeure = signal(''); // salle only
  readonly prixJournee = signal(''); // salle only
  readonly caution = signal('');

  readonly steps = [
    { label: 'Informations générales' },
    { label: 'Photos & Équipements' },
    { label: 'Tarification' },
  ];

  readonly stepSidebars = [
    {
      icon: 'pi-home',
      title: 'Informations générales',
      desc: 'Renseignez les informations de base de votre espace : nom, type, emplacement et description.',
    },
    {
      icon: 'pi-images',
      title: 'Photos & Équipements',
      desc: 'Ajoutez des photos attractives et listez les équipements disponibles pour attirer les clients.',
    },
    {
      icon: 'pi-tag',
      title: 'Tarification',
      desc: 'Définissez les tarifs selon la durée de location pour maximiser vos revenus.',
    },
  ];

  get currentSidebar() {
    return this.stepSidebars[this.currentStep() - 1];
  }

  toggleEquipement(eq: string): void {
    const list = this.equipements();
    if (list.includes(eq)) {
      this.equipements.set(list.filter((e) => e !== eq));
    } else {
      this.equipements.set([...list, eq]);
    }
  }

  toggleEquipSalle(eq: string): void {
    const list = this.equipSalle();
    if (list.includes(eq)) {
      this.equipSalle.set(list.filter((e) => e !== eq));
    } else {
      this.equipSalle.set([...list, eq]);
    }
  }

  nextStep(): void {
    if (this.currentStep() < 3) this.currentStep.update((s) => s + 1);
  }

  prevStep(): void {
    if (this.currentStep() > 1) this.currentStep.update((s) => s - 1);
  }
}

import {
  ChangeDetectionStrategy,
  Component,
  signal,
  computed,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

type Role = 'administrateur' | 'concierge' | 'employe';

type DayToggle = {
  id: string;
  label: string;
  selected: boolean;};

@Component({
  selector: 'ubax-employe-add-page',
  standalone: true,
  imports: [RouterLink, FormsModule],
  templateUrl: './employe-add-page.component.html',
  styleUrl: './employe-add-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmployeAddPageComponent {
  readonly currentStep = signal(1);

  // Step 1 — Informations personnelles
  readonly prenom = signal('');
  readonly nomFamille = signal('');
  readonly dateNaissance = signal('');
  readonly nationalite = signal('');
  readonly genre = signal('');
  readonly adresse = signal('');

  // Step 2 — Coordonnées
  readonly email = signal('');
  readonly telephone = signal('');
  readonly contactUrgence = signal('');
  readonly telUrgence = signal('');
  readonly selectedRole = signal<Role>('employe');

  // Step 3 — Informations de poste
  readonly departement = signal('');
  readonly intitulePoste = signal('');
  readonly contrat = signal('');
  readonly dateEntree = signal('');
  readonly salaire = signal('');
  readonly notes = signal('');

  // Step 4 — Jours de travail
  readonly days = signal<DayToggle[]>([
    { id: 'lun', label: 'Lundi', selected: true },
    { id: 'mar', label: 'Mardi', selected: true },
    { id: 'mer', label: 'Mercredi', selected: true },
    { id: 'jeu', label: 'Jeudi', selected: true },
    { id: 'ven', label: 'Vendredi', selected: true },
    { id: 'sam', label: 'Samedi', selected: false },
    { id: 'dim', label: 'Dimanche', selected: false },
  ]);
  readonly heureArrivee = signal('');
  readonly heureDepart = signal('');

  readonly roles: { id: Role; label: string }[] = [
    { id: 'administrateur', label: 'Administrateur' },
    { id: 'concierge', label: 'Concierge' },
    { id: 'employe', label: 'Employé' },
  ];

  readonly stepSidebars = [
    {
      icon: 'pi-user',
      title: 'Informations personnelles',
      desc: "Veuillez renseigner avec précision les informations personnelles de la personne afin d'assurer un enregistrement complet et conforme du dossier.",
    },
    {
      icon: 'pi-phone',
      title: 'Coordonnées',
      desc: 'Veuillez renseigner avec précision les coordonnées de la personne afin de garantir une communication fiable et efficace.',
    },
    {
      icon: 'pi-briefcase',
      title: 'Informations de poste',
      desc: 'Veuillez renseigner les informations relatives au poste occupé afin de compléter le dossier administratif.',
    },
    {
      icon: 'pi-calendar',
      title: 'Jours de travail',
      desc: "Veuillez renseigner les jours de travail afin de définir le planning et l'organisation du poste.",
    },
  ];

  readonly currentSidebar = computed(
    () => this.stepSidebars[this.currentStep() - 1],
  );

  readonly selectedDays = computed(() =>
    this.days()
      .filter((d) => d.selected)
      .map((d) => d.label)
      .join(' – '),
  );

  readonly selectedDaysSummary = computed(() => {
    const selectedIds = this.days()
      .filter((day) => day.selected)
      .map((day) => day.id);

    if (selectedIds.join(',') === 'lun,mar,mer,jeu,ven') {
      return 'Lun - Ven';
    }

    return this.days()
      .filter((day) => day.selected)
      .map((day) => day.label.slice(0, 3))
      .join(' - ');
  });

  readonly fullNameSummary = computed(() => {
    const value = [this.prenom().trim(), this.nomFamille().trim()]
      .filter(Boolean)
      .join(' ');

    return value || 'Marie Koffi';
  });

  readonly departmentSummary = computed(
    () => this.departement().trim() || 'Réception',
  );

  readonly contractSummary = computed(() => this.contrat().trim() || 'CDI');

  readonly scheduleSummary = computed(() => {
    const arrival = this.heureArrivee().trim() || '08 : 00';
    const departure = this.heureDepart().trim() || '18 : 00';

    return `${arrival} - ${departure}`;
  });

  toggleDay(id: string): void {
    this.days.update((days) =>
      days.map((d) => (d.id === id ? { ...d, selected: !d.selected } : d)),
    );
  }

  nextStep(): void {
    if (this.currentStep() < 4) this.currentStep.update((s) => s + 1);
  }

  prevStep(): void {
    if (this.currentStep() > 1) this.currentStep.update((s) => s - 1);
  }
}

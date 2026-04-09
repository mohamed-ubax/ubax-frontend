import { ChangeDetectionStrategy, Component, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';

type TabId = 'all' | 'active' | 'inactive';
type EmployeStatus = 'Actif' | 'Inactif';

interface Employe {
  id: string;
  nom: string;
  role: string;
  description: string;
  joursTravail: string;
  horaires: string;
  telephone: string;
  status: EmployeStatus;
  avatarInitials: string;
}

@Component({
  selector: 'ubax-employes-list-page',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './employes-list-page.component.html',
  styleUrl: './employes-list-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmployesListPageComponent {
  readonly activeTab = signal<TabId>('all');
  readonly activePage = signal(1);
  readonly pages = [1, 2, 3, 4, 5];

  readonly tabs: { id: TabId; label: string; count: number }[] = [
    { id: 'all',      label: 'Tous les employés', count: 22 },
    { id: 'active',   label: 'Actives',            count: 15 },
    { id: 'inactive', label: 'Inactives',           count: 7  },
  ];

  readonly allEmployes: Employe[] = [
    { id: '1', nom: 'Koffi Yao',           role: 'Responsable Sécurité', description: 'Sécurité générale & surveillance',  joursTravail: 'Lun – Ven', horaires: '08:00 – 20:00', telephone: '+225 07 00 00 01', status: 'Actif',   avatarInitials: 'KY' },
    { id: '2', nom: 'Youssouf Traoré',     role: 'Concierge',            description: 'Accueil & service aux clients',    joursTravail: 'Lun – Sam', horaires: '07:00 – 15:00', telephone: '+225 07 00 00 02', status: 'Actif',   avatarInitials: 'YT' },
    { id: '3', nom: 'Aïcha Koné',          role: 'Femme de ménage',      description: 'Nettoyage & entretien des chambres', joursTravail: 'Lun – Ven', horaires: '08:00 – 16:00', telephone: '+225 07 00 00 03', status: 'Actif',   avatarInitials: 'AK' },
    { id: '4', nom: 'Souleymane Diabaté',  role: 'Réceptionniste',       description: 'Gestion des check-in / check-out',  joursTravail: 'Lun – Dim', horaires: '14:00 – 22:00', telephone: '+225 07 00 00 04', status: 'Actif',   avatarInitials: 'SD' },
    { id: '5', nom: 'Adama Bamba',         role: 'Chef Cuisinier',       description: 'Cuisine & gestion du restaurant',  joursTravail: 'Mar – Sam', horaires: '10:00 – 18:00', telephone: '+225 07 00 00 05', status: 'Inactif', avatarInitials: 'AB' },
    { id: '6', nom: 'Fatou Ouédraogo',     role: 'Administratrice',      description: 'Gestion administrative & RH',     joursTravail: 'Lun – Ven', horaires: '09:00 – 17:00', telephone: '+225 07 00 00 06', status: 'Inactif', avatarInitials: 'FO' },
  ];

  readonly filteredEmployes = computed(() => {
    const tab = this.activeTab();
    if (tab === 'active')   return this.allEmployes.filter(e => e.status === 'Actif');
    if (tab === 'inactive') return this.allEmployes.filter(e => e.status === 'Inactif');
    return this.allEmployes;
  });

  setTab(id: TabId): void {
    this.activeTab.set(id);
    this.activePage.set(1);
  }
}

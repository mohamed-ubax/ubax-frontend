import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

type CalendarView = 'jour' | 'semaine' | 'mois' | 'annee';

interface Document {
  nom: string;
}

interface SalaryPayment {
  label: string;
  date: string;
  mois: string;
  montant: string;
}

interface CalendarDay {
  date: number;
  isGhost: boolean; // days from prev/next month
  events: CalendarEvent[];
}

interface CalendarEvent {
  type: 'shift' | 'conge';
  label: string;
}

interface EmployePageAction {
  readonly label: string;
  readonly iconSrc: string;
  readonly variant: 'edit' | 'archive';
}

interface EmployeProfileContact {
  readonly label: string;
  readonly value: string;
  readonly iconSrc: string;
  readonly hasFramedIcon?: boolean;
}

@Component({
  selector: 'ubax-employe-detail-page',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './employe-detail-page.component.html',
  styleUrl: './employe-detail-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmployeDetailPageComponent {
  readonly calendarView = signal<CalendarView>('mois');
  readonly currentMonthLabel = signal('Mars 2026');

  readonly calendarViews: { id: CalendarView; label: string }[] = [
    { id: 'jour', label: 'Jour' },
    { id: 'semaine', label: 'Semaine' },
    { id: 'mois', label: 'Mois' },
    { id: 'annee', label: 'Année' },
  ];

  readonly employe = {
    nom: 'Youssouf Traoré',
    role: 'Responsable Sécurité',
    avatarSrc: '/employes/images/employe-youssouf-traore.png',
    telephone: '+225 07 00 00 01',
    email: 'keanurepes@mail.com',
    contrat: 'Contrat : CDD',
    dateEmbauche: '12 Décembre 2025',
    statut: 'En service',
    shift: 'Shift journée',
  };

  readonly pageActions: readonly EmployePageAction[] = [
    {
      label: 'Editer',
      iconSrc: '/employe-detail/icons/edit.svg',
      variant: 'edit',
    },
    {
      label: 'Archiver',
      iconSrc: '/employe-detail/icons/archive.svg',
      variant: 'archive',
    },
  ];

  readonly profileContacts: readonly EmployeProfileContact[] = [
    {
      label: 'Téléphone',
      value: this.employe.telephone,
      iconSrc: '/employe-detail/icons/phone.svg',
    },
    {
      label: 'Email',
      value: this.employe.email,
      iconSrc: '/employe-detail/icons/mail.svg',
    },
    {
      label: 'Type de contrat',
      value: this.employe.contrat,
      iconSrc: '/employe-detail/icons/contract.svg',
    },
    {
      label: 'Date d’embauche',
      value: this.employe.dateEmbauche,
      iconSrc: '/employe-detail/icons/hire-date.svg',
      hasFramedIcon: true,
    },
  ];

  readonly documents: Document[] = [
    { nom: 'CNI' },
    { nom: 'Contrat de travail' },
    { nom: 'Fiche de paie' },
  ];

  readonly payments: SalaryPayment[] = [
    {
      label: 'Paiement salaire',
      date: '5 Avril 2026 à 12:30',
      mois: 'Mars 2026',
      montant: '+ 450 000 FCFA',
    },
    {
      label: 'Paiement salaire',
      date: '5 Avril 2026 à 12:30',
      mois: 'Février 2026',
      montant: '+ 450 000 FCFA',
    },
    {
      label: 'Paiement salaire',
      date: '5 Avril 2026 à 12:30',
      mois: 'Janvier 2026',
      montant: '+ 450 000 FCFA',
    },
    {
      label: 'Paiement salaire',
      date: '5 Avril 2026 à 12:30',
      mois: 'Décembre 2025',
      montant: '+ 450 000 FCFA',
    },
  ];

  readonly weekDays = [
    'Dimanche',
    'Lundi',
    'Mardi',
    'Mercredi',
    'Jeudi',
    'Vendredi',
    'Samedi',
  ];

  // Mars 2026: starts on Sunday (day 0). Ghost days: 28, 29, 30 (Feb)
  readonly calendarWeeks: CalendarDay[][] = [
    [
      { date: 28, isGhost: true, events: [{ type: 'conge', label: 'Congé' }] },
      {
        date: 29,
        isGhost: true,
        events: [{ type: 'shift', label: '08H:00 – 20H:00' }],
      },
      {
        date: 30,
        isGhost: true,
        events: [{ type: 'shift', label: '08H:00 – 20H:00' }],
      },
      {
        date: 1,
        isGhost: false,
        events: [{ type: 'shift', label: '08H:00 – 20H:00' }],
      },
      {
        date: 2,
        isGhost: false,
        events: [{ type: 'shift', label: '08H:00 – 20H:00' }],
      },
      {
        date: 3,
        isGhost: false,
        events: [{ type: 'shift', label: '08H:00 – 20H:00' }],
      },
      { date: 4, isGhost: false, events: [] },
    ],
    [
      { date: 5, isGhost: false, events: [{ type: 'conge', label: 'Congé' }] },
      {
        date: 6,
        isGhost: false,
        events: [{ type: 'shift', label: '08H:00 – 20H:00' }],
      },
      {
        date: 7,
        isGhost: false,
        events: [{ type: 'shift', label: '08H:00 – 20H:00' }],
      },
      {
        date: 8,
        isGhost: false,
        events: [{ type: 'shift', label: '08H:00 – 20H:00' }],
      },
      {
        date: 9,
        isGhost: false,
        events: [{ type: 'shift', label: '08H:00 – 20H:00' }],
      },
      {
        date: 10,
        isGhost: false,
        events: [{ type: 'shift', label: '08H:00 – 20H:00' }],
      },
      {
        date: 11,
        isGhost: false,
        events: [{ type: 'shift', label: '08H:00 – 20H:00' }],
      },
    ],
    [
      { date: 12, isGhost: false, events: [{ type: 'conge', label: 'Congé' }] },
      {
        date: 13,
        isGhost: false,
        events: [{ type: 'shift', label: '08H:00 – 20H:00' }],
      },
      {
        date: 14,
        isGhost: false,
        events: [{ type: 'shift', label: '08H:00 – 20H:00' }],
      },
      { date: 15, isGhost: false, events: [] },
      {
        date: 16,
        isGhost: false,
        events: [{ type: 'shift', label: '08H:00 – 20H:00' }],
      },
      {
        date: 17,
        isGhost: false,
        events: [{ type: 'shift', label: '08H:00 – 20H:00' }],
      },
      { date: 18, isGhost: false, events: [] },
    ],
    [
      { date: 19, isGhost: false, events: [{ type: 'conge', label: 'Congé' }] },
      {
        date: 20,
        isGhost: false,
        events: [{ type: 'shift', label: '08H:00 – 20H:00' }],
      },
      {
        date: 21,
        isGhost: false,
        events: [{ type: 'shift', label: '08H:00 – 20H:00' }],
      },
      { date: 22, isGhost: false, events: [] },
      {
        date: 23,
        isGhost: false,
        events: [{ type: 'shift', label: '08H:00 – 20H:00' }],
      },
      {
        date: 24,
        isGhost: false,
        events: [{ type: 'shift', label: '08H:00 – 20H:00' }],
      },
      { date: 25, isGhost: false, events: [] },
    ],
    [
      { date: 26, isGhost: false, events: [{ type: 'conge', label: 'Congé' }] },
      {
        date: 27,
        isGhost: false,
        events: [{ type: 'shift', label: '08H:00 – 20H:00' }],
      },
      {
        date: 28,
        isGhost: false,
        events: [{ type: 'shift', label: '08H:00 – 20H:00' }],
      },
      {
        date: 29,
        isGhost: false,
        events: [{ type: 'shift', label: '08H:00 – 20H:00' }],
      },
      {
        date: 30,
        isGhost: false,
        events: [{ type: 'shift', label: '08H:00 – 20H:00' }],
      },
      {
        date: 31,
        isGhost: false,
        events: [{ type: 'shift', label: '08H:00 – 20H:00' }],
      },
      { date: 1, isGhost: true, events: [] },
    ],
  ];
}

import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { AuthStore } from '@ubax-workspace/ubax-web-data-access';
import {
  DateRange,
  DateRangePickerComponent,
  LazyChartComponent,
} from '@ubax-workspace/shared-ui';

export type Technician = {
  id: string;
  name: string;
  initials: string;
  specialty: string;
  rating: number;
  tickets: number;
  phone: string;
  color: string;};

export type Ticket = {
  id: string;
  client: string;
  initials: string;
  bien: string;
  probleme: string;
  priorite: 'Urgent' | 'Normal';
  date: string;
  statut: 'Résolu' | 'En cours' | 'En attente';};

@Component({
  selector: 'ubax-dashboard-sav-page',
  standalone: true,
  imports: [LazyChartComponent, DateRangePickerComponent, DatePipe],
  templateUrl: './dashboard-sav-page.component.html',
  styleUrl: './dashboard-sav-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardSavPageComponent {
  readonly authStore = inject(AuthStore);

  // ── View state ─────────────────────────────────────────────────────────
  readonly view = signal<'main' | 'techs' | 'techDetail'>('main');
  readonly selectedTech = signal<Technician | null>(null);
  private prevView: 'main' | 'techs' = 'main';

  showTechList(): void {
    this.prevView = 'main';
    this.view.set('techs');
  }

  showTechDetail(tech: Technician): void {
    this.prevView = this.view() as 'main' | 'techs';
    this.selectedTech.set(tech);
    this.view.set('techDetail');
  }

  goBack(): void {
    this.selectedTech.set(null);
    this.view.set(this.prevView);
  }

  // ── Date range picker ──────────────────────────────────────────────────
  readonly datePickerOpen = signal(false);
  readonly selectedRange = signal<DateRange | null>(null);
  onDateRangeApplied(range: DateRange): void {
    this.selectedRange.set(range);
  }

  // ── Add technician modal ───────────────────────────────────────────────
  readonly addTechOpen = signal(false);
  readonly addTechClosing = signal(false);
  readonly newPrenom = signal('');
  readonly newNom = signal('');
  readonly newPhone = signal('');
  readonly newSpecialty = signal('Plomberie & sanitaires');
  readonly newPayment = signal('Espèces');

  openAddTech(): void {
    this.addTechOpen.set(true);
  }

  closeAddTech(): void {
    this.addTechClosing.set(true);
    setTimeout(() => {
      this.addTechOpen.set(false);
      this.addTechClosing.set(false);
    }, 220);
  }

  saveTech(): void {
    this.closeAddTech();
  }

  stopPropagation(e: MouseEvent): void {
    e.stopPropagation();
  }

  readonly specialties = [
    'Plomberie & sanitaires',
    'Électricité bâtiment',
    'Maintenance générale',
    'Peinture',
    'Menuiserie',
    'Climatisation',
  ];
  readonly paymentMethods = ['Espèces', 'Virement', 'Mobile Money', 'Chèque'];

  // ── KPI cards ──────────────────────────────────────────────────────────
  readonly kpiCards = [
    {
      label: 'Tickets ouverts',
      value: 22,
      icon: 'pi-ticket',
      color: '#2388ff',
      bg: '#ecf2f7',
    },
    {
      label: "En cours d'intervention",
      value: 5,
      icon: 'pi-wrench',
      color: '#e87d1e',
      bg: '#fff5ec',
    },
    {
      label: 'Tickets résolus',
      value: 15,
      icon: 'pi-check-circle',
      color: '#16b55b',
      bg: '#edfaf3',
    },
    {
      label: 'Tickets Urgents',
      value: 2,
      icon: 'pi-exclamation-circle',
      color: '#ff383c',
      bg: '#fff0f0',
    },
  ];

  // ── Filter bar ─────────────────────────────────────────────────────────
  readonly filterStatut = signal('');
  readonly filterPriorite = signal('');
  readonly filterType = signal('');

  // ── Tickets ────────────────────────────────────────────────────────────
  readonly tickets: Ticket[] = [
    {
      id: 'UBX-TK-0012',
      client: 'Konan Olivier',
      initials: 'KO',
      bien: 'Résidence Plateau - App 12',
      probleme: "Fuite d'eau",
      priorite: 'Urgent',
      date: '05/03/2026',
      statut: 'Résolu',
    },
    {
      id: 'UBX-TK-0013',
      client: 'Awa Bakayoko',
      initials: 'AB',
      bien: 'Résidence Plateau - App 12',
      probleme: 'Problème électrique',
      priorite: 'Urgent',
      date: '05/03/2026',
      statut: 'Résolu',
    },
    {
      id: 'UBX-TK-0014',
      client: 'Moussa Traoré',
      initials: 'MT',
      bien: 'Résidence Plateau - App 12',
      probleme: "Fuite d'eau",
      priorite: 'Normal',
      date: '05/03/2026',
      statut: 'En cours',
    },
    {
      id: 'UBX-TK-0015',
      client: 'Mariam Coulibaly',
      initials: 'MC',
      bien: 'Résidence Plateau - App 12',
      probleme: 'Porte cassée',
      priorite: 'Urgent',
      date: '05/03/2026',
      statut: 'Résolu',
    },
  ];

  // ── Notifications ──────────────────────────────────────────────────────
  readonly notifications = [
    {
      type: "Fuite d'eau",
      icon: 'pi-tint',
      color: '#2388ff',
      property: 'Résidence Plateau - App 12',
      ticketId: 'UBX-TK-0012',
      timeAgo: 'Il y a 5 minutes',
    },
    {
      type: 'Porte cassée',
      icon: 'pi-box',
      color: '#2388ff',
      property: 'Villa Riviera',
      ticketId: 'UBX-TK-0052',
      timeAgo: 'Il y a 12 minutes',
    },
    {
      type: 'Problème électrique',
      icon: 'pi-bolt',
      color: '#16b55b',
      property: 'Immeuble kalia',
      ticketId: 'UBX-TK-0015',
      timeAgo: 'Il y a 15 minutes',
    },
    {
      type: "Fuite d'eau",
      icon: 'pi-tint',
      color: '#2388ff',
      property: 'Résidence Plateau - App 22',
      ticketId: 'UBX-TK-0172',
      timeAgo: 'Il y a 17 minutes',
    },
    {
      type: 'Problème électrique',
      icon: 'pi-bolt',
      color: '#16b55b',
      property: 'Immeuble kalia',
      ticketId: 'UBX-TK-0015',
      timeAgo: 'Il y a 25 minutes',
    },
  ];

  // ── Interventions donut chart ──────────────────────────────────────────
  readonly interventionsData = {
    labels: ['En attente', 'En cours', 'Terminés'],
    datasets: [
      {
        data: [12, 21, 15],
        backgroundColor: ['#2388ff', '#e87d1e', '#16b55b'],
        borderWidth: 3,
        borderColor: '#fff',
      },
    ],
  };

  readonly interventionsOptions = {
    circumference: 180,
    rotation: -90,
    cutout: '65%',
    plugins: { legend: { display: false } },
    responsive: true,
    maintainAspectRatio: false,
  };

  readonly interventionsLegend = [
    { color: '#2388ff', label: 'En attente', count: 12 },
    { color: '#e87d1e', label: 'En cours', count: 21 },
    { color: '#16b55b', label: 'Terminés', count: 15 },
  ];

  // ── Technicians ────────────────────────────────────────────────────────
  readonly technicians: Technician[] = [
    {
      id: 'UBX-TECH-001',
      name: 'Mamadou Diallo',
      initials: 'MD',
      specialty: 'Électricité bâtiment',
      rating: 4.5,
      tickets: 2,
      phone: '+225 07 58 42 19 63',
      color: '#2388ff',
    },
    {
      id: 'UBX-TECH-002',
      name: 'Serge Kouamé',
      initials: 'SK',
      specialty: 'Plomberie & sanitaires',
      rating: 4.5,
      tickets: 3,
      phone: '+225 07 58 42 19 63',
      color: '#e87d1e',
    },
    {
      id: 'UBX-TECH-003',
      name: 'Alain Yao',
      initials: 'AY',
      specialty: 'Maintenance générale',
      rating: 4.0,
      tickets: 1,
      phone: '+225 07 58 42 19 63',
      color: '#16b55b',
    },
    {
      id: 'UBX-TECH-004',
      name: "Patrick N'Guessan",
      initials: 'PN',
      specialty: 'Peinture',
      rating: 4.5,
      tickets: 2,
      phone: '+225 07 58 42 19 63',
      color: '#f59e0b',
    },
    {
      id: 'UBX-TECH-005',
      name: 'Moussa Ba',
      initials: 'MB',
      specialty: 'Électricité bâtiment',
      rating: 4.5,
      tickets: 1,
      phone: '+225 07 58 42 19 63',
      color: '#8b5cf6',
    },
    {
      id: 'UBX-TECH-006',
      name: 'Kofi Mensah',
      initials: 'KM',
      specialty: 'Plomberie & sanitaires',
      rating: 4.0,
      tickets: 4,
      phone: '+225 07 58 42 19 63',
      color: '#e87d1e',
    },
    {
      id: 'UBX-TECH-007',
      name: 'Adjoua Traoré',
      initials: 'AT',
      specialty: 'Menuiserie',
      rating: 4.5,
      tickets: 2,
      phone: '+225 07 58 42 19 63',
      color: '#16b55b',
    },
    {
      id: 'UBX-TECH-008',
      name: 'Boubacar Diallo',
      initials: 'BD',
      specialty: 'Climatisation',
      rating: 4.0,
      tickets: 3,
      phone: '+225 07 58 42 19 63',
      color: '#2388ff',
    },
  ];

  readonly dashboardTechs = this.technicians.slice(0, 6);

  // ── Tech detail interventions ──────────────────────────────────────────
  readonly techInterventions: Ticket[] = [
    {
      id: 'UBX-TK-0012',
      client: 'Koffi Didier',
      initials: 'KD',
      bien: 'Résidence Plateau - App 12 / Abidjan, Riviera',
      probleme: 'Problème électrique',
      priorite: 'Urgent',
      date: '05/03/2026',
      statut: 'Résolu',
    },
    {
      id: 'UBX-TK-0030',
      client: 'Kouamé Patrick',
      initials: 'KP',
      bien: 'Résidence Plateau - App 13 / Abidjan, Riviera',
      probleme: 'Problème électrique',
      priorite: 'Urgent',
      date: '08/03/2026',
      statut: 'Résolu',
    },
    {
      id: 'UBX-TK-0014',
      client: 'Konan Olivier',
      initials: 'KO',
      bien: 'Villa Riviera / Abidjan, Riviera',
      probleme: "Fuite d'eau",
      priorite: 'Normal',
      date: '10/03/2026',
      statut: 'Résolu',
    },
    {
      id: 'UBX-TK-0028',
      client: 'Awa Bakayoko',
      initials: 'AB',
      bien: 'Immeuble Kalia / Abidjan, Cocody',
      probleme: 'Panne électrique',
      priorite: 'Urgent',
      date: '12/03/2026',
      statut: 'Résolu',
    },
    {
      id: 'UBX-TK-0056',
      client: 'Mariam Coulibaly',
      initials: 'MC',
      bien: 'Résidence Plateau - App 22 / Abidjan, Plateau',
      probleme: 'Porte cassée',
      priorite: 'Normal',
      date: '15/03/2026',
      statut: 'Résolu',
    },
    {
      id: 'UBX-TK-0072',
      client: 'Touré Mamadou',
      initials: 'TM',
      bien: 'Maison Yopougon / Abidjan, Yopougon',
      probleme: 'Problème électrique',
      priorite: 'Urgent',
      date: '18/03/2026',
      statut: 'Résolu',
    },
    {
      id: 'UBX-TK-0082',
      client: 'Bamba Seydou',
      initials: 'BS',
      bien: 'Appt. Deux Plateaux / Abidjan, 2 Plx',
      probleme: 'Maintenance',
      priorite: 'Normal',
      date: '20/03/2026',
      statut: 'Résolu',
    },
    {
      id: 'UBX-TK-0091',
      client: "N'Goran Eric",
      initials: 'NE',
      bien: 'Duplex Cocody / Abidjan, Cocody',
      probleme: "Fuite d'eau",
      priorite: 'Urgent',
      date: '22/03/2026',
      statut: 'Résolu',
    },
    {
      id: 'UBX-TK-0097',
      client: 'Koffi Didier',
      initials: 'KD',
      bien: 'Résidence Plateau - App 12 / Abidjan, Riviera',
      probleme: 'Problème électrique',
      priorite: 'Normal',
      date: '25/03/2026',
      statut: 'Résolu',
    },
  ];

  // ── Helpers ────────────────────────────────────────────────────────────
  stars(rating: number): Array<'full' | 'half' | 'empty'> {
    return Array.from({ length: 5 }, (_, i) => {
      if (i + 1 <= Math.floor(rating)) return 'full';
      if (i < rating) return 'half';
      return 'empty';
    });
  }
}

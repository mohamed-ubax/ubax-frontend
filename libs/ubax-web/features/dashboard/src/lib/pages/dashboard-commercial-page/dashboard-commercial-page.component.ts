import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ChartModule } from 'primeng/chart';
import { AuthStore } from '@ubax-workspace/ubax-web-data-access';
import { DateRange, DateRangePickerComponent } from '@ubax-workspace/shared-ui';

interface CalEvent {
  label: string;
  status: 'confirmed' | 'upcoming' | 'cancelled';
  startSlot: number; // index in TIME_SLOTS
  span: number;      // how many slots tall
  dayIndex: number;  // 0–6
}

export const TIME_SLOTS = [
  '08:00','09:00','10:00','11:00','12:00',
  '13:00','14:00','15:00','16:00','17:00','18:00',
];

@Component({
  selector: 'ubax-dashboard-commercial-page',
  standalone: true,
  imports: [ChartModule, DateRangePickerComponent, DatePipe],
  templateUrl: './dashboard-commercial-page.component.html',
  styleUrl: './dashboard-commercial-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardCommercialPageComponent {
  readonly authStore = inject(AuthStore);

  // ── Date range picker ─────────────────────────────────────────────────
  readonly datePickerOpen = signal(false);
  readonly selectedRange  = signal<DateRange | null>(null);

  onDateRangeApplied(range: DateRange): void {
    this.selectedRange.set(range);
  }

  // ── KPI cards ─────────────────────────────────────────────────────────
  readonly kpiCards = [
    { label: 'Tous les biens',     value: 120, icon: 'pi-home',          color: '#1a3047', bg: '#ecf2f7' },
    { label: 'Nouveaux prospects', value: 15,  icon: 'pi-users',         color: '#2388ff', bg: '#ecf2f7' },
    { label: 'Rendez-vous',        value: 15,  icon: 'pi-calendar',      color: '#e87d1e', bg: '#ecf2f7' },
    { label: 'Dossiers conclus',   value: 8,   icon: 'pi-check-circle',  color: '#16b55b', bg: '#ecf2f7' },
  ];

  // ── Calendar ──────────────────────────────────────────────────────────
  readonly timeSlots = TIME_SLOTS;

  readonly weekDays = [
    { label: 'Lundi',    date: '07' },
    { label: 'Mardi',    date: '08' },
    { label: 'Mercredi', date: '09' },
    { label: 'Jeudi',    date: '10' },
    { label: 'Vendredi', date: '11' },
    { label: 'Samedi',   date: '12' },
    { label: 'Dimanche', date: '13' },
  ];

  readonly calEvents: CalEvent[] = [
    { label: 'Visite appartement Cocody',   status: 'confirmed',  dayIndex: 0, startSlot: 1, span: 2 },
    { label: 'Rendez-vous client Plateau',   status: 'upcoming',   dayIndex: 1, startSlot: 3, span: 1 },
    { label: 'Signature bail Riviera',       status: 'confirmed',  dayIndex: 2, startSlot: 0, span: 2 },
    { label: 'Appel Koffi Didier',           status: 'cancelled',  dayIndex: 2, startSlot: 4, span: 1 },
    { label: 'Visite villa Angré',           status: 'upcoming',   dayIndex: 3, startSlot: 2, span: 2 },
    { label: 'Remise clés Yopougon',         status: 'confirmed',  dayIndex: 4, startSlot: 1, span: 1 },
    { label: 'Prospection Marcory',          status: 'upcoming',   dayIndex: 5, startSlot: 3, span: 1 },
  ];

  getEventsForSlot(dayIndex: number, slotIndex: number): CalEvent[] {
    return this.calEvents.filter(e => e.dayIndex === dayIndex && e.startSlot === slotIndex);
  }

  // ── Prospects bar chart ───────────────────────────────────────────────
  readonly prospectsData = {
    labels: ['LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM', 'DIM'],
    datasets: [
      {
        data: [4, 7, 3, 9, 12, 5, 2],
        backgroundColor: ['#1a3047','#1a3047','#1a3047','#1a3047','#e87d1e','#1a3047','#1a3047'],
        borderRadius: 8,
        borderSkipped: false,
        barPercentage: 0.55,
        categoryPercentage: 0.8,
      },
    ],
  };

  readonly prospectsOptions = {
    plugins: { legend: { display: false } },
    scales: {
      x: {
        grid: { display: false },
        border: { display: false },
        ticks: { font: { family: 'Lexend', size: 11 }, color: '#615e83', maxRotation: 0 },
      },
      y: {
        grid: { color: '#f0f0f0' },
        border: { display: false },
        ticks: { font: { family: 'Lexend', size: 11 }, color: '#615e83', stepSize: 3 },
      },
    },
    responsive: true,
    maintainAspectRatio: false,
  };

  // ── Etat des biens ────────────────────────────────────────────────────
  readonly bienStats = [
    { label: 'Disponibles',    count: 20, color: '#2388ff', percent: 44 },
    { label: 'Loués',          count: 60, color: '#16b55b', percent: 50 },
    { label: 'En vente',       count: 25, color: '#e87d1e', percent: 56 },
    { label: 'En maintenance', count: 15, color: '#ff383c', percent: 33 },
  ];

  // ── Explorer les biens ────────────────────────────────────────────────
  readonly properties = [
    {
      image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=500&q=80',
      badge: 'Location',
      title: 'Villa Riviera',
      location: 'Abidjan, Riviera',
      price: '600 000 FCFA/mois',
    },
    {
      image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=500&q=80',
      badge: 'Location',
      title: 'Immeuble Kalia',
      location: 'Abidjan, Cocody',
      price: '450 000 FCFA/mois',
    },
    {
      image: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=500&q=80',
      badge: 'Location',
      title: 'Villa Angré',
      location: 'Abidjan, Angré',
      price: '800 000 FCFA/mois',
    },
  ];
}

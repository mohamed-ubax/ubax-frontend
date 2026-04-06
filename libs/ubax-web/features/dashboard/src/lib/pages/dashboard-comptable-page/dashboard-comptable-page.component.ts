import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ChartModule } from 'primeng/chart';
import { AuthStore } from '@ubax-workspace/ubax-web-data-access';
import { DateRange, DateRangePickerComponent } from '@ubax-workspace/shared-ui';

@Component({
  selector: 'ubax-dashboard-comptable-page',
  standalone: true,
  imports: [ChartModule, DateRangePickerComponent, DatePipe],
  templateUrl: './dashboard-comptable-page.component.html',
  styleUrl: './dashboard-comptable-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComptablePageComponent {
  readonly authStore = inject(AuthStore);

  // ── Date range picker ─────────────────────────────────────────────────
  readonly datePickerOpen  = signal(false);
  readonly selectedRange   = signal<DateRange | null>(null);

  onDateRangeApplied(range: DateRange): void { this.selectedRange.set(range); }

  // ── Balance visibility ────────────────────────────────────────────────
  readonly balanceVisible = signal(true);
  toggleBalance(): void { this.balanceVisible.update(v => !v); }

  // ── Add expense modal ─────────────────────────────────────────────────
  readonly addExpenseOpen    = signal(false);
  readonly addExpenseClosing = signal(false);

  // form fields
  readonly expenseCategory      = signal('Réparation');
  readonly expenseAmount        = signal('');
  readonly expenseMethod        = signal('Espèces');
  readonly expenseDate          = signal('');
  readonly expenseLiaison       = signal<'bien' | 'general'>('bien');
  readonly expenseBien          = signal('');
  readonly expenseOwner         = signal('');
  readonly expenseProvider      = signal('');
  readonly expenseRef           = signal('');
  readonly expenseFile          = signal<{ name: string; size: string } | null>(null);

  openAddExpense(): void { this.addExpenseOpen.set(true); }

  closeAddExpense(): void {
    this.addExpenseClosing.set(true);
    setTimeout(() => {
      this.addExpenseOpen.set(false);
      this.addExpenseClosing.set(false);
    }, 220);
  }

  saveExpense(): void { this.closeAddExpense(); }

  stopPropagation(e: MouseEvent): void { e.stopPropagation(); }

  simulateFileUpload(): void {
    this.expenseFile.set({ name: 'Facture.pdf', size: '169 KB' });
  }

  removeFile(): void { this.expenseFile.set(null); }

  // ── KPI cards ─────────────────────────────────────────────────────────
  readonly kpiCards = [
    { label: 'Revenus du Mois',       value: '15 750 000 FCFA', icon: 'pi-wallet',        color: '#16b55b', bg: '#ecf2f7' },
    { label: 'Loyers encaissés',      value: '8 750 000 FCFA',  icon: 'pi-money-bill',    color: '#e87d1e', bg: '#ecf2f7' },
    { label: 'Paiements en attente',  value: '6 000 000 FCFA',  icon: 'pi-clock',         color: '#2388ff', bg: '#ecf2f7' },
    { label: 'Commission Agence',     value: '1 750 000 FCFA',  icon: 'pi-percentage',    color: '#f59e0b', bg: '#ecf2f7' },
  ];

  // ── Revenue line chart ────────────────────────────────────────────────
  readonly revenueChartPeriod = signal<'Jour' | 'Mois' | 'Année'>('Année');

  readonly revenueData = {
    labels: ['JAN','FÉV','MAR','AVR','MAI','JUI','JUI','AOU','SEP','OCT','NOV','DÉC'],
    datasets: [{
      data: [1200000,1800000,2100000,1600000,2800000,2200000,3500000,2900000,2400000,3100000,2700000,3800000],
      borderColor: '#e87d1e',
      backgroundColor: 'rgba(232, 125, 30, 0.12)',
      fill: true,
      tension: 0.4,
      pointRadius: 4,
      pointBackgroundColor: '#e87d1e',
      pointBorderColor: '#fff',
      pointBorderWidth: 2,
    }],
  };

  readonly revenueOptions = {
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
        ticks: {
          font: { family: 'Lexend', size: 11 }, color: '#615e83',
          callback: (v: number) => v >= 1_000_000 ? v / 1_000_000 + 'M' : v >= 1_000 ? v / 1_000 + 'k' : v,
        },
      },
    },
    responsive: true,
    maintainAspectRatio: false,
  };

  // ── Revenue distribution half-donut ──────────────────────────────────
  readonly distChartPeriod = signal<'Jour' | 'Mois' | 'Année'>('Année');

  readonly distData = {
    labels: ['Courte durée', 'Location', 'Vente'],
    datasets: [{
      data: [15, 65, 25],
      backgroundColor: ['#2388ff', '#16b55b', '#e87d1e'],
      borderWidth: 3,
      borderColor: '#fff',
    }],
  };

  readonly distOptions = {
    circumference: 180,
    rotation: -90,
    cutout: '62%',
    plugins: { legend: { display: false } },
    responsive: true,
    maintainAspectRatio: false,
  };

  readonly distLegend = [
    { color: '#2388ff', label: 'Courte durée', pct: '15%'  },
    { color: '#16b55b', label: 'Location',     pct: '65%'  },
    { color: '#e87d1e', label: 'Vente',        pct: '25%'  },
  ];

  // ── Transactions ──────────────────────────────────────────────────────
  readonly transactions = [
    { initials: 'KI', name: 'Koné Ibrahim',   label: 'Réception paiement Location', date: '5 Avr. 2026 · 12:30',  amount: '+ 450 000 FCFA', month: 'Avril 2026' },
    { initials: 'KD', name: 'Koffi Didier',   label: 'Réception paiement Location', date: '2 Avr. 2026 · 17:41',  amount: '+ 600 000 FCFA', month: 'Avril 2026' },
    { initials: 'KP', name: 'Kouamé Patrick', label: 'Réception paiement Location', date: '28 Mars 2026 · 09:15', amount: '+ 250 000 FCFA', month: 'Mars 2026'  },
    { initials: 'KO', name: 'Konan Olivier',  label: 'Réception paiement Location', date: '20 Mars 2026 · 14:22', amount: '+ 600 000 FCFA', month: 'Mars 2026'  },
    { initials: 'BS', name: 'Bamba Seydou',   label: 'Réception paiement Location', date: '15 Mars 2026 · 10:05', amount: '+ 450 000 FCFA', month: 'Mars 2026'  },
    { initials: 'TM', name: 'Touré Mamadou',  label: 'Réception paiement Location', date: '8 Mars 2026 · 16:30',  amount: '+ 600 000 FCFA', month: 'Mars 2026'  },
  ];

  // ── Monthly expenses ──────────────────────────────────────────────────
  readonly monthExpenses = [
    { icon: 'pi-wrench',        label: 'Entretien',  amount: '250 000 FCFA', color: '#2388ff' },
    { icon: 'pi-megaphone',     label: 'Marketing',  amount: '250 000 FCFA', color: '#e87d1e' },
    { icon: 'pi-users',         label: 'Salaires',   amount: '800 000 FCFA', color: '#16b55b' },
    { icon: 'pi-building',      label: 'Locale',     amount: '300 000 FCFA', color: '#f59e0b' },
  ];

  // ── Overdue payments ──────────────────────────────────────────────────
  readonly overduePayments = [
    { name: 'Affoué Sandrine',  property: 'Villa Riviera — Cocody',        daysLate: 12 },
    { name: 'Kouamé Patrick',   property: 'Immeuble Kalia — Plateau',      daysLate: 8  },
    { name: 'Touré Mamadou',    property: 'Maison Yopougon — Yopougon',    daysLate: 5  },
    { name: 'Bamba Seydou',     property: 'Appt. Deux Plateaux — 2 Plx',   daysLate: 18 },
    { name: 'Diomandé Fatou',   property: 'Studio Marcory — Marcory',      daysLate: 3  },
    { name: 'N\'Goran Eric',    property: 'Duplex Cocody — Cocody',         daysLate: 22 },
  ];

  readonly expenseCategories = ['Réparation', 'Entretien', 'Marketing', 'Salaires', 'Locale', 'Autre'];
  readonly paymentMethods    = ['Espèces', 'Virement', 'Chèque', 'Mobile Money'];
}

import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ChartModule } from 'primeng/chart';
import { UbaxPaginatorComponent } from '@ubax-workspace/shared-ui';

@Component({
  selector: 'ubax-historique-depenses-page',
  standalone: true,
  imports: [ChartModule, RouterLink, UbaxPaginatorComponent],
  templateUrl: './historique-depenses-page.component.html',
  styleUrl: './historique-depenses-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HistoriqueDepensesPageComponent {
  activePeriod = 'Année';
  showBalance = true;
  readonly currentPage = signal(3);
  readonly totalPages = 5;

  toggleBalance(): void {
    this.showBalance = !this.showBalance;
  }

  readonly lineData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    datasets: [{
      label: 'Dépenses',
      data: [1500, 2000, 1200, 2800, 1500, 1500, 1600, 1500, 2200, 2000, 3200, 2700],
      borderColor: '#fa191d', backgroundColor: 'transparent',
      tension: 0.4, pointRadius: 4, pointBackgroundColor: '#fa191d', borderWidth: 2,
    }],
  };

  readonly lineOptions = {
    plugins: { legend: { display: false }, tooltip: { mode: 'index', intersect: false } },
    scales: {
      x: { grid: { display: false }, border: { display: false },
           ticks: { font: { family: 'Lexend', size: 13, weight: '300' }, color: '#262626' } },
      y: { grid: { color: '#efefef' }, border: { display: false }, min: 0, max: 5000,
           ticks: { stepSize: 1000, font: { family: 'Lexend', size: 12, weight: '300' }, color: '#262626' } },
    },
    responsive: true, maintainAspectRatio: false,
  };

  readonly miniBarData = {
    labels: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sa', 'Dim'],
    datasets: [{ data: [50, 69, 174, 113, 163, 81, 183], backgroundColor: '#fa191d',
      borderRadius: 23, borderSkipped: false, barPercentage: 0.5, categoryPercentage: 0.7 }],
  };

  readonly miniBarOptions = {
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { display: false }, border: { display: false },
           ticks: { font: { family: 'Lexend', size: 12 }, color: '#222' } },
      y: { grid: { color: '#f0f0f0' }, border: { display: false }, min: 0,
           ticks: { font: { family: 'Lexend', size: 12 }, color: '#222',
                    callback: (v: number) => {
                      if (v === 0) return '0';
                      if (v >= 1000) return v / 1000 + 'M';
                      return String(v);
                    } } },
    },
    responsive: true, maintainAspectRatio: false,
  };

  readonly depenses = [
    { id: 'R-10234', name: 'Fournisseur Électricité', type: 'Charges fixes',       typeBg: '#16b55b', date: '16 Avr 2026', method: 'Visa',         total: '-245 000 FCFA', statut: 'Réussi' },
    { id: 'R-10234', name: 'Achat Fournitures',        type: 'Consommables',        typeBg: '#ff462d', date: '16 Avr 2026', method: 'Visa',         total: '-245 000 FCFA', statut: 'Réussi' },
    { id: 'R-10234', name: 'Salaires Personnel',       type: 'Ressources humaines', typeBg: '#008bff', date: '16 Avr 2026', method: 'Visa',         total: '-245 000 FCFA', statut: 'Réussi' },
    { id: 'R-10234', name: 'Entretien & Réparations',  type: 'Maintenance',         typeBg: '#ffae00', date: '16 Avr 2026', method: 'Visa',         total: '-245 000 FCFA', statut: 'Réussi' },
    { id: 'R-10234', name: 'Abonnement Internet',      type: 'Charges fixes',       typeBg: '#16b55b', date: '16 Avr 2026', method: 'Visa',         total: '-245 000 FCFA', statut: 'Réussi' },
  ];
}

import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ChartModule } from 'primeng/chart';
import { UiPaginationComponent } from '@ubax-workspace/shared-ui';

@Component({
  selector: 'ubax-historique-recettes-page',
  standalone: true,
  imports: [ChartModule, RouterLink, UiPaginationComponent],
  templateUrl: './historique-recettes-page.component.html',
  styleUrl: './historique-recettes-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HistoriqueRecettesPageComponent {
  activePeriod = 'Année';
  showBalance = true;
  currentPage = 3;
  readonly totalPages = 5;

  toggleBalance(): void {
    this.showBalance = !this.showBalance;
  }

  onPageChange(page: number): void {
    this.currentPage = page;
  }

  readonly lineData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    datasets: [{
      label: 'Recettes',
      data: [1800, 2100, 1200, 2900, 1600, 1600, 1700, 1800, 2200, 2100, 3100, 2600],
      borderColor: '#16b55b', backgroundColor: 'transparent',
      tension: 0.4, pointRadius: 4, pointBackgroundColor: '#16b55b', borderWidth: 2,
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
    datasets: [{ data: [50, 69, 174, 113, 163, 81, 183], backgroundColor: '#16b55b',
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
                      if (v >= 1000) return v / 1000 + 'k';
                      return String(v);
                    } } },
    },
    responsive: true, maintainAspectRatio: false,
  };

  readonly recettes = [
    { id: 'R-10234', avatar: 'https://www.figma.com/api/mcp/asset/7b209b0b-d8e2-4cba-9919-60025ec0dde7', name: 'Aïcha Kouadio', type: 'Réservation Suite', date: '16 Avr 2026', method: 'Visa', total: '+850 000 FCFA', statut: 'Réussi' },
    { id: 'R-10235', avatar: 'https://www.figma.com/api/mcp/asset/fba413de-1718-42a6-a0fe-3a3cdda9c42d', name: 'Aïcha Kouadio', type: 'Réservation Standard', date: '16 Avr 2026', method: 'Wave', total: '+850 000 FCFA', statut: 'Réussi' },
    { id: 'R-10236', avatar: 'https://www.figma.com/api/mcp/asset/04f750ee-8ec3-4a1d-bbae-19aa0e26d5fc', name: 'Aïcha Kouadio', type: 'Réservation Deluxe', date: '16 Avr 2026', method: 'Espèces', total: '+850 000 FCFA', statut: 'Réussi' },
    { id: 'R-10237', avatar: 'https://www.figma.com/api/mcp/asset/78de620e-3a7c-4390-8a41-18b9f53a5394', name: 'Aïcha Kouadio', type: 'Réservation Suite', date: '16 Avr 2026', method: 'Orange money', total: '+850 000 FCFA', statut: 'Réussi' },
    { id: 'R-10238', avatar: 'https://www.figma.com/api/mcp/asset/771fbaef-bbc8-4bb4-9318-69a37becbfb9', name: 'Aïcha Kouadio', type: 'Réservation Deluxe', date: '16 Avr 2026', method: 'Visa', total: '+850 000 FCFA', statut: 'Réussi' },
  ];
}

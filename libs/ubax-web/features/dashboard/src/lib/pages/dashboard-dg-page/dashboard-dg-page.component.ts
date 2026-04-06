import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ChartModule } from 'primeng/chart';
import { AuthStore } from '@ubax-workspace/ubax-web-data-access';

@Component({
  selector: 'ubax-dashboard-dg-page',
  standalone: true,
  imports: [RouterLink, ChartModule],
  templateUrl: './dashboard-dg-page.component.html',
  styleUrl: './dashboard-dg-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardDgPageComponent {
  readonly authStore = inject(AuthStore);

  readonly donutData = {
    labels: ['Occupés', 'Disponibles', 'Réservés', 'En maintenance'],
    datasets: [
      {
        data: [9, 6, 12, 2],
        backgroundColor: ['#16b55b', '#2388ff', '#e87d1e', '#ff383c'],
        borderWidth: 3,
        borderColor: '#fff',
        hoverBorderWidth: 3,
      },
    ],
  };

  readonly donutOptions = {
    cutout: '68%',
    plugins: { legend: { display: false } },
    responsive: true,
    maintainAspectRatio: false,
  };

  readonly revenueData = {
    labels: ['JAN', 'FÉV', 'MAR', 'AVR', 'MAI', 'JUI', 'JUI', 'AOU', 'SEP', 'OCT', 'NOV', 'DÉC'],
    datasets: [
      {
        data: [3200000, 2800000, 4100000, 3500000, 3900000, 1850000, 4200000, 3800000, 2900000, 4500000, 3200000, 4800000],
        backgroundColor: [
          '#ff8d28', '#ff8d28', '#ff8d28', '#ff8d28', '#ff8d28',
          '#1a3047',
          '#ff8d28', '#ff8d28', '#ff8d28', '#ff8d28', '#ff8d28', '#ff8d28',
        ],
        borderRadius: 8,
        borderSkipped: false,
        barPercentage: 0.55,
        categoryPercentage: 0.8,
      },
    ],
  };

  readonly revenueOptions = {
    plugins: { legend: { display: false } },
    scales: {
      x: {
        grid: { display: false },
        border: { display: false },
        ticks: { font: { family: 'Inter', size: 11 }, color: '#615e83', maxRotation: 0 },
      },
      y: {
        grid: { color: '#f0f0f0' },
        border: { display: false },
        ticks: {
          font: { family: 'Inter', size: 11 },
          color: '#615e83',
          callback: (v: number) => {
            if (v >= 1_000_000) return v / 1_000_000 + 'M';
            if (v >= 1_000) return v / 1_000 + 'k';
            return v;
          },
        },
      },
    },
    responsive: true,
    maintainAspectRatio: false,
  };

  readonly kpiCards = [
    { label: 'Tous les biens',    value: 45, change: '+2%',  icon: 'pi-home',          color: '#1a3047', bg: '#ecf2f7' },
    { label: 'Annonces actives',  value: 10, change: null,   icon: 'pi-arrow-up-right', color: '#e87d1e', bg: '#ecf2f7' },
    { label: 'Biens Loués',       value: 33, change: null,   icon: 'pi-key',            color: '#2388ff', bg: '#ecf2f7' },
    { label: 'Biens Vendus',      value: 2,  change: null,   icon: 'pi-check-square',   color: '#16b55b', bg: '#ecf2f7' },
  ];

  readonly donutLegend = [
    { color: '#16b55b', label: 'Occupés',        count: 9  },
    { color: '#2388ff', label: 'Disponibles',    count: 6  },
    { color: '#e87d1e', label: 'Réservés',       count: 12 },
    { color: '#ff383c', label: 'En maintenance', count: 2  },
  ];

  readonly properties = [
    { id: 'UBX-001', nom: 'Immeuble Kalia',     type: 'Appartement', localisation: 'Abidjan, Cocody',  prix: '450 000 FCFA/mois', locataire: 'Koné Ibrahim',    statut: 'Actif' },
    { id: 'UBX-002', nom: 'Villa Riviera',       type: 'Villa',       localisation: 'Abidjan, Riviera', prix: '600 000 FCFA/mois', locataire: 'Koffi Didier',    statut: 'Actif' },
    { id: 'UBX-003', nom: 'Villa Riviera',       type: 'Villa',       localisation: 'Abidjan, Riviera', prix: '600 000 FCFA/mois', locataire: 'Kouamé Patrick',  statut: 'Actif' },
    { id: 'UBX-004', nom: 'Résidence Plateau',   type: 'Appartement', localisation: 'Abidjan, Plateau', prix: '250 000 FCFA/mois', locataire: 'Konan Olivier',   statut: 'Actif' },
    { id: 'UBX-005', nom: 'Villa Riviera',       type: 'Villa',       localisation: 'Abidjan, Riviera', prix: '600 000 FCFA/mois', locataire: 'Konan Olivier',   statut: 'Actif' },
  ];

  readonly transactions = [
    { label: 'Réception paiement Location', date: '5 Avril 2026 à 12 : 30',  month: 'Avril 2026', amount: '+ 450 000 FCFA', initials: 'KI', name: 'Koné Ibrahim'    },
    { label: 'Réception paiement Location', date: '2 Avril 2026 à 17 : 41',  month: 'Avril 2026', amount: '+ 600 000 FCFA', initials: 'KD', name: 'Koffi Didier'    },
    { label: 'Réception paiement Location', date: '28 Mars 2026 à 09 : 15',  month: 'Mars 2026',  amount: '+ 250 000 FCFA', initials: 'KP', name: 'Kouamé Patrick'  },
    { label: 'Réception paiement Location', date: '20 Mars 2026 à 14 : 22',  month: 'Mars 2026',  amount: '+ 600 000 FCFA', initials: 'KO', name: 'Konan Olivier'   },
    { label: 'Réception paiement Location', date: '15 Mars 2026 à 10 : 05',  month: 'Mars 2026',  amount: '+ 450 000 FCFA', initials: 'KI', name: 'Koné Ibrahim'    },
    { label: 'Réception paiement Location', date: '8 Mars 2026 à 16 : 30',   month: 'Mars 2026',  amount: '+ 600 000 FCFA', initials: 'KD', name: 'Koffi Didier'    },
  ];
}

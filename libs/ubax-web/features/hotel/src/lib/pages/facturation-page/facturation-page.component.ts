import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ChartModule } from 'primeng/chart';

@Component({
  selector: 'ubax-facturation-page',
  standalone: true,
  imports: [ChartModule, RouterLink],
  templateUrl: './facturation-page.component.html',
  styleUrl: './facturation-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FacturationPageComponent {
  activePeriod = 'Année';
  showBalance = true;

  toggleBalance(): void {
    this.showBalance = !this.showBalance;
  }

  // ── KPI mini-charts ──────────────────────────────────────────────
  readonly kpiChartOptions = {
    cutout: '72%',
    plugins: { legend: { display: false }, tooltip: { enabled: false } },
    responsive: false,
    maintainAspectRatio: false,
    animation: false,
  };

  readonly kpiRevenusChartData = {
    datasets: [
      {
        data: [78, 22],
        backgroundColor: ['#16b55b', '#e8f8f0'],
        borderWidth: 0,
        hoverOffset: 0,
      },
    ],
  };

  readonly kpiReservChartData = {
    datasets: [
      {
        data: [65, 35],
        backgroundColor: ['#008BFF', '#e8f8f0'],
        borderWidth: 0,
        hoverOffset: 0,
      },
    ],
  };

  readonly kpiDepensesChartData = {
    datasets: [
      {
        data: [45, 55],
        backgroundColor: ['#e87d1e', '#fef3ea'],
        borderWidth: 0,
        hoverOffset: 0,
      },
    ],
  };

  // ── Stats line chart ─────────────────────────────────────────────
  readonly statsData = {
    labels: [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ],
    datasets: [
      {
        label: 'Revenus',
        data: [
          3200, 2000, 2200, 4600, 2600, 2600, 2500, 2300, 2300, 3800, 4700,
          4200,
        ],
        borderColor: '#16b55b',
        backgroundColor: 'transparent',
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: '#16b55b',
        borderWidth: 2,
      },
      {
        label: 'Dépenses',
        data: [
          1500, 2000, 1200, 2800, 1500, 1500, 1600, 1500, 2200, 2000, 3200,
          2700,
        ],
        borderColor: '#fa191d',
        backgroundColor: 'transparent',
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: '#fa191d',
        borderWidth: 2,
      },
    ],
  };

  readonly statsOptions = {
    plugins: {
      legend: { display: false },
      tooltip: { mode: 'index', intersect: false },
    },
    scales: {
      x: {
        grid: { display: false },
        border: { display: false },
        ticks: {
          font: { family: 'Lexend', size: 13, weight: '300' },
          color: '#262626',
        },
      },
      y: {
        grid: { color: '#efefef' },
        border: { display: false },
        min: 0,
        max: 5000,
        ticks: {
          stepSize: 1000,
          font: { family: 'Lexend', size: 12, weight: '300' },
          color: '#262626',
        },
      },
    },
    responsive: true,
    maintainAspectRatio: false,
  };

  // ── Mini bar chart ───────────────────────────────────────────────
  readonly miniBarData = {
    labels: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sa', 'Dim'],
    datasets: [
      {
        data: [42, 58, 146, 95, 138, 68, 154],
        backgroundColor: '#16b55b',
        borderRadius: 23,
        borderSkipped: false,
        barPercentage: 0.5,
        categoryPercentage: 0.7,
      },
    ],
  };

  readonly miniBarOptions = {
    plugins: { legend: { display: false } },
    scales: {
      x: {
        grid: { display: false },
        border: { display: false },
        ticks: { font: { family: 'Lexend', size: 12 }, color: '#222' },
      },
      y: {
        grid: { color: '#f0f0f0' },
        border: { display: false },
        min: 0,
        ticks: {
          font: { family: 'Lexend', size: 12 },
          color: '#222',
          callback: (v: number) => {
            if (v === 0) return '0';
            if (v >= 1000) return v / 1000 + 'k';
            return String(v);
          },
        },
      },
    },
    responsive: true,
    maintainAspectRatio: false,
  };

  // ── Donut chart ──────────────────────────────────────────────────
  readonly donutData = {
    datasets: [
      {
        data: [29.5, 8.5, 62],
        backgroundColor: ['#e87d1e', '#fa191d', '#34c759'],
        borderWidth: 0,
      },
    ],
  };

  readonly donutOptions = {
    cutout: '65%',
    plugins: { legend: { display: false }, tooltip: { enabled: false } },
    responsive: false,
    maintainAspectRatio: false,
    animation: false,
  };

  readonly newReservations = [
    {
      id: 1,
      name: 'Aïcha Kouadio',
      dates: '16 - 19 Avril 2026',
      guests: 2,
      image: 'shared/people/profile-02.webp',
    },
    {
      id: 2,
      name: 'Aïcha Kouadio',
      dates: '18 - 21 Avril 2026',
      guests: 2,
      image: 'shared/people/profile-01.webp',
    },
    {
      id: 3,
      name: 'Aïcha Kouadio',
      dates: '21 - 27 Avril 2026',
      guests: 2,
      image: 'shared/people/billing-guest-03.webp',
    },
    {
      id: 4,
      name: 'Aïcha Kouadio',
      dates: '22 - 25 Avril 2026',
      guests: 2,
      image: 'shared/people/billing-guest-04.webp',
    },
  ];

  readonly transactions = [
    {
      id: '49503',
      name: 'Dianne Russell',
      date: 'Jul 01, 2022',
      method: 'Master Card',
      total: '-$167.50',
      statut: 'success',
    },
    {
      id: '29475',
      name: 'Ralph Edwards',
      date: 'Jul 01, 2022',
      method: 'Visa',
      total: '+$251.43',
      statut: 'failed',
    },
    {
      id: '95884',
      name: 'Wade Warren',
      date: 'Jul 01, 2022',
      method: 'Paypal',
      total: '+$102.78',
      statut: 'success',
    },
    {
      id: '75849',
      name: 'Kathryn Murphy',
      date: 'Jul 01, 2022',
      method: 'Paypal',
      total: '+$12.78',
      statut: 'success',
    },
  ];
}

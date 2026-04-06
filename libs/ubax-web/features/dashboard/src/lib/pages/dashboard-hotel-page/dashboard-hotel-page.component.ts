import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ChartModule } from 'primeng/chart';
import { DatePickerModule } from 'primeng/datepicker';

@Component({
  selector: 'ubax-dashboard-hotel-page',
  standalone: true,
  imports: [ChartModule, DatePickerModule, FormsModule],
  templateUrl: './dashboard-hotel-page.component.html',
  styleUrl: './dashboard-hotel-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardHotelPageComponent {

  // ── KPI values ────────────────────────────────────────────────────────
  readonly occupancyRate = 82;
  readonly arriveeCount  = 8;
  readonly departCount   = 3;
  readonly revenusJour   = '750 000 FCFA';

  // ── Calendar ──────────────────────────────────────────────────────────
  calendarDate = new Date();

  // ── Taux d'occupation donut ───────────────────────────────────────────
  readonly occupancyDonutData = {
    datasets: [{
      data: [82, 18],
      backgroundColor: ['#16b55b', '#e5e7eb'],
      borderWidth: 0,
      hoverBorderWidth: 0,
    }],
  };

  readonly occupancyDonutOptions = {
    cutout: '72%',
    plugins: { legend: { display: false }, tooltip: { enabled: false } },
    responsive: false,
    maintainAspectRatio: false,
    animation: false,
  };

  // ── Revenue bar chart ─────────────────────────────────────────────────
  readonly revenueData = {
    labels: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'],
    datasets: [{
      data: [1100, 1430, 620, 1600, 2030, 900, 810],
      backgroundColor: '#1a3047',
      borderRadius: 8,
      borderSkipped: false,
      barPercentage: 0.55,
      categoryPercentage: 0.75,
    }],
  };

  readonly revenueOptions = {
    plugins: { legend: { display: false } },
    scales: {
      x: {
        grid: { display: false },
        border: { display: false },
        ticks: { font: { family: 'Lexend', size: 11 }, color: '#aaa', maxRotation: 0 },
      },
      y: {
        grid: { color: '#f0f2f6' },
        border: { display: false },
        min: 0,
        max: 3000,
        ticks: {
          stepSize: 1000,
          font: { family: 'Lexend', size: 11 },
          color: '#aaa',
          callback: (v: number) => {
            if (v === 0) return '0';
            return v / 1000 + 'k';
          },
        },
      },
    },
    responsive: true,
    maintainAspectRatio: false,
  };

  // ── Reservations line chart ───────────────────────────────────────────
  readonly reservationsCount  = 58;
  readonly reservationsGrowth = '23%';

  readonly months = [
    { label: 'Jan',  active: false },
    { label: 'Fev',  active: false },
    { label: 'mars', active: true  },
    { label: 'Avr',  active: false },
    { label: 'Mai',  active: false },
    { label: 'Juin', active: false },
  ];

  readonly reservationsData = {
    labels: ['Jan', 'Fev', 'mars', 'Avr', 'Mai', 'Juin'],
    datasets: [{
      data: [28, 44, 58, 38, 32, 48],
      borderColor: '#e87d1e',
      backgroundColor: 'rgba(232, 125, 30, 0.12)',
      fill: true,
      tension: 0.45,
      pointRadius: 0,
      pointHoverRadius: 5,
      borderWidth: 2,
    }],
  };

  readonly reservationsOptions = {
    plugins: { legend: { display: false }, tooltip: { mode: 'index', intersect: false } },
    scales: {
      x: { display: false },
      y: { display: false },
    },
    responsive: true,
    maintainAspectRatio: false,
  };

  // ── Notifications ─────────────────────────────────────────────────────
  readonly notifications = [
    {
      id: 1,
      type: 'new',
      icon: 'pi-bell',
      title: 'Nouvelle réservation',
      sub: 'Résidence Plateau - App 12',
      time: 'Il y\'a 5 minutes',
    },
    {
      id: 2,
      type: 'cancel',
      icon: 'pi-times-circle',
      title: 'Réservation Annulée',
      sub: 'Résidence Plateau - App 12',
      time: 'Il y\'a 15 minutes',
    },
    {
      id: 3,
      type: 'confirm',
      icon: 'pi-check-circle',
      title: 'Paiement confirmé',
      sub: 'Résidence Plateau - App 12',
      time: 'Il y\'a 35 minutes',
    },
    {
      id: 4,
      type: 'new',
      icon: 'pi-bell',
      title: 'Nouvelle réservation',
      sub: 'Résidence Plateau - App 12',
      time: 'Il y\'a 5 minutes',
    },
    {
      id: 5,
      type: 'confirm',
      icon: 'pi-check-circle',
      title: 'Paiement confirmé',
      sub: 'Résidence Plateau - App 12',
      time: 'Il y\'a 35 minutes',
    },
  ];

  // ── Reservations table ────────────────────────────────────────────────
  readonly reservations = [
    { id: 1, initials: 'KI', guest: 'Koné Ibrahim',    chambre: 'Résidence Plateau', duree: '2 jours', dates: '14 /04 / 2026 - 18 / 04 2026', statut: 'Confirmé' },
    { id: 2, initials: 'KI', guest: 'Koné Ibrahim',    chambre: 'Résidence Plateau', duree: '2 jours', dates: '14 /04 / 2026 - 18 / 04 2026', statut: 'Confirmé' },
    { id: 3, initials: 'KI', guest: 'Koné Ibrahim',    chambre: 'Résidence Plateau', duree: '2 jours', dates: '14 /04 / 2026 - 18 / 04 2026', statut: 'Confirmé' },
    { id: 4, initials: 'KI', guest: 'Koné Ibrahim',    chambre: 'Résidence Plateau', duree: '2 jours', dates: '14 /04 / 2026 - 18 / 04 2026', statut: 'Confirmé' },
    { id: 5, initials: 'KI', guest: 'Koné Ibrahim',    chambre: 'Résidence Plateau', duree: '2 jours', dates: '14 /04 / 2026 - 18 / 04 2026', statut: 'Confirmé' },
  ];

  // ── Available properties ──────────────────────────────────────────────
  readonly availableProperties = [
    {
      id: 1,
      name: 'Immeuble kalia',
      location: 'Abidjan, Cocody',
      type: 'Location',
      image: 'https://www.figma.com/api/mcp/asset/403c48dc-2834-43b0-a056-06fc1d7df9c4',
      tenantAvatar: 'https://www.figma.com/api/mcp/asset/b794a5ad-dc26-4721-b608-71bffef0e92f',
      tenantName: 'Aïcha Kouadio',
      tenantRole: 'Locataire',
      price: '400 000 FCFA',
    },
    {
      id: 2,
      name: 'Immeuble kalia',
      location: 'Abidjan, Cocody',
      type: 'Location',
      image: 'https://www.figma.com/api/mcp/asset/5347f272-41aa-4973-9971-c0640ceccbb0',
      tenantAvatar: 'https://www.figma.com/api/mcp/asset/e13c9334-8117-45c0-b18b-6dbe39380647',
      tenantName: 'Patrick Koffi',
      tenantRole: 'Locataire',
      price: '350 000 FCFA',
    },
    {
      id: 3,
      name: 'Résidence Plateau',
      location: 'Abidjan, Plateau',
      type: 'Location',
      image: 'https://www.figma.com/api/mcp/asset/403c48dc-2834-43b0-a056-06fc1d7df9c4',
      tenantAvatar: 'https://www.figma.com/api/mcp/asset/b794a5ad-dc26-4721-b608-71bffef0e92f',
      tenantName: 'Koné Ibrahim',
      tenantRole: 'Locataire',
      price: '250 000 FCFA',
    },
    {
      id: 4,
      name: 'Villa Riviera',
      location: 'Abidjan, Riviera',
      type: 'Location',
      image: 'https://www.figma.com/api/mcp/asset/5347f272-41aa-4973-9971-c0640ceccbb0',
      tenantAvatar: 'https://www.figma.com/api/mcp/asset/e13c9334-8117-45c0-b18b-6dbe39380647',
      tenantName: 'Koffi Didier',
      tenantRole: 'Locataire',
      price: '600 000 FCFA',
    },
  ];
}

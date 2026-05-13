import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  ProprietesPublishedListPageComponent,
  type PropertyKpi,
} from './proprietes-published-list-page.component';

const HOTELS_KPIS: PropertyKpi[] = [
  {
    label: 'Total Hôtels',
    value: '—',
    trend: '+ 15 ce mois ci',
    icon: 'pi pi-building',
    iconBg: 'rgba(43, 127, 255, 0.12)',
    iconColor: '#2b7fff',
  },
  {
    label: 'Total chambres',
    value: '—',
    trend: '+ 300 ce mois ci',
    icon: 'pi pi-th-large',
    iconBg: 'rgba(232, 125, 30, 0.12)',
    iconColor: '#e87d1e',
  },
  {
    label: 'Chambres réservées',
    value: '—',
    trend: '+ 80 ce mois ci',
    icon: 'pi pi-calendar-plus',
    iconBg: 'rgba(52, 199, 89, 0.12)',
    iconColor: '#34c759',
  },
  {
    label: 'Chambres disponibles',
    value: '—',
    trend: '+ 45 ce mois ci',
    icon: 'pi pi-check-circle',
    iconBg: 'rgba(43, 127, 255, 0.12)',
    iconColor: '#2b7fff',
  },
  {
    label: "Taux d'occupation",
    value: '75%',
    trend: '+ 10% ce mois ci',
    icon: 'pi pi-chart-bar',
    iconBg: 'rgba(232, 125, 30, 0.12)',
    iconColor: '#e87d1e',
  },
];

@Component({
  selector: 'ubax-admin-proprietes-hotels-page',
  standalone: true,
  imports: [ProprietesPublishedListPageComponent],
  template: `
    <ubax-proprietes-published-list
      pageTitle="Liste propriétés hôtels"
      [kpis]="kpis"
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProprietesHotelsPageComponent {
  readonly kpis = HOTELS_KPIS;
}

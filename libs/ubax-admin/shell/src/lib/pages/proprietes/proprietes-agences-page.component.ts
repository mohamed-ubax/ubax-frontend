import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  ProprietesPublishedListPageComponent,
  type PropertyKpi,
} from './proprietes-published-list-page.component';

const AGENCES_KPIS: PropertyKpi[] = [
  {
    label: 'Total Agences',
    value: '—',
    trend: '+ 12 ce mois ci',
    icon: 'pi pi-building',
    iconBg: 'rgba(43, 127, 255, 0.12)',
    iconColor: '#2b7fff',
  },
  {
    label: 'Total Propriétés',
    value: '—',
    trend: '+ 300 ce mois ci',
    icon: 'pi pi-home',
    iconBg: 'rgba(232, 125, 30, 0.12)',
    iconColor: '#e87d1e',
  },
  {
    label: 'Propriétés à vendre',
    value: '—',
    trend: '+ 80 ce mois ci',
    icon: 'pi pi-tag',
    iconBg: 'rgba(52, 199, 89, 0.12)',
    iconColor: '#34c759',
  },
  {
    label: 'Propriétés à louer',
    value: '—',
    trend: '+ 45 ce mois ci',
    icon: 'pi pi-key',
    iconBg: 'rgba(232, 125, 30, 0.12)',
    iconColor: '#e87d1e',
  },
  {
    label: "Taux d'occupation",
    value: '75%',
    trend: '+ 10% ce mois ci',
    icon: 'pi pi-chart-bar',
    iconBg: 'rgba(43, 127, 255, 0.12)',
    iconColor: '#2b7fff',
  },
];

@Component({
  selector: 'ubax-admin-proprietes-agences-page',
  standalone: true,
  imports: [ProprietesPublishedListPageComponent],
  template: `
    <ubax-proprietes-published-list
      pageTitle="Liste propriétés agence immobilière"
      [kpis]="kpis"
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProprietesAgencesPageComponent {
  readonly kpis = AGENCES_KPIS;
}

import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PageHeaderComponent, DetailLayoutComponent } from '@ubax-workspace/shared-ui';

@Component({
  selector: 'ubax-employe-detail-page',
  standalone: true,
  imports: [PageHeaderComponent, DetailLayoutComponent],
  template: `
    <ubax-page-header title="Détails employé" backLink="/hotel/employes" />
    <ubax-detail-layout>
      <div slot="sidebar"><!-- Profil employé --></div>
      <div slot="main"><!-- Historique interventions --></div>
    </ubax-detail-layout>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmployeDetailPageComponent {}

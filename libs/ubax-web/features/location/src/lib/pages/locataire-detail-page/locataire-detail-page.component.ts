import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PageHeaderComponent, DetailLayoutComponent } from '@ubax-workspace/shared-ui';

@Component({
  selector: 'ubax-locataire-detail-page',
  standalone: true,
  imports: [PageHeaderComponent, DetailLayoutComponent],
  template: `
    <ubax-page-header title="Détails locataire" backLink="/reservations" />
    <ubax-detail-layout>
      <div slot="sidebar"><!-- Profil locataire --></div>
      <div slot="main"><!-- Historique --></div>
    </ubax-detail-layout>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LocataireDetailPageComponent {}

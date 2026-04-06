import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PageHeaderComponent, DetailLayoutComponent } from '@ubax-workspace/shared-ui';

@Component({
  selector: 'ubax-bien-detail-page',
  standalone: true,
  imports: [PageHeaderComponent, DetailLayoutComponent],
  template: `
    <ubax-page-header title="Détails d'un bien" backLink="/biens" />
    <ubax-detail-layout>
      <div slot="sidebar"><!-- Galerie + infos clés --></div>
      <div slot="main"><!-- Contenu détaillé --></div>
    </ubax-detail-layout>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BienDetailPageComponent {}

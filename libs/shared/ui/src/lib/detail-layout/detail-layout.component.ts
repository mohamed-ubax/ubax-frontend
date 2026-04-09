import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'ubax-detail-layout',
  standalone: true,
  imports: [],
  templateUrl: './detail-layout.component.html',
  styleUrl: './detail-layout.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DetailLayoutComponent {
  /** Largeur de la colonne latérale en px (défaut: 320) */
  readonly sidebarWidth = input<number>(320);
}

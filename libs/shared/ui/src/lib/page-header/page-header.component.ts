import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'ubax-page-header',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './page-header.component.html',
  styleUrl: './page-header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PageHeaderComponent {
  /** Titre principal de la page */
  readonly title = input.required<string>();
  /** Lien de retour (affiche la flèche si défini) */
  readonly backLink = input<string | null>(null);
  /** Label du bouton retour */
  readonly backLabel = input<string>('Retour');
}

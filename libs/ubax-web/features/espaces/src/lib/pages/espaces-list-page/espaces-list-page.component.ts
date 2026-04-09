import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  PageHeaderComponent,
  FilterBarComponent,
  FilterSelectConfig,
} from '@ubax-workspace/shared-ui';

@Component({
  selector: 'ubax-espaces-list-page',
  standalone: true,
  imports: [PageHeaderComponent, FilterBarComponent, RouterLink],
  templateUrl: './espaces-list-page.component.html',
  styleUrls: ['./espaces-list-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EspacesListPageComponent {
  readonly activePage = signal(1);
  readonly pages = [1, 2, 3, 4, 5];

  readonly filterSelects: FilterSelectConfig[] = [
    {
      placeholder: "Type d'espace",
      key: 'type',
      options: [
        { label: 'Chambre', value: 'chambre' },
        { label: 'Salle', value: 'salle' },
      ],
    },
    {
      placeholder: 'Statut',
      key: 'statut',
      options: [
        { label: 'Disponible', value: 'disponible' },
        { label: 'Réservé', value: 'reserve' },
        { label: 'Occupé', value: 'occupe' },
      ],
    },
  ];

  readonly spaces = Array.from({ length: 12 }).map((_, i) => ({
    id: i + 1,
    title: `Chambre Queen A-23${i + 45}`,
    owner: 'Aïcha Kouadio',
    location: 'Abidjan, Cocody',
    tag: i % 3 === 2 ? 'Appartement' : 'Chambre',
    price: '65 000 FCFA/nuit',
    status: i % 3 === 0 ? 'Réservé' : 'Disponible',
    rating: 4.1,
  }));
}

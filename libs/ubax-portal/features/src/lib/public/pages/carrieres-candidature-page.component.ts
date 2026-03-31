import {
  ChangeDetectionStrategy,
  Component,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {
  BackToTopComponent,
  PublicShellComponent,
} from '@ubax-workspace/ubax-portal-layout';

interface CandidatureForm {
  nom: string;
  email: string;
  telephone: string;
  metier: string;
  niveauExperience: string;
  lettreMotivation: string;
}

@Component({
  selector: 'ubax-carrieres-candidature-page',
  imports: [PublicShellComponent, BackToTopComponent, RouterLink, FormsModule],
  templateUrl: './carrieres-candidature-page.component.html',
  styleUrl: './carrieres-candidature-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CarrieresCandidaturePage {
  protected readonly successVisible = signal(false);
  protected readonly elementsIcon =
    'assets/portal-assets/careers/icons/Elements.svg';
  protected readonly cvIcon =
    'assets/portal-assets/careers/icons/Ellipse 1.svg';

  protected readonly niveauxExperience = [
    'Débutant',
    'Intermédiaire',
    'Confirmé',
    'Expert',
  ];

  protected readonly form: CandidatureForm = {
    nom: '',
    email: '',
    telephone: '',
    metier: '',
    niveauExperience: '',
    lettreMotivation: '',
  };

  protected submitForm(event: Event): void {
    event.preventDefault();
    this.successVisible.set(true);
  }

  protected closeSuccess(): void {
    this.successVisible.set(false);
  }
}

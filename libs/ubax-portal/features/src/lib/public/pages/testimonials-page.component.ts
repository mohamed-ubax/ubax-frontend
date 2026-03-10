import { Component } from '@angular/core';
import { PublicShellComponent } from '@ubax-workspace/ubax-portal-layout';

@Component({
  selector: 'ubax-testimonials-page',
  imports: [PublicShellComponent],
  templateUrl: './testimonials-page.component.html',
  styleUrl: './testimonials-page.component.scss',
})
export class TestimonialsPageComponent {
  protected readonly cards = [
    { name: 'Jean-Marc Bedi', role: 'Locataire', image: '/assets/portal/11.png' },
    { name: 'Ibrahim Diabate', role: 'Locataire', image: '/assets/portal/12.png' },
    { name: 'Nadia Coulibaly', role: 'Locataire', image: '/assets/portal/13.png' },
    { name: 'Serge Koffi', role: 'Bailleur', image: '/assets/portal/14.png' },
    { name: 'Fatou Kone', role: 'Locataire', image: '/assets/portal/15.png' },
  ];
}

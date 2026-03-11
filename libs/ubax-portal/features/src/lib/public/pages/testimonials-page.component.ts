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
    {
      name: 'Jean-Marc Bédi',
      role: 'Locataire',
      image: '/assets/portal-assets/rectangle-25189.png',
      duration: '10 : 42',
    },
    {
      name: 'Ibrahim Diabaté',
      role: 'Locataire',
      image: '/assets/portal-assets/11.png',
      duration: '05 : 47',
    },
    {
      name: 'Nadia Coulibaly',
      role: 'Locataire',
      image: '/assets/portal-assets/12.png',
      duration: '10 : 42',
    },
    {
      name: 'Serge Koffi',
      role: 'Bailleur',
      image: '/assets/portal-assets/13.png',
      duration: '10 : 42',
    },
    {
      name: 'Fatou Koné',
      role: 'Locataire',
      image: '/assets/portal-assets/14.png',
      duration: '05 : 47',
    },
    {
      name: 'Nadia Coulibaly',
      role: 'Locataire',
      image: '/assets/portal-assets/15.png',
      duration: '10 : 42',
    },
  ];
}


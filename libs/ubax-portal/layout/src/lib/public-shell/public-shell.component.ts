import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'ubax-public-shell',
  imports: [CommonModule, RouterLink],
  templateUrl: './public-shell.component.html',
  styleUrl: './public-shell.component.scss',
})
export class PublicShellComponent {
  protected readonly menuItems = [
    { label: 'Accueil', path: '/' },
    { label: 'Fonctionnalites', path: '/' },
    { label: 'Temoignages', path: '/temoignages' },
    { label: 'Tarifs', path: '/tarifs' },
    { label: 'FAQs', path: '/faq' },
    { label: 'Contacts', path: '/contact' },
  ];
}

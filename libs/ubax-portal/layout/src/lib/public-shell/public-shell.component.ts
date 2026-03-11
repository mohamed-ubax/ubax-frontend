import { CommonModule } from '@angular/common';
import { Component, HostListener } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'ubax-public-shell',
  imports: [CommonModule, RouterLink],
  templateUrl: './public-shell.component.html',
  styleUrl: './public-shell.component.scss',
})
export class PublicShellComponent {
  protected menuOpen = false;
  protected scrolled = false;

  protected toggleMenu(): void {
    this.menuOpen = !this.menuOpen;
  }

  protected closeMenu(): void {
    this.menuOpen = false;
  }

  @HostListener('window:scroll')
  protected onScroll(): void {
    this.scrolled = window.scrollY > 20;
  }

  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    this.menuOpen = false;
  }

  protected readonly menuItems = [
    { label: 'Accueil', path: '/accueil' },
    { label: 'Fonctionnalités', path: '/accueil' },
    { label: 'Témoignages', path: '/temoignages' },
    { label: 'Tarifs', path: '/tarifs' },
    { label: 'FAQs', path: '/faq' },
    { label: 'Contacts', path: '/contact' },
  ];
}

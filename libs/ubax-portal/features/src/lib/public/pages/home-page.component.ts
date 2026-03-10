import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PublicShellComponent } from '@ubax-workspace/ubax-portal-layout';

@Component({
  selector: 'ubax-home-page',
  imports: [CommonModule, RouterLink, PublicShellComponent],
  templateUrl: './home-page.component.html',
  styleUrl: './home-page.component.css',
})
export class HomePageComponent {}

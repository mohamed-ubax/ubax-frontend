import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PublicShellComponent } from '@ubax-workspace/ubax-portal-layout';
import { UiButtonComponent, UiCardComponent } from '@ubax-workspace/shared-ui';

@Component({
  selector: 'ubax-home-page',
  imports: [
    CommonModule,
    RouterLink,
    PublicShellComponent,
    UiButtonComponent,
    UiCardComponent,
  ],
  templateUrl: './home-page.component.html',
  styleUrl: './home-page.component.scss',
})
export class HomePageComponent {}


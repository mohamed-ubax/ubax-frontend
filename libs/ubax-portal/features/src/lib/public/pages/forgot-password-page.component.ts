import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PublicShellComponent } from '@ubax-workspace/ubax-portal-layout';
import { UiButtonComponent, UiInputComponent } from '@ubax-workspace/shared-ui';

@Component({
  selector: 'ubax-forgot-password-page',
  imports: [
    RouterLink,
    PublicShellComponent,
    UiInputComponent,
    UiButtonComponent,
  ],
  templateUrl: './forgot-password-page.component.html',
  styleUrl: './auth-pages.component.scss',
})
export class ForgotPasswordPageComponent {}

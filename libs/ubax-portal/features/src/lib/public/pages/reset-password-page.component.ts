import { Component } from '@angular/core';
import { PublicShellComponent } from '@ubax-workspace/ubax-portal-layout';
import { UiButtonComponent, UiInputComponent } from '@ubax-workspace/shared-ui';

@Component({
  selector: 'ubax-reset-password-page',
  imports: [PublicShellComponent, UiInputComponent, UiButtonComponent],
  templateUrl: './reset-password-page.component.html',
  styleUrl: './auth-pages.component.scss',
})
export class ResetPasswordPageComponent {}

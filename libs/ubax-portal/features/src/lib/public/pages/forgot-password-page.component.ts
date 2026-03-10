import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PublicShellComponent } from '@ubax-workspace/ubax-portal-layout';

@Component({
  selector: 'ubax-forgot-password-page',
  imports: [RouterLink, PublicShellComponent],
  templateUrl: './forgot-password-page.component.html',
  styleUrl: './auth-pages.component.css',
})
export class ForgotPasswordPageComponent {}

import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PublicShellComponent } from '@ubax-workspace/ubax-portal-layout';
import { UiButtonComponent, UiInputComponent } from '@ubax-workspace/shared-ui';

@Component({
  selector: 'ubax-login-page',
  imports: [RouterLink, PublicShellComponent, UiInputComponent, UiButtonComponent],
  templateUrl: './login-page.component.html',
  styleUrl: './auth-pages.component.scss',
})
export class LoginPageComponent {}


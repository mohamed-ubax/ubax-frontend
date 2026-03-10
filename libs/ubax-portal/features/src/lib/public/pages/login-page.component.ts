import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PublicShellComponent } from '@ubax-workspace/ubax-portal-layout';

@Component({
  selector: 'ubax-login-page',
  imports: [RouterLink, PublicShellComponent],
  templateUrl: './login-page.component.html',
  styleUrl: './auth-pages.component.css',
})
export class LoginPageComponent {}

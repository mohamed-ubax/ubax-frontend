import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Button } from 'primeng/button';
import { Password } from 'primeng/password';

@Component({
  selector: 'ubax-reset-password-page',
  imports: [FormsModule, Password, Button],
  templateUrl: './reset-password-page.component.html',
  styleUrl: './auth-pages.component.scss',
})
export class ResetPasswordPageComponent {
  protected newPassword = '';
  protected confirmPassword = '';

  private readonly router = inject(Router);

  protected get canSubmitReset(): boolean {
    return (
      this.newPassword.trim().length > 0 &&
      this.confirmPassword.trim().length > 0 &&
      this.newPassword === this.confirmPassword
    );
  }

  protected onSubmit(): void {
    if (!this.canSubmitReset) {
      return;
    }

    void this.router.navigateByUrl('/connexion');
  }
}

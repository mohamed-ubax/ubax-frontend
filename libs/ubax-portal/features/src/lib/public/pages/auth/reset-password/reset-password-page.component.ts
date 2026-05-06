import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Button } from 'primeng/button';
import { Password } from 'primeng/password';
import { ForgotPasswordService } from '../../../services/forgot-password.service';

/** Règles de complexité minimale */
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

@Component({
  selector: 'ubax-reset-password-page',
  imports: [FormsModule, Password, Button, RouterLink],
  templateUrl: './reset-password-page.component.html',
  styleUrl: '../auth-pages.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResetPasswordPageComponent implements OnInit {
  protected newPassword = '';
  protected confirmPassword = '';
  protected readonly submitting = signal(false);
  protected readonly serverError = signal<string | null>(null);
  protected readonly success = signal(false);

  private email = '';
  private otp = '';

  private readonly router = inject(Router);
  private readonly forgotPasswordService = inject(ForgotPasswordService);

  ngOnInit(): void {
    const ctx = this.forgotPasswordService.readContext();

    if (!ctx?.email || !ctx?.otp) {
      // Contexte incomplet → retour à l'étape 1
      void this.router.navigateByUrl('/mot-de-passe-oublie');
      return;
    }

    this.email = ctx.email;
    this.otp = ctx.otp;
  }

  protected get passwordStrengthValid(): boolean {
    return PASSWORD_PATTERN.test(this.newPassword);
  }

  protected get passwordsMatch(): boolean {
    return (
      this.confirmPassword.length > 0 &&
      this.newPassword === this.confirmPassword
    );
  }

  protected get canSubmitReset(): boolean {
    return this.passwordStrengthValid && this.passwordsMatch;
  }

  protected get passwordHint(): string {
    if (!this.newPassword) return '';
    if (this.newPassword.length < PASSWORD_MIN_LENGTH) {
      return `Minimum ${PASSWORD_MIN_LENGTH} caractères requis.`;
    }
    if (!PASSWORD_PATTERN.test(this.newPassword)) {
      return 'Doit contenir au moins une majuscule, une minuscule et un chiffre.';
    }
    return '';
  }

  protected async onSubmit(): Promise<void> {
    if (!this.canSubmitReset || this.submitting()) return;

    this.submitting.set(true);
    this.serverError.set(null);

    try {
      await this.forgotPasswordService
        .resetPassword(this.email, this.otp, this.newPassword)
        .toPromise();

      // Nettoyage du contexte de récupération
      this.forgotPasswordService.clearContext();
      this.success.set(true);

      setTimeout(() => {
        void this.router.navigateByUrl('/connexion');
      }, 2200);
    } catch (error) {
      this.serverError.set(this.resolveErrorMessage(error));
    } finally {
      this.submitting.set(false);
    }
  }

  private resolveErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 400 || error.status === 422) {
        return 'Code expiré ou invalide. Recommence la procédure de récupération.';
      }
      if (error.status === 0) {
        return 'Le serveur est inaccessible. Réessaie dans un instant.';
      }
    }
    return 'La réinitialisation a échoué. Réessaie dans un instant.';
  }
}

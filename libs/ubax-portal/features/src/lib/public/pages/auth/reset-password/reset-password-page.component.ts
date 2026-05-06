import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Button } from 'primeng/button';
import { Password } from 'primeng/password';
import { HttpClient } from '@angular/common/http';
import { ApiConfiguration } from '@ubax-workspace/shared-api-types';
import { firstValueFrom } from 'rxjs';

/** Règles de complexité minimale */
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

/**
 * Page de réinitialisation du mot de passe.
 * Accessible via le lien Keycloak reçu par email.
 * Keycloak gère lui-même la validation du token — cette page
 * n'a qu'à soumettre le nouveau mot de passe.
 */
@Component({
  selector: 'ubax-reset-password-page',
  imports: [FormsModule, Password, Button, RouterLink],
  templateUrl: './reset-password-page.component.html',
  styleUrl: '../auth-pages.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResetPasswordPageComponent {
  protected newPassword = '';
  protected confirmPassword = '';
  protected readonly submitting = signal(false);
  protected readonly serverError = signal<string | null>(null);
  protected readonly success = signal(false);

  private readonly router = inject(Router);
  private readonly http = inject(HttpClient);
  private readonly apiConfig = inject(ApiConfiguration);

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
      // Le token Keycloak est géré par Keycloak lui-même via le lien email.
      // Cette page est rendue dans le contexte de la session Keycloak active.
      await firstValueFrom(
        this.http.post(`${this.apiConfig.rootUrl}/v1/auth/reset-password`, {
          newPassword: this.newPassword,
        }),
      );

      this.success.set(true);
      setTimeout(() => void this.router.navigateByUrl('/connexion'), 2200);
    } catch (error) {
      this.serverError.set(this.resolveErrorMessage(error));
    } finally {
      this.submitting.set(false);
    }
  }

  private resolveErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 400 || error.status === 422) {
        return 'Le lien a expiré ou est invalide. Recommence la procédure depuis la page de connexion.';
      }
      if (error.status === 0) {
        return 'Le serveur est inaccessible. Réessaie dans un instant.';
      }
    }
    return 'La réinitialisation a échoué. Réessaie dans un instant.';
  }
}

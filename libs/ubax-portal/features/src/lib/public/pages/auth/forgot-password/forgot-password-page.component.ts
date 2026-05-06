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
import { InputText } from 'primeng/inputtext';
import { ForgotPasswordService } from '../../../services/forgot-password.service';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

@Component({
  selector: 'ubax-forgot-password-page',
  imports: [FormsModule, InputText, Button, RouterLink],
  templateUrl: './forgot-password-page.component.html',
  styleUrl: '../auth-pages.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ForgotPasswordPageComponent {
  protected email = '';
  protected readonly submitting = signal(false);
  protected readonly serverError = signal<string | null>(null);
  /** Affiché après succès pour confirmer l'envoi sans révéler si l'email existe */
  protected readonly emailSent = signal(false);

  private readonly router = inject(Router);
  private readonly forgotPasswordService = inject(ForgotPasswordService);

  protected get canRequestCode(): boolean {
    return EMAIL_PATTERN.test(this.normalizedEmail);
  }

  protected async onSubmit(): Promise<void> {
    if (!this.canRequestCode || this.submitting()) return;

    this.submitting.set(true);
    this.serverError.set(null);

    try {
      await this.forgotPasswordService
        .requestEmailLink(this.normalizedEmail)
        .toPromise();

      // Persiste le contexte pour les étapes suivantes
      this.forgotPasswordService.saveContext({ email: this.normalizedEmail });

      // Affiche le message de confirmation puis redirige
      this.emailSent.set(true);

      setTimeout(() => {
        void this.router.navigate(['/verification-code']);
      }, 1800);
    } catch (error) {
      // L'API est silencieuse sur les emails inexistants (anti-énumération).
      // On traite uniquement les vraies erreurs réseau/serveur.
      if (error instanceof HttpErrorResponse && error.status === 0) {
        this.serverError.set('Le serveur est inaccessible. Réessaie dans un instant.');
      } else if (error instanceof HttpErrorResponse && error.status >= 500) {
        this.serverError.set('Une erreur est survenue. Réessaie dans un instant.');
      } else {
        // Comportement silencieux : on redirige quand même (anti-énumération)
        this.forgotPasswordService.saveContext({ email: this.normalizedEmail });
        this.emailSent.set(true);
        setTimeout(() => {
          void this.router.navigate(['/verification-code']);
        }, 1800);
      }
    } finally {
      this.submitting.set(false);
    }
  }

  private get normalizedEmail(): string {
    return this.email.trim().toLowerCase();
  }
}

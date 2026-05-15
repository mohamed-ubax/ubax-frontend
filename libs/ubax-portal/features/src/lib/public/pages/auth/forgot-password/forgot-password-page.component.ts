import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnDestroy,
  signal,
} from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Button } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { resolveHttpErrorMessage } from '@ubax-workspace/shared-data-access';
import { ForgotPasswordService } from '../../../services/forgot-password.service';

// Regex robuste — accepte tous les TLDs valides (.io, .africa, .com, etc.)
// Teste directement la valeur trimée pour éviter tout décalage entre
// la valeur brute du champ et la valeur normalisée.
const EMAIL_PATTERN =
  /^[^\s@]+@[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/;

function isValidEmail(raw: string): boolean {
  return EMAIL_PATTERN.test(raw.trim());
}

const RESEND_COOLDOWN_SECONDS = 30;

@Component({
  selector: 'ubax-forgot-password-page',
  imports: [FormsModule, InputText, Button, RouterLink],
  templateUrl: './forgot-password-page.component.html',
  styleUrl: '../auth-pages.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ForgotPasswordPageComponent implements OnDestroy {
  protected email = '';
  protected readonly submitting = signal(false);
  protected readonly serverError = signal<string | null>(null);
  /** true dès que le premier envoi a réussi — bascule vers l'état "email envoyé" */
  protected readonly emailSent = signal(false);
  /** Compte à rebours avant de pouvoir renvoyer (secondes) */
  protected readonly resendCooldown = signal(0);
  protected readonly resending = signal(false);
  protected readonly resendSuccess = signal(false);

  private cooldownTimer: ReturnType<typeof setInterval> | null = null;
  private readonly forgotPasswordService = inject(ForgotPasswordService);

  ngOnDestroy(): void {
    this.clearTimer();
  }

  // ─── Getters utilisés dans le template ──────────────────────────────────────

  protected get canSubmit(): boolean {
    return isValidEmail(this.email);
  }

  /** Affiche l'erreur inline uniquement si l'utilisateur a commencé à taper */
  protected get emailInvalid(): boolean {
    return this.email.length > 0 && !isValidEmail(this.email);
  }

  protected get canResend(): boolean {
    return this.resendCooldown() === 0 && !this.resending();
  }

  // ─── Actions ────────────────────────────────────────────────────────────────

  /** Premier envoi depuis le formulaire */
  protected async onSubmit(): Promise<void> {
    if (!this.canSubmit || this.submitting()) return;

    this.submitting.set(true);
    this.serverError.set(null);

    try {
      await this.forgotPasswordService
        .requestEmailLink(this.email.trim().toLowerCase())
        .toPromise();
    } catch (error) {
      // Erreurs 4xx silencieuses (anti-énumération) — on bascule quand même.
      // Seules les erreurs réseau/serveur bloquent.
      if (this.isHardError(error)) {
        this.serverError.set(this.resolveErrorMessage(error));
        this.submitting.set(false);
        return;
      }
    }

    this.emailSent.set(true);
    this.submitting.set(false);
    this.startCooldown(RESEND_COOLDOWN_SECONDS);
  }

  /** Renvoi depuis l'état "email envoyé" */
  protected async onResend(): Promise<void> {
    if (!this.canResend) return;

    this.resending.set(true);
    this.resendSuccess.set(false);
    this.serverError.set(null);

    try {
      await this.forgotPasswordService
        .requestEmailLink(this.email.trim().toLowerCase())
        .toPromise();
    } catch (error) {
      if (this.isHardError(error)) {
        this.serverError.set(this.resolveErrorMessage(error));
        this.resending.set(false);
        return;
      }
    }

    this.resending.set(false);
    this.resendSuccess.set(true);
    this.startCooldown(RESEND_COOLDOWN_SECONDS);
    setTimeout(() => this.resendSuccess.set(false), 4000);
  }

  /** Permet de corriger l'adresse mail et recommencer */
  protected onEditEmail(): void {
    this.emailSent.set(false);
    this.serverError.set(null);
    this.resendSuccess.set(false);
    this.clearTimer();
    this.resendCooldown.set(0);
  }

  // ─── Helpers privés ─────────────────────────────────────────────────────────

  private startCooldown(seconds: number): void {
    this.clearTimer();
    this.resendCooldown.set(seconds);

    this.cooldownTimer = setInterval(() => {
      const current = this.resendCooldown();
      if (current <= 1) {
        this.resendCooldown.set(0);
        this.clearTimer();
      } else {
        this.resendCooldown.set(current - 1);
      }
    }, 1000);
  }

  private clearTimer(): void {
    if (this.cooldownTimer !== null) {
      clearInterval(this.cooldownTimer);
      this.cooldownTimer = null;
    }
  }

  private isHardError(error: unknown): boolean {
    return (
      error instanceof HttpErrorResponse &&
      (error.status === 0 || error.status >= 500)
    );
  }

  private resolveErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse && error.status === 0) {
      return 'Le serveur est inaccessible. Vérifie ta connexion et réessaie.';
    }
    return resolveHttpErrorMessage(error, 'Une erreur est survenue. Réessaie dans un instant.');
  }
}

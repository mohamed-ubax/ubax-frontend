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
import { InputOtp } from 'primeng/inputotp';
import { ForgotPasswordService } from '../../../services/forgot-password.service';

@Component({
  selector: 'ubax-otp-page',
  imports: [FormsModule, InputOtp, Button, RouterLink],
  templateUrl: './otp-page.component.html',
  styleUrl: '../auth-pages.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OtpPageComponent implements OnInit {
  protected otpCode = '';
  protected readonly submitting = signal(false);
  protected readonly resending = signal(false);
  protected readonly serverError = signal<string | null>(null);
  protected readonly resendSuccess = signal(false);
  /** Compte à rebours avant de pouvoir renvoyer le code (secondes) */
  protected readonly resendCooldown = signal(0);

  protected recoveryEmail = '';

  private readonly router = inject(Router);
  private readonly forgotPasswordService = inject(ForgotPasswordService);
  private cooldownTimer: ReturnType<typeof setInterval> | null = null;

  ngOnInit(): void {
    const ctx = this.forgotPasswordService.readContext();

    if (!ctx?.email) {
      // Pas de contexte → retour à l'étape 1
      void this.router.navigateByUrl('/mot-de-passe-oublie');
      return;
    }

    this.recoveryEmail = ctx.email;
    this.startCooldown(30);
  }

  protected get canVerifyCode(): boolean {
    return this.otpCode.length === 6;
  }

  protected async onSubmit(): Promise<void> {
    if (!this.canVerifyCode || this.submitting()) return;

    this.submitting.set(true);
    this.serverError.set(null);

    try {
      await this.forgotPasswordService
        .verifyOtp(this.recoveryEmail, this.otpCode)
        .toPromise();

      // Persiste l'OTP pour l'étape 3
      this.forgotPasswordService.saveContext({
        email: this.recoveryEmail,
        otp: this.otpCode,
      });

      void this.router.navigateByUrl('/nouveau-mot-de-passe');
    } catch (error) {
      this.serverError.set(this.resolveErrorMessage(error));
      this.otpCode = '';
    } finally {
      this.submitting.set(false);
    }
  }

  protected async onResendCode(): Promise<void> {
    if (this.resendCooldown() > 0 || this.resending()) return;

    this.resending.set(true);
    this.resendSuccess.set(false);
    this.serverError.set(null);

    try {
      await this.forgotPasswordService
        .requestEmailLink(this.recoveryEmail)
        .toPromise();

      this.resendSuccess.set(true);
      this.otpCode = '';
      this.startCooldown(60);

      setTimeout(() => this.resendSuccess.set(false), 4000);
    } catch {
      this.serverError.set('Impossible de renvoyer le code. Réessaie dans un instant.');
    } finally {
      this.resending.set(false);
    }
  }

  private startCooldown(seconds: number): void {
    if (this.cooldownTimer) clearInterval(this.cooldownTimer);
    this.resendCooldown.set(seconds);

    this.cooldownTimer = setInterval(() => {
      const current = this.resendCooldown();
      if (current <= 1) {
        this.resendCooldown.set(0);
        if (this.cooldownTimer) clearInterval(this.cooldownTimer);
      } else {
        this.resendCooldown.set(current - 1);
      }
    }, 1000);
  }

  private resolveErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 400 || error.status === 422) {
        return 'Code incorrect ou expiré. Vérifie le code reçu par mail.';
      }
      if (error.status === 0) {
        return 'Le serveur est inaccessible. Réessaie dans un instant.';
      }
    }
    return 'La vérification a échoué. Réessaie dans un instant.';
  }
}

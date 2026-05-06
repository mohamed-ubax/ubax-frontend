import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import {
  ApiConfiguration,
  forgotPassword as forgotPasswordFn,
  forgotPasswordVerifyOtp as verifyOtpFn,
  forgotPasswordReset as resetFn,
} from '@ubax-workspace/shared-api-types';

const SESSION_KEY = 'ubax_fp_ctx';

export type ForgotPasswordContext = {
  /** Email saisi à l'étape 1 */
  email: string;
  /** OTP vérifié à l'étape 2 (conservé pour l'étape 3) */
  otp?: string;
};

/**
 * Service de récupération de mot de passe.
 *
 * Gère les 3 étapes du flow :
 *  1. Demande d'envoi d'email (POST /v1/auth/forgot-password)
 *  2. Vérification OTP       (POST /v1/auth/forgot-password/verify-otp)
 *  3. Réinitialisation MDP   (POST /v1/auth/forgot-password/reset)
 *
 * Le contexte (email, OTP) est persisté en sessionStorage pour survivre
 * aux navigations entre les étapes sans passer par les query params.
 */
@Injectable({ providedIn: 'root' })
export class ForgotPasswordService {
  private readonly http = inject(HttpClient);
  private readonly apiConfig = inject(ApiConfiguration);

  // ─── Context helpers ────────────────────────────────────────────────────────

  saveContext(ctx: ForgotPasswordContext): void {
    try {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(ctx));
    } catch {
      // SSR / private browsing — silently ignore
    }
  }

  readContext(): ForgotPasswordContext | null {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      if (!raw) return null;
      return JSON.parse(raw) as ForgotPasswordContext;
    } catch {
      return null;
    }
  }

  clearContext(): void {
    try {
      sessionStorage.removeItem(SESSION_KEY);
    } catch {
      // ignore
    }
  }

  // ─── API calls ──────────────────────────────────────────────────────────────

  /**
   * Étape 1 — Envoie un email de récupération.
   * Silencieux côté API si l'email n'existe pas (anti-énumération).
   */
  requestEmailLink(email: string): Observable<void> {
    return forgotPasswordFn(
      this.http,
      this.apiConfig.rootUrl,
      { body: { email } },
    ).pipe(map(() => void 0));
  }

  /**
   * Étape 2 — Vérifie l'OTP reçu par email.
   * Le code n'est pas consommé ici (étape 3 requise).
   */
  verifyOtp(email: string, code: string): Observable<void> {
    return verifyOtpFn(
      this.http,
      this.apiConfig.rootUrl,
      { body: { phone: email, code } },
    ).pipe(map(() => void 0));
  }

  /**
   * Étape 3 — Consomme l'OTP et réinitialise le mot de passe.
   */
  resetPassword(email: string, otp: string, newPassword: string): Observable<void> {
    return resetFn(
      this.http,
      this.apiConfig.rootUrl,
      { body: { phone: email, code: otp, newPassword } },
    ).pipe(map(() => void 0));
  }
}

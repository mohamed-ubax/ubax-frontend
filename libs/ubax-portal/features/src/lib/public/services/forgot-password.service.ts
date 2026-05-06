import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import {
  ApiConfiguration,
  forgotPassword as forgotPasswordFn,
} from '@ubax-workspace/shared-api-types';

/**
 * Service de récupération de mot de passe.
 * Gère l'appel POST /v1/auth/forgot-password qui envoie un lien Keycloak par email.
 */
@Injectable({ providedIn: 'root' })
export class ForgotPasswordService {
  private readonly http = inject(HttpClient);
  private readonly apiConfig = inject(ApiConfiguration);

  /**
   * Envoie un email de récupération avec un lien Keycloak.
   * Silencieux côté API si l'email n'existe pas (anti-énumération).
   */
  requestEmailLink(email: string): Observable<void> {
    return forgotPasswordFn(
      this.http,
      this.apiConfig.rootUrl,
      { body: { email } },
    ).pipe(map(() => void 0));
  }
}

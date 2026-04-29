import { DOCUMENT } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  AuthService,
  DEFAULT_UBAX_WEB_HOME_PATH,
  persistAuthToken,
  resolveUbaxWebRedirectTarget,
} from '@ubax-workspace/ubax-web-data-access';
import { InputText } from 'primeng/inputtext';
import { Password } from 'primeng/password';
import { Button } from 'primeng/button';
import { firstValueFrom } from 'rxjs';

interface LoginApiResponse {
  access_token?: string | null;
  data?: {
    accessToken?: string | null;
    access_token?: string | null;
  } | null;
}

@Component({
  selector: 'ubax-login-page',
  imports: [RouterLink, FormsModule, InputText, Password, Button],
  templateUrl: './login-page.component.html',
  styleUrl: './login-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginPageComponent {
  email = '';
  password = '';
  protected readonly submitting = signal(false);
  protected readonly serverError = signal<string | null>(null);
  private readonly authService = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly document = inject(DOCUMENT);

  protected async onSubmit(): Promise<void> {
    if (this.submitting()) {
      return;
    }

    const email = this.email.trim();
    const password = this.password.trim();

    if (!email || !password) {
      this.serverError.set('Renseignez votre email et votre mot de passe.');
      return;
    }

    this.submitting.set(true);
    this.serverError.set(null);

    try {
      const response = (await firstValueFrom(
        this.authService.login({ email, password }),
      )) as LoginApiResponse;
      const accessToken = this.extractAccessToken(response);

      if (!accessToken) {
        this.serverError.set(
          "La réponse d'authentification est invalide. Réessaie dans un instant.",
        );
        return;
      }

      persistAuthToken(accessToken);
      this.document.defaultView?.location.assign(this.redirectTarget());
    } catch (error) {
      this.serverError.set(this.resolveErrorMessage(error));
    } finally {
      this.submitting.set(false);
    }
  }

  private redirectTarget(): string {
    return resolveUbaxWebRedirectTarget(
      this.route.snapshot.queryParamMap.get('redirect') ??
        DEFAULT_UBAX_WEB_HOME_PATH,
    );
  }

  private extractAccessToken(response: LoginApiResponse): string | null {
    return (
      response.access_token ??
      response.data?.accessToken ??
      response.data?.access_token ??
      null
    );
  }

  private resolveErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 401) {
        return 'Email ou mot de passe invalide.';
      }

      if (error.status === 0) {
        return "Le serveur d'authentification est inaccessible.";
      }
    }

    return 'La connexion a échoué. Réessaie dans un instant.';
  }
}

import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Button } from 'primeng/button';
import { InputText } from 'primeng/inputtext';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

@Component({
  selector: 'ubax-forgot-password-page',
  imports: [FormsModule, InputText, Button],
  templateUrl: './forgot-password-page.component.html',
  styleUrl: '../auth-pages.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ForgotPasswordPageComponent {
  protected email = '';

  private readonly router = inject(Router);

  protected get canRequestCode(): boolean {
    return EMAIL_PATTERN.test(this.normalizedEmail);
  }

  protected onSubmit(): void {
    if (!this.canRequestCode) {
      return;
    }

    void this.router.navigate(['/verification-code'], {
      queryParams: { email: this.normalizedEmail },
    });
  }

  private get normalizedEmail(): string {
    return this.email.trim();
  }
}

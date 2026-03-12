import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PublicShellComponent } from '@ubax-workspace/ubax-portal-layout';
import { Button } from 'primeng/button';
import { InputOtp } from 'primeng/inputotp';

@Component({
  selector: 'ubax-otp-page',
  imports: [PublicShellComponent, FormsModule, InputOtp, Button],
  templateUrl: './otp-page.component.html',
  styleUrl: './auth-pages.component.scss',
})
export class OtpPageComponent {
  protected otpCode = '';

  private readonly router = inject(Router);

  protected get canVerifyCode(): boolean {
    return this.otpCode.length === 6;
  }

  protected onSubmit(): void {
    if (!this.canVerifyCode) {
      return;
    }

    void this.router.navigateByUrl('/nouveau-mot-de-passe');
  }

  protected onResendCode(): void {
    this.otpCode = '';
  }
}

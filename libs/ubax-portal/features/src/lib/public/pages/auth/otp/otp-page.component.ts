import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Button } from 'primeng/button';
import { InputOtp } from 'primeng/inputotp';

const RECOVERY_EMAIL_FALLBACK = 'xxxxxxxxxxxxx@gmail.com';

@Component({
  selector: 'ubax-otp-page',
  imports: [FormsModule, InputOtp, Button],
  templateUrl: './otp-page.component.html',
  styleUrl: '../auth-pages.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OtpPageComponent {
  protected otpCode = '';

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  protected readonly recoveryEmail =
    this.route.snapshot.queryParamMap.get('email')?.trim() ||
    RECOVERY_EMAIL_FALLBACK;

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

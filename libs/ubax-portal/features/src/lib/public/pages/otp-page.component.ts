import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PublicShellComponent } from '@ubax-workspace/ubax-portal-layout';
import { UiButtonComponent } from '@ubax-workspace/shared-ui';

@Component({
  selector: 'ubax-otp-page',
  imports: [RouterLink, PublicShellComponent, UiButtonComponent],
  templateUrl: './otp-page.component.html',
  styleUrl: './auth-pages.component.scss',
})
export class OtpPageComponent {
  protected readonly otpSlots = Array.from({ length: 6 });
}

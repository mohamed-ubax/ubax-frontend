import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PublicShellComponent } from '@ubax-workspace/ubax-portal-layout';

@Component({
  selector: 'ubax-otp-page',
  imports: [RouterLink, PublicShellComponent],
  templateUrl: './otp-page.component.html',
  styleUrl: './auth-pages.component.css',
})
export class OtpPageComponent {
  protected readonly otpSlots = Array.from({ length: 6 });
}

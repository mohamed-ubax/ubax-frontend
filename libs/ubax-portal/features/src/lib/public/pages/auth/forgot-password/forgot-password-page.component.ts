import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Button } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { COUNTRY_CODES, type CountryCode } from '../../../shared/country-codes';

@Component({
  selector: 'ubax-forgot-password-page',
  imports: [FormsModule, Select, InputText, Button],
  templateUrl: './forgot-password-page.component.html',
  styleUrl: '../auth-pages.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ForgotPasswordPageComponent {
  protected readonly countries = COUNTRY_CODES;
  protected selectedCountry: CountryCode = COUNTRY_CODES[0];
  protected phone = '';

  private readonly router = inject(Router);

  protected get canRequestCode(): boolean {
    return this.phone.trim().length >= 8;
  }

  protected onSubmit(): void {
    if (!this.canRequestCode) {
      return;
    }

    void this.router.navigateByUrl('/verification-code');
  }
}

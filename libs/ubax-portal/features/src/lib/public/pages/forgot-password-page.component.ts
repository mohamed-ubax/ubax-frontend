import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PublicShellComponent } from '@ubax-workspace/ubax-portal-layout';
import { Button } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { COUNTRY_CODES, type CountryCode } from '../shared/country-codes';

@Component({
  selector: 'ubax-forgot-password-page',
  imports: [PublicShellComponent, FormsModule, Select, InputText, Button],
  templateUrl: './forgot-password-page.component.html',
  styleUrl: './auth-pages.component.scss',
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

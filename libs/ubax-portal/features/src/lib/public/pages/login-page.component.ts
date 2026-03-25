import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Select } from 'primeng/select';
import { InputText } from 'primeng/inputtext';
import { Password } from 'primeng/password';
import { Button } from 'primeng/button';
import { COUNTRY_CODES, type CountryCode } from '../shared/country-codes';

@Component({
  selector: 'ubax-login-page',
  imports: [
    RouterLink,
    FormsModule,
    Select,
    InputText,
    Password,
    Button,
  ],
  templateUrl: './login-page.component.html',
  styleUrl: './login-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginPageComponent {
  countries = COUNTRY_CODES;
  selectedCountry: CountryCode = COUNTRY_CODES[0];
  phone = '';
  password = '';
}

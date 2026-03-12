import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PublicShellComponent } from '@ubax-workspace/ubax-portal-layout';
import { Button } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { COUNTRY_CODES, type CountryCode } from '../shared/country-codes';

interface ContactChannel {
  icon: string;
  label: string;
  value: string;
  href: string;
}

interface SocialLink {
  icon: string;
  label: string;
  href: string;
}

@Component({
  selector: 'ubax-contact-page',
  standalone: true,
  imports: [
    PublicShellComponent,
    FormsModule,
    Select,
    InputText,
    Button,
  ],
  templateUrl: './contact-page.component.html',
  styleUrl: './contact-page.component.scss',
})
export class ContactPageComponent {
  protected readonly countries = COUNTRY_CODES;
  protected selectedCountry: CountryCode = COUNTRY_CODES[0];

  protected readonly supportChannels: ContactChannel[] = [
    {
      icon: 'assets/portal-assets/contacts/ix_support.svg',
      label: 'Support',
      value: '+225 01 02 03 04 05',
      href: 'tel:+2250102030405',
    },
    {
      icon: 'assets/portal-assets/contacts/ep_chat-dot-round.svg',
      label: 'SMS / WhatsApp',
      value: '+225 01 02 03 04 05',
      href: 'https://wa.me/2250102030405',
    },
    {
      icon: 'assets/portal-assets/contacts/oui_email.svg',
      label: 'Email',
      value: 'support@ubax.io',
      href: 'mailto:support@ubax.io',
    },
  ];

  protected readonly socialLinks: SocialLink[] = [
    {
      icon: 'assets/portal-assets/footer/icons/ic_baseline-facebook.svg',
      label: 'Facebook',
      href: '#',
    },
    {
      icon: 'assets/portal-assets/footer/icons/mdi_instagram.svg',
      label: 'Instagram',
      href: '#',
    },
    {
      icon: 'assets/portal-assets/footer/icons/ic_baseline-tiktok.svg',
      label: 'TikTok',
      href: '#',
    },
    {
      icon: 'assets/portal-assets/footer/icons/pajamas_twitter.svg',
      label: 'X',
      href: '#',
    },
    {
      icon: 'assets/portal-assets/footer/icons/pajamas_linkedin.svg',
      label: 'LinkedIn',
      href: '#',
    },
  ];

  protected firstName = '';
  protected lastName = '';
  protected email = '';
  protected phone = '';
  protected message = '';

  protected onSubmit(): void {
    // Form behavior will be wired to the backend flow later.
  }
}

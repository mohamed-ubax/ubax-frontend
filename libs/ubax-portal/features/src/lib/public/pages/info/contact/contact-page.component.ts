import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  inject,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PublicShellComponent } from '@ubax-workspace/ubax-portal-layout';
import { Button } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { COUNTRY_CODES, type CountryCode } from '../../../shared/country-codes';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

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
  imports: [PublicShellComponent, FormsModule, Select, InputText, Button],
  templateUrl: './contact-page.component.html',
  styleUrl: './contact-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContactPageComponent {
  private readonly _el = inject(ElementRef<HTMLElement>);
  private readonly _destroyRef = inject(DestroyRef);
  private _gsapCtx: gsap.Context | null = null;

  constructor() {
    afterNextRender(() => this._initAnimations());
  }

  private _initAnimations(): void {
    const el = this._el.nativeElement as HTMLElement;
    gsap.registerPlugin(ScrollTrigger);

    this._gsapCtx = gsap.context(() => {
      const hero = el.querySelector('.contact-page__hero');

      gsap.from('.contact-page__title', {
        y: -30,
        opacity: 0,
        duration: 0.85,
        ease: 'power3.out',
        scrollTrigger: { trigger: hero, start: 'top 82%' },
      });

      gsap.from('.contact-page__description', {
        y: -18,
        opacity: 0,
        duration: 0.75,
        delay: 0.18,
        ease: 'power3.out',
        scrollTrigger: { trigger: hero, start: 'top 82%' },
      });

      const layout = el.querySelector('.contact-layout');

      gsap.from('.contact-form', {
        x: -75,
        opacity: 0,
        duration: 1,
        ease: 'power3.out',
        scrollTrigger: { trigger: layout, start: 'top 80%' },
      });

      gsap.from('.contact-support', {
        x: 75,
        opacity: 0,
        duration: 1,
        ease: 'power3.out',
        scrollTrigger: { trigger: layout, start: 'top 80%' },
      });

      gsap.from('.support-channel', {
        y: 30,
        autoAlpha: 0,
        duration: 0.65,
        stagger: 0.12,
        ease: 'power3.out',
        clearProps: 'y,transform',
        scrollTrigger: { trigger: '.contact-support', start: 'top 85%' },
      });
    }, el);

    this._destroyRef.onDestroy(() => {
      this._gsapCtx?.revert();
      this._gsapCtx = null;
    });
  }

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

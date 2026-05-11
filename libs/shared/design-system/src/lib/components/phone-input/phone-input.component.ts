import { CommonModule } from '@angular/common';
import {
  Component,
  computed,
  forwardRef,
  input,
  model,
  output,
} from '@angular/core';
import {
  ControlValueAccessor,
  FormsModule,
  NG_VALUE_ACCESSOR,
} from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';

export interface PhoneCountryOption {
  code: string;
  label: string;
  dialCode: string;
  flag: string;
}

const PHONE_COUNTRIES: PhoneCountryOption[] = [
  { code: 'CI', label: "Côte d'Ivoire", dialCode: '+225', flag: '🇨🇮' },
  { code: 'FR', label: 'France', dialCode: '+33', flag: '🇫🇷' },
  { code: 'SN', label: 'Sénégal', dialCode: '+221', flag: '🇸🇳' },
  { code: 'ML', label: 'Mali', dialCode: '+223', flag: '🇲🇱' },
  { code: 'BF', label: 'Burkina Faso', dialCode: '+226', flag: '🇧🇫' },
  { code: 'CM', label: 'Cameroun', dialCode: '+237', flag: '🇨🇲' },
  { code: 'GA', label: 'Gabon', dialCode: '+241', flag: '🇬🇦' },
  { code: 'CD', label: 'RD Congo', dialCode: '+243', flag: '🇨🇩' },
  { code: 'US', label: 'États-Unis', dialCode: '+1', flag: '🇺🇸' },
  { code: 'GB', label: 'Royaume-Uni', dialCode: '+44', flag: '🇬🇧' },
];

function normalizePhone(value: string): string {
  return value.replaceAll(/\s+/g, '').trim();
}

function sanitizeLocalNumber(value: string): string {
  return value.replaceAll(/[^\d]/g, '').trim();
}

function getCountryFromValue(value: string): PhoneCountryOption {
  const normalized = normalizePhone(value);
  return (
    PHONE_COUNTRIES.find((country) =>
      normalized.startsWith(country.dialCode),
    ) ?? PHONE_COUNTRIES[0]
  );
}

/**
 * UbaxPhoneInput — International phone field with country selector.
 */
@Component({
  selector: 'ubax-phone-input',
  standalone: true,
  imports: [CommonModule, FormsModule, InputTextModule, SelectModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => PhoneInputComponent),
      multi: true,
    },
  ],
  template: `
    <div class="flex flex-col gap-2" data-ubax-motion="surface">
      <div
        class="flex items-stretch overflow-hidden rounded-md border border-neutral-300 bg-surface-card shadow-card"
      >
        <p-select
          class="w-[12rem] shrink-0"
          [options]="countries()"
          optionLabel="label"
          optionValue="code"
          [ngModel]="countryCode()"
          (ngModelChange)="setCountryCode($event)"
          [disabled]="disabled()"
          styleClass="ubax-phone-country h-full border-0 rounded-none"
        />

        <div
          class="flex min-w-0 flex-1 items-center border-l border-neutral-300 px-4"
        >
          <span class="mr-2 shrink-0 text-md font-medium text-neutral-500">
            {{ selectedCountry().dialCode }}
          </span>

          <input
            pInputText
            type="tel"
            class="w-full border-0 bg-transparent p-0 text-md font-regular text-neutral-900 shadow-none placeholder:text-neutral-500 focus:ring-0"
            [placeholder]="placeholder()"
            [value]="localNumber()"
            [disabled]="disabled()"
            (input)="setLocalNumber($any($event.target).value)"
            (blur)="markTouched()"
          />
        </div>
      </div>

      @if (hint()) {
        <p class="text-sm text-neutral-500">
          {{ hint() }}
        </p>
      }
    </div>
  `,
})
export class PhoneInputComponent implements ControlValueAccessor {
  readonly placeholder = input<string>('070000000');
  readonly hint = input<string>('');

  readonly value = model<string>('');
  readonly countryCode = model<string>('CI');
  readonly disabled = model<boolean>(false);
  readonly valueChange = output<string>();

  readonly countries = computed(() => PHONE_COUNTRIES);
  readonly selectedCountry = computed(
    () =>
      PHONE_COUNTRIES.find((country) => country.code === this.countryCode()) ??
      PHONE_COUNTRIES[0],
  );

  readonly localNumber = model<string>('');

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  private onChange: (value: string) => void = () => {};
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  private onTouched: () => void = () => {};

  writeValue(value: string | null): void {
    const normalized = normalizePhone(value ?? '');

    if (!normalized) {
      this.localNumber.set('');
      this.countryCode.set(PHONE_COUNTRIES[0].code);
      this.value.set('');
      return;
    }

    const country = getCountryFromValue(normalized);
    const localNumber = sanitizeLocalNumber(
      normalized.slice(country.dialCode.length),
    );

    this.countryCode.set(country.code);
    this.localNumber.set(localNumber);
    this.value.set(`${country.dialCode}${localNumber}`);
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }

  setCountryCode(code: string): void {
    if (this.disabled()) {
      return;
    }

    const country =
      PHONE_COUNTRIES.find((entry) => entry.code === code) ??
      PHONE_COUNTRIES[0];
    this.countryCode.set(country.code);
    this.commitValue(this.localNumber(), country.code);
  }

  setLocalNumber(value: string): void {
    if (this.disabled()) {
      return;
    }

    const localNumber = sanitizeLocalNumber(value);
    this.commitValue(localNumber);
  }

  markTouched(): void {
    this.onTouched();
  }

  private commitValue(
    localNumber: string,
    countryCode = this.countryCode(),
  ): void {
    const country =
      PHONE_COUNTRIES.find((entry) => entry.code === countryCode) ??
      PHONE_COUNTRIES[0];
    const nextValue = localNumber ? `${country.dialCode}${localNumber}` : '';

    this.localNumber.set(localNumber);
    this.countryCode.set(country.code);
    this.value.set(nextValue);
    this.onChange(nextValue);
    this.valueChange.emit(nextValue);
  }
}

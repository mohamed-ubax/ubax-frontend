import {
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import {
  COUNTRY_CODES,
  type CountryDialCode,
} from '@ubax-workspace/shared-data-access';
import {
  pickPrimarySubRole,
  SUB_ROLE_LABELS,
} from '@ubax-workspace/ubax-web-data-access';
import type { AdminUserResponse } from '@ubax-workspace/shared-api-types';

export const MEMBER_PAGE_SIZE = 6;

export const MEMBER_AVATAR_FALLBACK = '/equipe/avatar-fallback.svg';

export function normalizeSearchText(value: string): string {
  return value.toLowerCase().normalize('NFD').replaceAll(/[̀-ͯ]/g, '');
}

export function formatRoleLabel(
  roleKeys: readonly string[],
  loading: boolean,
  error: string | null,
): string {
  if (loading) {
    return 'Chargement...';
  }

  if (error) {
    return 'Sous-rôles indisponibles';
  }

  if (!roleKeys.length) {
    return 'Aucun sous-rôle';
  }

  const primaryRole = pickPrimarySubRole(roleKeys);

  if (primaryRole) {
    return SUB_ROLE_LABELS[primaryRole] ?? primaryRole;
  }

  return roleKeys.join(', ');
}

export function toggleArrayValue(
  values: readonly string[],
  role: string,
): string[] {
  return values.includes(role)
    ? values.filter((item) => item !== role)
    : [...values, role];
}

export function composeE164Phone(
  dialCode: string,
  nationalDigits: string,
): string {
  const digits = nationalDigits.replaceAll(/\D/g, '');
  if (!digits.length) {
    return '';
  }
  if (dialCode === '225') {
    const body = digits.startsWith('0') ? digits.slice(1) : digits;
    if (body.length !== 9 || !/^[1-9]\d{8}$/.test(body)) {
      return '';
    }
    return `+225${body}`;
  }
  const body = digits.startsWith('0') ? digits.slice(1) : digits;
  if (body.length < 6 || body.length > 14 || !/^\d+$/.test(body)) {
    return '';
  }
  return `+${dialCode}${body}`;
}

export function readDefaultPhoneCountry(): CountryDialCode {
  const ci = COUNTRY_CODES.find((c) => c.iso2 === 'CI');
  if (ci) {
    return ci;
  }
  const first = COUNTRY_CODES[0];
  if (first) {
    return first;
  }
  return {
    name: "Cote d'Ivoire",
    iso2: 'CI',
    dialCode: '225',
    flagUrl: 'https://flagcdn.com/w80/ci.png',
  };
}

export function parseE164ToCountryAndNational(e164: string): {
  country: CountryDialCode;
  nationalDigits: string;
} {
  const trimmed = (e164 ?? '').trim();
  if (!trimmed.startsWith('+')) {
    return { country: readDefaultPhoneCountry(), nationalDigits: '' };
  }
  const withoutPlus = trimmed.slice(1).replaceAll(/\D/g, '');
  if (!withoutPlus.length) {
    return { country: readDefaultPhoneCountry(), nationalDigits: '' };
  }
  const sorted = [...COUNTRY_CODES].sort(
    (a, b) => b.dialCode.length - a.dialCode.length,
  );
  for (const country of sorted) {
    if (withoutPlus.startsWith(country.dialCode)) {
      return {
        country,
        nationalDigits: withoutPlus.slice(country.dialCode.length),
      };
    }
  }
  return { country: readDefaultPhoneCountry(), nationalDigits: withoutPlus };
}

export function readMemberId(member: AdminUserResponse): string {
  return member.userId ?? member.keycloakId ?? member.email ?? '';
}

export function addMemberPhoneValidator(
  control: AbstractControl,
): ValidationErrors | null {
  const raw = (control.value as string) ?? '';
  if (!raw.trim()) {
    return null;
  }
  return /^\+[1-9]\d{6,14}$/.test(raw) ? null : { phoneFormat: true };
}

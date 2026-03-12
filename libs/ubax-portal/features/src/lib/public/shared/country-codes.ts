export interface CountryCode {
  name: string;
  iso2: string;
  dialCode: string;
  flagUrl: string;
}

const createFlagUrl = (iso2: string) =>
  `https://flagcdn.com/w80/${iso2.toLowerCase()}.png`;

const COUNTRY_CODE_OPTIONS = [
  { name: "Cote d'Ivoire", iso2: 'CI', dialCode: '225' },
  { name: 'Senegal', iso2: 'SN', dialCode: '221' },
  { name: 'Mali', iso2: 'ML', dialCode: '223' },
  { name: 'Guinee', iso2: 'GN', dialCode: '224' },
  { name: 'Burkina Faso', iso2: 'BF', dialCode: '226' },
  { name: 'Niger', iso2: 'NE', dialCode: '227' },
  { name: 'Togo', iso2: 'TG', dialCode: '228' },
  { name: 'Benin', iso2: 'BJ', dialCode: '229' },
  { name: 'Nigeria', iso2: 'NG', dialCode: '234' },
  { name: 'Ghana', iso2: 'GH', dialCode: '233' },
  { name: 'Cameroun', iso2: 'CM', dialCode: '237' },
  { name: 'Maroc', iso2: 'MA', dialCode: '212' },
  { name: 'Algerie', iso2: 'DZ', dialCode: '213' },
  { name: 'Tunisie', iso2: 'TN', dialCode: '216' },
  { name: 'Egypte', iso2: 'EG', dialCode: '20' },
  { name: 'Afrique du Sud', iso2: 'ZA', dialCode: '27' },
  { name: 'Kenya', iso2: 'KE', dialCode: '254' },
  { name: 'Ethiopie', iso2: 'ET', dialCode: '251' },
  { name: 'Tanzanie', iso2: 'TZ', dialCode: '255' },
  { name: 'Ouganda', iso2: 'UG', dialCode: '256' },
  { name: 'Rwanda', iso2: 'RW', dialCode: '250' },
  { name: 'Madagascar', iso2: 'MG', dialCode: '261' },
  { name: 'Maurice', iso2: 'MU', dialCode: '230' },
  { name: 'Angola', iso2: 'AO', dialCode: '244' },
  { name: 'Mozambique', iso2: 'MZ', dialCode: '258' },
  { name: 'Zambie', iso2: 'ZM', dialCode: '260' },
  { name: 'Zimbabwe', iso2: 'ZW', dialCode: '263' },
  { name: 'France', iso2: 'FR', dialCode: '33' },
  { name: 'Allemagne', iso2: 'DE', dialCode: '49' },
  { name: 'Royaume-Uni', iso2: 'GB', dialCode: '44' },
  { name: 'Espagne', iso2: 'ES', dialCode: '34' },
  { name: 'Italie', iso2: 'IT', dialCode: '39' },
  { name: 'Portugal', iso2: 'PT', dialCode: '351' },
  { name: 'Belgique', iso2: 'BE', dialCode: '32' },
  { name: 'Suisse', iso2: 'CH', dialCode: '41' },
  { name: 'Etats-Unis', iso2: 'US', dialCode: '1' },
  { name: 'Canada', iso2: 'CA', dialCode: '1' },
  { name: 'Bresil', iso2: 'BR', dialCode: '55' },
  { name: 'Mexique', iso2: 'MX', dialCode: '52' },
  { name: 'Chine', iso2: 'CN', dialCode: '86' },
  { name: 'Japon', iso2: 'JP', dialCode: '81' },
  { name: 'Inde', iso2: 'IN', dialCode: '91' },
  { name: 'Emirats arabes unis', iso2: 'AE', dialCode: '971' },
  { name: 'Arabie saoudite', iso2: 'SA', dialCode: '966' },
  { name: 'Turquie', iso2: 'TR', dialCode: '90' },
  { name: 'Australie', iso2: 'AU', dialCode: '61' },
] as const;

export const COUNTRY_CODES: CountryCode[] = COUNTRY_CODE_OPTIONS.map(
  (country) => ({
    ...country,
    flagUrl: createFlagUrl(country.iso2),
  }),
);

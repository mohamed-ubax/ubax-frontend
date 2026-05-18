export const DAY_IN_MS = 24 * 60 * 60 * 1000;

export const MONTH_NAMES = [
  'Janvier',
  'Fevrier',
  'Mars',
  'Avril',
  'Mai',
  'Juin',
  'Juillet',
  'Aout',
  'Septembre',
  'Octobre',
  'Novembre',
  'Decembre',
];

export const DEFAULT_EXTRA_OPTIONS = [
  'Petit dejeuner inclus',
  'Navette aeroport',
  'Lit supplementaire',
  'Room service',
  'Coffre-fort',
  'Television ecran plat',
  'Bureau de travail',
  'Service de menage quotidien',
  'Piscine',
  'Mini-bar',
  'Check in anticipe',
  'Salle de bain privee',
  'Baignoire',
  'Parking gratuit',
];

export function createDate(year: number, month: number, day: number): Date {
  return new Date(year, month - 1, day);
}

export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function addDays(date: Date, days: number): Date {
  const next = startOfDay(date);
  next.setDate(next.getDate() + days);
  return next;
}

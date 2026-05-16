import type { CommercialReservation } from '../types/reservation.types';

export function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replaceAll(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}

const MONTHS = [
  'Janvier',
  'Février',
  'Mars',
  'Avril',
  'Mai',
  'Juin',
  'Juillet',
  'Août',
  'Septembre',
  'Octobre',
  'Novembre',
  'Décembre',
] as const;

function pad(value: number): string {
  return value.toString().padStart(2, '0');
}

export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function formatMonthLabel(date: Date): string {
  return `${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

export function formatShortDate(date: Date): string {
  return `${pad(date.getDate())} / ${pad(date.getMonth() + 1)} / ${date.getFullYear()}`;
}

export function formatDateRange(
  start: Date,
  end: Date,
  separator = ' - ',
): string {
  return `${formatShortDate(start)}${separator}${formatShortDate(end)}`;
}

export function formatFcfa(value: number): string {
  return `${new Intl.NumberFormat('fr-FR')
    .format(value)
    .replaceAll(/ /g, ' ')} FCFA`;
}

export function filterReservations(
  reservations: readonly CommercialReservation[],
  query: string,
  range: { readonly start: Date; readonly end: Date } | null,
  propertyCategory: string | null = null,
): CommercialReservation[] {
  const normalizedQuery = normalizeText(query);
  const rangeStart = range ? startOfDay(range.start) : null;
  const rangeEnd = range ? startOfDay(range.end) : null;

  return reservations.filter((reservation) => {
    const matchesQuery =
      normalizedQuery.length === 0 ||
      reservation.searchIndex.includes(normalizedQuery);
    const matchesRange =
      rangeStart === null ||
      rangeEnd === null ||
      (startOfDay(reservation.arrivalDate) <= rangeEnd &&
        startOfDay(reservation.departureDate) >= rangeStart);
    const matchesPropertyCategory =
      propertyCategory === null ||
      propertyCategory.length === 0 ||
      reservation.propertyCategory === propertyCategory;

    return matchesQuery && matchesRange && matchesPropertyCategory;
  });
}

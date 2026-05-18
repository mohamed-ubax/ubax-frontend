import type {
  ClientDocument,
  ClientDetailData,
  ClientReservationSummary,
  ReservationHistoryEntry,
  ReservationHistoryTone,
} from '../types/client-detail.types';

export const DEFAULT_CLIENT_ID = '1';

const SHARED_DOCUMENTS: readonly ClientDocument[] = [
  { label: 'Facture' },
  { label: 'CNI ivoirienne' },
];

const SHARED_SUMMARY: ClientReservationSummary = {
  thumbnails: [
    'shared/rooms/room-photo-03.webp',
    'shared/rooms/room-photo-02.webp',
    'shared/rooms/room-photo-04.webp',
  ],
  charges: [
    { label: 'Nuitée chambre (2 nuitées)', amount: '90 000 FCFA' },
    { label: 'Personne supplémentaire', amount: '0 FCFA' },
    { label: 'Extras', amount: '20 000 FCFA' },
    { label: 'Frais de services', amount: '5 000 FCFA' },
  ],
  subtotal: '200 000 FCFA',
  total: '200 000 FCFA',
  paymentMethod: 'Wave',
  paymentLogo: 'client-detail/icons/wave-logo.webp',
};

export const CLIENT_DETAILS: Record<string, ClientDetailData> = {
  '1': {
    identity: {
      name: 'Landry Bamba',
      phone: '+225 07 58 23 41 89',
      email: 'jm.koffi@gmail.com',
      portrait: 'shared/people/profile-01.webp',
      documents: SHARED_DOCUMENTS,
    },
    stay: {
      arrival: 'Lundi 15 juin 2026',
      departure: 'Lundi 15 juin 2026',
      guestCount: '1 Adulte',
      roomType: 'Chambre deluxe',
      roomNumber: '123',
      rate: '45 000 / nuitée',
      category: 'Villa',
      address: 'Abidjan Cocody',
    },
    summary: SHARED_SUMMARY,
  },
  '2': {
    identity: {
      name: 'Koné Ibrahim',
      phone: '+225 05 44 11 82 33',
      email: 'kone.ibrahim@mail.com',
      portrait: 'shared/people/profile-01.webp',
      documents: SHARED_DOCUMENTS,
    },
    stay: {
      arrival: 'Jeudi 14 avril 2026',
      departure: 'Lundi 18 avril 2026',
      guestCount: '2 Adultes',
      roomType: 'Chambre double',
      roomNumber: 'G-05',
      rate: '55 000 / nuitée',
      category: 'Hôtel',
      address: 'Plateau, Abidjan',
    },
    summary: {
      ...SHARED_SUMMARY,
      charges: [
        { label: 'Nuitée chambre (4 nuitées)', amount: '180 000 FCFA' },
        { label: 'Personne supplémentaire', amount: '10 000 FCFA' },
        { label: 'Extras', amount: '15 000 FCFA' },
        { label: 'Frais de services', amount: '5 000 FCFA' },
      ],
      subtotal: '210 000 FCFA',
      total: '210 000 FCFA',
    },
  },
  '3': {
    identity: {
      name: 'Soro Mireille',
      phone: '+225 01 23 44 56 78',
      email: 'mireille.soro@mail.com',
      portrait: 'shared/people/profile-01.webp',
      documents: SHARED_DOCUMENTS,
    },
    stay: {
      arrival: 'Samedi 09 avril 2026',
      departure: 'Lundi 11 avril 2026',
      guestCount: '1 Adulte',
      roomType: 'Single Bed',
      roomNumber: 'G-05',
      rate: '45 000 / nuitée',
      category: 'Résidence',
      address: 'Cocody Riviera',
    },
    summary: SHARED_SUMMARY,
  },
  '4': {
    identity: {
      name: 'Bamba Ismael',
      phone: '+225 07 77 21 65 09',
      email: 'ismael.bamba@mail.com',
      portrait: 'shared/people/profile-01.webp',
      documents: SHARED_DOCUMENTS,
    },
    stay: {
      arrival: 'Samedi 02 avril 2026',
      departure: 'Mardi 05 avril 2026',
      guestCount: '3 Adultes',
      roomType: 'Suite premium',
      roomNumber: 'B-12',
      rate: '80 000 / nuitée',
      category: 'Suite',
      address: 'Marcory Zone 4',
    },
    summary: {
      ...SHARED_SUMMARY,
      charges: [
        { label: 'Nuitée chambre (3 nuitées)', amount: '240 000 FCFA' },
        { label: 'Personne supplémentaire', amount: '15 000 FCFA' },
        { label: 'Extras', amount: '20 000 FCFA' },
        { label: 'Frais de services', amount: '8 000 FCFA' },
      ],
      subtotal: '283 000 FCFA',
      total: '283 000 FCFA',
    },
  },
  '5': {
    identity: {
      name: 'Yao Charline',
      phone: '+225 05 09 18 27 43',
      email: 'charline.yao@mail.com',
      portrait: 'shared/people/profile-01.webp',
      documents: SHARED_DOCUMENTS,
    },
    stay: {
      arrival: 'Lundi 28 mars 2026',
      departure: 'Mardi 29 mars 2026',
      guestCount: '1 Adulte',
      roomType: 'Double Bed',
      roomNumber: 'A-09',
      rate: '50 000 / nuitée',
      category: 'Villa',
      address: 'Deux Plateaux',
    },
    summary: SHARED_SUMMARY,
  },
  '6': {
    identity: {
      name: 'Boni Jordan',
      phone: '+225 07 11 44 92 18',
      email: 'jordan.boni@mail.com',
      portrait: 'shared/people/profile-01.webp',
      documents: SHARED_DOCUMENTS,
    },
    stay: {
      arrival: 'Vendredi 18 mars 2026',
      departure: 'Mardi 22 mars 2026',
      guestCount: '2 Adultes',
      roomType: 'Chambre deluxe',
      roomNumber: 'C-03',
      rate: '60 000 / nuitée',
      category: 'Hôtel',
      address: 'Biétry, Abidjan',
    },
    summary: {
      ...SHARED_SUMMARY,
      charges: [
        { label: 'Nuitée chambre (4 nuitées)', amount: '220 000 FCFA' },
        { label: 'Personne supplémentaire', amount: '0 FCFA' },
        { label: 'Extras', amount: '12 000 FCFA' },
        { label: 'Frais de services', amount: '6 000 FCFA' },
      ],
      subtotal: '238 000 FCFA',
      total: '238 000 FCFA',
    },
  },
};

export const DEFAULT_SPACE_ID = '1';

export const STATUS_ORDER: Record<ReservationHistoryTone, number> = {
  active: 0,
  completed: 1,
  cancelled: 2,
};

const FRENCH_MONTHS: Record<string, number> = {
  janvier: 0,
  fevrier: 1,
  mars: 2,
  avril: 3,
  mai: 4,
  juin: 5,
  juillet: 6,
  aout: 7,
  septembre: 8,
  octobre: 9,
  novembre: 10,
  decembre: 11,
};

export const SHARED_HISTORY_ROWS: readonly ReservationHistoryEntry[] = [
  {
    id: 'history-01',
    spaceId: '2',
    thumbnail: 'shared/rooms/room-photo-02.webp',
    title: 'Suite panoramic',
    subtitle: 'Hôtel Riviera Golf',
    bookingDate: 'Mardi 12 mai 2026',
    stayPeriod: '12 mai 2026 - 14 mai 2026',
    amount: '120 000 FCFA',
    amountValue: 120000,
    createdAt: 202605120930,
    status: 'Terminée',
    tone: 'completed',
  },
  {
    id: 'history-02',
    spaceId: '3',
    thumbnail: 'shared/rooms/room-photo-04.webp',
    title: 'Chambre business',
    subtitle: 'Résidence Marcory',
    bookingDate: 'Jeudi 08 avril 2026',
    stayPeriod: '08 avril 2026 - 10 avril 2026',
    amount: '95 000 FCFA',
    amountValue: 95000,
    createdAt: 202604081100,
    status: 'Terminée',
    tone: 'completed',
  },
  {
    id: 'history-03',
    spaceId: '1',
    thumbnail: 'shared/rooms/room-photo-03.webp',
    title: 'Studio executive',
    subtitle: 'Abidjan Cocody',
    bookingDate: 'Lundi 15 mars 2026',
    stayPeriod: '15 mars 2026 - 16 mars 2026',
    amount: '65 000 FCFA',
    amountValue: 65000,
    createdAt: 202603150845,
    status: 'Annulée',
    tone: 'cancelled',
  },
];

export const CLIENT_DETAIL_KEYS = Object.keys(CLIENT_DETAILS);

function normalizeDateLabel(label: string): string {
  return label
    .toLowerCase()
    .normalize('NFD')
    .split(/[̀-ͯ]/g)
    .join('');
}

function parseFrenchDate(label: string): Date | null {
  const normalizedLabel = normalizeDateLabel(label);
  const match = /(\d{1,2})\s+([a-z]+)\s+(\d{4})/.exec(normalizedLabel);

  if (!match) {
    return null;
  }

  const day = Number(match[1]);
  const month = FRENCH_MONTHS[match[2] ?? ''];
  const year = Number(match[3]);

  if (!Number.isFinite(day) || month === undefined || !Number.isFinite(year)) {
    return null;
  }

  return new Date(year, month, day, 12, 0, 0, 0);
}

export function toDateValue(label: string): number {
  return parseFrenchDate(label)?.getTime() ?? 0;
}

export function resolveSpaceId(rawId: string | null | undefined): string {
  if (!rawId) {
    return DEFAULT_SPACE_ID;
  }

  return rawId;
}

export function buildCurrentHistoryEntry(
  clientId: string,
  spaceId: string,
  client: ClientDetailData,
): ReservationHistoryEntry {
  const amountDigits = client.summary.total.match(/\d+/g)?.join('') ?? '0';

  return {
    id: clientId + '-current',
    spaceId,
    thumbnail:
      client.summary.thumbnails[0] ?? 'shared/rooms/room-photo-03.webp',
    title: client.stay.roomType,
    subtitle: client.stay.category + ' · ' + client.stay.roomNumber,
    bookingDate: client.stay.arrival,
    stayPeriod: client.stay.arrival + ' - ' + client.stay.departure,
    amount: client.summary.total,
    amountValue: Number(amountDigits) || 0,
    createdAt: 202606150900 + Number(clientId),
    status: 'En cours',
    tone: 'active',
  };
}

export function resolveClientId(rawId: string): string {
  if (CLIENT_DETAILS[rawId]) {
    return rawId;
  }

  const numericId = Number(rawId);
  if (
    Number.isFinite(numericId) &&
    numericId > 0 &&
    CLIENT_DETAIL_KEYS.length
  ) {
    const normalizedIndex =
      (((Math.trunc(numericId) - 1) % CLIENT_DETAIL_KEYS.length) +
        CLIENT_DETAIL_KEYS.length) %
      CLIENT_DETAIL_KEYS.length;

    return CLIENT_DETAIL_KEYS[normalizedIndex] ?? DEFAULT_CLIENT_ID;
  }

  return DEFAULT_CLIENT_ID;
}

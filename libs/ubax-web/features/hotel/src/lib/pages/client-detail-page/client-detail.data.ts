export type ClientDocument = {
  readonly label: string;};

export type ReservationCharge = {
  readonly label: string;
  readonly amount: string;};

export type ClientIdentity = {
  readonly name: string;
  readonly phone: string;
  readonly email: string;
  readonly portrait: string;
  readonly documents: readonly ClientDocument[];};

export type ClientStayDetails = {
  readonly arrival: string;
  readonly departure: string;
  readonly guestCount: string;
  readonly roomType: string;
  readonly roomNumber: string;
  readonly rate: string;
  readonly category: string;
  readonly address: string;};

export type ClientReservationSummary = {
  readonly thumbnails: readonly string[];
  readonly charges: readonly ReservationCharge[];
  readonly subtotal: string;
  readonly total: string;
  readonly paymentMethod: string;
  readonly paymentLogo: string;};

export type ClientDetailData = {
  readonly identity: ClientIdentity;
  readonly stay: ClientStayDetails;
  readonly summary: ClientReservationSummary;};

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

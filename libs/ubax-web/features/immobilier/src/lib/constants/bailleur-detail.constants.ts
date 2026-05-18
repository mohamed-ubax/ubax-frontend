import type {
  BailleurRevenueCard,
  BailleurDocument,
  BailleurPayment,
  BailleurProperty,
} from '../types/bailleur-detail.types';

export const REVENUE_CARDS: readonly BailleurRevenueCard[] = [
  {
    label: 'Revenus totaux',
    value: '1 750 000 FCFA',
    tone: 'accent',
  },
  {
    label: 'Commission Agence',
    value: '250 000 FCFA',
    tone: 'navy',
  },
  {
    label: 'total versés',
    value: '1 500 000 FCFA',
    tone: 'success',
  },
] as const;

export const DOCUMENTS: readonly BailleurDocument[] = [
  { name: 'Contrat de Gestion' },
  { name: 'RIB' },
  { name: "Pièce d'identité" },
] as const;

export const PAYMENTS: readonly BailleurPayment[] = [
  {
    logo: 'biens/bailleur/payment-orange.webp',
    title: 'Paiement Location',
    property: 'Immeuble kalia',
    amount: '+ 600 000 FCFA',
    period: 'Février 2026',
    date: '2 Avril 2026 à 17 : 41',
  },
  {
    logo: 'biens/bailleur/payment-wave.webp',
    title: 'Paiement Location',
    property: 'Immeuble kalia',
    amount: '+ 450 000 FCFA',
    period: 'Mars 2026',
    date: '5 Avril 2026 à 12 : 30',
  },
  {
    logo: 'biens/bailleur/payment-wave.webp',
    title: 'Paiement Location',
    property: 'Immeuble kalia',
    amount: '+ 450 000 FCFA',
    period: 'Mars 2026',
    date: '5 Avril 2026 à 12 : 30',
  },
] as const;

export const PROPERTIES: readonly BailleurProperty[] = [
  {
    image: 'biens/list/list-property-07.webp',
    title: 'Immeuble kalia',
    location: 'Abidjan, Cocody',
    tenant: 'Armand Tano',
    tenantRole: 'Locataire',
    tenantAvatar: 'hotel-dashboard/properties/tenant-armand.webp',
    price: '765 000 FCFA',
    status: 'Location',
    statusTone: 'accent',
  },
  {
    image: 'biens/list/grid-property-06.webp',
    title: 'Immeuble kalia',
    location: 'Abidjan, Cocody',
    tenant: 'Fatoumata Traoré',
    tenantRole: 'Client',
    tenantAvatar: 'biens/list/grid-tenant-06.webp',
    price: '900 000 FCFA',
    status: 'En ligne',
    statusTone: 'info',
  },
  {
    image: 'biens/list/grid-property-02.webp',
    title: 'Immeuble kalia',
    location: 'Abidjan, Cocody',
    tenant: 'Landry Bamba',
    tenantRole: 'Locataire',
    tenantAvatar: 'biens/bailleur/tenant-02.webp',
    price: '600 000 FCFA',
    status: 'Vendus',
    statusTone: 'success',
  },
] as const;

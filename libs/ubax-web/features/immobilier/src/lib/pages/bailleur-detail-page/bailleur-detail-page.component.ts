import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

type BailleurRevenueCard = {
  readonly label: string;
  readonly value: string;
  readonly tone: 'accent' | 'navy' | 'success';};

type BailleurDocument = {
  readonly name: string;};

type BailleurPayment = {
  readonly logo: string;
  readonly title: string;
  readonly property: string;
  readonly amount: string;
  readonly period: string;
  readonly date: string;};

type BailleurProperty = {
  readonly image: string;
  readonly title: string;
  readonly location: string;
  readonly tenant: string;
  readonly tenantRole: string;
  readonly tenantAvatar: string;
  readonly price: string;
  readonly status: string;
  readonly statusTone: 'accent' | 'success' | 'info';};

const REVENUE_CARDS: readonly BailleurRevenueCard[] = [
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

const DOCUMENTS: readonly BailleurDocument[] = [
  { name: 'Contrat de Gestion' },
  { name: 'RIB' },
  { name: 'Pièce d’identité' },
] as const;

const PAYMENTS: readonly BailleurPayment[] = [
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

const PROPERTIES: readonly BailleurProperty[] = [
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

@Component({
  selector: 'ubax-bailleur-detail-page',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './bailleur-detail-page.component.html',
  styleUrl: './bailleur-detail-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BailleurDetailPageComponent {
  protected readonly revenueCards = REVENUE_CARDS;
  protected readonly documents = DOCUMENTS;
  protected readonly payments = PAYMENTS;
  protected readonly properties = PROPERTIES;
}

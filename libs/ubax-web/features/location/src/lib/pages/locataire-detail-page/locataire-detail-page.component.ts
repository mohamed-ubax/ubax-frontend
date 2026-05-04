import { Location } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

type LocataireInfoItem = {
  readonly icon: string;
  readonly text: string;
  readonly tone: 'phone' | 'mail' | 'id-card' | 'work' | 'calendar' | 'file';};

type LocataireDocument = {
  readonly name: string;};

type LocatairePaymentItem = {
  readonly logo: string;
  readonly title: string;
  readonly amount: string;
  readonly period: string;
  readonly date: string;
  readonly widePeriod: boolean;};

const ASSET_ROOT = 'reservations/locataire-detail';

const LOCATAIRE_DETAIL_ASSETS = {
  backShell: `${ASSET_ROOT}/icons/back-shell.webp`,
  backArrow: `${ASSET_ROOT}/icons/back-arrow.webp`,
  actionShell: `${ASSET_ROOT}/icons/action-shell.webp`,
  docActionShell: `${ASSET_ROOT}/icons/doc-action-shell.webp`,
  propertyActionShell: `${ASSET_ROOT}/icons/property-action-shell.webp`,
  cancel: `${ASSET_ROOT}/icons/cancel.webp`,
  edit: `${ASSET_ROOT}/icons/edit.webp`,
  phone: `${ASSET_ROOT}/icons/phone.webp`,
  mail: `${ASSET_ROOT}/icons/mail.webp`,
  idCard: `${ASSET_ROOT}/icons/id-card.webp`,
  work: `${ASSET_ROOT}/icons/work.webp`,
  file: `${ASSET_ROOT}/icons/file.webp`,
  calendar: `${ASSET_ROOT}/icons/calendar.webp`,
  documentTitle: `${ASSET_ROOT}/icons/document-title.webp`,
  document: `${ASSET_ROOT}/icons/document.webp`,
  eye: `${ASSET_ROOT}/icons/eye.webp`,
  download: `${ASSET_ROOT}/icons/download.webp`,
  historyTitle: `${ASSET_ROOT}/icons/history-title.webp`,
  paymentCheck: `${ASSET_ROOT}/icons/payment-check.webp`,
  paymentChevron: `${ASSET_ROOT}/icons/payment-chevron.webp`,
  location: `${ASSET_ROOT}/icons/location.webp`,
  propertyOpenArrow: `${ASSET_ROOT}/icons/property-open-arrow.webp`,
  starFilled: `${ASSET_ROOT}/icons/star-filled.webp`,
  starEmpty: `${ASSET_ROOT}/icons/star-empty.webp`,
  profileHero: `${ASSET_ROOT}/media/profile-hero.webp`,
  propertyMain: `${ASSET_ROOT}/media/property-main.webp`,
  propertyTenant: `${ASSET_ROOT}/media/property-tenant.webp`,
  paymentOrange: `${ASSET_ROOT}/media/payment-orange.webp`,
  paymentWave: `${ASSET_ROOT}/media/payment-wave.webp`,
} as const;

const CONTACT_ITEMS: readonly LocataireInfoItem[] = [
  {
    icon: LOCATAIRE_DETAIL_ASSETS.phone,
    text: '+225 07 58 23 41 89',
    tone: 'phone',
  },
  {
    icon: LOCATAIRE_DETAIL_ASSETS.mail,
    text: 'jm.koffi@gmail.com',
    tone: 'mail',
  },
  {
    icon: LOCATAIRE_DETAIL_ASSETS.idCard,
    text: 'UBX-LOC-0245',
    tone: 'id-card',
  },
] as const;

const STATUS_ITEMS: readonly LocataireInfoItem[] = [
  {
    icon: LOCATAIRE_DETAIL_ASSETS.work,
    text: 'Ingénieur BTP',
    tone: 'work',
  },
  {
    icon: LOCATAIRE_DETAIL_ASSETS.file,
    text: 'Salarié',
    tone: 'file',
  },
] as const;

const CONTRACT_ITEMS: readonly LocataireInfoItem[] = [
  {
    icon: LOCATAIRE_DETAIL_ASSETS.calendar,
    text: 'Date d’entrée : 12 Janvier 2025',
    tone: 'calendar',
  },
  {
    icon: LOCATAIRE_DETAIL_ASSETS.calendar,
    text: 'Fin du bail : 12 Janvier 2026',
    tone: 'calendar',
  },
  {
    icon: LOCATAIRE_DETAIL_ASSETS.calendar,
    text: 'Durée du bail : 12 mois',
    tone: 'calendar',
  },
] as const;

const DOCUMENTS: readonly LocataireDocument[] = [
  { name: 'Contrat de bail signé' },
  { name: 'État des lieux d’entrée' },
  { name: 'Reçu de caution' },
  { name: 'Reçu avance' },
  { name: 'CNI ivoirienne' },
] as const;

const PAYMENT_HISTORY: readonly LocatairePaymentItem[] = [
  {
    logo: LOCATAIRE_DETAIL_ASSETS.paymentOrange,
    title: 'Paiement Location',
    amount: '+ 600 000 FCFA',
    period: 'Février 2026',
    date: '2 Avril 2026 à 17 : 41',
    widePeriod: true,
  },
  {
    logo: LOCATAIRE_DETAIL_ASSETS.paymentWave,
    title: 'Paiement Location',
    amount: '+ 450 000 FCFA',
    period: 'Mars 2026',
    date: '5 Avril 2026 à 12 : 30',
    widePeriod: false,
  },
  {
    logo: LOCATAIRE_DETAIL_ASSETS.paymentWave,
    title: 'Paiement Location',
    amount: '+ 450 000 FCFA',
    period: 'Mars 2026',
    date: '5 Avril 2026 à 12 : 30',
    widePeriod: false,
  },
  {
    logo: LOCATAIRE_DETAIL_ASSETS.paymentWave,
    title: 'Paiement Location',
    amount: '+ 450 000 FCFA',
    period: 'Mars 2026',
    date: '5 Avril 2026 à 12 : 30',
    widePeriod: false,
  },
] as const;

const RATING_STARS = [
  LOCATAIRE_DETAIL_ASSETS.starFilled,
  LOCATAIRE_DETAIL_ASSETS.starFilled,
  LOCATAIRE_DETAIL_ASSETS.starFilled,
  LOCATAIRE_DETAIL_ASSETS.starFilled,
  LOCATAIRE_DETAIL_ASSETS.starEmpty,
] as const;

@Component({
  selector: 'ubax-locataire-detail-page',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './locataire-detail-page.component.html',
  styleUrl: './locataire-detail-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LocataireDetailPageComponent {
  private readonly location = inject(Location);

  protected readonly assets = LOCATAIRE_DETAIL_ASSETS;
  protected readonly contactItems = CONTACT_ITEMS;
  protected readonly statusItems = STATUS_ITEMS;
  protected readonly contractItems = CONTRACT_ITEMS;
  protected readonly documents = DOCUMENTS;
  protected readonly payments = PAYMENT_HISTORY;
  protected readonly ratingStars = RATING_STARS;

  protected goBack(): void {
    this.location.back();
  }
}

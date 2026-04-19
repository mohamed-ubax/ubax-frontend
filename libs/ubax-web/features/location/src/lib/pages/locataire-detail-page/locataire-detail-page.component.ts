import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

interface LocataireInfoGroup {
  readonly title: string;
  readonly items: readonly { icon: string; text: string }[];
}

interface LocataireDocument {
  readonly name: string;
}

interface LocatairePaymentItem {
  readonly logo: string;
  readonly title: string;
  readonly amount: string;
  readonly period: string;
  readonly date: string;
}

const INFO_GROUPS: readonly LocataireInfoGroup[] = [
  {
    title: 'Coordonnées',
    items: [
      { icon: 'pi pi-phone', text: '+225 07 58 23 41 89' },
      { icon: 'pi pi-envelope', text: 'jm.koffi@gmail.com' },
      { icon: 'pi pi-id-card', text: 'UBX-LOC-0245' },
    ],
  },
  {
    title: 'Situation',
    items: [
      { icon: 'pi pi-briefcase', text: 'Ingénieur BTP' },
      { icon: 'pi pi-user', text: 'Salarié' },
    ],
  },
  {
    title: 'Contrat',
    items: [
      { icon: 'pi pi-calendar', text: 'Date d’entrée : 12 Janvier 2025' },
      { icon: 'pi pi-calendar', text: 'Fin du bail : 12 Janvier 2026' },
      { icon: 'pi pi-clock', text: 'Durée du bail : 12 mois' },
    ],
  },
] as const;

const DOCUMENTS: readonly LocataireDocument[] = [
  { name: 'Facture' },
  { name: 'État des lieux d’entrée' },
  { name: 'CNI ivoirienne' },
] as const;

const PAYMENT_HISTORY: readonly LocatairePaymentItem[] = [
  {
    logo: 'biens/bailleur/payment-orange.webp',
    title: 'Paiement Location',
    amount: '+ 600 000 FCFA',
    period: 'Février 2026',
    date: '2 Avril 2026 à 17 : 41',
  },
  {
    logo: 'biens/bailleur/payment-wave.webp',
    title: 'Paiement Location',
    amount: '+ 450 000 FCFA',
    period: 'Mars 2026',
    date: '5 Avril 2026 à 12 : 30',
  },
  {
    logo: 'biens/bailleur/payment-wave.webp',
    title: 'Paiement Location',
    amount: '+ 450 000 FCFA',
    period: 'Mars 2026',
    date: '5 Avril 2026 à 12 : 30',
  },
  {
    logo: 'biens/bailleur/payment-wave.webp',
    title: 'Paiement Location',
    amount: '+ 450 000 FCFA',
    period: 'Mars 2026',
    date: '5 Avril 2026 à 12 : 30',
  },
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
  protected readonly infoGroups = INFO_GROUPS;
  protected readonly documents = DOCUMENTS;
  protected readonly payments = PAYMENT_HISTORY;
}

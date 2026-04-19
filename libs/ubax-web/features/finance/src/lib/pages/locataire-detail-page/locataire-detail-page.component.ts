import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  FINANCE_TENANT_DOCUMENTS,
  FINANCE_TENANT_INFO,
  FINANCE_TENANT_PAYMENTS,
} from '../../finance-ui.data';

const TENANT_PROFILE = {
  name: 'Landry Bamba',
  role: 'Locataire',
  avatar: 'shared/people/profile-01.webp',
  propertyImage: 'shared/rooms/room-photo-01.webp',
  propertyTitle: 'Résidence Plateau',
  propertyLocation: 'Abidjan, Plateau',
  rentAmount: '350 000 FCFA',
  propertyStatus: 'Location',
} as const;

const INFO_GROUPS = [
  {
    title: 'Coordonnées',
    items: FINANCE_TENANT_INFO[0].items,
  },
  {
    title: 'Situation',
    items: FINANCE_TENANT_INFO[1].items,
  },
  {
    title: 'Contrat',
    items: FINANCE_TENANT_INFO[2].items,
  },
] as const;

const PAYMENT_STATE = {
  unpaid: '0',
  remaining: '4',
  paid: '8',
} as const;

@Component({
  selector: 'ubax-finance-locataire-detail-page',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './locataire-detail-page.component.html',
  styleUrl: './locataire-detail-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FinanceLocataireDetailPageComponent {
  protected readonly tenant = TENANT_PROFILE;
  protected readonly paymentState = PAYMENT_STATE;
  protected readonly infoGroups = INFO_GROUPS;
  protected readonly documents = FINANCE_TENANT_DOCUMENTS;
  protected readonly payments = FINANCE_TENANT_PAYMENTS;
}

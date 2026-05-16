import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import type {
  BailleurDocument,
  BailleurPayment,
  BailleurProperty,
  BailleurRevenueCard,
} from '../../types/bailleur-detail.types';
import {
  DOCUMENTS,
  PAYMENTS,
  PROPERTIES,
  REVENUE_CARDS,
} from '../../constants/bailleur-detail.constants';

@Component({
  selector: 'ubax-bailleur-detail-page',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './bailleur-detail-page.component.html',
  styleUrl: './bailleur-detail-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BailleurDetailPageComponent {
  protected readonly revenueCards: readonly BailleurRevenueCard[] = REVENUE_CARDS;
  protected readonly documents: readonly BailleurDocument[] = DOCUMENTS;
  protected readonly payments: readonly BailleurPayment[] = PAYMENTS;
  protected readonly properties: readonly BailleurProperty[] = PROPERTIES;
}

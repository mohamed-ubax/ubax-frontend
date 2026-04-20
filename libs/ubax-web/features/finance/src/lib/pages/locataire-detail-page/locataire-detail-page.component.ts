import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  FINANCE_TENANT_DOCUMENTS,
  FINANCE_TENANT_INFO,
  FINANCE_TENANT_PAYMENTS,
  FINANCE_TENANT_PAYMENT_STATE,
  FINANCE_TENANT_PROFILE,
} from '../../finance-ui.data';

@Component({
  selector: 'ubax-finance-locataire-detail-page',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './locataire-detail-page.component.html',
  styleUrl: './locataire-detail-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FinanceLocataireDetailPageComponent {
  protected readonly tenant = FINANCE_TENANT_PROFILE;
  protected readonly paymentState = FINANCE_TENANT_PAYMENT_STATE;
  protected readonly infoCards = FINANCE_TENANT_INFO;
  protected readonly contactCard = FINANCE_TENANT_INFO[0];
  protected readonly sideInfoCards = FINANCE_TENANT_INFO.slice(1);
  protected readonly documents = FINANCE_TENANT_DOCUMENTS;
  protected readonly payments = FINANCE_TENANT_PAYMENTS;
}

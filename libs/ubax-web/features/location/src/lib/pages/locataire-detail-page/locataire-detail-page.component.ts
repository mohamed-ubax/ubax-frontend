import { Location } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  LOCATAIRE_DETAIL_ASSETS,
  CONTACT_ITEMS,
  STATUS_ITEMS,
  CONTRACT_ITEMS,
  LOCATAIRE_DOCUMENTS,
  PAYMENT_HISTORY,
  RATING_STARS,
} from '../../constants/locataire-detail.constants';

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
  protected readonly documents = LOCATAIRE_DOCUMENTS;
  protected readonly payments = PAYMENT_HISTORY;
  protected readonly ratingStars = RATING_STARS;

  protected goBack(): void {
    this.location.back();
  }
}

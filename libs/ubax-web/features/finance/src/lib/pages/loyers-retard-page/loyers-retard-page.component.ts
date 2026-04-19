import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { UbaxPaginatorComponent } from '@ubax-workspace/shared-ui';
import { FINANCE_ASSETS, FINANCE_OVERDUE_ROWS } from '../../finance-ui.data';

@Component({
  selector: 'ubax-loyers-retard-page',
  standalone: true,
  imports: [RouterLink, UbaxPaginatorComponent],
  templateUrl: './loyers-retard-page.component.html',
  styleUrl: './loyers-retard-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoyersRetardPageComponent {
  protected readonly assets = FINANCE_ASSETS;
  protected readonly rows = FINANCE_OVERDUE_ROWS;
  protected readonly currentPage = signal(3);
  protected readonly totalPages = 5;
}

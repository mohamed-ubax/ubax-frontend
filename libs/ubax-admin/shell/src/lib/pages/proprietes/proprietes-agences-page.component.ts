import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ProprietesPublishedListPageComponent } from './proprietes-published-list-page.component';

@Component({
  selector: 'ubax-admin-proprietes-agences-page',
  standalone: true,
  imports: [ProprietesPublishedListPageComponent],
  template: `
    <ubax-admin-proprietes-published-list
      pageTitle="Liste propriétés agence immobilière"
      scope="agencies"
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProprietesAgencesPageComponent {}

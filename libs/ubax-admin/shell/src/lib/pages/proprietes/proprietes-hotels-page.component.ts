import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ProprietesPublishedListPageComponent } from './proprietes-published-list-page.component';

@Component({
  selector: 'ubax-admin-proprietes-hotels-page',
  standalone: true,
  imports: [ProprietesPublishedListPageComponent],
  template: `
    <ubax-admin-proprietes-published-list
      pageTitle="Liste propriétés hôtels"
      scope="hotels"
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProprietesHotelsPageComponent {}

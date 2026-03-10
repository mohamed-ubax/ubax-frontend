import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { PublicShellComponent } from '@ubax-workspace/ubax-portal-layout';

@Component({
  selector: 'ubax-info-page',
  imports: [PublicShellComponent, RouterLink],
  templateUrl: './info-page.component.html',
  styleUrl: './info-page.component.css',
})
export class InfoPageComponent {
  private readonly route = inject(ActivatedRoute);

  protected readonly title = this.route.snapshot.data['pageTitle'] as string;
  protected readonly description = this.route.snapshot.data[
    'pageDescription'
  ] as string;
}

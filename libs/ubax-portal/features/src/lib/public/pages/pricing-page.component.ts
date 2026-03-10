import { Component } from '@angular/core';
import { PublicShellComponent } from '@ubax-workspace/ubax-portal-layout';
import { UiButtonComponent, UiCardComponent } from '@ubax-workspace/shared-ui';

@Component({
  selector: 'ubax-pricing-page',
  imports: [PublicShellComponent, UiButtonComponent, UiCardComponent],
  templateUrl: './pricing-page.component.html',
  styleUrl: './pricing-page.component.scss',
})
export class PricingPageComponent {}

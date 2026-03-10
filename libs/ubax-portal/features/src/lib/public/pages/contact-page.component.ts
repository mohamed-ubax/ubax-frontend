import { Component } from '@angular/core';
import { PublicShellComponent } from '@ubax-workspace/ubax-portal-layout';
import { UiButtonComponent, UiInputComponent } from '@ubax-workspace/shared-ui';

@Component({
  selector: 'ubax-contact-page',
  imports: [PublicShellComponent, UiButtonComponent, UiInputComponent],
  templateUrl: './contact-page.component.html',
  styleUrl: './contact-page.component.scss',
})
export class ContactPageComponent {}

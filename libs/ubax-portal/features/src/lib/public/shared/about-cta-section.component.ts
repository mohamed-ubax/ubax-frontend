import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'ubax-about-cta-section',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './about-cta-section.component.html',
  styleUrl: './about-cta-section.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AboutCtaSectionComponent {}

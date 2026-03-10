import { Component, input } from '@angular/core';

@Component({
  selector: 'ubax-ui-card',
  standalone: true,
  templateUrl: './ui-card.component.html',
  styleUrl: './ui-card.component.scss',
})
export class UiCardComponent {
  readonly elevated = input(false);
  readonly tone = input<'default' | 'soft' | 'dark'>('default');
}

import { Component, input } from '@angular/core';

@Component({
  selector: 'ubax-ui-input',
  standalone: true,
  imports: [],
  templateUrl: './ui-input.component.html',
  styleUrl: './ui-input.component.scss',
})
export class UiInputComponent {
  readonly label = input('');
  readonly placeholder = input('');
  readonly type = input<'text' | 'email' | 'password' | 'tel'>('text');
  readonly value = input('');
}

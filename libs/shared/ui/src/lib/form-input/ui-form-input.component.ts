import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';

@Component({
  selector: 'ubax-ui-form-input',
  standalone: true,
  templateUrl: './ui-form-input.component.html',
  styleUrl: './ui-form-input.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiFormInputComponent {
  readonly label = input('');
  readonly placeholder = input('');
  readonly type = input<string>('text');
  readonly inputMode = input<string>('');
  readonly value = model('');
}

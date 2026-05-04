import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';

export type UiFormInputVariant = 'default' | 'drawer';

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
  readonly variant = input<UiFormInputVariant>('default');
  readonly invalid = input(false);
  readonly disabled = input(false);
  /** Affichage non éditable sans style `disabled` (meilleure lisibilité en lecture seule). */
  readonly readOnly = input(false);
  readonly value = model('');
}

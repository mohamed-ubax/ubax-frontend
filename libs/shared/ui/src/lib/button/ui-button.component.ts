import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'ubax-ui-button',
  standalone: true,
  templateUrl: './ui-button.component.html',
  styleUrl: './ui-button.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiButtonComponent {
  readonly variant = input<'primary' | 'dark' | 'ghost' | 'outline'>('dark');
  readonly block = input(false);
  readonly type = input<'button' | 'submit' | 'reset'>('button');
  readonly disabled = input(false);
  readonly shadowed = input(false);
}

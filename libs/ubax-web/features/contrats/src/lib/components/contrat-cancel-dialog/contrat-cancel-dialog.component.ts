import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';

@Component({
  selector: 'ubax-contrat-cancel-dialog',
  standalone: true,
  templateUrl: './contrat-cancel-dialog.component.html',
  styleUrl: './contrat-cancel-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContratCancelDialogComponent {
  readonly loading = input<boolean>(false);
  readonly confirm = output<void>();
  readonly dismissed = output<void>();
}

import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'ubax-contrat-terminate-dialog',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './contrat-terminate-dialog.component.html',
  styleUrl: './contrat-terminate-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContratTerminateDialogComponent {
  readonly loading = input<boolean>(false);
  readonly confirm = output<string>();
  readonly dismissed = output<void>();

  readonly reason = signal('');

  submit(): void {
    const r = this.reason().trim();
    if (!r) return;
    this.confirm.emit(r);
  }
}

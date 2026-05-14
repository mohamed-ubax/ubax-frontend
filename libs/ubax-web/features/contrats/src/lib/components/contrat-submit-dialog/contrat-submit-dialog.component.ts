import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import { ContractResponse } from '@ubax-workspace/ubax-web-data-access';

@Component({
  selector: 'ubax-contrat-submit-dialog',
  standalone: true,
  templateUrl: './contrat-submit-dialog.component.html',
  styleUrl: './contrat-submit-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContratSubmitDialogComponent {
  readonly contrat = input.required<ContractResponse>();
  readonly loading = input<boolean>(false);
  readonly confirm = output<void>();
  readonly cancel = output<void>();

  formatAmount(amount: number | undefined): string {
    if (!amount) return '—';
    return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA';
  }
}

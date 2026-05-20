import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  inject,
  input,
  output,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { ContractResponse } from '@ubax-workspace/ubax-web-data-access';

@Component({
  selector: 'ubax-contrat-submit-dialog',
  standalone: true,
  templateUrl: './contrat-submit-dialog.component.html',
  styleUrl: './contrat-submit-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContratSubmitDialogComponent implements OnInit, OnDestroy {
  private readonly doc = inject(DOCUMENT);

  readonly contrat = input.required<ContractResponse>();
  readonly loading = input<boolean>(false);
  readonly confirm = output<void>();
  readonly dismissed = output<void>();

  ngOnInit(): void {
    this.doc.body.classList.add('ubax-overlay-open');
  }

  ngOnDestroy(): void {
    this.doc.body.classList.remove('ubax-overlay-open');
  }

  formatAmount(amount: number | undefined): string {
    if (!amount) return '—';
    return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA';
  }
}

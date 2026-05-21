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
  selector: 'ubax-contrat-activate-dialog',
  standalone: true,
  templateUrl: './contrat-activate-dialog.component.html',
  styleUrl: './contrat-activate-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContratActivateDialogComponent implements OnInit, OnDestroy {
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

  formatAmount(amount: number | undefined | null): string {
    if (amount == null) return '—';
    return `${new Intl.NumberFormat('fr-FR').format(amount)} FCFA`;
  }

  formatDate(date: string | undefined | null): string {
    if (!date) return '—';

    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) {
      return '—';
    }

    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }).format(parsed);
  }

  formatPaymentDay(day: number | undefined | null): string {
    if (day == null) return '—';
    return `Chaque ${day} du mois`;
  }

  resolveTotalMonthlyAmount(): number | undefined {
    const contract = this.contrat();
    return (
      contract.totalMonthlyAmount ??
      ((contract.monthlyRent ?? 0) + (contract.monthlyCharges ?? 0) ||
        undefined)
    );
  }
}

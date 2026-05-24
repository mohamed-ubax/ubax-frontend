import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  OnDestroy,
  OnInit,
  output,
  signal,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PaymentCreateRequest } from '@ubax-workspace/shared-api-types';

const PAYMENT_TYPE_OPTIONS: { value: PaymentCreateRequest['paymentType']; label: string }[] = [
  { value: 'RENT', label: 'Loyer' },
  { value: 'DEPOSIT', label: 'Caution' },
  { value: 'CHARGES', label: 'Charges' },
  { value: 'COMMISSION', label: 'Commission' },
  { value: 'SALE', label: 'Vente' },
];

const PAYMENT_METHOD_OPTIONS: { value: NonNullable<PaymentCreateRequest['paymentMethod']>; label: string }[] = [
  { value: 'CASH', label: 'Espèces' },
  { value: 'BANK_TRANSFER', label: 'Virement bancaire' },
  { value: 'MOBILE_MONEY', label: 'Mobile Money' },
  { value: 'CHECK', label: 'Chèque' },
];

@Component({
  selector: 'ubax-nouvelle-transaction-dialog',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './nouvelle-transaction-dialog.component.html',
  styleUrl: './nouvelle-transaction-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NouvelleTransactionDialogComponent implements OnInit, OnDestroy {
  private readonly doc = inject(DOCUMENT);

  readonly loading = input<boolean>(false);
  readonly error = input<string | null>(null);
  readonly confirm = output<PaymentCreateRequest>();
  readonly dismissed = output<void>();

  protected readonly paymentTypeOptions = PAYMENT_TYPE_OPTIONS;
  protected readonly paymentMethodOptions = PAYMENT_METHOD_OPTIONS;

  protected readonly form = signal<PaymentCreateRequest>({
    paymentType: 'RENT',
    amount: 0,
    dueDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'MOBILE_MONEY',
  });

  ngOnInit(): void {
    this.doc.body.classList.add('ubax-overlay-open');
  }

  ngOnDestroy(): void {
    this.doc.body.classList.remove('ubax-overlay-open');
  }

  protected patch(partial: Partial<PaymentCreateRequest>): void {
    this.form.update((f) => ({ ...f, ...partial }));
  }

  protected submit(): void {
    const f = this.form();
    if (!f.paymentType || !f.amount || !f.dueDate) return;
    this.confirm.emit(f);
  }

  protected isValid(): boolean {
    const f = this.form();
    return !!f.paymentType && f.amount > 0 && !!f.dueDate;
  }
}

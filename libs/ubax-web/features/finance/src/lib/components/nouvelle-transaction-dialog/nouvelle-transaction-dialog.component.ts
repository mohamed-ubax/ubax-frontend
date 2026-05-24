import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { PaymentCreateRequest } from '@ubax-workspace/shared-api-types';
import {
  UiFormSelectComponent,
  UiFormInputComponent,
  UiFormDatePickerComponent,
} from '@ubax-workspace/shared-ui';

const PAYMENT_TYPE_OPTIONS = [
  { value: 'RENT', label: 'Loyer' },
  { value: 'DEPOSIT', label: 'Caution' },
  { value: 'CHARGES', label: 'Charges' },
  { value: 'COMMISSION', label: 'Commission' },
  { value: 'SALE', label: 'Vente' },
];

const PAYMENT_METHOD_OPTIONS = [
  { value: '', label: '— Non renseigné' },
  { value: 'CASH', label: 'Espèces' },
  { value: 'BANK_TRANSFER', label: 'Virement bancaire' },
  { value: 'MOBILE_MONEY', label: 'Mobile Money' },
  { value: 'CHECK', label: 'Chèque' },
];

function toIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

@Component({
  selector: 'ubax-nouvelle-transaction-dialog',
  standalone: true,
  imports: [UiFormSelectComponent, UiFormInputComponent, UiFormDatePickerComponent],
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

  protected readonly paymentType = signal('RENT');
  protected readonly paymentMethod = signal('MOBILE_MONEY');
  protected readonly amount = signal('0');
  protected readonly amountPaid = signal('');
  protected readonly dueDate = signal<Date>(new Date());
  protected readonly hasPaidDate = signal(false);
  protected readonly paidDate = signal<Date>(new Date());
  protected readonly periodLabel = signal('');
  protected readonly reference = signal('');
  protected readonly note = signal('');

  protected readonly isValid = computed(
    () => !!this.paymentType() && +this.amount() > 0,
  );

  ngOnInit(): void {
    this.doc.body.classList.add('ubax-overlay-open');
  }

  ngOnDestroy(): void {
    this.doc.body.classList.remove('ubax-overlay-open');
  }

  protected submit(): void {
    if (!this.isValid() || this.loading()) return;
    const body: PaymentCreateRequest = {
      paymentType: this.paymentType() as PaymentCreateRequest['paymentType'],
      amount: +this.amount(),
      dueDate: toIsoDate(this.dueDate()),
      paymentMethod: (this.paymentMethod() ||
        undefined) as PaymentCreateRequest['paymentMethod'],
      amountPaid: this.amountPaid() ? +this.amountPaid() : undefined,
      paidDate: this.hasPaidDate() ? toIsoDate(this.paidDate()) : undefined,
      periodLabel: this.periodLabel() || undefined,
      reference: this.reference() || undefined,
      note: this.note() || undefined,
    };
    this.confirm.emit(body);
  }
}

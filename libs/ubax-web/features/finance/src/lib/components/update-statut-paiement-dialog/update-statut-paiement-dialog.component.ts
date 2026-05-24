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
import { PaymentStatusUpdateRequest } from '@ubax-workspace/shared-api-types';
import {
  UiFormSelectComponent,
  UiFormInputComponent,
} from '@ubax-workspace/shared-ui';

const STATUS_OPTIONS = [
  { value: 'PAID', label: 'Payé' },
  { value: 'PENDING', label: 'En attente' },
  { value: 'PARTIAL', label: 'Partiel' },
  { value: 'LATE', label: 'En retard' },
  { value: 'CANCELLED', label: 'Annulé' },
];

const PAYMENT_METHOD_OPTIONS = [
  { value: '', label: '— Non renseigné' },
  { value: 'CASH', label: 'Espèces' },
  { value: 'BANK_TRANSFER', label: 'Virement bancaire' },
  { value: 'MOBILE_MONEY', label: 'Mobile Money' },
  { value: 'CHECK', label: 'Chèque' },
];

@Component({
  selector: 'ubax-update-statut-paiement-dialog',
  standalone: true,
  imports: [UiFormSelectComponent, UiFormInputComponent],
  templateUrl: './update-statut-paiement-dialog.component.html',
  styleUrl: './update-statut-paiement-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UpdateStatutPaiementDialogComponent implements OnInit, OnDestroy {
  private readonly doc = inject(DOCUMENT);

  readonly loading = input<boolean>(false);
  readonly error = input<string | null>(null);
  readonly currentStatus = input<string>('PENDING');
  readonly confirm = output<PaymentStatusUpdateRequest>();
  readonly dismissed = output<void>();

  protected readonly statusOptions = STATUS_OPTIONS;
  protected readonly paymentMethodOptions = PAYMENT_METHOD_OPTIONS;

  protected readonly status = signal('PAID');
  protected readonly paymentMethod = signal('');
  protected readonly amountPaid = signal('');
  protected readonly paidDate = signal('');
  protected readonly receiptUrl = signal('');
  protected readonly note = signal('');

  protected readonly isValid = computed(() => !!this.status());

  ngOnInit(): void {
    this.status.set(this.currentStatus() || 'PAID');
    this.doc.body.classList.add('ubax-overlay-open');
  }

  ngOnDestroy(): void {
    this.doc.body.classList.remove('ubax-overlay-open');
  }

  protected submit(): void {
    if (!this.isValid() || this.loading()) return;
    const body: PaymentStatusUpdateRequest = {
      status: this.status() as PaymentStatusUpdateRequest['status'],
      paymentMethod: (this.paymentMethod() ||
        undefined) as PaymentStatusUpdateRequest['paymentMethod'],
      amountPaid: this.amountPaid() ? +this.amountPaid() : undefined,
      paidDate: this.paidDate() || undefined,
      receiptUrl: this.receiptUrl() || undefined,
      note: this.note() || undefined,
    };
    this.confirm.emit(body);
  }
}

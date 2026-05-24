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
import { ExpenseCreateRequest } from '@ubax-workspace/shared-api-types';
import {
  UiFormSelectComponent,
  UiFormInputComponent,
  UiFormDatePickerComponent,
} from '@ubax-workspace/shared-ui';

const CATEGORY_OPTIONS = [
  { value: 'MAINTENANCE', label: 'Entretien / Maintenance' },
  { value: 'MARKETING', label: 'Marketing' },
  { value: 'SALARY', label: 'Salaire' },
  { value: 'UTILITIES', label: 'Charges / Utilities' },
  { value: 'TAX', label: 'Taxes' },
  { value: 'OTHER', label: 'Autre' },
];

const COST_CENTER_OPTIONS = [
  { value: 'AGENCY_GENERAL', label: 'Agence (général)' },
  { value: 'PROPERTY_SPECIFIC', label: 'Bien spécifique' },
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
  selector: 'ubax-nouvelle-depense-dialog',
  standalone: true,
  imports: [UiFormSelectComponent, UiFormInputComponent, UiFormDatePickerComponent],
  templateUrl: './nouvelle-depense-dialog.component.html',
  styleUrl: './nouvelle-depense-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NouvelleDepenseDialogComponent implements OnInit, OnDestroy {
  private readonly doc = inject(DOCUMENT);

  readonly loading = input<boolean>(false);
  readonly error = input<string | null>(null);
  readonly confirm = output<ExpenseCreateRequest>();
  readonly dismissed = output<void>();

  protected readonly categoryOptions = CATEGORY_OPTIONS;
  protected readonly costCenterOptions = COST_CENTER_OPTIONS;
  protected readonly paymentMethodOptions = PAYMENT_METHOD_OPTIONS;

  protected readonly category = signal('MAINTENANCE');
  protected readonly costCenter = signal('AGENCY_GENERAL');
  protected readonly amount = signal('0');
  protected readonly expenseDate = signal<Date>(new Date());
  protected readonly label = signal('');
  protected readonly provider = signal('');
  protected readonly paymentMethod = signal('');
  protected readonly invoiceReference = signal('');
  protected readonly note = signal('');

  protected readonly isValid = computed(
    () => !!this.category() && !!this.costCenter() && +this.amount() > 0,
  );

  ngOnInit(): void {
    this.doc.body.classList.add('ubax-overlay-open');
  }

  ngOnDestroy(): void {
    this.doc.body.classList.remove('ubax-overlay-open');
  }

  protected submit(): void {
    if (!this.isValid() || this.loading()) return;
    const body: ExpenseCreateRequest = {
      category: this.category() as ExpenseCreateRequest['category'],
      costCenter: this.costCenter() as ExpenseCreateRequest['costCenter'],
      amount: +this.amount(),
      expenseDate: toIsoDate(this.expenseDate()),
      label: this.label() || undefined,
      provider: this.provider() || undefined,
      paymentMethod: (this.paymentMethod() ||
        undefined) as ExpenseCreateRequest['paymentMethod'],
      invoiceReference: this.invoiceReference() || undefined,
      note: this.note() || undefined,
    };
    this.confirm.emit(body);
  }
}

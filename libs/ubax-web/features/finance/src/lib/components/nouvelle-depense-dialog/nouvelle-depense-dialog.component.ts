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
import { ExpenseCreateRequest } from '@ubax-workspace/shared-api-types';

const CATEGORY_OPTIONS: { value: ExpenseCreateRequest['category']; label: string }[] = [
  { value: 'MAINTENANCE', label: 'Entretien / Maintenance' },
  { value: 'MARKETING', label: 'Marketing' },
  { value: 'SALARY', label: 'Salaire' },
  { value: 'UTILITIES', label: 'Charges / Utilities' },
  { value: 'TAX', label: 'Taxes' },
  { value: 'OTHER', label: 'Autre' },
];

const COST_CENTER_OPTIONS: { value: ExpenseCreateRequest['costCenter']; label: string }[] = [
  { value: 'AGENCY_GENERAL', label: 'Agence (général)' },
  { value: 'PROPERTY_SPECIFIC', label: 'Bien spécifique' },
];

const PAYMENT_METHOD_OPTIONS: { value: string; label: string }[] = [
  { value: 'CASH', label: 'Espèces' },
  { value: 'BANK_TRANSFER', label: 'Virement bancaire' },
  { value: 'MOBILE_MONEY', label: 'Mobile Money' },
  { value: 'CHECK', label: 'Chèque' },
];

@Component({
  selector: 'ubax-nouvelle-depense-dialog',
  standalone: true,
  imports: [FormsModule],
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

  protected readonly form = signal<ExpenseCreateRequest>({
    category: 'MAINTENANCE',
    costCenter: 'AGENCY_GENERAL',
    amount: 0,
    expenseDate: new Date().toISOString().split('T')[0],
  });

  ngOnInit(): void {
    this.doc.body.classList.add('ubax-overlay-open');
  }

  ngOnDestroy(): void {
    this.doc.body.classList.remove('ubax-overlay-open');
  }

  protected patch(partial: Partial<ExpenseCreateRequest>): void {
    this.form.update((f) => ({ ...f, ...partial }));
  }

  protected isValid(): boolean {
    const f = this.form();
    return !!f.category && !!f.costCenter && f.amount > 0 && !!f.expenseDate;
  }

  protected submit(): void {
    if (!this.isValid()) return;
    this.confirm.emit(this.form());
  }
}

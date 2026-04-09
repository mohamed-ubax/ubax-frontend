import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
  model,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { DatePickerModule } from 'primeng/datepicker';
import { SelectModule } from 'primeng/select';
import { ButtonModule } from 'primeng/button';

export interface FilterSelectOption {
  label: string;
  value: unknown;
}

export interface FilterSelectConfig {
  placeholder: string;
  options: FilterSelectOption[];
  key: string;
}

@Component({
  selector: 'ubax-filter-bar',
  standalone: true,
  imports: [FormsModule, InputTextModule, DatePickerModule, SelectModule, ButtonModule],
  templateUrl: './filter-bar.component.html',
  styleUrl: './filter-bar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FilterBarComponent {
  readonly showKeyword = input<boolean>(true);
  readonly keywordPlaceholder = input<string>('Mot clé');
  readonly showDateRange = input<boolean>(false);
  readonly selects = input<FilterSelectConfig[]>([]);

  readonly keyword = model<string>('');
  readonly dateDebut = model<Date | null>(null);
  readonly dateFin = model<Date | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly selectValues = model<Record<string, any>>({});

  readonly filter = output<void>();
  readonly reset = output<void>();

  protected onFilter(): void {
    this.filter.emit();
  }

  protected onReset(): void {
    this.keyword.set('');
    this.dateDebut.set(null);
    this.dateFin.set(null);
    this.selectValues.set({});
    this.reset.emit();
  }

  protected onSelectChange(key: string, value: unknown): void {
    this.selectValues.update((prev) => ({ ...prev, [key]: value }));
  }
}

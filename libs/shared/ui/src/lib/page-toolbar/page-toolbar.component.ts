import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
  model,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePickerModule } from 'primeng/datepicker';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'ubax-page-toolbar',
  standalone: true,
  imports: [FormsModule, DatePickerModule, InputTextModule, ButtonModule],
  templateUrl: './page-toolbar.component.html',
  styleUrl: './page-toolbar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PageToolbarComponent {
  readonly searchPlaceholder = input<string>('Rechercher…');
  readonly showSearch = input<boolean>(true);
  readonly showDate = input<boolean>(true);
  readonly showExport = input<boolean>(true);

  readonly searchValue = model<string>('');
  readonly dateValue = model<Date | null>(null);

  readonly exportClick = output<void>();

  protected onExport(): void {
    this.exportClick.emit();
  }
}

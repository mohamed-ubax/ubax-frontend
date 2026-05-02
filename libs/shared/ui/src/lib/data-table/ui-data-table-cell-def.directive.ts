import { Directive, TemplateRef, input } from '@angular/core';
import { UiDataTableCellContext } from './ui-data-table.types';

@Directive({
  selector: 'ng-template[ubaxDataTableCell]',
  standalone: true,
})
export class UiDataTableCellDefDirective {
  readonly key = input.required<string>({ alias: 'ubaxDataTableCell' });

  constructor(
    readonly templateRef: TemplateRef<UiDataTableCellContext<object>>,
  ) {}
}

import { Directive, TemplateRef, input } from '@angular/core';
import { UiDataTableCellContext } from './ui-data-table.types';

@Directive({
  selector: 'ng-template[ubaxDataTableCell]',
  standalone: true,
})
export class UiDataTableCellDefDirective {
  readonly key = input.required<string>({ alias: 'ubaxDataTableCell' });

  constructor(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    readonly templateRef: TemplateRef<UiDataTableCellContext<any>>,
  ) {}
}

@Directive({
  selector: 'ng-template[ubaxDataTableEmpty]',
  standalone: true,
})
export class UiDataTableEmptyDefDirective {
  constructor(readonly templateRef: TemplateRef<void>) {}
}

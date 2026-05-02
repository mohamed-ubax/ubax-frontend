import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  TemplateRef,
  contentChildren,
  input,
} from '@angular/core';
import { UiDataTableCellDefDirective } from './ui-data-table-cell-def.directive';
import {
  UiDataTableCellContext,
  UiDataTableColumn,
} from './ui-data-table.types';

@Component({
  selector: 'ubax-ui-data-table',
  standalone: true,
  imports: [NgTemplateOutlet],
  templateUrl: './ui-data-table.component.html',
  styleUrl: './ui-data-table.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiDataTableComponent {
// eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly columns = input.required<readonly UiDataTableColumn<any>[]>();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly rows = input.required<readonly any[]>();
  readonly rowIdKey = input<string>('id');
  readonly emptyStateLabel = input<string>('Aucune donnée disponible.');

  private readonly cellDefs = contentChildren(UiDataTableCellDefDirective);

  protected cellTemplate(
    key: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): TemplateRef<UiDataTableCellContext<any>> | null {
    return (
      this.cellDefs().find((cellDef) => cellDef.key() === key)?.templateRef ??
      null
    );
  }

  protected resolveCellValue(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    row: any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    column: UiDataTableColumn<any>,
  ): string | number | null | undefined {
    if (column.value) {
      return column.value(row);
    }

    const rawValue = (row as Record<string, unknown>)[column.key];
    return typeof rawValue === 'string' || typeof rawValue === 'number'
      ? rawValue
      : null;
  }

  protected trackRow(index: number, row: unknown): string | number {
    const id = (row as Record<string, unknown>)[this.rowIdKey()];

    return typeof id === 'string' || typeof id === 'number' ? id : index;
  }
}

import { Component, input, output, contentChildren, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { PaginatorModule } from 'primeng/paginator';
import { SkeletonModule } from 'primeng/skeleton';
import { StatusBadgeComponent } from '../status-badge/status-badge.component';

export interface TableColumn {
  field:      string;
  header:     string;
  sortable?:  boolean;
  width?:     string;
  align?:     'left' | 'center' | 'right';
}

/**
 * UbaxDataTable — Styled data table matching the Figma table design
 *
 * Features:
 * - Header row with #f7f7f7 background, 15px medium text
 * - Body rows with hover state (#f8faff)
 * - Alternating stripe option
 * - Integrated paginator
 * - Loading skeleton state
 *
 * Usage:
 * ```html
 * <ubax-data-table
 *   [columns]="columns"
 *   [data]="hotels"
 *   [loading]="isLoading"
 *   [totalRecords]="total"
 *   (pageChange)="onPageChange($event)"
 * >
 *   <ng-template #actions let-row>
 *     <button>Voir</button>
 *   </ng-template>
 * </ubax-data-table>
 * ```
 */
@Component({
  selector: 'ubax-data-table',
  standalone: true,
  imports: [
    CommonModule,
    TableModule,
    PaginatorModule,
    SkeletonModule,
    StatusBadgeComponent,
  ],
  template: `
    <div class="bg-surface-card rounded-xl shadow-card overflow-hidden">
      <!-- Optional table header slot (title + actions) -->
      <ng-content select="[tableHeader]" />

      <p-table
        [value]="loading() ? skeletonRows : data()"
        [columns]="columns()"
        [rowHover]="true"
        [scrollable]="scrollable()"
        [scrollHeight]="scrollHeight()"
        styleClass="ubax-table"
        [tableStyle]="{ 'min-width': minWidth() }"
      >
        <!-- Header -->
        <ng-template pTemplate="header" let-columns>
          <tr class="bg-neutral-100 border-b border-neutral-300">
            @for (col of columns; track col.field) {
              <th
                class="px-4 py-3 text-xl font-medium text-neutral-950
                       text-left whitespace-nowrap select-none"
                [style.width]="col.width"
                [class.text-center]="col.align === 'center'"
                [class.text-right]="col.align === 'right'"
                [class.cursor-pointer]="col.sortable"
                [pSortableColumn]="col.sortable ? col.field : undefined"
              >
                {{ col.header }}
                @if (col.sortable) {
                  <p-sortIcon [field]="col.field" />
                }
              </th>
            }
            <!-- Actions column -->
            @if (hasActions()) {
              <th class="px-4 py-3 text-xl font-medium text-neutral-950 text-right">
                Actions
              </th>
            }
          </tr>
        </ng-template>

        <!-- Body -->
        <ng-template pTemplate="body" let-row let-columns="columns">
          <tr
            class="border-b border-neutral-300 last:border-0
                   hover:bg-neutral-50 transition-colors duration-fast"
          >
            @if (loading()) {
              @for (col of columns; track col.field) {
                <td class="px-4 py-3">
                  <p-skeleton height="14px" borderRadius="4px" />
                </td>
              }
            } @else {
              @for (col of columns; track col.field) {
                <td
                  class="px-4 py-3 text-md font-regular text-neutral-950"
                  [class.text-center]="col.align === 'center'"
                  [class.text-right]="col.align === 'right'"
                >
                  <!-- Custom cell template -->
                  <ng-container
                    *ngTemplateOutlet="
                      getCellTemplate(col.field);
                      context: { $implicit: row, row: row, value: row[col.field] }
                    "
                  />
                  <!-- Fallback: plain value -->
                  @if (!getCellTemplate(col.field)) {
                    {{ row[col.field] }}
                  }
                </td>
              }
              <!-- Actions cell -->
              @if (hasActions()) {
                <td class="px-4 py-3 text-right">
                  <ng-container
                    *ngTemplateOutlet="actionsTemplate; context: { $implicit: row }"
                  />
                </td>
              }
            }
          </tr>
        </ng-template>

        <!-- Empty state -->
        <ng-template pTemplate="emptymessage">
          <tr>
            <td
              [attr.colspan]="columns().length + (hasActions() ? 1 : 0)"
              class="px-4 py-12 text-center text-neutral-500 text-md"
            >
              <ng-content select="[emptyMessage]">
                Aucune donnée disponible
              </ng-content>
            </td>
          </tr>
        </ng-template>
      </p-table>

      <!-- Paginator -->
      @if (paginated() && totalRecords() > 0) {
        <div class="border-t border-neutral-300 px-6 py-3 flex items-center justify-between">
          <p class="text-base text-neutral-500">
            Affichage {{ firstRecord() }} à {{ lastRecord() }} sur
            <strong class="text-neutral-900">{{ totalRecords() }}</strong>
          </p>
          <p-paginator
            [rows]="rows()"
            [totalRecords]="totalRecords()"
            [first]="first()"
            [rowsPerPageOptions]="rowsPerPageOptions()"
            (onPageChange)="onPageChange($event)"
            styleClass="ubax-paginator"
          />
        </div>
      }
    </div>
  `,
})
export class DataTableComponent {
  readonly columns           = input.required<TableColumn[]>();
  readonly data              = input<unknown[]>([]);
  readonly loading           = input<boolean>(false);
  readonly paginated         = input<boolean>(true);
  readonly totalRecords      = input<number>(0);
  readonly rows              = input<number>(10);
  readonly first             = input<number>(0);
  readonly rowsPerPageOptions = input<number[]>([10, 25, 50]);
  readonly scrollable        = input<boolean>(false);
  readonly scrollHeight      = input<string>('400px');
  readonly minWidth          = input<string>('50rem');
  readonly hasActions        = input<boolean>(false);

  readonly pageChange = output<{ first: number; rows: number; page: number }>();

  /** @internal skeleton rows for loading state */
  readonly skeletonRows = Array(8).fill({});

  /** @internal cell templates map — override in subclass or via DI */
  getCellTemplate(_field: string): TemplateRef<unknown> | null {
    return null;
  }

  /** @internal actions template — override in subclass */
  get actionsTemplate(): TemplateRef<unknown> | null {
    return null;
  }

  onPageChange(event: { first: number; rows: number; page: number }): void {
    this.pageChange.emit(event);
  }

  get firstRecord(): () => number {
    return () => this.first() + 1;
  }

  get lastRecord(): () => number {
    return () => Math.min(this.first() + this.rows(), this.totalRecords());
  }
}

import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from '@angular/core';

@Component({
  selector: 'ubax-ui-pagination',
  standalone: true,
  templateUrl: './ui-pagination.component.html',
  styleUrl: './ui-pagination.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiPaginationComponent {
  readonly currentPage = input.required<number>();
  readonly totalPages = input.required<number>();
  readonly arrowLeftSrc = input<string>('');
  readonly arrowRightSrc = input<string>('');
  readonly ariaLabel = input<string>('Pagination');
  readonly variant = input<'default' | 'glass'>('default');

  readonly pageChange = output<number>();

  readonly pages = computed(() =>
    Array.from({ length: this.totalPages() }, (_, i) => i + 1),
  );

  onPageChange(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.pageChange.emit(page);
    }
  }
}

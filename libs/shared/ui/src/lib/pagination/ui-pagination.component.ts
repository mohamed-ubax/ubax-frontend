import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from '@angular/core';

type PaginationItem =
  | {
      kind: 'page';
      page: number;
      trackKey: string;
      ariaLabel: string;
    }
  | {
      kind: 'ellipsis';
      targetPage: number;
      direction: 'backward' | 'forward';
      trackKey: string;
      ariaLabel: string;
    };

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
  readonly compactAfter = input<number>(5);
  readonly edgeWindowSize = input<number>(3);
  readonly siblingCount = input<number>(1);
  readonly ellipsisJump = input<number>(5);
  readonly variant = input<'default' | 'glass' | 'light' | 'members'>(
    'default',
  );

  readonly pageChange = output<number>();

  readonly visibleItems = computed<PaginationItem[]>(() => {
    const totalPages = this.totalPages();

    if (totalPages < 1) {
      return [];
    }

    const currentPage = this.clampPage(this.currentPage());
    const compactAfter = Math.max(1, this.compactAfter());
    const edgeWindowSize = Math.max(1, this.edgeWindowSize());
    const siblingCount = Math.max(0, this.siblingCount());

    if (totalPages <= compactAfter) {
      return this.createPageRange(1, totalPages).map((page) =>
        this.createPageItem(page),
      );
    }

    const visiblePages = new Set<number>();

    visiblePages.add(1);
    visiblePages.add(totalPages);

    if (currentPage <= edgeWindowSize) {
      this.addPageRange(visiblePages, 1, edgeWindowSize, totalPages);
    } else if (currentPage >= totalPages - edgeWindowSize + 1) {
      this.addPageRange(
        visiblePages,
        totalPages - edgeWindowSize + 1,
        totalPages,
        totalPages,
      );
    } else {
      this.addPageRange(
        visiblePages,
        currentPage - siblingCount,
        currentPage + siblingCount,
        totalPages,
      );
    }

    const sortedPages = [...visiblePages].sort((left, right) => left - right);
    const items: PaginationItem[] = [];
    let previousPage: number | null = null;

    for (const page of sortedPages) {
      if (previousPage !== null) {
        const gap = page - previousPage;

        if (gap === 2) {
          items.push(this.createPageItem(previousPage + 1));
        } else if (gap > 2) {
          const direction = page < currentPage ? 'backward' : 'forward';
          const targetPage = this.resolveEllipsisTarget(
            direction,
            previousPage,
            page,
            totalPages,
          );

          items.push(this.createEllipsisItem(direction, targetPage));
        }
      }

      items.push(this.createPageItem(page));
      previousPage = page;
    }

    return items;
  });

  onPageChange(page: number): void {
    const totalPages = this.totalPages();

    if (totalPages < 1) {
      return;
    }

    const nextPage = this.clampPage(page);

    if (nextPage !== this.currentPage()) {
      this.pageChange.emit(nextPage);
    }
  }

  private addPageRange(
    target: Set<number>,
    start: number,
    end: number,
    totalPages: number,
  ): void {
    for (const page of this.createPageRange(start, end, totalPages)) {
      target.add(page);
    }
  }

  private clampPage(page: number): number {
    const totalPages = Math.max(1, this.totalPages());

    return Math.min(Math.max(1, page), totalPages);
  }

  private createEllipsisItem(
    direction: 'backward' | 'forward',
    targetPage: number,
  ): PaginationItem {
    return {
      kind: 'ellipsis',
      targetPage,
      direction,
      trackKey: `${direction}-${targetPage}`,
      ariaLabel: `Aller rapidement à la page ${targetPage}`,
    };
  }

  private createPageItem(page: number): PaginationItem {
    return {
      kind: 'page',
      page,
      trackKey: `page-${page}`,
      ariaLabel: `Page ${page}`,
    };
  }

  private createPageRange(
    start: number,
    end: number,
    totalPages = this.totalPages(),
  ): number[] {
    const normalizedStart = Math.max(1, start);
    const normalizedEnd = Math.min(totalPages, end);

    if (normalizedStart > normalizedEnd) {
      return [];
    }

    return Array.from(
      { length: normalizedEnd - normalizedStart + 1 },
      (_, index) => normalizedStart + index,
    );
  }

  private resolveEllipsisTarget(
    direction: 'backward' | 'forward',
    previousPage: number,
    nextPage: number,
    totalPages: number,
  ): number {
    const jumpSize = Math.max(1, this.ellipsisJump());

    if (direction === 'backward') {
      return Math.max(previousPage + 1, nextPage - jumpSize);
    }

    return Math.min(
      totalPages,
      Math.min(nextPage - 1, previousPage + jumpSize),
    );
  }
}

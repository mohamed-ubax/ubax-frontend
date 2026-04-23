import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  model,
} from '@angular/core';
import { CommonModule } from '@angular/common';

type UbaxPaginatorVariant = 'default' | 'white';

@Component({
  selector: 'ubax-paginator',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ubax-paginator.component.html',
  styleUrl: './ubax-paginator.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UbaxPaginatorComponent {
  readonly currentPage = model<number>(1);
  readonly totalPages = input.required<number>();
  readonly variant = input<UbaxPaginatorVariant>('default');
  readonly previousIconSrc = input<string | null>(null);
  readonly nextIconSrc = input<string | null>(null);

  readonly pages = computed(() =>
    Array.from({ length: this.totalPages() }, (_, i) => i + 1),
  );

  goTo(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
    }
  }

  prev(): void {
    this.goTo(this.currentPage() - 1);
  }
  next(): void {
    this.goTo(this.currentPage() + 1);
  }
}

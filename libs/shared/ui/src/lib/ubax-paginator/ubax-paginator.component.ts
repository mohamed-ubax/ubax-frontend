import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  model,
} from '@angular/core';
import { CommonModule } from '@angular/common';

type UbaxPaginatorVariant = 'default' | 'white';

/** Représente un item de la liste de pages : numéro ou ellipsis */
export type PageItem = { type: 'page'; value: number } | { type: 'ellipsis' };

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

  /**
   * Génère la liste des items à afficher avec ellipsis pour les grandes listes.
   * Ex: [1] [2] [3] [...] [8] [9] [10]  ou  [1] [...] [4] [5] [6] [...] [10]
   */
  readonly pageItems = computed<PageItem[]>(() => {
    const total = this.totalPages();
    const current = this.currentPage();

    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => ({
        type: 'page' as const,
        value: i + 1,
      }));
    }

    const items: PageItem[] = [];
    const delta = 1; // pages autour de la page courante

    const rangeStart = Math.max(2, current - delta);
    const rangeEnd = Math.min(total - 1, current + delta);

    // Toujours la première page
    items.push({ type: 'page', value: 1 });

    // Ellipsis gauche
    if (rangeStart > 2) {
      items.push({ type: 'ellipsis' });
    }

    // Pages autour de la page courante
    for (let i = rangeStart; i <= rangeEnd; i++) {
      items.push({ type: 'page', value: i });
    }

    // Ellipsis droite
    if (rangeEnd < total - 1) {
      items.push({ type: 'ellipsis' });
    }

    // Toujours la dernière page
    items.push({ type: 'page', value: total });

    return items;
  });

  /** Garde la compatibilité avec l'ancien binding `pages` */
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

  trackByItem(_: number, item: PageItem): string {
    return item.type === 'page' ? `page-${item.value}` : `ellipsis-${_}`;
  }
}

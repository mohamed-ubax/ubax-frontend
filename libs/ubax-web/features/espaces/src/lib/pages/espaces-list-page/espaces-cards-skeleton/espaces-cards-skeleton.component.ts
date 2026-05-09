import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Skeleton partiel : uniquement la zone des cards (grille ou liste).
 * Utilisé lors des rechargements (filtre, pagination) quand le header,
 * les summary cards et la toolbar restent visibles.
 */
@Component({
  selector: 'ubax-espaces-cards-skeleton',
  standalone: true,
  template: `
    @if (viewMode() === 'grid') {
      <div class="ecsk-grid">
        @for (i of items; track i) {
          <div class="ecsk-card" [style.--ecsk-delay]="i * 42 + 'ms'">
            <div class="ecsk-card__image"></div>
            <div class="ecsk-card__details">
              <div class="ecsk-line ecsk-line--title"></div>
              <div class="ecsk-line ecsk-line--location"></div>
              <div class="ecsk-line ecsk-line--price"></div>
            </div>
          </div>
        }
      </div>
    } @else {
      <div class="ecsk-list">
        @for (i of listItems; track i) {
          <div class="ecsk-list-card" [style.--ecsk-delay]="i * 42 + 'ms'">
            <div class="ecsk-list-card__media"></div>
            <div class="ecsk-list-card__content">
              <div class="ecsk-line ecsk-line--title"></div>
              <div class="ecsk-line ecsk-line--location"></div>
              <div class="ecsk-line ecsk-line--price"></div>
            </div>
          </div>
        }
      </div>
    }
  `,
  styles: [`
    :host {
      display: block;
      pointer-events: none;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50%       { opacity: 0.45; }
    }

    .ecsk-line {
      border-radius: 6px;
      background: #d4dde4;
      animation: pulse 1.6s ease-in-out infinite;
    }

    .ecsk-line--title    { height: 18px; width: 65%; animation-delay: 0ms; }
    .ecsk-line--location { height: 13px; width: 50%; margin-top: 5px; animation-delay: 60ms; }
    .ecsk-line--price    { height: 18px; width: 45%; margin-top: 8px; animation-delay: 100ms; }

    /* ── Grid ────────────────────────────────────────────────────── */
    .ecsk-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      column-gap: 40px;
      row-gap: 40px;
    }

    .ecsk-card {
      position: relative;
      aspect-ratio: 485 / 431;
      border-radius: 20px;
      overflow: hidden;
      background: #ecf2f7;
      animation: pulse 1.6s ease-in-out infinite;
      animation-delay: var(--ecsk-delay, 0ms);
    }

    .ecsk-card__image {
      width: 100%;
      height: 68%;
      background: #d4dde4;
    }

    .ecsk-card__details {
      position: absolute;
      right: 17px;
      bottom: 14px;
      left: 16px;
      min-height: 100px;
      padding: 12px 17px 13px 16px;
      background: rgb(255 255 255 / 0.88);
      border-radius: 10px;
    }

    /* ── List ────────────────────────────────────────────────────── */
    .ecsk-list {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      column-gap: 18px;
      row-gap: 18px;
    }

    .ecsk-list-card {
      display: grid;
      grid-template-columns: 128px minmax(0, 1fr);
      min-height: 160px;
      border-radius: 18px;
      overflow: hidden;
      background: #ecf2f7;
      animation: pulse 1.6s ease-in-out infinite;
      animation-delay: var(--ecsk-delay, 0ms);
    }

    .ecsk-list-card__media {
      background: #d4dde4;
      border-radius: 14px;
    }

    .ecsk-list-card__content {
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding: 14px;
    }

    /* ── Responsive ──────────────────────────────────────────────── */
    @media (max-width: 1700px) {
      .ecsk-grid {
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }
    }

    @media (max-width: 1320px) {
      .ecsk-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }

    @media (max-width: 920px) {
      .ecsk-grid,
      .ecsk-list {
        grid-template-columns: 1fr;
      }
      .ecsk-list-card {
        grid-template-columns: 1fr;
      }
      .ecsk-list-card__media {
        min-height: 140px;
        border-radius: 14px 14px 0 0;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .ecsk-card,
      .ecsk-list-card,
      .ecsk-line {
        animation: none;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'aria-hidden': 'true' },
})
export class EspacesCardsSkeletonComponent {
  readonly viewMode = input<'grid' | 'list'>('grid');
  readonly count = input(6);

  get items(): number[] {
    return Array.from({ length: this.count() }, (_, i) => i);
  }

  get listItems(): number[] {
    return Array.from({ length: Math.min(this.count(), 4) }, (_, i) => i);
  }
}

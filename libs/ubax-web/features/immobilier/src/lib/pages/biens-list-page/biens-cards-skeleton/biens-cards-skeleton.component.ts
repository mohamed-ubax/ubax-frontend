import {
  ChangeDetectionStrategy,
  Component,
  input,
} from '@angular/core';

/**
 * Skeleton partiel : uniquement la zone des cards (grille ou liste).
 * Utilisé lors des rechargements (filtre, pagination) quand le header,
 * les summary cards et la toolbar restent visibles.
 */
@Component({
  selector: 'ubax-biens-cards-skeleton',
  standalone: true,
  template: `
    @if (viewMode() === 'grid') {
      <div class="bcsk-grid">
        @for (i of items; track i) {
          <div class="bcsk-card" [style.--bcsk-delay]="i * 42 + 'ms'">
            <div class="bcsk-card__image"></div>
            <div class="bcsk-card__panel">
              <div class="bcsk-line bcsk-line--title"></div>
              <div class="bcsk-line bcsk-line--location"></div>
              <div class="bcsk-card__bottom">
                <div class="bcsk-card__tenant">
                  <div class="bcsk-avatar"></div>
                  <div class="bcsk-card__tenant-copy">
                    <div class="bcsk-line bcsk-line--name"></div>
                    <div class="bcsk-line bcsk-line--role"></div>
                  </div>
                </div>
                <div class="bcsk-line bcsk-line--price"></div>
              </div>
            </div>
          </div>
        }
      </div>
    } @else {
      <div class="bcsk-list">
        @for (i of listItems; track i) {
          <div class="bcsk-list-card" [style.--bcsk-delay]="i * 42 + 'ms'">
            <div class="bcsk-list-card__media"></div>
            <div class="bcsk-list-card__content">
              <div class="bcsk-list-card__top">
                <div class="bcsk-line bcsk-line--title"></div>
                <div class="bcsk-line bcsk-line--price"></div>
              </div>
              <div class="bcsk-line bcsk-line--location"></div>
              <div class="bcsk-list-card__bottom">
                <div class="bcsk-card__tenant">
                  <div class="bcsk-avatar"></div>
                  <div class="bcsk-card__tenant-copy">
                    <div class="bcsk-line bcsk-line--name"></div>
                    <div class="bcsk-line bcsk-line--role"></div>
                  </div>
                </div>
              </div>
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

    /* ── Generic lines ───────────────────────────────────────────── */
    .bcsk-line {
      border-radius: 6px;
      background: var(--ubax-border-card, #e8edf2);
      animation: pulse 1.6s ease-in-out infinite;
    }

    .bcsk-line--title    { height: 18px; width: 65%; animation-delay: 0ms; }
    .bcsk-line--location { height: 13px; width: 50%; margin-top: 7px; animation-delay: 60ms; }
    .bcsk-line--name     { height: 14px; width: 80%; animation-delay: 80ms; }
    .bcsk-line--role     { height: 12px; width: 55%; margin-top: 4px; animation-delay: 120ms; }
    .bcsk-line--price    { height: 20px; width: 90px; animation-delay: 100ms; }

    .bcsk-avatar {
      width: 45px;
      height: 47px;
      flex: 0 0 45px;
      border-radius: 50%;
      background: var(--ubax-border-card, #e8edf2);
      animation: pulse 1.6s ease-in-out infinite;
      animation-delay: 200ms;
    }

    /* ── Grid ────────────────────────────────────────────────────── */
    .bcsk-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      column-gap: 41px;
      row-gap: 50px;
    }

    .bcsk-card {
      position: relative;
      aspect-ratio: 485 / 431;
      border-radius: var(--ubax-radius-xl);
      overflow: hidden;
      background: var(--ubax-border-card, #e8edf2);
      animation: pulse 1.6s ease-in-out infinite;
      animation-delay: var(--bcsk-delay, 0ms);
    }

    .bcsk-card__image {
      width: 100%;
      height: 68%;
      background: color-mix(in srgb, var(--ubax-border-card, #e8edf2) 80%, #c5cdd5);
    }

    .bcsk-card__panel {
      position: absolute;
      right: 17px;
      bottom: 14px;
      left: 16px;
      min-height: 141px;
      padding: 12px 17px 13px 16px;
      background: rgb(255 255 255 / 0.88);
      border-radius: 10px;
    }

    .bcsk-card__bottom {
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      gap: 16px;
      margin-top: 18px;
    }

    .bcsk-card__tenant {
      display: flex;
      align-items: center;
      gap: 11px;
    }

    .bcsk-card__tenant-copy {
      display: flex;
      flex-direction: column;
    }

    /* ── List ────────────────────────────────────────────────────── */
    .bcsk-list {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      column-gap: 46px;
      row-gap: 18px;
      padding-top: 2px;
    }

    .bcsk-list-card {
      display: grid;
      grid-template-columns: 227px minmax(0, 1fr);
      min-height: 193px;
      border-radius: var(--ubax-radius-xl);
      overflow: hidden;
      background: var(--ubax-page-bg);
      animation: pulse 1.6s ease-in-out infinite;
      animation-delay: var(--bcsk-delay, 0ms);
    }

    .bcsk-list-card__media {
      width: 227px;
      height: 193px;
      background: var(--ubax-border-card, #e8edf2);
      border-radius: 15px;
    }

    .bcsk-list-card__content {
      display: flex;
      flex-direction: column;
      gap: 10px;
      padding: 16px 22px 19px 25px;
    }

    .bcsk-list-card__top {
      display: flex;
      justify-content: space-between;
      gap: 16px;
    }

    .bcsk-list-card__bottom {
      margin-top: auto;
    }

    /* ── Responsive ──────────────────────────────────────────────── */
    @media (max-width: 1320px) {
      .bcsk-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }

      .bcsk-list {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 960px) {
      .bcsk-grid {
        grid-template-columns: 1fr;
      }

      .bcsk-list-card {
        grid-template-columns: 1fr;
      }

      .bcsk-list-card__media {
        width: 100%;
        border-radius: 15px 15px 0 0;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .bcsk-card,
      .bcsk-list-card,
      .bcsk-line,
      .bcsk-avatar {
        animation: none;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'aria-hidden': 'true' },
})
export class BiensCardsSkeletonComponent {
  readonly viewMode = input<'grid' | 'list'>('grid');
  readonly count = input(6);

  get items(): number[] {
    return Array.from({ length: this.count() }, (_, i) => i);
  }

  get listItems(): number[] {
    return Array.from({ length: Math.min(this.count(), 4) }, (_, i) => i);
  }
}

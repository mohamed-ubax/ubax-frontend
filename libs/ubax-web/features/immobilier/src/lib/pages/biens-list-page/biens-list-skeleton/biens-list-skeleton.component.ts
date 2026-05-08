import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * Skeleton de la page "Mes biens".
 * Reproduit exactement la structure HTML/CSS de la page réelle :
 *  - 4 summary cards
 *  - toolbar (3 filter pills + toggle)
 *  - grille 3 colonnes de bien-cards
 * aria-hidden="true" sur le composant entier.
 */
@Component({
  selector: 'ubax-biens-list-skeleton',
  standalone: true,
  template: `
    <!-- Summary strip : 4 cards -->
    <div class="bsk-summary-strip" aria-hidden="true">
      @for (i of [0, 1, 2, 3]; track i) {
        <div class="bsk-summary-card">
          <div class="bsk-summary-card__orb"></div>
          <div class="bsk-summary-card__content">
            <div class="bsk-line bsk-line--label"></div>
            <div class="bsk-line bsk-line--value"></div>
          </div>
        </div>
      }
    </div>

    <!-- Panel biens -->
    <div class="bsk-panel">
      <!-- Toolbar skeleton -->
      <div class="bsk-toolbar">
        <div class="bsk-toolbar__filters">
          <div class="bsk-pill bsk-pill--type"></div>
          <div class="bsk-pill bsk-pill--category"></div>
          <div class="bsk-pill bsk-pill--status"></div>
          <div class="bsk-pill bsk-pill--action"></div>
        </div>
        <div class="bsk-toggle"></div>
      </div>

      <!-- Grille 3 colonnes -->
      <div class="bsk-grid">
        @for (i of [0, 1, 2, 3, 4, 5]; track i) {
          <div class="bsk-card" [style.--bsk-delay]="i * 42 + 'ms'">
            <div class="bsk-card__image"></div>
            <div class="bsk-card__panel">
              <div class="bsk-line bsk-line--title"></div>
              <div class="bsk-line bsk-line--location"></div>
              <div class="bsk-card__bottom">
                <div class="bsk-card__tenant">
                  <div class="bsk-avatar"></div>
                  <div class="bsk-card__tenant-copy">
                    <div class="bsk-line bsk-line--name"></div>
                    <div class="bsk-line bsk-line--role"></div>
                  </div>
                </div>
                <div class="bsk-line bsk-line--price"></div>
              </div>
            </div>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      pointer-events: none;
    }

    /* ── Pulse animation ─────────────────────────────────────────── */
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50%       { opacity: 0.45; }
    }

    .bsk-summary-strip {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 32px;
      margin-bottom: 37px;
    }

    .bsk-summary-card {
      display: flex;
      align-items: center;
      gap: 22px;
      min-height: 135px;
      padding: 25px 22px 24px 30px;
      background: var(--ubax-surface);
      border: 1px solid var(--ubax-border-card);
      border-radius: var(--ubax-radius-xl);
      box-shadow: var(--ubax-shadow-card-soft);
    }

    .bsk-summary-card__orb {
      width: 88px;
      height: 84px;
      flex: 0 0 88px;
      border-radius: 50%;
      background: var(--ubax-border-card, #e8edf2);
      animation: pulse 1.6s ease-in-out infinite;
    }

    .bsk-summary-card__content {
      flex: 1 1 auto;
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    /* ── Generic skeleton lines ──────────────────────────────────── */
    .bsk-line {
      border-radius: 6px;
      background: var(--ubax-border-card, #e8edf2);
      animation: pulse 1.6s ease-in-out infinite;
    }

    .bsk-line--label  { height: 16px; width: 70%; animation-delay: 80ms; }
    .bsk-line--value  { height: 20px; width: 40%; animation-delay: 160ms; }
    .bsk-line--title  { height: 18px; width: 65%; animation-delay: 0ms; }
    .bsk-line--location { height: 13px; width: 50%; margin-top: 7px; animation-delay: 60ms; }
    .bsk-line--name   { height: 14px; width: 80%; animation-delay: 80ms; }
    .bsk-line--role   { height: 12px; width: 55%; margin-top: 4px; animation-delay: 120ms; }
    .bsk-line--price  { height: 20px; width: 90px; animation-delay: 100ms; }

    /* ── Panel ───────────────────────────────────────────────────── */
    .bsk-panel {
      padding: 44px 35px 40px;
      background: var(--ubax-surface);
      border-radius: var(--ubax-radius-xl);
    }

    /* ── Toolbar ─────────────────────────────────────────────────── */
    .bsk-toolbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 24px;
      margin-bottom: 38px;
    }

    .bsk-toolbar__filters {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 19px;
    }

    .bsk-pill {
      height: 56px;
      border-radius: 999px;
      background: var(--ubax-border-card, #e8edf2);
      animation: pulse 1.6s ease-in-out infinite;
    }

    .bsk-pill--type     { width: 239px; animation-delay: 0ms; }
    .bsk-pill--category { width: 204px; animation-delay: 60ms; }
    .bsk-pill--status   { width: 172px; animation-delay: 120ms; }
    .bsk-pill--action   { width: 142px; animation-delay: 180ms; }

    .bsk-toggle {
      width: 124px;
      height: 62px;
      border-radius: 999px;
      background: var(--ubax-border-card, #e8edf2);
      flex-shrink: 0;
      animation: pulse 1.6s ease-in-out infinite;
      animation-delay: 240ms;
    }

    /* ── Grid ────────────────────────────────────────────────────── */
    .bsk-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      column-gap: 41px;
      row-gap: 50px;
    }

    .bsk-card {
      position: relative;
      aspect-ratio: 485 / 431;
      border-radius: var(--ubax-radius-xl);
      overflow: hidden;
      background: var(--ubax-border-card, #e8edf2);
      animation: pulse 1.6s ease-in-out infinite;
      animation-delay: var(--bsk-delay, 0ms);
    }

    .bsk-card__image {
      width: 100%;
      height: 68%;
      background: color-mix(in srgb, var(--ubax-border-card, #e8edf2) 80%, #c5cdd5);
    }

    .bsk-card__panel {
      position: absolute;
      right: 17px;
      bottom: 14px;
      left: 16px;
      min-height: 141px;
      padding: 12px 17px 13px 16px;
      background: rgb(255 255 255 / 0.88);
      border-radius: 10px;
    }

    .bsk-card__bottom {
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      gap: 16px;
      margin-top: 18px;
    }

    .bsk-card__tenant {
      display: flex;
      align-items: center;
      gap: 11px;
    }

    .bsk-avatar {
      width: 45px;
      height: 47px;
      flex: 0 0 45px;
      border-radius: 50%;
      background: var(--ubax-border-card, #e8edf2);
      animation: pulse 1.6s ease-in-out infinite;
      animation-delay: 200ms;
    }

    .bsk-card__tenant-copy {
      display: flex;
      flex-direction: column;
    }

    /* ── Responsive ──────────────────────────────────────────────── */
    @media (max-width: 1320px) {
      .bsk-summary-strip,
      .bsk-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }

    @media (max-width: 960px) {
      .bsk-summary-strip,
      .bsk-grid {
        grid-template-columns: 1fr;
      }

      .bsk-panel {
        padding: 24px 18px 32px;
      }

      .bsk-toolbar {
        flex-direction: column;
        align-items: stretch;
      }

      .bsk-pill--type,
      .bsk-pill--category,
      .bsk-pill--status,
      .bsk-pill--action {
        width: 100%;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .bsk-line,
      .bsk-pill,
      .bsk-toggle,
      .bsk-card,
      .bsk-avatar,
      .bsk-summary-card__orb {
        animation: none;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'aria-hidden': 'true' },
})
export class BiensListSkeletonComponent {}

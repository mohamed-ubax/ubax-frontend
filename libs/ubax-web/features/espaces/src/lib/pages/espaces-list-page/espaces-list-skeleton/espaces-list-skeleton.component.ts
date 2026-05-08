import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * Skeleton pleine page "Mes espaces".
 * Reproduit exactement la structure de la page réelle :
 *  - 4 summary cards
 *  - toolbar (2 filter pills + toggle + bouton)
 *  - grille 3 colonnes de room-cards
 * aria-hidden="true" sur le composant entier.
 */
@Component({
  selector: 'ubax-espaces-list-skeleton',
  standalone: true,
  template: `
    <!-- Summary strip : 4 cards -->
    <div class="esk-summary-strip" aria-hidden="true">
      @for (i of [0, 1, 2, 3]; track i) {
        <div class="esk-summary-card">
          <div class="esk-summary-card__icon"></div>
          <div class="esk-summary-card__content">
            <div class="esk-line esk-line--label"></div>
            <div class="esk-line esk-line--value"></div>
          </div>
        </div>
      }
    </div>

    <!-- Panel espaces -->
    <div class="esk-panel">
      <!-- Toolbar skeleton -->
      <div class="esk-toolbar">
        <div class="esk-toolbar__filters">
          <div class="esk-pill esk-pill--type"></div>
          <div class="esk-pill esk-pill--status"></div>
          <div class="esk-pill esk-pill--action"></div>
        </div>
        <div class="esk-toolbar__actions">
          <div class="esk-toggle"></div>
          <div class="esk-pill esk-pill--add"></div>
        </div>
      </div>

      <!-- Grille 3 colonnes -->
      <div class="esk-grid">
        @for (i of [0, 1, 2, 3, 4, 5]; track i) {
          <div class="esk-card" [style.--esk-delay]="i * 42 + 'ms'">
            <div class="esk-card__image"></div>
            <div class="esk-card__details">
              <div class="esk-line esk-line--title"></div>
              <div class="esk-line esk-line--location"></div>
              <div class="esk-line esk-line--price"></div>
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

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50%       { opacity: 0.45; }
    }

    /* ── Summary strip ───────────────────────────────────────────── */
    .esk-summary-strip {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 21px;
      padding: 18px;
      background: #fff;
      border-radius: 20px;
      margin-bottom: 20px;
    }

    .esk-summary-card {
      display: flex;
      align-items: center;
      gap: 21px;
      min-height: 115px;
      padding: 24px 22px;
      background: #ecf2f7;
      border-radius: 10px;
    }

    .esk-summary-card__icon {
      width: 62px;
      height: 62px;
      flex: 0 0 62px;
      border-radius: 50%;
      background: #d4dde4;
      animation: pulse 1.6s ease-in-out infinite;
    }

    .esk-summary-card__content {
      flex: 1 1 auto;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    /* ── Generic lines ───────────────────────────────────────────── */
    .esk-line {
      border-radius: 6px;
      background: #d4dde4;
      animation: pulse 1.6s ease-in-out infinite;
    }

    .esk-line--label    { height: 14px; width: 70%; animation-delay: 80ms; }
    .esk-line--value    { height: 20px; width: 40%; animation-delay: 160ms; }
    .esk-line--title    { height: 18px; width: 65%; animation-delay: 0ms; }
    .esk-line--location { height: 13px; width: 50%; margin-top: 5px; animation-delay: 60ms; }
    .esk-line--price    { height: 18px; width: 45%; margin-top: 8px; animation-delay: 100ms; }

    /* ── Panel ───────────────────────────────────────────────────── */
    .esk-panel {
      padding: 30px 44px 40px;
      background: #fff;
      border-radius: 20px;
    }

    /* ── Toolbar ─────────────────────────────────────────────────── */
    .esk-toolbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 22px;
      margin-bottom: 34px;
    }

    .esk-toolbar__filters,
    .esk-toolbar__actions {
      display: flex;
      align-items: center;
      gap: 20px;
    }

    .esk-pill {
      height: 56px;
      border-radius: 999px;
      background: #ecf2f7;
      animation: pulse 1.6s ease-in-out infinite;
    }

    .esk-pill--type   { width: 239px; animation-delay: 0ms; }
    .esk-pill--status { width: 172px; animation-delay: 60ms; }
    .esk-pill--action { width: 142px; animation-delay: 120ms; }
    .esk-pill--add    { width: 225px; height: 62px; animation-delay: 200ms; }

    .esk-toggle {
      width: 124px;
      height: 62px;
      border-radius: 999px;
      background: #ecf2f7;
      flex-shrink: 0;
      animation: pulse 1.6s ease-in-out infinite;
      animation-delay: 160ms;
    }

    /* ── Grid ────────────────────────────────────────────────────── */
    .esk-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      column-gap: 40px;
      row-gap: 40px;
    }

    .esk-card {
      position: relative;
      aspect-ratio: 485 / 431;
      border-radius: 20px;
      overflow: hidden;
      background: #ecf2f7;
      animation: pulse 1.6s ease-in-out infinite;
      animation-delay: var(--esk-delay, 0ms);
    }

    .esk-card__image {
      width: 100%;
      height: 68%;
      background: #d4dde4;
    }

    .esk-card__details {
      position: absolute;
      right: 17px;
      bottom: 14px;
      left: 16px;
      min-height: 100px;
      padding: 12px 17px 13px 16px;
      background: rgb(255 255 255 / 0.88);
      border-radius: 10px;
    }

    /* ── Responsive ──────────────────────────────────────────────── */
    @media (max-width: 1700px) {
      .esk-grid {
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }
    }

    @media (max-width: 1320px) {
      .esk-summary-strip {
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }
      .esk-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
      .esk-toolbar {
        flex-direction: column;
        align-items: stretch;
      }
      .esk-toolbar__filters,
      .esk-toolbar__actions {
        justify-content: space-between;
      }
    }

    @media (max-width: 920px) {
      .esk-summary-strip {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
      .esk-panel {
        padding: 24px 18px 28px;
      }
      .esk-grid {
        grid-template-columns: 1fr;
      }
      .esk-pill--type,
      .esk-pill--status,
      .esk-pill--action,
      .esk-pill--add {
        width: 100%;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .esk-line,
      .esk-pill,
      .esk-toggle,
      .esk-card,
      .esk-summary-card__icon {
        animation: none;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'aria-hidden': 'true' },
})
export class EspacesListSkeletonComponent {}

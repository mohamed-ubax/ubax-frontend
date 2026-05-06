import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';

/**
 * Skeleton de la zone table + pagination droite.
 * Reproduit exactement la structure de `.agency-members-page__table-stage`
 * avec un header de table simulé et N lignes animées.
 *
 * Le nombre de lignes correspond à MEMBER_PAGE_SIZE (6) pour éviter
 * tout layout shift lors de la transition skeleton → données réelles.
 */
@Component({
  selector: 'ubax-equipe-skeleton-table',
  standalone: true,
  template: `
    <div class="equipe-sk-table" aria-hidden="true">
      <!-- Card table -->
      <div class="equipe-sk-table__card">
        <!-- Header de table (fond navy) -->
        <div class="equipe-sk-table__header">
          @for (col of headerCols; track col.w) {
            <div
              class="equipe-sk-table__header-cell"
              [style.width]="col.w"
            ></div>
          }
        </div>

        <!-- Lignes -->
        @for (row of rows(); track $index) {
          <div class="equipe-sk-table__row">
            <!-- Cellule avatar + nom -->
            <div class="equipe-sk-table__cell equipe-sk-table__cell--member">
              <div class="equipe-sk-table__avatar"></div>
              <div class="equipe-sk-table__text equipe-sk-table__text--name"></div>
            </div>
            <!-- Nom -->
            <div class="equipe-sk-table__cell">
              <div class="equipe-sk-table__text equipe-sk-table__text--md"></div>
            </div>
            <!-- Email -->
            <div class="equipe-sk-table__cell equipe-sk-table__cell--wide">
              <div class="equipe-sk-table__text equipe-sk-table__text--lg"></div>
            </div>
            <!-- Téléphone -->
            <div class="equipe-sk-table__cell">
              <div class="equipe-sk-table__text equipe-sk-table__text--md"></div>
            </div>
            <!-- Rôle -->
            <div class="equipe-sk-table__cell">
              <div class="equipe-sk-table__text equipe-sk-table__text--sm"></div>
            </div>
            <!-- Actions -->
            <div class="equipe-sk-table__cell equipe-sk-table__cell--actions">
              <div class="equipe-sk-table__action-btn"></div>
              <div class="equipe-sk-table__action-btn"></div>
            </div>
          </div>
        }
      </div>

      <!-- Pagination -->
      <div class="equipe-sk-table__pagination">
        <div class="equipe-sk-table__page-btn"></div>
        <div class="equipe-sk-table__page-btn equipe-sk-table__page-btn--active"></div>
        <div class="equipe-sk-table__page-btn"></div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      grid-area: table;
    }

    /* ── Layout ─────────────────────────────────────────────────────────── */

    .equipe-sk-table {
      display: flex;
      flex-direction: column;
      gap: 32px;
    }

    .equipe-sk-table__card {
      display: flex;
      flex-direction: column;
      min-height: 595px;
      padding: 27px 17px 0;
      border-radius: 20px;
      background: #fff;
      overflow: hidden;
    }

    /* ── Header ─────────────────────────────────────────────────────────── */

    .equipe-sk-table__header {
      display: flex;
      align-items: center;
      gap: 16px;
      height: 68px;
      padding: 0 24px;
      border-radius: 20px;
      background: #1a3047;
      flex-shrink: 0;
    }

    .equipe-sk-table__header-cell {
      height: 14px;
      border-radius: 7px;
      background: rgba(255, 255, 255, 0.18);
      animation: equipe-sk-pulse 1.6s ease-in-out infinite;
    }

    /* ── Rows ────────────────────────────────────────────────────────────── */

    .equipe-sk-table__row {
      display: flex;
      align-items: center;
      gap: 16px;
      height: 81px;
      padding: 0 24px;
      border-bottom: 1px solid rgba(207, 214, 220, 0.8);

      &:last-child {
        border-bottom: 0;
      }
    }

    .equipe-sk-table__cell {
      display: flex;
      align-items: center;
      flex: 1;
      min-width: 0;
    }

    .equipe-sk-table__cell--member {
      flex: 1.4;
      gap: 10px;
    }

    .equipe-sk-table__cell--wide {
      flex: 1.8;
    }

    .equipe-sk-table__cell--actions {
      flex: 0 0 123px;
      justify-content: center;
      gap: 12px;
    }

    /* ── Blocs animés ────────────────────────────────────────────────────── */

    .equipe-sk-table__avatar,
    .equipe-sk-table__text,
    .equipe-sk-table__action-btn,
    .equipe-sk-table__page-btn {
      border-radius: 8px;
      background: #eef3f7;
      animation: equipe-sk-pulse 1.6s ease-in-out infinite;
    }

    .equipe-sk-table__avatar {
      width: 41px;
      height: 41px;
      border-radius: 50%;
      flex-shrink: 0;
    }

    .equipe-sk-table__text {
      height: 14px;
      border-radius: 7px;
    }

    .equipe-sk-table__text--name { width: 90px; }
    .equipe-sk-table__text--md   { width: 80px; }
    .equipe-sk-table__text--lg   { width: 140px; }
    .equipe-sk-table__text--sm   { width: 70px; }

    .equipe-sk-table__action-btn {
      width: 33px;
      height: 33px;
      border-radius: 50%;
    }

    /* ── Pagination ──────────────────────────────────────────────────────── */

    .equipe-sk-table__pagination {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 8px;
      min-height: 90px;
      padding-inline: 8px;
    }

    .equipe-sk-table__page-btn {
      width: 40px;
      height: 40px;
      border-radius: 50%;
    }

    .equipe-sk-table__page-btn--active {
      background: #1a3047;
    }

    /* ── Animation ───────────────────────────────────────────────────────── */

    @keyframes equipe-sk-pulse {
      0%, 100% { opacity: 1; }
      50%       { opacity: 0.45; }
    }

    /* Décalage de phase pour un effet naturel ligne par ligne */
    .equipe-sk-table__row:nth-child(2) .equipe-sk-table__text,
    .equipe-sk-table__row:nth-child(2) .equipe-sk-table__avatar {
      animation-delay: 0.1s;
    }
    .equipe-sk-table__row:nth-child(3) .equipe-sk-table__text,
    .equipe-sk-table__row:nth-child(3) .equipe-sk-table__avatar {
      animation-delay: 0.2s;
    }
    .equipe-sk-table__row:nth-child(4) .equipe-sk-table__text,
    .equipe-sk-table__row:nth-child(4) .equipe-sk-table__avatar {
      animation-delay: 0.3s;
    }
    .equipe-sk-table__row:nth-child(5) .equipe-sk-table__text,
    .equipe-sk-table__row:nth-child(5) .equipe-sk-table__avatar {
      animation-delay: 0.4s;
    }
    .equipe-sk-table__row:nth-child(6) .equipe-sk-table__text,
    .equipe-sk-table__row:nth-child(6) .equipe-sk-table__avatar {
      animation-delay: 0.5s;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EquipeSkeletonTableComponent {
  /** Nombre de lignes skeleton — doit correspondre à MEMBER_PAGE_SIZE. */
  readonly rowCount = input<number>(6);

  protected readonly rows = computed(() =>
    Array.from({ length: this.rowCount() }),
  );

  protected readonly headerCols = [
    { w: '90px' },
    { w: '80px' },
    { w: '140px' },
    { w: '80px' },
    { w: '70px' },
    { w: '60px' },
  ] as const;
}

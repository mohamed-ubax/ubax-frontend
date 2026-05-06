import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * Skeleton de la carte promo gauche (376 × 595 px).
 * Reproduit exactement la structure de `.agency-members-page__promo-card`
 * avec des blocs animés pulse à la place du contenu réel.
 * Aucune donnée métier n'est jamais visible pendant le chargement.
 */
@Component({
  selector: 'ubax-equipe-skeleton-promo',
  standalone: true,
  template: `
    <div class="equipe-sk-promo" aria-hidden="true">
      <!-- Fond dégradé simulé -->
      <div class="equipe-sk-promo__backdrop"></div>

      <div class="equipe-sk-promo__body">
        <!-- Titre — 2 lignes -->
        <div class="equipe-sk-promo__line equipe-sk-promo__line--title-1"></div>
        <div class="equipe-sk-promo__line equipe-sk-promo__line--title-2"></div>

        <!-- Image placeholder -->
        <div class="equipe-sk-promo__image"></div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      grid-area: promo;
    }

    .equipe-sk-promo {
      position: relative;
      display: flex;
      flex-direction: column;
      min-height: 595px;
      border-radius: 20px;
      overflow: hidden;
      background: #1d3d60;
    }

    .equipe-sk-promo__backdrop {
      position: absolute;
      inset: 0;
      background: linear-gradient(180deg, #1d3d60 0%, #172a3d 100%);
    }

    .equipe-sk-promo__body {
      position: relative;
      z-index: 1;
      display: flex;
      flex: 1 1 auto;
      flex-direction: column;
      gap: 18px;
      padding: 63px 28px 36px;
    }

    /* Blocs animés */
    .equipe-sk-promo__line,
    .equipe-sk-promo__image {
      border-radius: 10px;
      background: rgba(255, 255, 255, 0.12);
      animation: equipe-sk-pulse 1.6s ease-in-out infinite;
    }

    .equipe-sk-promo__line--title-1 {
      width: 80%;
      height: 36px;
    }

    .equipe-sk-promo__line--title-2 {
      width: 60%;
      height: 36px;
    }

    .equipe-sk-promo__image {
      width: 100%;
      height: 319px;
      margin-top: auto;
      border-radius: 20px;
    }

    @keyframes equipe-sk-pulse {
      0%, 100% { opacity: 1; }
      50%       { opacity: 0.45; }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EquipeSkeletonPromoComponent {}

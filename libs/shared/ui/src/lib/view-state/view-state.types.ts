/**
 * ViewState — état d'affichage canonique pour toutes les pages data-driven.
 *
 * Règle fondamentale : l'écran est dans UN SEUL état à la fois.
 * Aucun état intermédiaire, aucun flicker, aucun layout shift.
 *
 * Usage :
 *   - 'loading'  → skeleton pleine page (jamais de contenu métier visible)
 *   - 'success'  → données réelles affichées
 *   - 'empty'    → aucune donnée (après chargement réussi)
 *   - 'error'    → erreur API ou réseau
 */
export type ViewState = 'loading' | 'success' | 'empty' | 'error';

/**
 * Dérive le ViewState à partir des signaux primitifs du store.
 *
 * @param loading  - true pendant le fetch initial
 * @param error    - message d'erreur ou null
 * @param isEmpty  - true si la collection est vide après chargement
 * @param hasLoaded - true si au moins un chargement s'est terminé (succès ou erreur)
 */
export function deriveViewState(
  loading: boolean,
  error: string | null,
  isEmpty: boolean,
  hasLoaded: boolean,
): ViewState {
  // Priorité 1 : chargement en cours → skeleton
  if (loading || !hasLoaded) return 'loading';
  // Priorité 2 : erreur API
  if (error) return 'error';
  // Priorité 3 : collection vide après succès
  if (isEmpty) return 'empty';
  // Priorité 4 : données disponibles
  return 'success';
}

# Prompt d'implémentation — Composants UBAX Design System

> Copie ce prompt et fournis-le à n'importe quel agent pour qu'il implémente
> les composants manquants avec le bon contexte.

---

## Prompt

```
Tu es un expert Angular 21 + PrimeNG + Tailwind CSS + SCSS.
Tu dois implémenter des composants Angular pour le back-office UBAX,
en respectant strictement le design system déjà en place.

---

## Contexte du projet

### Stack technique
- Angular 21 (standalone components, API signals : input(), output(), computed(), model())
- PrimeNG (dernière version LTS, preset @primeuix/themes)
- Tailwind CSS avec preset custom UBAX
- SCSS avec tokens via @use
- Nx monorepo
- TypeScript strict

### Structure du workspace
```
apps/
  ubax-admin/                        ← Application back-office
    src/
      styles.scss                    ← Point d'entrée styles global
      app/app.config.ts              ← Config Angular (PrimeNG, Router)

libs/
  shared/
    design-system/
      src/
        index.ts                     ← Barrel public de la lib
        lib/
          tokens/
            _colors.scss             ← Variables couleurs SCSS
            _typography.scss         ← Variables typo SCSS
            _spacing.scss            ← Variables espacement SCSS
            _radius.scss             ← Variables border-radius SCSS
            _shadows.scss            ← Variables ombres SCSS
            _animations.scss         ← Durées et easing SCSS
            _breakpoints.scss        ← Breakpoints + mixins SCSS
            _tokens.responsive.scss  ← CSS custom properties responsives
          tailwind/
            tailwind-preset.js       ← Preset Tailwind complet
          primeng/
            ubax-preset.ts           ← Tokens couleurs PrimeNG
          components/
            index.ts                 ← Barrel composants
            status-badge/            ← ✅ Déjà implémenté
            kpi-card/                ← ✅ Déjà implémenté
            page-header/             ← ✅ Déjà implémenté
            sidebar/                 ← ✅ Déjà implémenté
            data-table/              ← ✅ Déjà implémenté
            section-card/            ← ✅ Déjà implémenté
            empty-state/             ← ✅ Déjà implémenté
            confirm-dialog/          ← ✅ Déjà implémenté
            search-filter-bar/       ← ✅ Déjà implémenté
            stepper-form/            ← ✅ Déjà implémenté
            activity-feed/           ← ✅ Déjà implémenté
          styles/
            _layout.scss             ← Shell + grilles
            _components.scss         ← Overrides PrimeNG
            _utilities.scss          ← Classes utilitaires
```

---

## Tokens de design (extraits du Figma BACK-OFFICE-UBAX)

### Couleurs — CSS custom properties disponibles
```css
/* Brand */
--color-brand-navy:    #1a3047   /* Sidebar */
--color-brand-orange:  #e87d1e   /* CTA, nav active */
--color-brand-blue:    #2b7fff   /* Interactif, focus */
--color-brand-teal:    #009966

/* Statuts */
--color-success:       #34c759
--color-success-bg:    #e1ffe9
--color-warning:       #e87d1e
--color-warning-bg:    #ffeddd
--color-danger:        #e7000b
--color-danger-bg:     #ffdbdd
--color-info:          #2b7fff
--color-info-bg:       #e8f0ff

/* Neutres */
--color-neutral-50:    #f8faff
--color-neutral-100:   #f7f7f7
--color-neutral-200:   #ecf2f7   /* Background page */
--color-neutral-300:   #e1e4ed   /* Bordures */
--color-neutral-500:   #979797   /* Texte muted */
--color-neutral-900:   #1c1c1c   /* Texte principal */
--color-neutral-950:   #222222   /* Texte body */

/* Surfaces */
--color-surface-page:    #ecf2f7
--color-surface-card:    #ffffff
--color-surface-sidebar: #1a3047
```

### Couleurs — Classes Tailwind disponibles
```
bg-brand-navy / bg-brand-orange / bg-brand-blue
text-brand-navy / text-brand-orange / text-brand-blue
bg-success / bg-success-bg / text-success
bg-warning / bg-warning-bg / text-warning
bg-danger / bg-danger-bg / text-danger
bg-info / bg-info-bg / text-info
bg-neutral-{50|100|200|300|400|500|600|700|800|900|950}
bg-surface-card / bg-surface-page / bg-surface-sidebar
```

### Typographie
```
Font principale : Lexend (light 300, regular 400, medium 500, semibold 600)
Font secondaire : Inter (regular 400)

Classes Tailwind :
text-xs (8px) / text-sm (10px) / text-base (12px) / text-md (13px)
text-lg (14px) / text-xl (15px) / text-2xl (16px) / text-3xl (20px)
text-4xl (22px) / text-5xl (24px)

font-light / font-regular / font-medium / font-semibold
```

### Espacements clés
```
Padding card : 24px (p-6)
Gap grille : 16px (gap-4)
Padding sidebar item : 12px 16px (py-3 px-4)
Hauteur header : 81px (h-header)
Largeur sidebar : 314px (w-sidebar)
```

### Border radius
```
rounded-xs (2px)  → badges statut
rounded-sm (5px)  → boutons
rounded-md (6px)  → inputs, selects
rounded-xl (10px) → cartes, panels
rounded-3xl (16px) → dialogs
rounded-full (9999px) → avatars, pills
```

### Ombres
```
shadow-card     → 0 1px 4px 0 rgba(25,33,61,0.08)  (cartes)
shadow-dropdown → 0 2px 8px 0 rgba(25,33,61,0.10)  (dropdowns)
shadow-modal    → 0 4px 16px 0 rgba(25,33,61,0.12) (modals)
```

---

## Règles d'implémentation OBLIGATOIRES

### 1. Structure d'un composant
Chaque composant doit être créé dans :
`libs/shared/design-system/src/lib/components/{nom-composant}/{nom-composant}.component.ts`

Et exporté dans :
`libs/shared/design-system/src/lib/components/index.ts`
`libs/shared/design-system/src/index.ts`

### 2. Pattern Angular obligatoire
```typescript
import { Component, input, output, computed, model } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'ubax-{nom}',
  standalone: true,
  imports: [CommonModule, /* PrimeNG modules */],
  template: `...`,
})
export class {Nom}Component {
  // Utiliser UNIQUEMENT l'API signals
  readonly monInput = input<string>();
  readonly monInputRequired = input.required<string>();
  readonly monModel = model<boolean>(false);
  readonly monOutput = output<string>();
  readonly computed = computed(() => ...);
}
```

### 3. Styling
- **JAMAIS** de styles inline hardcodés (pas de `style="color: #1a3047"`)
- Utiliser **exclusivement** les classes Tailwind du preset ou les CSS custom properties
- Pour les overrides PrimeNG complexes : ajouter dans `_components.scss`
- Préfixer les classes utilitaires custom avec `ubax-`

### 4. Accessibilité
- Attributs `aria-label`, `role`, `aria-current` sur les éléments interactifs
- Focus visible : `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue`
- Contraste WCAG AA minimum

### 5. Animations
- Ajouter `data-ubax-motion="item"` sur les composants qui apparaissent dans des listes
- Ajouter `data-ubax-motion="surface"` sur les cartes et panels

### 6. Composants de formulaire
Implémenter `ControlValueAccessor` pour tous les composants utilisés dans des formulaires :
```typescript
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

providers: [{
  provide: NG_VALUE_ACCESSOR,
  useExisting: forwardRef(() => MonComponent),
  multi: true,
}]
```

---

## Composants à implémenter

Consulte le fichier `libs/shared/design-system/COMPONENTS-PLAN.md` pour la
spécification complète de chaque composant (description, apparence Figma,
interface TypeScript, notes d'implémentation).

### Ordre de priorité

**Sprint 1 — Formulaires (P1)**
1. `StarRating` — étoiles display/input, 1-5, taille sm/md/lg
2. `CategoryRating` — alias StarRating interactif pour formulaires
3. `PhoneInput` — input téléphone avec sélecteur pays (drapeau CI par défaut)
4. `FileUpload` — zone upload documents (PDF, JPG, PNG)
5. `LogoUpload` — upload logo avec preview circulaire

**Sprint 2 — Navigation et listes (P1)**
6. `BreadcrumbNav` — fil d'Ariane pour pages de détail
7. `SubNavTabs` — onglets filtrage (Tous / En attente / Suspendus / Actifs)
8. `PropertyCard` — carte propriété (image + badge + prix + stats)
9. `AgencyCard` — carte agence (logo + nom + ville + statut)
10. `HotelCard` — carte hôtel (similaire AgencyCard)

**Sprint 3 — Détails (P2)**
11. `DetailInfoBlock` — grille label/valeur pour pages de détail
12. `DocumentList` — liste documents avec download
13. `BookingTimeline` — timeline statut réservation (4 étapes)
14. `PaymentBreakdown` — récapitulatif coûts (lignes + total)
15. `ApprovalModal` — modal félicitations après validation

**Sprint 4 — Graphiques (P3)**
16. `DonutChart` — donut "Réservations par type" (Chart.js)
17. `LineChart` — courbes "Revenus" avec filtres période
18. `BarChart` — barres groupées "Commissions vs Dépenses"
19. `MapView` — carte interactive pins hôtels/agences (Leaflet)

---

## Exemple de composant de référence existant

Voici `StatusBadgeComponent` comme modèle à suivre :

```typescript
// libs/shared/design-system/src/lib/components/status-badge/status-badge.component.ts

import { Component, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

export type StatusVariant =
  | 'confirmed' | 'pending' | 'cancelled'
  | 'active' | 'suspended' | 'success'
  | 'warning' | 'danger' | 'info' | 'neutral';

const VARIANT_CLASSES: Record<StatusVariant, string> = {
  confirmed:   'bg-success-bg text-success',
  pending:     'bg-warning-bg text-warning',
  cancelled:   'bg-danger-bg text-danger',
  active:      'bg-success-bg text-success',
  suspended:   'bg-danger-bg text-danger',
  success:     'bg-success-bg text-success',
  warning:     'bg-warning-bg text-warning',
  danger:      'bg-danger-bg text-danger',
  info:        'bg-info-bg text-info',
  neutral:     'bg-neutral-100 text-neutral-500',
};

@Component({
  selector: 'ubax-status-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span
      class="inline-flex items-center justify-center rounded-xs
             px-2 py-0.5 text-base font-regular leading-5"
      [ngClass]="variantClasses()"
    >
      <ng-content />
    </span>
  `,
})
export class StatusBadgeComponent {
  readonly variant = input<StatusVariant>('neutral');
  readonly variantClasses = computed(() => VARIANT_CLASSES[this.variant()]);
}
```

---

## Après chaque composant implémenté

1. Ajouter l'export dans `libs/shared/design-system/src/lib/components/index.ts`
2. Ajouter l'export dans `libs/shared/design-system/src/index.ts`
3. Si des overrides PrimeNG sont nécessaires, les ajouter dans
   `libs/shared/design-system/src/lib/styles/_components.scss`
4. Mettre à jour `COMPONENTS-PLAN.md` en marquant le composant comme ✅

---

## Référence Figma

Fichier : **BACK-OFFICE-UBAX**
URL : https://www.figma.com/design/kkudNY0gwBDCL6J0Ax03Op/BACK-OFFICE-UBAX
File key : `kkudNY0gwBDCL6J0Ax03Op`

Utilise le Figma MCP pour récupérer le design context de chaque composant
avant de l'implémenter :
- `get_design_context(nodeId, fileKey)` → code + screenshot
- `get_screenshot(nodeId, fileKey)` → visuel de référence

Nodes clés :
| Composant | Node ID |
|-----------|---------|
| Dashboard | `58:1274` |
| Liste hôtels | `13:5` |
| Ajouter hôtel (step 1) | `69:200` |
| Ajouter hôtel (step 2) | `79:78` |
| Ajouter hôtel (step 3) | `79:368` |
| Détails hôtel | `83:1657` |
| Liste agences | `95:64` |
| Ajouter agence (step 1) | `98:551` |
| Détails agence | `151:390` |
| Détails réservation | `166:2588` |
| Liste propriétés | `130:102` |
| Détails propriété | `143:1932` |
| Paiements | `210:434` |
| Détails paiement | `281:529` |
| Statistiques | `241:436` |
| Carte interactive | `220:435` |
| Utilisateurs | `177:435` |
```

---

## Fichiers de référence à lire avant de commencer

1. `libs/shared/design-system/COMPONENTS-PLAN.md` — spécifications détaillées
2. `libs/shared/design-system/DESIGN-SYSTEM.md` — documentation tokens + usage
3. `libs/shared/design-system/src/lib/tokens/_colors.scss` — variables couleurs
4. `libs/shared/design-system/src/lib/tailwind/tailwind-preset.js` — classes Tailwind
5. `libs/shared/design-system/src/lib/components/status-badge/status-badge.component.ts` — modèle
6. `libs/shared/design-system/src/lib/components/index.ts` — barrel à mettre à jour

# UBAX Design System

Extrait du fichier Figma **BACK-OFFICE-UBAX** (`kkudNY0gwBDCL6J0Ax03Op`).  
Stack cible : **Angular 21 + PrimeNG + Tailwind CSS + SCSS**.

---

## Structure

```
libs/shared/design-system/src/lib/
├── tokens/
│   ├── _colors.scss            # Primitives + sémantiques
│   ├── _typography.scss        # Familles, tailles, poids
│   ├── _spacing.scss           # Échelle 4px
│   ├── _radius.scss            # Border radius
│   ├── _shadows.scss           # Élévations
│   ├── _animations.scss        # Durées + easing
│   ├── _breakpoints.scss       # Breakpoints + mixins
│   ├── _tokens.responsive.scss # CSS custom properties responsives
│   └── _index.scss             # Barrel SCSS
├── tailwind/
│   └── tailwind-preset.js      # Preset Tailwind complet
├── primeng/
│   └── ubax-preset.ts          # Preset PrimeNG (definePreset)
├── components/
│   ├── status-badge/           # Badges de statut
│   ├── kpi-card/               # Cartes métriques
│   ├── page-header/            # Header de page
│   ├── sidebar/                # Sidebar + nav items
│   ├── data-table/             # Table de données
│   ├── section-card/           # Conteneur carte
│   ├── empty-state/            # État vide
│   ├── confirm-dialog/         # Dialog de confirmation
│   ├── search-filter-bar/      # Barre recherche + filtres
│   ├── stepper-form/           # Indicateur d'étapes
│   ├── activity-feed/          # Fil d'activités
│   └── index.ts                # Barrel composants
└── styles/
    ├── _layout.scss            # Shell + grilles
    ├── _components.scss        # Overrides PrimeNG
    ├── _utilities.scss         # Classes utilitaires
    └── _index.scss             # Barrel styles
```

---

## Tokens de couleur

| Token CSS                  | Valeur      | Usage                        |
|----------------------------|-------------|------------------------------|
| `--color-brand-navy`       | `#1a3047`   | Sidebar background           |
| `--color-brand-orange`     | `#e87d1e`   | CTA primaire, nav active     |
| `--color-brand-blue`       | `#2b7fff`   | Interactif, liens, focus     |
| `--color-brand-teal`       | `#009966`   | Accent header                |
| `--color-success`          | `#34c759`   | Statut confirmé / actif      |
| `--color-success-bg`       | `#e1ffe9`   | Fond badge succès            |
| `--color-warning`          | `#e87d1e`   | Statut en attente            |
| `--color-warning-bg`       | `#ffeddd`   | Fond badge warning           |
| `--color-danger`           | `#e7000b`   | Statut annulé / erreur       |
| `--color-danger-bg`        | `#ffdbdd`   | Fond badge danger            |
| `--color-neutral-200`      | `#ecf2f7`   | Background de page           |
| `--color-neutral-300`      | `#e1e4ed`   | Bordures, séparateurs        |
| `--color-neutral-500`      | `#979797`   | Texte secondaire / muted     |
| `--color-surface-card`     | `#ffffff`   | Fond des cartes              |
| `--color-surface-sidebar`  | `#1a3047`   | Fond sidebar                 |

---

## Typographie

| Style Figma        | Famille  | Poids    | Taille | Usage                    |
|--------------------|----------|----------|--------|--------------------------|
| Page title         | Lexend   | SemiBold | 24px   | Titre de page (h1)       |
| Section title      | Lexend   | SemiBold | 16px   | Titre de section (h2)    |
| Card label         | Lexend   | Medium   | 13px   | Label de carte KPI       |
| Body regular       | Lexend   | Regular  | 13px   | Texte courant            |
| Table header       | Lexend   | Medium   | 15px   | En-tête de colonne       |
| Table cell         | Lexend   | Regular  | 13px   | Cellule de tableau       |
| Caption            | Lexend   | Regular  | 12px   | Légendes, timestamps     |
| Micro              | Lexend   | Light    | 10px   | Sous-titres, hints       |
| Button             | Lexend   | Medium   | 14px   | Labels de boutons        |
| Nav item           | Lexend   | Regular  | 15px   | Items de navigation      |

---

## Composants

### StatusBadge

```html
<ubax-status-badge variant="confirmed">Confirmé</ubax-status-badge>
<ubax-status-badge variant="pending">En attente</ubax-status-badge>
<ubax-status-badge variant="cancelled">Annulée</ubax-status-badge>
<ubax-status-badge variant="active">Actif</ubax-status-badge>
<ubax-status-badge variant="suspended">Suspendu</ubax-status-badge>
```

Variantes : `confirmed` | `pending` | `cancelled` | `active` | `suspended` | `available` | `unavailable` | `success` | `warning` | `danger` | `info` | `neutral`

---

### KpiCard

```html
<ubax-kpi-card label="Hôtels actifs" [value]="152" trend="+12 ce mois ci" [trendPositive]="true">
  <ng-template #icon>
    <i class="pi pi-building text-brand-blue text-xl"></i>
  </ng-template>
</ubax-kpi-card>
```

---

### SectionCard

```html
<ubax-section-card title="Réservations récentes">
  <ng-template #headerActions>
    <p-button label="Voir toutes" severity="secondary" size="small" />
  </ng-template>
  <!-- contenu -->
</ubax-section-card>
```

---

### Sidebar

```typescript
const navGroups: NavGroup[] = [
  {
    items: [
      { label: 'Tableau de bord', routerLink: '/dashboard', icon: 'pi pi-home', exact: true },
      { label: 'Hôtels',          routerLink: '/hotels',    icon: 'pi pi-building' },
      { label: 'Agences',         routerLink: '/agencies',  icon: 'pi pi-users' },
      { label: 'Propriétés',      routerLink: '/properties',icon: 'pi pi-map' },
      { label: 'Réservations',    routerLink: '/bookings',  icon: 'pi pi-calendar' },
      { label: 'Utilisateurs',    routerLink: '/users',     icon: 'pi pi-user' },
      { label: 'Paiements',       routerLink: '/payments',  icon: 'pi pi-wallet' },
      { label: 'Statistiques',    routerLink: '/stats',     icon: 'pi pi-chart-bar' },
      { label: 'Logs système',    routerLink: '/logs',      icon: 'pi pi-list' },
    ]
  }
];
```

```html
<ubax-sidebar [navGroups]="navGroups" logoSrc="/assets/logo.svg">
  <ng-template #footer>
    <ubax-sidebar-nav-item label="Paramètres" routerLink="/settings" icon="pi pi-cog" />
  </ng-template>
</ubax-sidebar>
```

---

### DataTable

```typescript
columns: TableColumn[] = [
  { field: 'id',     header: 'ID',      width: '120px' },
  { field: 'name',   header: 'Nom',     sortable: true },
  { field: 'city',   header: 'Ville' },
  { field: 'status', header: 'Statut',  width: '120px', align: 'center' },
];
```

```html
<ubax-data-table
  [columns]="columns"
  [data]="hotels"
  [loading]="isLoading"
  [totalRecords]="total"
  [hasActions]="true"
  (pageChange)="onPageChange($event)"
/>
```

---

### SearchFilterBar

```html
<ubax-search-filter-bar
  placeholder="Rechercher par titre, référence..."
  [(searchValue)]="search"
  [filters]="[
    { label: 'Tous les types', options: typeOptions },
    { label: 'Toutes les villes', options: cityOptions }
  ]"
  (searchChange)="onSearch($event)"
>
  <ng-template #actions>
    <p-button label="Ajouter un hôtel" icon="pi pi-plus" />
  </ng-template>
</ubax-search-filter-bar>
```

---

### StepperForm

```html
<ubax-stepper-form
  [steps]="[
    { label: 'Informations Générales', completed: true,  active: false },
    { label: 'Localisation',           completed: false, active: true  },
    { label: 'Information légales',    completed: false, active: false }
  ]"
/>
```

---

## Layout Shell

```html
<div class="ubax-shell">
  <ubax-sidebar [navGroups]="navGroups" class="ubax-sidebar" />

  <div class="ubax-main">
    <ubax-page-header title="Tableau de bord" class="ubax-header" />

    <main class="ubax-content">
      <div class="ubax-page">
        <!-- KPI grid -->
        <div class="ubax-kpi-grid">
          <ubax-kpi-card ... />
        </div>

        <!-- Two-column layout -->
        <div class="ubax-two-col">
          <ubax-section-card title="Revenus" />
          <ubax-section-card title="Activités récentes" />
        </div>
      </div>
    </main>
  </div>
</div>
```

---

## Classes utilitaires SCSS

| Classe                  | Description                              |
|-------------------------|------------------------------------------|
| `.ubax-badge--confirmed`| Badge vert "Confirmé"                    |
| `.ubax-badge--pending`  | Badge orange "En attente"                |
| `.ubax-badge--cancelled`| Badge rouge "Annulée"                    |
| `.ubax-card`            | Surface blanche, radius 10px, shadow     |
| `.ubax-section-title`   | Titre de section (Lexend SemiBold 16px)  |
| `.ubax-page-title`      | Titre de page (Lexend SemiBold 24px)     |
| `.ubax-action-btn`      | Bouton icône (œil / crayon / poubelle)   |
| `.ubax-btn-secondary`   | Bouton secondaire (fond #f8faff)         |
| `.ubax-btn-cta`         | Bouton CTA orange                        |
| `.ubax-progress`        | Barre de progression                     |
| `.ubax-legend-dot`      | Point de légende coloré                  |
| `.ubax-divider`         | Séparateur horizontal                    |
| `.ubax-shell`           | Conteneur app (flex, 100dvh)             |
| `.ubax-sidebar`         | Sidebar (sticky, overflow-y auto)        |
| `.ubax-main`            | Zone principale (flex-col)               |
| `.ubax-header`          | Header sticky                            |
| `.ubax-content`         | Zone de contenu scrollable               |
| `.ubax-page`            | Wrapper de page (flex-col, gap-6)        |
| `.ubax-kpi-grid`        | Grille 4 colonnes KPI                    |
| `.ubax-two-col`         | Layout 2 colonnes (chart + widget)       |
| `.ubax-three-col`       | Layout 3 colonnes                        |
| `.ubax-card-grid`       | Grille de cartes propriétés              |

---

## Tailwind — Classes clés

```html
<!-- Couleurs brand -->
<div class="bg-brand-navy text-white">Sidebar</div>
<div class="bg-brand-orange text-white">CTA</div>
<div class="text-brand-blue">Lien</div>

<!-- Surfaces -->
<div class="bg-surface-page">Page</div>
<div class="bg-surface-card rounded-xl shadow-card">Carte</div>

<!-- Statuts -->
<span class="bg-success-bg text-success">Confirmé</span>
<span class="bg-warning-bg text-warning">En attente</span>
<span class="bg-danger-bg text-danger">Annulée</span>

<!-- Typographie -->
<h1 class="text-5xl font-semibold text-neutral-900">Titre</h1>
<p class="text-md font-regular text-neutral-950">Corps</p>
<p class="text-base font-regular text-neutral-500">Caption</p>

<!-- Layout -->
<div class="w-sidebar h-header">...</div>
```

---

## Responsive

Le back-office est conçu pour **desktop 1440px** (canvas Figma).  
Les breakpoints sont définis dans `_breakpoints.scss` et les CSS custom properties
s'adaptent automatiquement via `_tokens.responsive.scss`.

| Breakpoint | Largeur  | Sidebar  | Header  | Padding contenu |
|------------|----------|----------|---------|-----------------|
| Mobile     | 320px+   | 260px    | 64px    | 16px            |
| Tablet     | 768px+   | 280px    | 72px    | 24px            |
| Desktop    | 1024px+  | **314px**| **81px**| 32px            |
| Wide       | 1440px+  | 314px    | 81px    | 40px            |

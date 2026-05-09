# Plan des composants restants — UBAX Design System

> Référence Figma : **BACK-OFFICE-UBAX** (`kkudNY0gwBDCL6J0Ax03Op`)  
> Stack : Angular 21 (standalone, signals) + PrimeNG + Tailwind CSS + SCSS  
> Priorité : **P1** critique · **P2** important · **P3** nice-to-have

---

## Addendum Sprint 1 - formulaires livrés

- ✅ `StarRating` - étoile display/input, tailles `sm` / `md` / `lg`
- ✅ `CategoryRating` - alias formulaire de `StarRating` avec CVA
- ✅ `PhoneInput` - téléphone avec sélecteur de pays et préfixe international
- ✅ `FileUpload` - zone d'upload documents avec validation de base
- ✅ `LogoUpload` - upload logo avec preview circulaire et CVA

---

## Addendum Sprint 2 à 4 - reste livré

- ✅ `SubNavTabs`
- ✅ `BreadcrumbNav`
- ✅ `PropertyCard`
- ✅ `AgencyCard`
- ✅ `HotelCard`
- ✅ `DetailInfoBlock`
- ✅ `BookingTimeline`
- ✅ `PaymentBreakdown`
- ✅ `DocumentList`
- ✅ `ApprovalModal`
- ✅ `DonutChart`
- ✅ `LineChart`
- ✅ `BarChart`
- ✅ `MapView`

---

## Vue d'ensemble

| #   | Composant          | Catégorie     | Priorité | Écrans concernés                          |
| --- | ------------------ | ------------- | -------- | ----------------------------------------- |
| 1   | `SubNavTabs`       | Navigation    | P1       | Hôtels, Agences, Réservations             |
| 2   | `BreadcrumbNav`    | Navigation    | P1       | Détails hôtel, agence, propriété          |
| 3   | `PropertyCard`     | Cartes métier | P1       | Liste propriétés                          |
| 4   | `AgencyCard`       | Cartes métier | P1       | Liste agences                             |
| 5   | `HotelCard`        | Cartes métier | P1       | Liste hôtels (vue grille)                 |
| 6   | `PhoneInput`       | Formulaires   | P1       | Ajouter hôtel, agence, utilisateur        |
| 7   | `FileUpload`       | Formulaires   | P1       | Ajouter hôtel, agence (documents)         |
| 8   | `LogoUpload`       | Formulaires   | P1       | Ajouter hôtel, agence (logo)              |
| 9   | `DetailInfoBlock`  | Détails       | P1       | Détails hôtel, agence, réservation        |
| 10  | `BookingTimeline`  | Détails       | P2       | Détails réservation                       |
| 11  | `PaymentBreakdown` | Détails       | P2       | Détails réservation, paiements            |
| 12  | `DocumentList`     | Détails       | P2       | Détails agence (RCCM, DFE)                |
| 13  | `ApprovalModal`    | Modals        | P2       | Validation agence / hôtel                 |
| 14  | `StarRating`       | UI générique  | P2       | Tables hôtels, détails                    |
| 15  | `CategoryRating`   | Formulaires   | P2       | Ajouter hôtel (catégorie étoiles)         |
| 16  | `DonutChart`       | Graphiques    | P2       | Dashboard (réservations par type)         |
| 17  | `LineChart`        | Graphiques    | P2       | Dashboard (revenus), Stats                |
| 18  | `BarChart`         | Graphiques    | P3       | Stats & Rapports                          |
| 19  | `MapView`          | Graphiques    | P3       | Dashboard (aperçu géo), Carte interactive |

---

## P1 — Critique (bloquant pour les écrans principaux)

---

### 1. `SubNavTabs`

**Fichier** : `src/lib/components/sub-nav-tabs/sub-nav-tabs.component.ts`

**Description**  
Onglets de sous-navigation horizontaux présents dans les listes hôtels, agences et réservations. Permettent de filtrer par statut (Tous / En attente / Suspendus / Actifs).

**Apparence Figma**

- Fond blanc, bordure bottom `#e1e4ed`
- Onglet actif : fond `#ecf2f7`, texte `#1c1c1c`, indicateur bottom `#e87d1e` (2px)
- Onglet inactif : texte `#979797`
- Badge count optionnel (ex: "En attente (18)")
- Hauteur : 47px, padding horizontal : 16px

**Interface**

```typescript
interface SubNavTab {
  label:   string;
  value:   string;
  count?:  number;
  routerLink?: string;
}

// Inputs
tabs:         SubNavTab[]   // liste des onglets
activeValue:  string        // valeur de l'onglet actif
// Outputs
tabChange:    string        // valeur sélectionnée
```

**Variantes**

- `routerLink` : navigation Angular Router
- `value` : mode contrôlé (sans navigation)

---

### 2. `BreadcrumbNav`

**Fichier** : `src/lib/components/breadcrumb-nav/breadcrumb-nav.component.ts`

**Description**  
Fil d'Ariane visible dans les headers des pages de détail. Ex : "Hôtels > Tous les hôtels > Détails hotel".

**Apparence Figma**

- Texte `#979797` pour les parents, `#1c1c1c` pour l'élément actif
- Séparateur `>` ou chevron icon
- Font Lexend Regular 13px
- Intégré dans le `PageHeaderComponent` (slot dédié)

**Interface**

```typescript
interface BreadcrumbItem {
  label:       string;
  routerLink?: string;
}

// Inputs
items: BreadcrumbItem[]
```

---

### 3. `PropertyCard`

**Fichier** : `src/lib/components/property-card/property-card.component.ts`

**Description**  
Carte de propriété immobilière (appartement, villa, terrain). Utilisée dans la grille "Liste propriétés agence" et "Liste propriétés hôtels".

**Apparence Figma**

- Dimensions : 334×302px
- Zone image : 334×206px (fond gris, image de couverture)
- Badge type en haut à gauche : "Location" / "Vente" (fond blanc, radius 5px)
- Badge statut en haut à droite : "Disponible" (fond `#e1ffe9`, texte `#34c759`)
- Zone infos (96px) : nom propriété, ville, prix, agence
- Footer : icônes chambres / SDB / surface
- Prix : Lexend Medium 13px, couleur `#1c1c1c`
- Logo agence : 26×26px, rounded

**Interface**

```typescript
interface PropertyCardData {
  id: string | number;
  title: string;
  city: string;
  type: 'location' | 'vente';
  status: 'disponible' | 'loue' | 'vendu' | 'indisponible';
  price: string; // ex: "765 000 FCFA/Mois"
  agencyName: string;
  agencyLogo?: string;
  bedrooms?: number;
  bathrooms?: number;
  surface?: number; // m²
  coverImage?: string;
}

// Inputs
property: PropertyCardData;
// Outputs
viewClick: PropertyCardData;
editClick: PropertyCardData;
```

---

### 4. `AgencyCard`

**Fichier** : `src/lib/components/agency-card/agency-card.component.ts`

**Description**  
Carte agence immobilière utilisée dans les listes "Tous les agences", "Agences actives", "Agences en attente".

**Apparence Figma**

- Dimensions : 320×254px
- Avatar circulaire centré (73×73px) avec logo agence
- Badge statut en haut à droite (ex: "42 biens")
- Nom agence : Lexend Medium 16-19px
- Ville : Lexend Regular 13px, texte `#979797`
- Bouton "Voir les détails" : fond `#ecf2f7`, texte `#1c1c1c`, radius 5px
- Fond carte : blanc, radius 10px, shadow card

**Interface**

```typescript
interface AgencyCardData {
  id: string | number;
  name: string;
  city: string;
  logo?: string;
  propertyCount?: number;
  status: 'active' | 'pending' | 'suspended';
}

// Inputs
agency: AgencyCardData;
// Outputs
detailClick: AgencyCardData;
```

---

### 5. `HotelCard`

**Fichier** : `src/lib/components/hotel-card/hotel-card.component.ts`

**Description**  
Carte hôtel pour la vue grille. Similaire à `AgencyCard` mais avec des données spécifiques hôtel (étoiles, type).

**Apparence Figma**

- Même structure que `AgencyCard`
- Avatar avec icône hôtel (pas de logo)
- Badge nombre de biens / chambres
- Statut : "Tous les hôtels" / "En attente" / "Suspendus" / "Actifs"

**Interface**

```typescript
interface HotelCardData {
  id: string | number;
  name: string;
  city: string;
  image?: string;
  stars?: number; // 1-5
  roomCount?: number;
  status: 'active' | 'pending' | 'suspended';
}

// Inputs
hotel: HotelCardData;
// Outputs
detailClick: HotelCardData;
```

> **Note** : `AgencyCard` et `HotelCard` partagent ~80% de leur template.  
> Envisager un composant générique `PartnerCard` avec un `type` input.

---

### 6. `PhoneInput`

**Fichier** : `src/lib/components/phone-input/phone-input.component.ts`

**Description**  
Champ téléphone avec sélecteur de pays (drapeau + indicatif). Visible dans tous les formulaires d'ajout (hôtel, agence, utilisateur).

**Apparence Figma**

- Deux parties : sélecteur pays (121px) + input numéro (196px)
- Sélecteur : drapeau Côte d'Ivoire par défaut, indicatif "+225", chevron
- Input : placeholder "070000000"
- Border `#e1e4ed`, radius 6px, shadow card
- Hauteur : 59-61px

**Interface**

```typescript
// Inputs
value: string; // numéro complet avec indicatif
countryCode: string; // ex: 'CI'
placeholder: string;
disabled: boolean;
// Outputs
valueChange: string;
// ControlValueAccessor (compatible ngModel / reactive forms)
```

**Dépendances**

- Liste des pays avec drapeaux (emoji ou assets)
- `p-select` PrimeNG pour le sélecteur de pays

---

### 7. `FileUpload`

**Fichier** : `src/lib/components/file-upload/file-upload.component.ts`

**Description**  
Zone d'upload de documents (RCCM, DFE, contrat de bail). Visible dans les formulaires d'ajout agence (étape "Information légales").

**Apparence Figma**

- Zone rectangulaire avec fond blanc, border dashed `#e1e4ed`, radius 6px
- Bouton "Choisir un fichier" centré (fond `#f7f7f7`, radius 5px)
- Texte "Aucun fichier choisi" en dessous
- Après upload : nom du fichier + icône + bouton suppression
- Formats acceptés : PDF, JPG, PNG, JPEG

**Interface**

```typescript
// Inputs
label:          string          // ex: "RCCM"
accept:         string          // ex: "application/pdf,image/*"
maxSizeMb:      number          // défaut: 5
multiple:       boolean         // défaut: false
// Outputs
fileSelected:   File
fileRemoved:    void
// ControlValueAccessor
```

---

### 8. `LogoUpload`

**Fichier** : `src/lib/components/logo-upload/logo-upload.component.ts`

**Description**  
Upload de logo avec preview circulaire. Visible dans les formulaires d'ajout hôtel et agence.

**Apparence Figma**

- Zone rectangulaire (401×134px ou 515×185px selon contexte)
- Icône upload centré (62×62px)
- Texte "Importer mon logo" en dessous
- Après upload : preview circulaire du logo
- Fond `#f7f7f7`, border dashed, radius 6px

**Interface**

```typescript
// Inputs
previewUrl:     string | null   // URL de preview
size:           'sm' | 'md' | 'lg'
// Outputs
imageSelected:  File
imageRemoved:   void
// ControlValueAccessor
```

---

### 9. `DetailInfoBlock`

**Fichier** : `src/lib/components/detail-info-block/detail-info-block.component.ts`

**Description**  
Bloc structuré label + valeur utilisé dans toutes les pages de détail (hôtel, agence, réservation, paiement). Peut être groupé en grille.

**Apparence Figma**

- Label : Lexend Regular 12-13px, couleur `#979797`
- Valeur : Lexend Regular/Medium 13-16px, couleur `#1c1c1c`
- Séparateur vertical entre colonnes (1px `#e1e4ed`)
- Padding : 16px vertical, 24px horizontal

**Interface**

```typescript
interface InfoItem {
  label:  string;
  value:  string;
  icon?:  string;       // classe pi-*
}

// Inputs
items:    InfoItem[]
columns:  1 | 2 | 3 | 4   // nombre de colonnes
bordered: boolean           // afficher les séparateurs
```

---

## P2 — Important (complète les écrans de détail)

---

### 10. `BookingTimeline`

**Fichier** : `src/lib/components/booking-timeline/booking-timeline.component.ts`

**Description**  
Timeline horizontale de statut de réservation. Visible dans "Détails réservation".

**Apparence Figma**

- 4 étapes : Réservé → A venir → En cours → Terminé
- Cercle avec icône pour chaque étape
- Ligne de progression entre les étapes
- Date sous chaque étape (ex: "18 Mai 2026")
- Étape active : cercle plein `#2b7fff`
- Étape complétée : cercle plein `#34c759` avec checkmark
- Étape future : cercle vide `#e1e4ed`

**Interface**

```typescript
type BookingStatus = 'reserved' | 'upcoming' | 'ongoing' | 'completed' | 'cancelled';

interface TimelineStep {
  label:  string;
  date?:  string;
  status: 'completed' | 'active' | 'pending';
}

// Inputs
steps:         TimelineStep[]
currentStatus: BookingStatus
```

---

### 11. `PaymentBreakdown`

**Fichier** : `src/lib/components/payment-breakdown/payment-breakdown.component.ts`

**Description**  
Récapitulatif des coûts d'une réservation. Visible dans "Détails réservation" et "Détails paiement".

**Apparence Figma**

- Liste de lignes : label à gauche, montant à droite
- Lignes : Prix/nuit, Nombre de nuits, Sous-total, Taxes, Remise
- Ligne total : fond `#ecf2f7`, texte bold, séparateur top
- Montants en FCFA : Lexend Regular 13px
- Total : Lexend SemiBold 16px

**Interface**

```typescript
interface PaymentLine {
  label:    string;
  amount:   string;
  type?:    'normal' | 'discount' | 'total';
}

// Inputs
lines:    PaymentLine[]
currency: string          // défaut: 'FCFA'
```

---

### 12. `DocumentList`

**Fichier** : `src/lib/components/document-list/document-list.component.ts`

**Description**  
Liste de documents avec icône, nom, taille et bouton de téléchargement. Visible dans "Détails agence" (RCCM, DFE, Contrat de bail).

**Apparence Figma**

- Chaque item : icône fichier (flat-color) + nom + taille + bouton download
- Bouton download : icône `pi-download`, fond transparent, hover `#f7f7f7`
- Fond item : blanc, border bottom `#e1e4ed`
- Deux cercles overlappés pour les actions (voir + dots)

**Interface**

```typescript
interface DocumentItem {
  id:       string | number;
  name:     string;
  size?:    string;           // ex: "1.2 MB"
  type?:    string;           // ex: "RCCM", "DFE"
  url?:     string;
}

// Inputs
documents:      DocumentItem[]
downloadable:   boolean
// Outputs
downloadClick:  DocumentItem
viewClick:      DocumentItem
```

---

### 13. `ApprovalModal`

**Fichier** : `src/lib/components/approval-modal/approval-modal.component.ts`

**Description**  
Modal de confirmation d'approbation avec récapitulatif. Visible après validation d'une agence ou d'un hôtel.

**Apparence Figma**

- Dimensions : 930×514px
- Titre : "Félicitations ! L'agence est maintenant active"
- Sous-titre descriptif
- Tableau récap : Type partenaire / Raison sociale / Représentant légal / Date d'approbation
- Bouton "Voir le profil de l'agence" (fond `#ecf2f7`)
- Bouton fermeture (X) en haut à droite
- Fond blanc, radius 16px, shadow overlay

**Interface**

```typescript
interface ApprovalSummary {
  partnerType:    string;
  companyName:    string;
  representative: string;
  approvalDate:   string;
}

// Inputs
visible:    boolean
summary:    ApprovalSummary
entityType: 'hotel' | 'agency'
// Outputs
visibleChange:  boolean
viewProfile:    void
```

---

### 14. `StarRating`

**Fichier** : `src/lib/components/star-rating/star-rating.component.ts`

**Description**  
Affichage et/ou saisie d'une note en étoiles (1-5). Visible dans les tables hôtels et le formulaire d'ajout.

**Apparence Figma**

- 5 étoiles `material-symbols:star`
- Étoile pleine : `#e87d1e` (orange brand)
- Étoile vide : `#e1e4ed`
- Taille : 16px (display) / 34px (input formulaire)
- Mode lecture seule ou interactif

**Interface**

```typescript
// Inputs
value: number; // 0-5
max: number; // défaut: 5
readonly: boolean; // défaut: false
size: 'sm' | 'md' | 'lg';
// Outputs
ratingChange: number;
// ControlValueAccessor
```

---

### 15. `CategoryRating`

**Fichier** : `src/lib/components/category-rating/category-rating.component.ts`

**Description**  
Sélecteur de catégorie hôtel par étoiles cliquables. Visible dans le formulaire "Ajouter un hôtel" (champ Catégorie).

**Apparence Figma**

- 5 étoiles cliquables, taille 34px
- Étoile sélectionnée et précédentes : `#e87d1e`
- Étoile non sélectionnée : `#e1e4ed`
- Label "Catégorie" au-dessus

**Interface**

```typescript
// Inputs
value: number; // 1-5
// Outputs
valueChange: number;
// ControlValueAccessor
```

> **Note** : `CategoryRating` est une variante interactive de `StarRating`.  
> Peut être implémenté comme un alias avec `readonly: false`.

---

## P3 — Nice-to-have (graphiques et carte)

---

### 16. `DonutChart`

**Fichier** : `src/lib/components/charts/donut-chart.component.ts`

**Description**  
Graphique donut "Réservation par type" visible sur le dashboard.

**Apparence Figma**

- Donut avec 3 segments : Hôtels (bleu), Location courte durée (vert), Location mensuelle (orange)
- Valeur centrale : nombre total (ex: "428")
- Légende à droite : label + count + couleur dot
- Dimensions : ~163×164px

**Interface**

```typescript
interface DonutSlice {
  label:  string;
  value:  number;
  color:  string;
}

// Inputs
slices:       DonutSlice[]
centerLabel?: string
centerValue?: string | number
// Dépendance recommandée : ng2-charts / Chart.js ou ngx-echarts
```

---

### 17. `LineChart`

**Fichier** : `src/lib/components/charts/line-chart.component.ts`

**Description**  
Graphique courbes "Revenus" visible sur le dashboard et la page Statistiques.

**Apparence Figma**

- 2 courbes : Revenus (bleu `#2b7fff`) + Commissions (orange `#e87d1e`)
- Axe X : dates (20 Mai → 26 Mai)
- Axe Y : montants (0 → 25M)
- Points de données avec tooltip au survol
- Fond blanc, grid lines `#f7f7f7`
- Filtres : "7 derniers jours" / "Ce mois" / "Trimestre" / "Année"

**Interface**

```typescript
interface ChartSeries {
  label:  string;
  data:   number[];
  color:  string;
}

// Inputs
series:     ChartSeries[]
labels:     string[]        // axe X
yAxisLabel?: string
// Outputs
periodChange: string
```

---

### 18. `BarChart`

**Fichier** : `src/lib/components/charts/bar-chart.component.ts`

**Description**  
Graphique barres groupées "Analyse commissions vs dépenses" visible dans Statistiques & Rapports.

**Apparence Figma**

- Barres groupées par mois (Jan → Juin)
- 2 séries : Commissions (bleu) + Dépenses (orange)
- Légende en haut à droite
- Axe Y : montants

**Interface**

```typescript
// Mêmes interfaces que LineChart
// Inputs
series:   ChartSeries[]
labels:   string[]
stacked:  boolean           // défaut: false
```

---

### 19. `MapView`

**Fichier** : `src/lib/components/map-view/map-view.component.ts`

**Description**  
Carte interactive avec pins hôtels (bleu) et agences (orange). Visible sur le dashboard (aperçu géographique) et la page "Carte interactive".

**Apparence Figma**

- Fond carte (image ou tile layer)
- Pins hôtels : icône `hugeicons:hotel-01` sur fond bleu
- Pins agences : icône `material-symbols:real-estate-agent-outline` sur fond orange
- Popup au clic : nom + ville + bouton "Voir les détails"
- Filtres : Rechercher / Type / Zone
- Légende : Hôtels (bleu) / Agences (orange)

**Interface**

```typescript
interface MapPin {
  id:     string | number;
  lat:    number;
  lng:    number;
  type:   'hotel' | 'agency';
  name:   string;
  city:   string;
}

// Inputs
pins:         MapPin[]
center?:      [number, number]
zoom?:        number
// Outputs
pinClick:     MapPin
// Dépendance recommandée : Leaflet via ngx-leaflet
```

---

## Ordre d'implémentation recommandé

```
Sprint 1 — Fondations formulaires
  ├── StarRating          (simple, réutilisé partout)
  ├── CategoryRating      (alias StarRating interactif)
  ├── PhoneInput          (bloquant pour tous les formulaires)
  ├── FileUpload          (bloquant pour ajout agence/hôtel)
  └── LogoUpload          (bloquant pour ajout agence/hôtel)

Sprint 2 — Navigation et listes
  ├── BreadcrumbNav       (intégration dans PageHeaderComponent)
  ├── SubNavTabs          (filtrage des listes)
  ├── PropertyCard        (liste propriétés)
  ├── AgencyCard          (liste agences)
  └── HotelCard           (liste hôtels grille)

Sprint 3 — Pages de détail
  ├── DetailInfoBlock     (détails hôtel/agence/réservation)
  ├── DocumentList        (détails agence)
  ├── BookingTimeline     (détails réservation)
  ├── PaymentBreakdown    (détails réservation/paiement)
  └── ApprovalModal       (validation agence/hôtel)

Sprint 4 — Graphiques et carte
  ├── DonutChart          (dashboard)
  ├── LineChart           (dashboard + stats)
  ├── BarChart            (stats)
  └── MapView             (dashboard + carte interactive)
```

---

## Dépendances externes à installer

| Package                               | Usage                | Composants                      |
| ------------------------------------- | -------------------- | ------------------------------- |
| `chart.js` + `ng2-charts`             | Graphiques           | DonutChart, LineChart, BarChart |
| `leaflet` + `@asymmetrik/ngx-leaflet` | Carte interactive    | MapView                         |
| `libphonenumber-js`                   | Validation téléphone | PhoneInput                      |

---

## Conventions à respecter

- Tous les composants sont **standalone** avec l'API **signals** (`input()`, `output()`, `computed()`)
- Implémenter **ControlValueAccessor** pour tous les composants de formulaire
- Chaque composant expose un **`data-ubax-motion`** attribute pour les animations d'entrée
- Les couleurs viennent **exclusivement** des CSS custom properties (`var(--color-*)`) ou des classes Tailwind du preset
- Aucun style inline hardcodé — tout passe par les tokens du design system
- Tests unitaires dans `*.spec.ts` pour la logique (pas le rendu)

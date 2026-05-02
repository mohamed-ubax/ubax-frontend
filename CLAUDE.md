# Ubax Frontend LLM Instructions

Ce fichier est le point d'entree pour Claude.
Le miroir `.github/copilot-instructions.md` doit rester synchronise avec ce document afin que Claude et Copilot recoivent les memes instructions de travail.
Ces regles s'appliquent a tout LLM qui intervient sur ce workspace.

## 1. Analyse actuelle du projet

Le workspace est un monorepo Nx Angular moderne avec une separation deja saine entre applications, shells, features, data-access, UI partagee et client API genere.

Points forts constates :

- Angular 21.2 en mode standalone, sans NgModule applicatif.
- Nx 22 avec frontieres de modules enforcees par tags `scope:*` et `type:*`.
- Client OpenAPI centralise dans `libs/shared/api-types` via `ng-openapi-gen`.
- Authentification et primitives generiques mutualisees dans `libs/shared/data-access`.
- Stores web bases sur NgRx Signals et `signalStore`.
- Validation workspace formalisee avec `lint:workspace`, `test:workspace`, `build:workspace` et `verify:workspace`.
- Apps se limitant majoritairement au bootstrap, au routing racine et au wiring des providers.

Risques ou chantiers encore ouverts :

- La couverture de tests unitaires reste partielle et concentree sur peu de projets.
- Plusieurs libraries de features n'ont pas encore de cible `test` Nx.
- Les specs e2e actuelles sont encore des exemples a remplacer.
- Le README racine reste generique et n'explique pas encore l'architecture metier du monorepo.

Conclusion de travail :

- L'architecture est deja scalable et bien au-dessus d'un monorepo Angular standard.
- Le principal levier restant pour fiabiliser le projet est la generalisation de tests unitaires ciblant les stores, adapters, layouts et pages a logique UI non triviale.

## 2. Stack et versions de reference

Respecter les versions et paradigmes en place, sauf demande explicite de migration :

- Angular `~21.2.x`
- Nx `22.5.4`
- TypeScript `~5.9.x`
- NgRx Signals `^21.1.x`
- PrimeNG `^21.1.x`
- PrimeUIX Themes `^2.x`
- RxJS `~7.8.x`
- Vitest `^4.x`
- Playwright `^1.36.x`
- Tailwind CSS `^3.x`
- SCSS pour les styles applicatifs et component styles
- `ng-openapi-gen` `^1.0.x`
- GSAP `^3.14.x`
- Lenis `^1.3.x`

## 3. Regles non negociables pour tout LLM

- Ne pas reintroduire de NgModule applicatif si un equivalent standalone suffit.
- Utiliser `inject()` au lieu d'alourdir les constructeurs quand cela reste lisible.
- Garder les composants en `ChangeDetectionStrategy.OnPush` quand c'est applicable.
- Utiliser les Signals Angular et NgRx Signals pour l'etat local et applicatif moderne.
- Ne pas mettre de logique metier dans les composants de page si elle peut vivre dans un store, un service de facade ou un adapter.
- Utiliser les aliases TypeScript `@ubax-workspace/*` pour les imports inter-librairies.
- Interdire les imports relatifs traversant les frontieres de projets Nx.
- Ne pas modifier manuellement le code genere dans `libs/shared/api-types`.
- Regenerer le client API avec `npm run api:generate` si la specification OpenAPI change.
- Utiliser uniquement SCSS ou Tailwind. Ne pas introduire de plain CSS hors contrainte exceptionnelle.
- Preserver la separation `shared` versus `web` versus `portal`.
- Preserver la separation `app`, `shell`, `feature`, `layout`, `data-access`, `ui`, `api-types`.
- Toute nouvelle logique testable dans une lib doit idealement arriver avec une spec unitaire ou un plan clair de test immediat.

## 4. Frontieres d'architecture a respecter

Les contraintes ESLint/Nx actuelles doivent etre considerees comme la source de verite.

Contraintes par scope :

- `scope:shared` ne depend que de `scope:shared`.
- `scope:web` depend de `scope:web` et `scope:shared`.
- `scope:portal` depend de `scope:portal` et `scope:shared`.

Contraintes par type :

- `type:app` peut dependre de `type:shell`, `type:feature`, `type:layout`, `type:data-access`, `type:ui`, `type:api-types`.
- `type:shell` peut dependre de `type:feature`, `type:data-access`, `type:ui`, `type:api-types`.
- `type:feature` peut dependre de `type:feature`, `type:layout`, `type:data-access`, `type:ui`, `type:api-types`.
- `type:layout` peut dependre de `type:layout`, `type:data-access`, `type:ui`, `type:api-types`.
- `type:data-access` ne depend que de `type:data-access` et `type:api-types`.
- `type:ui` ne depend que de `type:ui`.
- `type:api-types` ne depend que de `type:api-types`.
- `type:e2e` peut consommer les surfaces applicatives necessaires au test end-to-end.

Interpretation pratique :

- Une feature n'appelle pas directement des details HTTP si la logique peut rester dans `data-access`.
- Une librairie UI partagee ne connait ni le routeur applicatif, ni les stores metier, ni les endpoints API.
- Les apps ne deviennent pas des fourre-tout. Elles composent, elles n'hebergent pas la logique metier detaillee.

## 5. Structure de dossiers a respecter

Structure racine attendue :

```text
apps/
  ubax-web/
  ubax-web-e2e/
  ubax-portal/
  ubax-portal-e2e/
libs/
  shared/
    api-types/
    data-access/
    ui/
  ubax-web/
    shell/
    data-access/
    features/
      archivage/
      dashboard/
      demandes/
      espaces/
      finance/
      hotel/
      immobilier/
      location/
  ubax-portal/
    layout/
    features/
scripts/
```

Responsabilites par zone :

| Zone                        | Responsabilite                                                                   | Ce qui ne doit pas s'y trouver                                                          |
| --------------------------- | -------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `apps/ubax-web`             | bootstrap Angular, providers globaux, config runtime, racine de navigation       | logique metier detaillee, appels HTTP metier directs, composants reutilisables partages |
| `apps/ubax-portal`          | bootstrap Angular, SSR portal, config runtime, routing racine                    | logique metier detaillee de pages et adapters d'API                                     |
| `apps/*-e2e`                | tests Playwright                                                                 | logique produit partagee                                                                |
| `libs/shared/api-types`     | client API genere, modeles DTO, configuration API                                | logique metier, mapping UI, adaptations ad hoc                                          |
| `libs/shared/data-access`   | auth partagee, session, utilitaires de stores generiques, primitives transverses | logique specifique au web ou au portal                                                  |
| `libs/shared/ui`            | composants UI purs et reutilisables                                              | navigation metier, appels API, connaissance d'un domaine web ou portal                  |
| `libs/ubax-web/shell`       | routes web, guards, interceptors, theme, orchestration transverse web            | details CRUD d'une feature specifique                                                   |
| `libs/ubax-web/data-access` | stores web, adapters, config API web, normalisation de donnees                   | pages Angular, layout, theming                                                          |
| `libs/ubax-web/features/*`  | pages, composants conteneurs, composition UI par domaine                         | acces HTTP direct, logique transverse d'auth, code partage global                       |
| `libs/ubax-portal/layout`   | coquille publique, layout, interactions scroll/animation portal                  | logique metier de pages ou API                                                          |
| `libs/ubax-portal/features` | pages portal et composants fonctionnels portal                                   | infra transverse partagee ou services low-level                                         |
| `scripts`                   | generation, import d'assets, utilitaires hors runtime                            | logique runtime chargee par Angular                                                     |

## 6. Regles de separation des responsabilites

### Apps

- Les apps doivent rester fines.
- Elles declarent les providers globaux, la configuration environnementale et le routing racine.
- Elles ne doivent pas contenir les services metier que les libs peuvent porter.

### Shells

- Les shells centralisent les routes, guards, interceptors, theming et orchestration transverse.
- Un shell peut composer plusieurs features mais ne doit pas absorber la logique interne de ces features.

### Features

- Une feature contient les pages, conteneurs, composants locaux et l'orchestration d'affichage d'un domaine.
- Une feature consomme ses stores et facades depuis `data-access`.
- Une feature ne doit pas implementer son propre client HTTP si une couche `data-access` existe deja.

### Data-access

- `data-access` est la seule couche qui parle aux endpoints et qui connait les adaptations entre DTO et modeles utilises par l'UI.
- Les stores NgRx Signals y vivent naturellement.
- Les mappings `DTO -> UI model` et `UI input -> request payload` doivent y rester.
- Les composants Angular ne doivent pas refaire ces mappings inline.

### Shared UI

- `shared/ui` ne doit contenir que de l'UI reusable et agnostique du domaine.
- Un composant shared UI peut emettre des events et recevoir des inputs, mais ne doit pas connaitre `AuthStore`, `Router`, `HttpClient` ou un endpoint.

### API generated layer

- `shared/api-types` est un artefact de generation et une couche de transport.
- On n'y ajoute pas de logique metier manuelle.
- Toute customisation metier va dans `shared/data-access` ou dans un `data-access` scope web/portal.

## 7. Bonnes pratiques Angular 21 a respecter

### Standalone et DI

- Preferer les composants standalone, les providers fonctions et `ApplicationConfig`.
- Preferer `provideRouter`, `provideHttpClient`, `withFetch`, `withInterceptors`, `withViewTransitions` quand deja utilises.
- Utiliser `inject()` pour les dependances locales et les stores.

### Reactivite et etat

- Utiliser `signal`, `computed`, `effect` ou `signalStore` selon le besoin.
- Pour un etat metier partage, preferer `signalStore` avec `withState`, `withComputed`, `withMethods`.
- Pour des flux RxJS relies a un store, utiliser `rxMethod` et `tapResponse` plutot que des subscriptions manuelles dispersees.
- Eviter les `BehaviorSubject` si le besoin est mieux servi par Signals.

### Composants

- Garder les composants declaratifs, petits et focalises.
- Toute logique de derivee de donnees reutilisable doit etre extraite dans un store, un helper ou une facade.
- Nettoyer explicitement les listeners, hooks d'animation et side effects quand un composant sort de l'ecran.
- Proteger l'acces a `window`, `document`, `location` et `localStorage` quand du code peut etre execute en contexte SSR.

### Routing

- Les routes vivent dans le shell ou dans la feature possedant le domaine.
- Les guards et interceptors restent dans le shell ou la couche transverse, pas dans les composants.
- Le composant de page ne doit pas contenir de logique de securite reproduite localement si un guard existe deja.

### HTTP et API

- Les appels HTTP directs doivent etre centralises dans `data-access`.
- Si un endpoint existe dans le client OpenAPI genere, le consommer via `shared/api-types` plutot que recrire un appel manuel.
- Les parametres de requete et mappings de reponse doivent etre normalises dans les configs/stores, pas dans les templates ou pages.

### Styles et UI

- Utiliser SCSS ou Tailwind selon le contexte. Ne pas introduire de CSS brut isole hors justification claire.
- Les tokens visuels PrimeNG doivent passer par le preset/theme existant quand c'est applicable.
- Les animations GSAP et le scroll Lenis restent limites a la couche vue et doivent etre detruits proprement.

## 8. Bonnes pratiques par dependance majeure

### NgRx Signals

- Utiliser `patchState` plutot qu'une mutation manuelle de l'etat.
- Centraliser les transitions de chargement, succes et erreur dans les stores.
- Tester les branches d'erreur et les fallbacks de store, pas seulement le chemin heureux.

### PrimeNG

- Utiliser les composants PrimeNG en restant coherents avec le preset visuel existant.
- Ne pas disperser des surcharges CSS non documentees dans les features si un composant shared UI ou un theme peut porter la variation.

### GSAP et Lenis

- Limiter ces dependances au portal public ou aux surfaces explicitement animees.
- Toute inscription a un listener ou a un contexte GSAP doit etre nettoyee au destroy.
- Les animations ne doivent pas melanger logique metier et logique de presentation.

### OpenAPI generation

- Toute evolution de contrat backend doit d'abord passer par la specification puis par `npm run api:generate`.
- Les fichiers generes ne doivent pas etre manuellement reformates ni enrichis a la main.

### Nx

- Toute nouvelle librairie doit recevoir les tags `scope:*` et `type:*` corrects.
- Toute logique reutilisable doit etre mise dans la plus petite lib qui possede reellement la responsabilite.
- Avant de creer une nouvelle lib shared, verifier si le besoin est vraiment partage entre web et portal.

## 9. Conventions de code a suivre dans ce repo

- Preferer les fonctions pures pour les mappings et helpers.
- Garder les DTO separes des modeles UI si leur forme diverge.
- Eviter les types `any`. Preferer des types derives du client genere ou des modeles explicites.
- Eviter les commentaires inutiles. Commenter uniquement les invariants ou comportements subtils.
- Ne pas introduire de logique de fallback implicite fragile sans test associe.
- Utiliser des noms de fichiers et symboles coherents avec le domaine et la responsabilite.
- Exporter les surfaces publiques via `src/index.ts` de la lib concernee.

## 10. Strategie de tests actuelle

Les projets ayant actuellement une cible `test` Nx sont :

- `shared-data-access`
- `ubax-web-data-access`
- `ubax-web-shell`
- `ubax-portal`
- `ubax-web`

Cela signifie que plusieurs libs critiques n'ont pas encore de cible de tests dediee.

Priorite de couverture a generaliser :

- Toute lib `data-access`
- Toute lib `shell`
- Toute lib `layout` avec logique d'interaction
- Toute lib `shared/ui` avec comportement non trivial
- Toute feature contenant filtres, routing derive, normalisation ou orchestration d'etat

## 11. Tests unitaires a completer en priorite

### Priorite 1

- Ajouter une cible `test` a `shared-ui` et couvrir `date-range-picker.component.ts`, notamment les emissions `null`, les changements de plage, les formats de valeur et les regressions UX deja corrigees.
- Ajouter une cible `test` a `layout` et couvrir `public-shell.component.ts` et `back-to-top.component.ts`, notamment l'ouverture/fermeture de menu, les side effects DOM, les listeners et le nettoyage au destroy.
- Ajouter une cible `test` a `ubax-portal-features` et couvrir les pages `legal` et `politique-confidentialite`, notamment l'activation du TOC, la gestion des anchors et les garde-fous DOM nuls.
- Etendre `shared-data-access/src/lib/with-api-resource.feature.spec.ts` pour couvrir les branches `create`, `update`, `delete`, les erreurs HTTP et les cas de mapping de liste/detail heterogenes.
- Etendre `shared-data-access/src/lib/auth/auth.service.spec.ts` avec les branches d'erreur `login`, `logout`, `refreshToken` et le comportement quand l'API retourne des reponses inattendues.

### Priorite 2

- Etendre `ubax-web/data-access/src/lib/store/auth/auth.store.spec.ts` pour couvrir `setRole`, `setUser`, le fallback `loadMe` a partir du JWT, la branche `logout` en erreur, et le chemin `redirectBrowserToPortalLogin()`.
- Verifier et completer les specs des stores `demandes`, `hotel` et `location` avec les cas `loading`, `error`, mapping des payloads et mutations reussies/echouees.
- Ajouter des tests de composition de routes et de securite dans `ubax-web-shell` quand une page depend d'un role ou d'une session expiree.

### Priorite 3

- Ajouter des cibles `test` aux libs de features web qui portent une logique reelle : `dashboard`, `demandes`, `finance`, `hotel`, `location`, `archivage`, `immobilier`, `espaces`.
- Sur ces libs, tester au minimum les pages a forte logique de filtres, transformations, navigation conditionnelle, affichage derive et orchestration store-route.
- Remplacer les specs e2e examples dans `apps/ubax-web-e2e` et `apps/ubax-portal-e2e` par de vrais parcours critiques, meme si cela releve du e2e et non du test unitaire.

## 12. Definition of done pour une modification de code

Avant de considerer une tache terminee, verifier autant que possible :

- Le code respecte les tags Nx et les frontieres de dependances.
- Les imports inter-librairies passent par les aliases `@ubax-workspace/*`.
- Les fichiers generes n'ont pas ete modifies manuellement hors regeneration volontaire.
- Les tests unitaires lies a la zone modifiee existent ou ont ete ajoutes si la logique est non triviale.
- Les commandes de validation utiles sont executees selon le scope du changement.

Commandes de reference :

```bash
npm run api:generate
npm run lint:workspace
npm run test:workspace
npm run build:workspace
npm run verify:workspace
```

## 13. Directive finale pour tout LLM intervenant ici

Quand tu ajoutes ou modifies du code dans ce repo :

- choisis d'abord la bonne couche,
- garde les apps minces,
- mets les appels API et mappings dans `data-access`,
- garde `shared/ui` purement presentational,
- respecte strictement les aliases et les frontieres Nx,
- n'edite jamais le client OpenAPI a la main,
- ajoute ou etends les tests sur toute logique non triviale,
- valide le changement avec les commandes Nx appropriees.

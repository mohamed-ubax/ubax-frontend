# SCRUM-138 — PARTNER (Candidatures partenaires)

**Epic :** `UBAX-FE-PARTNER`  
**Rôle requis (JWT) :** Aucun pour la soumission · `UBAX_ADMIN` ou `UBAX_SUPER_ADMIN` pour la gestion  
**Sprint :** Tableau Sprint 3 (actif)  
**Assigné à :** rmeissa  

---

## Objectif

Le module **Partner** gère le processus de candidature des agences immobilières et hôtels qui souhaitent rejoindre la plateforme UBAX en tant que partenaires.

**Flux principal :**
1. Le futur partenaire remplit un formulaire public avec ses informations légales et joint ses documents obligatoires (RCCM, DFE, bail, logo).
2. La candidature arrive avec le statut `PENDING` dans le back-office UBAX.
3. Un Admin UBAX passe la demande en `UNDER_REVIEW` pour signaler qu'elle est en cours d'examen.
4. L'Admin peut demander des compléments d'information (`INCOMPLETE`) — le partenaire doit alors resoumettre.
5. L'Admin approuve (`APPROVED`) → le backend crée automatiquement le compte Keycloak `UBAX_PARTNER` et l'entité agence/hôtel, ou rejette définitivement (`REJECTED`).
6. Chaque changement de statut est tracé dans un historique consultable.

**Cycle de vie des statuts :**
```
PENDING → UNDER_REVIEW → APPROVED
                       → REJECTED
                       → INCOMPLETE → (nouvelle soumission) → PENDING
```

---

## Sous-tâches

### ✅ SCRUM-139 — UBAX-FE-501 · Formulaire de candidature partenaire (Public)
**Statut :** Terminé(e)  
**Acteur :** Grand public (sans compte)  
**Endpoint :** `POST /v1/partner/applications` (multipart/form-data)

---

### 🔲 SCRUM-141 — UBAX-FE-502 · Liste des candidatures partenaires (Admin)
**Statut :** À faire  
**Acteur :** `ADMIN` / `SUPER_ADMIN`  
**Endpoint :** `GET /v1/partner/admin/applications`  
**Query params :** `status` (optionnel) · `page` (défaut 0) · `size` (défaut 20) · `sort=submittedAt,desc`

**Critères d'acceptation :**
- Tableau paginé avec colonnes : nom entreprise, type (`AGENCE`/`HOTEL`), représentant légal, email, ville, statut (badge coloré), date soumission, actions
- Filtre par statut (`PENDING`, `UNDER_REVIEW`, `INCOMPLETE`, `APPROVED`, `REJECTED`)
- Badge `partnerType` distinctif (`AGENCE` bleu / `HOTEL` violet)
- Lien vers le détail (UBAX-FE-503)
- Compteur par statut en en-tête de page (ex : 12 PENDING, 3 UNDER_REVIEW…)

**Figma :** https://www.figma.com/design/JBazi72JO2UU1eFyW2upsX/BACK-OFFICE-UBAX--Copy-?node-id=122-2187&m=dev

---

### 🔲 SCRUM-142 — UBAX-FE-503 · Détail d'une candidature partenaire (Admin)
**Statut :** À faire  
**Acteur :** `ADMIN` / `SUPER_ADMIN`  
**Endpoint :** `GET /v1/partner/admin/applications/{id}`

**Critères d'acceptation :**
- Section informations entreprise : nom, type, représentant, email, téléphone, ville, pays, zone, adresse postale
- Section documents : liens cliquables vers RCCM, DFE, bail, logo (ouverture dans un nouvel onglet)
- Section statut actuel avec badge + date de soumission
- Timeline de l'historique des statuts (`statusHistory`) avec auteur, date et commentaire
- Si `status` actionnable (`PENDING`, `UNDER_REVIEW`, `INCOMPLETE`) : afficher les boutons de décision (UBAX-FE-504)
- Si `status = APPROVED` ou `REJECTED` : afficher `reviewedByName`, `reviewedAt`, `rejectionReason`

**Figma :** https://www.figma.com/design/JBazi72JO2UU1eFyW2upsX/BACK-OFFICE-UBAX--Copy-?node-id=151-390&m=dev

---

### 🔲 SCRUM-140 — UBAX-FE-504 · Décision sur une candidature partenaire (Admin)
**Statut :** À faire  
**Acteur :** `ADMIN` / `SUPER_ADMIN`  
**Endpoint :** `PATCH /v1/partner/admin/applications/{id}/decision`  
**Body :** `{ "newStatus": "APPROVED|REJECTED|INCOMPLETE|UNDER_REVIEW", "comment": "string" }`

**Actions disponibles selon le statut courant :**
| Statut courant | Actions possibles |
|---|---|
| `PENDING` | → `UNDER_REVIEW` · → `REJECTED` |
| `UNDER_REVIEW` | → `APPROVED` · → `REJECTED` · → `INCOMPLETE` |
| `INCOMPLETE` | → `UNDER_REVIEW` · → `REJECTED` |
| `APPROVED` | *(aucune action)* |
| `REJECTED` | *(aucune action)* |

**Critères d'acceptation :**
- Bouton « Prendre en charge » → `newStatus: UNDER_REVIEW` (depuis `PENDING`)
- Bouton « Approuver » (vert) → `newStatus: APPROVED` avec confirmation
- Bouton « Demander des compléments » (orange) → `newStatus: INCOMPLETE` + modal avec champ `comment` obligatoire
- Bouton « Rejeter » (rouge) → `newStatus: REJECTED` + modal avec champ `comment` obligatoire
- Afficher uniquement les actions valides selon le statut courant
- Si `APPROVED` : afficher message informatif « Un compte partenaire a été créé automatiquement »
- Mise à jour de la timeline `statusHistory` après chaque décision

**Figma Refus :** https://www.figma.com/design/JBazi72JO2UU1eFyW2upsX/BACK-OFFICE-UBAX--Copy-?node-id=158-952&m=dev  
**Figma Approbation :** https://www.figma.com/design/JBazi72JO2UU1eFyW2upsX/BACK-OFFICE-UBAX--Copy-?node-id=158-1148&m=dev

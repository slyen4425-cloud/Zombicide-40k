# GenSrpG — Travail courant

## Référence obligatoire

Lire avant tout changement :
1. `docs/GENSRPG_CHARTE.md`
2. `docs/GENSRPG_RESTRUCTURATION_ROADMAP.md`
3. ce fichier
4. `docs/GENSRPG_COORDINATION.md`
5. `docs/GENSRPG_PHASE1_SENTINEL_AUDIT.md`

## Production sûre

- `main` gelé : V16.78.114.11
- SHA attendu : `e8681f9823573ced8aec59c8ddc47a72b02bc663`
- ne jamais travailler directement sur `main`

## Phase 1 — clôture

Checkpoint final :
`checkpoint/gensrpg-phase1-four-module-noninterference-green-2026-09-18`

SHA :
`b78b5426c8ce19bb0c0047e95fc7e0bd1a62930f`

CI de fermeture :
- Architecture `35322475364` — SUCCESS
- Firefox `35322475427` — SUCCESS
- Tactical Dock `35322475353` — SUCCESS

La matrice Phase 1 ne contient plus de manque majeur identifié.

## Chantier courant

**Phase 2 — cartographie réelle du runtime**

Branche :
`work/gensrpg-phase2-runtime-map-2026-09-18`

Checkpoint de départ :
`checkpoint/gensrpg-start-phase2-runtime-map-2026-09-18`

Base exacte :
`b78b5426c8ce19bb0c0047e95fc7e0bd1a62930f`

## Périmètre déclaré

Chantier **documentation / inventaire uniquement** en première intention.

À cartographier :
- scripts réellement chargés par `index.html` ;
- scripts injectés dynamiquement / bootstraps ;
- auto-installs ;
- wrappers / monkey-patches ;
- MutationObserver ;
- listeners document/window ;
- timers/retries ;
- accès directs à `localStorage` / IndexedDB ;
- fonctions globales remplacées ;
- responsabilités dupliquées ;
- classement des fichiers/blocs : Core, Shell, Survie, Dungeon, Tactical, Capture, PvP, Builders, legacy/inactif.

Interdictions :
- aucun déplacement physique de code dans ce lot ;
- aucun correctif gameplay ;
- aucune suppression de runtime ;
- aucune création de nouveau wrapper ou compatibilité ;
- aucun changement de règles ;
- ne pas toucher à `main`.

## Méthode

1. inventaire automatisé du dépôt et du vrai `index.html` ;
2. liste des scripts externes et dynamiques réellement chargés ;
3. carte des blocs inline actifs ;
4. inventaire des effets globaux ;
5. attribution d'un propriétaire à chaque runtime actif ;
6. identifier les doublons/chaînes historiques et distinguer actif vs legacy ;
7. documenter les zones à extraire en Phase 3/4/5+, sans les déplacer maintenant ;
8. relancer les sentinelles pour prouver que la cartographie n'a rien modifié.

## Critère de sortie Phase 2

Aucun fichier ou bloc runtime actif sans propriétaire connu, et une carte exploitable pour les phases d'extraction suivantes.

## Prochaine étape

Créer `docs/GENSRPG_PHASE2_RUNTIME_MAP.md` à partir d'un inventaire exact du dépôt et du `index.html`, puis enrichir par catégories de side effects.

## Dette explicitement différée

La détection ennemie hors embuscade reste un chantier de caractérisation dédié, distinct de la cartographie architecturale.

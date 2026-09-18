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

## Base verte

Dernier checkpoint fonctionnel validé utilisateur :
- `checkpoint/gensrpg-tactical-dock-legacy-layer-green-2026-09-17`
- SHA `ea1ffe059a62bdae88dca46b2aeb28cbf3c784bb`
- test manuel Dock : concluant.

Audit Phase 1 fermé :
- `checkpoint/gensrpg-phase1-sentinel-gap-audit-green-2026-09-18`
- SHA `fcc9e6378263b0498170dbb7f4d110a7fe169f93`.

Charte / remise manuelle de `index.html` :
- `checkpoint/gensrpg-charter-index-html-handoff-green-2026-09-18`
- SHA `6680b800490492edf5bca587e0de6bd8d68be56f`.

## Chantier courant

**Phase 1 — sentinelle de lancement Survie par le vrai Shell**

Branche :
`work/gensrpg-phase1-survival-launch-sentinel-post-charter-2026-09-18`

Checkpoint de départ :
`checkpoint/gensrpg-start-phase1-survival-launch-sentinel-post-charter-2026-09-18`

SHA de base :
`6680b800490492edf5bca587e0de6bd8d68be56f`

## Périmètre

Lot **test-only** :
- nouveau test permanent du chemin réel Shell -> Survie ;
- raccord au workflow `gensrpg-architecture-sentinels.yml` ;
- documentation de reprise.

Aucun changement autorisé dans :
- `index.html` runtime ;
- runtime Survie ;
- Dungeon / mouvement / combat ;
- Tactical / Bridge / détection ;
- stats / dés / dégâts ;
- sauvegarde ;
- Capture ;
- PvP.

## Propriétaires réels à traverser

La sentinelle doit utiliser le code réel et prouver :
1. `openGensFamily('survival')` ;
2. sélection d'un univers Survie via `openGensBuiltInGame(...,'survival')` ;
3. préparation réelle par `newGame()` ;
4. sélection d'au moins un participant depuis l'UI ;
5. lancement par `startConfiguredGame()` ;
6. famille active = Survie ;
7. session active ;
8. menu Survie visible ;
9. aucun écran/runtime Dungeon ne prend l'autorité.

Le test ne doit pas recopier la logique métier de ces fonctions.

## Règle index.html

Le blob exact actuel de `index.html` est `8aa918ba7da41be41fb369ccc522bb217c97bfa1` (8 175 453 octets).

Si l'accès exact redevient bloquant, appliquer immédiatement la section 26 de la charte et fournir le lien direct de la branche/SHA à l'utilisateur au lieu d'utiliser une copie locale incertaine.

## Après ce lot

Ordre prévu :
1. Save & Quit + vraie reprise ;
2. placeholder PvP actuel ;
3. Capture actuel sans restauration ;
4. non-interférence explicite des quatre modules.

La détection ennemie hors embuscade reste différée vers un chantier de caractérisation dédié après la Phase 1.

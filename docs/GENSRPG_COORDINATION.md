# GenSrpG — Coordination

Ce document complète la charte, la roadmap, `GENSRPG_CURRENT_WORK.md` et l'audit Phase 1.

## Rôle du fil directeur

Un seul fil est coordinateur. Il choisit le checkpoint vert, ouvre les lots, évite les conflits de propriétaires, vérifie SHA/diff/tests, crée les checkpoints et maintient les documents de reprise.

Règle : **1 lot = 1 branche = 1 périmètre homogène**.

Aucun lot ne fusionne directement dans `main` pendant la restructuration.

## État de coordination — 2026-09-18

Production :
- `main` attendu : `e8681f9823573ced8aec59c8ddc47a72b02bc663`
- production gelée.

Chaîne verte récente :
- Dock utilisateur : `ea1ffe059a62bdae88dca46b2aeb28cbf3c784bb`
- audit Phase 1 : `fcc9e6378263b0498170dbb7f4d110a7fe169f93`
- charte index handoff : `6680b800490492edf5bca587e0de6bd8d68be56f`.

## Lot actif

**Sentinelle lancement Survie par le vrai Shell**

- branche : `work/gensrpg-phase1-survival-launch-sentinel-post-charter-2026-09-18`
- checkpoint de départ : `checkpoint/gensrpg-start-phase1-survival-launch-sentinel-post-charter-2026-09-18`
- base exacte : `6680b800490492edf5bca587e0de6bd8d68be56f`
- nature : tests/workflow/docs uniquement
- runtime modifiable : aucun.

Propriétaires observés, mais non modifiés :
- Shell : `openGensFamily`, `openGensBuiltInGame`, `newGame`, `startConfiguredGame`
- isolation Survie : guard de famille existant.

## Contrat cible

Le test doit traverser le vrai shell :
`Accueil -> MODE SURVIE -> univers Survie -> JOUER / PRÉPARER -> participant -> DÉMARRER LA PARTIE`.

Il doit prouver :
- famille Survie conservée ;
- session active ;
- menu de jeu visible ;
- aucun écran Dungeon actif ;
- aucun fallback Dungeon déclenché.

Interdictions :
- pas de mock réimplémentant le métier ;
- pas de nouveau wrapper runtime ;
- pas d'observer/timer de réparation ;
- pas de modification de `index.html` ;
- pas de correction gameplay dans ce lot.

## Ordre après ce lot

1. Save & Quit + vraie reprise ;
2. sentinelle placeholder PvP ;
3. sentinelle Capture sur comportement actuel ;
4. non-interférence 4 modules.

Le lancement Dungeon shell complet reste un gap partiel à traiter dans un petit lot compatible.

## Signalement conservé

Détection ennemie hors embuscade : doute utilisateur à caractériser plus tard dans une branche dédiée, sans mélange avec Phase 1.

## Règle index.html

Si le blob exact devient inaccessible ou trop lourd pour les outils, appliquer la section 26 de la charte : fournir immédiatement à l'utilisateur le lien direct du `index.html` de la branche/SHA et demander son upload.

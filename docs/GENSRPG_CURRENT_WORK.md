# GenSrpG — Travail courant

## Référence obligatoire

Lire avant tout changement :
1. `docs/GENSRPG_CHARTE.md`
2. `docs/GENSRPG_RESTRUCTURATION_ROADMAP.md`
3. ce fichier
4. `docs/GENSRPG_COORDINATION.md`

## Production sûre

- `main` gelé : V16.78.114.11
- SHA attendu : `e8681f9823573ced8aec59c8ddc47a72b02bc663`
- ne jamais travailler directement sur `main`

## Dernier checkpoint vert

`checkpoint/gensrpg-phase1-sentinel-gap-audit-green-2026-09-18`  
SHA : `fcc9e6378263b0498170dbb7f4d110a7fe169f93`

Audit détaillé :
`docs/GENSRPG_PHASE1_SENTINEL_AUDIT.md`

## Chantier courant

**Phase 1 — sentinelle de lancement Survie par le vrai shell**

Branche :
`work/gensrpg-phase1-survival-launch-sentinel-2026-09-18`

Checkpoint de départ :
`checkpoint/gensrpg-start-phase1-survival-launch-sentinel-2026-09-18`

SHA de base :
`fcc9e6378263b0498170dbb7f4d110a7fe169f93`

## Périmètre déclaré

Module : Shell + Survie, **tests uniquement**.

Propriétaires traversés sans modification :
- `openGensFamily('survival')`
- `openGensBuiltInGame(profileId,'survival')`
- préparation de partie via `newGame()`
- lancement via `startConfiguredGame()`
- guard de famille `GensSurvivalModeIsolation1678104`

Systèmes protégés et interdits à la modification :
- runtime Survie ;
- runtime Dungeon ;
- Tactical / combat / détection ;
- stats / dés / dégâts ;
- sauvegarde / reprise ;
- Capture ;
- PvP ;
- `index.html` runtime.

## Test prévu

Sentinelle Playwright mobile sur la composition réelle de `preview.html` + `index.html` :
1. partir de l'accueil racine ;
2. ouvrir MODE SURVIE ;
3. ouvrir un univers Survie réel ;
4. entrer dans JOUER / PRÉPARER ;
5. sélectionner un vrai participant disponible ;
6. cliquer DÉMARRER LA PARTIE ;
7. prouver que la session devient active en Survie ;
8. prouver que le guard reste `survival` ;
9. prouver qu'aucun overlay/runtime Dungeon ne prend l'autorité.

Le test doit être branché dans `gensrpg-architecture-sentinels.yml`.

## Risque

Le seul risque est de rendre le test artificiel en mockant le shell. Interdit : la sentinelle doit charger le vrai `index.html` via la preview restructuration.

## Dette différée

Détection ennemie hors embuscade : lot de caractérisation séparé après Phase 1.

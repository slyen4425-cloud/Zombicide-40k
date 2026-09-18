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

## Dernier état vert de référence

- audit Phase 1 documenté depuis le checkpoint Dock validé ;
- règle permanente d'accès à `index.html` ajoutée et validée ;
- checkpoint : `checkpoint/gensrpg-charte-index-recovery-green-2026-09-18`
- SHA : `cadc1a133e1513218bed7f3af19fe176805bf871`
- CI sur ce SHA : architecture, Dock et Firefox vertes.

## Chantier courant

**Phase 1 — sentinelle test-only de lancement Survie par le vrai shell**

Branche :
`work/gensrpg-phase1-survival-shell-sentinel-2026-09-18`

Checkpoint de départ :
`checkpoint/gensrpg-start-phase1-survival-shell-sentinel-2026-09-18`

SHA de base :
`cadc1a133e1513218bed7f3af19fe176805bf871`

## Périmètre déclaré

Module concerné : **Survie / Shell**, test uniquement.

Propriétaires à traverser sans les remplacer :
- `openGensFamily('survival')` ;
- `openGensBuiltInGame(...,'survival')` ;
- chemin réel de préparation/lancement Survie ;
- guard de famille/session existant.

Systèmes réutilisés :
- Shell actuel ;
- isolation Survie existante ;
- workflow `gensrpg-architecture-sentinels.yml`.

Interdictions :
- aucun changement runtime ;
- aucun changement gameplay ;
- aucun changement Dungeon/Tactical ;
- aucun observer, timer, retry ou wrapper ajouté ;
- aucune restauration Capture ;
- aucun moteur PvP ;
- ne pas modifier `main`.

Tests prévus :
- sentinelle utilisant le vrai code shell ;
- vérification que la famille active reste `survival` ;
- vérification qu'aucun runtime/écran Dungeon ne prend l'autorité ;
- branchement CI architecture.

Risque inter-module : faible si le lot reste test-only.

## Prochaine étape

Caractériser le vrai chemin shell Survie dans `index.html`, écrire la sentinelle sans recopier la logique métier, obtenir un RED uniquement si le raccord actuel est réellement incomplet, puis ne corriger aucun runtime dans ce lot.

## Dette explicitement différée

La détection ennemie hors embuscade reste réservée à un chantier de caractérisation dédié après la Phase 1.

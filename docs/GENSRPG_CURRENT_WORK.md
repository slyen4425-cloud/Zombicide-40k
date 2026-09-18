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

## Dernier lot validé

**Phase 1 — sentinelle test-only de lancement Survie par le vrai Shell**

Branche :
`work/gensrpg-phase1-survival-shell-sentinel-2026-09-18`

Checkpoint de départ :
`checkpoint/gensrpg-start-phase1-survival-shell-sentinel-2026-09-18`

Base exacte :
`cadc1a133e1513218bed7f3af19fe176805bf871`

SHA fonctionnel validé avant fermeture documentaire :
`aca4d8b449c37367525644781500f8972aae645d`

Checkpoint final prévu :
`checkpoint/gensrpg-phase1-survival-shell-sentinel-green-2026-09-18`

## Résultat du lot Survie

La sentinelle navigateur traverse désormais le vrai chemin Shell :

`openGensFamily('survival') -> openGensBuiltInGame(...,'survival') -> préparation réelle -> startConfiguredGame()`

Elle vérifie notamment :
- famille/session conservée à `survival` ;
- profil 40K Survie réellement sélectionné ;
- participant réellement choisi dans le pré-game ;
- session commune activée ;
- `isDungeonMode() === false` ;
- thème/overlay/runtime Dungeon non activés ni remplacés ;
- composition production toujours reliée au guard `gens-survival-mode-isolation-1678104.js`.

Le lot est resté **test/workflow/documentation uniquement**. Aucun runtime ni gameplay n'a été modifié.

CI sur `aca4d8b449c37367525644781500f8972aae645d` :
- Architecture : run `35311890710` — SUCCESS
- Firefox : run `35311890711` — SUCCESS
- Tactical Dock : run `35311890705` — SUCCESS

## Prochain chantier Phase 1

**Save & Quit + vraie reprise complète par le Shell.**

Ce chantier n'est pas encore démarré dans ce commit de fermeture. Il devra avoir :
- son propre checkpoint de départ ;
- sa propre branche ;
- un périmètre test-only en première intention ;
- une vraie recréation/rechargement de session suivie du clic Reprendre ;
- aucun correctif runtime si le test révèle un vrai défaut avant caractérisation dédiée.

## Dette explicitement différée

La détection ennemie hors embuscade reste réservée à un chantier de caractérisation dédié après la Phase 1.

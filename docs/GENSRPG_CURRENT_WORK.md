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

## Dernier checkpoint vert

Phase 1 — Capture :
`checkpoint/gensrpg-phase1-capture-current-sentinel-green-2026-09-18`

SHA :
`8d6e9523e1cf9f13f9131b8f4b74f797154ebc7c`

## RED de référence

Checkpoint :
`checkpoint/gensrpg-phase1-four-module-noninterference-red-characterized-2026-09-18`

SHA :
`6c73c598c7cee070056397bc51592e01cbb6275b`

Défaut :
transition réelle `Capture -> PvP placeholder` conservant `gensDungeonTheme` et `gensCapturePregame` sur `body`.

## Chantier courant

**Phase 1 — correctif Shell ciblé de nettoyage de contexte**

Branche :
`work/gensrpg-phase1-shell-context-cleanup-fix-2026-09-18`

Checkpoint de départ :
`checkpoint/gensrpg-start-phase1-shell-context-cleanup-fix-2026-09-18`

Sauvegarde avant runtime :
`backup/gensrpg-before-shell-context-cleanup-fix-2026-09-18`

Base exacte :
`6c73c598c7cee070056397bc51592e01cbb6275b`

## Propriétaire identifié

`openGensFamily(family)` dans le Shell principal.

Diagnostic :
- cette fonction possède le passage vers une famille racine ;
- elle masque les anciennes vues et affiche la nouvelle famille ;
- elle ne retire actuellement aucune classe de contexte transitoire du `body` ;
- `gensCapturePregame` est posé par le wizard Capture ;
- `gensAdventurePregame` est posé par le wizard Adventure ;
- `gensDungeonTheme` est posé par le contexte Adventure/Dungeon ;
- le placeholder PvP n'a aucun runtime qui puisse nettoyer ces classes après coup.

## Périmètre autorisé

Correctif soustractif et local au propriétaire Shell :
- nettoyer les classes de contexte de **pré-game** lorsqu'on quitte une vue de jeu pour une famille ;
- empêcher un thème Adventure/Dungeon de rester actif dans une famille non-Adventure, notamment PvP ;
- ne pas effacer profil, sauvegarde, session ou données persistantes ;
- ne pas créer de nouvel état, wrapper, observer, timer ou retry ;
- ne pas modifier les moteurs Capture, Dungeon, Survie, Tactical ou PvP ;
- ne pas changer les règles de gameplay.

## Correctif envisagé

Dans `openGensFamily(family)` :
- retirer systématiquement `gensCapturePregame` et `gensAdventurePregame` car aucune famille racine n'est un pré-game ;
- retirer `gens-pure-capture` car aucune famille racine n'est le runtime Capture actif ;
- synchroniser `gensDungeonTheme` avec la famille demandée : actif uniquement pour `adventure`, absent pour `survival` et `pvp`.

Aucune autre autorité ne doit être ajoutée.

## Tests obligatoires

1. la sentinelle quatre modules doit devenir GREEN ;
2. Survie Shell reste GREEN ;
3. Save & Quit / reprise reste GREEN ;
4. PvP placeholder reste GREEN ;
5. Capture actuel reste GREEN ;
6. Architecture reste GREEN ;
7. Firefox et Tactical Dock restent GREEN ;
8. diff runtime limité au propriétaire Shell attendu.

## Prochaine étape

Appliquer le nettoyage minimal dans `openGensFamily()`, puis relancer la CI complète avant toute clôture.

## Dette explicitement différée

La détection ennemie hors embuscade reste réservée à un chantier de caractérisation dédié après la Phase 1.

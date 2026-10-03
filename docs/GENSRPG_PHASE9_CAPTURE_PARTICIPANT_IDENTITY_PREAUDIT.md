# GenSrpG — Phase 9 — Pré-audit Capture participant identity — 2026-10-03

## Base

- GREEN précédent : `checkpoint/gensrpg-phase9-capture-identity-authority-raccord-green-2026-10-03`
- SHA : `fefd1ad48ee42e0cbb50b80a41171fa57a05194d`
- checkpoint start : `checkpoint/gensrpg-start-phase9-capture-participant-identity-preaudit-2026-10-03`
- branche : `work/gensrpg-phase9-capture-participant-identity-preaudit-2026-10-03`
- `main` gelée : `e8681f9823573ced8aec59c8ddc47a72b02bc663`

## Contexte

L'identité Capture est désormais possédée par `GensCaptureV1.isProfile(profile)`.
Le seam suivant doit retirer uniquement l'utilisation de l'identité Dungeon dans les chemins participants qui servent Capture.

## Questions à résoudre

1. Quelle partie exacte de `normalizeGameParticipants()` est partagée avec Dungeon ?
2. Capture a-t-il réellement besoin de cette branche ou uniquement de la normalisation générique ?
3. Pourquoi `availableParticipantHeroIds()` appelle-t-il `ensureDungeonContent()` en Capture ?
4. Quelles données Capture (trainer, starter, team/reserve) doivent être distinguées des héros Dungeon ?
5. Peut-on brancher Capture via `GensCaptureV1.isProfile(profile)` avant la branche Dungeon sans créer une seconde autorité ?
6. Quels E2E protègent sélection de trainer, starter, lancement, reprise et vrai Dungeon ?

## Invariants

- aucune modification runtime pendant le pré-audit ;
- `isDungeonMode()` inchangé ;
- une seule autorité identité Capture ;
- aucune logique Capture dans Shell ;
- vrai Dungeon et Survival non modifiés ;
- pas de labo raccordé.

## Rule 26

Attendu :
- commit `fefd1ad48ee42e0cbb50b80a41171fa57a05194d`
- blob `1d4bd0f6eddb6a58fa0939b666bbebdbb07dc3b1`
- taille `8168382`

Aucune inspection inline exacte à partir de `work50.zip`.

## Sortie attendue

- cartographie exacte participants Capture/Dungeon ;
- seam minimal sélectionné ;
- sentinelle de caractérisation ;
- triple CI GREEN ;
- checkpoint final de pré-audit ;
- seulement ensuite TDD RED runtime dédié.

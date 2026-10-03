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

Gate franchie avec `worka.zip/indexA.txt` :
- commit de base `fefd1ad48ee42e0cbb50b80a41171fa57a05194d` ;
- blob `1d4bd0f6eddb6a58fa0939b666bbebdbb07dc3b1` ;
- taille `8168382` octets.

Cette copie est la source locale exacte utilisée pour l'inspection participants.

## Résultats de caractérisation

### `normalizeGameParticipants()`

Le chemin actuel possède deux sémantiques :
- Dungeon : sélection stricte, filtrée par les IDs autorisés, sans réinjecter les héros d'un ancien état de tours ;
- hors Dungeon : en session active, fusion historique avec `loadTurnState().heroes`.

Capture entre encore dans la première branche uniquement parce que `isDungeonMode()` reste vrai pour son ancien `gameStyle="dungeon"`. Cette sémantique stricte doit être conservée, mais l'identité qui la sélectionne doit devenir Capture explicite.

### `availableParticipantHeroIds()`

La fonction :
1. applique les héros personnalisés ;
2. appelle actuellement `ensureDungeonContent()` si `isDungeonMode()` ;
3. construit les IDs depuis `CHARS` + héros personnalisés ;
4. filtre ensuite avec `allowedHeroIdsForActiveProfile()`.

Pour Capture, l'étape 2 est un couplage Dungeon résiduel : le filtre canonique de profil est déjà fourni par `allowedHeroIdsForActiveProfile()`.

### Source de vérité Capture

`allowedHeroIdsForActiveProfile()` distingue déjà correctement :
- vrai Dungeon (`GAME_PROFILE_DUNGEON_ID`) -> `DUNGEON_HERO_IDS` + héros Dungeon personnalisés ;
- profil de base -> héros non-Dungeon ;
- autre univers RPG / Monster Capture -> `profile.heroPool`, avec exclusion défensive des héros Dungeon built-in.

Le seed Monster Capture possède déjà `heroPool=["custom_mt7lk6jv_ioga"]`. Il n'est donc pas nécessaire de créer une liste participants Capture concurrente.

### Starter readiness

`gensCaptureParticipantsReady()` appelle `normalizeGameParticipants()` et vérifie ensuite `gensCaptureStarterIdsForHero(id)`. Les starters sont issus de l'état héros Capture (`creatureTeam`) et ne dépendent pas du runtime Dungeon.

## Seam runtime sélectionné

Le futur micro-lot devra uniquement séparer l'identité, pas la donnée :
- Capture explicite + vrai Dungeon partagent temporairement la même sémantique stricte de normalisation ;
- seul le vrai Dungeon déclenche `ensureDungeonContent()` ;
- Capture continue d'utiliser `heroPool` via `allowedHeroIdsForActiveProfile()` ;
- aucun nouveau service participants, aucun fallback, aucune copie de liste.

Le TDD RED devra prouver :
- présence d'un test Capture explicite via `GensCaptureV1.isProfile(getActiveGameProfile())` dans les frontières participants ;
- préservation de la branche Dungeon ;
- absence d'`ensureDungeonContent()` pour Capture ;
- parité trainer/starter/lancement/reprise ;
- non-régression Dungeon.

## Sortie attendue

- cartographie exacte participants Capture/Dungeon ;
- seam minimal sélectionné ;
- sentinelle de caractérisation ;
- triple CI GREEN ;
- checkpoint final de pré-audit ;
- seulement ensuite TDD RED runtime dédié.

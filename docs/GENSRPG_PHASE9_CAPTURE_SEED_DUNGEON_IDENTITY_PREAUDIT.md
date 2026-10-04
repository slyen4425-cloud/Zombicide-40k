# GenSrpG — Phase 9 — Pré-audit identité Capture `gameStyle:"dungeon"`

Date : 2026-10-04

## Base

- Base GREEN documentaire : `bc7d104fa76c0f83f5d88c9cd829b533179161e2`
- Checkpoint GREEN post-docs : `checkpoint/gensrpg-phase9-capture139-active-enemies-retirement-postdocs-green-2026-10-04`
- Checkpoint de départ : `checkpoint/gensrpg-start-phase9-capture-seed-dungeon-identity-preaudit-2026-10-04`
- Branche : `work/gensrpg-phase9-capture-seed-dungeon-identity-preaudit-2026-10-04`
- Production `main` gelée : `e8681f9823573ced8aec59c8ddc47a72b02bc663`

## Mission unique

Caractériser la dette d'identité restante du profil intégré Monster Capture qui porte encore `gameStyle:"dungeon"`, sans mutation runtime.

Le but n'est PAS de changer immédiatement le seed ni `isDungeonMode()`, mais de déterminer précisément :
1. quels consommateurs utilisent encore `gameStyle:"dungeon"` comme identité fonctionnelle ;
2. lesquels voient réellement le profil Capture ;
3. lesquels sont déjà protégés par `GensCaptureV1.isProfile(profile)` ou `!capture` ;
4. quelles sauvegardes/reprises ou UI dépendent encore du style historique ;
5. quel unique seam minimal peut être retiré sans casser vrai Dungeon, Capture, Survie ou PvP.

## Preuves déjà GREEN disponibles

La dernière sentinelle `gens_phase9_capture_dungeon_identity_coupling_preaudit_v1.test.cjs` établit :
- identité canonique Capture : `GensCaptureV1.isProfile(profile)` ;
- public entry Capture sans `gameStyle`, `isDungeonMode`, `ensureDungeonContent`, `DungeonCore` ni `DungeonSpatial` ;
- seed intégré `builtinMonsterCapture162` encore en `gameStyle:"dungeon"` ;
- environ 126 appels historiques à `isDungeonMode()` dans le runtime ;
- `normalizeGameParticipants()` déjà Capture-aware ;
- hydratation Dungeon participants protégée par `!capture` ;
- Capture139 déjà découplé de `ensureBaseGameProfile()` et `saveActiveEnemies([])`.

Résidus d'identité repérés dans le runtime GREEN :
- `captureFix139` : détection `realDungeon` pour le bouton Aventure ;
- `gensStability151` : Capture reconnue avant `gameStyle==="dungeon"` ;
- `builtinMonsterCapture162` : seed `gameStyle:"dungeon"` ;
- `dungeonCore310PersistenceAndTokens` : Dungeon activé via `isDungeonMode()&&!capture` ;
- autres blocs Dungeon historiques utilisant légitimement `gameStyle:"dungeon"` pour le vrai Dungeon.

## Hypothèse à vérifier — pas encore décision

Le seed `gameStyle:"dungeon"` semble être une compatibilité historique globale. Le retirer sans inventaire précis pourrait faire basculer silencieusement des branches legacy qui croient encore que Capture est Dungeon.

Aucune migration du seed n'est autorisée tant que les consommateurs et la reprise des sauvegardes existantes ne sont pas caractérisés.

## Périmètre protégé

Ne pas modifier dans ce pré-audit :
- `isDungeonMode()` ;
- le seed `gameStyle:"dungeon"` ;
- `builtinMonsterCapture162` ;
- `GensCaptureV1.isProfile()` ;
- vrai Dungeon / `GAME_PROFILE_DUNGEON_ID` ;
- Combat Dynamique ;
- Exploration / World Builder / Map Actor ;
- Survie ;
- PvP ;
- Tactical ;
- `main`.

Interdit :
- créer `isCaptureMode2()` ou une identité parallèle ;
- remplacer globalement tous les `isDungeonMode()` ;
- ajouter wrapper/fallback/timer/observer/polling ;
- modifier une sauvegarde persistante avant audit de compatibilité.

## Tests à établir

1. inventaire exact des consommateurs `gameStyle:"dungeon"` touchant Capture ;
2. séparation vrai Dungeon / Capture sur le vrai profil actif ;
3. Shell module actif et démarrage Capture ;
4. sauvegarde/reprise Capture ;
5. victoire/reprise Capture ;
6. vrai Dungeon après Survie ;
7. non-interférence quatre modules ;
8. seulement après décision : RED TDD du seam retenu.

## Rule 26

Runtime GREEN attendu avant toute inspection exacte :
- taille : `8167007` octets ;
- blob Git : `9eff1bfddc9e4fab82f7a181eb9996ecce9c6ae4`.

L'inspection détaillée de `index.html` doit utiliser une copie utilisateur correspondant exactement au SHA de cette branche, conformément à la règle 26.

## État

Pré-audit ouvert.

Aucune mutation runtime.

Prochaine étape : valider la copie exacte `index.html`, inventorier les consommateurs de l'identité Dungeon historique vus par Capture, puis sélectionner un seul seam.

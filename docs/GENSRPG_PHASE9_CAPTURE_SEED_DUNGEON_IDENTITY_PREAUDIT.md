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


## Résultat de caractérisation Rule 26

Copie utilisateur vérifiée :
- fichier reçu dans `workg.zip` sous le nom interne `indexg.txt` ;
- taille : `8167007` octets ;
- blob Git : `9eff1bfddc9e4fab82f7a181eb9996ecce9c6ae4` ;
- SHA-256 : `aaa5b7554447200efdd832c621e24e56e2e565924cd526c3f9e330184692a133`.

La copie correspond exactement au runtime GREEN attendu.

## Diagnostic navigateur sans `gameStyle:"dungeon"`

Un test navigateur de caractérisation a retiré uniquement `gameStyle` du profil Monster Capture stocké, sans modifier le runtime de production.

Run diagnostic ciblé :
- `37232449153` ;
- résultat : **FAILURE attendu de caractérisation** ;
- premier point de rupture : la carte `Monster Capture` n'apparaît plus dans `#gensFamilyGames` après ouverture de la famille Adventure ;
- timeout exact sur `[data-rpg-profile="gp_mt7ker7t_m2iw9"] .gensUniverseMainBtn`.

Le lancement Capture n'est donc pas encore testable sans ce faux style : le Shell masque le profil avant même la sélection.

## Cause exacte

Le premier propriétaire fautif est la classification Shell des profils Adventure :

`rpgProfiles()` :
- filtre actuellement uniquement `p.gameStyle==="dungeon"`.

Fallback de `renderGensRpgUniverseCards()` :
- filtre lui aussi uniquement `p?.gameStyle==="dungeon"`.

`gensFamilyForProfileId(profileId)` :
- renvoie `"adventure"` uniquement lorsque `p?.gameStyle==="dungeon"`.

En parallèle, l'autorité de contenu déjà existante `gensContentFamilyForProfile(profile)` sait déjà distinguer :
- Capture -> `"creature"` via `GensCaptureV1.isProfile(profile)` ;
- Dungeon/RPG -> `"rpg"` ou `"manga"` ;
- Survie -> `"survival"`.

Le problème est donc un **routage Shell encore fondé sur l'ancien champ d'identité**, pas un besoin métier Capture de rester Dungeon.

## Autres dépendances résiduelles observées — hors seam actuel

Le runtime contient encore de nombreux appels historiques à `isDungeonMode()`.
Plusieurs concernent :
- éditeurs équipement/ennemis ;
- deck/pioche ;
- tours et effets Dungeon ;
- économie/marchand ;
- rendu UI Dungeon ;
- spawns/ennemis ;
- reprise Dungeon.

Certaines gardes sont déjà Capture-aware, notamment :
- `availableParticipantHeroIds()` ;
- `DungeonCore01.eligible()` via famille `rpg` ;
- `dungeonCore310PersistenceAndTokens.resumeGame()` via `!capture` ;
- `updateGameStyleUi()` via `pureCapture`.

Ces dépendances ne seront pas modifiées dans le prochain micro-lot.

## Seam minimal sélectionné

**Shell — classification et visibilité des profils Adventure.**

Objectif unique :
1. faire reposer la liste Adventure sur `gensContentFamilyForProfile(profile)` au lieu du seul `gameStyle==="dungeon"` ;
2. faire reposer `gensFamilyForProfileId()` sur la même autorité de contenu ;
3. conserver le seed `gameStyle:"dungeon"` inchangé pendant ce lot ;
4. ne modifier aucun moteur Dungeon/Capture, aucun `isDungeonMode()`, aucune sauvegarde.

Contrat attendu :
- un profil Capture reconnu par `GensCaptureV1.isProfile()` reste visible dans Adventure même si son champ `gameStyle` est absent ;
- il reste routé vers la famille Shell `adventure` ;
- vrai Dungeon reste Adventure ;
- Survie reste Survival.

## RED TDD à établir

Le RED dédié doit exiger, avec un profil Capture auquel `gameStyle` a été retiré uniquement dans le test :
- carte Monster Capture visible dans la famille Adventure ;
- `gensContentFamilyForProfile(profile)==="creature"` ;
- `gensFamilyForProfileId(profile.id)==="adventure"` ;
- `isDungeonMode()===false` pour ce profil ;
- aucun runtime Dungeon créé par cette simple sélection.

Le seed de production reste inchangé dans ce micro-lot.

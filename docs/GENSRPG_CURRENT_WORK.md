# GenSrpG — Point de reprise courant

Ce fichier est le point d'entrée prioritaire lorsqu'un fil de discussion est plein ou qu'un chantier doit être repris dans un nouveau fil.

## Chantier courant — migration combat, lot 2 : retrait Core 0.99 désactivé

- Branche : `work/gensrpg-combat-callsite-migration-2-2026-09-16`
- Checkpoint de départ : `checkpoint/gensrpg-start-combat-callsite-migration-2-2026-09-16`
- Base exacte : `2aa6ba574923229af105cbee1635eeb9efab18cb`
- Commit runtime du retrait : `c22e147b492691685cb92c009b80bd7dee00c0d7`
- Checkpoint vert précédent : `checkpoint/gensrpg-combat-callsite-migration-1-green-2026-09-16`
- Production `main` sûre : V16.78.114.11 — `e8681f9823573ced8aec59c8ddc47a72b02bc663`
- `main` n'a pas été modifié.

## Résultat du lot 2

Le lot retire uniquement le script historique désactivé :

`<script type="application/x-gensrpg-disabled" id="dungeonCore099FinalTacticalAuthority"> ... </script>`

Ce bloc n'était pas exécuté par le navigateur et n'appartenait pas à la chaîne runtime active. Il contenait encore :

- wrappers de `DungeonCore01` ;
- listener document en capture ;
- timer de réparation ;
- affectations `dc099*` historiques ;
- fallback vers `openDungeonCombatSetup()`.

La chaîne active reste :

`GensRpgTacticalCombatV2Bridge.requestCombat(...) -> V113 scope/participants -> Tactical V2`

Conformément à la charte, la couche morte a été retirée au lieu d'être modernisée ou raccordée une nouvelle fois.

## Découverte protégée par les gardes

La première tentative de retrait a été refusée avant écriture : le contrat initial supposait une seule occurrence de `openDungeonCombatSetup` dans Core 0.99.

La caractérisation exacte a montré qu'une unique ligne de fallback contient deux occurrences textuelles :

1. le test `typeof window.openDungeonCombatSetup === "function"` ;
2. l'appel `window.openDungeonCombatSetup()`.

Le garde a donc empêché une mise à jour d'inventaire incorrecte. Le contrat a été corrigé avant relance.

Autre précision : les noms globaux `dc099EngageCombat`, `dc099Paint` et `dc099SyncMainAction` sont encore repris plus tard par d'autres couches historiques. Le test du lot 2 vérifie donc la disparition des affectations propres à Core 0.99 (`engage99`, `paint99`, `syncMain99`) sans supprimer ces alias ultérieurs hors périmètre.

## Inventaire après retrait

Avant lot 2 :

- `dc200StartCombat` : 13 ;
- `openDungeonCombatSetup` : 15 ;
- `launchCombat200` : 2 ;
- `startCombat` : 6.

Après retrait Core 0.99 :

- `dc200StartCombat` : 13 — inchangé ;
- `openDungeonCombatSetup` : 13 — deux occurrences textuelles retirées ;
- `launchCombat200` : 2 — inchangé ;
- `startCombat` : 6 — inchangé.

## Hors périmètre confirmé

Le CSS historique voisin reste intact :

- `#dungeonCore099FinalTacticalCss` ;
- `#dungeonCore100UiCleanup` ;
- la référence `.dc099Reachable`.

Ils seront caractérisés séparément si le plan les traite plus tard.

Restent également hors périmètre :

- `dc030EngageCombat` et ses fallbacks actifs ;
- embuscades ;
- détection ;
- `dc200StartCombat`, `startCombat`, `launchCombat200` ;
- adaptateurs de compatibilité Bridge ;
- V112/V113 ;
- mode MJ ;
- participants / enemyIds / reasons ;
- stats, XP, récompenses, loot ;
- déplacement, navigation, fiche héros, Save & Quit ;
- cache/PWA ;
- Survival, Capture, PvP, World Builder.

## Tests du lot 2

Test dédié : `tests/gens_disabled_core099_retirement_lot2.test.cjs`.

Il vérifie :

1. disparition de `#dungeonCore099FinalTacticalAuthority` ;
2. disparition des affectations Core 0.99 `engage99`, `paint99`, `syncMain99` ;
3. maintien du CSS Core 0.99 ;
4. maintien du nettoyage UI Core 1.00 ;
5. maintien de `.dc099Reachable` pour un chantier visuel séparé ;
6. inventaire combat exact `13 / 13 / 2 / 6` ;
7. Bridge et autorité combat existante inchangés.

Le retrait exact, l'inventaire, le contrat Bridge et la caractérisation combat ont déjà passé dans le one-shot. La batterie XP/progression/récompenses est également restée verte.

Le workflow progression a ensuite été restauré à son état canonique lecture/test uniquement (`contents: read`) et le test Lot 2 a été raccordé à la sentinelle architecture permanente.

## Validation finale avant checkpoint

Il reste uniquement à confirmer sur le SHA final propre :

- architecture complète ;
- Chromium / preview ;
- Firefox ;
- comparaison exacte avec le checkpoint de départ.

Aucun nouveau lot ne doit être ouvert avant ce checkpoint vert.

## Jalon vert précédent — lot UI manuel 1

Checkpoint : `checkpoint/gensrpg-combat-callsite-migration-1-green-2026-09-16`
SHA : `2aa6ba574923229af105cbee1635eeb9efab18cb`

Deux boutons natifs ont été migrés vers `GensRpgTacticalCombatV2Bridge.requestCombat(window, options)` :

- `#dungeonCombatMenuBtn` ;
- `#dungeonCombatSheetBtn`.

Inventaire après lot 1 : `dc200StartCombat=13`, `openDungeonCombatSetup=15`, `launchCombat200=2`, `startCombat=6`.
Architecture, Chromium et Firefox verts. Aucun autre runtime gameplay modifié.

## Jalon XP + portrait

Checkpoint : `checkpoint/gensrpg-xp-portrait-cleanfix-green-2026-09-16` sur `695be0e029fb49ee70966729474b35aa0a2d9c63`.
Validation utilisateur Firefox positive le 16/09/2026.

## Règle permanente de continuité

À chaque chantier :

1. lire `docs/GENSRPG_CHARTE.md` puis ce fichier ;
2. checkpoint de départ avant le premier changement ;
3. branche créée depuis exactement ce checkpoint ;
4. caractériser/tester avant correction ;
5. checkpoint vert sur le SHA exact validé ;
6. mettre ce fichier à jour avant le chantier suivant.

# GenSrpG — Point de reprise courant

Ce fichier est le point d'entrée prioritaire lorsqu'un fil de discussion est plein ou qu'un chantier doit être repris dans un nouveau fil.

## Chantier courant — migration combat, lot 4F : embuscade Core 2.09

- Branche : `work/gensrpg-combat-callsite-migration-4f-2026-09-17`
- Base exacte / checkpoint vert lot 4E : `0315edb74a428594fa02d8d9fd74639779b8df07`
- Checkpoint vert 4E : `checkpoint/gensrpg-combat-callsite-migration-4e-green-2026-09-17`
- Checkpoint de départ 4F : `checkpoint/gensrpg-start-combat-callsite-migration-4f-2026-09-17`
- Test de caractérisation 4F : `tests/gens_core209_ambush_direct_bridge_lot4f.test.cjs`
- Production `main` sûre : V16.78.114.11 — `e8681f9823573ced8aec59c8ddc47a72b02bc663`
- `main` ne doit pas être modifié pendant la restructuration.

## Lot 4E — état figé vert

Core 2.09 détection passe directement par `GensRpgTacticalCombatV2Bridge.requestCombat()` tout en conservant son bookkeeping, ses délais et ses `enemyIds`.

Validation finale 4E sur `0315edb74a428594fa02d8d9fd74639779b8df07` : architecture + Chromium/preview verts, Firefox vert, workflow progression lecture seule et `main` intact.

Dette après 4E :

- `dc200StartCombat` : 3 ;
- `openDungeonCombatSetup` : 1 ;
- `launchCombat200` : 2 ;
- `startCombat` : 6.

Les trois références `dc200StartCombat` restantes sont séparées en deux rôles :

1. alias historique Core 2.x `window.dc200StartCombat=startCombat` — hors lot 4F ;
2. deux références dans l'embuscade Core 2.09 — seul périmètre du lot 4F.

## Caractérisation 4F avant correction

Le test `tests/gens_core209_ambush_direct_bridge_lot4f.test.cjs` a été créé avant toute modification runtime.

Il protège l'embuscade Core 2.09 :

- garde `ambushStarting`, événement `kind==="ambush"` et salle valide ;
- source exacte `living(x)` ;
- initialisation et déduplication `dc209AmbushDone` ;
- persistance avant déclenchement ;
- verrou `ambushStarting=true` ;
- délai de déclenchement 120 ms ;
- libération du verrou à 250 ms ;
- `enemyIds` issus exactement de `live.map(e=>String(e.id))` ;
- `reason:"ambush"`.

Le même test protège la détection 4E déjà migrée et exige que l'alias `window.dc200StartCombat=startCombat` reste intact pendant 4F.

## Correction autorisée pour 4F

Uniquement remplacer l'entrée finale de l'embuscade :

`dc200StartCombat(live.map(e=>String(e.id)),"ambush")`

par :

`GensRpgTacticalCombatV2Bridge.requestCombat(window,{enemyIds:live.map(e=>String(e.id)),reason:"ambush",entry:"dc209Ambush"})`

Aucune règle de participants/scope n'est recopiée dans Core 2.09 : V113 reste propriétaire via le Bridge.

Après ce changement exact, le compteur `dc200StartCombat` doit passer de 3 à 1. L'unique référence restante sera l'alias historique, à traiter séparément dans un futur lot.

## Diagnostic UI séparé — dock flottant Tactical

Observation utilisateur : les boutons flottants `Attaquer / Fin du tour / Capacité` ont disparu.

Cause maintenant identifiée sans modifier le runtime :

- le propriétaire historique du dock est V111, `assets/gensrpg/gens-rpg-tactical-runtime-fixes-1678111.js` ;
- `ensureDock()` existe toujours et crée bien les trois boutons ;
- l'ancien `MutationObserver` n'est plus installé, conformément à la charte ;
- V111 tente désormais de rafraîchir le dock via un wrapper de `GensRpgTacticalCombatV2Ui.render` ;
- mais le renderer Tactical de base appelle son `render()` lexical/interne directement depuis `open()` et ses actions ; ces rendus contournent donc le wrapper exporté V111 ;
- les vrais boutons source `data-attack` et `data-end` existent toujours dans `renderActions()`, mais `ensureDock()` n'est plus rappelé lorsque le combat s'affiche.

Ne pas réactiver de `MutationObserver`, timer global ou retry pour corriger cela. La réparation sera un lot UI séparé, avec raccord explicite appartenant au renderer Tactical et test navigateur. Ce lot UI devra produire une version test utilisateur après validation verte.

## Discipline charte 4F

- checkpoint de départ avant modification ;
- branche créée depuis exactement le checkpoint vert 4E ;
- caractérisation/test avant correction ;
- un seul groupe homogène : embuscade Core 2.09 ;
- aucun observer, timer de réparation ou wrapper global ajouté ;
- alias Core 2.x hors périmètre ;
- détection 4E hors périmètre ;
- participants et scope V113 centralisés dans le Bridge ;
- aucun changement de gameplay ;
- `main` non touché.

## Fermeture requise 4F

1. appliquer uniquement la migration d'embuscade Core 2.09 ;
2. raccorder le test 4F aux sentinelles architecture ;
3. aligner l'inventaire 3 → 1 uniquement si la source contient réellement une référence ;
4. restaurer immédiatement tout workflow temporaire utilisé pour modifier le gros `index.html` ;
5. exiger architecture + Chromium/preview + Firefox verts sur le même SHA ;
6. vérifier `main` intact ;
7. créer `checkpoint/gensrpg-combat-callsite-migration-4f-green-2026-09-17`.

## Jalons verts précédents

- Lot 4E : `checkpoint/gensrpg-combat-callsite-migration-4e-green-2026-09-17` — `0315edb74a428594fa02d8d9fd74639779b8df07`.
- Lot 4D : `checkpoint/gensrpg-combat-callsite-migration-4d-green-2026-09-17` — `e9ee86b128d8954629163ee264dc5e950421e9e9`.
- Lot 4C : `checkpoint/gensrpg-combat-callsite-migration-4c-green-2026-09-17` — `8ce140c924d259091a6c9838b82d669256a104f3`.
- Lot 4A : `checkpoint/gensrpg-combat-callsite-migration-4a-green-2026-09-17` — `498ab21e9e52746160a5a6de2cb158393a06a7d1`.
- Lot 3 : `checkpoint/gensrpg-combat-callsite-migration-3-green-2026-09-16` — `8c2c225674ed66212e1025a827e3ca078354f9e9`, validé utilisateur.
- Lot 2 : `checkpoint/gensrpg-combat-callsite-migration-2-green-2026-09-16` — `b77225582f9b854b2b0e658029ebb783fc31aab7`.
- Lot 1 : `checkpoint/gensrpg-combat-callsite-migration-1-green-2026-09-16` — `2aa6ba574923229af105cbee1635eeb9efab18cb`.
- XP + portrait : `checkpoint/gensrpg-xp-portrait-cleanfix-green-2026-09-16` — `695be0e029fb49ee70966729474b35aa0a2d9c63`, validé utilisateur Firefox.

## Règle permanente de continuité

À chaque chantier : lire la charte puis ce fichier, checkpoint avant changement, branche dédiée, caractériser avant correction, checkpoint vert sur le SHA exact validé, puis mettre ce fichier à jour avant le chantier suivant.

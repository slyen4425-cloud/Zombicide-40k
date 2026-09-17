# GenSrpG — Point de reprise courant

Ce fichier est le point d'entrée prioritaire lorsqu'un fil de discussion est plein ou qu'un chantier doit être repris dans un nouveau fil.

## Chantier courant — migration combat, lot 4G : alias historique `dc200StartCombat`

- Branche : `work/gensrpg-combat-callsite-migration-4g-2026-09-17`
- Base exacte / checkpoint vert lot 4F : `96043b4b04a069fc571aca38634df221341bb411`
- Checkpoint vert 4F : `checkpoint/gensrpg-combat-callsite-migration-4f-green-2026-09-17`
- Checkpoint de départ 4G : `checkpoint/gensrpg-start-combat-callsite-migration-4g-2026-09-17`
- Test 4G : `tests/gens_legacy_dc200_fallback_contract_lot4g.test.cjs`
- Production `main` sûre : V16.78.114.11 — `e8681f9823573ced8aec59c8ddc47a72b02bc663`
- `main` ne doit pas être modifié pendant la restructuration.

## Résultat de caractérisation 4G

Le dernier `dc200StartCombat` brut de `index.html` n'est pas un consommateur Dungeon oublié. Il s'agit de l'alias historique :

`window.dc200StartCombat = startCombat`

Le Bridge capture ce starter historique pendant `install()` avant de remplacer le global par son adaptateur final.

Le contrat observé est volontairement différent selon le contexte :

- hors Dungeon : l'adaptateur Bridge rappelle le starter historique capturé ;
- en Dungeon : le starter historique n'est pas rappelé, et l'adaptateur passe par `requestCombat`, puis le scope canonique V113 et Tactical V2.

Conséquence conforme à la charte : **aucune modification du runtime n'est faite dans le lot 4G**. Supprimer cet alias uniquement pour atteindre zéro occurrence casserait le fallback non-Dungeon sans apporter de nouvelle autorité canonique.

La sentinelle 4G verrouille le fallback avec les mêmes arguments, le même retour et la même liaison `this`, puis vérifie séparément que le chemin Dungeon n'appelle jamais ce fallback. Elle est raccordée à la sentinelle architecture existante via `gens_combat_callsite_inventory_v11411.test.cjs`.

## Inventaire après 4G

Inventaire attendu inchangé :

- `dc200StartCombat` : 1 — seed de compatibilité historique capturé par le Bridge, pas une autorité Dungeon ;
- `openDungeonCombatSetup` : 1 — définition rollback historique capturée par le Bridge ;
- `launchCombat200` : 2 ;
- `startCombat` : 6.

Ne pas diminuer artificiellement `dc200StartCombat` à 0. Le prochain lot combat doit caractériser un autre groupe homogène (`startCombat` / `launchCombat200`) sans mélanger leurs responsabilités ni casser les modes non-Dungeon.

## Diagnostic UI séparé — dock flottant Tactical

Le chantier UI du dock `Attaquer / Fin du tour / Capacité` est séparé de la migration 4G.

Un checkpoint de test distinct a été fourni sur le commit `642a0e3276f07f2d3089047d1dd5c1b72f8353b9` et validé manuellement par l'utilisateur le 2026-09-17 : « parfait ras tout fonctionne très bien ».

Cette validation ne doit pas être mélangée automatiquement au lot combat 4G. Conserver la séparation des propriétaires et intégrer ce jalon uniquement dans un chantier UI dédié conforme à la charte.

## Validation de fermeture 4G

Avant de déclarer le checkpoint vert 4G, exiger sur le même SHA final :

1. architecture complète verte, incluant V112/V113/Bridge, inventaire et contrat fallback 4G ;
2. Chromium / preview verts ;
3. Firefox vert ;
4. workflow progression toujours en lecture seule ;
5. `main` toujours sur `e8681f9823573ced8aec59c8ddc47a72b02bc663`.

Checkpoint à créer seulement après ces contrôles : `checkpoint/gensrpg-combat-callsite-migration-4g-green-2026-09-17`.

## Jalons verts précédents

- Lot 4F : `checkpoint/gensrpg-combat-callsite-migration-4f-green-2026-09-17` — `96043b4b04a069fc571aca38634df221341bb411`.
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

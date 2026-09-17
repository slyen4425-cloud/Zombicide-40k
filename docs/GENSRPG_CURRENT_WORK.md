# GenSrpG — Point de reprise courant

Ce fichier est le point d'entrée prioritaire lorsqu'un fil de discussion est plein ou qu'un chantier doit être repris dans un nouveau fil.

## Chantier courant — migration combat, lot 4H : caractérisation `launchCombat200`

- Branche : `work/gensrpg-combat-callsite-migration-4h-2026-09-17`
- Base exacte / checkpoint vert lot 4G : `f97b345419d8ce855237cf47dc4dc83f07b10978`
- Checkpoint vert 4G : `checkpoint/gensrpg-combat-callsite-migration-4g-green-2026-09-17`
- Test 4H : `tests/gens_legacy_launch200_fallback_contract_lot4h.test.cjs`
- Sentinelle d'inventaire : `tests/gens_combat_callsite_inventory_v11411.test.cjs`
- Coordination multi-fils : `docs/GENSRPG_COORDINATION.md`
- Production `main` sûre : V16.78.114.11 — `e8681f9823573ced8aec59c8ddc47a72b02bc663`
- `main` ne doit pas être modifié pendant la restructuration.

## Résultat de caractérisation 4H

Les deux occurrences brutes de `launchCombat200` dans `index.html` ne sont pas un simple appel Dungeon oublié à supprimer.

L'implémentation historique Core 2.x conserve encore plusieurs responsabilités legacy et le Bridge la traite explicitement comme compatibilité :

- `Bridge.install()` capture `rt.launchCombat200` via `rememberLegacy(...,"launch")` avant de remplacer le global ;
- hors Dungeon, l'adaptateur Bridge rappelle exactement le lanceur historique capturé avec les deux arguments, leur identité, la liaison `this` et la valeur de retour ;
- en Dungeon, le lanceur historique n'est jamais rappelé ;
- en Dungeon, l'adaptateur transforme `chosen` en `enemyIds` puis passe par `requestCombat` avec `reason:"legacy-launch"` et `entry:"launchCombat200"` ;
- participants et scope restent sous l'autorité canonique Bridge/V113/Tactical.

Conséquence conforme à la charte : **aucune modification runtime dans le lot 4H**. Supprimer les deux occurrences uniquement pour diminuer le compteur risquerait de casser le fallback hors Dungeon et mélangerait extraction du monolithe et changement de contrat.

La nouvelle sentinelle 4H verrouille le comportement hors Dungeon et Dungeon. Elle est appelée par la sentinelle d'inventaire existante, elle-même déjà raccordée à la batterie architecture : aucun workflow supplémentaire n'est nécessaire.

## Inventaire après 4H

Inventaire attendu volontairement inchangé :

- `dc200StartCombat` : 1 — seed de compatibilité historique caractérisé au lot 4G ;
- `openDungeonCombatSetup` : 1 — définition rollback historique capturée par le Bridge ;
- `launchCombat200` : 2 — implémentation historique / rappel Core 2.x caractérisés au lot 4H comme fallback non-Dungeon derrière l'adaptateur Bridge ;
- `startCombat` : 6 — prochain groupe à caractériser séparément.

Ne pas diminuer artificiellement `launchCombat200` à 0. Le prochain lot combat doit traiter `startCombat` comme un groupe distinct et commencer par cartographier ses six occurrences avant toute modification.

## Coordination multi-fils

`docs/GENSRPG_COORDINATION.md` définit désormais la règle de coordination :

- un seul fil coordinateur ;
- un agent = une branche = un périmètre ;
- aucun agent ne fusionne son travail de lui-même ;
- les agents rendent branche, SHA, diff et tests au coordinateur ;
- les propriétaires critiques ne doivent pas être travaillés en parallèle par plusieurs agents.

Agent 1 actuel : diagnostic séparé du flash/disparition Talent de la fiche héros sur `work/gensrpg-hero-sheet-talent-flash-diagnostic-2026-09-17`. Son travail ne doit pas être mélangé au lot combat 4H.

## Jalons UI séparés

Le chantier UI du dock `Attaquer / Fin du tour / Capacité` reste séparé de la migration combat.

Checkpoint : `checkpoint/gensrpg-tactical-dock-render-reconnect-green-2026-09-17` — SHA `642a0e3276f07f2d3089047d1dd5c1b72f8353b9`.

Validation manuelle utilisateur le 2026-09-17 : « parfait ras tout fonctionne très bien ».

Cette validation ne doit pas être mélangée automatiquement à 4H.

## Validation de fermeture 4H

Avant de déclarer le checkpoint vert 4H, exiger sur le même SHA final :

1. architecture complète verte, incluant V112/V113/Bridge, inventaire, contrat fallback 4G et contrat `launchCombat200` 4H ;
2. Chromium / preview verts ;
3. Firefox vert ;
4. workflow progression toujours en lecture seule ;
5. diff depuis 4G limité à documentation + tests/sentinelles du lot, sans runtime ;
6. `main` toujours sur `e8681f9823573ced8aec59c8ddc47a72b02bc663`.

Checkpoint à créer seulement après ces contrôles : `checkpoint/gensrpg-combat-callsite-migration-4h-green-2026-09-17`.

## Jalons verts précédents

- Lot 4G : `checkpoint/gensrpg-combat-callsite-migration-4g-green-2026-09-17` — `f97b345419d8ce855237cf47dc4dc83f07b10978`.
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

À chaque chantier : lire la charte puis ce fichier, partir d'un checkpoint vert exact, branche dédiée, caractériser avant correction, checkpoint vert sur le SHA exact validé, puis mettre ce fichier à jour avant le chantier suivant.

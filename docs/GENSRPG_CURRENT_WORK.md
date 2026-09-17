# GenSrpG — Point de reprise courant

Ce fichier est le point d'entrée prioritaire lorsqu'un fil de discussion est plein ou qu'un chantier doit être repris dans un nouveau fil.

## Chantier courant — fermeture combat lot 4J : scope V113 et ennemis contournés

- Branche : `work/gensrpg-combat-callsite-migration-4j-bypass-scope-clean-2026-09-17`
- Base exacte / checkpoint vert lot 4I : `b01f1c5fc2ccdbb406abb3fee4cdaab064a27687`
- Checkpoint vert 4I : `checkpoint/gensrpg-combat-callsite-migration-4i-green-2026-09-17`
- Production `main` sûre : V16.78.114.11 — `e8681f9823573ced8aec59c8ddc47a72b02bc663`
- `main` ne doit pas être modifié pendant la restructuration.

## Lot 4I fermé vert

Le lot 4I a migré uniquement l'échec de furtivité Runtime 2.00 vers l'entrée canonique du Bridge. Le checkpoint final est :

`checkpoint/gensrpg-combat-callsite-migration-4i-green-2026-09-17`

SHA exact :

`b01f1c5fc2ccdbb406abb3fee4cdaab064a27687`

Inventaire après 4I :

- `dc200StartCombat` : 1 ;
- `openDungeonCombatSetup` : 1 ;
- `launchCombat200` : 2 ;
- `startCombat` : 5 — définition + alias `dc200StartCombat` + actions de contexte `manual` / `cell` / `ambush`.

Ne pas chercher à mettre ces compteurs à zéro artificiellement.

## Lot 4J — diagnostic confirmé

La migration directe des trois actions `manual` / `cell` / `ambush` n'était pas sûre en bloc.

Le Runtime 2.00 possède une règle métier active : `liveEnemies()` exclut les ennemis :

- `dc200Bypassed` ;
- `dc200BypassedBy[heroActif]` ;
- morts, supprimés ou déjà vaincus ;
- hors salle / hors branche.

La réussite de furtivité écrit réellement `dc200BypassedBy[hero]=true`.

Le test de caractérisation 4J a reproduit un conflit de propriétaire : V113 pouvait recevoir un ennemi valide puis, pendant l'expansion spatiale du combat, réajouter un ennemi `dc200Bypassed` ou `dc200BypassedBy[heroActif]` visible dans le même scope.

Cause exacte : `GensRpgTacticalRuntimeAuthority1678113` construisait `roomEnemies` depuis `activeEnemies()`, qui ne filtrait que PV/suppression/défaite et ignorait les marqueurs de contournement Dungeon.

## Correction propriétaire 4J

Propriétaire corrigé uniquement :

`assets/gensrpg/gens-rpg-tactical-runtime-authority-1678113.js`

Commit runtime :

`01a9e84c58f85dd2aa50eea8a327025280ce8db1`

V113 possède maintenant une fonction interne unique d'éligibilité pour le héros actif :

- ennemi vivant ;
- non supprimé ;
- non vaincu ;
- non `dc200Bypassed` ;
- non `dc200BypassedBy[heroActif]`.

Cette éligibilité est utilisée par le scope V113, la détection explicite, la sélection des ennemis et le placement runtime final. Aucune règle de portée, ligne de vue, perception, participants, dégâts, stats ou mouvement n'a été modifiée.

## Sentinelle permanente 4J

Test :

`tests/gens_rpg_tactical_runtime_authority_v1678113.test.cjs`

Commit test :

`05837bce39e673334d4125b99b9171a6ebb4e867`

La sentinelle vérifie qu'un ennemi `dc200Bypassed` et un ennemi `dc200BypassedBy.h1=true` restent exclus lorsque `h1` est le héros actif, y compris pendant l'expansion du scope et la détection V113.

Le lot 4J ne modifie aucun callsite `startCombat`. L'inventaire reste donc : `startCombat = 5`.

## Validation du candidat runtime/tests 4J

SHA candidat :

`05837bce39e673334d4125b99b9171a6ebb4e867`

Validations vertes sur ce même SHA :

- `GenSrpG architecture sentinels` — success ;
- navigateur Chromium / preview inclus — success ;
- `GenSrpG Firefox wall sentinel` — success.

Le SHA final de fermeture inclura les présents documents. Il doit être revalidé avant création du checkpoint vert 4J.

Checkpoint cible :

`checkpoint/gensrpg-combat-callsite-migration-4j-green-2026-09-17`

## Périmètre strict 4J

Aucun changement dans :

- `index.html` ;
- les callsites `manual`, `cell`, `ambush` ;
- `startCombat()` / `launchCombat200()` ;
- règles de dégâts / touche / armure ;
- stats / XP / loot ;
- mouvement ;
- fiche héros ;
- dock Tactical ;
- Save & Quit ;
- Survie / Capture / PvP.

Aucun Observer, timer, retry ou wrapper de réparation n'a été ajouté par le lot 4J.

## Suite après checkpoint vert 4J

Les cinq occurrences `startCombat` restantes doivent continuer à être traitées par petits lots.

Ordre recommandé :

1. `manual` — candidat homogène le plus simple après correction du bypass ;
2. `ambush` — à caractériser séparément car V113 considère actuellement `ambush` comme une raison de détection ;
3. `cell` — lot séparé car `startCombat(...,'cell')` possède encore sa logique de renforts de proximité + popup ;
4. définition historique `startCombat` + alias `dc200StartCombat` — conserver tant que les fallbacks caractérisés en dépendent.

Une ancienne branche `work/gensrpg-combat-callsite-migration-4k-manual-entry-2026-09-17` existe mais pointe sur l'ancien essai 4J divergent (`64f104e3...`). Elle ne doit pas être utilisée comme base. Le prochain lot 4K devra partir du checkpoint vert 4J final exact, sur une branche propre.

## Coordination multi-fils

Le présent fil reste le **COORDINATEUR / FIL DIRECTEUR**.

### Agent 1 — travail Talent terminé, non intégré

- Branche : `work/gensrpg-hero-sheet-talent-flash-diagnostic-2026-09-17`
- Statut : annoncé terminé ; résultat à contrôler par le coordinateur avant toute intégration.

### Agent 1 — diagnostic Chrome séparé

- Branche : `work/gensrpg-chrome-white-screen-diagnostic-2026-09-17`
- Base : `642a0e3276f07f2d3089047d1dd5c1b72f8353b9`
- Mission : diagnostiquer l'écran blanc/figé sous Chrome Android alors que Firefox fonctionne.
- Interdictions : aucun gameplay, aucun observer/timer/retry global, aucune collision avec le propriétaire combat, aucun `main`.

## Jalon UI séparé validé utilisateur

Dock Tactical `Attaquer / Fin du tour / Capacité` :

- checkpoint : `checkpoint/gensrpg-tactical-dock-render-reconnect-green-2026-09-17` ;
- SHA : `642a0e3276f07f2d3089047d1dd5c1b72f8353b9` ;
- validation utilisateur : « parfait ras tout fonctionne très bien ».

Ce jalon reste séparé des lots combat tant qu'une intégration explicite n'est pas décidée.

## Jalons verts précédents

- Lot 4I : `checkpoint/gensrpg-combat-callsite-migration-4i-green-2026-09-17` — `b01f1c5fc2ccdbb406abb3fee4cdaab064a27687`.
- Lot 4H : `checkpoint/gensrpg-combat-callsite-migration-4h-green-2026-09-17` — `2e51e7063b0fca2610b8fd9c1078008cd32a9a34`.
- Lot 4G : `checkpoint/gensrpg-combat-callsite-migration-4g-green-2026-09-17` — `f97b345419d8ce855237cf47dc4dc83f07b10978`.
- Lot 4F : `checkpoint/gensrpg-combat-callsite-migration-4f-green-2026-09-17` — `96043b4b04a069fc571aca38634df221341bb411`.
- Lot 4E : `checkpoint/gensrpg-combat-callsite-migration-4e-green-2026-09-17` — `0315edb74a428594fa02d8d9fd74639779b8df07`.
- Lot 4D : `checkpoint/gensrpg-combat-callsite-migration-4d-green-2026-09-17` — `e9ee86b128d8954629163ee264dc5e950421e9e9`.
- Lot 4C : `checkpoint/gensrpg-combat-callsite-migration-4c-green-2026-09-17` — `8ce140c924d259091a6c9838b82d669256a104f3`.

## Règle permanente de continuité

À chaque chantier : lire la charte puis ce fichier, partir d'un checkpoint vert exact, branche dédiée, caractériser avant correction, checkpoint vert sur le SHA exact validé, puis mettre ce fichier à jour avant le chantier suivant.

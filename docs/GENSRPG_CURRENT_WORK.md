# GenSrpG — Point de reprise courant

Ce fichier est le point d'entrée prioritaire lorsqu'un fil de discussion est plein ou qu'un chantier doit être repris dans un nouveau fil.

## Chantier courant — fermeture combat lot 4K : action manuelle Runtime 2.00

- Branche : `work/gensrpg-combat-callsite-migration-4k-manual-entry-clean-2026-09-17`
- Base exacte / checkpoint vert lot 4J : `b8f5b14f0651479165d35545f3a22db6df8d391f`
- Checkpoint vert 4J : `checkpoint/gensrpg-combat-callsite-migration-4j-green-2026-09-17`
- Production `main` sûre : V16.78.114.11 — `e8681f9823573ced8aec59c8ddc47a72b02bc663`
- `main` reste gelé pendant la restructuration.

## Lot 4J fermé vert

Le lot 4J a corrigé uniquement la cohérence des ennemis contournés entre Runtime 2.00 et le scope V113.

Checkpoint :

`checkpoint/gensrpg-combat-callsite-migration-4j-green-2026-09-17`

SHA exact :

`b8f5b14f0651479165d35545f3a22db6df8d391f`

Le filtre V113 respecte désormais `dc200Bypassed` et `dc200BypassedBy[heroActif]`. Architecture, Chromium/preview et Firefox sont verts sur ce SHA.

## Lot 4K — caractérisation avant modification

Le lot 4K ne traite qu'un seul callsite lexical Runtime 2.00 : le bouton non positionnel `⚔️ ENGAGER LE COMBAT` avec `reason:'manual'`.

La caractérisation permanente a prouvé que :

- le bouton n'existe que si le mode est non positionnel et qu'il reste des ennemis vivants ;
- `combatEnabled200()` reste la garde d'activation ;
- la source des ennemis est `liveEnemies()` ;
- `startCombat()` n'a aucune branche métier spécifique à `reason:'manual'` ;
- l'ancien chemin re-filtrait seulement les mêmes ids puis déléguait à `launchCombat200` ;
- `manual` n'est pas une raison de détection V113 ;
- `ambush` est au contraire une raison de détection V113 et reste donc hors du lot ;
- `cell` possède encore une logique spécifique de renforts/popup et reste hors du lot.

Test permanent :

`tests/gens_core200_manual_entry_characterization_lot4k.test.cjs`

La phase de caractérisation, raccordée à `tests/gens_combat_callsite_inventory_v11411.test.cjs`, a été verte avant modification runtime.

## Migration runtime 4K

Une seule ligne runtime de `index.html` a été remplacée.

Ancien chemin :

`startCombat(live.map(e=>String(e.id)),'manual')`

Nouveau chemin :

`GensRpgTacticalCombatV2Bridge.requestCombat(window,{enemyIds:live.map(e=>String(e.id)),reason:'manual',entry:'dc200ManualAction'})`

Commit runtime :

`989f6f197c7e56dd62393bec8849cf5770d3d63b`

La modification conserve exactement :

- le mode non positionnel ;
- la garde `live.length` ;
- `combatEnabled200()` ;
- le même bouton et son comportement ;
- la source `liveEnemies()` ;
- les exclusions `dc200Bypassed` / `dc200BypassedBy[heroActif]` ;
- les mêmes `enemyIds` convertis en chaînes ;
- `reason:'manual'`.

Le scope et les participants restent sous l'autorité canonique V113 via le Bridge. Aucun calcul de combat, mouvement, stats, XP, loot, fiche héros, Save & Quit, Survie, Capture ou PvP n'a été modifié.

Le workflow temporaire utilisé uniquement pour écrire chirurgicalement dans le gros `index.html` a été retiré avant la fermeture du lot. Il ne fait pas partie du diff net.

## Inventaire après 4K

- `dc200StartCombat` : 1 — seed de compatibilité historique caractérisé au lot 4G ;
- `openDungeonCombatSetup` : 1 — rollback historique capturé par le Bridge ;
- `launchCombat200` : 2 — fallback historique caractérisé au lot 4H ;
- `startCombat` : 4 — définition historique, alias `dc200StartCombat`, action `cell`, action `ambush`.

Ne pas chercher à réduire ces compteurs artificiellement.

Les dettes lexicales Runtime 2.00 encore actives sont uniquement :

1. `ambush` ;
2. `cell`.

La définition historique et l'alias restent protégés tant que les fallbacks de compatibilité caractérisés en dépendent.

## Validation technique 4K

Candidat runtime/tests/document d'inventaire :

`c6a9e5ac740b7aa1d18b298d4ec10441df4f1be3`

Validations vertes sur ce même SHA :

- `GenSrpG architecture sentinels` — success ;
- Chromium / preview — success ;
- `GenSrpG Firefox wall sentinel` — success.

Les présents documents de reprise créent le SHA final de fermeture. Ce SHA final doit être revalidé intégralement avant création du checkpoint vert.

Checkpoint cible :

`checkpoint/gensrpg-combat-callsite-migration-4k-green-2026-09-17`

## Suite recommandée après checkpoint vert 4K

Prochain lot directeur : **4L — `ambush` uniquement**.

Règles du lot 4L :

- partir du checkpoint vert 4K final exact sur une branche propre ;
- caractériser l'appel Runtime 2.00 `startCombat(...,'ambush')` avant toute modification ;
- vérifier spécialement la sémantique V113, car `ambush` est classé comme raison de détection ;
- préserver source d'ennemis, héros source, scope, guards et comportement du bouton/contexte ;
- ne pas toucher à `cell` dans le même lot ;
- ne modifier le runtime que si l'équivalence avec le Bridge est prouvée.

Le lot `cell` restera séparé ensuite, car l'ancien `startCombat(...,'cell')` possède une logique spécifique de renforts de proximité et de popup.

## Coordination multi-fils

Le présent fil reste le **COORDINATEUR / FIL DIRECTEUR**.

### Agent 1 — travail Talent terminé, non intégré

- Branche : `work/gensrpg-hero-sheet-talent-flash-diagnostic-2026-09-17`
- Statut : annoncé terminé ; résultat encore à contrôler par le coordinateur avant toute intégration.

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

- Lot 4J : `checkpoint/gensrpg-combat-callsite-migration-4j-green-2026-09-17` — `b8f5b14f0651479165d35545f3a22db6df8d391f`.
- Lot 4I : `checkpoint/gensrpg-combat-callsite-migration-4i-green-2026-09-17` — `b01f1c5fc2ccdbb406abb3fee4cdaab064a27687`.
- Lot 4H : `checkpoint/gensrpg-combat-callsite-migration-4h-green-2026-09-17` — `2e51e7063b0fca2610b8fd9c1078008cd32a9a34`.
- Lot 4G : `checkpoint/gensrpg-combat-callsite-migration-4g-green-2026-09-17` — `f97b345419d8ce855237cf47dc4dc83f07b10978`.
- Lot 4F : `checkpoint/gensrpg-combat-callsite-migration-4f-green-2026-09-17` — `96043b4b04a069fc571aca38634df221341bb411`.

## Règle permanente de continuité

À chaque chantier : lire la charte puis ce fichier, partir d'un checkpoint vert exact, branche dédiée, caractériser avant correction, checkpoint vert sur le SHA exact validé, puis mettre ce fichier à jour avant le chantier suivant.

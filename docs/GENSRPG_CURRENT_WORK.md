# GenSrpG — Point de reprise courant

Ce fichier est le point d'entrée prioritaire lorsqu'un fil de discussion est plein ou qu'un chantier doit être repris dans un nouveau fil.

## Chantier courant — combat lot 4J : scope V113 et ennemis contournés

- Branche : `work/gensrpg-combat-callsite-migration-4j-bypass-scope-2026-09-17`
- Base exacte / checkpoint vert lot 4I : `6aa1a682220f0439d0f6b9679a3f6dd5d9182eff`
- Checkpoint vert 4I : `checkpoint/gensrpg-combat-callsite-migration-4i-green-2026-09-17`
- Checkpoint de départ 4J : `checkpoint/gensrpg-start-combat-callsite-4j-bypass-scope-2026-09-17`
- Production `main` sûre : V16.78.114.11 — `e8681f9823573ced8aec59c8ddc47a72b02bc663`
- `main` ne doit pas être modifié pendant la restructuration.

## Lot 4I fermé vert

Le lot 4I a migré uniquement l'échec de furtivité Runtime 2.00 vers l'entrée canonique :

`GensRpgTacticalCombatV2Bridge.requestCombat(window,{enemyIds:ids,reason:'stealth_fail',entry:'dc200StealthFailure'})`

Comportement conservé :

- même source `liveEnemies()` ;
- même popup `🥷 REPÉRAGE ÉCHOUÉ` ;
- combat seulement après validation ;
- aucun combat si aucun ennemi vivant ;
- scope et participants restent propriétaires V113 via le Bridge.

Inventaire après 4I :

- `dc200StartCombat` : 1 — seed de compatibilité historique caractérisé au lot 4G ;
- `openDungeonCombatSetup` : 1 — rollback historique capturé par le Bridge ;
- `launchCombat200` : 2 — fallback non-Dungeon caractérisé au lot 4H ;
- `startCombat` : 5 — définition + alias `dc200StartCombat` + actions de contexte `manual` / `cell` / `ambush`.

Validation exacte du SHA `6aa1a682220f0439d0f6b9679a3f6dd5d9182eff` :

- Architecture : run `35242206835` — success ;
- Firefox : run `35242206872` — success ;
- workflow architecture revenu à `permissions: contents: read` ;
- `main` toujours sur `e8681f9823573ced8aec59c8ddc47a72b02bc663`.

## Lot 4J — diagnostic confirmé et correction propriétaire

La migration directe des trois actions `manual` / `cell` / `ambush` n'était pas sûre en bloc.

`startCombat(ids,reason)` possède encore une règle propre pour `cell` : renforts de proximité aléatoires + popup avant le lancement. Cette action reste hors périmètre 4J.

Les actions `manual` et `ambush` transmettent les ennemis retournés par `liveEnemies()`. Cette fonction exclut explicitement :

- `dc200Bypassed` ;
- `dc200BypassedBy[hero]` ;
- les ennemis hors salle / hors branche ;
- les ennemis morts, supprimés ou déjà vaincus.

La réussite de furtivité écrit réellement `dc200BypassedBy[hero]=true`. Il s'agit donc d'une règle métier active et individuelle par héros.

La caractérisation ajoutée dans `tests/gens_rpg_tactical_runtime_authority_v1678113.test.cjs` a reproduit le défaut : avant correction, `GensRpgTacticalRuntimeAuthority1678113.selectCombatants()` pouvait partir d'un ennemi valide puis réajouter au même combat un ennemi `dc200Bypassed` ou `dc200BypassedBy[heroActif]` visible dans le même scope.

Cause exacte : V113 construisait `roomEnemies` à partir de `activeEnemies()`, qui ne filtrait que PV/suppression/défaite et ignorait les marqueurs de contournement Dungeon.

### Correction 4J

Propriétaire corrigé uniquement :

`assets/gensrpg/gens-rpg-tactical-runtime-authority-1678113.js`

Commit runtime : `43dbac3a4084f8f677c8ad14bfc1cdf3c96d8222`.

V113 possède maintenant une seule fonction interne d'éligibilité pour le héros actif :

- ennemi vivant ;
- non supprimé ;
- non vaincu ;
- non `dc200Bypassed` ;
- non `dc200BypassedBy[heroActif]`.

Cette même éligibilité est utilisée par :

- `activeEnemies()` ;
- `enemiesInScope()` ;
- la branche avec liste explicite de `detectionPairs()` ;
- `targetScopeForOptions()` ;
- le placement runtime final via `applyRuntimePositions()`.

Aucune règle de portée, ligne de vue, perception, participants, dégâts, stats ou mouvement n'a été modifiée.

### Sentinelle permanente 4J

Le test V113 vérifie désormais simultanément que :

- un ennemi `dc200Bypassed` est exclu ;
- un ennemi `dc200BypassedBy.h1=true` est exclu quand h1 est actif ;
- un ennemi `dc200BypassedBy.h2=true` reste éligible quand h1 est actif ;
- la détection V113 applique la même sémantique que l'expansion du scope combat.

Commit test : `bc3e56a329b2ca2935ac43799eec3f7878daa609`.

Le lot 4J ne modifie aucun callsite `startCombat` et l'inventaire reste donc inchangé : `startCombat = 5`.

## Périmètre strict 4J respecté

Aucun changement dans :

- les callsites `manual`, `cell`, `ambush` ;
- `startCombat()` / `launchCombat200()` ;
- `index.html` ;
- calcul des participants hors filtrage de contournement ;
- mouvement ;
- stats ;
- dégâts / touche / armure ;
- XP / loot ;
- fiche héros ;
- dock Tactical ;
- Save & Quit ;
- Survie / Capture / PvP.

Diff attendu depuis 4I : trois fichiers seulement — V113, son test permanent et ce document.

## Suite après checkpoint vert 4J

Ne pas migrer `cell` avec `manual` : `cell` possède encore sa logique propre de renforts de proximité et doit être caractérisé séparément.

Pour le prochain lot, reprendre les 5 occurrences `startCombat` restantes depuis le checkpoint vert 4J et caractériser séparément :

1. `manual` — candidat le plus simple après la correction bypass ;
2. `ambush` — attention : le Bridge/V113 considère actuellement `ambush` comme une raison de détection, donc sa sémantique doit être vérifiée avant migration ;
3. `cell` — renforts aléatoires + popup, lot séparé ;
4. définition historique `startCombat` + alias `dc200StartCombat` — ne pas retirer tant que les consommateurs et fallbacks caractérisés en dépendent.

## Coordination multi-fils

`docs/GENSRPG_COORDINATION.md` reste la règle : un fil coordinateur, un agent = une branche = un périmètre, aucun agent ne fusionne seul son travail.

Agent séparé actuel : diagnostic du flash/disparition Talent de la fiche héros sur `work/gensrpg-hero-sheet-talent-flash-diagnostic-2026-09-17`. Ne pas mélanger son travail au lot combat.

## Jalons verts utiles

- Lot 4I : `checkpoint/gensrpg-combat-callsite-migration-4i-green-2026-09-17` — `6aa1a682220f0439d0f6b9679a3f6dd5d9182eff`.
- Lot 4H : `checkpoint/gensrpg-combat-callsite-migration-4h-green-2026-09-17` — `2e51e7063b0fca2610b8fd9c1078008cd32a9a34`.
- Lot 4G : `checkpoint/gensrpg-combat-callsite-migration-4g-green-2026-09-17` — `f97b345419d8ce855237cf47dc4dc83f07b10978`.
- Lot 4F : `checkpoint/gensrpg-combat-callsite-migration-4f-green-2026-09-17` — `96043b4b04a069fc571aca38634df221341bb411`.
- Dock Tactical : `checkpoint/gensrpg-tactical-dock-render-reconnect-green-2026-09-17` — `642a0e3276f07f2d3089047d1dd5c1b72f8353b9`, validé manuellement utilisateur.
- XP + portrait : `checkpoint/gensrpg-xp-portrait-cleanfix-green-2026-09-16` — `695be0e029fb49ee70966729474b35aa0a2d9c63`, validé utilisateur Firefox.

## Règle permanente de continuité

À chaque chantier : lire la charte puis ce fichier, partir d'un checkpoint vert exact, branche dédiée, caractériser avant correction, checkpoint vert sur le SHA exact validé, puis mettre ce fichier à jour avant le chantier suivant.

# GenSrpG — Point de reprise courant

Ce fichier est le point d'entrée prioritaire lorsqu'un fil de discussion est plein ou qu'un chantier doit être repris dans un nouveau fil.

## Chantier courant — migration combat, lot 4I : échec de furtivité Runtime 2.00

- Branche : `work/gensrpg-combat-callsite-migration-4i-2026-09-17`
- Base exacte / checkpoint vert lot 4H : `2e51e7063b0fca2610b8fd9c1078008cd32a9a34`
- Checkpoint vert 4H : `checkpoint/gensrpg-combat-callsite-migration-4h-green-2026-09-17`
- Test 4I : `tests/gens_core200_startcombat_characterization_lot4i.test.cjs`
- Sentinelle d'inventaire : `tests/gens_combat_callsite_inventory_v11411.test.cjs`
- Production `main` sûre : V16.78.114.11 — `e8681f9823573ced8aec59c8ddc47a72b02bc663`
- `main` ne doit pas être modifié pendant la restructuration.

## Résultat 4I

Le lot 4I traite un seul callsite lexical du propriétaire historique `dungeonCore200Rebuild` : l'échec du test de furtivité.

Avant 4I, `window.dc047ResolveStealth` finissait par appeler :

`startCombat(foes.map(e=>String(e.id)), "échec furtivité")`

Le comportement existant de `startCombat()` pour ce cas comprenait déjà la popup `🥷 REPÉRAGE ÉCHOUÉ` avant le lancement du combat. Le lot ne crée donc pas un nouveau comportement UI : il conserve ce passage dans le propriétaire Runtime 2.00 et remplace seulement l'entrée finale du combat par le contrat canonique du Bridge.

Le chemin 4I conserve :

- la source des ennemis vivants ;
- les mêmes `enemyIds` convertis en chaînes ;
- la fermeture de la modale de furtivité ;
- la popup `🥷 REPÉRAGE ÉCHOUÉ` et son contenu ;
- l'absence de combat si aucun ennemi vivant n'est présent ;
- le lancement seulement après validation de la popup.

L'entrée finale passe par `GensRpgTacticalCombatV2Bridge.requestCombat(...)` avec `reason:'stealth_fail'` et l'entrée diagnostique propre au lot. Le scope et les participants restent sous l'autorité V113 via le Bridge ; aucune règle de participants n'est recopiée dans Runtime 2.00.

Le diff net depuis 4H reste volontairement petit : une seule ligne runtime remplacée dans `index.html`, un test 4I, l'inventaire permanent et sa documentation. Le workflow temporaire utilisé pour écrire dans le gros `index.html` a été retiré avant la fermeture du lot.

## Inventaire après 4I

- `dc200StartCombat` : 1 — seed de compatibilité historique caractérisé au lot 4G ;
- `openDungeonCombatSetup` : 1 — définition rollback historique capturée par le Bridge ;
- `launchCombat200` : 2 — fallback historique caractérisé au lot 4H ;
- `startCombat` : 5 — définition historique, alias `dc200StartCombat` et trois actions de contexte `manual` / `cell` / `ambush`.

Ne pas supprimer ces cinq occurrences en masse. Le prochain lot doit caractériser un seul sous-groupe restant et préserver les modes non-Dungeon ainsi que le scope V113.

## Validation 4I

Le premier candidat `83a698e9b5f1bdf89241c56d1f35bc5a27bb1cbb` a été refusé par la sentinelle d'inventaire uniquement parce que la documentation affichait encore `startCombat = 6`.

Après correction documentaire, le candidat runtime/tests `6aa1a682220f0439d0f6b9679a3f6dd5d9182eff` est vert sur :

- `GenSrpG architecture sentinels` ;
- Chromium / preview inclus dans cette batterie ;
- `GenSrpG Firefox wall sentinel`.

Les documents de reprise sont ensuite mis à jour avant le SHA final de fermeture. Le checkpoint vert 4I ne doit être créé qu'après revalidation de ce SHA final exact, contrôle du workflow progression et vérification que `main` est inchangé.

Checkpoint cible : `checkpoint/gensrpg-combat-callsite-migration-4i-green-2026-09-17`.

## Coordination multi-fils

Le présent fil reste le **COORDINATEUR / FIL DIRECTEUR**.

### Agent 1 — travail Talent terminé, non intégré

- Branche : `work/gensrpg-hero-sheet-talent-flash-diagnostic-2026-09-17`
- Statut : agent annoncé terminé par l'utilisateur ; résultat encore à contrôler par le coordinateur avant toute intégration.

### Agent 1 — nouveau diagnostic Chrome

- Branche : `work/gensrpg-chrome-white-screen-diagnostic-2026-09-17`
- Base : `642a0e3276f07f2d3089047d1dd5c1b72f8353b9`
- Mission : diagnostiquer l'écran blanc/figé observé sous Chrome Android alors que le même jalon fonctionne sous Firefox.
- Interdictions : aucun changement gameplay, aucun correctif global par observer/timer/retry, aucune collision avec le chantier combat du coordinateur, aucun `main`.

## Jalon UI séparé validé utilisateur

Dock Tactical `Attaquer / Fin du tour / Capacité` :

- checkpoint : `checkpoint/gensrpg-tactical-dock-render-reconnect-green-2026-09-17` ;
- SHA : `642a0e3276f07f2d3089047d1dd5c1b72f8353b9` ;
- validation utilisateur : « parfait ras tout fonctionne très bien ».

Ce jalon reste séparé des lots combat tant qu'une intégration explicite n'est pas décidée.

## Jalons verts précédents

- Lot 4H : `checkpoint/gensrpg-combat-callsite-migration-4h-green-2026-09-17` — `2e51e7063b0fca2610b8fd9c1078008cd32a9a34`.
- Lot 4G : `checkpoint/gensrpg-combat-callsite-migration-4g-green-2026-09-17` — `f97b345419d8ce855237cf47dc4dc83f07b10978`.
- Lot 4F : `checkpoint/gensrpg-combat-callsite-migration-4f-green-2026-09-17` — `96043b4b04a069fc571aca38634df221341bb411`.
- Lot 4E : `checkpoint/gensrpg-combat-callsite-migration-4e-green-2026-09-17` — `0315edb74a428594fa02d8d9fd74639779b8df07`.
- Lot 4D : `checkpoint/gensrpg-combat-callsite-migration-4d-green-2026-09-17` — `e9ee86b128d8954629163ee264dc5e950421e9e9`.
- Lot 4C : `checkpoint/gensrpg-combat-callsite-migration-4c-green-2026-09-17` — `8ce140c924d259091a6c9838b82d669256a104f3`.
- Lot 4A : `checkpoint/gensrpg-combat-callsite-migration-4a-green-2026-09-17` — `498ab21e9e52746160a5a6de2cb158393a06a7d1`.
- Lot 3 : `checkpoint/gensrpg-combat-callsite-migration-3-green-2026-09-16` — `8c2c225674ed66212e1025a827e3ca078354f9e9`, validé utilisateur.
- Lot 2 : `checkpoint/gensrpg-combat-callsite-migration-2-green-2026-09-16` — `b77225582f9b854b2b0e658029ebb783fc31aab7`.
- Lot 1 : `checkpoint/gensrpg-combat-callsite-migration-1-green-2026-09-16` — `2aa6ba574923229af105cbee1635eeb9efab18cb`.

## Règle permanente de continuité

À chaque chantier : lire la charte puis ce fichier, partir d'un checkpoint vert exact, branche dédiée, caractériser avant correction, checkpoint vert sur le SHA exact validé, puis mettre ce fichier à jour avant le chantier suivant.
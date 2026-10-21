# GenSrpG — Phase 12 / Dungeon : restauration scènes, coffres et pièges — RED, sans publication

**21 octobre 2026.** Chantier bloqué volontairement en attente d'un contrat prouvé de cycle de vie coffre et de synchronisation des marqueurs après reprise. **Ne pas fusionner ni qualifier GREEN** la branche de diagnostic ci-dessous.

## Reprise et périmètre

- Dernier GREEN imperturbable : `checkpoint/gensrpg-phase12-dungeon-room2-entry-green-2026-10-21`, SHA **`ca77d8e5651892b39c37f1c035823014e8cdf7e0`**, [CI 39564370399](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/39564370399), Chromium/Firefox et régressions PASS. Valide la **première entrée en salle 2**, pas sa seconde reprise exacte.
- §25 START de ce nouveau lot créé AVANT code : `checkpoint/gensrpg-start-phase12-dungeon-scene-restore-2026-10-21`, au SHA `ca77d8e5651892b39c37f1c035823014e8cdf7e0` ; branche `work/gensrpg-phase12-dungeon-scene-restore-2026-10-21`.
- §26 : `index.html` (1 729 855 octets ; blob `9f35eb833a6ede4b91399854f19bb9bef59f45ab`) **inchangé**. [Source vérifiée](https://github.com/slyen4425-cloud/Zombicide-40k/blob/ca77d8e5651892b39c37f1c035823014e8cdf7e0/index.html).
- Propriétaires : Core200 pour présentation/synchronisation des coffres dans la map et sauvegardes Dungeon ; couche des événements Dungeon pour insertion de scènes et cases trap ; Tactical/Stats/D100/IA et modes Survie/Capture/PvP protégés.
- `main` toujours gelée sur `e8681f9823573ced8aec59c8ddc47a72b02bc663`, aucune fusion ni publication, laboratoires intouchés.

## Défaillance de sauvegarde/reprise démontrée avant toute modification

- [CI RED 39565210342](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/39565210342), avec runtime GREEN **non modifié** : après victoire réelle, REPRENDRE, passage à salle 2, fermeture des dialogues, puis nouveau reload/reprise, Firefox conserve salle, héros, XP, blessures et ennemis mais modifie certains marqueurs de la carte (apparition de `trap`, `chest`) et crée deux objets scène de coffre. Chromium peut être stable ; comportement intermittent selon génération/événement.
- Les notes et tests du lot précédent sont dans `docs/GENSRPG_PHASE12_DUNGEON_ROOM2_ENTRY_AND_RESUME_DIAG_2026-10-21.md` sur l'ancienne branche diagnostic (non GREEN).

## Hypothèse Core200 testée sur cette branche (NON VALIDÉE)

- Dans `assets/gensrpg/dungeon/core200-rebuild-v1.js`, `syncChestAuthority208` appelle `addDungeonSceneElement` pour les cases de coffre dépourvues d'objet, mais réenregistre ensuite `saveDungeonSceneElements(all)`, où `all` a été lu **avant** l'ajout. Cet écrasement d'un état plus récent est un défaut crédible d'ordre de sauvegarde.
- Une correction **bornée à ce propriétaire** conserve l'objet `created` dans `all` avant le `saveDungeonSceneElements(all)` final. La sentinelle `tests/gensrpg_phase12_dungeon_scene_owner_guard.test.cjs` vérifie que c'est le **seul** changement de production. Aucun système secondaire n'est ajouté.
- [CI expérimentale **39566146209**](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/39566146209) : **régressions historiques et garde de diff SUCCESS**, mais parcours navigateur **FAILURE**. Chromium reprend la salle 1, y retrouve un coffre de map, clique **FOUILLER LE COFFRE** → modal **Ouvrir le coffre** → bouton natif **CONTINUER** ; le coffre existe toujours ensuite, sans modale **Coffre fouillé**, et le bouton d'action redemande de fouiller. Huit répétitions du clic ouvrent/ferment la même modale, jamais le passage à la salle 2. Pas de `pageerror` permettant d'attribuer la faute à une exception de callback. Le test strict n'a donc pas atteint la vérification de seconde reprise dans cette variante.
- **NE PAS qualifier ce patch de correctif** : rendre persistante la scène a mis en évidence un second maillon de cycle de vie (`modal('Ouvrir', onDone)` → `closeModal` → `consumeChest` → `removeDungeonSceneElement` → carte/sauvegarde) encore non établi. Les marqueurs `trap` de Firefox restent à diagnostiquer séparément. Il est interdit de forcer le passage en appelant directement `explore`, d'effacer le coffre dans le test, ou de modifier l'IA/des jets.

## Prochain diagnostic imposé

1. Repartir du **GREEN `ca77d8e5651892b39c37f1c035823014e8cdf7e0`**, pas du HEAD expérimental. Préserver le checkpoint §25 existant de ce lot et le red en preuve ; pour un nouveau lot, créer son propre START.
2. Vérifier dans le propriétaire Dungeon : autorité d'ouverture/fermeture des modales, présence d'un double handler, moment de mutation `modalDone200`, contrat exact de `removeDungeonSceneElement`, ordre `render` et `syncChestAuthority208`. Tracer ces étapes par la vraie UI, sans simuler le résultat.
3. Puis vérifier séparément les producteurs d'éléments d'événement (`trap`, `chest`) et leur réhydratation dans `roomStates`. Test auto : coffre natif ouvrable une fois, reçu/retrait une seule fois, map/scene figées après deux reprises, puis vraie entrée en salle 2.
4. Passer R10–R15, architecture, modes et vrai Chromium/Firefox sur SHA exact. Aucun checkpoint GREEN du lot scene restore tant que le parcours échoue.

## Critère de vérité

Le seul jalon GREEN atteint durant cette continuation est **l'entrée en salle 2** sur l'ancien SHA `ca77d8e...`. La restauration fine des scènes **n'est pas validée**. Aucun rendu manuel mobile/PWA, ni défaite, ni loot positif certifiés.

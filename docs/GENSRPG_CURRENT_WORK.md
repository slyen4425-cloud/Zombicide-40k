# GenSrpG — Point de reprise courant

Ce fichier est le point d'entrée prioritaire lorsqu'un fil de discussion est plein ou qu'un chantier doit être repris dans un nouveau fil.

## Chantier courant — fermeture Combat 4M `cell` Runtime 2.00

- Fil directeur : **COORDINATEUR actif**.
- Branche : `work/gensrpg-combat-callsite-migration-4m-cell-2026-09-17`.
- Base exacte : checkpoint Combat 4L vert `45bbca1c1f146732f4ae366c2ab74b9ec9263b2b`.
- Checkpoint de base : `checkpoint/gensrpg-combat-callsite-migration-4l-green-2026-09-17`.
- Production sûre `main` : V16.78.114.11 — `e8681f9823573ced8aec59c8ddc47a72b02bc663`.
- `main` reste gelé pendant la restructuration.
- Périmètre 4M : **`cell` uniquement**.

## Chaîne directrice verte avant 4M

- Combat 4K : `checkpoint/gensrpg-combat-callsite-migration-4k-green-2026-09-17` — `c672726b69aa5895d252e2f31084c20740bcc699`.
- Talent post-4K : `checkpoint/gensrpg-talent-integration-post-4k-green-2026-09-17` — `c52fd9abf8f19c345d1cd7088e86ae3179b42401`.
- Preview/PWA post-Talent : `checkpoint/gensrpg-preview-pwa-post-talent-green-2026-09-17` — `4c1c1e60b4e06a82986babc435ac07d48dff4833`.
- Dock Tactical post-PWA : `checkpoint/gensrpg-tactical-dock-post-pwa-green-2026-09-17` — `1cff0ec5628f79f8cc1bb556fd6bd2f14b691d72`.
- Combat 4L `ambush` : `checkpoint/gensrpg-combat-callsite-migration-4l-green-2026-09-17` — `45bbca1c1f146732f4ae366c2ab74b9ec9263b2b`.

Le jalon Dock reste protégé : l'UI Tactical canonique expose `onAfterRender()` et V111 s'y abonne sans wrapper `render()`, sans `MutationObserver` global et sans retry de réparation.

## Combat 4M — caractérisation avant correction

L'ancien callsite Runtime 2.00 était :

`startCombat([String(target.id)],'cell')`

La caractérisation a établi que le propriétaire Dungeon devait conserver avant l'entrée Tactical :

- la cible exacte sur la case ;
- le filtrage par `liveEnemies()` ;
- les renforts calculés par `nearbyInterveners()` ;
- les probabilités réellement présentes dans ce chemin : **65 % à distance Manhattan 1, 30 % à distance 2, 0 % au-delà** ;
- la déduplication cible/renforts ;
- la popup `⚔️ RENFORTS ENNEMIS` lorsqu'au moins un renfort rejoint le combat ;
- l'ensemble final d'`enemyIds` transmis au combat.

Important : contrairement à une ancienne hypothèse documentaire, ce chemin Runtime 2.00 ne possède pas de `reinforcementRange` configurable. Le lot 4M fige le comportement réel et n'invente aucun réglage.

Test permanent : `tests/gens_core200_cell_entry_characterization_lot4m.test.cjs`.

Run de caractérisation dédié : `35260234398` — **success**.

## Combat 4M — risque identifié et contrat cible

`reason:'cell'` n'est pas une raison de détection V113. Cependant `V113.selectCombatants()` peut retourner d'autres ennemis visibles du scope que ceux déjà sélectionnés par Dungeon.

Une migration mécanique du callsite aurait donc pu élargir le combat à un ennemi que le tirage Dungeon n'avait pas retenu comme renfort.

Le contrat retenu sépare les propriétaires :

- **Dungeon** reste propriétaire de la cible, du tirage des renforts et de la popup ;
- **V113/Tactical** reste propriétaire du scope et des héros participants ;
- le Bridge peut uniquement **réduire** la sélection ennemie de V113 aux `enemyIds` explicitement préparés par Dungeon lorsque `limitEnemyIdsToRequest:true` est demandé.

Le test cible a été posé rouge avant correction : run `35260392523`.

Test permanent : `tests/gens_core200_cell_bridge_contract_lot4m.test.cjs`.

## Combat 4M — correction appliquée

Runtime 2.00 délègue désormais le bouton `cell` à un helper local `startCellCombat(target,x)` qui conserve la préparation Dungeon, puis appelle :

`GensRpgTacticalCombatV2Bridge.requestCombat(window,{enemyIds:chosen.map(e=>String(e.id)),reason:'cell',entry:'dc200CellAction',limitEnemyIdsToRequest:true})`

Dans le Bridge, `V113.selectCombatants()` reste toujours appelé. Le flag `limitEnemyIdsToRequest:true` ne remplace pas V113 : il intersecte seulement ses `enemyIds` avec la liste déjà décidée par Dungeon.

Le vieux traitement `cell` est retiré de `startCombat()` afin d'éviter deux propriétaires actifs de la préparation des renforts.

Aucun observer global, timer de réparation, wrapper de rendu ou nouvelle autorité combat n'a été ajouté.

## Inventaire après 4M

Inventaire attendu dans `index.html` :

- `dc200StartCombat` : 1 — alias historique caractérisé ;
- `openDungeonCombatSetup` : 1 — fallback historique capturé ;
- `launchCombat200` : 2 — fallback historique caractérisé ;
- `startCombat` : 2 — fonction historique + alias, **aucun callsite Dungeon actif restant**.

Le but n'est pas de forcer ces compteurs à zéro : les références restantes sont des contrats de compatibilité déjà caractérisés et leur retrait nécessitera un lot d'extraction séparé.

## Validation technique 4M

Candidat technique exact : `10a64990d6eeac101cab8c6484ca0465cb4b2d67`.

Deux sentinelles historiques ont été adaptées sans modification runtime car elles vérifiaient littéralement l'ancienne expression `prepared.options||{}` au lieu du contrat V113. Elles vérifient maintenant le vrai invariant : `preparedOptions` est transmis à `V113.selectCombatants()`, puis le filtrage ennemi 4M ne peut que réduire la sélection lorsque le flag explicite est présent.

CI technique sur `10a64990...` :

- Combat 4M dédié — **success**, run `35264148227` ;
- architecture + Chromium/preview — **success**, run `35264148205` ;
- Firefox général — **success**, run `35264148110` ;
- Dock contrat + Chromium + Firefox — **success**, run `35264148122`.

## Fermeture 4M

Les présents documents créent un nouveau SHA final documentaire. Il doit être revalidé intégralement avant checkpoint.

Checkpoint cible :

`checkpoint/gensrpg-combat-callsite-migration-4m-green-2026-09-17`

Avant création :

1. revalider le SHA documentaire exact par Combat 4M, architecture + Chromium/preview, Firefox général et Dock ;
2. vérifier le diff net depuis le checkpoint 4L `45bbca1c...` ;
3. vérifier `main` = `e8681f9823573ced8aec59c8ddc47a72b02bc663` ;
4. créer le checkpoint sur le SHA final exact.

## Suite après checkpoint 4M

Ne pas supprimer mécaniquement `startCombat`, `dc200StartCombat`, `launchCombat200` ou `openDungeonCombatSetup` uniquement pour faire tomber les compteurs. Les callsites Dungeon actifs ont quitté `startCombat`, mais les fallbacks historiques restants sont protégés pour les contextes non-Dungeon.

Le prochain lot doit être choisi depuis le checkpoint 4M vert en relisant la charte, la roadmap et l'inventaire. Toute extraction d'un fallback historique doit d'abord caractériser son contrat hors Dungeon.

## Règle permanente de continuité

À chaque chantier : lire la charte puis ce fichier, partir d'un checkpoint vert exact, branche dédiée, caractériser avant correction, petit lot homogène, aucun mécanisme de réparation, tests permanents, checkpoint vert sur le SHA exact validé, puis mettre les documents de reprise à jour avant le chantier suivant.

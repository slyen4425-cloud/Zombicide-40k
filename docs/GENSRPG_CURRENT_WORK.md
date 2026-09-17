# GenSrpG — Point de reprise courant

Ce fichier est le point d'entrée prioritaire lorsqu'un fil de discussion est plein ou qu'un chantier doit être repris dans un nouveau fil.

## Chantier courant — régression Dock Tactical sur combats répétés

- Fil directeur : **COORDINATEUR actif**.
- Branche : `work/gensrpg-tactical-dock-repeat-layer-diagnostic-2026-09-17`.
- Base exacte : checkpoint Combat 4M vert `402c66efa3f129d3719b8ce74b0f0dcd78f7bace`.
- Checkpoint de base : `checkpoint/gensrpg-combat-callsite-migration-4m-green-2026-09-17`.
- Production sûre `main` : V16.78.114.11 — `e8681f9823573ced8aec59c8ddc47a72b02bc663`.
- `main` reste gelé pendant la restructuration.
- Périmètre du lot : **Dock flottant Tactical + conflit de couche legacy lors des entrées directes par le Bridge uniquement**.

## Chaîne directrice verte avant ce lot

- Combat 4K : `checkpoint/gensrpg-combat-callsite-migration-4k-green-2026-09-17` — `c672726b69aa5895d252e2f31084c20740bcc699`.
- Talent post-4K : `checkpoint/gensrpg-talent-integration-post-4k-green-2026-09-17` — `c52fd9abf8f19c345d1cd7088e86ae3179b42401`.
- Preview/PWA post-Talent : `checkpoint/gensrpg-preview-pwa-post-talent-green-2026-09-17` — `4c1c1e60b4e06a82986babc435ac07d48dff4833`.
- Dock Tactical post-PWA : `checkpoint/gensrpg-tactical-dock-post-pwa-green-2026-09-17` — `1cff0ec5628f79f8cc1bb556fd6bd2f14b691d72`.
- Combat 4L `ambush` : `checkpoint/gensrpg-combat-callsite-migration-4l-green-2026-09-17` — `45bbca1c1f146732f4ae366c2ab74b9ec9263b2b`.
- Combat 4M `cell` : `checkpoint/gensrpg-combat-callsite-migration-4m-green-2026-09-17` — `402c66efa3f129d3719b8ce74b0f0dcd78f7bace`.

Le jalon Dock reste protégé : l'UI Tactical canonique expose `onAfterRender()` et V111 s'y abonne sans wrapper `render()`, sans `MutationObserver` global et sans retry de réparation.

## Signalement utilisateur

Après plusieurs combats sur le checkpoint 4M, le Dock flottant `Attaquer / Fin du tour / Capacité` pouvait sembler absent de façon intermittente. Le signalement demandait explicitement de vérifier la profondeur d'affichage avant toute modification fonctionnelle.

Conformément à la charte, l'audit Phase 1 a été suspendu et une branche corrective dédiée a été ouverte depuis le checkpoint 4M exact.

## Caractérisation avant correction

Le Dock V111 a un `z-index` de `31850`.

Les couches Tactical canoniques restent en dessous :
- overlay Tactical principal : `30000` ;
- fenêtres/détails Tactical : environ `31500`.

Le problème n'était donc pas un z-index insuffisant face au Tactical lui-même.

En revanche, le shell legacy Dungeon conserve des couches nettement supérieures :
- `#dungeonCombatModal` : `100900` ;
- anciens modals de dés : `101500` ;
- d'autres couches legacy sont également au-dessus du Dock.

Une couche legacy combat restée ouverte peut donc recouvrir physiquement le Dock alors que celui-ci existe bien dans le DOM.

Test permanent : `tests/gens_tactical_dock_legacy_layer_characterization_v11411.test.cjs`.

## Cause exacte

`assets/gensrpg/gens-rpg-runtime-repair-1678106.js` possède déjà le propriétaire historique de fermeture de l'ancien combat : `closeLegacyCombat(rt)`.

L'ancien chemin d'interception par renderer V106 faisait :

1. ouverture Tactical ;
2. `closeLegacyCombat(rt)` ;
3. nettoyage du host legacy.

Après les migrations 4K/4L/4M, plusieurs entrées Dungeon passent directement par `GensRpgTacticalCombatV2Bridge.requestCombat(...)`. Ce chemin direct ouvrait le Tactical mais ne réutilisait pas `closeLegacyCombat()`.

La migration n'avait donc pas cassé le renderer du Dock ; elle avait contourné une étape de transition qui neutralisait une couche legacy à z-index supérieur.

## Preuve RED avant correction

Un test cible permanent a été ajouté :

`tests/gens_tactical_bridge_legacy_layer_target_v11411.test.cjs`

Il exige qu'une entrée directe par le Bridge :
- ouvre le Tactical ;
- réutilise le nettoyage V106 exactement une fois ;
- ferme le host legacy immédiatement après l'ouverture Tactical ;
- neutralise `dungeonCombatActive`.

Run RED attendu avant correction : `35266713487` sur `4ea3ff2f1643168edce0603765eda8c09a9ab33c`.

Dans ce run :
- contrat source Dock : success ;
- caractérisation des couches : success ;
- contrat de nettoyage Bridge : failure attendue ;
- navigateurs non lancés car le contrat cible bloquait la suite.

## Correction appliquée

Aucun z-index du Dock n'a été augmenté.

Deux changements runtime seulement :

1. `gens-rpg-runtime-repair-1678106.js` expose son propriétaire existant `closeLegacyCombat` dans son API ;
2. `gens-rpg-tactical-combat-v2-bridge.js` réutilise ce propriétaire après une ouverture Tactical directe, puis réapplique le verrou de scroll Tactical.

Le Bridge ne duplique aucune manipulation DOM de fermeture. Le chemin historique `runtime-renderer:` est explicitement exclu de cet appel car le wrapper V106 réalise déjà le même nettoyage après le retour du Bridge ; cela évite une double fermeture.

Aucun observer, timer, retry, wrapper de rendu ou nouveau système de couche n'a été ajouté.

## Sentinelle navigateur renforcée

Le test `tests/gens_tactical_dock_browser_v11411.test.cjs` conserve son contrat historique et ajoute un scénario mobile répété :

- trois combats successifs ;
- avant chaque combat, un ancien `#dungeonCombatModal` est volontairement armé à `z-index:100900` ;
- un hit-test prouve qu'il couvre réellement la zone du Dock avant la transition ;
- le combat est ouvert par le Bridge direct ;
- le test vérifie ensuite que le host legacy est masqué, que `dungeonCombatActive=false`, que le Dock existe une seule fois et reste visible ;
- `document.elementFromPoint()` au centre du Dock doit résoudre vers le Dock ou l'un de ses enfants, ce qui prouve qu'aucun overlay legacy ne le recouvre ;
- Chromium et Firefox exécutent ce scénario.

Fixture : `tests/fixtures/tactical-dock-render-v11411.html`.

## Validation technique

Candidat technique exact : `456106fe37798e59fac413d9d67a9b9503d9e909`.

CI sur ce SHA :
- Dock dédié, contrat + Chromium + Firefox — **success**, run `35267218985` ;
- architecture + Chromium/preview — **success**, run `35267218727` ;
- Firefox général — **success**, run `35267218722`.

Diff net depuis 4M :
- 2 fichiers runtime modifiés de façon ciblée ;
- workflow Dock ;
- 2 tests permanents dédiés ;
- fixture et test navigateur renforcés ;
- aucun changement de `index.html` ;
- aucun changement du z-index du Dock ;
- aucune modification de la préparation 4M `cell`, des règles de combat, des dégâts, de la timeline ou du déplacement.

## Fermeture du lot

Les présents documents créent un nouveau SHA documentaire. Ce SHA doit repasser les validations obligatoires avant création du checkpoint.

Checkpoint cible :

`checkpoint/gensrpg-tactical-dock-legacy-layer-green-2026-09-17`

Avant création :
1. revalider le SHA documentaire exact par Dock, architecture + Chromium/preview et Firefox général ;
2. vérifier le diff depuis `402c66efa3f129d3719b8ce74b0f0dcd78f7bace` ;
3. vérifier `main` = `e8681f9823573ced8aec59c8ddc47a72b02bc663` ;
4. créer le checkpoint sur le SHA final exact.

## Suite après checkpoint

Reprendre l'audit Phase 1 depuis le checkpoint vert du Dock corrigé. Ne pas ouvrir de nouveau lot runtime tant que la matrice des sentinelles n'a pas identifié le plus petit manque suivant.

État de l'audit déjà établi avant interruption :
- Tactical combat : fortement couvert ;
- déplacement Dungeon : couvert par `dungeon_runtime_regression.test.cjs` ;
- D6/D100 : couverts par les sentinelles performance/Tactical ;
- Save & Quit : navigation après quit couverte, mais vraie reprise complète encore à distinguer ;
- Survie : isolation couverte, lancement navigateur complet à distinguer ;
- PvP : comportement actuel « À VENIR » à préserver, ne pas inventer un moteur ;
- Capture : gameplay réel mais absence de sentinelle dédiée clairement identifiée à confirmer comme candidat Phase 1.

## Règle permanente de continuité

À chaque chantier : lire la charte puis ce fichier, partir d'un checkpoint vert exact, branche dédiée, caractériser avant correction, petit lot homogène, aucun mécanisme de réparation ajouté pour masquer le problème, tests permanents, checkpoint vert sur le SHA exact validé, puis mettre les documents de reprise à jour avant le chantier suivant.

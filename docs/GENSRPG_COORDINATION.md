# GenSrpG — Coordination des fils et agents

Ce document complète `GENSRPG_CHARTE.md`, `GENSRPG_RESTRUCTURATION_ROADMAP.md` et `GENSRPG_CURRENT_WORK.md`.

Objectif : permettre de reprendre GenSrpG dans un autre fil sans perdre la hiérarchie entre le fil directeur et les agents parallèles.

## 1. Rôle unique du fil directeur

Un seul fil à la fois porte le rôle **COORDINATEUR / FIL DIRECTEUR**.

Il est seul responsable de :
- choisir le checkpoint vert de référence ;
- ouvrir les lots suivants ;
- attribuer les missions aux agents ;
- empêcher deux agents de modifier le même propriétaire critique ;
- contrôler branche, SHA, diff et tests des agents ;
- décider de l'ordre d'intégration ;
- créer les checkpoints verts ;
- maintenir les documents de reprise ;
- décider quand une version peut être proposée au test utilisateur ;
- ne jamais modifier `main` pendant la restructuration tant que la charte l'interdit.

Les autres fils sont des **AGENTS EXÉCUTANTS**. Ils ne deviennent jamais coordinateurs par défaut et ne fusionnent pas leurs travaux entre eux.

## 2. Procédure de reprise dans un nouveau fil directeur

Lire dans cet ordre :
1. `docs/GENSRPG_CHARTE.md`
2. `docs/GENSRPG_RESTRUCTURATION_ROADMAP.md`
3. `docs/GENSRPG_CURRENT_WORK.md`
4. `docs/GENSRPG_COORDINATION.md`

Puis vérifier :
- le SHA exact de `main` ;
- le dernier checkpoint vert ;
- les branches agents encore actives ;
- les propriétaires critiques déjà réservés ;
- les résultats agents non encore intégrés.

## 3. Règle agent

Chaque agent doit avoir :
- une branche dédiée ;
- une mission unique ;
- un périmètre déclaré ;
- un propriétaire principal ;
- une liste explicite de systèmes interdits ;
- des tests avant correction ;
- un SHA final et un compte rendu.

Règle absolue : **1 agent = 1 branche = 1 périmètre = 1 checkpoint éventuel**.

Deux agents ne doivent jamais modifier le même propriétaire critique en parallèle.

## 4. Verrous de coordination

Tant qu'un lot est actif, son propriétaire critique est verrouillé pour les autres agents.

Avant de lancer un nouvel agent, le coordinateur vérifie qu'il n'entre pas en conflit avec :
- navigation / fiche héros ;
- stats / XP / progression ;
- combat Tactical ;
- déclenchement combat Dungeon ;
- déplacement Dungeon ;
- sauvegarde / reprise ;
- inventaire / équipement / sets ;
- shell / `index.html` si le même bloc est concerné.

## 5. État de coordination — 2026-09-17

### Fil directeur
- Rôle : **COORDINATEUR actif**.
- Chantier courant : fermeture de la régression **Dock Tactical / couche legacy sur combats répétés**.
- Branche : `work/gensrpg-tactical-dock-repeat-layer-diagnostic-2026-09-17`.
- Base exacte : checkpoint Combat 4M vert.
- Checkpoint de base : `checkpoint/gensrpg-combat-callsite-migration-4m-green-2026-09-17`.
- SHA de base : `402c66efa3f129d3719b8ce74b0f0dcd78f7bace`.
- Propriétaires verrouillés pendant ce lot : transition Bridge vers Tactical et fermeture du host combat legacy V106.
- Candidat technique vert : `456106fe37798e59fac413d9d67a9b9503d9e909`.
- Checkpoint cible : `checkpoint/gensrpg-tactical-dock-legacy-layer-green-2026-09-17` après revalidation du SHA documentaire final.

### Production sûre
- `main` : V16.78.114.11.
- SHA attendu : `e8681f9823573ced8aec59c8ddc47a72b02bc663`.
- `main` reste gelé pendant la restructuration.

### Chaîne directrice verte
- Combat 4K : `c672726b69aa5895d252e2f31084c20740bcc699`.
- Talent post-4K : `c52fd9abf8f19c345d1cd7088e86ae3179b42401`.
- Preview/PWA post-Talent : `4c1c1e60b4e06a82986babc435ac07d48dff4833`.
- Dock Tactical post-PWA : `1cff0ec5628f79f8cc1bb556fd6bd2f14b691d72`.
- Combat 4L `ambush` : `45bbca1c1f146732f4ae366c2ab74b9ec9263b2b`.
- Combat 4M `cell` : `402c66efa3f129d3719b8ce74b0f0dcd78f7bace`.

### Dock Tactical — contrat permanent
L'UI Tactical canonique expose `onAfterRender()` et V111 s'y abonne. Aucun wrapper de `render()`, `MutationObserver` global ou retry de réparation ne doit être réintroduit.

Le Dock reste à `z-index:31850`. Le correctif courant ne modifie pas sa profondeur : il neutralise la couche legacy qui ne doit plus rester ouverte après une entrée Tactical directe.

### Régression signalée — caractérisation
Après plusieurs combats, le Dock flottant pouvait sembler absent. Le diagnostic de profondeur a confirmé :
- overlay Tactical principal : `30000` ;
- Dock V111 : `31850` ;
- ancien `#dungeonCombatModal` : `100900` ;
- anciens modals de dés : `101500`.

Le Dock est donc correctement placé face au Tactical canonique, mais un host legacy resté ouvert peut le recouvrir.

Test permanent : `tests/gens_tactical_dock_legacy_layer_characterization_v11411.test.cjs`.

### Cause exacte
`GensRpgRuntimeRepair1678106` possédait déjà `closeLegacyCombat(rt)` et l'ancien chemin renderer V106 l'appelait après l'ouverture du Tactical.

Les callsites migrés en 4K/4L/4M passent désormais directement par `GensRpgTacticalCombatV2Bridge.requestCombat(...)`. Le chemin direct du Bridge ouvrait le Tactical sans réutiliser ce nettoyage V106.

Le problème n'est donc pas une disparition intermittente du renderer du Dock, mais une transition directe qui pouvait laisser une ancienne couche combat au-dessus de lui.

### RED avant correction
Test cible : `tests/gens_tactical_bridge_legacy_layer_target_v11411.test.cjs`.

Run `35266713487` sur `4ea3ff2f1643168edce0603765eda8c09a9ab33c` :
- contrat Dock : success ;
- caractérisation profondeur : success ;
- exigence de nettoyage Bridge : failure attendue.

### Correction ciblée
Deux changements runtime uniquement :
- V106 expose son propriétaire existant `closeLegacyCombat` ;
- le Bridge l'appelle après les entrées Tactical directes, puis restaure `body.style.overflow="hidden"` pour le Tactical.

Le chemin `runtime-renderer:` est exclu de cet appel direct car le wrapper V106 y effectue déjà le nettoyage à son retour. Cela évite une double autorité/double fermeture.

Le Bridge ne duplique aucune manipulation DOM de V106. Aucun observer, timer, retry, nouveau renderer ou hausse arbitraire de z-index n'a été ajouté.

### Sentinelle navigateur renforcée
Le test Dock mobile ouvre trois combats successifs. Avant chacun, un host legacy à `z-index:100900` est volontairement armé et prouvé au-dessus de la zone du Dock. Après ouverture directe par le Bridge, le test exige :
- host legacy masqué ;
- `dungeonCombatActive=false` ;
- verrou de scroll Tactical restauré ;
- exactement un Dock ;
- Dock visible au tour héros ;
- hit-test du centre du Dock résolu vers le Dock et non vers un overlay legacy.

Le scénario tourne sous Chromium et Firefox.

### Validation technique
Candidat exact : `456106fe37798e59fac413d9d67a9b9503d9e909`.

CI :
- Dock dédié contrat + Chromium + Firefox — **success**, run `35267218985` ;
- architecture + Chromium/preview — **success**, run `35267218727` ;
- Firefox général — **success**, run `35267218722`.

Diff depuis le checkpoint 4M :
- 2 petits changements runtime ciblés ;
- tests/fixture/workflow Dock ;
- aucun `index.html` runtime modifié ;
- aucun z-index Dock modifié ;
- aucune règle de combat, dégâts, timeline, mouvement ou préparation `cell` modifiée.

### Fermeture en cours
Les documents produisent un SHA documentaire final distinct. Ce SHA doit repasser les validations Dock + architecture + Firefox avant création du checkpoint.

## 6. Ordre d'intégration décidé

Ordre actuel :
1. Combat 4K — fermé vert ;
2. Talent post-4K — fermé vert ;
3. Preview/PWA post-Talent — fermé vert ;
4. Dock Tactical post-PWA — fermé vert ;
5. Combat 4L `ambush` — fermé vert ;
6. Combat 4M `cell` — fermé vert ;
7. Régression Dock / couche legacy — candidat technique vert, clôture documentaire en cours.

L'audit Phase 1, interrompu par le signalement utilisateur, reprend uniquement après le checkpoint vert de ce correctif.

Ne pas fusionner les anciennes branches agents ou lignes parallèles en bloc. Reporter uniquement les changements caractérisés et compatibles sur la dernière base verte directrice.

## 7. Reprise Phase 1 après fermeture

Éléments déjà établis avant l'interruption :
- combat Tactical : couverture forte ;
- déplacement Dungeon réel : couvert par `dungeon_runtime_regression.test.cjs` ;
- D6/D100 : couverts par les sentinelles performance/Tactical ;
- Save & Quit : sortie UI couverte, vraie reprise complète à distinguer ;
- Survie : isolation couverte, lancement navigateur complet à distinguer ;
- PvP : état courant « À VENIR » à préserver, sans inventer un moteur ;
- Capture : gameplay réel mais pas encore de sentinelle dédiée clairement identifiée, candidat probable au plus petit lot test-only Phase 1.

Aucune modification runtime Phase 1 ne doit être engagée avant fermeture de la matrice de couverture.

## 8. Compte rendu obligatoire d'un agent

À la fin de son lot, un agent doit fournir :
- cause exacte ;
- branche ;
- SHA final ;
- fichiers modifiés ;
- tests ajoutés/modifiés ;
- résultats CI ;
- risques ou limites ;
- confirmation qu'il n'a pas touché aux systèmes hors périmètre ;
- checkpoint éventuel.

Le coordinateur ne considère jamais un travail intégré simplement parce qu'un agent dit qu'il est terminé : il vérifie le dépôt et les tests.

## 9. Règle de succession

Quand un nouveau fil devient directeur, l'ancien fil ne doit plus lancer de nouveau chantier concurrent.

Le nouveau fil devient l'unique autorité de coordination après avoir vérifié les quatre documents de reprise et l'état GitHub réel.

# GenSrpG — Intégration Survie : Fouiller + arts historiques

Date : 2026-09-20

Branche :
`work/gensrpg-survival-search-art-integration-2026-09-20`

Checkpoint de départ :
`checkpoint/gensrpg-start-survival-search-art-integration-2026-09-20`

Base exacte :
`9f3183ca1822e07089ea2ecdf399a18b3c3e051e`
(`checkpoint/gensrpg-phase4-storage-capture-progress-green-2026-09-20`)

Production `main` reste gelée sur :
`e8681f9823573ced8aec59c8ddc47a72b02bc663`.

## Source validée

Lot Agent 1 :
- branche : `work/gensrpg-survival-search-art-repair-2026-09-20` ;
- checkpoint GREEN : `checkpoint/gensrpg-survival-search-art-repair-green-2026-09-20` ;
- SHA documentaire : `024dd6a92d2af50d226e9432fbc038a92173e2a0`.

Cette branche est divergente de la chaîne Phase 4 actuelle.
Elle n'est donc pas fusionnée en bloc.

## Diagnostic conservé

### Fouiller

Agent 1 a démontré sur le vrai chemin Shell -> Survie -> partie -> fiche héros que :
- `#searchItemBtn` existe ;
- une seule action Fouiller est visible ;
- `onclick="searchItem()"` reste raccordé ;
- le clic réel modifie `state.found` ;
- aucune couche Dungeon/Tactical/Capture ne masque le bouton.

Conclusion :
aucun correctif runtime n'était nécessaire pour Fouiller.

### Arts Survie

Cause exacte :
les renderers historiques pointaient toujours vers
`assets/img_01_...` à `assets/img_32_...`,
mais les fichiers physiques avaient disparu de la chaîne principale.

Correction validée :
restaurer les 32 fichiers physiques historiques exacts, sans fallback inter-module.

## Intégration actuelle

### Assets

32 blobs Git exacts réutilisés directement depuis le lot Agent 1 :
- `img_01` à `img_06` : héros Survie ;
- `img_07` à `img_26` : objets / cartes de Fouille ;
- `img_26` à `img_32` : ennemis / réserve historiques.

Commit :
`c360edef639e636465f625cdec83820a3cab4cb2`

Aucun blob n'a été réencodé ou renommé.

### Sentinelle

Fichier :
`tests/gens_survival_search_art_browser_v11411.test.cjs`

Repris byte-for-byte du lot Agent 1.

Il vérifie :
- vrai Shell -> Survie ;
- vraie partie Survie ;
- fiche héros ;
- unicité et fonctionnement de Fouiller ;
- décodage des 6 arts héros ;
- décodage des 20 arts objets/cartes ;
- décodage des 7 arts ennemis ;
- couverture collective `img_01` à `img_32` ;
- absence de 404 sur ces assets ;
- absence de fallback inter-module.

Commit :
`6fa7c40ed2f4e42d1365e1c296d1288b5248dc14`

### CI

La sentinelle est exécutée dans le job navigateur Architecture juste après :
`Vérifier le lancement Survie par le vrai Shell`.

Commit :
`5f3b72b47b4080782615a1a7655a39e98d157c0b`

## Invariants

- aucun changement de `index.html` ;
- aucun runtime Survie modifié ;
- aucune règle gameplay modifiée ;
- aucun fallback Dungeon/Capture/PvP ;
- aucun déplacement d'asset ;
- aucun observer/timer/retry ;
- aucun changement Storage/Stats/Tactical ;
- aucun merge sur `main`.

## Critère GREEN

Le lot n'est GREEN qu'après :
- sentinelle Fouiller + arts SUCCESS ;
- Architecture + navigateur complet SUCCESS ;
- Firefox SUCCESS ;
- Tactical Dock SUCCESS.

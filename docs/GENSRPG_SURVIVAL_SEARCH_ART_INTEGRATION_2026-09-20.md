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

## Validation fonctionnelle

HEAD :
`5004d4cac4ff118448b6867d58092c49fa4e8dee`

Runs :
- Architecture + navigateur complet `35506146562`, tentative 2 — SUCCESS ;
- Firefox `35506146704` — SUCCESS ;
- Tactical Dock `35506146608` — SUCCESS.

La tentative 1 du navigateur Architecture a rencontré un échec ponctuel lors du contrôle immédiat de décodage d'un art objet. Aucun code n'a été changé. La tentative 2 a passé :
- Fouiller + arts Survie ;
- Dungeon après Survie ;
- toute la suite de la batterie navigateur.

Conclusion :
la restauration des 32 assets et la sentinelle sont fonctionnellement GREEN.

## Critère GREEN

Atteint fonctionnellement. Le checkpoint final est créé seulement après revalidation du HEAD documentaire.

## Stabilisation de la sentinelle après intégration

Deux exécutions ont montré que les balises des arts objets pouvaient être présentes avant la fin de leur décodage navigateur.
Le test Agent 1 vérifiait immédiatement `naturalWidth`, alors qu'il attendait déjà explicitement `img.decode()` pour les arts ennemis.

Le test a été rendu déterministe en appliquant la même attente explicite aux 20 arts objets/cartes.

Commit test uniquement :
`dbe144f33d34081a722e433e5a64b3afcd816c84`

Ce changement :
- ne modifie aucun runtime ;
- ne masque pas un asset cassé ;
- attend seulement la fin du décodage avant l'assertion ;
- conserve les contrôles `complete`, `naturalWidth > 0`, `naturalHeight > 0` et absence de 404.

## Validation finale fonctionnelle

HEAD :
`dbe144f33d34081a722e433e5a64b3afcd816c84`

Runs :
- Architecture + navigateur complet `35506567496` — SUCCESS ;
- Firefox `35506567482` — SUCCESS ;
- Tactical Dock `35506567367` — SUCCESS.

Résultat :
- Fouiller fonctionne réellement ;
- les 32 arts Survie sont restaurés et décodés ;
- la chaîne Dungeon / Capture / PvP / Tactical reste verte ;
- aucun runtime de jeu n'a été modifié.

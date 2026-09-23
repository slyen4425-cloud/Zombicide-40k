# GenSrpG — Phase 5 / Revalidation goMenu Core 0.23

Date : 2026-09-23

## Base actuelle

- branche :
  `work/gensrpg-phase5-gomenu-core023-revalidation-2026-09-23` ;
- checkpoint de départ :
  `checkpoint/gensrpg-start-phase5-gomenu-core023-revalidation-2026-09-23` ;
- base GREEN :
  `checkpoint/gensrpg-stats-editor-game-coherence-preaudit-green-2026-09-23` ;
- SHA exact :
  `146778230a2d95f5730b46ba744f9f0956605c66` ;
- runtime :
  taille `8171571`, blob `6e76a99af5fb839db5ffb20a2e67fd1572bf13ea` ;
- production :
  `main = e8681f9823573ced8aec59c8ddc47a72b02bc663`, gelée.

Aucun runtime n'est modifié.

## Pourquoi une revalidation

Un ancien pré-audit Core 0.23 avait déjà été clôturé GREEN sur la base
`44db719503ca3ab697f65d4ba3da93c929733935`.

Depuis, deux lots utilisateur ont été intégrés sur la ligne de travail :
- correction disponibilité héros Survie ;
- pré-audit cohérence Stats éditeur -> jeu.

L'ancien checkpoint n'est ni déplacé ni réécrit.
Le présent lot revalide ses conclusions sur la base GREEN actuelle.

## Chaîne goMenu actuelle

1. `captureFix139`
2. `gensDungeonCore01Js`
3. `dungeonCore023StabilityFix`
4. `dungeonCore200Rebuild`

## Constats revalidés

### Core 0.23 goMenu

- délègue d'abord au propriétaire précédent ;
- si le `DungeonCore01.active` courant reste vrai :
  - nettoie `body.style.overflow` ;
  - ferme `specialDiceModal` ;
  - ferme `dc01Modal` ;
  - rappelle `DungeonCore01.show()`.

Il ne s'agit donc pas d'un simple transit syntaxique.

### Core 2.00

Core 2.00 charge après Core 0.23.

Sur le Dungeon nominal :
`active200 && isDungeonMode()`

il masque la fiche, appelle `show()` et retourne avant de déléguer.
Core 0.23 n'est donc pas exécuté sur ce chemin.

### openHero Core 0.23

Core 0.23 avait aussi enveloppé l'ancien `DungeonCore01.openHero`.
Core 2.00 remplace ensuite l'objet public `window.DungeonCore01` avec son
propre `openHero`.

Cette ancienne garde Core 0.23 n'est donc plus l'autorité finale.

### Écart encore non prouvé

Le `goMenu` Core 2.00 n'effectue pas explicitement les nettoyages legacy
`overflow / specialDiceModal / dc01Modal`.

Les E2E actuels prouvent des postconditions propres après les vrais retours
Dungeon/Capture/Survie, mais ils ne prouvent pas qu'un chemin UI réel puisse
encore ouvrir ces couches legacy immédiatement avant `goMenu`.

## Décision

Aucun retrait dans cette revalidation.

Le prochain lot doit être une caractérisation navigateur dédiée des états
legacy réellement atteignables, sans fabriquer artificiellement une bonne
valeur ni forcer une couche impossible dans le vrai flux utilisateur.

Seulement si ce lot est GREEN et démontre que le nettoyage Core 0.23 n'est plus
nécessaire, un futur lot TDD pourra envisager le retrait de son affectation
`window.goMenu` uniquement.

## Dettes séparées conservées

- petits rafraîchissements visuels Stats/UI ;
- détection ennemie intermittente ;
- embuscade à revalider manuellement plus tard.

Aucun merge sur `main`.

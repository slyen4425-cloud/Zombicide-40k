# GenSrpG — Phase 5 / caractérisation E2E goMenu Core 0.23

Date : 2026-09-23

## Base

- branche :
  `work/gensrpg-phase5-gomenu-core023-e2e-characterization-2026-09-23` ;
- checkpoint de départ :
  `checkpoint/gensrpg-start-phase5-gomenu-core023-e2e-characterization-2026-09-23` ;
- base GREEN :
  `checkpoint/gensrpg-stats-editor-game-coherence-preaudit-green-2026-09-23` ;
- SHA de base :
  `146778230a2d95f5730b46ba744f9f0956605c66` ;
- runtime inchangé :
  taille `8171571`, blob `6e76a99af5fb839db5ffb20a2e67fd1572bf13ea` ;
- production :
  `main = e8681f9823573ced8aec59c8ddc47a72b02bc663`, gelée.

Aucun runtime/gameplay n'est modifié dans ce lot.

## Mission

Caractériser par vrai navigateur la responsabilité résiduelle de
`dungeonCore023StabilityFix -> window.goMenu`.

La question n'est pas de retirer Core 0.23 d'avance, mais de prouver si son
post-traitement peut encore être nécessaire sur des parcours utilisateur réels.

## Deux faux RED déjà identifiés

### 1. Instrumentation de show()

Premier RED :
le test remplaçait `window.DungeonCore01.show` et attendait un appel.

Erreur de test :
Core 2.00 appelle son `show()` local capturé dans sa closure.
L'instrumentation du membre public ne pouvait donc pas observer ce chemin.

Décision :
retirer le compteur et observer uniquement les effets réels :
fiche fermée, map Dungeon visible, overlays fermés.

### 2. Switch direct Dungeon actif -> carte Survie

Deuxième RED :
le test cherchait le bouton racine Survie alors qu'une vraie session Dungeon
était encore affichée.

Erreur de test :
la carte racine est volontairement masquée pendant ce contexte ; le parcours
n'existe pas depuis cet écran.

Décision :
utiliser le vrai parcours utilisateur :
1. Dungeon actif ;
2. vrai bouton `DungeonCore01.quit()` / Sauvegarder & quitter ;
3. retour Shell racine ;
4. sauvegarde Dungeon conservée ;
5. sélection réelle Survie ;
6. appel du vrai `goMenu` Survie ;
7. vérifier que Core 0.23 ne réaffiche jamais Dungeon.

## Sentinelle

`tests/gens_phase5_gomenu_core023_e2e_characterization_v1.test.cjs`

Dernier SHA de test :
`4ac6333d5af5e5ad4b1805865fdba12a3a29d0f5`.

Le test doit prouver :
- retour fiche -> map Dungeon correct ;
- Save & Quit relâche l'autorité visuelle Dungeon ;
- la sauvegarde Dungeon reste réellement présente ;
- le Shell sélectionne Survie ;
- `DungeonCore01.active === false` après cette transition ;
- le vrai `goMenu` Survie ouvre le menu Survie ;
- Dungeon reste masqué malgré l'ancien runtime persistant.

## Interdictions

- aucun retrait Core 0.23 tant que ce scénario n'est pas GREEN ;
- aucun changement `index.html` ;
- aucun wrapper/observer/timer/retry ;
- aucune correction détection ennemie ;
- aucun traitement des petits rafraîchissements UI ;
- aucun merge sur `main`.

# GenSrpG — Régression disponibilité héros Survie après Dungeon

Date : 2026-09-23

## Base

- branche :
  `work/gensrpg-survival-hero-availability-regression-2026-09-23` ;
- checkpoint de départ :
  `checkpoint/gensrpg-start-survival-hero-availability-regression-2026-09-23` ;
- base exacte :
  `44db719503ca3ab697f65d4ba3da93c929733935` ;
- runtime de base :
  taille `8171079`, blob `6a9392e667881f2087e4df931645cada4201cb3c` ;
- production gelée :
  `main = e8681f9823573ced8aec59c8ddc47a72b02bc663`.

## Signalement utilisateur

En Mode Survie, après les travaux Phase 5, aucun héros n'est disponible dans
la sélection de participants.

Le bug Stats signalé simultanément reste un chantier séparé.

## Reproduction RED

Sentinelle :
`tests/gens_survival_heroes_after_dungeon_e2e_browser_v1.test.cjs`.

Chemin réel :
1. chargement propre ;
2. vraie sélection du profil Dungeon ;
3. vraie sélection d'un héros Dungeon ;
4. vrai `startConfiguredGame()` ;
5. sortie Dungeon ;
6. retour au Mode Survie / profil 40K ;
7. nouvelle partie ;
8. ouverture de la vraie sélection de héros.

Run RED :
`35853739430`.

Étape en échec :
`Reproduire la perte des héros Survie après Dungeon`.

L'ancienne sentinelle Survie à froid reste GREEN, ce qui prouve la lacune de
couverture : elle efface le stockage avant son scénario et ne traversait jamais
Dungeon -> Survie avec les profils persistés.

## Cause prouvée

Le propriétaire fautif est `ensureBaseGameProfile()`.

Pendant `startConfiguredGame()` Dungeon :
- le profil actif est Dungeon ;
- `ensureBaseGameProfile()` reconstruit le profil 40K ;
- son `bp.heroPool` utilisait `currentAllHeroIds()` ;
- `currentAllHeroIds()` dépend de `isDungeonMode()` et retourne donc le pool
  Dungeon ;
- le code retire ensuite précisément les héros Dungeon du pool 40K ;
- le résultat enregistré peut devenir un `heroPool` Survie vide.

Le propriétaire Core 156 respecte ensuite strictement le `heroPool` 40K
persisté : la vraie UI de sélection ne peut donc plus proposer de héros.

## Correction propriétaire

Commit runtime :
`3f463bc90a3f09af29ff8bc51f4ec0269d5e0afc`.

Correction sans wrapper UI :
- ajout d'un calcul `survivalHeroIdsForBaseProfile()` indépendant du mode actif ;
- `ensureBaseGameProfile()` utilise cette source au lieu de
  `currentAllHeroIds()` pour le profil 40K ;
- ajout d'une réparation idempotente du profil 40K déjà persisté avec un
  `heroPool` vide ;
- cette réparation est exécutée à l'ouverture du profil 40K, avant la
  normalisation des participants.

Aucun changement de :
- Dungeon gameplay ;
- Capture ;
- Tactical ;
- Builder ;
- Stats ;
- détection ennemie ;
- embuscade ;
- goMenu.

Nouvelle empreinte runtime :
- taille `8171970` ;
- blob `842d248315a89e848bdbea565bf33a420eda3806`.

## Validation requise

Le commit documentaire de ce rapport doit déclencher :
1. Architecture + navigateur complet ;
2. Firefox ;
3. Tactical Dock.

Le lot ne sera GREEN que si la nouvelle sentinelle Dungeon -> Survie passe et
si toutes les sentinelles existantes restent GREEN.

Aucun merge sur `main`.

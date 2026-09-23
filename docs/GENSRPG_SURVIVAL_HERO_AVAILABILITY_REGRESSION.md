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

La première candidate runtime
`3f463bc90a3f09af29ff8bc51f4ec0269d5e0afc`
a correctement réparé le comportement mais a introduit deux helpers globaux.
La sentinelle de cartographie Phase 2 l'a refusée. Cette candidate est donc
abandonnée et n'est pas le résultat final.

Correction v2 :
`75be90dedf62e85eec0f0e34ecab8b6c52f75cfd`.

Réalignement strict des dérivés :
`4881330969882ce687315eecc79993ec53efe7b8`.

Correction finale, sans nouveau global ni wrapper UI :
- `ensureBaseGameProfile()` calcule directement le pool 40K à partir des héros
  Survie, indépendamment de `isDungeonMode()` ;
- il n'utilise plus `currentAllHeroIds()` pour construire le pool 40K ;
- à l'ouverture du profil 40K, si un ancien état persistant a déjà un
  `heroPool` vide, `openGensBuiltInGame()` redélègue au propriétaire existant
  `ensureBaseGameProfile()` pour le reconstruire ;
- aucun helper global supplémentaire n'est conservé ;
- la cartographie Phase 2 garde les mêmes nombres de globals et propriétaires.

Aucun changement de :
- Dungeon gameplay ;
- Capture ;
- Tactical ;
- Builder ;
- Stats ;
- détection ennemie ;
- embuscade ;
- goMenu.

Nouvelle empreinte runtime finale :
- taille `8171571` ;
- blob `6e76a99af5fb839db5ffb20a2e67fd1572bf13ea`.

## Validation requise

Le présent commit documentaire déclenche :
1. Architecture + navigateur complet ;
2. Firefox ;
3. Tactical Dock.

La nouvelle sentinelle doit passer GREEN sur :
Dungeon -> lancement -> sortie -> Survie -> sélection de héros.

Le lot ne sera GREEN que si la nouvelle sentinelle Dungeon -> Survie passe et
si toutes les sentinelles existantes restent GREEN.

Aucun merge sur `main`.

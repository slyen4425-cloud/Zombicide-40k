# GenSrpG — Phase 4 Core Progression / XP — pré-audit raccord XP dans le niveau

Date : 2026-09-22

## Gouvernance

- Branche :
  `work/gensrpg-phase4-progression-xp-into-level-raccord-preaudit-2026-09-22`.
- Checkpoint de départ :
  `checkpoint/gensrpg-start-phase4-progression-xp-into-level-raccord-preaudit-2026-09-22`.
- Base exacte :
  `beca0fd4ddc15d00ee7d99090ac211ec0cbfa5c5`.
- Checkpoint GREEN de départ :
  `checkpoint/gensrpg-phase4-progression-xp-into-level-contract-green-2026-09-22`.
- Production gelée :
  `main = e8681f9823573ced8aec59c8ddc47a72b02bc663`, V16.78.114.11.

Aucun runtime n'est modifié dans ce pré-audit.

## État exact de départ

`index.html` :
- taille : `8 174 416` octets ;
- blob : `a68bcbaf5d16bdbe2e70cbe0959a421371554fcc`.

Core Progression :
- fichier : `assets/gensrpg/core/progression-v1.js` ;
- blob : `f633de55f1e6bda339e66c65debc35d7b8da2510` ;
- API :
  - `levelFromXp(xp, progressionConfig)` ;
  - `xpIntoLevel(xp, progressionConfig, fallbackXpPerLevel)`.

Le contrat pur `xpIntoLevel` est GREEN mais n'est pas encore raccordé au propriétaire runtime.

## Propriétaire actif

Propriétaire unique :

`dungeonCore044HeroProgression -> dungeonRpgXpIntoLevel`.

Le manifeste Phase 2 conserve un seul last owner pour :
- `dungeonRpgXpIntoLevel` ;
- `dungeonRpgLevelFromXp` ;
- `dungeonRpgEarnedSkillPoints`.

Le raccord ne doit modifier que le premier.

## Propriétaire actuel

Le propriétaire historique :

1. lit `activeProg()` ;
2. normalise l'XP ;
3. pour no-profile / linéaire :
   - lit `loadDungeonRpgRules().xpPerLevel` ;
   - calcule le modulo local ;
4. pour custom :
   - appelle `dungeonRpgLevelFromXp(v)` ;
   - soustrait uniquement le seuil explicite du niveau courant.

Le mode custom ne lit actuellement **pas** les règles Dungeon.

## Point subtil du raccord

Le `dungeonRpgLevelFromXp` actuel possède lui aussi `activeProg()`.

En mode custom, l'ancien `dungeonRpgXpIntoLevel` :
- lit le profil une première fois ;
- appelle le seam global niveau ;
- ce seam relit le profil ;
- puis délègue finalement à `GensProgressionV1.levelFromXp(v,p)`.

Le contrat Core `xpIntoLevel` appelle directement son propre
`levelFromXp(value,p)`.

Un raccord complet supprime donc un **second read redondant du profil** dans le
chemin custom.

Ce changement de topologie est accepté uniquement parce que :
- le propriétaire niveau est unique ;
- sa branche avec profil délègue déjà directement au même Core ;
- aucun wrapper concurrent du calcul niveau n'est actif ;
- le calcul reste synchrone ;
- la matrice de parité prouve le même résultat ;
- aucun état n'est muté.

Il s'agit d'une correction soustractive, pas d'une nouvelle autorité.

## Candidat de raccord minimal

Forme candidate :

`window.dungeonRpgXpIntoLevel=function(xp){const p=activeProg(),v=Math.max(0,Number(xp)||0),fallback=(!p||(p.xpCurveMode||"linear")!=="custom")?loadDungeonRpgRules().xpPerLevel:undefined;return GensProgressionV1.xpIntoLevel(v,p,fallback)}`

Points importants :
- `activeProg()` reste à la frontière historique ;
- la normalisation XP reste à la frontière historique ;
- le fallback Dungeon est évalué uniquement en no-profile/linéaire ;
- le mode custom conserve zéro lecture de `loadDungeonRpgRules()` ;
- le Core reste sans dépendance Dungeon.

## Parité caractérisée

Sentinelle :

`tests/gens_phase4_progression_xp_into_level_raccord_preaudit_v1.test.cjs`.

Elle compare propriétaire actuel et candidat sur :
- no-profile / fallback 25 ;
- fallback 0 ;
- fallback non numérique truthy ;
- fallback négatif ;
- linéaire normal ;
- linéaire zéro ;
- linéaire invalide ;
- linéaire négatif ;
- custom complet ;
- custom seuils clairsemés / invalides ;
- XP numériques / strings / négatifs / overflow.

La matrice exige au moins 70 cas de parité exacte.

Pour `NaN`, la parité est contrôlée explicitement.

## Lecture des règles Dungeon

La sentinelle verrouille :
- no-profile / linéaire :
  - legacy = 1 lecture des règles ;
  - candidat = 1 lecture des règles ;
- custom :
  - legacy = 0 lecture des règles ;
  - candidat = 0 lecture des règles.

Ainsi, le futur raccord ne devra pas écrire naïvement :

`GensProgressionV1.xpIntoLevel(v,p,loadDungeonRpgRules().xpPerLevel)`

car cela introduirait une lecture des règles Dungeon même en custom.

Le fallback doit rester **lazy**.

## Ce qui reste hors périmètre

Ne pas toucher :
- `dungeonRpgEarnedSkillPoints` ;
- `dungeonSyncProgressionForState` ;
- `changeXP` ;
- XP combat / objectifs / récompenses ;
- points dépensés ;
- level-up ;
- restauration ;
- popup / son ;
- sauvegarde ;
- rendu ;
- Stats / Inventory / Storage / Dice / Tactical.

## Critère GREEN du pré-audit

Avant checkpoint GREEN :
1. sentinelle ajoutée à Architecture ;
2. Architecture + navigateur complet SUCCESS ;
3. Firefox SUCCESS ;
4. Tactical Dock SUCCESS ;
5. même SHA exact ;
6. diff vérifié : aucun runtime modifié.

## Suite autorisée après GREEN

Ouvrir un lot séparé de raccord runtime.

TDD du futur raccord :
- RED exigeant la délégation réelle au Core ;
- puis modification du seul propriétaire
  `dungeonRpgXpIntoLevel` ;
- Core byte-identique ;
- aucun autre seam Progression raccordé.

Aucun merge sur `main`.

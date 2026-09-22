# GenSrpG — Phase 4 Core Progression / XP — pré-audit du seam suivant

Date : 2026-09-22

## Gouvernance

- Branche :
  `work/gensrpg-phase4-progression-xp-next-seam-preaudit-2026-09-22`.
- Checkpoint de départ :
  `checkpoint/gensrpg-start-phase4-progression-xp-next-seam-preaudit-2026-09-22`.
- Base exacte :
  `6458f2d41245cfbd48e0d61367962a79d9d002f2`.
- Checkpoint GREEN de départ :
  `checkpoint/gensrpg-phase4-progression-xp-first-raccord-green-2026-09-22`.
- Production gelée :
  `main = e8681f9823573ced8aec59c8ddc47a72b02bc663`, V16.78.114.11.

Aucun runtime ne doit être modifié dans ce pré-audit.

## État exact de départ

`index.html` :
- taille : `8 174 416` octets ;
- blob : `a68bcbaf5d16bdbe2e70cbe0959a421371554fcc`.

Core Progression :
- `assets/gensrpg/core/progression-v1.js` ;
- blob : `b02487346f1a0df12effbc4559b5063bf8e12726` ;
- API actuellement raccordée :
  `GensProgressionV1.levelFromXp(xp, progressionConfig)`.

Le premier raccord XP -> niveau est déjà GREEN et ne doit pas être rouvert.

## Candidats restants observés dans Core 0.44

### 1. `dungeonRpgXpIntoLevel(xp)`

Propriétaire actif :
`dungeonCore044HeroProgression`.

Caractéristiques :
- calcul uniquement ;
- aucune écriture de stockage ;
- aucun DOM ;
- aucun timer/retry ;
- aucune mutation de héros ;
- aucun rendu ;
- consomme le niveau canonique uniquement en mode custom.

Branches réelles :

1. **sans profil**
   - utilise `loadDungeonRpgRules().xpPerLevel` ;
   - calcule un modulo.

2. **profil linéaire**
   - utilise `p.xpPerLevel` ;
   - si la valeur est absente, invalide ou zéro, retombe sur
     `loadDungeonRpgRules().xpPerLevel` ;
   - une valeur négative reste truthy puis est clampée à 1 par
     `Math.max(1,...)`.

3. **profil custom**
   - calcule d'abord le niveau via `dungeonRpgLevelFromXp(v)` ;
   - soustrait uniquement le seuil **explicitement présent** du niveau courant ;
   - si ce seuil manque ou est invalide, le départ du niveau vaut 0.

Ce dernier point est important : `levelFromXp` peut avancer grâce à ses seuils de
fallback alors que `xpIntoLevel` soustrait 0 si le seuil explicite du niveau
courant est absent. Ce comportement doit être conservé à l'identique.

### 2. `dungeonRpgEarnedSkillPoints(xp)`

Également calculatoire, mais plus couplé :
- dépend du niveau ;
- mélange règles de progression et politique de points ;
- utilise `startingSkillPoints`, `skillPointsPerLevel` ou
  `talentPointsPerLevel` ;
- alimente ensuite la synchronisation des points gagnés/dépensés.

Ce seam reste différé après `dungeonRpgXpIntoLevel`.

### 3. `dungeonSyncProgressionForState` et aval

Non candidats au prochain micro-lot pur :
- mutation de state ;
- points dépensés ;
- sauvegarde/rendu indirects ;
- cycle level-up ;
- XP manuel/combat/objectifs.

## Seam sélectionné

Le prochain micro-lot proposé est :

`dungeonRpgXpIntoLevel`.

Raison :
- plus petit contrat restant ;
- déterministe avec entrées explicites ;
- aucune autorité gameplay mutante ;
- dépendance au niveau déjà canonique seulement en custom ;
- peut être extrait sans toucher à la distribution XP, aux points ou au level-up.

## Forme Core candidate

Le pré-audit ne crée pas encore l'API, mais la forme minimale permettant de
préserver les trois branches est :

`xpIntoLevel(xp, explicitProgressionConfig, fallbackXpPerLevel)`.

Le troisième argument doit rester une donnée explicite fournie par la frontière
historique. Le Core ne doit pas lire `loadDungeonRpgRules()`.

## Cas de compatibilité à verrouiller au futur contrat

### Sans profil / fallback Dungeon

Avec `fallbackXpPerLevel=25` :
- 24 XP -> 24 ;
- 25 XP -> 0 ;
- 50 XP -> 0 ;
- 63 XP -> 13.

### Profil linéaire

Avec `xpPerLevel=7` :
- 20 XP -> 6 ;
- 21 XP -> 0.

Avec `xpPerLevel=0` et fallback Dungeon 25 :
- 63 XP -> 13.

Avec `xpPerLevel=-5` :
- clamp à 1 ;
- 63 XP -> 0.

### Profil custom complet

Profil :
`{xpPerLevel:10,maxLevel:5,xpThresholds:{2:4,3:11,4:30,5:70}}`.

Exemples :
- 4 XP -> 0 ;
- 10 XP -> 6 ;
- 11 XP -> 0 ;
- 29 XP -> 18 ;
- 30 XP -> 0 ;
- 69 XP -> 39 ;
- 70 XP -> 0 ;
- 99 XP -> 29 ;
- 999 XP -> 929.

### Profil custom clairsemé / invalide

Profil :
`{xpPerLevel:10,maxLevel:5,xpThresholds:{2:5,4:40,5:"bad"}}`.

Comportement historique à conserver :
- 20 XP -> 20 ;
- 39 XP -> 39 ;
- 40 XP -> 40 ;
- 99 XP -> 99.

Ce comportement peut sembler contre-intuitif, mais il est actuellement réel et
ne doit pas être "corrigé" pendant la restructuration.

## Test de pré-audit

Sentinelle :
`tests/gens_phase4_progression_xp_next_seam_preaudit_v1.test.cjs`.

Elle doit prouver :
- propriétaire Core 0.44 inchangé ;
- Core Progression byte-identique ;
- API `xpIntoLevel` encore absente du Core ;
- aucune modification runtime ;
- trois branches caractérisées ;
- custom appelle le seam niveau canonique exactement une fois ;
- linéaire/no-profile ne l'appellent pas ;
- `dungeonRpgEarnedSkillPoints` reste différé.

## Suite autorisée après GREEN

Si ce pré-audit devient GREEN :

1. ouvrir un lot séparé de **contrat Core pur XP-into-level** ;
2. TDD de parité avec les cas ci-dessus ;
3. ne raccorder aucun runtime pendant le contrat pur ;
4. seulement après GREEN du contrat, ouvrir un lot de raccord dédié.

Aucun merge sur `main`.


## Validation technique avant clôture documentaire

SHA :
`7a8b691072828c0a84d8468ca274e28b772478de`.

Runs sur ce SHA exact :
- Architecture + navigateur complet :
  `35718095681` — SUCCESS ;
- Firefox :
  `35718095818` — SUCCESS ;
- Tactical Dock :
  `35718095640` — SUCCESS.

La nouvelle sentinelle
`gens_phase4_progression_xp_next_seam_preaudit_v1.test.cjs`
est passée SUCCESS dans Architecture.

Aucune modification runtime n'est incluse dans ce lot.

## Clôture conditionnelle

Checkpoint GREEN cible :

`checkpoint/gensrpg-phase4-progression-xp-next-seam-preaudit-green-2026-09-22`.

La clôture documentaire change le SHA. Le même SHA documentaire final exact doit
donc repasser Architecture + navigateur complet, Firefox et Tactical Dock avant
création du checkpoint GREEN.

Après GREEN, la seule suite autorisée côté Progression est un nouveau lot
homogène de **contrat Core pur XP-into-level**, sans raccord runtime.

# GenSrpG — Phase 4 Core Progression / XP — contrat pur XP -> niveau

Date : 2026-09-22

## Gouvernance

- Branche :
  `work/gensrpg-phase4-progression-xp-contract-clean-2026-09-22`.
- Checkpoint de départ :
  `checkpoint/gensrpg-start-phase4-progression-xp-contract-clean-2026-09-22`.
- Base exacte :
  `79ca6dca0df93abd40c8443fad8fcfc9c6cc4c28`.
- Checkpoint GREEN de départ :
  `checkpoint/gensrpg-phase4-progression-xp-preaudit-final-green-2026-09-22`.
- Production gelée :
  `main = e8681f9823573ced8aec59c8ddc47a72b02bc663`, V16.78.114.11.

Des noms de lot Progression existaient déjà depuis un état antérieur mais leur
checkpoint de départ était trois commits avant le GREEN final et leur branche
avait divergé. Ils n'ont pas été déplacés ni réutilisés. Le présent lot `clean`
repart du vrai GREEN final.

## Mission

Créer uniquement le contrat pur Core Progression pour le calcul :

`levelFromXp(xp, progressionConfig)`.

Aucun consommateur runtime n'est raccordé dans ce lot.

## RED

Sentinelle :
`tests/gens_phase4_progression_xp_contract_v1.test.cjs`.

Commit CI RED :
`eef99bd5549a2729a8d08fb6d2fec8938aa6ff29`.

Run Architecture :
`35703064109` — FAILURE attendu.

Étape en échec :
`Verrouiller le contrat pur Core Progression XP Phase 4`.

Les sentinelles antérieures, dont le pré-audit Progression, étaient SUCCESS.
Le service n'existait pas encore.

## Service Core ajouté

Commit de création :
`9691d83e5fbf18fe37a7328f07f828675f598372`.

Fichier :
`assets/gensrpg/core/progression-v1.js`.

Blob Git :
`b02487346f1a0df12effbc4559b5063bf8e12726`.

API :
- `levelFromXp(xp, progressionConfig)`.

Le service :
- est pur ;
- reçoit une configuration explicite ;
- ne lit ni profil actif ni règles Dungeon globales ;
- ne connaît aucun héros courant ;
- n'attribue aucun XP ;
- ne possède ni stockage, DOM, popup, son, timer, observer, listener ou RNG ;
- ne modifie aucun état ;
- expose une API gelée via `GensProgressionV1`.

## Parité avec l'autorité historique

Autorité historique caractérisée :

`dungeonCore044HeroProgression -> dungeonRpgLevelFromXp`.

Le contrat conserve exactement la branche de calcul du profil progression :

### Normalisation XP

`Math.max(0, Number(xp) || 0)`.

Sont notamment conservés :
- valeurs négatives -> 0 ;
- valeurs non numériques / vides -> 0 ;
- chaînes numériques coercibles.

### Courbe linéaire

- mode par défaut : `linear` ;
- `xpPerLevel` configurable ;
- compatibilité historique `xpPerLevel || 10` puis minimum 1 ;
- `maxLevel || 100` puis minimum 1 ;
- formule :
  `min(maxLevel, 1 + floor(xp / xpPerLevel))`.

Les valeurs explicites configurées gagnent bien sur les fallbacks.

### Courbe personnalisée

Pour chaque niveau 2..max :
- seuil explicite :
  `xpThresholds[level]` ;
- si le seuil est absent, nul, non numérique ou équivalent falsy après conversion,
  fallback historique :
  `(level - 1) * xpPerLevel` ;
- progression séquentielle et arrêt au premier seuil non atteint.

La sentinelle protège aussi le cas historique où deux niveaux peuvent partager le
même seuil après fallback.

### maxLevel

Le cap configuré est conservé exactement dans les cas valides caractérisés.

## Frontières explicitement exclues

Ce contrat ne possède pas :

- `dungeonRpgXpIntoLevel` ;
- `dungeonRpgEarnedSkillPoints` ;
- `dungeonSyncProgressionForState` ;
- `changeXP` ;
- `awardDungeonDefeatXp` ;
- partage XP de groupe ;
- kills / drops / récompenses victoire ;
- `dungeonHandleLevelUp071` ;
- restauration PV/mana de level-up ;
- persistance ;
- points de stats dépensés ;
- UI / popup / son.

Le module historique
`assets/gensrpg/dungeon/progression-runtime-v1.js`
reste hors graphe de production et n'est pas connecté.

## Cartographie Phase 2

L'ajout physique du service a d'abord fait échouer normalement la cartographie,
puis celle-ci a été réalignée pour classer le nouveau fichier comme **Phase 4
inert**.

Commit d'alignement :
`c9819d693318459016f0a50cdf75391976b27754`.

État :
- inventaire physique local JS : 95 ;
- services Phase 4 : 15 ;
- services Phase 4 inert : 3 ;
- graphe production-reachable : toujours 77 ;
- `progression-v1.js` reste hors production.

Aucun changement n'a été fait dans :
- `index.html` — blob toujours
  `2d7677950f04e9a3290ff0062e157a126123891d` ;
- `preview.html` ;
- injection GitHub Pages ;
- service worker ;
- runtime bootstrap.

## Correction de sentinelle pendant le lot

La première version GREEN-candidate du test supposait à tort qu'un seuil custom
invalide au niveau 5 avec `xpPerLevel=10` retombait à 50.

Le legacy exact retombe à :
`(5 - 1) * 10 = 40`.

La sentinelle a été corrigée, sans modifier le service, afin de protéger ce
comportement exact.

Commit :
`ff91dac9f5d2285ec12f059107dd822d97d126d4`.

## Validation technique

SHA technique :
`ff91dac9f5d2285ec12f059107dd822d97d126d4`.

Sur ce même SHA :

- Architecture + navigateur complet :
  `35703389599` — SUCCESS ;
- Firefox :
  `35703389466` — SUCCESS ;
- Tactical Dock :
  `35703389639` — SUCCESS.

Le navigateur complet valide notamment :
Survie, Dungeon après Survie, Builder, Config objet, fiche RPG, authored
cache/pièges, Save & Quit/reprise, PvP, Capture, non-interférence quatre modules,
murs, preview, assets et Equipment.

## Invariants

- aucun raccord runtime ;
- aucun changement gameplay ;
- aucune formule historique inline retirée ;
- aucun wrapper global ajouté ;
- aucun observer/timer/retry/fallback ajouté ;
- aucun changement Stats / Inventory / Dice / Storage / Tactical ;
- aucun changement `main`.

## Suite après GREEN

Après checkpoint GREEN uniquement, ouvrir un lot séparé de **pré-audit du premier
raccord Core Progression**.

Ce futur lot devra comparer le helper actif
`dungeonRpgLevelFromXp` au service pur et sélectionner le raccord minimal sans
présélectionner les autres fonctions Progression.

Il est interdit d'enchaîner dans le même lot :
- `dungeonRpgXpIntoLevel` ;
- points de talent ;
- synchronisation héros ;
- XP manuel ;
- récompenses ;
- popup level-up.

## Clôture

La présente documentation modifie le SHA.

Le checkpoint cible :

`checkpoint/gensrpg-phase4-progression-xp-contract-green-2026-09-22`

ne doit être créé qu'après trois SUCCESS sur le **SHA documentaire final exact** :
1. Architecture + navigateur complet ;
2. Firefox ;
3. Tactical Dock.

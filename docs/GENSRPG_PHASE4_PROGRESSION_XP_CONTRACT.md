# GenSrpG — Phase 4 Core Progression / XP — contrat pur XP -> niveau

Date : 2026-09-22

## Gouvernance

- Branche :
  `work/gensrpg-phase4-progression-xp-contract-cleanbase-2026-09-22`.
- Checkpoint de départ :
  `checkpoint/gensrpg-start-phase4-progression-xp-contract-cleanbase-2026-09-22`.
- Base exacte :
  `79ca6dca0df93abd40c8443fad8fcfc9c6cc4c28`.
- Checkpoint GREEN de départ :
  `checkpoint/gensrpg-phase4-progression-xp-preaudit-final-green-2026-09-22`.
- Production gelée :
  `main = e8681f9823573ced8aec59c8ddc47a72b02bc663`, V16.78.114.11.

Le premier essai du lot contrat, ouvert sur la base `4bf7a325...`, est conservé
comme historique mais n'est pas utilisé comme autorité : il précédait la clôture
GREEN finale du pré-audit. Le présent lot rejoue donc le TDD sur le vrai GREEN.

## Mission

Créer uniquement le contrat pur du futur Core Progression pour le calcul :

`XP -> niveau`.

Service :

`assets/gensrpg/core/progression-xp-v1.js`.

API :

`GensProgressionXpV1.levelFromXp(xp, progressionConfig)`.

Aucun consommateur runtime n'est raccordé dans ce lot.

## RED

Sentinelle :

`tests/gens_phase4_progression_xp_contract_v1.test.cjs`.

SHA sentinelle + CI :

`b4109f7e6b7a4c1f2dab53fdb3b6582deea82fb3`.

Run Architecture :

`35701986461` — FAILURE attendue.

Étape :

`Verrouiller le contrat pur Core Progression XP Phase 4`.

Erreur exacte :

`Phase 4 pure Core Progression XP service must exist`.

Le pré-audit Progression précédent était SUCCESS immédiatement avant cette
étape. Le service n'existait donc pas au moment du RED.

## Service pur ajouté

Commit :

`dccc64d0adaa7ec9ab9dc9c3f2f72de7f898b055`.

Fichier :

`assets/gensrpg/core/progression-xp-v1.js`.

Blob :

`f00811e31653032de7718eaecbf1774284253004`.

Le service :

- reçoit uniquement XP + configuration explicite ;
- ne lit aucun profil actif ;
- ne lit aucun état héros ;
- ne lit aucun DOM ;
- ne possède aucun stockage ;
- ne possède aucun timer / observer / listener ;
- ne possède aucun RNG ;
- ne connaît aucune récompense, UI, popup ou module gameplay ;
- expose une API immuable ;
- reste CommonJS-testable ;
- n'est pas auto-installé.

## Contrat reproduit

Le service reproduit exactement le propriétaire actif
`dungeonCore044HeroProgression -> dungeonRpgLevelFromXp`.

### Normalisation XP

`Math.max(0, Number(xp) || 0)`.

### Max level

`Math.max(1, Number(maxLevel) || 100)`.

Le comportement legacy n'est pas « amélioré » :
un `maxLevel` fractionnaire ou non fini conserve les conséquences du calcul
historique au lieu d'être silencieusement normalisé.

### Courbe linéaire

Mode par défaut :

`linear`.

Formule :

`min(maxLevel, 1 + floor(xp / max(1, Number(xpPerLevel)||10)))`.

### Courbe personnalisée

Le service parcourt les niveaux de 2 à `maxLevel`.

Pour chaque niveau :

`max(0, Number(xpThresholds[level]) || ((level-1)*per))`.

Conséquences legacy conservées :

- seuil absent -> fallback linéaire ;
- seuil explicite négatif -> clamp à 0 ;
- seuil explicite 0 est falsy et déclenche le fallback linéaire ;
- arrêt au premier seuil non atteint.

## Parité

La sentinelle exécute à la fois :

- le propriétaire actif Core 0.44 ;
- le nouveau service pur.

Elle compare **352 cas de parité** sur :

- modes linéaire / custom ;
- valeurs `xpPerLevel` par défaut, custom, zéro, négatives ;
- `maxLevel` normal, fractionnaire et infini ;
- seuils custom complets, absents, zéro et négatifs ;
- XP numérique, négative, chaînes, vide, null, false, undefined, NaN et ±Infinity.

Résultat sur le SHA technique :

`GensProgressionXpV1.levelFromXp` — parité GREEN.

## Cartographie Phase 2

L'ajout physique du service fait passer l'inventaire JS local de :

`94 -> 95`.

La sentinelle de cartographie a d'abord échoué correctement après création du
service :

- Architecture sur `dccc64d0...` ;
- erreur : inventaire physique attendu 94, observé 95.

Le service a ensuite été classé explicitement :

**Phase 4 inert**.

Commit de cartographie :

`3908272af49001e5731b3f7ce52866864f9133c6`.

Le graphe production-reachable reste :

`77`.

Le service n'est présent ni dans :

- `index.html` ;
- `preview.html` ;
- injection GitHub Pages ;
- service worker.

Il ne peut donc modifier aucun comportement utilisateur dans ce lot.

## Frontières conservées

Inchangés :

- `index.html`, blob
  `2d7677950f04e9a3290ff0062e157a126123891d` ;
- `dungeonCore044HeroProgression` ;
- `dungeonRpgXpIntoLevel` ;
- `dungeonRpgEarnedSkillPoints` ;
- `dungeonSyncProgressionForState` ;
- `changeXP` ;
- `awardDungeonDefeatXp` ;
- `dungeonRecordCombatReward` ;
- `dungeonHandleLevelUp071` ;
- `progression-runtime-v1.js` ;
- Stats / Inventory / Dice / Storage / Tactical ;
- Survie / Dungeon / Capture / PvP ;
- `main`.

Le Core Dice reste byte-identique :
`1813b6edb1ac69317d158e8cac6eb5c8ac353855`.

Aucun wrapper, observer, timer, retry ou fallback n'a été ajouté.

## Validation technique

SHA technique :

`3908272af49001e5731b3f7ce52866864f9133c6`.

Sur ce même SHA :

- Architecture + navigateur complet :
  `35702209391` — SUCCESS ;
- Firefox :
  `35702209398` — SUCCESS ;
- Tactical Dock :
  `35702209417` — SUCCESS.

Le navigateur complet conserve notamment :
Survie, Dungeon après Survie, Builder, Config objet, fiche RPG,
authored/cache/pièges, Save & Quit/reprise, PvP, Capture, non-interférence,
murs, preview, assets et Equipment.

## Suite

Après checkpoint GREEN final seulement :

1. ouvrir un nouveau **pré-audit de raccord** ;
2. comparer la frontière active Core 0.44 avec le nouveau service pur ;
3. définir qui construit la configuration explicite lorsque le profil Progression
   est absent ;
4. RED avant tout chargement production ;
5. ne pas inclure `xpIntoLevel`, skill points, sync, XP manuel, récompenses ou
   level-up dans ce même raccord.

Les deux retours utilisateur restent différés hors lot :
- détection ennemie immédiate à portée ;
- confusion visuelle Stats Aldren.

## Clôture

Cette documentation change le SHA.

Checkpoint GREEN cible :

`checkpoint/gensrpg-phase4-progression-xp-contract-cleanbase-green-2026-09-22`.

Avant création, le SHA documentaire final exact doit obtenir :
1. Architecture + navigateur complet — SUCCESS ;
2. Firefox — SUCCESS ;
3. Tactical Dock — SUCCESS.

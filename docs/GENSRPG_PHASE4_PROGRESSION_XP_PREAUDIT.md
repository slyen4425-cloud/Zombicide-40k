# GenSrpG — Phase 4 Core Progression / XP — pré-audit

Date : 2026-09-22

## Gouvernance

- Branche :
  `work/gensrpg-phase4-progression-xp-preaudit-2026-09-22`.
- Checkpoint de départ :
  `checkpoint/gensrpg-start-phase4-progression-xp-preaudit-2026-09-22`.
- Base exacte :
  `0ce2451da078cceb90c0431a3735932dbd41f945`.
- Dernier checkpoint GREEN :
  `checkpoint/gensrpg-phase4-dice-d10048-raccord-green-2026-09-22`.
- Production gelée :
  `main = e8681f9823573ced8aec59c8ddc47a72b02bc663`, V16.78.114.11.

Ce lot est documentaire/diagnostic uniquement. Aucun runtime n'est modifié.

## Position dans la roadmap

La Phase 4 ordonne les services communs ainsi :

1. resolver d'assets ;
2. stockage/migrations ;
3. stats ;
4. inventaire/équipement/sets ;
5. dés ;
6. **progression/XP** ;
7. bus d'événements/utilitaires communs.

Après le checkpoint GREEN Dice `d10048`, la suite conforme est donc le
pré-audit Progression/XP. Les autres seams Dice restent différés et ne sont pas
enchaînés automatiquement.

## Source index exacte

Le fichier utilisateur `work_10.zip` correspond au GREEN Dice précédent :

- taille : `8 174 637` octets ;
- blob Git : `5b8e790fefe7970a250fd9485ee80549511737e6`.

Le seul changement runtime ultérieur de `index.html` est le raccord GREEN
`d10048`.

Ce micro-diff exact a été rejoué localement sur le fichier utilisateur puis la
reconstruction a été vérifiée contre le checkpoint GREEN courant :

- taille : `8 174 648` octets ;
- blob Git : `2d7677950f04e9a3290ff0062e157a126123891d`.

Cette copie reconstruite et vérifiée est la source d'inspection du pré-audit.

## Cartographie de l'autorité actuelle

### Calcul XP -> niveau

La fonction historique initiale existe encore dans le bloc principal, mais
l'autorité runtime finale est réaffectée par :

`dungeonCore044HeroProgression`.

La cartographie Phase 2 confirme :

`dungeonRpgLevelFromXp -> dungeonCore044HeroProgression`.

Contrat actif :

- XP normalisée par `Math.max(0, Number(xp) || 0)` ;
- configuration lue depuis le profil RPG actif ;
- `maxLevel` configurable ;
- mode `linear` configurable via `xpPerLevel` ;
- mode `custom` configurable via `xpThresholds[level]` ;
- fallback historique vers `loadDungeonRpgRules().xpPerLevel` si aucun profil
  progression actif n'existe ;
- aucune persistance, DOM, popup ou timer dans le calcul lui-même.

La sentinelle exécute le vrai propriétaire Core 0.44 avec plusieurs
configurations et vérifie notamment :
- 0 / 9 / 10 XP sur une courbe 10 XP par niveau ;
- `xpPerLevel=7` et `maxLevel=3` ;
- courbe custom `{2:4,3:11,4:30,5:70}`.

Les valeurs personnalisées prennent bien l'autorité sur les défauts.

### XP dans le niveau

`dungeonRpgXpIntoLevel` est lui aussi réaffecté par Core 0.44.

Il est lié à la même politique de courbe, mais n'est pas nécessaire au premier
micro-lot : il peut être traité après le contrat XP -> niveau.

### Points de talent gagnés

`dungeonRpgEarnedSkillPoints` est également réaffecté par Core 0.44.

Il consomme :
- `startingSkillPoints` ;
- `talentPointsPerLevel` pour le profil moderne ;
- le contrat historique `skillPointsPerLevel` en fallback.

Cette fonction dépend du niveau canonique mais constitue un deuxième calcul
métier. Elle reste séparée du premier lot.

## Synchronisation de l'état héros

`dungeonSyncProgressionForState(heroId, st)` reste une fonction du bloc
historique principal et possède actuellement une seule définition nommée.

Elle combine plusieurs responsabilités :

- appel du niveau canonique ;
- points de talent gagnés ;
- points de talent déjà dépensés ;
- `startingStatPoints` ;
- `statPointsPerLevel` ;
- `bonusSkillPoints` ;
- `rpgStatSpent` ;
- mutation de `st.rpgLevel`, `st.skillPoints`, `st.statPoints`.

Conclusion : ce n'est pas un premier service pur. Son extraction devra venir
après la stabilisation des primitives de calcul.

## XP manuel

`changeXP(v)` possède une seule définition nommée et réalise :

1. mutation de `state.xp` avec clamp `0..999` ;
2. synchronisation Dungeon ;
3. cycle level-up ;
4. persistance `save()` ;
5. son UI ;
6. rendu.

Ce chemin est donc une action runtime, pas un calcul Core pur.

## XP de combat / récompenses

`awardDungeonDefeatXp(def, killerHeroId)` :

- respecte `autoEnemyXpEnabled()` ;
- prend l'XP de la définition ennemie ;
- partage l'XP entre les héros participant réellement au combat ;
- conserve un fallback vers participants / killer ;
- synchronise chaque héros ;
- appelle le cycle level-up ;
- persiste chaque état ;
- rafraîchit l'UI/objectifs.

`dungeonRecordCombatReward` agrège ensuite kills, XP et drops dans
`dungeonCombatRewards`.

Conclusion : distribution, récompenses, persistance et UI restent hors du
premier Core Progression pur.

## Cycle level-up / popup

La cartographie Phase 2 confirme deux affectations de
`dungeonHandleLevelUp071`.

Dernier propriétaire inline :

`dungeonCore312TurnAndPopupFixes`.

Ce propriétaire mélange :

- comparaison niveau avant/après ;
- règle configurable `levelUpRestore` ;
- restauration PV / mana ;
- nouvelle synchronisation progression ;
- persistance ;
- file `levelQueue312` ;
- scheduling `schedulePump312(delay)` ;
- popup de présentation.

Conclusion : ce seam est volontairement différé.

## Module externe progression-runtime-v1.js

Fichier :

`assets/gensrpg/dungeon/progression-runtime-v1.js`.

Statut Phase 2 :

- `tests-docs-only` ;
- non chargé par `index.html` ;
- non injecté par la preview ;
- non injecté par GitHub Pages ;
- non présent dans le cache du service worker ;
- hors graphe production.

Le module ne contient pas le moteur de progression :
- il wrappe `changeXP` ;
- il délègue le calcul à `dungeonSyncProgressionForState` ;
- il délègue le level-up à `dungeonHandleLevelUp071` ;
- il gère save/render/son.

Il ne doit donc **pas** être reconnecté comme propriétaire Core Progression.
Ce serait réintroduire un wrapper d'action autour du monolithe au lieu de sortir
la formule commune.

## Politique de dépenses de points

`assets/gensrpg/gens-stat-upgrade-policy-167898.js` est production-reachable,
mais reste une frontière mixte Stats / Progression Policy.

Il contient notamment :
- wrapper de `changeDungeonAttribute` ;
- ledger de dépenses ;
- UI éditeur/fiche ;
- timers/retries historiques.

Ce fichier n'est pas un candidat au premier service pur XP/niveau.

## Premier micro-lot recommandé

**Créer un contrat pur Core Progression pour XP -> niveau, sans raccord runtime.**

Forme cible conceptuelle :

`levelFromXp(xp, progressionConfig)`

Le contrat doit recevoir une configuration explicite et ne doit lire ni :
- profil actif ;
- DOM ;
- localStorage ;
- état global.

Il doit reproduire exactement :
- normalisation XP historique ;
- courbe linéaire ;
- courbe custom ;
- fallback de seuil custom manquant ;
- `maxLevel` ;
- valeurs configurées personnalisées.

Le futur service ne devra pas décider :
- attribution d'XP ;
- partage de récompenses ;
- points dépensés ;
- mutation de héros ;
- sauvegarde ;
- level-up restore ;
- popup ;
- son/rendu.

## Pourquoi ce candidat est le plus sûr

1. calcul déterministe ;
2. aucune mutation ;
3. toutes les valeurs gameplay viennent déjà de la configuration ;
4. parité vérifiable par matrice de cas ;
5. aucune dépendance Tactical / Inventory / Stats ;
6. aucun stockage/UI nécessaire ;
7. permet ensuite de faire consommer la même primitive par
   `dungeonRpgXpIntoLevel`, points gagnés et synchronisation, par lots séparés.

## Futur TDD recommandé après GREEN

Lot suivant séparé : contrat pur Core Progression XP -> niveau.

Le RED devra exiger :
1. création d'un service pur dans `assets/gensrpg/core/` ;
2. aucune connexion runtime dans le lot contrat ;
3. parité linéaire ;
4. parité custom ;
5. maxLevel ;
6. seuil custom manquant avec fallback historique ;
7. entrées XP négatives / non numériques selon compatibilité actuelle ;
8. configuration personnalisée prioritaire sur défauts ;
9. aucune dépendance DOM/storage/timer/global gameplay ;
10. aucun changement de `index.html`.

Le raccord au propriétaire Core 0.44 devra constituer un lot ultérieur distinct.

## Sentinelle de pré-audit

`tests/gens_phase4_progression_xp_preaudit_v1.test.cjs`.

Elle protège :
- blob/taille exacts de l'index GREEN ;
- dernier propriétaire XP -> niveau ;
- dernier propriétaire du cycle level-up ;
- configuration linéaire/custom ;
- chemins XP manuel et combat ;
- statut hors production de `progression-runtime-v1.js` ;
- séparation avec la politique de dépense de points ;
- sélection du premier contrat pur.

## Interdictions du lot

- aucune modification de `index.html` ;
- aucune modification des formules ;
- aucune modification de `progression-runtime-v1.js` ;
- aucune modification Stats / Inventory / Storage / Dice / Tactical ;
- aucun changement XP/récompense/loot ;
- aucun wrapper, observer, timer, retry ou fallback ;
- aucun merge sur `main`.

## Clôture

Checkpoint GREEN cible :

`checkpoint/gensrpg-phase4-progression-xp-preaudit-green-2026-09-22`.

Avant création :
1. Architecture + navigateur complet — SUCCESS ;
2. Firefox — SUCCESS ;
3. Tactical Dock — SUCCESS ;
sur le même SHA documentaire final exact.

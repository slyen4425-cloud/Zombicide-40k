# GenSrpG — Phase 4 Core Progression / XP — pré-audit du premier raccord

Date : 2026-09-22

## Gouvernance

- Branche :
  `work/gensrpg-phase4-progression-xp-first-raccord-preaudit-2026-09-22`.
- Checkpoint de départ :
  `checkpoint/gensrpg-start-phase4-progression-xp-first-raccord-preaudit-2026-09-22`.
- Base exacte :
  `4a1c63dd2558343dde27966320238d1655fb4406`.
- Checkpoint GREEN de départ :
  `checkpoint/gensrpg-phase4-progression-xp-contract-green-2026-09-22`.
- Production gelée :
  `main = e8681f9823573ced8aec59c8ddc47a72b02bc663`, V16.78.114.11.

Ce lot est strictement documentaire / caractérisation. Aucun runtime n'est modifié.

## Mission

Pré-auditer uniquement le premier raccord du service pur :

`GensProgressionV1.levelFromXp(xp, progressionConfig)`

vers le propriétaire historique actif :

`dungeonCore044HeroProgression -> dungeonRpgLevelFromXp`.

Le but est de sélectionner un seam minimal et de prouver sa frontière de
compatibilité avant tout RED de raccord.

## Sources exactes protégées

Le contrat pur Core Progression reste inchangé :

- fichier : `assets/gensrpg/core/progression-v1.js` ;
- blob Git :
  `b02487346f1a0df12effbc4559b5063bf8e12726`.

Le runtime historique reste inchangé :

- `index.html` : `8 174 648` octets ;
- blob Git :
  `2d7677950f04e9a3290ff0062e157a126123891d`.

Le service Core reste inert :
- absent de `index.html` ;
- absent de `preview.html` ;
- absent de l'injection GitHub Pages ;
- absent du service worker ;
- graphe production-reachable inchangé à 77 fichiers.

## Sentinelle de pré-audit

Fichier :

`tests/gens_phase4_progression_xp_first_raccord_preaudit_v1.test.cjs`.

Commit de création :

`5e1a84411f8804b5370e47ecbcee00a8311f3dfe`.

Intégration CI :

`8f6d2645e7201b66c05a082a262cf9e9d0e8441c`.

La sentinelle verrouille :
- le blob / la taille exacts de l'index ;
- le blob exact du Core Progression ;
- l'autorité finale de `dungeonRpgLevelFromXp` ;
- l'inventaire du helper ;
- la branche profil actif ;
- la branche legacy sans profil ;
- l'inertie du Core ;
- la sélection d'un unique futur seam.

## Résultat — branche avec profil Progression actif

La branche configurée du propriétaire historique est en parité exacte avec :

`GensProgressionV1.levelFromXp(xp, profile)`.

Matrice :
- 5 profils représentatifs ;
- 28 valeurs XP ;
- 140 comparaisons exactes.

Couverture :
- courbes linéaires ;
- `xpPerLevel` personnalisés ;
- `maxLevel` personnalisés ;
- coercions numériques ;
- XP négative / vide / non numérique ;
- courbes custom ;
- seuils manquants ;
- seuils custom invalides ;
- fallback historique des seuils.

Conclusion :
**la branche profil configuré peut être déléguée au Core sans changement de
résultat**, à condition de conserver la frontière historique avant l'appel.

## Résultat — branche historique sans profil actif

La branche sans profil Progression n'est pas équivalente à un appel naïf du Core.

Le propriétaire historique conserve :

`loadDungeonRpgRules().xpPerLevel`.

Exemple prouvé :
- règles Dungeon : `xpPerLevel = 25` ;
- XP = 50 ;
- legacy : niveau 3 ;
- `GensProgressionV1.levelFromXp(50,{})` : niveau 6.

Une adaptation limitée à `xpPerLevel` n'est toujours pas strictement équivalente,
car le Core pur conserve son contrat explicite de `maxLevel`.

Exemple prouvé :
- `xpPerLevel = 25` ;
- XP = 2500 ;
- legacy sans profil : niveau 101 ;
- Core configuré avec `xpPerLevel=25` et ses défauts : niveau 100.

Conclusion :
**la branche no-profile est une frontière de compatibilité distincte et doit
rester chez le propriétaire historique dans le premier raccord.**

## Raccord minimal sélectionné pour le futur lot TDD

Le futur lot doit modifier uniquement
`dungeonRpgLevelFromXp(xp)`.

À conserver à la frontière historique :
1. `activeProg()` ;
2. normalisation XP :
   `Math.max(0, Number(xp) || 0)` ;
3. branche `!p` utilisant
   `loadDungeonRpgRules().xpPerLevel`.

À déléguer uniquement lorsque le profil Progression existe :

`GensProgressionV1.levelFromXp(v,p)`.

Le futur raccord ne doit pas déléguer la branche no-profile à un objet de
configuration synthétique : ce serait une nouvelle politique et pourrait modifier
le gameplay legacy.

## Seams explicitement différés

Le futur premier raccord ne doit pas modifier :
- `dungeonRpgXpIntoLevel` ;
- `dungeonRpgEarnedSkillPoints` ;
- `dungeonSyncProgressionForState` ;
- `changeXP` ;
- XP combat / partage / récompenses ;
- kills / drops ;
- points de stats ou de talents dépensés ;
- `dungeonHandleLevelUp071` ;
- restauration PV / mana au level-up ;
- popup / son / rendu ;
- persistance.

## Futur TDD du raccord

Après checkpoint GREEN du présent pré-audit seulement, ouvrir un nouveau lot
homogène.

Le RED devra exiger :
1. chargement explicite de `progression-v1.js` avant
   `dungeonCore044HeroProgression` ;
2. conservation de `activeProg()` ;
3. conservation de la normalisation XP historique ;
4. conservation exacte de la branche no-profile et de
   `loadDungeonRpgRules().xpPerLevel` ;
5. disparition du calcul local linéaire/custom uniquement dans la branche profil ;
6. délégation unique de cette branche à
   `GensProgressionV1.levelFromXp(v,p)` ;
7. parité exacte des 140 cas configurés ;
8. parité legacy de la branche sans profil, y compris l'absence de cap 100
   implicite ;
9. Core Progression byte-identique ;
10. aucun autre seam Progression modifié ;
11. aucun wrapper, observer, timer, retry ou fallback ajouté ;
12. aucun changement Stats / Inventory / Storage / Dice / Tactical.

Le RED doit être observé avant toute modification runtime.

## Validation technique du pré-audit

SHA validé avant clôture documentaire :

`8f6d2645e7201b66c05a082a262cf9e9d0e8441c`.

Sur ce SHA exact :
- Architecture + navigateur complet :
  `35705074875` — SUCCESS ;
- Firefox :
  `35705074718` — SUCCESS ;
- Tactical Dock :
  `35705074886` — SUCCESS.

Aucun runtime n'a changé entre le checkpoint GREEN de départ et ce SHA :
- `index.html` inchangé ;
- Core Progression inchangé ;
- uniquement documentation d'ouverture, sentinelle et branchement CI.

## Clôture conditionnelle

La présente documentation et la mise à jour de
`docs/GENSRPG_CURRENT_WORK.md` changent le SHA.

Checkpoint cible :

`checkpoint/gensrpg-phase4-progression-xp-first-raccord-preaudit-green-2026-09-22`.

Il ne doit être créé qu'après trois SUCCESS sur le **SHA documentaire final
exact** :
1. Architecture + navigateur complet ;
2. Firefox ;
3. Tactical Dock.

Après GREEN uniquement, ouvrir le lot TDD réel du raccord de
`dungeonRpgLevelFromXp`. Aucun merge sur `main`.

# GenSrpG — Phase 4 Core Progression / XP — premier raccord XP -> niveau

Date : 2026-09-22

## Gouvernance

- Branche :
  `work/gensrpg-phase4-progression-xp-first-raccord-2026-09-22`.
- Checkpoint de départ :
  `checkpoint/gensrpg-start-phase4-progression-xp-first-raccord-2026-09-22`.
- Base exacte :
  `e85b9cb4e93c38595f29b27738a823a8ac4954bd`.
- Checkpoint GREEN de départ :
  `checkpoint/gensrpg-phase4-progression-xp-first-raccord-preaudit-green-2026-09-22`.
- Production gelée :
  `main = e8681f9823573ced8aec59c8ddc47a72b02bc663`, V16.78.114.11.

## Mission unique

Raccorder uniquement la branche **profil Progression configuré** de :

`dungeonCore044HeroProgression -> dungeonRpgLevelFromXp(xp)`

au service pur existant :

`GensProgressionV1.levelFromXp(v,p)`.

Aucun autre seam Progression n'est inclus dans ce lot.

## Preuve du pré-audit GREEN

Document source :

`docs/GENSRPG_PHASE4_PROGRESSION_XP_FIRST_RACCORD_PREAUDIT.md`.

Résultat verrouillé :
- 140 cas de parité exacte entre la branche profil historique et le Core ;
- la branche no-profile n'est pas équivalente au Core naïf ;
- `loadDungeonRpgRules().xpPerLevel` doit rester à la frontière historique ;
- la branche no-profile peut dépasser le niveau 100 ;
- le premier raccord doit donc être partiel, pas une substitution globale.

## Sources exactes de départ

`index.html` :
- taille : `8 174 648` octets ;
- blob Git :
  `2d7677950f04e9a3290ff0062e157a126123891d`.

Core Progression :
- fichier : `assets/gensrpg/core/progression-v1.js` ;
- blob :
  `b02487346f1a0df12effbc4559b5063bf8e12726`.

Le service est encore inert au checkpoint de départ.

## Contrat du raccord

Le propriétaire historique doit continuer à posséder :
1. `activeProg()` ;
2. la normalisation XP :
   `Math.max(0, Number(xp) || 0)` ;
3. la branche `!p` ;
4. le fallback `loadDungeonRpgRules().xpPerLevel`.

Uniquement lorsque `p` existe, la formule locale doit disparaître au profit de :

`GensProgressionV1.levelFromXp(v,p)`.

Le Core pur ne doit pas être modifié pour imiter la branche legacy sans profil.

## TDD obligatoire

Avant toute modification runtime :

1. ajouter une sentinelle dédiée de raccord ;
2. la brancher à Architecture ;
3. obtenir un RED attendu prouvant que le Core est encore inert / non appelé par
   le propriétaire actif ;
4. vérifier que toutes les étapes antérieures restent GREEN ;
5. seulement ensuite appliquer le micro-diff runtime.

La sentinelle doit vérifier :
- blob Core byte-identique ;
- Core chargé avant `dungeonCore044HeroProgression` dans la composition source ;
- appel réel du Core sur la branche profil ;
- aucun appel Core sur la branche no-profile ;
- conservation exacte du fallback Dungeon no-profile ;
- parité des 140 cas configurés ;
- cas legacy 50 XP / `xpPerLevel=25` -> niveau 3 ;
- cas legacy 2500 XP / `xpPerLevel=25` -> niveau 101 ;
- aucun raccord des seams différés.

## Seams différés

Interdiction de modifier dans ce lot :
- `dungeonRpgXpIntoLevel` ;
- `dungeonRpgEarnedSkillPoints` ;
- `dungeonSyncProgressionForState` ;
- `changeXP` ;
- partage XP / récompenses / kills / drops ;
- points dépensés ;
- `dungeonHandleLevelUp071` ;
- restauration PV / mana ;
- popup / son / rendu ;
- persistance.

## Composition

Le service Core devra devenir production-reachable une seule fois avant son
consommateur historique.

Aucun loader dynamique, retry ou fallback local ne doit être ajouté.

Le graphe attendu passe de 77 à 78 fichiers production-reachable uniquement si
la composition réelle confirme ce raccord.

Les gardes historiques de pré-audit / cartographie rendues obsolètes par le
raccord seront réalignées uniquement après le RED et uniquement sur ce changement
d'autorité.

## Règle 26

La modification du gros `index.html` n'est autorisée qu'à partir d'une copie
exacte correspondant au SHA de base et au blob ci-dessus.

Si la copie vérifiée précédemment n'est pas disponible dans le fil courant,
appliquer la règle 26 : demander le `index.html` exact, vérifier taille/blob,
puis seulement appliquer le micro-diff.

## Interdictions

- aucun changement du Core Progression pur ;
- aucun changement des formules legacy no-profile ;
- aucun second moteur Progression ;
- aucun wrapper global ;
- aucun MutationObserver ;
- aucun timer/retry permanent ;
- aucun monkey-patch de réparation ;
- aucun changement Stats / Inventory / Storage / Dice / Tactical ;
- aucun changement sur `main`.

## Critère de sortie

GREEN uniquement si :
1. le RED TDD a été observé avant runtime ;
2. Core Progression est chargé une seule fois avant Core 0.44 ;
3. branche profil -> Core ;
4. branche no-profile -> legacy inchangé ;
5. Core byte-identique ;
6. diff runtime limité au raccord prouvé ;
7. Architecture + navigateur complet — SUCCESS ;
8. Firefox — SUCCESS ;
9. Tactical Dock — SUCCESS ;
10. documentation finale validée sur le même SHA avant checkpoint GREEN.

## RED TDD observé

SHA RED :

`8a5a674b6574e104300c6f4346d6a3f6833ea88c`.

Runs :
- Architecture : `35710641838` — **FAILURE attendu** ;
- Firefox : `35710641580` — SUCCESS ;
- Tactical Dock : `35710641684` — SUCCESS.

Dans Architecture, les sentinelles antérieures passent, notamment :
- pré-audit Core Progression XP ;
- contrat pur Core Progression XP ;
- pré-audit du premier raccord Core Progression XP.

L'unique nouvelle étape en échec est :

`Raccorder le premier calcul XP niveau au Core Progression`.

Cause attendue du RED :
- `progression-v1.js` n'est pas encore chargé par la composition source ;
- `dungeonRpgLevelFromXp` ne délègue pas encore sa branche profil configuré au Core.

Aucun runtime n'a été modifié pour obtenir ce RED.

## Prochaine action après RED

Appliquer le micro-raccord au vrai propriétaire, à partir du `index.html` exact
du lot, puis réaligner uniquement les sentinelles/cartographies rendues
obsolètes par ce raccord.



## Raccord appliqué et validation technique GREEN

Le fichier utilisateur `index_w_11.zip` a été vérifié avant modification contre
la source Git attendue :

- taille `index.html` : `8 174 648` octets ;
- blob Git : `2d7677950f04e9a3290ff0062e157a126123891d`.

Le micro-raccord a été appliqué par workflow one-shot avec vérifications strictes
avant/après puis auto-suppression du workflow.

Commit runtime du raccord :

`7396e115347d7ae2473afab184a8ab51de7c13e5`.

### Diff runtime exact

`index.html` :
- charge une seule fois
  `assets/gensrpg/core/progression-v1.js?v=1`
  immédiatement avant `dungeonCore044HeroProgression` ;
- conserve `activeProg()` ;
- conserve la normalisation
  `Math.max(0, Number(xp) || 0)` ;
- conserve intégralement la branche `!p` et
  `loadDungeonRpgRules().xpPerLevel` ;
- remplace uniquement la formule locale de la branche profil par
  `GensProgressionV1.levelFromXp(v,p)`.

`service-worker.js` :
- ajoute uniquement
  `./assets/gensrpg/core/progression-v1.js`
  à `CORE_FILES`.

Core Progression :
- fichier byte-identique ;
- blob toujours
  `b02487346f1a0df12effbc4559b5063bf8e12726`.

État final de l'index après raccord :
- taille : `8 174 416` octets ;
- blob Git :
  `a68bcbaf5d16bdbe2e70cbe0959a421371554fcc`.

Service worker final :
- blob Git :
  `9076efa07bf3db411b48d143f05a007cbe41ccfe`.

### Contrat réellement obtenu

La sentinelle de raccord protège :
- 140 cas de parité sur les profils configurés ;
- exactement un appel Core par calcul profil configuré ;
- zéro appel Core dans la branche no-profile ;
- `xpPerLevel=25`, 50 XP -> niveau 3 en legacy ;
- `xpPerLevel=25`, 2500 XP -> niveau 101 en legacy ;
- aucun raccord de `dungeonRpgXpIntoLevel` ;
- aucun raccord de points de talent, sync héros, XP manuel, récompenses,
  level-up, popup ou persistance.

Le graphe production-reachable passe volontairement de 77 à 78 fichiers JS.

### Réalignements de cartographie/sentinelles

Après le RED et le raccord, seules les gardes devenues obsolètes par :
- le nouveau blob `index.html` ;
- le passage 77 -> 78 ;
- le passage de Core Progression de `inert` à `connected` ;
- le dernier propriétaire de `dungeonRpgLevelFromXp` ;

ont été réalignées.

Les contrats métier historiques restent inchangés. Les batteries Storage, Stats,
Inventory/Equipment, Dice, Asset Resolver, Phase 2 et Phase 3 ont ensuite toutes
repassé SUCCESS.

### Validation technique avant clôture documentaire

SHA technique :

`4904cde93ac677445bf0947fd4e41aee309c5d82`.

Sur ce SHA exact :

- Architecture + navigateur complet :
  `35714002177` — SUCCESS ;
- Firefox :
  `35714002278` — SUCCESS ;
- Tactical Dock :
  `35714002221` — SUCCESS.

Le navigateur complet valide notamment :
- Survie et Fouiller/arts ;
- Dungeon après Survie ;
- Dungeon Builder ;
- Config objet moderne ;
- fiche RPG ;
- caches/retours/pièges authored ;
- Save & Quit / reprise ;
- PvP ;
- Monster Capture ;
- non-interférence quatre modules ;
- murs ;
- preview ;
- assets ;
- Equipment.

## Clôture conditionnelle finale

Checkpoint cible :

`checkpoint/gensrpg-phase4-progression-xp-first-raccord-green-2026-09-22`.

La présente documentation modifie le SHA. Le checkpoint ne doit être créé
qu'après trois SUCCESS sur le **SHA documentaire final exact** :

1. Architecture + navigateur complet ;
2. Firefox ;
3. Tactical Dock.

Après ce GREEN uniquement, le prochain lot Progression doit être un nouveau
pré-audit homogène. Aucun autre seam Progression ne doit être raccordé dans le
présent lot.

Aucun merge sur `main`.

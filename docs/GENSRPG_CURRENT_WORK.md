## CLÔTURE CONDITIONNELLE — Phase 4 Core Progression / XP — pré-audit du seam suivant — 2026-09-22

Ce bloc devient le point de reprise actif. Les sections suivantes sont historiques.

- Branche :
  `work/gensrpg-phase4-progression-xp-next-seam-preaudit-2026-09-22`.
- Checkpoint de départ :
  `checkpoint/gensrpg-start-phase4-progression-xp-next-seam-preaudit-2026-09-22`.
- Base exacte :
  `6458f2d41245cfbd48e0d61367962a79d9d002f2`.
- Checkpoint GREEN de départ :
  `checkpoint/gensrpg-phase4-progression-xp-first-raccord-green-2026-09-22`.
- Checkpoint GREEN cible :
  `checkpoint/gensrpg-phase4-progression-xp-next-seam-preaudit-green-2026-09-22`.
- Production gelée :
  `main = e8681f9823573ced8aec59c8ddc47a72b02bc663`, V16.78.114.11.

### Résultat du pré-audit

Aucun runtime modifié.

Seam suivant sélectionné :
`dungeonRpgXpIntoLevel`.

Propriétaire actif :
`dungeonCore044HeroProgression`.

Contrats historiques caractérisés :
- sans profil : fallback `loadDungeonRpgRules().xpPerLevel` ;
- profil linéaire : `p.xpPerLevel`, fallback Dungeon si absent/invalide/zéro ;
- profil linéaire négatif : valeur truthy puis clamp à 1 ;
- profil custom : consomme `dungeonRpgLevelFromXp(v)` puis soustrait uniquement
  le seuil explicite du niveau courant ;
- seuil custom manquant/invalide : départ de niveau 0 même si le calcul de niveau
  a pu progresser via son propre fallback.

Sentinelle :
`tests/gens_phase4_progression_xp_next_seam_preaudit_v1.test.cjs`.

Document :
`docs/GENSRPG_PHASE4_PROGRESSION_XP_NEXT_SEAM_PREAUDIT.md`.

### Validation technique

SHA :
`7a8b691072828c0a84d8468ca274e28b772478de`.

- Architecture + navigateur complet :
  `35718095681` — SUCCESS au run attempt 2 ;
- Firefox :
  `35718095818` — SUCCESS ;
- Tactical Dock :
  `35718095640` — SUCCESS.

La première tentative navigateur de `35718095681` a timeout sur un clic
`Dungeon après Survie`, avec overlay Tactical interceptant les pointer events.
Le runtime était byte-identique au checkpoint GREEN ; relance du même SHA sans
modification : SUCCESS complet. Flake navigateur non reproductible.

### Source protégée

`index.html` :
- taille `8 174 416` octets ;
- blob `a68bcbaf5d16bdbe2e70cbe0959a421371554fcc`.

Core Progression :
- blob `b02487346f1a0df12effbc4559b5063bf8e12726`.

### Prochain lot après GREEN

Ouvrir un lot distinct de **contrat Core pur XP-into-level**.

API candidate :
`xpIntoLevel(xp, explicitProgressionConfig, fallbackXpPerLevel)`.

Le contrat pur doit :
- conserver les sémantiques caractérisées ;
- ne modifier aucun runtime ;
- ne lire aucune règle Dungeon directement ;
- rester inert jusqu'à son propre raccord ultérieur.

### Chantier Agent 1 vérifié et gelé

Pré-audit Event Bus / utilitaires communs :

`checkpoint/gensrpg-phase4-event-bus-utilities-preaudit-agent1-green-2026-09-22`

SHA :
`5d713123585917d55a057373cba7d5003de02e7c`.

Vérifications coordinateur :
- branche = SHA annoncé ;
- checkpoint = SHA annoncé ;
- diff uniquement doc + sentinelle + CI ;
- Architecture+navigateur `35717742314` — SUCCESS ;
- Firefox `35717742455` — SUCCESS ;
- Tactical Dock `35717742362` — SUCCESS.

Décision :
- ne pas créer de Event Bus générique ;
- U1 futur = contrat pur inert `escapeHtml()` ;
- ne pas mélanger ce chantier au domaine Progression en cours.

### Validation finale obligatoire

La clôture documentaire change le SHA.

Avant checkpoint GREEN cible, le **même SHA documentaire final** doit repasser :
1. Architecture + navigateur complet ;
2. Firefox ;
3. Tactical Dock.

Aucun merge sur `main`.

## CLÔTURE CONDITIONNELLE — Phase 4 Core Progression / XP — pré-audit du seam suivant — 2026-09-22

Ce bloc devient le point de reprise actif. Les sections suivantes sont historiques.

- Branche :
  `work/gensrpg-phase4-progression-xp-next-seam-preaudit-2026-09-22`.
- Checkpoint de départ :
  `checkpoint/gensrpg-start-phase4-progression-xp-next-seam-preaudit-2026-09-22`.
- Base exacte :
  `6458f2d41245cfbd48e0d61367962a79d9d002f2`.
- Checkpoint GREEN de départ :
  `checkpoint/gensrpg-phase4-progression-xp-first-raccord-green-2026-09-22`.
- Checkpoint GREEN cible :
  `checkpoint/gensrpg-phase4-progression-xp-next-seam-preaudit-green-2026-09-22`.
- Production gelée :
  `main = e8681f9823573ced8aec59c8ddc47a72b02bc663`, V16.78.114.11.

### Résultat du pré-audit

Aucun runtime n'a été modifié.

Seam sélectionné :
`dungeonRpgXpIntoLevel`.

Propriétaire :
`dungeonCore044HeroProgression`.

Le pré-audit verrouille :
- branche sans profil avec fallback `loadDungeonRpgRules().xpPerLevel` ;
- profil linéaire avec priorité `p.xpPerLevel` puis fallback Dungeon ;
- coercion historique des valeurs négatives ;
- profil custom via le niveau canonique déjà raccordé ;
- soustraction du seul seuil explicite du niveau courant ;
- comportement custom clairsemé/invalide inchangé.

Toujours différés :
- `dungeonRpgEarnedSkillPoints` ;
- `dungeonSyncProgressionForState` ;
- XP manuel / combat / objectifs ;
- points dépensés ;
- level-up / restauration / popup / son / persistance.

### Sources protégées

`index.html` :
- taille `8 174 416` octets ;
- blob `a68bcbaf5d16bdbe2e70cbe0959a421371554fcc`.

Core Progression :
- blob `b02487346f1a0df12effbc4559b5063bf8e12726`.

### Validation technique avant documentation finale

SHA :
`7a8b691072828c0a84d8468ca274e28b772478de`.

- Architecture + navigateur complet :
  `35718095681` — SUCCESS ;
- Firefox :
  `35718095818` — SUCCESS ;
- Tactical Dock :
  `35718095640` — SUCCESS.

### Validation finale obligatoire

La clôture documentaire change le SHA.

Avant création du checkpoint GREEN cible, le même SHA documentaire final exact
doit repasser :
1. Architecture + navigateur complet ;
2. Firefox ;
3. Tactical Dock.

### Suite autorisée après GREEN

Ouvrir un nouveau lot homogène :
**contrat Core pur XP-into-level**.

Forme candidate à verrouiller par TDD :
`xpIntoLevel(xp, explicitProgressionConfig, fallbackXpPerLevel)`.

Aucun raccord runtime dans ce futur contrat pur.

### Coordination Agent 1 — chantier futur Event Bus / utilitaires

Audit Agent 1 vérifié :
- checkpoint :
  `checkpoint/gensrpg-phase4-event-bus-utilities-preaudit-agent1-green-2026-09-22` ;
- SHA :
  `5d713123585917d55a057373cba7d5003de02e7c` ;
- aucun runtime modifié ;
- conclusion : ne pas créer de Event Bus générique à ce stade ;
- premier micro-lot futur recommandé :
  utilitaire texte Core pur `escapeHtml()`, inert avant tout raccord.

Cet audit part de l'ancienne base
`e85b9cb4e93c38595f29b27738a823a8ac4954bd`.
Ne pas fusionner directement sa branche dans la ligne Progression actuelle.
Le réappliquer/revalider sur la future base GREEN seulement lorsque la roadmap
atteindra le point 7 « bus d'événements / utilitaires communs ».

Aucun merge sur `main`.

## CLÔTURE CONDITIONNELLE — Phase 4 Core Progression / XP — premier raccord XP -> niveau — 2026-09-22

Ce bloc devient le point de reprise actif. Les sections suivantes sont historiques.

- Branche :
  `work/gensrpg-phase4-progression-xp-first-raccord-2026-09-22`.
- Checkpoint de départ :
  `checkpoint/gensrpg-start-phase4-progression-xp-first-raccord-2026-09-22`.
- Base exacte :
  `e85b9cb4e93c38595f29b27738a823a8ac4954bd`.
- Checkpoint GREEN de départ :
  `checkpoint/gensrpg-phase4-progression-xp-first-raccord-preaudit-green-2026-09-22`.
- Checkpoint GREEN cible :
  `checkpoint/gensrpg-phase4-progression-xp-first-raccord-green-2026-09-22`.
- Production gelée :
  `main = e8681f9823573ced8aec59c8ddc47a72b02bc663`, V16.78.114.11.

### TDD et raccord

RED obligatoire observé avant runtime :
- SHA `8a5a674b6574e104300c6f4346d6a3f6833ea88c` ;
- Architecture `35710641838` — FAILURE attendu ;
- Firefox `35710641580` — SUCCESS ;
- Tactical Dock `35710641684` — SUCCESS.

Raccord runtime :
- commit `7396e115347d7ae2473afab184a8ab51de7c13e5` ;
- Core chargé une fois avant `dungeonCore044HeroProgression` ;
- branche profil -> `GensProgressionV1.levelFromXp(v,p)` ;
- branche sans profil legacy inchangée ;
- service worker cache le Core Progression.

### État runtime final du lot

`index.html` :
- taille `8 174 416` octets ;
- blob `a68bcbaf5d16bdbe2e70cbe0959a421371554fcc`.

Core Progression :
- blob inchangé
  `b02487346f1a0df12effbc4559b5063bf8e12726`.

Service worker :
- blob `9076efa07bf3db411b48d143f05a007cbe41ccfe`.

Graphe production-reachable :
- 77 -> 78 fichiers JS.

Le raccord conserve :
- `activeProg()` ;
- normalisation XP historique ;
- branche no-profile ;
- `loadDungeonRpgRules().xpPerLevel` ;
- absence de cap 100 implicite sur cette branche legacy.

Toujours différés :
- `dungeonRpgXpIntoLevel` ;
- `dungeonRpgEarnedSkillPoints` ;
- `dungeonSyncProgressionForState` ;
- XP manuel ;
- XP combat/récompenses ;
- level-up/restauration/popup/son/persistance.

### Validation technique avant documentation finale

SHA :
`4904cde93ac677445bf0947fd4e41aee309c5d82`.

- Architecture + navigateur complet
  `35714002177` — SUCCESS ;
- Firefox
  `35714002278` — SUCCESS ;
- Tactical Dock
  `35714002221` — SUCCESS.

Aucun RED fonctionnel n'est resté. Les écarts intermédiaires étaient des gardes
de cartographie/fingerprint devenues obsolètes par le raccord et ont été
réalignées sans changer leurs contrats métier.

### Validation finale obligatoire

La clôture documentaire change le SHA.

Avant création du checkpoint GREEN cible, le **même SHA documentaire final
exact** doit repasser :
1. Architecture + navigateur complet ;
2. Firefox ;
3. Tactical Dock.

### Prochaine action après GREEN

Ouvrir une nouvelle branche homogène de pré-audit du prochain seam Progression.
Ne pas raccorder automatiquement plusieurs responsabilités.

Le prochain seam doit être sélectionné par caractérisation parmi les primitives
restantes, avec priorité naturelle à `dungeonRpgXpIntoLevel` si le pré-audit
confirme qu'il est pur et isolable.

Aucun merge sur `main`.

## Chantier courant prioritaire — Phase 4 Core Progression / XP — premier raccord XP -> niveau — 2026-09-22

Ce bloc devient le point de reprise actif. Les sections suivantes sont historiques.

- Branche :
  `work/gensrpg-phase4-progression-xp-first-raccord-2026-09-22`.
- Checkpoint de départ :
  `checkpoint/gensrpg-start-phase4-progression-xp-first-raccord-2026-09-22`.
- Base exacte :
  `e85b9cb4e93c38595f29b27738a823a8ac4954bd`.
- Dernier checkpoint GREEN :
  `checkpoint/gensrpg-phase4-progression-xp-first-raccord-preaudit-green-2026-09-22`.
- Production gelée :
  `main = e8681f9823573ced8aec59c8ddc47a72b02bc663`, V16.78.114.11.

### Pré-audit définitivement GREEN

SHA final :
`e85b9cb4e93c38595f29b27738a823a8ac4954bd`.

Runs sur ce SHA exact :
- Architecture + navigateur complet :
  `35709648036` — SUCCESS ;
- Firefox :
  `35709647990` — SUCCESS ;
- Tactical Dock :
  `35709647955` — SUCCESS.

Checkpoint :
`checkpoint/gensrpg-phase4-progression-xp-first-raccord-preaudit-green-2026-09-22`.

### Mission unique

Raccorder uniquement la branche avec profil Progression actif de
`dungeonRpgLevelFromXp(xp)` à :

`GensProgressionV1.levelFromXp(v,p)`.

Le propriétaire historique doit conserver :
- `activeProg()` ;
- `Math.max(0, Number(xp) || 0)` ;
- la branche sans profil ;
- `loadDungeonRpgRules().xpPerLevel`.

Le Core pur reste byte-identique.

### TDD obligatoire — prochaine action

Avant toute modification runtime :
1. ajouter la sentinelle de raccord ;
2. la brancher à Architecture ;
3. observer le RED attendu sur l'absence du raccord réel ;
4. vérifier que les étapes antérieures sont GREEN ;
5. seulement ensuite modifier le vrai propriétaire.

La sentinelle doit prouver :
- appel Core sur la branche profil ;
- zéro appel Core sur la branche no-profile ;
- 140 cas configurés en parité ;
- legacy `xpPerLevel=25`, 50 XP -> niveau 3 ;
- legacy `xpPerLevel=25`, 2500 XP -> niveau 101 ;
- chargement Core avant Core 0.44 ;
- aucun autre seam Progression raccordé.

Document :
`docs/GENSRPG_PHASE4_PROGRESSION_XP_FIRST_RACCORD.md`.

### TDD RED observé

SHA :
`8a5a674b6574e104300c6f4346d6a3f6833ea88c`.

- Architecture `35710641838` — **FAILURE attendu** uniquement à la nouvelle étape
  `Raccorder le premier calcul XP niveau au Core Progression` ;
- Firefox `35710641580` — SUCCESS ;
- Tactical Dock `35710641684` — SUCCESS.

Les sentinelles Progression antérieures passent avant ce RED.
Aucun runtime n'a été modifié.

Cause attendue :
- Core Progression encore inert dans la composition source ;
- branche profil de `dungeonRpgLevelFromXp` encore calculée localement.

### Prochaine action immédiate

Appliquer le micro-raccord au vrai propriétaire, sans toucher aux seams différés.
La règle 26 s'applique avant toute modification du gros `index.html`.

### Source exacte

`index.html` :
- 8 174 648 octets ;
- blob `2d7677950f04e9a3290ff0062e157a126123891d`.

Core Progression :
- blob `b02487346f1a0df12effbc4559b5063bf8e12726`.

Si le gros HTML doit être modifié et qu'aucune copie exacte n'est disponible,
appliquer immédiatement la règle 26 de la charte.

### Interdictions

- aucun `dungeonRpgXpIntoLevel` ;
- aucun `dungeonRpgEarnedSkillPoints` ;
- aucune synchronisation héros / XP manuel / récompense / level-up / popup ;
- aucun changement Core Progression ;
- aucun wrapper / observer / timer / retry / fallback concurrent ;
- aucun changement Stats / Inventory / Storage / Dice / Tactical ;
- aucun changement sur `main`.

## CLÔTURE CONDITIONNELLE — Phase 4 Core Progression / XP — pré-audit premier raccord — 2026-09-22

Ce bloc devient le point de reprise prioritaire. Les sections suivantes sont historiques.

- Branche :
  `work/gensrpg-phase4-progression-xp-first-raccord-preaudit-2026-09-22`.
- Checkpoint de départ :
  `checkpoint/gensrpg-start-phase4-progression-xp-first-raccord-preaudit-2026-09-22`.
- Base exacte :
  `4a1c63dd2558343dde27966320238d1655fb4406`.
- Checkpoint GREEN de départ :
  `checkpoint/gensrpg-phase4-progression-xp-contract-green-2026-09-22`.
- Checkpoint GREEN cible :
  `checkpoint/gensrpg-phase4-progression-xp-first-raccord-preaudit-green-2026-09-22`.
- Production gelée :
  `main = e8681f9823573ced8aec59c8ddc47a72b02bc663`, V16.78.114.11.

### Résultat du pré-audit

Aucun runtime n'a été modifié.

Sentinelle :
`tests/gens_phase4_progression_xp_first_raccord_preaudit_v1.test.cjs`.

Document :
`docs/GENSRPG_PHASE4_PROGRESSION_XP_FIRST_RACCORD_PREAUDIT.md`.

Le propriétaire actif reste :
`dungeonCore044HeroProgression -> dungeonRpgLevelFromXp`.

La branche avec profil Progression actif est en parité exacte avec
`GensProgressionV1.levelFromXp(xp,profile)` :
- 5 profils ;
- 28 valeurs XP ;
- 140 comparaisons exactes ;
- linéaire/custom/coercions/maxLevel/seuils manquants ou invalides couverts.

La branche historique sans profil est volontairement différente :
- elle lit `loadDungeonRpgRules().xpPerLevel` ;
- elle ne possède pas le même cap `maxLevel=100` du Core pur.

Preuves verrouillées :
- `xpPerLevel=25`, 50 XP : legacy = niveau 3, Core naïf = niveau 6 ;
- `xpPerLevel=25`, 2500 XP : legacy = niveau 101, Core avec ses défauts = niveau 100.

### Futur raccord minimal sélectionné

Le futur lot TDD doit conserver dans `dungeonRpgLevelFromXp` :
1. `activeProg()` ;
2. `Math.max(0, Number(xp) || 0)` ;
3. la branche no-profile utilisant `loadDungeonRpgRules().xpPerLevel`.

Uniquement lorsque le profil Progression existe, déléguer à :

`GensProgressionV1.levelFromXp(v,p)`.

Restent explicitement différés :
- `dungeonRpgXpIntoLevel` ;
- `dungeonRpgEarnedSkillPoints` ;
- `dungeonSyncProgressionForState` ;
- XP manuel ;
- XP combat / récompenses ;
- points dépensés ;
- level-up / restauration / popup / son / persistance.

### Sources protégées

- `index.html` : 8 174 648 octets, blob
  `2d7677950f04e9a3290ff0062e157a126123891d` ;
- Core Progression : blob
  `b02487346f1a0df12effbc4559b5063bf8e12726` ;
- service encore inert ;
- graphe production-reachable inchangé à 77 ;
- aucun changement Stats / Inventory / Storage / Dice / Tactical.

### Validation technique avant fermeture documentaire

SHA :
`8f6d2645e7201b66c05a082a262cf9e9d0e8441c`.

- Architecture + navigateur complet :
  `35705074875` — SUCCESS ;
- Firefox :
  `35705074718` — SUCCESS ;
- Tactical Dock :
  `35705074886` — SUCCESS.

### Validation finale obligatoire

La clôture documentaire change le SHA.

Avant création du checkpoint GREEN cible, le **même SHA documentaire final
exact** doit repasser :
1. Architecture + navigateur complet ;
2. Firefox ;
3. Tactical Dock.

Aucun runtime ne doit être modifié pendant cette validation.

### Prochaine action après GREEN

Ouvrir un nouveau lot homogène de raccord TDD de
`dungeonRpgLevelFromXp` depuis ce checkpoint.

Le RED doit être observé avant modification runtime et verrouiller la frontière
legacy ci-dessus. Ne raccorder aucun autre seam Progression dans ce lot.
Aucun merge sur `main`.

## Chantier courant prioritaire — Phase 4 Core Progression / XP — pré-audit premier raccord — 2026-09-22

Ce bloc devient le point de reprise actif. Les sections suivantes sont historiques.

- Branche :
  `work/gensrpg-phase4-progression-xp-first-raccord-preaudit-2026-09-22`.
- Checkpoint de départ :
  `checkpoint/gensrpg-start-phase4-progression-xp-first-raccord-preaudit-2026-09-22`.
- Base exacte :
  `4a1c63dd2558343dde27966320238d1655fb4406`.
- Dernier checkpoint GREEN :
  `checkpoint/gensrpg-phase4-progression-xp-contract-green-2026-09-22`.
- Production gelée :
  `main = e8681f9823573ced8aec59c8ddc47a72b02bc663`, V16.78.114.11.

### Mission unique

Pré-auditer le **premier raccord Core Progression** sans modifier le runtime.

Candidat unique à caractériser :
`dungeonCore044HeroProgression -> dungeonRpgLevelFromXp`.

Comparer exactement :
- branche avec profil progression actif ;
- branche historique sans profil progression ;
- normalisation XP ;
- courbe linéaire ;
- courbe custom ;
- `maxLevel` ;
- fallback seuil custom absent/invalide ;
- ordre de chargement requis du futur Core.

### État de départ

Service pur GREEN :
`assets/gensrpg/core/progression-v1.js`
blob `b02487346f1a0df12effbc4559b5063bf8e12726`.

API :
`GensProgressionV1.levelFromXp(xp, progressionConfig)`.

Le service est actuellement Phase 4 inert :
- non chargé par `index.html` ;
- non injecté par preview/Pages ;
- hors graphe production ;
- 77 fichiers production-reachable.

`index.html` reste inchangé :
- taille `8 174 648` octets ;
- blob `2d7677950f04e9a3290ff0062e157a126123891d`.

La reconstruction locale déjà vérifiée de ce blob reste valide pour l'inspection :
aucun lot depuis le raccord Dice n'a modifié `index.html`.

### Périmètre strict

Autorisé :
- audit documentaire ;
- sentinelle de parité premier raccord ;
- comparaison du vrai helper inline avec le service pur ;
- identification de la frontière de compatibilité minimale ;
- sélection explicite d'un seul futur raccord.

Interdit :
- modifier `index.html` ;
- charger `progression-v1.js` en production ;
- modifier `progression-v1.js` ;
- modifier `dungeonRpgXpIntoLevel` ;
- modifier `dungeonRpgEarnedSkillPoints` ;
- modifier synchronisation héros / XP manuel / récompenses / level-up ;
- modifier service worker / preview / Pages ;
- ajouter wrapper, observer, timer, retry ou fallback ;
- modifier `main`.

### Questions à résoudre

1. La branche **profil actif** est-elle en parité exacte avec
   `GensProgressionV1.levelFromXp` ?
2. La branche **sans profil** peut-elle être déléguée sans changer son contrat
   historique `loadDungeonRpgRules().xpPerLevel` et son absence de cap explicite ?
3. Quelle normalisation doit rester à la frontière historique ?
4. Quel ordre de chargement exact sera requis pour un futur raccord ?
5. Le futur lot peut-il rester limité à un seul helper sans toucher aux autres
   responsabilités Progression ?

### Tests / preuves attendues

- propriétaire inline exact et callsites ;
- matrice parité profil actif / Core ;
- caractérisation explicite de la branche sans profil ;
- preuve qu'une délégation naïve `Core(xp,{})` serait ou non compatible ;
- Core service byte-identique ;
- aucun changement runtime ;
- Architecture + navigateur complet ;
- Firefox ;
- Tactical Dock.

### Prochaine action

Créer la sentinelle de pré-audit et sélectionner le raccord minimal uniquement
après preuve de parité.

## CLÔTURE CONDITIONNELLE — Phase 4 Core Progression / XP — contrat pur XP -> niveau — 2026-09-22

Ce bloc devient le point de reprise prioritaire. Les sections suivantes sont historiques.

- Branche :
  `work/gensrpg-phase4-progression-xp-contract-clean-2026-09-22`.
- Base exacte :
  `79ca6dca0df93abd40c8443fad8fcfc9c6cc4c28`.
- Checkpoint GREEN de départ :
  `checkpoint/gensrpg-phase4-progression-xp-preaudit-final-green-2026-09-22`.
- Checkpoint de départ :
  `checkpoint/gensrpg-start-phase4-progression-xp-contract-clean-2026-09-22`.
- Checkpoint GREEN cible :
  `checkpoint/gensrpg-phase4-progression-xp-contract-green-2026-09-22`.
- Production gelée :
  `main = e8681f9823573ced8aec59c8ddc47a72b02bc663`, V16.78.114.11.

### TDD / RED

Sentinelle :
`tests/gens_phase4_progression_xp_contract_v1.test.cjs`.

RED :
- commit `eef99bd5549a2729a8d08fb6d2fec8938aa6ff29` ;
- Architecture `35703064109` — FAILURE attendue ;
- échec exact sur
  `Verrouiller le contrat pur Core Progression XP Phase 4` ;
- le service Core n'existait pas encore.

### Service pur créé

Fichier :
`assets/gensrpg/core/progression-v1.js`.

Commit :
`9691d83e5fbf18fe37a7328f07f828675f598372`.

Blob :
`b02487346f1a0df12effbc4559b5063bf8e12726`.

API unique :
`GensProgressionV1.levelFromXp(xp, progressionConfig)`.

Contrat conservé :
- normalisation XP historique ;
- courbe linéaire configurable ;
- courbe custom configurable ;
- `maxLevel` ;
- fallback historique seuil custom absent/invalide :
  `(level - 1) * xpPerLevel`.

Aucun profil actif, DOM, stockage, popup, son, timer, observer, listener, RNG,
héros courant ou mutation d'état dans le service.

### Cartographie

Le service est classé **Phase 4 inert** :
- 95 fichiers JS physiques ;
- 15 services Phase 4 ;
- 3 services Phase 4 inert ;
- graphe production-reachable inchangé : 77.

Commit d'alignement :
`c9819d693318459016f0a50cdf75391976b27754`.

`index.html` reste byte-identique :
`2d7677950f04e9a3290ff0062e157a126123891d`.

Aucun chargement dans source index / preview / Pages / bootstrap.

### Correction de sentinelle

La sentinelle avait initialement une mauvaise attente sur un seuil custom invalide
au niveau 5. Le legacy retombe à `(5-1)*10 = 40`, pas 50.

Le test a été corrigé pour reproduire le legacy exact ; le service n'a pas été
modifié.

SHA technique GREEN :
`ff91dac9f5d2285ec12f059107dd822d97d126d4`.

### Validation technique GREEN

Sur ce même SHA :
- Architecture + navigateur complet :
  `35703389599` — SUCCESS ;
- Firefox :
  `35703389466` — SUCCESS ;
- Tactical Dock :
  `35703389639` — SUCCESS.

### Frontières toujours différées

- `dungeonRpgXpIntoLevel` ;
- `dungeonRpgEarnedSkillPoints` ;
- `dungeonSyncProgressionForState` ;
- `changeXP` ;
- partage XP / récompenses / persistance ;
- `dungeonHandleLevelUp071` et popup/restauration level-up ;
- `progression-runtime-v1.js` reste hors production.

Les deux retours utilisateur restent eux aussi séparés :
- détection ennemie tardive / LOS ;
- confusion visuelle Stats d'Aldren.

### Suite après GREEN

Ouvrir un lot séparé de **pré-audit du premier raccord Core Progression**.
Ne pas connecter automatiquement d'autres seams Progression.

### Validation finale obligatoire

La documentation de clôture change le SHA.
Avant checkpoint GREEN, il faut trois SUCCESS sur le **même SHA documentaire final exact** :
1. Architecture + navigateur complet ;
2. Firefox ;
3. Tactical Dock.

## Chantier courant prioritaire — Phase 4 Core Progression / XP — contrat pur XP -> niveau — 2026-09-22

Ce bloc est le point de reprise actif ; les sections suivantes sont historiques.

- Branche :
  `work/gensrpg-phase4-progression-xp-contract-clean-2026-09-22`.
- Checkpoint de départ :
  `checkpoint/gensrpg-start-phase4-progression-xp-contract-clean-2026-09-22`.
- Base exacte :
  `79ca6dca0df93abd40c8443fad8fcfc9c6cc4c28`.
- Dernier checkpoint GREEN :
  `checkpoint/gensrpg-phase4-progression-xp-preaudit-final-green-2026-09-22`.
- Production gelée :
  `main = e8681f9823573ced8aec59c8ddc47a72b02bc663`, V16.78.114.11.

### Correction de reprise

Des noms de chantier Progression/XP existaient déjà avant cette reprise, mais leur
checkpoint de départ pointait trois commits avant le GREEN final et leur branche
avait divergé.

Ils ne sont pas réutilisés ni déplacés. Le présent lot `*-clean-*` repart du
vrai checkpoint GREEN final `79ca6dca...`.

### Mission unique

Créer uniquement le **contrat pur Core Progression XP -> niveau**.

Forme cible :

`levelFromXp(xp, progressionConfig)`.

Aucun consommateur runtime ne sera raccordé dans ce lot.

### Propriétaire historique à reproduire

Autorité runtime actuelle :

`dungeonCore044HeroProgression -> dungeonRpgLevelFromXp`.

Le contrat pur doit reproduire exactement les règles déjà caractérisées :
- normalisation XP historique ;
- mode `linear` via `xpPerLevel` ;
- mode `custom` via `xpThresholds` ;
- `maxLevel` ;
- fallback historique d'un seuil custom absent vers
  `(level - 1) * xpPerLevel` ;
- aucune décision de mutation, récompense ou UI.

Le service reçoit une configuration explicite : il ne lit ni profil actif, ni
`loadDungeonRpgRules()`, ni globals runtime.

### Périmètre strict

Autorisé :
- nouveau fichier pur `assets/gensrpg/core/progression-v1.js` ;
- sentinelle de contrat pur ;
- alignement de cartographie Phase 2 pour classer le nouveau service comme
  **Phase 4 inert** ;
- documentation / CI.

Interdit :
- modifier `index.html` ;
- charger le nouveau service en production ;
- raccorder `dungeonRpgLevelFromXp` ;
- modifier `dungeonRpgXpIntoLevel` ou `dungeonRpgEarnedSkillPoints` ;
- modifier `dungeonSyncProgressionForState` ;
- modifier `changeXP` ;
- modifier récompenses, partage XP, persistance ou popup level-up ;
- modifier `progression-runtime-v1.js` ;
- ajouter wrapper, observer, timer, retry ou fallback ;
- modifier Stats / Inventory / Dice / Storage / Tactical ;
- modifier `main`.

### TDD obligatoire

1. créer une sentinelle exigeant le service pur et son API ;
2. observer un RED avant création du service ;
3. créer le service minimal ;
4. vérifier parité exacte sur courbes linéaires et custom ;
5. vérifier entrées non numériques / négatives selon la normalisation historique ;
6. vérifier `maxLevel` ;
7. vérifier fallback de seuil custom absent ;
8. prouver absence de DOM / storage / timers / observers / listeners / globals runtime ;
9. classer le service comme Phase 4 inert et hors graphe production ;
10. Architecture + navigateur complet, Firefox, Tactical Dock avant GREEN.

### Risques

- réinterpréter la courbe custom au lieu de reproduire le legacy ;
- rendre le Core dépendant du profil actif ;
- inclure trop tôt points de talents / stat points ;
- connecter le service pendant le lot de contrat ;
- oublier de réaligner la cartographie physique des services Phase 4.

### Prochaine action

Créer la sentinelle de contrat et obtenir un RED exact avant tout nouveau fichier
runtime Core.

## CLÔTURE CONDITIONNELLE — Phase 4 Core Progression / XP — pré-audit — 2026-09-22

Ce bloc devient le point de reprise prioritaire. Les sections suivantes sont historiques.

- Branche :
  `work/gensrpg-phase4-progression-xp-preaudit-2026-09-22`.
- Base exacte :
  `0ce2451da078cceb90c0431a3735932dbd41f945`.
- Checkpoint GREEN de départ :
  `checkpoint/gensrpg-phase4-dice-d10048-raccord-green-2026-09-22`.
- Checkpoint de départ du lot :
  `checkpoint/gensrpg-start-phase4-progression-xp-preaudit-2026-09-22`.
- Checkpoint GREEN cible :
  `checkpoint/gensrpg-phase4-progression-xp-preaudit-final-green-2026-09-22`.
- Production gelée :
  `main = e8681f9823573ced8aec59c8ddc47a72b02bc663`, V16.78.114.11, inchangée.

### Résultat du pré-audit

Aucun runtime n'a été modifié.

Le propriétaire actif du calcul XP -> niveau est :

`dungeonCore044HeroProgression -> dungeonRpgLevelFromXp`.

Le calcul actif est déjà piloté par les données :
- XP normalisée à partir de l'entrée ;
- `xpCurveMode` ;
- `xpPerLevel` ;
- `xpThresholds` ;
- `maxLevel` ;
- fallback vers les règles Dungeon historiques en absence de profil progression.

La sentinelle exécute le vrai propriétaire Core 0.44 et confirme la priorité des
valeurs personnalisées sur les défauts, en courbe linéaire et personnalisée.

### Frontières caractérisées

Restent hors du premier service pur :

- `dungeonRpgXpIntoLevel` : calcul adjacent, séparé ;
- `dungeonRpgEarnedSkillPoints` : points gagnés, calcul métier distinct ;
- `dungeonSyncProgressionForState` : mutation de
  `rpgLevel / skillPoints / statPoints` ;
- `changeXP` : mutation XP + persistance + son + rendu ;
- `awardDungeonDefeatXp` : partage groupe + synchronisation + persistance ;
- `dungeonRecordCombatReward` : agrégation kills / XP / drops ;
- `dungeonHandleLevelUp071` : dernier propriétaire
  `dungeonCore312TurnAndPopupFixes`, avec restauration, persistance,
  file de popups et scheduling ;
- `gens-stat-upgrade-policy-167898.js` : dépense de points, UI et retry.

### Module progression-runtime-v1.js

`assets/gensrpg/dungeon/progression-runtime-v1.js` est confirmé hors graphe
production :
- statut Phase 2 `tests-docs-only` ;
- absent de l'index, preview, Pages et service worker ;
- il wrappe `changeXP` et redélègue les formules au monolithe.

Il ne doit pas devenir le Core Progression par simple reconnexion.

### Premier micro-lot recommandé après GREEN

Créer **un contrat pur Core Progression XP -> niveau**, sans raccord runtime.

Forme conceptuelle :

`levelFromXp(xp, progressionConfig)`.

Le futur contrat doit reproduire exactement :
- courbe linéaire ;
- courbe personnalisée ;
- `maxLevel` ;
- fallback historique d'un seuil custom absent ;
- normalisation d'entrée ;
- priorité des valeurs configurées.

Il ne doit posséder ni héros courant, récompense, mutation, stockage, UI, popup,
son, timer ou module de jeu.

Le raccord de Core 0.44 au futur service devra rester un lot ultérieur distinct
avec TDD RED.

### Source index vérifiée

Le fichier utilisateur `work_10.zip` a été réutilisé uniquement après
reconstruction du micro-diff GREEN `d10048`.

La copie reconstruite correspond exactement au checkpoint de départ courant :
- taille : `8 174 648` octets ;
- blob Git : `2d7677950f04e9a3290ff0062e157a126123891d`.

### Validation technique GREEN

SHA technique :

`024c17a6a67bf6fcd8756b0eeb3cc1c5800b94a0`.

Sur ce même SHA :
- Architecture + navigateur complet :
  `35696729085` — SUCCESS ;
- Firefox :
  `35696729032` — SUCCESS ;
- Tactical Dock :
  `35696729130` — SUCCESS.

Le diff depuis le checkpoint GREEN Dice ne contient aucun fichier runtime.

### Retour de test manuel utilisateur — différé hors lot

Le test manuel du checkpoint Dice `d10048` est globalement correct.

Deux signaux distincts sont conservés, sans correction dans ce pré-audit :

1. **Détection ennemis** :
   un ennemi ne repère plus immédiatement un héros lorsqu'il entre à portée.
   À traiter dans un lot Dungeon mouvement -> détection / LOS avec reproduction
   ciblée et propriétaire exact, sans mélange avec Progression.

2. **Aldren / affichage Stats** :
   confusion visuelle observée sur certaines statistiques d'Aldren.
   À traiter dans un lot fiche RPG / rendu Stats en distinguant calcul canonique
   et présentation.

Ces deux points ne sont pas attribués au lot Progression actuel : aucun runtime
n'y a été modifié.

### Correction de gouvernance checkpoint

Un checkpoint nommé
`checkpoint/gensrpg-phase4-progression-xp-preaudit-green-2026-09-22`
a été créé prématurément un commit avant le SHA documentaire final validé.

Conformément à la règle de non-réutilisation des noms de checkpoint, il n'est pas
déplacé ni réécrit. Le checkpoint définitif du lot sera donc :

`checkpoint/gensrpg-phase4-progression-xp-preaudit-final-green-2026-09-22`.

Il devra pointer exactement sur le SHA documentaire final qui passe les trois
batteries.

### Validation finale sur le SHA documentaire candidat

SHA documentaire candidat :
`5303d13372b73fcb827b6ef8df5b8a2350a4d6c8`.

Sur ce même SHA :
- Architecture + navigateur complet :
  `35700145785` — SUCCESS ;
- Firefox :
  `35700145805` — SUCCESS ;
- Tactical Dock :
  `35700145915` — SUCCESS.

Cette inscription des preuves modifie à nouveau le SHA documentaire.
Le checkpoint GREEN définitif ne doit donc être créé qu'après une dernière
revalidation des trois batteries sur le **nouveau SHA exact de cette clôture**.

## Chantier courant prioritaire — Phase 4 Core Progression / XP — pré-audit — 2026-09-22

Ce bloc est le point de reprise actif ; les sections suivantes sont historiques.

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

### Position roadmap

Phase 4 suit l'ordre :
Assets -> Storage -> Stats -> Inventory/Equipment -> Dice -> **Progression/XP** ->
bus d'événements/utilitaires communs.

Le sous-chantier Dice est arrêté sur son checkpoint GREEN actuel. Aucun troisième
seam Dice n'est raccordé automatiquement.

### Mission unique

Pré-auditer les autorités Progression / XP réellement actives afin de définir le
premier micro-lot Core Progression sans changement de gameplay.

Le lot doit notamment caractériser :

- `dungeonRpgLevelFromXp` ;
- `dungeonSyncProgressionForState` ;
- `changeXP` et le chemin XP manuel ;
- `awardDungeonDefeatXp` ;
- `dungeonRecordCombatReward` et les récompenses de victoire ;
- `dungeonHandleLevelUp071` et la file de popups de niveau ;
- les écritures de `rpgLevel`, `statPoints`, `skillPoints` ;
- le rôle réel de
  `assets/gensrpg/dungeon/progression-runtime-v1.js` ;
- les frontières entre calcul pur, mutation d'état, persistance, UI et récompenses.

### État déjà connu à vérifier, pas à supposer

Des sentinelles historiques existent déjà pour :
- progression native / récompenses ;
- autorités exactes victoire/progression ;
- XP manuel et points de caractéristiques ;
- contrat `progression-runtime-v1.js`.

Le fichier `progression-runtime-v1.js` existe, mais son commentaire indique qu'il
ne possède qu'un seam d'action XP manuel et que les formules restent dans le
monolithe. Le pré-audit doit prouver son statut réel dans le graphe de production
avant toute décision.

### Source index exacte

Le dernier fichier utilisateur `work_10.zip` correspondait au GREEN précédent :
- taille `8 174 637` octets ;
- blob `5b8e790fefe7970a250fd9485ee80549511737e6`.

Le seul micro-diff runtime ultérieur, le raccord GREEN `d10048`, a été rejoué
localement à partir de cette copie avec le diff exact validé.

La reconstruction obtenue correspond **exactement** au checkpoint GREEN courant :
- taille `8 174 648` octets ;
- blob Git `2d7677950f04e9a3290ff0062e157a126123891d`.

Cette reconstruction vérifiée est l'autorité locale d'inspection de l'index pour
ce pré-audit. Aucun nouveau téléchargement n'est nécessaire tant que
`index.html` ne change pas.

### Périmètre strict

Autorisé :
- audit documentaire ;
- nouvelle sentinelle de caractérisation ;
- inventaire définitions/callsites/writers ;
- analyse des frontières de responsabilité ;
- comparaison avec les tests et modules existants ;
- sélection d'un seul premier candidat ou conclusion qu'aucun raccord n'est sûr.

Interdit :
- modifier `index.html` ;
- modifier `progression-runtime-v1.js` ;
- modifier formules XP/niveau/points ;
- modifier récompenses, loot ou victoire ;
- modifier persistance ;
- modifier UI/popups de niveau ;
- modifier Stats / Inventory / Dice / Tactical / Storage ;
- ajouter wrapper, observer, timer, retry ou fallback ;
- modifier `main`.

### Systèmes protégés

- checkpoint GREEN Dice `0ce2451d...` ;
- Core Dice et raccords existants ;
- Core Stats / Inventory / Storage ;
- Tactical V114.11 ;
- Survie / Capture / PvP ;
- Save & Quit / reprise ;
- récompenses et progression Dungeon actuelles.

### Tests / preuves attendues

1. inventaire exact des autorités Progression et de leurs callsites ;
2. séparation calcul pur / mutation / persistance / UI / récompenses ;
3. statut production-reachable ou inert du module externe Progression V1 ;
4. identification des doubles propriétaires éventuels ;
5. test des valeurs configurables `xpPerLevel`, `statPointsPerLevel`, etc. ;
6. aucun changement de formule ni de résultat ;
7. sélection explicite du premier micro-lot Progression ;
8. Architecture + navigateur complet, Firefox et Tactical Dock avant GREEN.

### Prochaine action

Construire la sentinelle de pré-audit à partir de l'index GREEN exact reconstruit
et des tests historiques existants, sans modification runtime.

### Retour utilisateur du test manuel du checkpoint Dice GREEN

Test manuel utilisateur du lien de preview du checkpoint
`checkpoint/gensrpg-phase4-dice-d10048-raccord-green-2026-09-22` :

- comportement global : **correct à ce stade** ;
- anomalie 1 : un ennemi ne repère pas toujours immédiatement un héros pourtant
  à portée ;
- anomalie 2 : sur Aldren, une petite confusion visuelle reste visible autour des
  statistiques.

Décision de coordination :
- ne pas mélanger ces deux points avec le pré-audit Progression/XP ;
- la détection ennemie / ligne de vue après déplacement est une dette déjà
  documentée dans les lots antérieurs et reste un futur lot gameplay dédié ;
- la confusion visuelle de stats d'Aldren est enregistrée comme dette UI à
  caractériser séparément, sans modifier Stats tant que le writer/renderer fautif
  n'est pas prouvé ;
- aucune rustine, aucun changement runtime ou Tactical n'est autorisé dans le lot
  Progression courant pour ces deux symptômes.

## CLÔTURE CONDITIONNELLE — Phase 4 Core Dice — raccord d10048 — 2026-09-22

Ce bloc devient le point de reprise prioritaire. Les sections suivantes sont historiques.

- Branche :
  `work/gensrpg-phase4-dice-d10048-raccord-2026-09-22`.
- Base exacte :
  `ddce78deb72169e2aac7280da86049d40e774fab`.
- Checkpoint GREEN de départ :
  `checkpoint/gensrpg-phase4-dice-next-raccord-preaudit-green-2026-09-22`.
- Checkpoint de départ du lot :
  `checkpoint/gensrpg-start-phase4-dice-d10048-raccord-2026-09-22`.
- Checkpoint GREEN cible :
  `checkpoint/gensrpg-phase4-dice-d10048-raccord-green-2026-09-22`.
- Production gelée :
  `main = e8681f9823573ced8aec59c8ddc47a72b02bc663`, V16.78.114.11, inchangée.

### TDD / RED prouvé

Le raccord a été précédé d'un RED réel :

- SHA sentinelle :
  `93f0a79713e526c6e4e165ab35a78ff275f36e85` ;
- Architecture :
  `35692554405` — FAILURE attendue ;
- étape :
  `Verrouiller le raccord d10048 Core Dice Phase 4` ;
- échec obtenu sur le corps legacy avant toute délégation Core.

### Raccord réalisé

Commit runtime :

`b8307bc09ff737d3c878cf447be15063c354ff3a`
— `refactor: route d10048 through Core Dice`.

Le seul changement runtime est le corps de `d10048(chance)` :

- normalisation historique conservée :
  `Math.round(Number(chance)||50)`, clamp `5..95` ;
- formule locale `101 - chance` retirée ;
- D100 local `Math.random()*100` retiré du helper ;
- délégation à
  `GensDiceV1.rollChanceHigh(c,{min:5,max:95})` ;
- surface legacy conservée :
  `{chance,threshold,roll,ok}` ;
- un seul tirage RNG, même mapping vers `1..100`.

Les quatre consommateurs sont inchangés :

- `dc047StealthPrompt` ;
- `dc048TrapDetectRoll` ;
- `dc048TrapActionRoll` ;
- `dc048TrapTrigger`.

Nouvel `index.html` :

- taille : `8 174 648` octets ;
- blob Git :
  `2d7677950f04e9a3290ff0062e157a126123891d`.

### Gardes historiques réalignées

Les sentinelles et manifestes qui verrouillaient uniquement l'ancienne empreinte
de l'index ont été réalignés sur la nouvelle taille/blob sans changement de leur
sémantique.

Le premier raccord `d100ThresholdFromChance` reste protégé :
- 15 consommateurs inchangés ;
- sa frontière legacy et sa délégation Core restent inchangées ;
- son ancien inventaire RNG a été ajusté uniquement pour refléter le retrait
  approuvé d'un D100 direct dans `d10048`.

Le pré-audit du prochain raccord a été réaligné pour caractériser `d10048`
comme désormais connecté au Core, tout en gardant les autres seams différés.

Les workflows temporaires one-shot/probe/scan ont été retirés.

### Systèmes protégés

Toujours byte-identiques :

- Core Dice :
  `assets/gensrpg/core/dice-v1.js`
  blob `1813b6edb1ac69317d158e8cac6eb5c8ac353855` ;
- Tactical V114.11 :
  `assets/gensrpg/gens-rpg-tactical-visual-dice-16781142.js`
  blob `3e7e92eea89fd8e949361162636b4b524ff93eef` ;
- Mobile Combat Performance :
  `assets/gensrpg/gens-mobile-combat-performance-16781022.js`
  blob `e8fd9f1049a6597118eb026976bca7548f11b284`.

Toujours différés et non modifiés :

- `dungeonUniversalTest` ;
- `showSpecialD6Roll` ;
- `rollDungeonRpDice073` ;
- `dc051RollStatChallenge` ;
- conventions low-roll puzzle/piège ;
- initiative configurable ;
- Tactical et son RNG seedé.

Aucun wrapper, observer, timer, retry ou fallback n'a été ajouté.
Aucune règle, chance, clamp ou probabilité n'a été modifiée.

### Validation technique GREEN

SHA technique validé :

`062989ae85252cec37924f4e5ad1aba7930631e6`.

Runs sur ce même SHA :

- Architecture + navigateur complet :
  `35693297405` — SUCCESS ;
- Firefox :
  `35693297413` — SUCCESS ;
- Tactical Dock :
  `35693297412` — SUCCESS.

Le navigateur complet valide notamment :
Survie, Dungeon après Survie, Builder, Config objet, fiche RPG, authored
cache/pièges, Save & Quit/reprise, PvP, Capture, non-interférence quatre modules,
murs, preview, assets et Equipment.

### Validation finale obligatoire avant checkpoint

La suppression du workflow de diagnostic et cette clôture documentaire changent
le SHA.

Le checkpoint GREEN cible ne doit être créé qu'après trois SUCCESS sur le
**même SHA documentaire final exact** :

1. Architecture + navigateur complet ;
2. Firefox ;
3. Tactical Dock.

Après GREEN, ne pas enchaîner automatiquement sur un autre seam Dice.
Le prochain raccord éventuel doit repartir d'un nouveau pré-audit / micro-lot
séparé conformément à la charte.

## ÉTAT TECHNIQUE — Phase 4 Core Dice — raccord d10048 — 2026-09-22

Ce bloc devient le point de reprise prioritaire avant validation globale.

- Branche :
  `work/gensrpg-phase4-dice-d10048-raccord-2026-09-22`.
- Base GREEN :
  `ddce78deb72169e2aac7280da86049d40e774fab`.
- Checkpoint de départ :
  `checkpoint/gensrpg-start-phase4-dice-d10048-raccord-2026-09-22`.
- Production `main` reste gelée sur
  `e8681f9823573ced8aec59c8ddc47a72b02bc663`.

### TDD observé

RED valide avant modification runtime :

- SHA sentinelle :
  `93f0a79713e526c6e4e165ab35a78ff275f36e85` ;
- run Architecture :
  `35692554405` — FAILURE attendue ;
- étape :
  `Verrouiller le raccord d10048 Core Dice Phase 4` ;
- échec sur l'ancien corps legacy de `d10048`, avant toute délégation Core ;
- pré-audits Dice et premier raccord `d100ThresholdFromChance` toujours SUCCESS.

### Raccord runtime réalisé

Commit runtime :
`b8307bc09ff737d3c878cf447be15063c354ff3a`
— `refactor: route d10048 through Core Dice`.

Seul le corps de `d10048(chance)` a changé :

- conservation de
  `Math.round(Number(chance)||50)` puis clamp `5..95` ;
- suppression du seuil local `101 - chance` ;
- suppression du D100 local `Math.random()*100` ;
- délégation à
  `GensDiceV1.rollChanceHigh(c,{min:5,max:95})` ;
- projection vers la forme legacy
  `{chance,threshold,roll,ok}`.

Les quatre consommateurs restent inchangés :
`dc047StealthPrompt`,
`dc048TrapDetectRoll`,
`dc048TrapActionRoll`,
`dc048TrapTrigger`.

Nouvel `index.html` :
- taille : `8 174 648` octets ;
- blob Git :
  `2d7677950f04e9a3290ff0062e157a126123891d`.

Le patch a été appliqué par workflow one-shot avec assertions strictes du blob
avant/après, puis ce workflow s'est supprimé.

### Réalignement des gardes historiques

Les sentinelles historiques qui verrouillaient l'ancien blob/taille ont été
réalignées uniquement sur la nouvelle empreinte, sans changement de leurs
sémantiques.

Commit d'alignement :
`3ed644a0371d51878739be62c087f65f7a37c9c2`
— `test: realign historical guards after d10048 raccord`.

Les workflows temporaires de probe/alignement sont supprimés.

### Invariants toujours protégés

- `assets/gensrpg/core/dice-v1.js` byte-identique ;
- premier raccord `d100ThresholdFromChance` inchangé ;
- 15 consommateurs du premier seam inchangés ;
- Tactical / RNG seedé Tactical inchangés ;
- Mobile Combat Performance inchangé ;
- `dungeonUniversalTest`, D6 UI, RP Dice composite,
  `dc051RollStatChallenge`, low-roll puzzle/piège et initiative restent différés ;
- aucun wrapper, observer, timer, retry ou fallback ajouté ;
- aucun changement de règle, clamp ou probabilité ;
- aucun merge sur `main`.

### Validation globale maintenant requise

Exécuter sur le même SHA déclenché après ce bloc :
1. Architecture + navigateur complet ;
2. Firefox ;
3. Tactical Dock.

Ne créer le checkpoint GREEN final qu'après trois SUCCESS sur le SHA documentaire
final exact.

## Chantier courant prioritaire — Phase 4 Core Dice — raccord d10048 — 2026-09-22

Ce bloc est le point de reprise actif ; les sections suivantes sont historiques.

- Branche :
  `work/gensrpg-phase4-dice-d10048-raccord-2026-09-22`.
- Checkpoint de départ :
  `checkpoint/gensrpg-start-phase4-dice-d10048-raccord-2026-09-22`.
- Base exacte :
  `ddce78deb72169e2aac7280da86049d40e774fab`.
- Dernier checkpoint GREEN :
  `checkpoint/gensrpg-phase4-dice-next-raccord-preaudit-green-2026-09-22`.
- Production gelée :
  `main = e8681f9823573ced8aec59c8ddc47a72b02bc663`, V16.78.114.11.

### Mission unique

Raccorder uniquement le helper historique `d10048(chance)` au service pur
`GensDiceV1.rollChanceHigh`.

Les quatre consommateurs historiques restent inchangés :
- `dc047StealthPrompt` ;
- `dc048TrapDetectRoll` ;
- `dc048TrapActionRoll` ;
- `dc048TrapTrigger`.

Aucun autre seam Dice n'est modifié dans ce lot.

### Source index autorisée

Le fichier utilisateur `work_10.zip` a été revérifié et correspond à l'index
du dernier état runtime GREEN :
- HTML : `index_work10.txt` ;
- taille : `8 174 637` octets ;
- blob Git : `5b8e790fefe7970a250fd9485ee80549511737e6`.

Le pré-audit `ddce78de...` n'a pas modifié `index.html`; cette copie reste donc
l'autorité locale pour ce raccord.

### TDD / RED obligatoire

Avant toute modification runtime, la nouvelle sentinelle doit exiger :

1. conservation exacte de la normalisation historique
   `Math.round(Number(chance)||50)`, clamp `5..95` ;
2. disparition du calcul local `101 - chance` dans `d10048` ;
3. disparition du générateur D100 local dans `d10048` ;
4. délégation à `GensDiceV1.rollChanceHigh(c,{min:5,max:95})` ;
5. conservation exacte de la forme legacy
   `{chance,threshold,roll,ok}` ;
6. un seul tirage RNG, même ordre et même mapping vers 1..100 ;
7. quatre consommateurs inchangés ;
8. premier raccord `d100ThresholdFromChance` inchangé ;
9. Tactical et son RNG seedé inchangés ;
10. aucun autre seam Dice, wrapper, observer, timer, retry ou fallback.

Le RED doit être observé et documenté avant toute modification de `index.html`.

### Systèmes protégés

- `assets/gensrpg/core/dice-v1.js` reste byte-identique ;
- `d100ThresholdFromChance` et ses 15 consommateurs restent inchangés ;
- `dungeonUniversalTest`, `showSpecialD6Roll`, `rollDungeonRpDice073`,
  `dc051RollStatChallenge`, puzzles/pièges low-roll et initiative restent différés ;
- aucun changement Tactical / Stats / Inventory / Storage / Progression ;
- aucun changement Survie / Capture / PvP ;
- aucun changement de règle, chance, clamp ou probabilité ;
- aucun merge sur `main`.

### Risques

- perdre le `Math.round` historique avant clamp ;
- modifier les coercions `undefined / NaN / ±Infinity` ;
- changer la forme `ok` en `success` chez les consommateurs ;
- consommer le RNG plus d'une fois ou dans un autre ordre ;
- raccorder par erreur `dc051RollStatChallenge` ou un autre D100 5..95.

### Tests requis avant GREEN

- nouvelle sentinelle dédiée au raccord `d10048` ;
- pré-audit du prochain raccord toujours GREEN ;
- test de parité déterministe legacy/Core avec RNG injecté ;
- hash des quatre consommateurs inchangé ;
- premier raccord Dice inchangé ;
- Core Dice / Tactical / Mobile Combat Performance byte-identiques ;
- Architecture + navigateur complet ;
- Firefox ;
- Tactical Dock ;
- inspection du diff contre `ddce78de...`.

### Prochaine action

Créer et exécuter la sentinelle TDD du raccord. Obtenir un RED exact avant toute
modification runtime.

## CLÔTURE CONDITIONNELLE — Phase 4 Core Dice — pré-audit prochain raccord — 2026-09-22

Ce bloc devient le point de reprise prioritaire. Les sections suivantes sont historiques.

- Branche :
  `work/gensrpg-phase4-dice-next-raccord-preaudit-2026-09-22`.
- Base exacte :
  `e19d479c5559da9215d4456b4ea62c05a9f8bbf6`.
- Checkpoint GREEN de départ :
  `checkpoint/gensrpg-phase4-dice-first-raccord-green-2026-09-22`.
- Checkpoint GREEN cible :
  `checkpoint/gensrpg-phase4-dice-next-raccord-preaudit-green-2026-09-22`.
- Production gelée :
  `main = e8681f9823573ced8aec59c8ddc47a72b02bc663`, V16.78.114.11, inchangée.

### Source exacte vérifiée

Le fichier utilisateur `work_10.zip` a été vérifié contre la base GREEN :

- `index_work10.txt` ;
- taille `8 174 637` octets ;
- blob Git `5b8e790fefe7970a250fd9485ee80549511737e6`.

Il correspond exactement au `index.html` de
`e19d479c5559da9215d4456b4ea62c05a9f8bbf6`.

### Résultat du pré-audit

Aucun runtime n'a été modifié.

Le prochain seam Core Dice recommandé est :

`d10048(chance)`.

État caractérisé :
- 1 définition ;
- 4 consommateurs :
  `dc047StealthPrompt`,
  `dc048TrapDetectRoll`,
  `dc048TrapActionRoll`,
  `dc048TrapTrigger` ;
- normalisation historique :
  `Math.round(Number(chance)||50)`, clamp `5..95` ;
- seuil `101 - chance` ;
- un seul D100 `1 + floor(Math.random()*100)` ;
- succès haut `roll >= threshold` ;
- forme résultat legacy `{chance,threshold,roll,ok}`.

Après conservation de la normalisation de frontière, la primitive
`GensDiceV1.rollChanceHigh(c,{min:5,max:95},rng)`
est en parité exacte sur la chance, le seuil, le tirage RNG et la réussite.

La matrice déterministe du pré-audit couvre 95 combinaisons incluant :
- valeurs finies et décimales ;
- coercions historiques ;
- 0 / vide / null / false ;
- undefined / NaN / ±Infinity ;
- cinq valeurs RNG représentatives.

Le service Core Dice ne nécessite aucune modification pour ce futur raccord.

### Seams explicitement différés

- `dungeonUniversalTest` :
  règles RPG + branche disabled + dé configurable + coercions + résultat legacy ;
- `showSpecialD6Roll` :
  propriétaire UI/animation/callback, pas un seam moteur pur ;
- `rollDungeonRpDice073` :
  UI composite arme/esquive/test de caractéristique ;
- `dc051RollStatChallenge` :
  normalisation 5..95 distincte sans arrondi explicite ;
- puzzle / détection pièges :
  convention `roll <= chance` non représentée par le contrat Core actuel ;
- `dungeonInitiativeScore` :
  définition sans consommateur actuel identifié.

Aucune uniformisation de ces conventions n'est autorisée dans le prochain lot.

### Sentinelle

Nouvelle sentinelle :
`tests/gens_phase4_dice_next_raccord_preaudit_v1.test.cjs`.

Elle verrouille :
- l'index GREEN exact ;
- le premier raccord `d100ThresholdFromChance` ;
- l'inventaire des candidats restants ;
- les conventions propres à chaque seam ;
- la parité déterministe de `d10048` avec Core Dice ;
- la sélection unique de `d10048`.

La première exécution a révélé uniquement une erreur de comptage de test sur deux
fonctions définies via `window.x=function`; aucune erreur runtime. La sentinelle a
été corrigée pour compter les identifiants réels.

SHA de la sentinelle corrigée :
`81852cbfde6e3a03be7dfdab60eb137e5293fdff`.

Architecture statique sur ce SHA : SUCCESS.
La fermeture finale doit néanmoins être revalidée après ce bloc documentaire.

### Futur micro-lot TDD après GREEN

Ne pas modifier le runtime dans ce pré-audit.

Après création du checkpoint GREEN uniquement, ouvrir un nouveau lot dédié
**uniquement** au raccord de `d10048`.

Le futur RED devra exiger :
1. conservation exacte de `Math.round(Number(chance)||50)` + clamp `5..95` ;
2. retrait du calcul local `101 - chance` et du D100 local dans `d10048` ;
3. délégation à `GensDiceV1.rollChanceHigh(c,{min:5,max:95})` ;
4. conservation de `{chance,threshold,roll,ok}` ;
5. un seul appel RNG, même ordre et mêmes bornes ;
6. quatre consommateurs inchangés ;
7. premier raccord `d100ThresholdFromChance` inchangé ;
8. Tactical / RNG seedé Tactical inchangés ;
9. aucun autre seam Dice ;
10. aucun wrapper, observer, timer, retry ou fallback.

### Validation finale obligatoire avant checkpoint

Ce bloc documentaire change le SHA.

Le checkpoint cible ne doit être créé qu'après SUCCESS sur le **même SHA final
exact** de :
1. Architecture + navigateur complet ;
2. Firefox ;
3. Tactical Dock.

## Chantier courant prioritaire — Phase 4 Core Dice — pré-audit prochain raccord — 2026-09-22

Ce bloc est le point de reprise actif ; les sections suivantes sont historiques.

- Branche :
  `work/gensrpg-phase4-dice-next-raccord-preaudit-2026-09-22`.
- Checkpoint de départ :
  `checkpoint/gensrpg-start-phase4-dice-next-raccord-preaudit-2026-09-22`.
- Base exacte :
  `e19d479c5559da9215d4456b4ea62c05a9f8bbf6`.
- Dernier checkpoint GREEN :
  `checkpoint/gensrpg-phase4-dice-first-raccord-green-2026-09-22`.
- Production gelée :
  `main = e8681f9823573ced8aec59c8ddc47a72b02bc663`, V16.78.114.11.

### Mission unique

Pré-auditer les seams Dice historiques restant après le raccord GREEN de
`d100ThresholdFromChance`, afin de sélectionner **un seul** prochain candidat
pour un futur micro-lot TDD.

Ce lot est documentaire/diagnostic uniquement :
- aucun raccord runtime ;
- aucune modification de `index.html` ;
- aucun changement de RNG ;
- aucun changement de seuil/chance ;
- aucun changement Tactical / Stats / Inventory / Storage / Progression.

`dungeonUniversalTest` reste un candidat connu mais **n'est pas présélectionné** :
la clôture précédente interdit de l'enchaîner automatiquement sans nouveau
pré-audit ciblé.

### Candidats à caractériser

À partir du runtime exact courant, inventorier et comparer au contrat
`GensDiceV1` :
- `dungeonUniversalTest` ;
- D6 partagé / `showSpecialD6Roll` et consommateurs réels ;
- `rollDungeonRpDice073` en séparant UI et primitives de jet ;
- D100 historiques Dungeon avec clamps 5..95 ;
- tests puzzle/piège en convention `roll <= chance` ;
- `dungeonInitiativeScore` et son dé configurable ;
- tout autre seam de jet de règle réellement partagé identifié par preuve.

Les RNG de contenu (spawn, loot, IA, génération, sélection pondérée, IDs) restent
hors Core Dice.

### Invariants / systèmes protégés

- `assets/gensrpg/core/dice-v1.js` reste inchangé dans ce pré-audit ;
- le raccord `d100ThresholdFromChance` GREEN reste inchangé ;
- les 15 consommateurs du premier seam restent inchangés ;
- Tactical V114.11 et son RNG seedé restent hors raccord ;
- Mobile Combat Performance et animations de dés restent décorateurs UI ;
- aucun wrapper, observer, timer, retry ou fallback ;
- aucune règle gameplay codée en dur ou uniformisation de clamps ;
- aucun merge sur `main`.

### Source exacte requise

Le `index.html` du checkpoint GREEN a changé depuis le fichier utilisateur
`index_work_9.zip`.

État exact attendu :
- SHA commit :
  `e19d479c5559da9215d4456b4ea62c05a9f8bbf6` ;
- blob `index.html` :
  `5b8e790fefe7970a250fd9485ee80549511737e6` ;
- taille :
  `8 174 637` octets.

Conformément à la règle 26 de la charte, toute inspection détaillée du gros
`index.html` doit utiliser une copie utilisateur téléchargée depuis ce SHA et
vérifiée contre ce blob avant analyse.

### Tests / sortie attendue

Le pré-audit devra produire une sentinelle dédiée qui :
1. inventorie les candidats réellement présents et leurs callsites ;
2. caractérise faces, clamps, convention de succès, coercions et RNG ;
3. compare chaque primitive au contrat Core Dice sans modifier le gameplay ;
4. distingue RNG de règle et RNG de contenu ;
5. prouve l'absence de modification Tactical / premier raccord ;
6. sélectionne un seul prochain seam ou conclut qu'aucun raccord n'est assez sûr ;
7. passe Architecture + navigateur complet, Firefox et Tactical Dock avant GREEN.

### Prochaine action

Obtenir et vérifier le `index.html` exact du checkpoint GREEN
`e19d479c...`, puis construire le pré-audit sans modification runtime.

## CLÔTURE CONDITIONNELLE — Phase 4 Core Dice — premier raccord d100ThresholdFromChance — 2026-09-22

Ce bloc devient le point de reprise prioritaire. Les sections suivantes sont historiques.

- Branche :
  `work/gensrpg-phase4-dice-first-raccord-2026-09-22`.
- Base exacte :
  `87a281394b2e5c31cb44277d8806ecf10101c0d1`.
- Checkpoint GREEN de départ :
  `checkpoint/gensrpg-phase4-dice-first-raccord-preaudit-green-2026-09-22`.
- Checkpoint GREEN cible :
  `checkpoint/gensrpg-phase4-dice-first-raccord-green-2026-09-22`.
- Production gelée :
  `main = e8681f9823573ced8aec59c8ddc47a72b02bc663`, V16.78.114.11, inchangée.

### TDD observé

RED réel observé avant modification runtime :

- run Architecture `35678566211` ;
- échec exactement sur la nouvelle étape
  `Verrouiller le premier raccord réel Core Dice Phase 4` ;
- pré-audit Dice et contrat pur Core Dice précédents : SUCCESS ;
- aucun runtime n'avait encore été modifié.

### Raccord réalisé

Le seul raccord runtime du lot est
`d100ThresholdFromChance(chance)`.

Résultat exact :

- `assets/gensrpg/core/dice-v1.js` est chargé explicitement avant le helper ;
- le service Core Dice reste byte-identique à sa version pure
  (blob `1813b6edb1ac69317d158e8cac6eb5c8ac353855`) ;
- la frontière historique conserve :
  `Number(chance) || 1`, puis clamp `1..100` ;
- la formule locale `101 - chance` a disparu du helper ;
- le calcul est délégué à
  `GensDiceV1.thresholdFromChance(c)` ;
- les 15 consommateurs historiques restent inchangés ;
- les entrées `undefined / NaN / ±Infinity` gardent leur compatibilité
  historique grâce à la normalisation de frontière ;
- aucun RNG, aucun générateur D100/D6 et aucun consommateur n'a été déplacé ;
- `dungeonUniversalTest` reste explicitement différé ;
- aucun autre primitive/raccord Core Dice n'a été connecté ;
- aucun wrapper, observer, timer, retry ou fallback n'a été ajouté.

Le nouvel `index.html` de travail est :

- taille : `8 174 637` octets ;
- blob Git :
  `5b8e790fefe7970a250fd9485ee80549511737e6`.

Core Dice est désormais production-reachable et présent dans le cache PWA.
La cartographie Phase 2 passe donc de 76 à 77 fichiers runtime atteignables.

### Systèmes protégés vérifiés

- Tactical V114.11 byte-identique :
  `assets/gensrpg/gens-rpg-tactical-visual-dice-16781142.js`
  blob `3e7e92eea89fd8e949361162636b4b524ff93eef` ;
- Mobile Combat Performance byte-identique :
  `assets/gensrpg/gens-mobile-combat-performance-16781022.js`
  blob `e8fd9f1049a6597118eb026976bca7548f11b284` ;
- `main` reste exactement sur le SHA gelé ;
- aucun changement fonctionnel Stats / Inventory / Storage / Progression ;
- les modifications de leurs tests historiques sont uniquement des
  réalignements d'empreinte/index ou de fixture de chargement après l'entrée
  officielle de Core Dice dans le graphe de production.

### Validation technique GREEN

SHA technique validé :

`39d85f94aa0ae0ef043e5ec922b1e0822ebf2e3f`.

Runs :

- Architecture + navigateur complet :
  `35680242538` — SUCCESS ;
- Firefox :
  `35680242494` — SUCCESS ;
- Tactical Dock :
  `35680242896` — SUCCESS.

La nouvelle sentinelle
`tests/gens_phase4_dice_first_raccord_v1.test.cjs`
verrouille notamment :

- ordre de chargement Core Dice ;
- frontière legacy exacte ;
- suppression de la formule locale ;
- délégation Core unique ;
- parité finie et non finie ;
- hash des 15 callsites ;
- inventaires RNG D100/D6 ;
- `dungeonUniversalTest` inchangé ;
- blobs Tactical / performance / Core Dice inchangés ;
- absence de second consommateur Core Dice.

### Validation finale obligatoire avant checkpoint

Cette clôture documentaire modifie le SHA.
Le checkpoint cible ne doit être créé qu'après SUCCESS sur le SHA documentaire
final exact de :

1. Architecture + navigateur complet ;
2. Firefox ;
3. Tactical Dock.

Après GREEN, ne pas enchaîner automatiquement sur `dungeonUniversalTest` :
il reste différé par le pré-audit. Le prochain raccord Dice éventuel doit faire
l'objet d'un micro-lot séparé et d'un nouveau pré-audit ciblé.

## Chantier courant prioritaire — Phase 4 Core Dice — premier raccord d100ThresholdFromChance — 2026-09-22

Ce bloc est le point de reprise actif ; les sections suivantes sont historiques.

- Branche :
  `work/gensrpg-phase4-dice-first-raccord-2026-09-22`.
- Checkpoint de départ :
  `checkpoint/gensrpg-start-phase4-dice-first-raccord-2026-09-22`.
- Base exacte :
  `87a281394b2e5c31cb44277d8806ecf10101c0d1`.
- Dernier checkpoint GREEN :
  `checkpoint/gensrpg-phase4-dice-first-raccord-preaudit-green-2026-09-22`.
- Production gelée :
  `main = e8681f9823573ced8aec59c8ddc47a72b02bc663`, V16.78.114.11.

### Mission unique

Raccorder uniquement le helper historique
`d100ThresholdFromChance(chance)` au service pur
`GensDiceV1.thresholdFromChance`.

Le helper historique reste la frontière de compatibilité pour ses 15 consommateurs.
Aucun callsite n'est migré individuellement dans ce lot.

### Source index autorisée

Le fichier utilisateur `index_work_9.zip` a été retrouvé et revérifié avant ouverture
du lot :
- HTML : `index_work9.txt` ;
- taille : `8 174 580` octets ;
- blob Git : `5b9b9ae780f735eadef049afeb10acf0b57441fe` ;
- identique au `index.html` de la base.

### TDD / RED obligatoire

La sentinelle du lot doit exiger avant toute modification runtime :
1. Core Dice chargé explicitement avant consommation ;
2. conservation de `Number(chance) || 1` puis clamp historique `1..100` à la frontière ;
3. disparition de la formule locale `101 - chance` du helper ;
4. délégation à `GensDiceV1.thresholdFromChance` ;
5. parité exacte sur valeurs finies/coercibles et `undefined / NaN / ±Infinity` ;
6. RNG D100 et génération des jets inchangés ;
7. les 15 consommateurs inchangés ;
8. Tactical inchangé ;
9. aucun autre raccord Dice ;
10. aucun wrapper, observer, timer, retry ou fallback.

Le RED doit être observé et documenté avant le raccord runtime.

### Invariants / systèmes protégés

- `assets/gensrpg/core/dice-v1.js` reste strict et inchangé sauf preuve contraire ;
- `dungeonUniversalTest` reste différé ;
- aucune génération D6/D20/D100 n'est déplacée ;
- aucun `Math.random()` de résolution ou de contenu n'est modifié ;
- Tactical V114.11, son RNG seedé et ses conventions 1..99 sont hors périmètre ;
- animations Mobile Combat Performance et Tactical Wall/Dice inchangées ;
- aucun changement Stats / Inventory / Storage / Progression ;
- aucun changement Survie / Dungeon / Capture / PvP autre que le seam central du helper ;
- aucun merge sur `main`.

### Tests requis avant GREEN

- nouvelle sentinelle propriétaire/parité du premier raccord ;
- pré-audit Dice et contrat pur Core Dice toujours GREEN ;
- cartographie / graphe de production réalignés uniquement si le chargement du Core
  rend leurs attentes obsolètes ;
- Architecture + navigateur complet ;
- Firefox ;
- Tactical Dock ;
- inspection du diff contre `87a28139...` pour prouver l'absence de dérive des
  15 callsites, du RNG et de Tactical.

### Risques

- perdre la tolérance legacy sur les entrées non finies ;
- charger le Core trop tard par rapport au helper inline ;
- créer un double chargement entre source, preview et Pages ;
- faire entrer par erreur un autre primitive Dice dans le raccord ;
- casser le cache PWA si un nouveau fichier devient production-reachable sans
  alignement du cache.

### État technique avant validation finale

Le TDD du premier raccord est maintenant réalisé :

- RED observé sur la nouvelle sentinelle du raccord avant toute modification runtime ;
- raccord runtime limité à `d100ThresholdFromChance` ;
- `assets/gensrpg/core/dice-v1.js` chargé explicitement avant consommation ;
- normalisation historique `Number(chance) || 1` + clamp `1..100` conservée à la frontière ;
- formule locale `101 - chance` retirée du helper ;
- délégation unique à `GensDiceV1.thresholdFromChance(c)` ;
- 15 consommateurs inchangés ;
- RNG / génération D100-D6 inchangés ;
- Tactical inchangé ;
- `dungeonUniversalTest` toujours différé ;
- Core Dice ajouté au graphe runtime et au cache PWA ;
- cartographies/sentinelles historiques réalignées au nouvel index
  `8 174 637` octets / blob
  `5b8e790fefe7970a250fd9485ee80549511737e6`.

Le HEAD technique avant validation globale est :
`e56cef28` — `test: realign historical guards after Core Dice source load`.

Les workflows temporaires de diagnostic/alignement ont été supprimés.

### Prochaine action

1. valider Architecture + navigateur complet sur le SHA documentaire courant ;
2. valider Firefox ;
3. valider Tactical Dock ;
4. inspecter le diff final contre `87a28139...` ;
5. seulement si tout est GREEN, documenter la clôture puis revalider le SHA documentaire final exact avant checkpoint.

## CLÔTURE CONDITIONNELLE — Phase 4 Core Dice — pré-audit premier raccord — 2026-09-22

Ce bloc est le point de reprise prioritaire. Les sections suivantes sont historiques.

- Branche :
  `work/gensrpg-phase4-dice-first-raccord-preaudit-2026-09-22`.
- Base exacte :
  `0ac5882199f845eec0b811e680b8ef624b95720a`.
- Checkpoint GREEN de départ :
  `checkpoint/gensrpg-phase4-dice-contract-green-2026-09-22`.
- Production :
  `main = e8681f9823573ced8aec59c8ddc47a72b02bc663`, V16.78.114.11, inchangée.

### Résultat du pré-audit

Aucun runtime n'a été modifié.

Sentinelle :
`tests/gens_phase4_dice_first_raccord_preaudit_v1.test.cjs`.

Résultats :
- `d100ThresholdFromChance` : 1 définition + 15 callsites ;
- `dungeonUniversalTest` : 1 définition + 1 callsite ;
- le helper D100 est en parité avec Core Dice sur toutes les valeurs
  finies/coercibles représentatives ;
- divergence volontaire uniquement pour les entrées non finies
  `undefined / NaN / ±Infinity` ;
- `dungeonUniversalTest` mélange encore règles, activation, coercions,
  sélection de dé, RNG et forme de résultat.

Sélection :
**premier raccord = `d100ThresholdFromChance`**.

Document :
`docs/GENSRPG_PHASE4_DICE_FIRST_RACCORD_PREAUDIT.md`.

### Prochain lot correctif — séparé

Après GREEN :
- charger explicitement Core Dice ;
- conserver la normalisation historique à la frontière ;
- déléguer uniquement la formule du helper à
  `GensDiceV1.thresholdFromChance` ;
- ne modifier aucun RNG ni consommateur ;
- ne pas toucher Tactical ;
- RED avant modification runtime.

### Validation finale

Le checkpoint GREEN ne doit être créé qu'après SUCCESS de :
1. Architecture + navigateur complet ;
2. Firefox ;
3. Tactical Dock ;
sur le SHA documentaire final exact.

Checkpoint cible :
`checkpoint/gensrpg-phase4-dice-first-raccord-preaudit-green-2026-09-22`.

## Chantier courant prioritaire — Phase 4 Core Dice — pré-audit premier raccord — 2026-09-22

Ce bloc est le point de reprise actif ; les sections suivantes sont historiques.

- Branche :
  `work/gensrpg-phase4-dice-first-raccord-preaudit-2026-09-22`.
- Checkpoint de départ :
  `checkpoint/gensrpg-start-phase4-dice-first-raccord-preaudit-2026-09-22`.
- Base exacte :
  `0ac5882199f845eec0b811e680b8ef624b95720a`.
- Dernier checkpoint GREEN :
  `checkpoint/gensrpg-phase4-dice-contract-green-2026-09-22`.
- Production gelée :
  `main = e8681f9823573ced8aec59c8ddc47a72b02bc663`, V16.78.114.11.

### Lot précédent GREEN

Le contrat pur Core Dice est officiellement GREEN sur
`0ac5882199f845eec0b811e680b8ef624b95720a`.

Runs exacts :
- Architecture + navigateur complet `35676612019` — SUCCESS ;
- Firefox `35676612018` — SUCCESS ;
- Tactical Dock `35676612007` — SUCCESS.

Le service `assets/gensrpg/core/dice-v1.js` reste inert et non chargé en production.

### Mission unique

Pré-auditer uniquement le **premier raccord** Core Dice.

Comparer :
1. `d100ThresholdFromChance(chance)` ;
2. `dungeonUniversalTest(statValue,opt)`.

Objectifs :
- cartographier leurs callsites réels ;
- comparer exactement leurs contrats au Core Dice pur ;
- mesurer les différences de clamps, arrondis, erreurs et structures de résultat ;
- choisir le raccord le plus petit et le plus sûr ;
- définir le RED du lot correctif suivant.

### Périmètre strict

Audit / caractérisation uniquement.

Interdit :
- modifier `index.html` ;
- charger `dice-v1.js` en production ;
- modifier seuils, chances, dés, réussite/échec ;
- modifier Tactical ou son RNG seedé ;
- modifier animations ;
- ajouter wrapper, observer, timer, retry ou fallback ;
- modifier `main`.

Le zip utilisateur `index_work_9.zip` reste valide pour cette inspection :
aucun lot depuis `669a8b2e…` n'a modifié `index.html`.

### Preuves attendues

1. corps exact des deux candidats ;
2. callsites et consommateurs ;
3. parité sur bornes et valeurs représentatives ;
4. risques inter-module ;
5. sélection explicite d'un seul premier raccord ;
6. sentinelle de pré-audit ;
7. Architecture + navigateur complet, Firefox et Tactical avant GREEN.

## CLÔTURE CONDITIONNELLE — Phase 4 Core Dice — contrat pur — 2026-09-22

Ce bloc est le point de reprise prioritaire. Les sections suivantes sont historiques.

- Branche :
  `work/gensrpg-phase4-dice-contract-2026-09-22`.
- Base exacte :
  `b4af567cc93d8dac30e87131e7a1eb32e10c6486`.
- Checkpoint GREEN de départ :
  `checkpoint/gensrpg-phase4-dice-preaudit-green-2026-09-22`.
- Production :
  `main = e8681f9823573ced8aec59c8ddc47a72b02bc663`, V16.78.114.11, inchangée.

### Résultat technique

RED :
- commit CI `edb46632a1a3dfb16a77f547272bc0e3e2a5a758` ;
- Architecture `35676025115` — FAILURE attendu ;
- erreur : `Phase 4 pure Core Dice service must exist`.

Service pur :
- commit runtime `8fa6c7f3e23d8118744bb890e78101310edc8da9` ;
- fichier `assets/gensrpg/core/dice-v1.js` ;
- API : `roll`, `thresholdFromChance`, `rollChanceHigh`, `rollCheck` ;
- RNG injectable, `Math.random` par défaut ;
- aucun raccord runtime.

Alignements :
- cartographie Phase 2 : nouveau service classé Phase 4 inert ;
- inventaire physique 94 JS, graphe production toujours 76 ;
- pré-audit Dice réaligné sur Core existant mais non raccordé.

Document :
`docs/GENSRPG_PHASE4_DICE_CONTRACT.md`.

### Validation technique complète

SHA technique :
`8d5eb68ebe6f24368f2192f8166fcc33bd1dcee6`.

- Architecture + navigateur complet `35676212916` — SUCCESS ;
- Firefox `35676212738` — SUCCESS ;
- Tactical Dock `35676212751` — SUCCESS.

### Validation documentaire finale

La documentation de clôture change le SHA.

Avant checkpoint GREEN :
1. Architecture + navigateur complet — SUCCESS ;
2. Firefox — SUCCESS ;
3. Tactical Dock — SUCCESS ;
sur le SHA documentaire final exact.

Checkpoint cible :
`checkpoint/gensrpg-phase4-dice-contract-green-2026-09-22`.

Aucun autre runtime ne doit être modifié pendant cette clôture.

### Prochain lot séparé

Après GREEN seulement :
**parité / sélection du premier raccord Core Dice**.

Comparer au minimum :
- `d100ThresholdFromChance` ;
- `dungeonUniversalTest`.

Ne raccorder qu'un propriétaire dans le premier lot. Tactical reste hors du premier
raccord tant que la conservation de son RNG seedé n'est pas prouvée.

## Chantier courant prioritaire — Phase 4 Core Dice — contrat pur — 2026-09-22

Ce bloc est le point de reprise actif ; les sections suivantes sont historiques.

- Branche :
  `work/gensrpg-phase4-dice-contract-2026-09-22`.
- Checkpoint de départ :
  `checkpoint/gensrpg-start-phase4-dice-contract-2026-09-22`.
- Base exacte :
  `b4af567cc93d8dac30e87131e7a1eb32e10c6486`.
- Dernier checkpoint GREEN :
  `checkpoint/gensrpg-phase4-dice-preaudit-green-2026-09-22`.
- Production gelée :
  `main = e8681f9823573ced8aec59c8ddc47a72b02bc663`, V16.78.114.11.

### Lot précédent GREEN

Le pré-audit Core Dice est officiellement GREEN sur
`b4af567cc93d8dac30e87131e7a1eb32e10c6486`.

Runs exacts :
- Architecture + navigateur complet `35674850926` — SUCCESS ;
- Firefox `35674850986` — SUCCESS ;
- Tactical Dock `35674850962` — SUCCESS.

Le zip utilisateur `index_work_9.zip` a été vérifié : son blob
`5b9b9ae780f735eadef049afeb10acf0b57441fe` correspond exactement à
`index.html` de la base.

### Mission unique

Créer uniquement le **contrat pur** du futur Core Dice, sans aucun raccord runtime.

API cible minimale :
- `roll(sides, rng?)` : résultat entier 1..N ;
- `thresholdFromChance(chance, bounds?)` : seuil haut D100 avec bornes explicites ;
- `rollChanceHigh(chance, bounds?, rng?)` : résultat explicable
  `{roll, chance, threshold, success}` ;
- `rollCheck({sides, modifier, difficulty, rng?})` : résultat explicable
  `{roll, modifier, total, difficulty, success}`.

Le Core doit accepter un RNG injecté pour les tests / futurs consommateurs seedés,
mais utiliser `Math.random` par défaut.

### Frontières protégées

Ce lot ne doit pas :
- modifier `index.html` ;
- raccorder `d100ThresholdFromChance`, `dungeonUniversalTest` ou Tactical ;
- modifier `Math.random()` global ;
- toucher animations D6/D100 ;
- modifier seuils/clamps historiques des consommateurs ;
- modifier Stats, Inventory, Tactical, Dungeon, Survie, Capture ou PvP ;
- ajouter wrapper, observer, timer, retry ou fallback ;
- modifier `main`.

Le futur service ne connaît aucun module gameplay et ne décide ni touche, ni
critique, ni dégâts, ni armure, ni mutation PV.

### TDD obligatoire

1. RED : sentinelle exigeant le fichier Core Dice et son API pure ;
2. tester bornes D6/D20/D100 avec RNG injecté déterministe ;
3. tester bornes de chance 1..100 et bornes explicites 1..99 / 5..95 ;
4. tester résultat explicable de `rollChanceHigh` ;
5. tester `rollCheck` sans règle gameplay cachée ;
6. vérifier l'absence de DOM, stockage, timers et noms de modules ;
7. correctif minimal : nouveau service Core uniquement ;
8. aucun raccord runtime dans ce lot ;
9. Architecture + navigateur complet, Firefox et Tactical avant checkpoint GREEN.

### Prochaine action

Créer la sentinelle RED du contrat pur puis ajouter le service Core minimal.

## Chantier courant prioritaire — Phase 4 Core Dice — pré-audit — 2026-09-22

Ce bloc est le point de reprise actif ; les sections suivantes sont historiques.

- Branche :
  `work/gensrpg-phase4-dice-preaudit-2026-09-22`.
- Checkpoint de départ :
  `checkpoint/gensrpg-start-phase4-dice-preaudit-2026-09-22`.
- Base exacte :
  `669a8b2ef1caeba2d75a97000b4716877e9e5fc9`.
- Dernier checkpoint GREEN :
  `checkpoint/gensrpg-phase4-inventory-equipment-wrapper-retry-scope-fix-green-2026-09-21`.
- Production gelée :
  `main = e8681f9823573ced8aec59c8ddc47a72b02bc663`, V16.78.114.11.

### Validation de la base fournie

Le zip utilisateur `index_work_9.zip` contient `index_work9.txt`, qui est bien
le HTML complet.

Blob Git calculé :
`5b9b9ae780f735eadef049afeb10acf0b57441fe`.

Il est identique au blob `index.html` du checkpoint GREEN de départ.
Le pré-audit travaille donc sur la bonne base exacte.

### Lot précédent GREEN

Le correctif de garde de chaîne retry Hero Editor / Equipment est officiellement
GREEN sur `669a8b2ef1caeba2d75a97000b4716877e9e5fc9`.

Runs exacts :
- Architecture + navigateur complet `35657635038` — SUCCESS ;
- Firefox `35657635013` — SUCCESS ;
- Tactical Dock `35657635025` — SUCCESS.

### Mission unique

Pré-auditer le futur service **Core Dice**, cinquième sous-chantier recommandé de
la Phase 4.

Objectifs :
1. cartographier les jets de règles D6 / dé configurable / D100 ;
2. distinguer les jets de règles du RNG de contenu (loot, spawns, cartes, IA, IDs) ;
3. identifier les helpers partagés et duplications réelles ;
4. séparer règles de dés et animations ;
5. préserver explicitement le RNG seedé du resolver Tactical ;
6. déterminer le contrat pur minimal du futur Core Dice ;
7. ne raccorder aucun runtime avant un lot correctif/extraction séparé.

### Premiers constats

- aucun `assets/gensrpg/core/dice-v1.js` n'existe ;
- `d100ThresholdFromChance` reste inline dans `index.html` ;
- `dungeonUniversalTest` possède le jet RPG configurable ;
- `showSpecialD6Roll` possède un jet D6 Survie/spécial ;
- `rollDungeonRpDice073` combine plusieurs consommateurs ;
- `d10048`, `dc051RollStatChallenge`, `dc201PuzzleRoll` et
  `dc211TrapTest` conservent des conventions D100 locales ;
- `gens-rpg-tactical-visual-dice-16781142.js` possède le vrai resolver
  D100 Tactical V114.11, un RNG seedé optionnel et les jets touche/critique ;
- Mobile Combat Performance remplace seulement les animations
  `animateDice` / `animateRpgDice`, sans posséder les règles ;
- `gens-rpg-tactical-wall-dice-stats-16781145.js` accélère l'animation D100
  Tactical mais termine sur la valeur finale déjà résolue.

Document :
`docs/GENSRPG_PHASE4_DICE_PREAUDIT.md`.

Sentinelle :
`tests/gens_phase4_dice_preaudit_v1.test.cjs`.

### Périmètre strict

Pré-audit / caractérisation uniquement.

Interdit :
- créer Core Dice runtime dans ce lot ;
- modifier `Math.random()` ;
- modifier seuils, clamps, réussite/échec ou dégâts ;
- modifier Stats, Tactical, Dungeon, Survie ou Capture ;
- modifier animations ;
- ajouter wrapper, observer, timer, retry ou fallback ;
- modifier `index.html` ;
- modifier `main`.

### Validation technique complète

SHA technique validé :
`48b3ad9b8b45c3603c7ee4f92c583f6c6149429c`.

- Architecture + navigateur complet `35674408786` — SUCCESS ;
- Firefox `35674408857` — SUCCESS ;
- Tactical Dock `35674408856` — SUCCESS.

Le contrôle Phase 2 des fichiers hors graphe a été réaligné pour les nouvelles
références documentaires au patch Tactical Wall/Dice et est SUCCESS.

### Clôture documentaire finale

La mise à jour de clôture change le SHA. Avant checkpoint GREEN :
1. revalider Architecture + navigateur complet ;
2. revalider Firefox ;
3. revalider Tactical Dock ;
4. créer seulement après trois SUCCESS :
   `checkpoint/gensrpg-phase4-dice-preaudit-green-2026-09-22`.

Après GREEN, ouvrir un lot séparé **contrat pur Core Dice**. Aucun raccord runtime
ne doit être inclus dans ce pré-audit.

## CLÔTURE CONDITIONNELLE — Phase 4 Core Inventory / Equipment — garde de chaîne retry Hero Editor — 2026-09-21

Ce bloc est le point de reprise prioritaire. Les sections suivantes sont historiques.

- Branche :
  `work/gensrpg-phase4-inventory-equipment-wrapper-retry-scope-fix-2026-09-21`.
- Base exacte :
  `6875be5259f4356e710b29ee6d75d715070847ec`.
- Checkpoint GREEN de départ :
  `checkpoint/gensrpg-phase4-inventory-equipment-wrapper-retry-preaudit-green-2026-09-21`.
- Production :
  `main = e8681f9823573ced8aec59c8ddc47a72b02bc663`, V16.78.114.11, inchangée.

### Résultat technique

RED owner-level :
- Architecture `35655960164` — FAILURE attendu.

RED comportemental navigateur :
- run isolé `35655960536` — FAILURE attendu ;
- duplication observée : 2 couches Hero Editor sur open Equipment.

Correctif runtime unique :
`70c1cee972ec58c17792fc1979c07333115fb624`.

Le wrapper générique Hero Editor utilise désormais une garde bornée/cyclique qui
cherche le marqueur `__canon101` dans toute la chaîne `__original`.

Conséquences validées :
- pas de deuxième couche Hero Editor après interposition Cleanup ;
- un Save Equipment = une persistance Hero Editor ;
- open/save natifs exécutés une fois ;
- le retry reste capable de récupérer une fonction réellement remplacée tardivement ;
- cadence 50 ms + jusqu'à 30 × 100 ms inchangée.

Document :
`docs/GENSRPG_PHASE4_INVENTORY_EQUIPMENT_WRAPPER_RETRY_CHAIN_GUARD.md`.

### Validation technique complète

SHA technique :
`283c921f240c6a7dac587aaa2b9fd01a9432ca66`.

- Architecture + navigateur complet `35656277814` — SUCCESS ;
- Firefox `35656277860` — SUCCESS ;
- Tactical Dock `35656277841` — SUCCESS ;
- navigateur ciblé `35656277861` — SUCCESS.

Le workflow temporaire a été supprimé après obtention des preuves.

### Validation documentaire finale

La présente mise à jour change le SHA. Avant checkpoint GREEN :
1. Architecture + navigateur complet — SUCCESS ;
2. Firefox — SUCCESS ;
3. Tactical Dock — SUCCESS ;
sur le SHA documentaire exact.

Checkpoint cible :
`checkpoint/gensrpg-phase4-inventory-equipment-wrapper-retry-scope-fix-green-2026-09-21`.

Aucun autre runtime ne doit être modifié pendant cette clôture.

## Chantier courant prioritaire — Phase 4 Core Inventory / Equipment — garde de chaîne retry Hero Editor — 2026-09-21

Ce bloc est le point de reprise actif ; les sections suivantes sont historiques.

- Branche :
  `work/gensrpg-phase4-inventory-equipment-wrapper-retry-scope-fix-2026-09-21`.
- Checkpoint de départ :
  `checkpoint/gensrpg-start-phase4-inventory-equipment-wrapper-retry-scope-fix-2026-09-21`.
- Base exacte :
  `6875be5259f4356e710b29ee6d75d715070847ec`.
- Dernier checkpoint GREEN :
  `checkpoint/gensrpg-phase4-inventory-equipment-wrapper-retry-preaudit-green-2026-09-21`.
- Production gelée :
  `main = e8681f9823573ced8aec59c8ddc47a72b02bc663`, V16.78.114.11.

### Lot précédent GREEN

Le pré-audit retry wrappers Equipment est officiellement GREEN sur
`6875be5259f4356e710b29ee6d75d715070847ec`.

Il a prouvé :
- Hero Editor Dynamic installe une couche `__canon101` ;
- Equipment Cleanup s'interpose ensuite avec `__canonEq102` / `__eqCache1021` ;
- le retry Hero Editor ne voit que le wrapper extérieur et ajoute une seconde
  couche `__canon101` ;
- la chaîne se stabilise ensuite ;
- un Save Equipment produit alors deux persistances Hero Editor
  `saveCustomEquipment`.

### Mission unique

Corriger uniquement la logique de garde du wrapper générique Hero Editor afin
qu'un retry reconnaisse une responsabilité `__canon101` déjà présente dans la
chaîne `__original`.

Le retry doit rester capable de :
- wrapper une fonction absente au premier passage puis définie plus tard ;
- wrapper une fonction réellement remplacée plus tard par un nouveau propriétaire
  qui ne conserve pas l'ancienne chaîne.

Il ne doit plus :
- réinstaller une deuxième couche Hero Editor lorsque le propriétaire précédent
  `__canon101` existe déjà sous un wrapper intermédiaire.

### Périmètre strict

Autorisé :
- garde de chaîne bornée/cyclique dans `gens-hero-editor-dynamic-167897.js` ;
- sentinelle owner-level RED/GREEN ;
- caractérisation navigateur Equipment après retry ;
- preuve qu'un global tardivement remplacé reste récupéré par le retry ;
- réalignement des sentinelles du pré-audit ;
- documentation / CI.

Interdit :
- supprimer ou raccourcir la boucle de retry ;
- ajouter timer, observer, wrapper, fallback ou polling ;
- modifier les responsabilités open/save Equipment ;
- modifier Equipment Cleanup, Set Editor ou hotfix ;
- modifier stockage, bonus, sets, évolution, cache, Stats gameplay, Tactical/combat ;
- modifier `index.html` ;
- modifier `main`.

### TDD obligatoire

1. RED owner-level : le wrapper générique doit détecter `__canon101` dans toute
   la chaîne `__original`, pas seulement sur le wrapper extérieur ;
2. RED comportemental : après interposition Cleanup + retry, une seule couche
   Hero Editor doit rester sur open/save et un Save doit déclencher une seule
   persistance Hero Editor ;
3. preuve positive : une fonction réellement remplacée après le premier passage
   reste wrappable par le retry ;
4. correctif minimal ;
5. Architecture + navigateur complet, Firefox et Tactical sur le SHA final ;
6. checkpoint GREEN seulement après trois SUCCESS.

## CLÔTURE CONDITIONNELLE — Phase 4 Core Inventory / Equipment — pré-audit retry wrappers Equipment — 2026-09-21

Ce bloc est le point de reprise prioritaire. Les blocs suivants sont historiques.

- Branche :
  `work/gensrpg-phase4-inventory-equipment-wrapper-retry-preaudit-2026-09-21`.
- Base exacte :
  `0fd2909a488becc452439c27c8272e2b7b346f73`.
- Checkpoint GREEN de départ :
  `checkpoint/gensrpg-phase4-inventory-equipment-hero-art-open-hook-retirement-green-2026-09-21`.
- Production :
  `main = e8681f9823573ced8aec59c8ddc47a72b02bc663`, V16.78.114.11, inchangée.

### Résultat du pré-audit

Aucun runtime n'a été modifié.

La preuve statique et navigateur confirme :
- Hero Editor Dynamic s'installe avant Equipment Cleanup ;
- Cleanup devient ensuite wrapper extérieur avec `__canonEq102` sur open et
  `__eqCache1021` sur save ;
- le premier retry Hero Editor voit un wrapper extérieur qui ne porte pas
  `__canon101` et réinstalle donc une seconde couche Hero Editor ;
- la chaîne se stabilise ensuite : les retries suivants ne l'allongent plus ;
- open natif reste exécuté une seule fois ;
- l'UI canonique bonus, Set Editor et évolution reste unique ;
- **un seul Save Equipment déclenche deux appels `saveCustomEquipment`** via les
  deux couches Hero Editor Dynamic.

Ce n'est donc pas une simple dette cosmétique : la duplication a un effet
persistant observable.

Document :
`docs/GENSRPG_PHASE4_INVENTORY_EQUIPMENT_WRAPPER_RETRY_PREAUDIT.md`.

Sentinelles :
- `tests/gens_phase4_inventory_equipment_wrapper_retry_static_preaudit_v1.test.cjs` ;
- `tests/gens_phase4_inventory_equipment_wrapper_retry_preaudit_v1.test.cjs` ;
- `tests/gens_phase4_inventory_equipment_wrapper_retry_browser_preaudit_v1.test.cjs`.

### Validation technique

SHA technique :
`dcabd657f61e87c8a1be8455ffee165b4d3ee979`.

- Architecture + navigateur complet :
  `35653724569` — SUCCESS ;
- Firefox :
  `35653724479` — SUCCESS ;
- Tactical Dock :
  `35653724449` — SUCCESS.

### Clôture documentaire

La présente mise à jour documentaire change le SHA. Le checkpoint GREEN ne doit être
créé qu'après Architecture + navigateur complet, Firefox et Tactical Dock SUCCESS
sur le SHA documentaire final exact.

Checkpoint cible :
`checkpoint/gensrpg-phase4-inventory-equipment-wrapper-retry-preaudit-green-2026-09-21`.

### Prochain lot correctif — séparé

Après GREEN seulement, ouvrir un lot dédié depuis ce checkpoint pour empêcher
le rewrap d'une responsabilité `__canon101` déjà présente dans la chaîne
`__original`, tout en conservant le retry pour les globals réellement absents ou
définis tardivement.

Le correctif devra être TDD et minimal :
1. RED : un seul wrapper Hero Editor par fonction après interposition Cleanup ;
2. RED : un Save Equipment = une seule persistance Hero Editor ;
3. conserver open/save natifs une seule fois ;
4. conserver UI bonus/set/évolution ;
5. aucun nouveau timer, wrapper, observer ou fallback ;
6. aucune modification de `index.html` ni de `main`.

## Chantier courant prioritaire — Phase 4 Core Inventory / Equipment — pré-audit retry wrappers Equipment — 2026-09-21

Ce bloc est le point de reprise actif ; les sections suivantes sont historiques.

- Branche :
  `work/gensrpg-phase4-inventory-equipment-wrapper-retry-preaudit-2026-09-21`.
- Checkpoint de départ :
  `checkpoint/gensrpg-start-phase4-inventory-equipment-wrapper-retry-preaudit-2026-09-21`.
- Base exacte :
  `0fd2909a488becc452439c27c8272e2b7b346f73`.
- Dernier checkpoint GREEN :
  `checkpoint/gensrpg-phase4-inventory-equipment-hero-art-open-hook-retirement-green-2026-09-21`.
- Production gelée :
  `main = e8681f9823573ced8aec59c8ddc47a72b02bc663`, V16.78.114.11.

### Lot précédent GREEN

Le retrait du hook `openEquipmentEditor` de Hero Art Repair est officiellement
GREEN sur le SHA exact `0fd2909a488becc452439c27c8272e2b7b346f73` :
- Architecture + navigateur complet `35652570940` — SUCCESS ;
- Firefox `35652570917` — SUCCESS ;
- Tactical Dock `35652570850` — SUCCESS.

### Mission unique

Pré-auditer uniquement l'interaction entre :
- le retry `GensHeroEditorDynamic167897.installWrappers()` utilisant
  `__canon101` ;
- le wrapper `openEquipmentEditor` de
  `GensEquipmentStatCleanup1678102` utilisant `__canonEq102`.

Objectif : prouver si, après installation complète des deux propriétaires, le retry
Hero Editor recompose réellement la chaîne `openEquipmentEditor` au-dessus du
Cleanup et si cette recomposition ajoute une responsabilité utile ou seulement
une couche répétée.

### Périmètre strict

Audit / caractérisation uniquement.

Autorisé :
- sentinelle statique de la mécanique de retry et des marqueurs ;
- caractérisation navigateur ciblée de la chaîne `__original` dans le temps ;
- documentation / CURRENT_WORK / entrée CI d'audit.

Interdit :
- retirer ou modifier le retry ;
- modifier `openEquipmentEditor` ou `saveEquipmentEditor` ;
- modifier Equipment Cleanup, Set Editor ou hotfix ;
- ajouter wrapper / observer / timer / retry / fallback ;
- modifier stockage, bonus, sets, évolution, cache, Stats gameplay, Tactical ou combat ;
- modifier `index.html` ;
- modifier `main`.

### Preuve attendue avant tout lot correctif

1. ordre de chargement réel Hero Editor -> Equipment Cleanup ;
2. identité exacte du wrapper extérieur juste après Cleanup ;
3. identité exacte après la fenêtre historique de retry Hero Editor ;
4. nombre et ordre des marqueurs `__canon101` / `__canonEq102` dans la chaîne ;
5. vérification que l'ouverture Equipment reste fonctionnelle pendant cette évolution ;
6. conclusion explicite : retry nécessaire, retry redondant, ou responsabilité mixte à séparer.

Aucun correctif runtime dans ce pré-audit.

## Chantier courant prioritaire — Phase 4 Core Inventory / Equipment — pré-audit retry wrappers Hero Editor / Equipment Cleanup — 2026-09-21

Ce bloc est le point de reprise actif ; les sections suivantes sont historiques.

- Branche :
  `work/gensrpg-phase4-inventory-equipment-wrapper-retry-preaudit-2026-09-21`.
- Checkpoint de départ :
  `checkpoint/gensrpg-start-phase4-inventory-equipment-wrapper-retry-preaudit-2026-09-21`.
- Base exacte :
  `0fd2909a488becc452439c27c8272e2b7b346f73`.
- Dernier checkpoint GREEN :
  `checkpoint/gensrpg-phase4-inventory-equipment-hero-art-open-hook-retirement-green-2026-09-21`.
- Production gelée :
  `main = e8681f9823573ced8aec59c8ddc47a72b02bc663`, V16.78.114.11.

### Lot précédent définitivement GREEN

Le retrait du hook `openEquipmentEditor` de Hero Art Repair est officiellement
GREEN sur le SHA exact :

`0fd2909a488becc452439c27c8272e2b7b346f73`.

Validations finales :
- Architecture + navigateur complet `35652570940` — SUCCESS ;
- Firefox `35652570917` — SUCCESS ;
- Tactical Dock `35652570850` — SUCCESS.

Le checkpoint GREEN cible existe et pointe sur ce SHA exact.

### Gouvernance de reprise

Une branche parallèle
`work/gensrpg-phase4-inventory-equipment-wrapper-reinstall-preaudit-2026-09-21`
a été détectée mais elle a été ouverte depuis un SHA antérieur au GREEN final.
Elle n'est pas utilisée comme autorité pour ce chantier.

Le présent lot repart exclusivement du checkpoint GREEN exact `0fd2909a…`.

### Mission unique

Caractériser, sans correction runtime, la compétition de réinstallation entre :

- `gens-hero-editor-dynamic-167897.js` :
  - `installWrappers()` ;
  - marqueur générique `__canon101` ;
  - retry après 50 ms puis jusqu'à 30 relances à 100 ms ;
- `gens-equipment-stat-cleanup-1678102.js` :
  - `wrapOpen()` marqué `__canonEq102` ;
  - invalidateur `saveEquipmentEditor` marqué `__eqCache1021` ;
  - installation single-shot.

Objectifs :
1. figer la chaîne `__original` initiale immédiatement après chargement ;
2. figer la chaîne finale après > 3 s ;
3. compter le nombre de couches du même propriétaire sur
   `openEquipmentEditor` et `saveEquipmentEditor` ;
4. mesurer les effets observables d'un appel open/save après la fenêtre de retry ;
5. déterminer si le retry crée une simple enveloppe supplémentaire ou une vraie
   duplication d'effets ;
6. définir seulement ensuite un micro-lot correctif séparé, minimal et soustractif.

### Périmètre strict

Pré-audit / caractérisation uniquement.

Ne pas modifier :
- `gens-hero-editor-dynamic-167897.js` ;
- `gens-equipment-stat-cleanup-1678102.js` ;
- hotfix Equipment ;
- Set Editor ;
- `renderDungeonGear` ;
- observer/listeners Equipment UI ;
- stockage ;
- bonus/sets ;
- évolution ;
- cache/invalidation ;
- Stats gameplay ;
- Tactical/combat ;
- `index.html` ;
- `main`.

Aucun nouveau wrapper, observer, timer/retry, fallback ou monkey-patch runtime.

### Preuves prévues

1. garde statique sur marqueurs/retry/single-install ;
2. sentinelle navigateur ciblée utilisant les vrais modules et capturant la chaîne
   initiale puis finale ;
3. compteurs d'appels des propriétaires open/save ;
4. validation du comportement Equipment après > 3 s ;
5. Architecture + navigateur complet, Firefox et Tactical avant checkpoint GREEN.

### Prochaine action

Créer les sentinelles de caractérisation statique et navigateur. Aucun changement
runtime autorisé dans ce pré-audit.


## CLÔTURE CONDITIONNELLE — Phase 4 Core Inventory / Equipment — Hero Art open hook retirement — 2026-09-21

Ce bloc est le point de reprise prioritaire.

- Branche :
  `work/gensrpg-phase4-inventory-equipment-hero-art-open-hook-retirement-2026-09-21`.
- Base :
  `c5f8b60cc130d6df12651c317285ed209eddd5c2`.
- Dernier checkpoint GREEN de départ :
  `checkpoint/gensrpg-phase4-inventory-equipment-open-wrapper-preaudit-green-2026-09-21`.
- Production :
  `main = e8681f9823573ced8aec59c8ddc47a72b02bc663`, V16.78.114.11, inchangée.

### Résultat technique validé

Correctif runtime unique :
`d2725f2a7bd515e7f37a6bf82435976d0e336e0d`.

Le seul changement runtime est le retrait de `"openEquipmentEditor"` dans
`GensDungeonHeroArtRepair167874.hookAll()`.

Validation technique complète sur :
`52757bf2695fc8d6a9f9937246182707119ced8a`.

- Architecture + navigateur complet :
  `35651851130` — SUCCESS ;
- Firefox :
  `35651851190` — SUCCESS ;
- Tactical Dock :
  `35651851034` — SUCCESS
  (contrat + Chromium + Firefox SUCCESS).

La nouvelle sentinelle navigateur ciblée Equipment est SUCCESS dans le run
Architecture complet.

### Validation documentaire finale

La présente mise à jour de `GENSRPG_CURRENT_WORK.md` crée volontairement un
nouveau SHA documentaire. Ce SHA doit repasser les trois workflows avant création
du checkpoint GREEN, conformément à la charte.

Checkpoint à créer uniquement si les trois workflows du SHA documentaire sont
SUCCESS :

`checkpoint/gensrpg-phase4-inventory-equipment-hero-art-open-hook-retirement-green-2026-09-21`.

Règle de reprise :
- si ce checkpoint existe et pointe sur le HEAD documentaire de ce bloc, le lot est
  officiellement GREEN et clos ;
- sinon reprendre uniquement la validation finale, sans retoucher le runtime.

### Prochaine dette séparée

Le prochain candidat reste le retry `installWrappers()` de
`GensHeroEditorDynamic167897` et son interaction avec le marqueur
`__canonEq102` d'Equipment Cleanup. Ouvrir un nouveau lot / checkpoint de départ
avant toute modification.


## ÉTAT ACTUEL — Phase 4 Core Inventory / Equipment — retrait du hook openEquipmentEditor de Hero Art Repair — 2026-09-21

Ce bloc est le point de reprise opérationnel prioritaire. Les blocs suivants sont historiques.

- Branche :
  `work/gensrpg-phase4-inventory-equipment-hero-art-open-hook-retirement-2026-09-21`.
- Checkpoint de départ :
  `checkpoint/gensrpg-start-phase4-inventory-equipment-hero-art-open-hook-retirement-2026-09-21`.
- Base exacte :
  `c5f8b60cc130d6df12651c317285ed209eddd5c2`.
- Dernier checkpoint GREEN :
  `checkpoint/gensrpg-phase4-inventory-equipment-open-wrapper-preaudit-green-2026-09-21`.
- Production :
  `main = e8681f9823573ced8aec59c8ddc47a72b02bc663`, V16.78.114.11, inchangée.

### État technique

Le RED propriétaire a été obtenu sur :
`2bddbef1f22e5a30736157a820ff246ea2efb066`.

Run Architecture RED :
`35650600108`.

Échec ciblé attendu :
`Hero Art Repair must retire its unrelated openEquipmentEditor hook`.

La caractérisation navigateur pré-correctif a ensuite été fiabilisée avec le vrai
Core `GensInventoryEquippedViewV1` et est GREEN :
- run ciblé `35651278948` — SUCCESS.

Correctif runtime unique :
`d2725f2a7bd515e7f37a6bf82435976d0e336e0d`.

Modification :
- retrait du seul token `"openEquipmentEditor"` dans
  `GensDungeonHeroArtRepair167874.hookAll()`.

Aucun autre runtime n'a été modifié.

Après correctif :
- le pré-audit `openEquipmentEditor` réaligné passe avec 4 propriétaires ;
- le nouveau garde propriétaire passe ;
- la sentinelle navigateur ciblée passe ;
- le workflow temporaire d'isolation de cette sentinelle a été supprimé.

Document :
`docs/GENSRPG_PHASE4_INVENTORY_EQUIPMENT_HERO_ART_OPEN_HOOK_RETIREMENT.md`.

### Prochaine action obligatoire

1. lancer/attendre la validation finale sur le SHA documentaire propre :
   - Architecture + navigateur complet ;
   - Firefox ;
   - Tactical Dock contrat + Chromium + Firefox ;
2. si les trois workflows sont SUCCESS, reporter leurs IDs ici ;
3. rerun final si une mise à jour documentaire change le SHA ;
4. créer seulement alors :
   `checkpoint/gensrpg-phase4-inventory-equipment-hero-art-open-hook-retirement-green-2026-09-21`;
5. ne pas toucher à `main`.

### Dette suivante candidate — séparée

Le retry de `GensHeroEditorDynamic167897.installWrappers()` et son interaction
avec le marqueur `__canonEq102` d'Equipment Cleanup restent une dette séparée.
Ne pas la corriger dans ce lot.


## Chantier courant prioritaire — Phase 4 Core Inventory / Equipment — retrait du hook openEquipmentEditor de Hero Art Repair — 2026-09-21

Ce bloc est le point de reprise actif ; les sections suivantes sont historiques.

- Branche :
  `work/gensrpg-phase4-inventory-equipment-hero-art-open-hook-retirement-2026-09-21`.
- Checkpoint de départ :
  `checkpoint/gensrpg-start-phase4-inventory-equipment-hero-art-open-hook-retirement-2026-09-21`.
- Base exacte :
  `c5f8b60cc130d6df12651c317285ed209eddd5c2`.
- Dernier checkpoint GREEN :
  `checkpoint/gensrpg-phase4-inventory-equipment-open-wrapper-preaudit-green-2026-09-21`.
- Production gelée :
  `main = e8681f9823573ced8aec59c8ddc47a72b02bc663`, V16.78.114.11.

### Lot précédent GREEN

Pré-audit wrappers `openEquipmentEditor` validé sur
`c5f8b60cc130d6df12651c317285ed209eddd5c2` :

- Architecture + navigateur complet `35649019277` — SUCCESS ;
- Firefox `35649019437` — SUCCESS ;
- Tactical Dock `35649019333` — SUCCESS.

Le pré-audit a prouvé cinq participants externes atteignables et identifié
`GensDungeonHeroArtRepair167874.hookAll()` comme premier candidat soustractif :
son hook générique inclut `openEquipmentEditor` alors que le module ne possède ni
les données Equipment ni l'UI canonique de l'éditeur.

### Mission unique

Caractériser puis retirer uniquement `openEquipmentEditor` de la liste gérée par
`GensDungeonHeroArtRepair167874.hookAll()`, si la preuve navigateur confirme que
les propriétaires Equipment dédiés conservent toutes leurs responsabilités.

### Propriétaires à conserver

- hotfix Equipment : section historique / compatibilité et writer associé ;
- Set Editor : synchronisation membership / éditeur de sets ;
- Hero Editor Dynamic : UI canonique `rpgBonuses` ;
- Equipment Stat Cleanup : évolution / grilles set / masquage legacy.

Hero Art Repair doit rester propriétaire uniquement de ses réparations héros /
participants et de son chargement de bridges, pas du cycle d'ouverture Equipment.

### Périmètre strict

Autorisé :
- sentinelle owner-level du hook Hero Art Repair ;
- sentinelle navigateur ciblée de l'ouverture Equipment ;
- retrait du seul token `"openEquipmentEditor"` dans `hookAll()` après RED ;
- documentation / CURRENT_WORK / entrée CI correspondantes.

Interdit :
- modifier `saveEquipmentEditor` ;
- modifier hotfix, Set Editor, Hero Editor Dynamic ou Equipment Cleanup ;
- modifier leur retry/timers ;
- modifier `renderDungeonGear`, observer/listeners Equipment UI ;
- modifier stockage, bonus/sets, évolution, cache, Stats gameplay, Tactical, combat ;
- modifier `index.html` ;
- modifier `main`.

### TDD / validation

1. sentinelle navigateur pré-correctif : l'ouverture réelle garde l'UI canonique
   bonus, l'UI set, l'évolution canonique et les réparations héros attendues ;
2. RED owner-level exigeant que Hero Art Repair ne hooke plus
   `openEquipmentEditor` ;
3. correctif soustractif d'une seule responsabilité ;
4. revalidation de la sentinelle navigateur ;
5. Architecture + navigateur complet ;
6. Firefox ;
7. Tactical Dock ;
8. checkpoint GREEN uniquement après trois SUCCESS sur le SHA final.

### Résultat du lot

Caractérisation navigateur ciblée :
- workflow isolé `35651278948` — SUCCESS ;
- fixture corrigée pour charger le vrai Core
  `GensInventoryEquippedViewV1` avant le hotfix Equipment ;
- aucun runtime modifié pour corriger cette fixture.

RED propriétaire :
- SHA `2bddbef1f22e5a30736157a820ff246ea2efb066` ;
- Architecture `35650600108` — FAILURE attendu ;
- erreur : `Hero Art Repair must retire its unrelated openEquipmentEditor hook`.

Correctif soustractif :
- commit runtime `d2725f2a7bd515e7f37a6bf82435976d0e336e0d` ;
- seul `"openEquipmentEditor"` a été retiré de
  `GensDungeonHeroArtRepair167874.hookAll()` ;
- aucun autre wrapper / observer / timer / retry / stockage ajouté ou modifié.

Ré-alignement :
- l'ancien pré-audit attend désormais quatre propriétaires Equipment réels ;
- Hero Art Repair est explicitement exclu du cycle open Equipment ;
- le workflow temporaire de caractérisation a été supprimé.

Validation technique sur le SHA documentaire candidat
`917497395ab3cbd06f86df70a2285e80a30d7dc1` :
- Architecture + navigateur complet `35651753018` — SUCCESS ;
- Firefox `35651752932` — SUCCESS ;
- Tactical Dock `35651752858` — SUCCESS.

Document :
`docs/GENSRPG_PHASE4_INVENTORY_EQUIPMENT_HERO_ART_OPEN_HOOK_RETIREMENT.md`.

### État de clôture

La présente mise à jour de `CURRENT_WORK` change le SHA.

Avant checkpoint GREEN :
1. revalider Architecture + navigateur complet, Firefox et Tactical sur le SHA
   documentaire exact de clôture ;
2. créer uniquement après trois SUCCESS :
   `checkpoint/gensrpg-phase4-inventory-equipment-hero-art-open-hook-retirement-green-2026-09-21`.

### Prochaine dette séparée après GREEN

Pré-auditer la compétition de réinstallation entre :
- `GensHeroEditorDynamic167897` / marqueur `__canon101` / retries ;
- `GensEquipmentStatCleanup1678102` / marqueur `__canonEq102` / single-install.

Ce futur lot doit commencer par une caractérisation, sur une branche neuve depuis
le checkpoint GREEN. Il ne doit pas modifier les retries ni consolider les wrappers
sans preuve navigateur dédiée.


## Chantier courant prioritaire — Phase 4 Core Inventory / Equipment — pré-audit wrapper openEquipmentEditor — 2026-09-21

Ce bloc est le point de reprise actif ; les sections suivantes sont historiques.

- Branche :
  `work/gensrpg-phase4-inventory-equipment-open-wrapper-preaudit-2026-09-21`.
- Checkpoint de départ :
  `checkpoint/gensrpg-start-phase4-inventory-equipment-open-wrapper-preaudit-2026-09-21`.
- Base exacte :
  `405257244acf58e19e738048d95b07fcad9459d3`.
- Dernier checkpoint GREEN :
  `checkpoint/gensrpg-phase4-inventory-equipment-setstate-fallback-retirement-green-2026-09-21`.
- Production gelée :
  `main = e8681f9823573ced8aec59c8ddc47a72b02bc663`, V16.78.114.11.

### Lot précédent définitivement GREEN

Le retrait du fallback local `fallbackSetStates(items)` est fermé sur le SHA exact
`405257244acf58e19e738048d95b07fcad9459d3`.

Validation documentaire finale :
- Architecture + navigateur complet `35647009692` — SUCCESS, tentative 2 du même SHA ;
- Firefox `35647009659` — SUCCESS ;
- Tactical Dock `35647009672` — SUCCESS.

La première tentative navigateur du run Architecture avait rencontré le flake déjà
caractérisé sur Dungeon après Survie. La relance du seul job navigateur sur le même
SHA a réussi sans modification de code.

### Mission du présent pré-audit

Caractériser uniquement l'empilement de wrappers de `openEquipmentEditor` avant
tout retrait ou raccord supplémentaire.

Chaîne à vérifier :
1. `dungeon-equipment-hotfix-167817.js` ;
2. `dungeon-set-editor-167818.js` ;
3. `gens-equipment-stat-cleanup-1678102.js`.

Objectifs :
- identifier la responsabilité observable propre de chaque wrapper ;
- vérifier l'ordre réel de composition ;
- vérifier les marqueurs / `__original` et les dépendances ;
- distinguer ce qui est encore nécessaire de ce qui est purement historique ;
- définir, seulement après preuve, le prochain micro-lot soustractif minimal.

### Périmètre

Audit / caractérisation uniquement dans un premier temps.

Ne pas modifier :
- `saveEquipmentEditor` ;
- le wrapper `renderDungeonGear` ;
- MutationObserver / listeners / timers / RAF de l'Equipment UI ;
- calcul bonus/sets/évolution/cache ;
- stockage ;
- Stats / Tactical / combat ;
- `index.html` ;
- `main`.

Aucun wrapper, observer, timer/retry ou fallback nouveau.

### Tests prévus

1. figer l'ordre hotfix -> set-editor -> cleanup ;
2. caractériser l'effet propre de chaque wrapper `openEquipmentEditor` ;
3. vérifier que chaque couche appelle bien la précédente ;
4. vérifier les marqueurs et chaînes `__original` ;
5. caractériser les décorations différées sans les modifier ;
6. vérifier le vrai ordre Pages / preview lorsque nécessaire ;
7. Architecture + navigateur complet, Firefox et Tactical Dock avant GREEN.

### Risque principal

Retirer une couche sans preuve pourrait supprimer :
- l'édition des `rpgBonuses` ;
- l'UI / appartenance de set ;
- la décoration canonique évolution/stats.

Le pré-audit ne doit donc effectuer aucun retrait runtime.

### Résultat du pré-audit

L'inventaire exhaustif des 76 fichiers externes atteignables Phase 2 a trouvé
**5 participants** contenant `openEquipmentEditor` :

1. `dungeon-equipment-hotfix-167817.js` ;
2. `dungeon-set-editor-167818.js` ;
3. `gens-dungeon-hero-art-repair-167874.js` ;
4. `gens-hero-editor-dynamic-167897.js` ;
5. `gens-equipment-stat-cleanup-1678102.js`.

Le résumé historique à trois couches était donc incomplet.

Ordre caractérisé :
- Pages/preview chargent hotfix puis Set Editor, Stats, puis Hero Art Repair ;
- Hero Art Repair wrappe `openEquipmentEditor`, puis charge dynamiquement
  Hero Editor Dynamic avant Equipment Stat Cleanup ;
- Hero Editor Dynamic possède en plus un retry d'installation (50 ms puis jusqu'à
  30 relances à 100 ms) basé sur le marqueur `__canon101` ;
- Equipment Cleanup utilise `__canonEq102` et est single-install ;
- après le cleanup, un retry Hero Editor peut donc redevenir le wrapper extérieur.

Responsabilités prouvées :
- hotfix open : remplit la section historique RPG bonus encore consommée par son
  writer ; pas de retrait open isolé ;
- Set Editor open : synchronise l'appartenance de set utilisée par son writer ;
  pas de retrait open isolé ;
- Hero Editor Dynamic open : possède l'UI canonique des bonus RPG de base ;
- Equipment Cleanup open : possède la décoration canonique évolution/set et
  masque les contrôles legacy ;
- Hero Art Repair open : hook générique non propriétaire de l'éditeur Equipment,
  premier candidat soustractif.

Aucun runtime n'a été modifié dans ce pré-audit.

Sentinelle :
`tests/gens_phase4_inventory_equipment_open_wrapper_preaudit_v1.test.cjs`.

Document :
`docs/GENSRPG_PHASE4_INVENTORY_EQUIPMENT_OPEN_WRAPPER_PREAUDIT.md`.

### Prochaine action

1. valider ce pré-audit par Architecture + navigateur complet, Firefox et Tactical ;
2. après trois SUCCESS sur le SHA documentaire exact, créer
   `checkpoint/gensrpg-phase4-inventory-equipment-open-wrapper-preaudit-green-2026-09-21` ;
3. ouvrir un lot distinct depuis ce checkpoint pour caractériser au navigateur puis
   retirer uniquement `openEquipmentEditor` de
   `GensDungeonHeroArtRepair167874.hookAll()` si la preuve est GREEN ;
4. ne modifier aucun wrapper `saveEquipmentEditor`, aucun observer/listener/timer
   et aucun autre wrapper open dans ce futur lot ;
5. conserver `main` inchangée.


## Chantier courant prioritaire — Phase 4 Core Inventory / Equipment — clôture retrait fallback set-state UI — 2026-09-21

Ce bloc est le point de reprise actif ; les sections suivantes sont historiques.

- Branche :
  `work/gensrpg-phase4-inventory-equipment-setstate-fallback-retirement-2026-09-21`.
- Checkpoint de départ :
  `checkpoint/gensrpg-start-phase4-inventory-equipment-setstate-fallback-retirement-2026-09-21`.
- Base exacte :
  `db3bdbd51e6ba32a9d81204e41fd0e6a95a2519e`.
- Dernier checkpoint GREEN :
  `checkpoint/gensrpg-phase4-inventory-equipment-legacy-ui-preaudit-green-2026-09-21`.
- Production gelée :
  `main = e8681f9823573ced8aec59c8ddc47a72b02bc663`, V16.78.114.11.

### Résultat technique

Le fallback local :

`fallbackSetStates(items)`

a été retiré de :

`assets/dungeon/dungeon-equipment-ui.js`.

`setStates(items)` dépend maintenant uniquement de :

`dungeonSetStateFromItems316(items)`.

Si ce seam est absent, invalide ou lève une exception, l'UI retourne `[]`
et ne recalcule plus une sémantique locale concurrente.

### TDD

RED initial :
- SHA `031d38baf7f1a2ece5127b2d4e364509ed94a8ea` ;
- Architecture `35645846830` — FAILURE attendu ;
- erreur :
  `local Equipment UI fallbackSetStates must be retired`.

Après suppression runtime, le pré-audit historique a échoué comme attendu car
il cherchait encore la fonction retirée :
- SHA `c4099932d4a1ee0c2d5d34997a1781ff4386cc04` ;
- Architecture `35646076358` — FAILURE attendu ;
- erreur :
  `missing function fallbackSetStates`.

Sentinelles réalignées ensuite sur le nouvel état.

### Validation technique GREEN

HEAD technique :
`d448b8052c5a9b01bfb239ecdb0b216ab951cdef`.

- Architecture + navigateur complet :
  `35646315077` — SUCCESS ;
- Firefox :
  `35646315049` — SUCCESS ;
- Tactical Dock :
  `35646315106` — SUCCESS.

Document :
`docs/GENSRPG_PHASE4_INVENTORY_EQUIPMENT_SETSTATE_FALLBACK_RETIREMENT.md`.

### Périmètre respecté

Aucun changement de :
- `index.html` ;
- `dungeon-core-316.js` ;
- Core Equipment bonus/sets ;
- wrappers open/save ;
- wrapper `renderDungeonGear` ;
- observer/listeners/timers/RAF ;
- stockage ;
- évolution ;
- cache/invalidation ;
- Stats/Tactical/combat.

Aucun nouveau wrapper, fallback, observer ou timer.

### État actuel

Clôture documentaire en cours.

Le SHA documentaire exact doit repasser :
- Architecture + navigateur ;
- Firefox ;
- Tactical Dock.

Aucun checkpoint GREEN final avant ces trois SUCCESS.

### Prochaine action

1. valider le SHA documentaire exact ;
2. créer :
   `checkpoint/gensrpg-phase4-inventory-equipment-setstate-fallback-retirement-green-2026-09-21` ;
3. ouvrir un nouveau checkpoint de départ et une nouvelle branche pour le
   prochain micro-lot legacy UI explicitement défini par un nouveau pré-audit
   ou par le résultat de celui déjà clos ;
4. ne pas mélanger wrappers open/save et side effects UI dans le même lot ;
5. ne jamais toucher `main`.


## Chantier courant prioritaire — Phase 4 Core Stats / S11 correctif double application dégâts mêlée — 2026-09-21

Ce bloc est le point de reprise actif ; les sections suivantes sont historiques.

- Branche :
  `work/gensrpg-phase4-stats-s11-melee-damage-double-application-fix-2026-09-21`.
- Checkpoint de départ :
  `checkpoint/gensrpg-start-phase4-stats-s11-melee-damage-double-application-fix-2026-09-21`.
- Base exacte / dernier GREEN de caractérisation :
  `bb5844329f1e2e394ff2788168cc83e7e8eb38ac`.
- Checkpoint précédent :
  `checkpoint/gensrpg-phase4-stats-s11-damage-boundary-characterized-green-2026-09-21`.
- Production gelée :
  `main = e8681f9823573ced8aec59c8ddc47a72b02bc663`, V16.78.114.11.

### Défaut prouvé

Le chemin réel mêlée physique peut inclure le même bonus canonique deux fois :

`effectiveAttackStats/applyDungeonCombatScaling`
→ bonus déjà inclus dans `st.strength`
→ Adapter copie cette valeur dans `attack.power`
→ V110 relit le même bonus dans le snapshot
→ V114.11 l'ajoute encore à `attack.power`.

Fixture prouvée :
`arme 5 + bonus 3` devient `attack.power=8`, puis V114.11 calcule
`8 + 3 - armure 2 = 9`, au lieu de `5 + 3 - 2 = 6`.

### Propriétaire de frontière identifié

Le runtime inline expose déjà dans `effectiveAttackStats()` :
`st.rpgDamageBonus`.

Le correctif ne doit donc pas modifier `index.html`.

Contrat cible :
1. l'Adapter transporte le montant du bonus canonique déjà inclus dans
   `attack.power` ;
2. V114.11, uniquement pour la mêlée physique, retire ce montant incorporé de
   la base puis ajoute la valeur canonique courante du snapshot une seule fois ;
3. les autres bonus déjà intégrés à `attack.power` restent intacts ;
4. distance physique et magie conservent leur sémantique actuelle ;
5. l'explication redevient
   `puissance hors bonus canonique + bonus stat = brut - armure = final`.

### Interdictions

- ne pas modifier `applyDungeonCombatScaling` ni le gameplay Dungeon classique ;
- ne pas toucher `index.html` ;
- ne pas changer dégâts distance/magie/élémentaires ;
- ne pas changer résistances, armure/floor, critique, hit ou esquive ;
- ne pas déplacer la mutation PV vers Core ;
- aucun wrapper/observer/timer/retry/monkey-patch ;
- aucun changement sur `main`.

### TDD obligatoire

Le prochain commit doit être un RED qui reproduit le chemin complet
Adapter → V110 → V114.11 et exige :
- arme 5 ;
- bonus canonique 3 ;
- `attack.power=8` conservé pour preview/AI ;
- base V114.11 expliquée = 5 ;
- bonus stat V114.11 = 3 ;
- brut = 8 ;
- armure 2 ;
- final = 6 ;
- aucune régression ranged/magic.


### Résultat du correctif

RED :
- test : `8533d748ab1408296a36cdccf289b0be9615b1a9` ;
- CI : `2d68b3c7f7f944355a3b3681ebb9365c6ffef96d` ;
- run Architecture `35597056337` — FAILURE attendu ;
- erreur exacte : absence du transport `rpgDamageBonus` dans l'Adapter.

Correctif :
- Adapter : `b76ee9fa140bc811ced53db940a2577929773155` ;
- V114.11 : `22cb5c19fe5cd26c3515481a835e07cb018ff151` ;
- caractérisation S11 mise au nouvel état :
  `d265b569dd085bde9f6c71bddad3042934ab1f36`.

Contrat obtenu :
- preview Tactical conserve `attack.power=8` ;
- Adapter transporte `meta.rpgDamageBonus=3` ;
- V114.11 mêlée physique reconstruit base 5 + bonus snapshot 3 = 8 brut ;
- armure 2 -> 6 final ;
- distance physique inchangée ;
- magie inchangée ;
- aucun changement de `index.html`.

Validation technique sur `d265b569...` :
- Architecture + navigateur complet : `35597196183` — SUCCESS ;
- Firefox : `35597196186` — SUCCESS ;
- Tactical Dock : `35597196182` — SUCCESS.

Audit :
`docs/GENSRPG_PHASE4_STATS_S11_MELEE_DAMAGE_FIX.md`.

### Clôture corrective en cours

Le SHA documentaire final doit repasser les trois batteries.

Après trois SUCCESS :
1. créer
   `checkpoint/gensrpg-phase4-stats-s11-melee-damage-double-application-fix-green-2026-09-21` ;
2. créer un checkpoint de reprise S11 frontière dégâts sur ce SHA ;
3. ouvrir une branche dédiée de raccord snapshot Core ;
4. ne passer à S12 qu'après fermeture complète de S11.


## Chantier courant prioritaire — Phase 4 Core Stats / S11 frontière dégâts — 2026-09-21

Ce bloc est le point de reprise actif ; les sections suivantes sont historiques.

- Branche : `work/gensrpg-phase4-stats-s11-damage-boundary-2026-09-21`.
- Checkpoint de départ :
  `checkpoint/gensrpg-start-phase4-stats-s11-damage-boundary-2026-09-21`.
- Base exacte et dernier GREEN :
  `bf63fbfdc2203878016f41df73fa833e111a7baf`.
- Dernier checkpoint GREEN :
  `checkpoint/gensrpg-phase4-stats-s10-hit-defense-dodge-green-2026-09-21`.
- Production gelée :
  `main = e8681f9823573ced8aec59c8ddc47a72b02bc663`, V16.78.114.11.

### S10 définitivement clôturé

HEAD final :
`bf63fbfdc2203878016f41df73fa833e111a7baf`.

Runs du SHA documentaire final :
- Architecture + navigateur complet : `35595037282` — SUCCESS ;
- Firefox : `35595037254` — SUCCESS ;
- Tactical Dock : `35595037241` — SUCCESS.

Checkpoint :
`checkpoint/gensrpg-phase4-stats-s10-hit-defense-dodge-green-2026-09-21`.

S10 n'a créé aucun nouveau moteur Core : la frontière d'autorité a été
explicitement figée et Dungeon/Tactical conservent leurs résolutions distinctes.

### Mission S11

Caractériser puis sécuriser la **frontière dégâts finale** maintenant que
S7-S10 sont stabilisés.

Ordre cible défini par le pré-audit :
- Core Stats fournit les bonus dérivés ;
- Tactical applique l'arme, le mode/type, les résistances, l'armure et le
  critique ;
- les relectures Dungeon depuis le snapshot Tactical doivent ensuite être
  retirées uniquement lorsqu'une parité réelle est démontrée.

### Risque principal S11

Le snapshot Tactical V110 lit encore plusieurs seams Dungeon globaux au moment
de sa construction, notamment :
- `dungeonPhysicalDamageBonus` ;
- `dungeonMagicDamageBonus` ;
- `dungeonCriticalChance` ;
- `dungeonMagicResistance` ;
- et d'autres dérivées historiques.

Parallèlement, les modules Core S6/S7 existent déjà en version pure/inert.

S11 ne doit surtout pas :
- dupliquer les bonus ;
- appliquer deux fois résistance/armure/critique ;
- déplacer la mutation des PV dans Core Stats ;
- modifier les formules V114.11 ;
- raccorder S6/S7 mécaniquement sans preuve de parité.

### Première action obligatoire S11

Avant tout raccord :
1. cartographier exactement la chaîne active
   `Core/Stats -> V110 snapshot -> Tactical preview -> V114.11 final damage` ;
2. distinguer les données de snapshot des opérations de résolution ;
3. caractériser physique mêlée, physique distance, magique et élémentaire ;
4. caractériser bonus stat, résistance, armure, critique et application PV ;
5. mesurer les relectures Dungeon réellement effectuées par V110 ;
6. comparer les dérivées S6/S7 avec le snapshot historique sur fixtures réelles ;
7. identifier quelles relectures peuvent être supprimées sans changement ;
8. poser un RED de raccord seulement après cette preuve.

### Frontière S11

Core Stats peut posséder :
- bonus dégâts physique/magique dérivés ;
- critique comme valeur ;
- résistance magique comme valeur ;
- snapshot immuable des valeurs canoniques/dérivées.

Tactical reste propriétaire de :
- puissance de l'arme ;
- type/mode d'attaque ;
- application des résistances ;
- application de l'armure et de son floor ;
- jet/résolution critique ;
- total par touche / total multi-touches ;
- mutation des PV et issue de combat.

### Interdictions S11

- aucune modification de formule dégâts pendant l'audit ;
- aucun changement des pourcentages de résistances ;
- aucun changement du contrat Armure S9 ;
- aucun changement Toucher/Défense/Esquive S10 ;
- aucune mutation PV dans Core Stats ;
- aucune double lecture ou double application d'un bonus ;
- aucun nouveau wrapper global, MutationObserver, timer/retry ou monkey-patch ;
- aucun changement sur `main`.


### Résultat de caractérisation S11

Document :
`docs/GENSRPG_PHASE4_STATS_S11_DAMAGE_BOUNDARY_AUDIT.md`.

Sentinelle :
`tests/gens_phase4_stats_s11_damage_boundary_characterization_v1.test.cjs`.

Commits :
- test initial : `6fffae31ac381883516baf3ec2b3c2941cde06e4` ;
- CI : `c8006dbf46f45f2084498c3764e9485a99014995` ;
- correction syntaxique de la sentinelle :
  `db813073bcb59ffe286816e4201fc9a28eccefdb` ;
- audit documenté :
  `27aa385a2f800bb49be6c3c8b1583069d0ad563a`.

Le RED initial S11 était uniquement une erreur de syntaxe du test
(`Unexpected end of input`) et n'a entraîné aucune modification gameplay.

Le test corrigé passe dans Architecture `35596199137`.

### Défaut fonctionnel caractérisé — ne pas corriger dans ce lot

Le vrai chemin physique mêlée montre une double application possible du même
bonus canonique :

- arme brute 5 ;
- `applyDungeonCombatScaling` ajoute +3 → `attack.power = 8` ;
- V110 relit +3 dans `snapshot.derived.physicalDamageBonus` ;
- V114.11 ajoute ce +3 au `attack.power` → 11 brut ;
- armure 2 → 9 final.

Le contrat V114.11 déjà documenté attend pourtant :
`5 + 3 - 2 = 6`.

La différence était masquée parce que l'ancien test final construisait une
attaque `power=5` directement, sans passer par l'Adapter réel.

Le chemin magique relit aussi son bonus dans V110 mais V114.11 ne le rajoute
pas une seconde fois dans la branche non physique.

### Décision de gouvernance

Conformément à la charte, **aucun correctif gameplay n'est appliqué sur la
branche de caractérisation S11**.

Le présent lot doit être checkpointé GREEN après CI complète, puis ouvrir un
lot correctif dédié au défaut de double application physique mêlée.

Nom prévu :
`work/gensrpg-phase4-stats-s11-melee-damage-double-application-fix-2026-09-21`.

Ce correctif devra :
1. conserver la formule cible `arme + bonus canonique une seule fois` ;
2. corriger le vrai propriétaire de frontière Adapter/V114.11 ;
3. ne pas retirer le bonus de `applyDungeonCombatScaling` pour Dungeon
   classique ;
4. vérifier mêlée, distance, magie, armure, résistance, critique et explication ;
5. ne reprendre le raccord S11 Core Snapshot qu'après GREEN du correctif.

### Clôture du lot de caractérisation S11

Le présent commit documentaire final doit repasser les trois batteries.

Après trois SUCCESS :
1. créer
   `checkpoint/gensrpg-phase4-stats-s11-damage-boundary-characterized-green-2026-09-21` ;
2. créer un checkpoint de départ du correctif sur exactement ce SHA ;
3. ouvrir la branche correctrice dédiée ci-dessus ;
4. ne toucher ni S12 ni `main`.


## Chantier courant prioritaire — Phase 4 Core Stats / S10 Toucher-Défense-Esquive — 2026-09-21

Ce bloc est le point de reprise actif ; les sections suivantes sont historiques.

- Branche : `work/gensrpg-phase4-stats-s10-hit-defense-dodge-2026-09-21`.
- Checkpoint de départ :
  `checkpoint/gensrpg-start-phase4-stats-s10-hit-defense-dodge-2026-09-21`.
- Base exacte et dernier GREEN :
  `79744f111c9d4fd064c1dbd0dbfb599849cd06b2`.
- Dernier checkpoint GREEN :
  `checkpoint/gensrpg-phase4-stats-s9-armor-contract-green-2026-09-21`.
- Production gelée :
  `main = e8681f9823573ced8aec59c8ddc47a72b02bc663`, V16.78.114.11.

### S9 définitivement clôturé

HEAD final :
`79744f111c9d4fd064c1dbd0dbfb599849cd06b2`.

Runs du SHA documentaire final :
- Architecture + navigateur complet : `35592897503` — SUCCESS ;
- Firefox : `35592897367` — SUCCESS ;
- Tactical Dock : `35592897396` — SUCCESS.

Checkpoint :
`checkpoint/gensrpg-phase4-stats-s9-armor-contract-green-2026-09-21`.

`stats-armor-contract-v1.js` reste Phase 4 inert.
Aucune formule Armor/dégâts et aucun raccord runtime n'ont été modifiés dans S9.

### Mission S10

Caractériser puis figer le contrat **Toucher / Défense / Esquive** en rendant
explicites les différences Dungeon/Tactical, sans modifier le résultat actuel.

Divergences déjà observées :
- Dungeon utilise un D100 haut : réussite sur `101 - chance` ou plus ;
- Dungeon applique une pénalité Défense uniquement quand la Défense dépasse la
  caractéristique d'attaque, via `defensePenaltyPerPoint` ;
- Dungeon résout ensuite l'Esquive par un second jet séparé après une touche ;
- Tactical V2 soustrait directement Défense + Esquive + couvert à la chance de
  toucher, puis V114.11 affiche/résout aussi le D100 en mode haut ;
- Tactical fixe actuellement les bornes finales à 5..95 dans sa chaîne ;
- Dungeon peut configurer `hitChanceMin`, `hitChanceMax` et
  `defensePenaltyPerPoint`.

### Frontière architecturale S10

Core Stats peut fournir :
- caractéristiques canoniques ;
- Défense canonique ;
- Esquive canonique ;
- modificateurs `hit:melee`, `hit:ranged`, `hit:magic`.

Core Stats ne doit pas :
- devenir propriétaire du jet D100 ;
- appliquer Défense, Esquive ou couvert à une chance finale ;
- choisir entre la formule Dungeon et la formule Tactical ;
- lancer un RNG ;
- appliquer une touche, un critique ou des dégâts.

Dungeon et Tactical restent propriétaires de leur résolution tant qu'un moteur
combat commun n'existe pas.

### Première action obligatoire S10

1. vérifier le graphe actif exact des propriétaires de toucher ;
2. caractériser le même attaquant/cible dans Dungeon et Tactical ;
3. faire varier caractéristique attaquante, Défense, Esquive, couvert,
   `hitChanceMin/max`, `defensePenaltyPerPoint` et bonus hit ;
4. prouver la sémantique D100 finale visible ;
5. distinguer modificateurs Core et résolution combat ;
6. ne créer aucun nouveau résolveur commun pendant la caractérisation ;
7. utiliser le `index.html` local vérifié si son blob reste
   `5b9b9ae780f735eadef049afeb10acf0b57441fe`, sinon règle 26 ;
8. seulement après cette preuve décider si S10 nécessite un contrat Core de
   données ou si les sentinelles suffisent.

### Interdictions S10

- aucune modification de formule Toucher/Défense/Esquive pendant l'audit ;
- aucun changement du sens du D100 ;
- aucune fusion de l'Esquive dans Dungeon ou séparation dans Tactical ;
- aucun changement de couvert ;
- aucun changement des bornes hit ;
- aucun changement Armor/Résistances/S11 dégâts ;
- aucun nouveau wrapper global, observer, timer/retry ou monkey-patch ;
- aucun changement sur `main`.


### Caractérisation S10 confirmée

Document :
`docs/GENSRPG_PHASE4_STATS_S10_HIT_DEFENSE_DODGE_AUDIT.md`.

Sentinelle comparative :
`tests/gens_phase4_stats_s10_hit_defense_dodge_characterization_v1.test.cjs`.

Commits :
- test : `e177bb3a109669c15a993ca04638c1937b5c6dbc` ;
- CI : `8ace19da3992499f38b2c54ac195d3be3c81f9b7` ;
- décision/documentation :
  `17a3b41734ee748ab440349b76597fbd3b42e859`.

Le test S10 passe dans le job Architecture `35594837513`.

Contrat verrouillé :
- Dungeon : pénalité Défense seulement au-dessus de la caractéristique
  attaquante, Esquive sur second D100, bornes hit configurables ;
- Tactical : Défense + Esquive + couvert retirés avant le D100,
  bornes 5..95 ;
- les deux affichent/résolvent actuellement le D100 final en réussite haute ;
- Core Stats fournit uniquement valeurs/modificateurs et ne résout pas hit/miss.

### Décision S10

Aucun nouveau module Core n'est nécessaire ni autorisé dans ce lot.
Créer un résolveur commun maintenant introduirait une seconde autorité de
combat et violerait la charte.

S10 est donc un lot de caractérisation/contrat d'autorité.

Aucune formule gameplay et aucun `index.html` n'ont été modifiés.

### Clôture S10 en cours

Le présent commit documentaire final doit repasser :
- Architecture + navigateur complet ;
- Firefox ;
- Tactical Dock.

Après trois SUCCESS :
1. créer
   `checkpoint/gensrpg-phase4-stats-s10-hit-defense-dodge-green-2026-09-21` ;
2. créer le checkpoint de départ S11 exactement sur ce SHA ;
3. ouvrir une branche dédiée
   `work/gensrpg-phase4-stats-s11-damage-boundary-2026-09-21` ;
4. démarrer S11 par la caractérisation de la frontière dégâts finale, sans
   modifier arme, type, résistance, armure, critique ou PV pendant l'audit.


## Chantier courant prioritaire — Phase 4 Core Stats / S9 contrat Armure — 2026-09-21

Ce bloc est le point de reprise actif ; les sections suivantes sont historiques.

- Branche : `work/gensrpg-phase4-stats-s9-armor-contract-2026-09-21`.
- Checkpoint de départ :
  `checkpoint/gensrpg-start-phase4-stats-s9-armor-contract-2026-09-21`.
- Base exacte et dernier GREEN :
  `a1a7d7ccd4183db30b258898aed4c0207c4a30aa`.
- Dernier checkpoint GREEN :
  `checkpoint/gensrpg-phase4-stats-s8-resistance-normalization-green-2026-09-21`.
- Production gelée :
  `main = e8681f9823573ced8aec59c8ddc47a72b02bc663`, V16.78.114.11.

### S8 définitivement clôturé

HEAD final :
`a1a7d7ccd4183db30b258898aed4c0207c4a30aa`.

Runs du SHA documentaire final :
- Architecture + navigateur complet : `35589709948` — SUCCESS ;
- Firefox : `35589709934` — SUCCESS ;
- Tactical Dock : `35589709928` — SUCCESS.

Checkpoint :
`checkpoint/gensrpg-phase4-stats-s8-resistance-normalization-green-2026-09-21`.

`stats-resistance-normalization-v1.js` reste Phase 4 inert.
Aucun raccord runtime, aucune formule de résistance, aucun pourcentage et aucun
`index.html` n'ont été modifiés dans S8.

### Mission S9

Caractériser puis figer le **contrat sémantique Armure** sans choisir
arbitrairement une formule commune et sans modifier les résultats actuels.

Divergence déjà prouvée par le pré-audit :
- Dungeon classique calcule un `armorScore`, puis un `armorReduction` via
  `armorReductionStep` / `armorReductionGain`, puis applique cette réduction ;
- Tactical transporte historiquement un score d'armure puis le soustrait
  directement aux dégâts physiques dans son chemin final ;
- la règle de plancher/blocage `armorZeroBlockChance` appartient encore à la
  résolution combat et ne doit pas être absorbée silencieusement par Core Stats.

S9 doit rendre ces sens explicites et comparables avant toute consolidation.

### Frontières obligatoires S9

S9 peut :
- cartographier les propriétaires actifs Armor Dungeon et Tactical ;
- relever les sources/configurations de `armorScore`, `armorReductionStep`,
  `armorReductionGain` et `armorZeroBlockChance` ;
- caractériser les mêmes entrées dans Dungeon et Tactical ;
- distinguer score, réduction calculée, plancher/blocage et dégâts finaux ;
- préparer un contrat pur/inert uniquement après TDD RED et preuve comparative.

S9 ne doit pas :
- changer une valeur ou formule d'armure ;
- décider que `armorScore === armorReduction` ;
- toucher résistances S8 ;
- toucher hit/D100/Défense/Esquive S10 ;
- toucher la frontière dégâts finale S11 ;
- modifier Equipment/Talents/Challenge ;
- raccorder un nouveau lecteur Armor au runtime avant caractérisation ;
- ajouter wrapper global, MutationObserver, timer/retry ou monkey-patch ;
- modifier `main`.

### Première action obligatoire S9

Avant toute création de module :
1. confirmer le graphe de chargement réel des propriétaires Armor ;
2. relire les helpers Dungeon `dungeonArmorScore`,
   `dungeonArmorReductionFromScore`, `dungeonMitigationForHero` et leurs
   callsites actifs ;
3. relire les snapshots/acteurs Tactical qui transportent `armor` ;
4. relire le résolveur final Tactical V114.11 et les sentinelles dégâts/armure ;
5. relever la provenance et la priorité des règles
   `armorReductionStep`, `armorReductionGain`, `armorZeroBlockChance` ;
6. construire une matrice comparative avec valeurs par défaut et personnalisées ;
7. utiliser le `index.html` exact déjà vérifié si son blob est inchangé ;
   sinon appliquer immédiatement la règle 26 ;
8. seulement ensuite figer le contrat S9 et poser le TDD RED.

### Interdictions S9

- aucun changement de formule Armor pendant l'audit ;
- aucune migration Dungeon/Tactical pendant la caractérisation ;
- aucun retrait de lecteur historique avant preuve comparative ;
- aucun changement des dégâts finaux ;
- aucun nouveau global de réparation ;
- aucun MutationObserver ;
- aucun timer/retry ;
- aucun changement sur `main`.


### Audit, TDD et extraction S9 confirmés

Document :
`docs/GENSRPG_PHASE4_STATS_S9_ARMOR_AUDIT.md`.

Caractérisation réelle :
- test `gens_phase4_stats_s9_armor_characterization_v1.test.cjs` — SUCCESS ;
- Dungeon conserve `armorScore -> armorReductionStep/gain` ;
- Tactical V114.11 conserve `armorScore` comme réduction directe 1:1 ;
- `armorZeroBlockChance` reste une politique de résolution combat séparée.

RED TDD :
- commit `f8200858ffdd2774d76d6556db5e784549ec6d2f` ;
- run Architecture `35591023912` — FAILURE attendu ;
- cause exacte :
  `ENOENT assets/gensrpg/core/stats-armor-contract-v1.js`.

Extraction :
- module pur/inert :
  `assets/gensrpg/core/stats-armor-contract-v1.js` ;
- commit d'implémentation :
  `6f25da84e83461f53d5d9b6171aed90768f44090` ;
- classification Phase 4 inert :
  `6db3b0ca36c5d91c420be961cf26eae416cd0b7b`.

### Validation technique S9

HEAD technique :
`6db3b0ca36c5d91c420be961cf26eae416cd0b7b`.

Runs :
- Architecture + navigateur complet : `35591282497` — SUCCESS ;
- Firefox : `35591282377` — SUCCESS ;
- Tactical Dock : `35591282374` — SUCCESS.

Aucun raccord runtime, aucune formule Armor/dégâts et aucun `index.html` n'ont
été modifiés. Le nouveau contrat reste hors graphe de production.

### Clôture S9 en cours

Le document S9 a été mis à jour au commit
`e0da919bdcadeade405466081d0b9d03900977bb`.

Le présent commit documentaire final doit repasser les trois batteries avant :
1. création du checkpoint
   `checkpoint/gensrpg-phase4-stats-s9-armor-contract-green-2026-09-21` ;
2. création du checkpoint de départ S10 sur exactement ce SHA ;
3. ouverture d'une branche dédiée
   `work/gensrpg-phase4-stats-s10-hit-defense-dodge-2026-09-21`.

S10 devra commencer par la caractérisation comparative **Toucher / Défense /
Esquive** Dungeon vs Tactical, sans modifier la formule et sans déplacer
l'autorité de résolution combat vers Core Stats.


## Chantier courant prioritaire — Phase 4 Core Stats / S8 normalisation des résistances — 2026-09-21

Ce bloc est le point de reprise actif ; les sections suivantes sont historiques.

- Branche : `work/gensrpg-phase4-stats-s8-resistance-normalization-2026-09-21`.
- Checkpoint de départ :
  `checkpoint/gensrpg-start-phase4-stats-s8-resistance-normalization-2026-09-21`.
- Base exacte et dernier GREEN :
  `e7443fbaf1bffb8f53685cc33d7af5858a54db4e`.
- Dernier checkpoint GREEN :
  `checkpoint/gensrpg-phase4-stats-s7-core-snapshot-green-2026-09-21`.
- Production gelée :
  `main = e8681f9823573ced8aec59c8ddc47a72b02bc663`, V16.78.114.11.

### S7 définitivement clôturé

HEAD final :
`e7443fbaf1bffb8f53685cc33d7af5858a54db4e`.

Runs du SHA documentaire final :
- Architecture + navigateur complet : `35586111254` — SUCCESS ;
- Firefox : `35586111268` — SUCCESS ;
- Tactical Dock : `35586111294` — SUCCESS.

Checkpoint :
`checkpoint/gensrpg-phase4-stats-s7-core-snapshot-green-2026-09-21`.

`stats-snapshot-v1.js` reste Phase 4 inert.
Aucun snapshot historique, aucun Adapter Tactical et aucune formule combat
n'ont été remplacés dans S7.

### Mission S8

Normaliser le **contrat de données des résistances** sans modifier leur valeur,
leur pourcentage ni leur application gameplay.

Divergence déjà prouvée par le pré-audit :
- l'éditeur / certaines données héros produisent une forme tableau
  `[{kind,value}, ...]` ;
- le snapshot Tactical V110 consomme historiquement des objets
  `{ fire: 25, ... }` et ignore certaines formes tableau.

S8 doit fournir une représentation canonique commune capable de lire les deux
formes sans déplacer l'autorité des systèmes qui possèdent les résistances.

### Frontières obligatoires S8

S8 peut :
- caractériser toutes les formes de résistances réellement chargées ;
- normaliser array/object vers un contrat pur et déterministe ;
- préserver exactement les valeurs numériques actuelles ;
- préparer une API Core inert ;
- comparer Dungeon et Tactical avant tout raccord.

S8 ne doit pas :
- changer un pourcentage ;
- appliquer une résistance à un dégât ;
- modifier la priorité ou le stacking gameplay sans preuve du comportement
  historique ;
- toucher Armor S9 ;
- toucher hit/D100/Défense/Esquive S10 ;
- toucher dégâts finaux S11 ;
- ajouter HP/mana courants au snapshot S7 ;
- modifier Equipment/Talents/Challenge ;
- ajouter wrapper global, observer, timer/retry ;
- modifier `main`.

### Première action obligatoire S8

Avant toute création de module :
1. relire les producteurs de résistances héros/éditeur ;
2. relire `gensNormalizeResistances` et ses callsites actifs ;
3. relire V110 `collectResistanceObjects`, `resistanceSnapshot`,
   `resistanceFor` et les tests Tactical associés ;
4. relever les formes array/object réellement présentes et leurs règles en cas
   de doublons/valeurs invalides ;
5. distinguer **normalisation de données** et **application aux dégâts** ;
6. confirmer le graphe de chargement réel ;
7. réutiliser le `index.html` exact déjà vérifié si son blob est inchangé ;
   sinon appliquer immédiatement la règle 26 ;
8. seulement après cette cartographie, figer le contrat S8 et poser le TDD RED.

### Interdictions S8

- aucun raccord runtime avant audit + TDD ;
- aucune modification de formule résistance ;
- aucune suppression de lecteur historique avant preuve comparative ;
- aucun changement Tactical final damage ;
- aucun nouveau global de réparation ;
- aucun MutationObserver ;
- aucun timer/retry ;
- aucun changement sur `main`.

### Audit, TDD et extraction S8 confirmés

Document de chantier :
`docs/GENSRPG_PHASE4_STATS_S8_RESISTANCE_NORMALIZATION.md`.

Contrat retenu :
- représentation canonique ordonnée `{key,value}` immuable ;
- array générique et object Tactical convergent sans appliquer de dégâts ;
- doublons préservés jusqu'à projection explicite ;
- `sum` reproduit la sémantique générique additive ;
- `last` reproduit la priorité historique V110 ;
- les tableaux Capture d'IDs ne sont pas interprétés comme résistances numériques.

RED TDD :
- commit `f0ea7ad0d3ef12d3483465ebeba1ec3227a019b5` ;
- Architecture `35587505339` — FAILURE attendu ;
- cause exacte : `ENOENT assets/gensrpg/core/stats-resistance-normalization-v1.js` ;
- Firefox `35587505241` — SUCCESS ;
- Tactical Dock `35587505324` — SUCCESS.

Extraction :
- module `assets/gensrpg/core/stats-resistance-normalization-v1.js` :
  `e123d195dbc06b892db82c5a56e629b14affd72b` ;
- classification Phase 4 inert :
  `e55c6efb03c4c57b89c805d0ec3b453207b9a729` ;
- correction de l'attente de test additive/clamp :
  `e109ef34ef45941347f6e9d1f27cafc8827857b5`.

### Validation technique S8

HEAD fonctionnel technique :
`e109ef34ef45941347f6e9d1f27cafc8827857b5`.

Runs :
- Architecture + navigateur complet : `35589043087` — SUCCESS ;
- Firefox : `35589043070` — SUCCESS ;
- Tactical Dock : `35589043075` — SUCCESS.

Aucun `index.html`, runtime Tactical/Dungeon, formule de dégâts, pourcentage
de résistance ou application gameplay n'a été modifié. Le nouveau module reste
hors graphe de production.

### Clôture S8 en cours

Le document S8 a été fermé techniquement au commit :
`1256899ce8c790f4e635cbf45ed644428da3cf5d`.

Le présent commit `GENSRPG_CURRENT_WORK.md` devient le candidat documentaire
final S8. Il doit repasser les trois batteries.

Après trois SUCCESS :
1. créer `checkpoint/gensrpg-phase4-stats-s8-resistance-normalization-green-2026-09-21`
   sur le SHA documentaire final validé ;
2. créer le checkpoint de départ S9 sur exactement ce SHA ;
3. ouvrir une branche dédiée S9 — contrat Armure ;
4. ne modifier aucune formule Armor avant caractérisation comparative
   Dungeon/Tactical.


## Chantier courant prioritaire — Phase 4 Core Stats / S7 snapshot Core unique — 2026-09-21

Ce bloc est le point de reprise actif ; les sections suivantes sont historiques.

- Branche : `work/gensrpg-phase4-stats-s7-core-snapshot-2026-09-21`.
- Checkpoint de départ : `checkpoint/gensrpg-start-phase4-stats-s7-core-snapshot-2026-09-21`.
- Base exacte et dernier GREEN : `a98c32968fbb32a32827c7f6d03b9666db392be8`.
- Dernier checkpoint GREEN :
  `checkpoint/gensrpg-phase4-stats-s6-derived-values-green-2026-09-21`.
- Production gelée :
  `main = e8681f9823573ced8aec59c8ddc47a72b02bc663`, V16.78.114.11.

### S6 définitivement clôturé

HEAD final :
`a98c32968fbb32a32827c7f6d03b9666db392be8`.

Runs du SHA documentaire final :
- Architecture + navigateur complet : `35582184736` — SUCCESS ;
- Firefox : `35582184710` — SUCCESS ;
- Tactical Dock : `35582184728` — SUCCESS.

Checkpoint :
`checkpoint/gensrpg-phase4-stats-s6-derived-values-green-2026-09-21`.

`stats-derived-values-v1.js` reste Phase 4 inert.
Aucun helper historique, aucun `index.html`, aucune formule de combat et aucun
snapshot Tactical n'ont été modifiés.

### Mission S7

Caractériser puis préparer un **snapshot Core Stats unique et immuable** contenant
uniquement les valeurs canoniques et dérivées déjà couvertes par S1 -> S6.

La cible est d'éliminer à terme les doubles lectures Stats lors de la construction
des acteurs Tactical, sans déplacer l'autorité combat.

Chaînes historiques à caractériser avant toute implémentation :
- `dungeonCombatHeroSnapshot` inline ;
- Tactical Adapter / `heroSnapshot` / création d'acteur ;
- V110 `buildHeroSnapshot` + `applyHeroSnapshot` ;
- éventuelles relectures Stats/Dungeon après création de l'acteur ;
- V114.5 snapshot/repair uniquement comme dette historique si toujours hors graphe.

### Frontières obligatoires S7

Le snapshot Core peut transporter les valeurs canoniques et dérivées S1-S6,
mais S7 ne doit pas décider ni modifier :
- la normalisation des résistances S8 ;
- le contrat armorScore / armorReduction S9 ;
- la formule finale toucher / Défense / Esquive S10 ;
- les dégâts finaux S11 ;
- l'ordre/tour, la ligne de vue, le couvert ou le D100 ;
- HP/mana courants ;
- Inventory/Equipment/Talents/Challenge ;
- UI, stockage ou progression.

Aucune ancienne lecture/snapshot ne doit être retirée avant preuve comparative
explicite de parité et identification de son vrai propriétaire.

### Première action obligatoire S7

Avant toute création ou raccord de module :
1. relire les propriétaires snapshot actifs et leurs sentinelles ;
2. reconstruire le chemin exact héros -> Stats -> snapshot Dungeon -> Adapter ->
   V110 -> acteur Tactical ;
3. relever toutes les relectures de valeurs après le snapshot initial ;
4. distinguer snapshot de données et résolution combat ;
5. confirmer les fichiers réellement chargés par le graphe production ;
6. classer V114.5 comme actif ou dormant par preuve de graphe ;
7. définir seulement ensuite le contrat du snapshot immuable et le TDD ;
8. si un corps inline exact de `index.html` est indispensable, appliquer
   immédiatement la règle 26 avec le SHA exact.

### Interdictions S7

- aucun changement de formule ;
- aucun changement Armor / toucher / D100 / résistances ;
- aucun retrait de lecteur historique avant parité ;
- aucun nouveau wrapper global ;
- aucun MutationObserver ;
- aucun timer/retry ;
- aucun changement sur `main`.

### Audit et TDD S7 confirmés

Audit :
`docs/GENSRPG_PHASE4_STATS_S7_SNAPSHOT_AUDIT.md`.

Chaîne active prouvée :
`dungeonCombatHeroSnapshot -> Tactical Adapter -> V110 build/apply snapshot`.

V114.5 reste hors graphe production.

RED TDD :
- commit `10160ba820e906a6cc4392dfa1768fc8c56508b2` ;
- Architecture `35585364039` — FAILURE attendu ;
- cause exacte : `ENOENT assets/gensrpg/core/stats-snapshot-v1.js`.

### Extraction S7 technique GREEN

Module :
`assets/gensrpg/core/stats-snapshot-v1.js`.

Commit module :
`60d07a948e00ec887d119328a89ac3aeacd941c6`.

Classification inert :
`70c6290434ba9c4e06ac905e7105452126626810`.

Le snapshot :
- transporte uniquement valeurs canoniques + dérivées S6 stables ;
- est immuable ;
- exclut ressources de session, résistances, règles et résolution combat ;
- ne lit aucun global Dungeon/Tactical.

Runs du HEAD technique `70c6290434ba9c4e06ac905e7105452126626810` :
- Architecture + navigateur complet : `35585530549` — SUCCESS ;
- Firefox : `35585530588` — SUCCESS ;
- Tactical Dock : `35585530540` — SUCCESS.

Aucun fichier runtime historique ni `index.html` n'a été modifié.
Le module S7 reste Phase 4 inert.

### Clôture S7 en cours

Document technique mis à jour au commit :
`16ca979dd2ceb5ba06957908bdb0b386555fceee`.

Le présent commit CURRENT_WORK devient le SHA documentaire final candidat.
Il doit repasser :
- Architecture + navigateur complet ;
- Firefox ;
- Tactical Dock.

Après trois SUCCESS :
1. créer `checkpoint/gensrpg-phase4-stats-s7-core-snapshot-green-2026-09-21` ;
2. ouvrir S8 depuis ce checkpoint ;
3. S8 = normalisation des résistances array/object sans changer les pourcentages
   ni leur application Dungeon/Tactical.



# GenSrpG — Travail courant


## Chantier courant prioritaire — Phase 4 Core Stats / S6 dérivées génériques — 2026-09-21

Ce bloc est le point de reprise actif ; les sections suivantes sont historiques.

- Branche : `work/gensrpg-phase4-stats-s6-derived-values-2026-09-21`.
- Checkpoint de départ : `checkpoint/gensrpg-start-phase4-stats-s6-derived-values-2026-09-21`.
- Base exacte et dernier GREEN : `c96650bf133432091c0adcf1a2c1a85686d0079b`.
- Dernier checkpoint GREEN :
  `checkpoint/gensrpg-phase4-stats-s5-modifier-providers-green-2026-09-21`.
- Production gelée :
  `main = e8681f9823573ced8aec59c8ddc47a72b02bc663`, V16.78.114.11.

### S5 définitivement clôturé

HEAD final :
`c96650bf133432091c0adcf1a2c1a85686d0079b`.

Runs du SHA documentaire final :
- Architecture + navigateur complet : `35578208916` — SUCCESS ;
- Firefox : `35578208932` — SUCCESS ;
- Tactical Dock : `35578208847` — SUCCESS.

Checkpoint :
`checkpoint/gensrpg-phase4-stats-s5-modifier-providers-green-2026-09-21`.

Le provider `stats-modifier-provider-v1.js` reste Phase 4 inert.
Aucun propriétaire Equipment/Talents/Challenge n'a été déplacé.

### Mission S6

Caractériser puis extraire uniquement les **dérivées génériques dont la
sémantique actuelle est déjà stable**, sans déplacer la résolution combat.

Candidats issus du pré-audit :
- bonus dégâts physiques / magiques ;
- bonus / maximum HP ;
- maximum mana ;
- critique ;
- esquive ;
- initiative ;
- résistance magique ;
- modificateurs de toucher déjà exprimés comme cibles Stats.

### Frontières obligatoires

S6 ne doit pas décider ni modifier :
- l'application finale de Défense ;
- l'application/réduction finale d'Armure ;
- la formule finale de toucher Dungeon ou Tactical ;
- le D100 ;
- les résistances élémentaires/génériques ;
- les dégâts finaux Tactical ;
- les HP/mana courants ;
- le snapshot Tactical S7.

Les divergences connues Défense/Armure/toucher/résistances restent réservées aux
lots dédiés plus tard dans la roadmap.

### Première action obligatoire S6

Avant toute création de module :
1. relire les wrappers de dérivées dans `gens-rpg-stats-clean-167874.js` ;
2. relever les helpers historiques exacts et leurs règles/fallbacks ;
3. relire les tests existants HP/mana/crit/dodge/initiative/magic resistance/
   damage/hit ;
4. distinguer une dérivée réellement générique d'une résolution combat ;
5. vérifier quelles formules sont inline et lesquelles sont externes ;
6. si le corps exact d'une formule inline est indispensable, appliquer
   immédiatement la règle 26 avant toute inspection/modification de
   `index.html` ;
7. poser un document d'audit et un RED de caractérisation avant tout nouveau
   module.

### Interdictions S6

- aucun changement de formule ;
- aucun raccord Tactical ;
- aucun changement Inventory/Equipment/Talents/Challenge ;
- aucun stockage/UI/progression ;
- aucun nouveau wrapper global ;
- aucun MutationObserver ;
- aucun timer/retry ;
- aucun changement sur `main`.



### Audit S6 dérivées — résultat

Document :
`docs/GENSRPG_PHASE4_STATS_S6_DERIVED_AUDIT.md`.

Sentinelle :
`tests/gens_phase4_stats_s6_derived_audit_v1.test.cjs`.

Commit de branchement CI :
`0fc7ba8aca7d908eea71677745123a87a825d8c6`.

La sentinelle S6 passe SUCCESS dans Architecture sur le run
`35578976608`.

Classification :
- additive stable : physical damage bonus, magic damage bonus, HP bonus,
  initiative ;
- plancher 0 stable : max mana, magic resistance ;
- cap configurable stable : crit, dodge ;
- exclus S6 : application Défense, application Armure, mouvement,
  mutation d'attaque `applyDungeonCombatScaling`, D100, résistances
  élémentaires/génériques, dégâts finaux.

Le wrapper `applyDungeonCombatScaling` reste une frontière Combat/Equipment :
S3 sait déjà produire les totaux `hit:*` et `damage:ranged`, mais S6 ne doit
pas muter une attaque ni calculer le toucher final.

### Règle 26 S6 — déclenchée

Pour extraire les formules complètes sans approximation, le corps exact des
helpers historiques inline est requis.

SHA exact demandé :
`8f6fa73c365a107e50fa759346955354ddfa59ea`.

Permalink :
`https://github.com/slyen4425-cloud/Zombicide-40k/blob/8f6fa73c365a107e50fa759346955354ddfa59ea/index.html`.

Procédure :
1. télécharger ce `index.html` exact ;
2. le compresser en ZIP ;
3. l'envoyer dans le fil ;
4. vérifier blob/taille avant inspection ;
5. inspecter uniquement les helpers S6 ;
6. poser ensuite le RED de parité et le moteur pur ;
7. ne modifier aucun runtime historique dans l'extraction pure.

Aucune ancienne copie locale ne doit être utilisée.


### Règle 26 S6 — satisfaite

Le fichier fourni dans le fil a été vérifié avant inspection :
- taille : `8 174 580` octets ;
- blob Git : `5b9b9ae780f735eadef049afeb10acf0b57441fe` ;
- contenu exact du `index.html` du commit d'ouverture S6
  `8f6fa73c365a107e50fa759346955354ddfa59ea`.

Les huit helpers inline S6 ont été inspectés uniquement dans ce périmètre.
Les formules exactes step / percent / perPoint et les doubles floor/cap
historiques ont été figées dans le document S6.

### TDD et extraction S6

RED :
`aa67d61ff3afaa806163ceb6887f74dcc041a9d1`.

Run Architecture :
`35581291799` — FAILURE attendu uniquement sur l'absence de
`assets/gensrpg/core/stats-derived-values-v1.js`.

Moteur pur :
`assets/gensrpg/core/stats-derived-values-v1.js`.

Commit d'extraction :
`32888007ac32352e30733983e3f8889915562efa`.

API :
`GensStatsDerivedValuesV1.derive(config)`.

Le moteur produit les dérivées stables :
- bonus dégâts physique ;
- bonus dégâts magie ;
- bonus PV max ;
- mana max ;
- critique ;
- esquive ;
- initiative ;
- résistance magique.

Il reste source-agnostic et ne lit aucun global runtime.

### Graphe et GREEN technique S6

Commit de classification inert :
`a142c1cdf9c7a54816d50d59a53716ec2aed2f83`.

Le moteur S6 est **Phase 4 inert** :
- non chargé par Pages ;
- non chargé par `preview.html` ;
- aucun raccord Tactical ;
- aucun changement de propriétaire runtime.

Runs du HEAD technique :
- Architecture + navigateur complet : `35581520003` — SUCCESS ;
- Firefox : `35581520029` — SUCCESS ;
- Tactical Dock : `35581520057` — SUCCESS.

Le navigateur complet valide Survie, Fouiller + arts, Dungeon après Survie,
Builder, Config objet, fiche RPG, authored, Save & Quit/reprise, PvP, Capture,
non-interférence, murs Tactical, preview et assets.

### Prochaine action S6

1. repasser Architecture+navigateur, Firefox et Tactical Dock sur le SHA
   documentaire final ;
2. si les trois sont SUCCESS, créer
   `checkpoint/gensrpg-phase4-stats-s6-derived-values-green-2026-09-21` ;
3. ouvrir S7 depuis ce checkpoint ;
4. S7 = snapshot Core Stats unique ;
5. ne supprimer aucun ancien snapshot/reader avant preuve de parité et ne pas
   modifier les formules de combat.


## Chantier courant prioritaire — Phase 4 Core Stats / S5 providers de modificateurs — 2026-09-21

Ce bloc est le point de reprise actif ; les sections suivantes sont historiques.

- Branche : `work/gensrpg-phase4-stats-s5-modifier-providers-2026-09-21`.
- Checkpoint de départ : `checkpoint/gensrpg-start-phase4-stats-s5-modifier-providers-2026-09-21`.
- Base exacte et dernier GREEN : `46276b1f9c946f179ea7b1fea3f5fad6420bfa66`.
- Dernier checkpoint GREEN : `checkpoint/gensrpg-phase4-stats-s4-hero-values-green-2026-09-21`.
- Production gelée : `main = e8681f9823573ced8aec59c8ddc47a72b02bc663`, V16.78.114.11.

### S4 définitivement clôturé

HEAD final :
`46276b1f9c946f179ea7b1fea3f5fad6420bfa66`.

Runs du SHA documentaire final :
- Architecture + navigateur complet : `35575846530` — SUCCESS ;
- Firefox : `35575846469` — SUCCESS ;
- Tactical Dock : `35575846460` — SUCCESS.

Checkpoint :
`checkpoint/gensrpg-phase4-stats-s4-hero-values-green-2026-09-21`.

`stats-hero-values-v1.js` reste Phase 4 inert et ne déplace aucune autorité runtime.

### Mission S5

Préparer puis extraire le contrat de **modificateurs externes de caractéristiques**
sans déplacer leurs systèmes propriétaires.

Sources historiques à caractériser :
- Equipment : `dungeonEquipmentBonus` et sa couche propriétaire active ;
- Talents/skills : `dungeonSkillEffectTotal` ;
- Challenges : `dungeonChallengeDebuffTotal067`.

Le futur Core Stats doit recevoir des lignes explicites de modificateurs ; il ne
doit jamais lire directement l'inventaire équipé, les talents, l'état challenge,
`CHARS`, `state` ou un profil courant pour fabriquer ces bonus.

### Frontière d'autorité S5

Inventory/Equipment reste propriétaire :
- des objets portés ;
- des bonus objet ;
- de l'évolution ;
- des sets ;
- de l'invalidation equip/unequip.

Talents reste propriétaire :
- des talents appris/actifs ;
- de leur sémantique ;
- de leurs valeurs.

Challenge reste propriétaire :
- de l'état challenge ;
- de ses malus/bonus ;
- de leur activation.

Core Stats S5 ne connaît que des modificateurs normalisés :
id / target / value / source / enabled.

### Première action obligatoire

Avant toute création de module :
1. relire les propriétaires actifs Equipment/Talents/Challenge ;
2. relire leurs sentinelles existantes ;
3. déterminer si les fonctions Talent/Challenge sont externes ou inline ;
4. confirmer le chemin réellement chargé par Pages/preview ;
5. si l'inspection exacte de `index.html` devient nécessaire, appliquer
   immédiatement la règle 26 de la charte au lieu de tenter de transférer 8 Mo ;
6. seulement après cette cartographie S5, définir le TDD et le fichier Core.

### Interdictions S5

- aucune modification de formule Equipment/Talent/Challenge ;
- aucune modification Armor / hit / D100 / résistances ;
- aucune dérivée S6 ;
- aucun snapshot Tactical ;
- aucune UI/persistance ;
- aucun nouveau wrapper global ;
- aucun MutationObserver ;
- aucun timer/retry ;
- aucun changement sur `main`.


### Cartographie S5 confirmée

- Equipment reste propriétaire de son seam agrégé `dungeonEquipmentBonus` ;
- `dungeon-core-316.js` ajoute les sets ;
- `gens-equipment-stat-cleanup-1678102.js` ajoute l'évolution et son invalidation ;
- la couche performance cache le seam final sans changer son ownership ;
- Talents reste derrière `dungeonSkillEffectTotal` ;
- Challenge reste derrière `dungeonChallengeDebuffTotal067` ;
- aucun de ces systèmes n'est recopié dans Core.

La règle 26 n'a pas été déclenchée :
S5 ne modifie aucun callsite inline du gros `index.html`.

### TDD S5 observé

RED :
`5c8449234b829cb2a7c647b704f17c26253829ec`.

Architecture `35577545243` a échoué exactement sur la nouvelle sentinelle S5 :
`ENOENT` pour
`assets/gensrpg/core/stats-modifier-provider-v1.js`.

### Implémentation S5

Module pur :
`assets/gensrpg/core/stats-modifier-provider-v1.js`.

Commit :
`30234d1a76c80d7331ed1fbf95d8758c1141a420`.

API :
`GensStatsModifierProviderV1.collect(config)`.

Entrées :
definitions + sources explicites.

Sortie :
lignes `StatModifier` directement consommables par S3.

Aucun nom Equipment/Talent/Challenge et aucun ID spécial de stat n'est codé dans
le Core.

### Graphe / inertie

HEAD technique :
`661ab77e8a2ef9cefaec66c71d1c61d9c899d50d`.

Le nouveau provider est classé Phase 4 inert.
Inventaire JS physique : 85 -> 86.
Graphe production inchangé ; aucun chargement Pages/preview.

### Validation GREEN technique S5

Runs sur `661ab77e8a2ef9cefaec66c71d1c61d9c899d50d` :
- Architecture + navigateur complet : `35577612459` — SUCCESS ;
- Firefox : `35577612420` — SUCCESS ;
- Tactical Dock : `35577612410` — SUCCESS.

### Prochaine action

1. faire repasser les trois workflows sur le SHA documentaire final ;
2. après trois SUCCESS, créer
   `checkpoint/gensrpg-phase4-stats-s5-modifier-providers-green-2026-09-21` ;
3. ouvrir S6 sur une branche neuve depuis ce GREEN ;
4. S6 = dérivées génériques à sémantique stable uniquement ;
5. ne pas commencer application finale Défense/Armure, toucher, D100 ou
   résistances.


## Chantier courant prioritaire — Phase 4 Core Stats / S4 provider valeurs héros — 2026-09-21

Ce bloc est le point de reprise actif ; les sections suivantes sont historiques.

- Branche : `work/gensrpg-phase4-stats-s4-hero-values-2026-09-21`.
- Checkpoint de départ : `checkpoint/gensrpg-start-phase4-stats-s4-hero-values-2026-09-21`.
- Base exacte et dernier GREEN : `d6d186fa48d417e76ff8a51dbdb0e67b3be1a00b`.
- Dernier checkpoint GREEN : `checkpoint/gensrpg-phase4-stats-s3-value-effects-green-2026-09-21`.
- Production gelée : `main = e8681f9823573ced8aec59c8ddc47a72b02bc663`, V16.78.114.11.

### S3 définitivement clôturé

HEAD final :
`d6d186fa48d417e76ff8a51dbdb0e67b3be1a00b`.

Runs :
- Architecture + navigateur complet : `35565851641` — SUCCESS ;
- Firefox : `35565851627` — SUCCESS ;
- Tactical Dock : `35565851625` — SUCCESS.

Checkpoint :
`checkpoint/gensrpg-phase4-stats-s3-value-effects-green-2026-09-21`.

Le moteur pur `stats-value-engine-v1.js` reste Phase 4 inert.

### Mission S4

Créer un provider pur transformant des données héros explicites en `baseValues`
pour S3.

Cible :
`assets/gensrpg/core/stats-hero-values-v1.js`.

Entrées :
- definitions ;
- definitionValues ;
- runtimeValues (objet ou null) ;
- fallbackValues ;
- clampWithoutRuntime.

Sortie :
- baseValues ;
- détails de provenance/clamp.

### Priorité

Pour chaque définition :
1. valeur runtime finie si un conteneur runtime existe ;
2. sinon valeur de définition héros finie ;
3. sinon fallback explicite ;
4. sinon defaultValue de la définition.

Quand un conteneur runtime existe, la valeur choisie est clampée [min,max].
Sans conteneur runtime, seules les stats listées dans `clampWithoutRuntime` sont
clampées. Cette entrée explicite permet de reproduire la distinction historique
sans graver defense/armor/movement dans le Core.

### Frontières

S4 ne lit aucun global du jeu et ne mute aucune entrée.
Il ne connaît ni Equipment/Talents/Challenges (S5), ni dérivées (S6), ni Tactical.

S4 reste inert en production.
Le propriétaire historique continue de fournir les valeurs runtime réelles.

### TDD

Comparer le provider pur aux fonctions historiques de résolution de base sur :
- héros actif avec valeurs runtime ;
- valeur runtime manquante ;
- stat custom au-dessus du max ;
- héros sans runtime ;
- comportement clamp/non-clamp sans runtime ;
- fallback mouvement explicite ;
- aliases ;
- absence de mutation.

Document :
`docs/GENSRPG_PHASE4_STATS_S4_HERO_VALUES.md`.


### TDD S4 observé

RED :
`5ca16a97bb02aecdc5880da2d8f8f0cd2a080b98`.

Architecture `35575341495` a échoué exactement sur la nouvelle sentinelle S4 :
`ENOENT` pour
`assets/gensrpg/core/stats-hero-values-v1.js`.

Les 100 étapes Architecture précédentes étaient SUCCESS.

### Implémentation S4

Module pur :
`assets/gensrpg/core/stats-hero-values-v1.js`.

Commit :
`c8d21f488b43c3160465b34c1f5b4822fc37b523`.

API :
`GensStatsHeroValuesV1.resolve(config)`.

Le provider reçoit uniquement :
definitions / definitionValues / runtimeValues / fallbackValues /
clampWithoutRuntime.

Il retourne :
baseValues + détails de provenance/clamp.

Aucun ID spécial historique n'est codé dans le Core.
Equipment / Talents / Challenges restent hors S4 et sont réservés à S5.

### Graphe / inertie

HEAD technique :
`fc06b2e01ce19a22539f919514a7f22bf7f9dd5a`.

Le nouveau provider est classé Phase 4 inert.
Inventaire JS physique : 84 -> 85.
Graphe production inchangé ; aucun chargement Pages/preview.

### Validation GREEN technique S4

Runs sur `fc06b2e01ce19a22539f919514a7f22bf7f9dd5a` :
- Architecture + navigateur complet : `35575443549` — SUCCESS ;
- Firefox : `35575443531` — SUCCESS ;
- Tactical Dock : `35575443522` — SUCCESS.

Parité verrouillée :
- runtime ;
- aliases ;
- valeur runtime manquante ;
- clamp avec runtime ;
- clamp/non-clamp sans runtime ;
- fallback explicite ;
- defaultValue ;
- provenance ;
- absence de mutation.

### Prochaine action

1. faire repasser les trois workflows sur le SHA documentaire final ;
2. après trois SUCCESS, créer
   `checkpoint/gensrpg-phase4-stats-s4-hero-values-green-2026-09-21` ;
3. ouvrir S5 sur une branche neuve depuis ce GREEN ;
4. S5 = providers de modificateurs Equipment / Talents / Challenges uniquement ;
5. ne pas commencer S6 dérivées, Tactical, Armor, Hit, D100 ou résistances.


## Chantier courant prioritaire — Phase 4 Core Stats / S3 moteur pur value-effects — 2026-09-21

Ce bloc est le point de reprise actif ; les sections suivantes sont historiques.

- Branche : `work/gensrpg-phase4-stats-s3-value-effects-2026-09-21`.
- Checkpoint de départ : `checkpoint/gensrpg-start-phase4-stats-s3-value-effects-2026-09-21`.
- Base exacte et dernier GREEN : `128d80747a9987dd8b90dc72508dae9707f23aab`.
- Dernier checkpoint GREEN : `checkpoint/gensrpg-phase4-stats-s2-authority-raccord-green-2026-09-21`.
- Production gelée : `main = e8681f9823573ced8aec59c8ddc47a72b02bc663`, V16.78.114.11.

### Raccord S2 définitivement clôturé

HEAD final :
`128d80747a9987dd8b90dc72508dae9707f23aab`.

Runs sur ce SHA exact :
- Architecture + navigateur complet : `35564807184` — SUCCESS ;
- Firefox : `35564807186` — SUCCESS ;
- Tactical Dock : `35564807337` — SUCCESS.

Checkpoint :
`checkpoint/gensrpg-phase4-stats-s2-authority-raccord-green-2026-09-21`.

La normalisation Core est désormais l'autorité active pour alias/slug/définitions/effets/comparaison,
chargée avant le propriétaire historique Stats.

### Mission S3

Créer un moteur **pur, déterministe et inactif en production** pour la composition
des valeurs et effets Stats.

Cible :
`assets/gensrpg/core/stats-value-engine-v1.js`.

API prévue :
- `create(config)` ;
- `baseValue(id)` ;
- `modifierTotal(id)` ;
- `value(id)` ;
- `effectAmount(effect)` ;
- `statEffectTotal(id)` ;
- `extraTotal(target)` ;
- `sourceEffectTotal(target,source)` ;
- `detail(id)`.

Entrées explicites :
- definitions ;
- active ;
- baseValues ;
- modifiers ;
- effects ;
- directValueTargets.

### Sémantique à préserver

`value(id)` :
1. définition absente ou inactive -> 0 ;
2. base brute clampée [min,max] ;
3. modificateurs externes ajoutés à la base ;
4. effets `stat:<id>` ajoutés ;
5. effets directs de même cible seulement si `id` appartient à
   `directValueTargets` ;
6. clamp final [min,max].

Cycle :
si l'ID est déjà dans `seen`, retour du `baseValue` actuel, comme le propriétaire
historique.

### Contrat de modificateur S3

`StatModifier` :
- id optionnel ;
- target : stat canonique ;
- value : nombre additif ;
- source optionnelle, descriptive seulement ;
- enabled true sauf false explicite.

S3 ne connaît pas Equipment/Talents/Challenges : les futurs providers S4/S5
construiront simplement ces lignes.

### Frontières strictes

S3 ne doit lire aucun :
- `CHARS` ;
- `state` ;
- profil actif ;
- inventory/equipment ;
- talent ;
- challenge ;
- DOM ;
- localStorage ;
- timer/retry ;
- MutationObserver ;
- Tactical.

S3 ne décide aucune formule :
- Armor ;
- toucher/Défense/Esquive ;
- résistances ;
- dégâts finaux ;
- critique final ;
- HP/mana courants.

### Stratégie d'autorité

Le nouveau moteur S3 reste **inert** pendant ce lot.
`GensCleanRpgStats167874.value()` reste l'unique autorité runtime.

S3 démontre seulement la parité sur des fixtures réelles.
Un raccord d'autorité ultérieur sera séparé et checkpointé.

### TDD

1. documenter le contrat ;
2. ajouter une sentinelle de parité S3 avant le module ;
3. obtenir RED parce que `stats-value-engine-v1.js` est absent ;
4. créer le moteur pur minimal ;
5. comparer bit à bit avec le moteur historique sur :
   base, modifiers, stat->stat, dérivée, threshold, clamp et cycle ;
6. vérifier `detail()` sans DOM ;
7. classer le nouveau fichier Phase 4 inert dans le graphe ;
8. repasser Architecture+navigateur, Firefox et Tactical Dock.

Document :
`docs/GENSRPG_PHASE4_STATS_S3_VALUE_EFFECTS.md`.

### TDD S3 observé

RED :
`18289e84e46bc06271f1dc8717ad12701898d75c`.

Cause exacte :
`ENOENT` sur `assets/gensrpg/core/stats-value-engine-v1.js`.

### Implémentation S3

Module pur :
`assets/gensrpg/core/stats-value-engine-v1.js`.

Commit d'extraction :
`0c7482dba1356221850ad1bc5fce858f0394c867`.

Le moteur reçoit uniquement :
definitions / active / baseValues / modifiers / effects / directValueTargets.

Il expose :
create, baseValue, modifierTotal, value, effectAmount, statEffectTotal,
extraTotal, sourceEffectTotal et detail.

Le module reste **Phase 4 inert** :
aucun chargement Pages/preview et aucune autorité runtime déplacée.

### Parité S3

Fixture réelle :
- force = 23 ;
- chance = 14 ;
- defense = 21 ;
- damage:physical = +6 ;
- max_hp = +5 ;
- cycle, clamp, aliases et cible directe préservés ;
- detail cohérent avec value.

### Validation GREEN technique S3

HEAD :
`fd29280b8848fa78b095271f53c70aa8d88ccca8`.

Runs :
- Architecture + navigateur complet : `35565475568` — SUCCESS ;
- Firefox : `35565475560` — SUCCESS ;
- Tactical Dock : `35565475567` — SUCCESS.

Aucun provider, aucune formule de combat, aucune UI/persistance et aucun snapshot
Tactical n'a changé.

### Prochaine action

La clôture documentaire S3 doit repasser les trois workflows sur son SHA exact.
Après trois SUCCESS :
- créer `checkpoint/gensrpg-phase4-stats-s3-value-effects-green-2026-09-21` ;
- ouvrir S4 depuis ce checkpoint ;
- S4 = provider de valeurs héros uniquement ;
- ne pas commencer Equipment/Talents/Challenges avant S5.


## Chantier courant prioritaire — Phase 4 Core Stats / raccord autorité normalisation — 2026-09-21

Ce bloc est le point de reprise actif ; les sections suivantes sont historiques.

- Branche : `work/gensrpg-phase4-stats-s2-authority-raccord-2026-09-21`.
- Checkpoint de départ : `checkpoint/gensrpg-start-phase4-stats-s2-authority-raccord-2026-09-21`.
- Base exacte et dernier GREEN : `d9929477332b9436a3da12fddc2b13777d2b4e0d`.
- Dernier checkpoint GREEN : `checkpoint/gensrpg-phase4-stats-s2-normalization-green-2026-09-21`.
- Production gelée : `main = e8681f9823573ced8aec59c8ddc47a72b02bc663`, V16.78.114.11.

### S2 normalisation pure définitivement clôturé

HEAD final :
`d9929477332b9436a3da12fddc2b13777d2b4e0d`.

Runs :
- Architecture + navigateur complet : `35557897360` — SUCCESS ;
- Firefox : `35557897377` — SUCCESS ;
- Tactical Dock : `35557897367` — SUCCESS.

Checkpoint :
`checkpoint/gensrpg-phase4-stats-s2-normalization-green-2026-09-21`.

Le module pur existe :
`assets/gensrpg/core/stats-normalization-v1.js`.

Il est encore inactif dans le graphe production au départ de ce lot.

### Mission du raccord

Transférer l'autorité de normalisation au Core sans toucher au reste du moteur Stats.

Le propriétaire historique
`assets/gensrpg/gens-rpg-stats-clean-167874.js`
reste propriétaire de :
- profil/racine Stats ;
- valeur canonique ;
- effets stat -> stat ;
- dérivées ;
- migration ;
- UI ;
- persistance ;
- wrappers.

Mais il ne doit plus posséder une seconde implémentation de :
- alias/canonisation ;
- slug ;
- normalisation de définition ;
- validation de cible ;
- normalisation d'effet ;
- comparaison primitive.

### Raccord de composition

Le Core normalization doit être chargé immédiatement avant le propriétaire Stats dans :
- `.github/workflows/main.yml` ;
- `preview.html`.

Aucun nouveau loader dynamique.
Aucun changement de `index.html`.
Le module devient alors production-reachable et doit quitter la liste Phase 4 inert.

### Raccord du propriétaire historique

Le propriétaire historique doit exiger explicitement :
`GensStatsNormalizationV1`.

Interdit :
- fallback local ;
- duplication des fonctions pures ;
- second alias map local ;
- wrapper/retry/timer pour attendre le Core.

Les fonctions internes historiques deviennent des références/délégations vers le Core
afin de préserver leurs callsites actuels sans réécrire le moteur complet dans ce lot.

### Frontières

Ne pas modifier :
- `value(hero,id)` ;
- `baseValue` ;
- providers équipement/talents/challenges ;
- `effectAmount` sauf utilisation de la comparaison déjà transférée ;
- formules max HP/mana/crit/dodge/initiative ;
- Armor ;
- toucher ;
- résistances ;
- Tactical snapshot ;
- UI/editor ;
- persistance/migrations.

### TDD

Avant raccord :
1. ajouter une garde d'autorité et de bootstrap ;
2. la garde doit être RED tant que Core normalization reste inert et que le
   propriétaire historique contient les implémentations locales ;
3. seulement ensuite appliquer le raccord ;
4. réaligner les tests qui chargent directement le propriétaire Stats afin qu'ils
   chargent explicitement sa dépendance Core ;
5. ne jamais ajouter de fallback de test dans le runtime.

### Critère de sortie

GREEN seulement si :
- Core normalization est chargé avant Stats dans Pages et preview ;
- graphe runtime le classe connecté/reachable ;
- propriétaire historique délègue sans duplication locale ;
- parité S1/S2 et tests historiques Stats/Tactical restent GREEN ;
- navigateur complet, Firefox et Tactical Dock passent sur le HEAD final ;
- `main` reste inchangé.

Document :
`docs/GENSRPG_PHASE4_STATS_S2_AUTHORITY_RACCORD.md`.

### Raccord réalisé

Le raccord d'autorité est appliqué :
- `stats-normalization-v1.js` est chargé avant `gens-rpg-stats-clean-167874.js`
  dans GitHub Pages et `preview.html` ;
- le Core normalization est production-reachable ;
- le propriétaire Stats exige explicitement `GensStatsNormalizationV1` ;
- ALIAS / slug / canon / normDef / targetValid / normEffect / compare ne sont plus
  réimplémentés localement ;
- aucun fallback local, nouveau loader, timer/retry ou wrapper ajouté ;
- `index.html` n'a pas été modifié.

Les tests VM historiques ont été réalignés sur la dépendance explicite Core -> Stats.

### TDD du raccord

RED attendu :
`f0da210616e02879bc184a78cee8f1b75ac163bf`.

Cause :
le Core normalization n'était pas encore chargé dans la composition Pages.

Les attentes historiques de composition Capture/preview ont ensuite été réalignées
de façon purement sentinelle pour intégrer le 21e module.

### Validation GREEN technique du raccord

HEAD :
`e490ce38ed654a328d588968ff55002c0ce6edf7`.

Runs :
- Architecture + navigateur complet : `35564423357` — SUCCESS ;
- Firefox : `35564423354` — SUCCESS ;
- Tactical Dock : `35564423345` — SUCCESS.

Le navigateur complet valide notamment Survie, Dungeon après Survie, Builder,
Config objet, fiche RPG, pièges/cache authored, Save & Quit/reprise, PvP,
Monster Capture, composition complète Capture, preview et resolver d'assets.

Aucune formule gameplay/Tactical/Armor/Hit n'a changé.

### Prochaine action

La clôture documentaire du raccord doit repasser les trois workflows sur son SHA
exact. Après trois SUCCESS :
- créer `checkpoint/gensrpg-phase4-stats-s2-authority-raccord-green-2026-09-21` ;
- ouvrir S3 depuis ce checkpoint ;
- S3 = moteur pur valeur/effets uniquement, sans déplacer les formules Tactical,
  Armor, Hit, résistances ou UI/persistance.


## Chantier courant prioritaire — Phase 4 Core Stats / S2 Normalisation pure — 2026-09-21

Ce bloc est le point de reprise actif ; les sections suivantes sont historiques.

- Branche : `work/gensrpg-phase4-stats-s2-normalization-2026-09-21`.
- Checkpoint de départ : `checkpoint/gensrpg-start-phase4-stats-s2-normalization-2026-09-21`.
- Base exacte et dernier GREEN : `56c9889dbebf84281f11ed995bb442889ffc6812`.
- Dernier checkpoint GREEN : `checkpoint/gensrpg-phase4-stats-s1-contracts-green-2026-09-21`.
- Production gelée : `main = e8681f9823573ced8aec59c8ddc47a72b02bc663`, V16.78.114.11.

### S1 définitivement clôturé

HEAD final S1 :
`56c9889dbebf84281f11ed995bb442889ffc6812`.

Runs :
- Architecture + navigateur complet : `35538165337` — SUCCESS ;
- Firefox : `35538165366` — SUCCESS ;
- Tactical Dock : `35538165333` — SUCCESS.

Checkpoint :
`checkpoint/gensrpg-phase4-stats-s1-contracts-green-2026-09-21`.

Aucun runtime, formule, UI, stockage ou gameplay n'a été modifié dans S1.

### Mission S2

Extraire uniquement les fonctions **pures** de normalisation Stats dans un module
Core dédié, sans basculer encore l'autorité runtime.

Cible :
`assets/gensrpg/core/stats-normalization-v1.js`.

API pure attendue :
- `canon(id)` ;
- `slug(value)` ;
- `normalizeDefinition(definition)` ;
- `isValidTarget(target)` ;
- `normalizeEffect(effect,index)` ;
- `compare(value,comparator,threshold)` ;
- `effectContribution(effect,sourceValue)`.

### Stratégie d'autorité

S2 crée le moteur pur **inactif en production** et démontre sa parité avec
les fonctions internes du propriétaire historique
`GensCleanRpgStats167874`.

Le propriétaire runtime historique reste unique pendant S2.
Aucun fallback permanent ni double autorité active n'est introduit.

Le raccord du propriétaire historique vers le nouveau Core sera un lot ultérieur,
après parité GREEN.

### Frontières strictes

S2 ne doit pas contenir :
- `value(hero,id)` complet ;
- lecture `profile()`, `CHARS`, `state` ;
- équipement, talents ou challenges ;
- DOM ;
- localStorage / Core Storage ;
- MutationObserver ;
- timer/retry ;
- wrappers ;
- snapshot Tactical ;
- formule Armor ;
- formule de toucher ;
- résolution résistances/dégâts.

### TDD

1. ajouter une sentinelle de parité qui compare le futur module pur aux fonctions
   internes actuelles sans modifier le runtime ;
2. obtenir un RED attendu tant que le module Core n'existe pas ;
3. créer le module pur minimal ;
4. obtenir GREEN ;
5. rejouer les tests historiques Stats/Tactical ;
6. Architecture+navigateur, Firefox et Tactical Dock requis avant checkpoint.

Document :
`docs/GENSRPG_PHASE4_STATS_S2_NORMALIZATION.md`.

### Implémentation S2

TDD observé :
- RED attendu sur le commit `e49a2fef992f0bb3e6e43caae05e39a3d4a5c163` ;
- cause exacte : `ENOENT` sur
  `assets/gensrpg/core/stats-normalization-v1.js` ;
- toutes les étapes antérieures, dont S1, étaient GREEN.

Module créé :
`assets/gensrpg/core/stats-normalization-v1.js`.

Commit d'extraction :
`b7be17f8f0317405f92e6441d28d506f546529e2`.

Le module expose uniquement :
- slug/canon ;
- normalizeDefinition ;
- isValidTarget ;
- normalizeEffect ;
- compare ;
- effectContribution.

Aucun raccord runtime n'a été ajouté.

La cartographie du graphe a ensuite été réalignée :
`stats-normalization-v1.js` est explicitement classé **Phase 4 inert**.
Il est physiquement présent mais absent du graphe production jusqu'au lot de raccord.

### Validation S2 — GREEN technique

HEAD technique validé :
`5f1e7d69854d1bff2761e8bd236152b20e76156a`.

Runs :
- Architecture + navigateur complet : `35557595186` — SUCCESS ;
- Firefox : `35557595179` — SUCCESS ;
- Tactical Dock : `35557595165` — SUCCESS.

Aucun runtime actif, gameplay, formule, UI ou persistance n'a changé.

### Prochaine action

Clôturer la documentation S2 puis repasser les trois workflows sur son SHA final
exact. Après trois SUCCESS :
- créer `checkpoint/gensrpg-phase4-stats-s2-normalization-green-2026-09-21` ;
- ouvrir un lot dédié de raccord d'autorité de normalisation ;
- ne pas commencer S3 value/effects tant que la frontière de raccord S2 n'est pas
  explicitement prouvée.


## Chantier courant prioritaire — Phase 4 Core Stats / S1 Contrats — 2026-09-20

Ce bloc est le point de reprise actif ; les sections suivantes sont historiques.

- Branche : `work/gensrpg-phase4-stats-s1-contracts-2026-09-20`.
- Checkpoint de départ : `checkpoint/gensrpg-start-phase4-stats-s1-contracts-2026-09-20`.
- Base exacte et dernier GREEN : `44e79de9afcb7c7cf47f2c3ad11d847e425274ae`.
- Dernier checkpoint GREEN : `checkpoint/gensrpg-phase4-storage-exit-audit-13-green-2026-09-20`.
- Production gelée : `main = e8681f9823573ced8aec59c8ddc47a72b02bc663`, V16.78.114.11.

### Storage commun clôturé

Audit de sortie 13 final GREEN :
- Architecture + navigateur complet : `35536488030` — SUCCESS ;
- Firefox : `35536488028` — SUCCESS ;
- Tactical Dock : `35536488034` — SUCCESS.

Le service commun Storage reste `GensStorageV1.readJson/writeJson`.
Les 19 familles restantes sont attribuées à leurs futurs propriétaires
Shell/Dungeon/Tactical/Capture/diagnostic et ne sont plus traitées comme
micro-lots Storage autonomes.

### Mission S1

Verrouiller le contrat réel du moteur Stats actuel sans modifier le runtime.

Propriétaire actuel :
`assets/gensrpg/gens-rpg-stats-clean-167874.js`
via `GensCleanRpgStats167874`.

Documentation :
`docs/GENSRPG_PHASE4_STATS_S1_CONTRACTS.md`.

Pré-audit repris comme documentation :
`docs/GENSRPG_PHASE4_STATS_PREAUDIT_AGENT1.md`.

Sa validité a été recontrôlée contre le nouveau GREEN Storage :
aucun moteur Stats/Tactical/Equipment pertinent n'a changé depuis sa base.

### Contrats verrouillés

- aliases/canonisation ;
- définition normalisée ;
- effet normalisé ;
- valeur canonique ;
- providers équipement/talents/challenges ;
- effet stat -> stat ;
- effets step / threshold ;
- clamp ;
- cycle via `seen` et retour base ;
- dérivées via `extraTotal` et `sourceEffectTotal`.

Hors S1 :
- aucune formule Armor ;
- aucune formule finale de toucher ;
- aucune normalisation résistances runtime ;
- aucun snapshot Tactical nouveau ;
- aucune UI/persistance extraite.

### TDD S1

Sentinelle :
`tests/gens_phase4_stats_s1_contracts_v1.test.cjs`.

Premier RED :
fixture de test incorrecte : la même définition Force servait à tester un
min/max volontairement invalide, ce qui clampait légitimement Force à 5.

Correction :
cas min/max invalide déplacé sur une stat custom indépendante.
Aucun runtime n'a été modifié.

Résultat de la sentinelle S1 corrigée :
GREEN dans Architecture sur le commit `ae156dd8e11be1979ca569c17326fa8c6a788d46`.

### Validation S1 — GREEN fonctionnel

HEAD validé :
`20ffce10f6282486dacb380d377fb4917260f89c`.

Runs :
- Architecture + navigateur complet : `35537827950` — SUCCESS ;
- Firefox : `35537827965` — SUCCESS ;
- Tactical Dock : `35537827948` — SUCCESS.

Aucun runtime, gameplay, formule, UI ou persistance n'a été modifié par S1.

### Suite autorisée

Cette clôture documentaire doit repasser les trois workflows sur son SHA exact.
Après trois SUCCESS :
- créer `checkpoint/gensrpg-phase4-stats-s1-contracts-green-2026-09-20` ;
- ouvrir S2 depuis ce checkpoint ;
- S2 = normalisation pure uniquement.

S2 pourra créer un premier service Core Stats pur dans
`assets/gensrpg/core/`, limité à canonisation/normalisation.
Aucune `value()` complète, aucun gameplay, aucune UI, aucune persistance.


## Chantier courant prioritaire — Phase 4 Storage / Audit de sortie 13 — 2026-09-20

Ce bloc est le point de reprise actif ; les sections suivantes sont historiques.

- Branche : `work/gensrpg-phase4-storage-exit-audit-13-2026-09-20`.
- Checkpoint de départ : `checkpoint/gensrpg-start-phase4-storage-exit-audit-13-2026-09-20`.
- Base exacte et dernier GREEN : `db364007fcc452cfbb7a06b06c3c49007a8b4ddc`.
- Dernier checkpoint GREEN : `checkpoint/gensrpg-phase4-storage-mj-rules-green-2026-09-20`.
- Production gelée : `main = e8681f9823573ced8aec59c8ddc47a72b02bc663`, V16.78.114.11.

### MJ Rules définitivement clôturé

HEAD final :
`db364007fcc452cfbb7a06b06c3c49007a8b4ddc`.

Runs :
- Architecture + navigateur complet : `35535815428` — SUCCESS ;
- Firefox : `35535815388` — SUCCESS ;
- Tactical Dock : `35535815374` — SUCCESS.

Checkpoint :
`checkpoint/gensrpg-phase4-storage-mj-rules-green-2026-09-20`.

### État Storage actuel

`index.html` :
- taille : `8 174 580` octets ;
- blob : `5b9b9ae780f735eadef049afeb10acf0b57441fe`.

Cartographie directe :
- accès : `182` ;
- résolus : `117` ;
- non résolus : `65` ;
- familles résolues directes : `19`.

Le service commun `GensStorageV1` existe déjà et possède uniquement le transport
JSON générique explicite `readJson/writeJson`.

### Mission Audit 13

**Audit uniquement, sans migration runtime.**

Objectif : décider si le sous-chantier Storage commun peut être clôturé sans
transformer la migration des accès directs en objectif artificiel.

Pour les 19 familles résolues restantes :
1. attribuer la responsabilité future réelle ;
2. distinguer service commun, état de module, session/navigation, réparation legacy
   et état transitoire ;
3. identifier tout éventuel dernier candidat Storage commun réellement autonome ;
4. différer explicitement les familles qui doivent être traitées avec leur futur
   propriétaire en Phase 5/7/8/9 ;
5. ne pas étendre `GensStorageV1` pour absorber remove/scalaires/migrations seulement
   afin de faire baisser un compteur.

### Hypothèse à prouver

Les familles restantes sont principalement :
- état d'exploration/runtime Dungeon -> Phase 7 ;
- session/navigation/profile -> Phase 5 ou Phase 7 ;
- état Tactical -> Phase 8 ;
- état Capture/shared entities -> Phase 9 ;
- Runtime Repair / build marker -> dette legacy ou utilitaire à traiter avec son propriétaire.

Si cette hypothèse est confirmée, **Storage commun est considéré suffisamment extrait**
pour passer au prochain service recommandé par la roadmap : **Core Stats**.

### Interdits

- aucun changement runtime dans Audit 13 ;
- aucun nouveau helper Storage ;
- aucun `removeItem` déplacé sans audit propriétaire ;
- aucune migration de `gensrpg_dungeon_runtime_v2` ;
- aucun Stats/Tactical/Capture/Survie/Shell modifié ;
- aucun observer, timer/retry, wrapper ou monkey-patch ;
- aucun merge sur `main`.

### Résultat Audit 13 — sortie Storage validée

La classification exhaustive des 19 familles restantes est verrouillée :
- Phase 7 Dungeon : 9 familles ;
- Phase 5 Shell/session : 2 ;
- Phase 8 Tactical/compatibilité : 2 ;
- Phase 9 Capture : 5 ;
- diagnostic Core scalaire : 1.

Aucun candidat `core-json-autonomous` ne reste.
`GensStorageV1` reste volontairement limité à `readJson/writeJson` : aucun
remove/scalar/migration API n'a été ajouté pour faire baisser artificiellement
les compteurs.

HEAD fonctionnel validé :
`a5ebf2b46d131c2adac16407ecf486e4d4073ed6`.

Runs :
- Architecture + navigateur complet : `35536186331` — SUCCESS ;
- Firefox : `35536186350` — SUCCESS ;
- Tactical Dock : `35536186332` — SUCCESS.

Décision :
**le sous-chantier Phase 4 / service commun Storage est clôturable**.
Les 19 familles résiduelles restent explicitement attribuées à leurs futures
phases propriétaires au lieu d'être migrées isolément.

### Prochaine action

Cette clôture documentaire doit repasser les trois workflows sur son SHA exact.
Après trois SUCCESS :
- créer `checkpoint/gensrpg-phase4-storage-exit-audit-13-green-2026-09-20` ;
- considérer le service commun Storage clôturé ;
- ouvrir Phase 4 / Core Stats depuis ce checkpoint ;
- reprendre le pré-audit Stats Agent 1 comme documentation, pas comme base Git ;
- commencer par S1 contrats/sentinelles puis S2 normalisation pure.


## Chantier courant prioritaire — Phase 4 Storage / MJ Rules — 2026-09-20

Ce bloc est le point de reprise actif ; les sections suivantes sont historiques.

- Branche : `work/gensrpg-phase4-storage-mj-rules-2026-09-20`.
- Checkpoint de départ : `checkpoint/gensrpg-start-phase4-storage-mj-rules-2026-09-20`.
- Base exacte et dernier GREEN : `7dc5efd6eca596fdf58a1d391bcafa1685ceb633`.
- Dernier checkpoint GREEN : `checkpoint/gensrpg-phase4-storage-next-audit-12-green-2026-09-20`.
- Production gelée : `main = e8681f9823573ced8aec59c8ddc47a72b02bc663`, V16.78.114.11.

### Audit 12 définitivement clôturé

Validation du HEAD documentaire final `7dc5efd6eca596fdf58a1d391bcafa1685ceb633` :
- Architecture + navigateur complet : `35533768644` — SUCCESS ;
- Firefox : `35533768634` — SUCCESS ;
- Tactical Dock : `35533768627` — SUCCESS.

Checkpoint final :
`checkpoint/gensrpg-phase4-storage-next-audit-12-green-2026-09-20`.

Aucun runtime n'a été modifié dans Audit 12.

### Périmètre unique MJ Rules

Migrer uniquement le transport JSON de la clé :
`gensrpg_dungeon_mj_rules_v145`.

Propriétaires prouvés :
- `dungeonMj72_2Script` ;
- `gensStability151`.

Accès ciblés :
- 1 lecture JSON directe ;
- 2 écritures JSON directes ;
- 0 `removeItem`.

Service Core existant :
`GensStorageV1`.

Le lot ne modifie ni les valeurs des règles MJ, ni leurs formulaires, ni les
reconciles 151/171, ni Dungeon Scene, ni Economy, ni aucun autre stockage.

### Contrats sensibles à préserver

Lecteur `dungeonMjRules151` :
- mêmes defaults ;
- même `Object.assign(d,old||{})` ;
- même catch englobant lecture/parse/fusion ;
- absence, chaîne vide, null, JSON invalide et erreur de lecture conservent
  exactement leurs comportements historiques.

Writer `saveDungeonMj151` :
- write avant fermeture UI ;
- erreur de sérialisation/écriture propagée ;
- UI non fermée après échec.

Writer `saveDungeonMjUnified175` :
- write avant `gensReconcile171` puis `gensReconcile151` ;
- catch externe historique conservé ;
- erreur de sérialisation/écriture avalée par ce catch ;
- reconciles non exécutés après échec.

### TDD obligatoire avant raccord

1. conserver Audit 12 comme caractérisation source ;
2. ajouter une parité dédiée au lot sur le vrai transport ;
3. ajouter une garde propriétaire attendue RED tant que les 3 accès directs existent ;
4. brancher ces gardes à Architecture ;
5. obtenir le RED attendu ;
6. seulement ensuite appliquer le micro-diff exact ;
7. réaligner uniquement manifeste/empreintes/tests réellement obsolètes ;
8. Architecture+navigateur, Firefox et Tactical Dock requis avant GREEN.

### Source et cible exactes

`index.html` source :
- taille : `8 174 580` octets ;
- blob : `1545aba502777d9fb76decdcee90a89c7cf3f971`.

Candidat exact vérifié :
- taille : `8 174 580` octets ;
- blob : `5b9b9ae780f735eadef049afeb10acf0b57441fe`;
- 1 `GensStorageV1.readJson(...MJ Rules...)` ;
- 2 `GensStorageV1.writeJson(...MJ Rules...)` ;
- 0 ancien transport direct ciblé.

### Interdits

- aucun autre accès `dungeonMj72_2Script` ou `gensStability151` ;
- aucun changement de règles/valeurs/UI MJ ;
- aucun Pending Trap / Special Branch ;
- aucun gameplay-by-profile ;
- aucun `gensrpg_dungeon_runtime_v2` ;
- aucun Stats / Tactical / Capture / Survie ;
- aucun observer, timer/retry, wrapper ou monkey-patch ;
- aucun merge sur `main`.

Document du lot :
`docs/GENSRPG_PHASE4_STORAGE_MJ_RULES.md`.

### Implémentation MJ Rules

TDD :
- parité Core dédiée posée et GREEN avant raccord ;
- garde propriétaire posée et RED comme attendu avant raccord ;
- aucun runtime modifié avant ce RED.

Raccord runtime :
- commit : `298506abcc08d0e013f640313dd3f5ca848981af` ;
- 1 lecture directe -> `GensStorageV1.readJson` ;
- 2 écritures directes -> `GensStorageV1.writeJson` ;
- aucun autre changement fonctionnel dans `index.html`.

Résultat exact :
- taille : `8 174 580` octets ;
- blob : `5b9b9ae780f735eadef049afeb10acf0b57441fe`.

Cartographie Storage après raccord :
- accès directs : `182` ;
- résolus : `117` ;
- non résolus : `65` ;
- clés directes résolues : `19`.
Dungeon :
- `152 / 102 / 50 / 11`.
Core :
- `2 / 1 / 1 / 1`.

Les anciennes empreintes Phase 2 et les audits Storage dépendant explicitement
du blob/index précédent ont été réalignés sans modifier leurs contrats métier.

### Validation fonctionnelle MJ Rules

HEAD validé :
`36cef9ad084f7c2c901dacf859d2d262d2d33198`.

Runs :
- Architecture + navigateur complet : `35534815605` — SUCCESS ;
- Firefox : `35534815601` — SUCCESS ;
- Tactical Dock : `35534815603` — SUCCESS.

### Prochaine action

Fermer la documentation du lot puis repasser les trois workflows sur le SHA
documentaire final exact. Après trois SUCCESS :
- créer `checkpoint/gensrpg-phase4-storage-mj-rules-green-2026-09-20` ;
- ouvrir le prochain Audit Storage depuis ce checkpoint ;
- conserver `main` inchangé.


## Chantier courant prioritaire — Phase 4 Storage / Audit suivant 12 — 2026-09-20

Ce bloc est le point de reprise actif ; les sections suivantes sont historiques.

- Branche : `work/gensrpg-phase4-storage-next-audit-12-2026-09-20`.
- Checkpoint de départ : `checkpoint/gensrpg-start-phase4-storage-next-audit-12-2026-09-20`.
- Base exacte et dernier GREEN : `08a93ef71f2d9fef656260e29bba812f376d2d0e`.
- Dernier checkpoint GREEN : `checkpoint/gensrpg-phase4-storage-economy-session-green-2026-09-20`.
- Production gelée : `main = e8681f9823573ced8aec59c8ddc47a72b02bc663`, V16.78.114.11.

### Economy Session définitivement clôturé

Validation du HEAD documentaire final `08a93ef71f2d9fef656260e29bba812f376d2d0e` :
- Architecture + navigateur complet : `35532788107` — SUCCESS ;
- Firefox : `35532788046` — SUCCESS ;
- Tactical Dock : `35532788073` — SUCCESS.

Checkpoint final :
`checkpoint/gensrpg-phase4-storage-economy-session-green-2026-09-20`.

### État de départ Storage

Manifeste direct Phase 2 :
- accès directs : `185` ;
- résolus : `120` ;
- non résolus : `65` ;
- clés directes résolues : `20`.

Dungeon :
- `153 / 103 / 50 / 12`.

`index.html` exact :
- taille : `8 174 580` octets ;
- blob : `1545aba502777d9fb76decdcee90a89c7cf3f971`.

### Mission Audit 12

Audit uniquement, sans migration runtime.

1. réexaminer toutes les familles directes restantes après Economy Session ;
2. rechercher le prochain sous-périmètre JSON minimal avec propriétaire et contrat prouvés ;
3. vérifier lecteurs/writers/fallbacks/erreurs/ordre d'effets et propriétaires externes/anonymes ;
4. retenir un micro-lot seulement si sa frontière est homogène et compatible avec `GensStorageV1` sans créer une deuxième autorité.

Priorité méthodologique :
- préférer une famille JSON read/write simple ;
- ne pas étendre `GensStorageV1` uniquement pour rendre un candidat commode ;
- ne pas mélanger valeurs scalaires, removeItem, migrations ou compatibilités historiques dans un lot JSON simple.

### Frontières conservées

Différés tant qu'un audit dédié ne prouve pas leur frontière :
- Pending Trap / Special Branch : get/set/remove ;
- gameplay-by-profile : miroir principal + seed Capture + marqueur scalaire ;
- `gensrpg_dungeon_runtime_v2` ;
- Stats dynamique ;
- Tactical mixed state ;
- Runtime Repair.

Interdits :
- aucun runtime dans cet audit ;
- aucun gameplay/UI/assets/navigation ;
- aucun observer/timer/retry/wrapper ;
- aucune modification Stats/Tactical/Capture/Survie ;
- aucun merge sur `main`.

### Accès au gros HTML

Une copie locale exacte du blob `1545aba502777d9fb76decdcee90a89c7cf3f971`
est déjà reconstruite et vérifiée à partir de la source utilisateur + micro-diffs Git
officiels. GitHub reste l'autorité pour branches/SHA/diff/CI.
Si cette correspondance cesse d'être vraie, réappliquer immédiatement la règle 26.

### Résultat Audit 12

Candidat retenu pour un futur micro-lot distinct :
`gensrpg_dungeon_mj_rules_v145`.

Preuves :
- propriétaires actifs : `dungeonMj72_2Script` + `gensStability151` ;
- aucun propriétaire JS externe ;
- 1 lecture JSON + 2 écritures JSON ;
- 0 `removeItem` ;
- Core Storage chargé avant les deux propriétaires ;
- parité de transport Core démontrée sur lecture, fusion, erreurs et écritures ;
- micro-diff futur simulé sans changement de taille ;
- blob cible déterministe : `5b9b9ae780f735eadef049afeb10acf0b57441fe`.

Contrats sensibles :
- `dungeonMjRules151` garde ses defaults, `Object.assign` et son catch lecture ;
- `saveDungeonMj151` propage les erreurs d'écriture et ne ferme pas l'UI après échec ;
- `saveDungeonMjUnified175` avale historiquement ces erreurs via son catch externe
  et ne lance pas les reconciles après échec.

Dette documentaire détectée et corrigée dans l'audit :
`GENSRPG_PHASE2_STORAGE_OWNERS.json.sourceIndexBlob` réaligné sur
`1545aba502777d9fb76decdcee90a89c7cf3f971`. Aucun runtime modifié.

Sentinelle :
`tests/gens_phase4_storage_next_audit_12_v1.test.cjs`.

Document :
`docs/GENSRPG_PHASE4_STORAGE_NEXT_AUDIT_12.md`.

### Validation Audit 12 — GREEN fonctionnel

HEAD validé :
`daced49432f74752c48b8fb838302954c880ab7e`.

Runs :
- Architecture + navigateur complet : `35533486808` — SUCCESS ;
- Firefox : `35533486747` — SUCCESS ;
- Tactical Dock : `35533486690` — SUCCESS.

Le diff depuis Economy Session GREEN ne contient aucun runtime :
- 1 sentinelle Architecture ajoutée ;
- 1 test Audit 12 ajouté ;
- 1 document Audit 12 ajouté ;
- CURRENT_WORK mis à jour ;
- empreinte descriptive du manifeste Storage réalignée.

### Prochaine action

Cette clôture documentaire doit repasser les trois workflows sur son SHA exact.
Après trois SUCCESS :
- créer `checkpoint/gensrpg-phase4-storage-next-audit-12-green-2026-09-20` ;
- ouvrir un checkpoint de départ et une branche distincte MJ Rules ;
- ne raccorder que les 3 transports prouvés par Audit 12.

Aucun raccord runtime dans Audit 12 et aucun merge sur `main`.


## Chantier courant prioritaire — Phase 4 Storage / Economy Session — 2026-09-20

Ce bloc est le point de reprise actif ; les sections suivantes sont historiques.

- Branche : `work/gensrpg-phase4-storage-economy-session-2026-09-20`.
- Checkpoint de départ : `checkpoint/gensrpg-start-phase4-storage-economy-session-2026-09-20`.
- Base exacte et dernier GREEN : `b5ae8be05e0b5cf616781cefd0aa22b5ace2eec6`.
- Dernier checkpoint GREEN : `checkpoint/gensrpg-phase4-storage-next-audit-11-green-2026-09-20`.
- Production gelée : `main = e8681f9823573ced8aec59c8ddc47a72b02bc663`, V16.78.114.11.

### Périmètre unique

Migrer uniquement le transport JSON de la famille dynamique :
`gensrpg_dungeon_session_eco_160_<profileId>`.

Propriétaire unique prouvé par Audit 11 :
`dungeonEconomy160`.

Service Core existant réutilisé :
`GensStorageV1`.

Accès ciblés :
- 1 lecture JSON directe ;
- 1 écriture JSON directe ;
- 0 `removeItem`.

Le lot ne modifie ni la clé, ni le schéma, ni les règles Economy, ni les compteurs,
ni les coffres/fouilles/marchands, ni l'inventaire héros, ni l'UI MJ.

### Contrats sensibles à préserver

- la clé de lecture reste `gensrpg_dungeon_session_eco_160_<activeProfileId>` avec fallback `dungeon` ;
- les defaults restent `{chests:0, merchantPasses:0}` ;
- la fusion historique `Object.assign` et le retour `{key,...d}` restent inchangés ;
- une propriété `key` déjà persistée conserve son comportement legacy et peut gagner sur la clé calculée ;
- le writer utilise uniquement `d.key` et ne recalcule jamais le profil actif ;
- `const {key,...rest}=d` continue d'exclure la clé du payload ;
- absence de clé = no-op ;
- erreurs de sérialisation/écriture propagées ;
- les actions UI qui suivent une écriture restent interrompues en cas d'échec.

### TDD avant raccord

1. conserver la caractérisation réelle Audit 11 ;
2. ajouter une parité qui applique en mémoire les deux remplacements Core au vrai propriétaire et rejoue le même contrat ;
3. ajouter une garde propriétaire attendue RED tant que les deux accès directs existent ;
4. brancher ces tests à Architecture ;
5. seulement après le RED attendu, appliquer le micro-diff runtime exact ;
6. réaligner uniquement les empreintes/manifeste rendus obsolètes ;
7. Architecture + navigateur complet, Firefox et Tactical Dock requis avant GREEN.

### Interdits

- aucun autre accès de `dungeonEconomy160` ;
- aucun inventaire héros `key(heroId)` ;
- aucun Pending Trap / Special Branch ;
- aucun gameplay-by-profile ;
- aucun `gensrpg_dungeon_runtime_v2` ;
- aucun Stats / Tactical / Capture / Survie ;
- aucun observer, timer/retry ou wrapper ;
- aucun changement de formule/valeur Economy ;
- aucun merge sur `main`.

### Source exacte

Base `index.html` :
- taille : `8 174 580` octets ;
- blob : `ee7b474802d8bb3b1d20e3aaf2507c4666fbd054`.

Conformément à la règle 26, aucune modification du gros HTML ne sera effectuée
à partir d'une copie non vérifiée.

Document du lot :
`docs/GENSRPG_PHASE4_STORAGE_ECONOMY_SESSION.md`.

### Implémentation Economy Session

Raccord runtime appliqué uniquement aux deux transports de session Economy :
- lecture directe JSON -> `GensStorageV1.readJson(localStorage,key,{})` ;
- écriture directe JSON -> `GensStorageV1.writeJson(localStorage,key,rest)`.

Résultat exact `index.html` :
- taille : `8 174 580` octets, inchangée ;
- blob avant : `ee7b474802d8bb3b1d20e3aaf2507c4666fbd054` ;
- blob après : `1545aba502777d9fb76decdcee90a89c7cf3f971`.

Contrats conservés :
- clé profile-scoped et fallback `dungeon` inchangés ;
- defaults `chests / merchantPasses` inchangés ;
- `Object.assign`, `{key,...d}`, clé portée par l'objet et exclusion du payload inchangés ;
- erreurs de sérialisation/écriture propagées ;
- ordre save -> UI/merchant inchangé ;
- Economy Rules et inventaire héros du même bloc intacts.

Validation ciblée locale du vrai propriétaire :
- 13 cas de lecture ;
- 7 variantes/fallbacks de profil ;
- isolation profil A/B ;
- comportement legacy d'une `key` persistée préservé ;
- erreurs lecture/profil/sérialisation/écriture préservées ;
- chemins MJ coffre, MJ marchand et ouverture marchand préservés ;
- parité legacy/Core : GREEN.

Manifeste Phase 2 après raccord :
- accès directs : `185` ;
- résolus : `120` ;
- non résolus : `65` ;
- clés directes : `20` ;
- Dungeon : `153 / 103 / 50 / 12`.

Les changements complémentaires depuis le checkpoint sont limités aux tests,
empreintes et manifestes rendus obsolètes par ce micro-diff.

### Validation fonctionnelle — GREEN

HEAD fonctionnel validé :
`d627d2143885e3084075017891a7408e60ccb4c4`.

Runs :
- Architecture + navigateur complet `35532444858` — SUCCESS ;
- Firefox `35532444849` — SUCCESS ;
- Tactical Dock `35532444882` — SUCCESS.

Le navigateur complet a notamment repassé :
- Survie + Fouiller/arts ;
- Dungeon après Survie ;
- Builder et Config objet ;
- fiche RPG sans flash Survie ;
- caches/pièges authored ;
- Save & Quit / reprise ;
- PvP ;
- Monster Capture + composition complète ;
- non-interférence quatre modules ;
- murs, preview et resolver d'assets.

Aucun élargissement de périmètre ni correction fonctionnelle annexe.

### Fermeture documentaire en cours

La présente mise à jour documentaire doit repasser les trois workflows sur son
SHA exact. Le checkpoint GREEN Economy Session ne sera créé qu'après ces trois
SUCCESS. Ensuite : nouvel audit Storage sur une branche neuve depuis ce checkpoint.
Aucun merge sur `main`.


## Chantier courant prioritaire — Phase 4 Storage / Audit suivant 11 — 2026-09-20

Ce bloc est le point de reprise actif ; les sections suivantes sont historiques.

- Branche : `work/gensrpg-phase4-storage-next-audit-11-2026-09-20`.
- Checkpoint de départ : `checkpoint/gensrpg-start-phase4-storage-next-audit-11-2026-09-20`.
- Base exacte et dernier GREEN : `c7e4dea6d9a9e51ddf381b2ab3c4e3d7145137a5`.
- Dernier checkpoint GREEN : `checkpoint/gensrpg-phase4-storage-dungeon-scene-green-2026-09-20`.
- Production gelée : `main = e8681f9823573ced8aec59c8ddc47a72b02bc663`, V16.78.114.11.

### Dungeon Scene définitivement clôturé

Validation du HEAD documentaire final `c7e4dea6d9a9e51ddf381b2ab3c4e3d7145137a5` :
- Architecture + navigateur complet : `35529245466` — SUCCESS ;
- Firefox : `35529245543` — SUCCESS ;
- Tactical Dock : `35529245555` — SUCCESS.

Checkpoint final créé après vérification des trois runs sur ce SHA exact.
Aucune nouvelle modification du lot Dungeon Scene.

### Périmètre de l'audit

Audit uniquement, sans migration runtime :
1. réexaminer l'inventaire direct post-Scene : `187 / 122 / 65 / 21` ;
2. caractériser en priorité la famille dynamique Economy Session
   `gensrpg_dungeon_session_eco_160_<profileId>`, encore différée ;
3. vérifier tous ses propriétaires, la fabrique de clé, les lecteurs/writers,
   les fallbacks, les erreurs et l'isolation entre profils avant toute sélection ;
4. retenir un nouveau micro-lot seulement si sa frontière est prouvée.

Propriétaire candidat à vérifier : `dungeonEconomy160`.
Service existant réutilisable : `GensStorageV1` (transport JSON uniquement).
Les règles Economy déjà migrées, l'inventaire héros, les coffres/fouilles/marchands,
le gameplay, la navigation et les autres familles ne sont pas à modifier.

### Accès contrôlé à la source

`index.html` de la base :
- taille : `8 174 580` octets ;
- blob : `ee7b474802d8bb3b1d20e3aaf2507c4666fbd054`.

Diagnostic via workflow temporaire en lecture seule, checkout du SHA de base
épinglé et vérification stricte du blob/taille avant extraction des preuves.
Aucune récupération intégrale hasardeuse du HTML via connecteur.
Si une copie locale complète devient nécessaire, appliquer la règle 26
et demander le fichier exact à Sylvain.

### Frontières et risques

- Pending Trap / Special Branch : différés, get/set/remove.
- Gameplay-by-profile : différé ; inclure impérativement le propriétaire principal
  historique lors de son futur audit, pas seulement le seed Capture.
- `gensrpg_dungeon_runtime_v2` : différé, audit dédié obligatoire.
- Stats dynamique / Tactical mixed state / Runtime Repair : différés.
- Risques à vérifier : propriétaire oublié dans un script anonyme, clé dynamique
  ou fallback implicite, effets de bord à la lecture, erreur avalée, mélange inventaire/session.

Pré-audit Core Stats Agent 1 reçu, lu et vérifié GREEN :
`work/gensrpg-phase4-stats-preaudit-agent1-2026-09-20`,
base `5259210bea918719603066057d3c64c4d68624eb`,
HEAD observé `73261adc723f2d7f4b5e3873e95debd2d908c8cd`.
Checkpoint Stats : `checkpoint/gensrpg-phase4-stats-preaudit-agent1-green-2026-09-20`.
Runs `35529371421`, `35529371532`, `35529371432` : SUCCESS sur le SHA Agent 1.
Diff vérifié : un seul document ajouté (811 lignes), aucun runtime ni Storage.
Référence gelée : `docs/GENSRPG_PHASE4_STATS_PREAUDIT_AGENT1.md` sur ce SHA.
Pas de merge Stats ici ; futurs S1 puis S2, sans unifier Armure/Toucher/Résistances.

### Validation et prochaine étape

- Diagnostic sur le vrai propriétaire et recherche dans tous les scripts, y compris anonymes.
- Tests de caractérisation/parité réutilisant les fonctions réelles si un candidat est confirmé.
- Vérifier le diff : aucun runtime, asset, gameplay ni stockage modifié dans cet audit.
- Retirer le workflow temporaire avant le HEAD final.
- Architecture + navigateur complet, Firefox et Tactical Dock requis sur le HEAD documentaire final.
- Aucun checkpoint GREEN anticipé ; aucun merge sur `main`.
- Inspection contrôlée `35529853991` : SUCCESS ; workflow temporaire retiré.
- Audit complet : Economy Session retenu, 1 lecture + 1 écriture, propriétaire unique.
- Contrats sensibles : clé portée par l'objet (même après changement de profil),
  spread `{key,...d}` et erreurs d'écriture avant UI conservés.
- Document : `docs/GENSRPG_PHASE4_STORAGE_NEXT_AUDIT_11.md`.
- Sentinelle réelle : `tests/gens_phase4_storage_economy_session_characterization_v1.test.cjs`.
- Prochaine action : attendre les trois validations du HEAD final, créer le checkpoint
  GREEN Audit 11, puis ouvrir un lot distinct Economy Session. Aucun raccord dans cet audit.


### Trace de validation Audit 11

Sur `35dad53b924ea3afd8aff24a34d63361cec8f3b1` :
- nouvelles caractérisations Economy Session et Architecture statique : SUCCESS ;
- Firefox `35530133891` : SUCCESS ;
- Tactical Dock `35530133906` : SUCCESS ;
- navigateur `35530133918`, tentative 1 : RED sur l'overlay Tactical interceptant le clic Survie ;
- une seule relance du job navigateur sur le même SHA, sans changement de code ;
- le scénario précédemment bloqué a passé cette relance ; suite navigateur encore en cours lors de la note.

Ce rouge historique est conservé dans `GENSRPG_PHASE4_STORAGE_NEXT_AUDIT_11.md`.
La présente fermeture documentaire doit repasser les trois workflows avant checkpoint.
Aucun runtime ni test navigateur modifié ; aucun résultat GREEN anticipé.


## Chantier courant prioritaire — Phase 4 stockage / Dungeon Scene — 2026-09-20

Branche :
`work/gensrpg-phase4-storage-dungeon-scene-2026-09-20`

Checkpoint de départ :
`checkpoint/gensrpg-start-phase4-storage-dungeon-scene-2026-09-20`

Base exacte :
`1caefc7bf572215ec1c62ad24d94b21bd42cbae4`
(`checkpoint/gensrpg-phase4-storage-next-audit-10-green-2026-09-20`).

Audit 10 clôturé GREEN :
- Architecture + navigateur complet `35528190575` — SUCCESS ;
- Firefox `35528190639` — SUCCESS ;
- Tactical Dock `35528190624` — SUCCESS.

Production `main` reste gelée sur :
`e8681f9823573ced8aec59c8ddc47a72b02bc663` — V16.78.114.11.

### Périmètre unique

Migrer uniquement :
`gensrpg_dungeon_scene_v1`.

Propriétaire :
`dungeonMj72_2Script`.

Accès ciblés :
- 1 lecture JSON ;
- 1 écriture JSON ;
- 0 removeItem.

Source :
- `index.html` : `8 174 580` octets ;
- blob : `30487d09481e11e5883faca1a6e49727d9cecfb6`.

Cible :
- taille : `8 174 580` ;
- blob : `ee7b474802d8bb3b1d20e3aaf2507c4666fbd054`.

### TDD

- parité ajoutée ;
- owner guard ajouté ;
- avant raccord : parité attendue GREEN, owner guard attendu RED ;
- aucun autre stockage Dungeon ne doit être modifié.

Document :
`docs/GENSRPG_PHASE4_STORAGE_DUNGEON_SCENE.md`.

### Implémentation Dungeon Scene

Runtime :
`f9f538e5144c1be7b66d06a59acc913d991a6f91`

Résultat :
- `index.html` : `8 174 580` octets ;
- blob : `ee7b474802d8bb3b1d20e3aaf2507c4666fbd054` ;
- 0 accès directs Dungeon Scene ;
- 1 lecture Core + 1 écriture Core ;
- normalisation tableau inchangée ;
- rendu MJ toujours après écriture réussie ;
- manifeste stockage : `187 / 122 / 65 / 21` ;
- Dungeon : `155 / 105 / 50 / 13`.

### Validation finale Dungeon Scene — GREEN

HEAD fonctionnel validé :
`1e9839018ed8a529c25049ac1c7729ab686d72c1`

Runs :
- Architecture + navigateur complet `35528901345` — SUCCESS ;
- Firefox `35528901336` — SUCCESS ;
- Tactical Dock `35528901320` — SUCCESS.

Production `main` reste :
`e8681f9823573ced8aec59c8ddc47a72b02bc663`.

### Prochaine action

1. valider ce HEAD documentaire ;
2. créer le checkpoint GREEN final Dungeon Scene ;
3. ouvrir un nouvel audit stockage depuis ce checkpoint ;
4. garder Pending Trap / Special Branch / gameplay-by-profile / runtime_v2 différés tant qu'ils n'ont pas leur audit dédié ;
5. aucun merge sur `main`.



## Chantier courant prioritaire — Phase 4 stockage / audit suivant 10 — 2026-09-20

Branche :
`work/gensrpg-phase4-storage-next-audit-10-2026-09-20`

Checkpoint de départ :
`checkpoint/gensrpg-start-phase4-storage-next-audit-10-2026-09-20`

Base exacte :
`5259210bea918719603066057d3c64c4d68624eb`
(`checkpoint/gensrpg-phase4-storage-challenge-history-green-2026-09-20`).

Challenge History clôturé GREEN :
- Architecture + navigateur complet `35527060380` — SUCCESS ;
- Firefox `35527060340` — SUCCESS ;
- Tactical Dock `35527060400` — SUCCESS.

Production `main` reste gelée sur :
`e8681f9823573ced8aec59c8ddc47a72b02bc663` — V16.78.114.11.

### État de départ stockage

- accès directs : `189` ;
- résolus : `124` ;
- non résolus : `65` ;
- clés directes : `22`.

Dungeon :
- `157 / 107 / 50 / 14`.

`index.html` exact :
- taille : `8 174 580` ;
- blob : `30487d09481e11e5883faca1a6e49727d9cecfb6`.

### Candidat retenu

`gensrpg_dungeon_scene_v1`

Propriétaire unique :
`dungeonMj72_2Script`.

Contrat :
- 1 lecture JSON ;
- 1 écriture JSON ;
- aucun removeItem ;
- fallback tableau vide ;
- valeurs non-tableau normalisées vers `[]` ;
- rendu MJ seulement après écriture réussie ;
- erreur de rendu toujours capturée localement.

Micro-diff cible ultérieur :
- taille : `8 174 580` ;
- blob : `ee7b474802d8bb3b1d20e3aaf2507c4666fbd054`.

Différés :
- Pending Trap ;
- Special Branch ;
- Economy Session dynamique ;
- gameplay-by-profile ;
- `gensrpg_dungeon_runtime_v2` ;
- autres familles larges Dungeon/Tactical/Capture.

Document :
`docs/GENSRPG_PHASE4_STORAGE_NEXT_AUDIT_10.md`.

Sentinelle :
`tests/gens_phase4_storage_next_audit_10_v1.test.cjs`.

### Interdits

- aucun runtime dans cet audit ;
- aucun changement des éléments de scène MJ ;
- aucun changement coffre/room/rendu ;
- aucun Pending Trap/Special Branch/Economy Session ;
- aucun gameplay-by-profile/runtime_v2/Stats/Tactical/Capture/Survie ;
- aucun observer/timer/retry/wrapper ;
- aucun merge sur `main`.

### Validation finale Audit 10 — GREEN

HEAD fonctionnel validé :
`a66c9b13dfad62a0a32df35e6bbc3cbdf4403c7a`

Runs :
- Architecture + navigateur complet `35527922025` — SUCCESS ;
- Firefox `35527921918` — SUCCESS ;
- Tactical Dock `35527921947` — SUCCESS.

Aucun runtime n'a été modifié.

Décision confirmée :
prochain lot = uniquement `gensrpg_dungeon_scene_v1`.

### Prochaine action

1. valider ce commit documentaire ;
2. créer le checkpoint GREEN final Audit 10 ;
3. ouvrir une branche neuve Dungeon Scene ;
4. poser parité + garde owner avant raccord ;
5. ne toucher à aucun autre stockage Dungeon.



## Chantier courant prioritaire — Phase 4 stockage / Challenge History 0.67 — 2026-09-20

Branche :
`work/gensrpg-phase4-storage-challenge-history-2026-09-20`

Checkpoint de départ :
`checkpoint/gensrpg-start-phase4-storage-challenge-history-2026-09-20`

Base exacte :
`d753527e04aa47191521255d58750718b15c6dff`
(`checkpoint/gensrpg-phase4-storage-next-audit-9-green-2026-09-20`).

Audit 9 clôturé GREEN :
- Architecture + navigateur complet `35524506865` — SUCCESS après relance du flake d'overlay Tactical ;
- Firefox `35524506772` — SUCCESS ;
- Tactical Dock `35524506828` — SUCCESS.

Production `main` reste gelée sur :
`e8681f9823573ced8aec59c8ddc47a72b02bc663` — V16.78.114.11.

### Périmètre unique

Migrer uniquement :
`gensrpg_dc067_challenge_history`.

Propriétaire :
`dungeonCore051ExplorationPolish`.

Accès ciblés :
- 1 lecture JSON ;
- 1 écriture JSON.

Source :
- `index.html` : `8 174 580` octets ;
- blob : `bfe9149e8150f15017bfcffe1a00fb797791aa83`.

Cible déterministe :
- taille : `8 174 580` ;
- blob : `30487d09481e11e5883faca1a6e49727d9cecfb6`.

### Méthode

1. parité + owner guard avant raccord ;
2. parité attendue GREEN ;
3. owner guard attendu RED avant raccord ;
4. raccord exact de deux expressions de transport ;
5. fenêtre anti-répétition 12 inchangée ;
6. historique persisté 24 inchangé ;
7. réalignement uniquement des empreintes/manifeste obsolètes ;
8. Architecture+navigateur, Firefox, Tactical avant GREEN.

Document :
`docs/GENSRPG_PHASE4_STORAGE_CHALLENGE_HISTORY.md`.

### Implémentation Challenge History

Runtime :
`7d6d5897ec24959240ca3d9147e1ce6aeb2c5e82`

Résultat :
- `index.html` : `8 174 580` octets ;
- blob : `30487d09481e11e5883faca1a6e49727d9cecfb6` ;
- 0 accès directs Challenge History ;
- 1 lecture Core + 1 écriture Core ;
- fenêtre anti-répétition 12 inchangée ;
- historique persisté 24 inchangé ;
- manifeste stockage : `189 / 124 / 65 / 22` ;
- Dungeon : `157 / 107 / 50 / 14`.

### Validation finale Challenge History — GREEN

HEAD fonctionnel validé :
`71963332b45eabddc5b761678d17d7e1727353de`

Runs :
- Architecture + navigateur complet `35526358499`, tentative 2 — SUCCESS ;
- Firefox `35526358631` — SUCCESS ;
- Tactical Dock `35526358507` — SUCCESS.

Prochaine action après validation documentaire :
1. checkpoint GREEN final Challenge History ;
2. nouvel audit stockage depuis ce checkpoint ;
3. garder gameplay-by-profile et runtime_v2 différés ;
4. aucun merge sur `main`.

### Interdits

- aucun contenu Challenge modifié ;
- aucun Pending Trap / Special Branch / Dungeon Scene ;
- aucun Economy Session dynamique ;
- aucun gameplay-by-profile/runtime_v2 ;
- aucun Stats/Tactical/Capture/Survie ;
- aucun observer/timer/retry/wrapper ;
- aucun merge sur `main`.



## Chantier courant prioritaire — Phase 4 stockage / audit suivant 9 — 2026-09-20

Branche :
`work/gensrpg-phase4-storage-next-audit-9-2026-09-20`

Checkpoint de départ :
`checkpoint/gensrpg-start-phase4-storage-next-audit-9-2026-09-20`

Base exacte :
`f71065c03f28b8dacd6d5b449f7688fc948f925b`
(`checkpoint/gensrpg-phase4-storage-challenge-library-green-2026-09-20`).

Challenge Library clôturé GREEN :
- Architecture + navigateur complet `35523748147` — SUCCESS ;
- Firefox `35523748120` — SUCCESS ;
- Tactical Dock `35523748084` — SUCCESS.

Production `main` reste gelée sur :
`e8681f9823573ced8aec59c8ddc47a72b02bc663` — V16.78.114.11.

### État de départ stockage

- accès directs : `191` ;
- résolus : `126` ;
- non résolus : `65` ;
- clés directes : `23`.

Dungeon :
- `159 / 109 / 50 / 15`.

`index.html` exact :
- taille : `8 174 580` ;
- blob : `bfe9149e8150f15017bfcffe1a00fb797791aa83`.

### Candidat retenu

`gensrpg_dc067_challenge_history`

Propriétaire unique :
`dungeonCore051ExplorationPolish`.

Contrat :
- 1 lecture JSON ;
- 1 écriture JSON ;
- fallback tableau vide ;
- fenêtre anti-répétition : 12 ;
- historique persisté : 24 ;
- logique de sélection Dungeon inchangée.

Micro-diff cible ultérieur :
- taille : `8 174 580` ;
- blob : `30487d09481e11e5883faca1a6e49727d9cecfb6`.

Différés :
- Pending Trap ;
- Special Branch ;
- Dungeon Scene ;
- Economy Session dynamique ;
- gameplay-by-profile ;
- `gensrpg_dungeon_runtime_v2`.

Document :
`docs/GENSRPG_PHASE4_STORAGE_NEXT_AUDIT_9.md`.

Sentinelle :
`tests/gens_phase4_storage_next_audit_9_v1.test.cjs`.

### Interdits

- aucun runtime dans cet audit ;
- aucune modification fenêtre 12 / historique 24 ;
- aucun autre stockage Dungeon ;
- aucun gameplay-by-profile/runtime_v2/Stats/Tactical/Capture/Survie ;
- aucun observer/timer/retry/wrapper ;
- aucun merge sur `main`.

### Validation finale Audit 9 — GREEN

HEAD fonctionnel validé :
`2a495184b6a3ac909f2c2022880d91faafda10c2`

Runs :
- Architecture + navigateur complet `35524201644` — SUCCESS ;
- Firefox `35524201652` — SUCCESS ;
- Tactical Dock `35524201663` — SUCCESS.

Aucun runtime n'a été modifié.

Décision confirmée :
prochain lot = uniquement `gensrpg_dc067_challenge_history`.

### Prochaine action

1. valider ce commit documentaire ;
2. créer le checkpoint GREEN final Audit 9 ;
3. ouvrir une branche neuve Challenge History ;
4. poser parité + garde owner avant raccord ;
5. conserver fenêtre 12 / historique 24 inchangés.



## Chantier courant prioritaire — Phase 4 stockage / Challenge Library — 2026-09-20

Branche :
`work/gensrpg-phase4-storage-challenge-library-2026-09-20`

Checkpoint de départ :
`checkpoint/gensrpg-start-phase4-storage-challenge-library-2026-09-20`

Base exacte :
`c6d971d2de22c9e875e692102d9d1ac128a4ebf5`
(`checkpoint/gensrpg-phase4-storage-next-audit-8-green-2026-09-20`).

Audit 8 clôturé GREEN :
- Architecture + navigateur complet `35521667254` — SUCCESS ;
- Firefox `35521667264` — SUCCESS ;
- Tactical Dock `35521667293` — SUCCESS.

Production `main` reste gelée sur :
`e8681f9823573ced8aec59c8ddc47a72b02bc663` — V16.78.114.11.

### Périmètre unique

Migrer uniquement :
`gensrpg_challenge_library_v1`.

Propriétaires :
- `dungeonCore051ExplorationPolish` ;
- `dungeonCore200Rebuild` ;
- `dungeonCore202ContentDensity`.

Accès ciblés :
- 3 lectures JSON ;
- 2 écritures JSON.

Source :
- `index.html` : `8 174 580` octets ;
- blob : `16deeb169abbc31a7db04161902e9381fd6888ad`.

Cible déterministe :
- taille : `8 174 580` ;
- blob : `bfe9149e8150f15017bfcffe1a00fb797791aa83`.

### Méthode

1. parité + owner guard avant raccord ;
2. parité attendue GREEN ;
3. owner guard attendu RED avant raccord ;
4. raccord exact de 5 expressions de transport ;
5. contenu/fréquence/sélection des énigmes inchangés ;
6. réalignement uniquement des empreintes/manifeste rendus obsolètes ;
7. validation Architecture+navigateur + Firefox + Tactical.

Gameplay-by-profile reste différé : aucun travail de cette branche n'est repris.

Document :
`docs/GENSRPG_PHASE4_STORAGE_CHALLENGE_LIBRARY.md`.


### Implémentation Challenge Library

Runtime :
`9e8e09e84011db286d1e82be24f1a2bbc7c87336`

Résultat :
- `index.html` : `8 174 580` octets ;
- blob : `bfe9149e8150f15017bfcffe1a00fb797791aa83` ;
- 0 accès directs Challenge Library ;
- 3 lectures Core + 2 écritures Core ;
- contenu/fréquence/sélection des énigmes inchangés ;
- manifeste stockage : `191 / 126 / 65 / 23` ;
- Dungeon : `159 / 109 / 50 / 15`.

### Validation finale Challenge Library — GREEN

HEAD fonctionnel validé :
`c5d2ee9ad7c60894245aaa7a3e1c46d660cf4c09`

Runs :
- Architecture + navigateur complet `35523470101` — SUCCESS ;
- Firefox `35523470108` — SUCCESS ;
- Tactical Dock `35523470104` — SUCCESS.

Prochaine action après validation documentaire :
1. checkpoint GREEN final Challenge Library ;
2. nouvel audit stockage depuis ce checkpoint ;
3. gameplay-by-profile reste différé ;
4. runtime_v2 reste différé ;
5. aucun merge sur `main`.

### Interdits

- aucun changement du contenu des 50 défis ;
- aucune modification fréquence/portes/coffres/puzzles ;
- aucun gameplay-by-profile ;
- aucun runtime_v2 ;
- aucun Stats/Tactical/Capture/Survie ;
- aucun observer/timer/retry/wrapper ;
- aucun merge sur `main`.



## Chantier courant prioritaire — Phase 4 stockage / audit suivant 8 — 2026-09-20

Branche :
`work/gensrpg-phase4-storage-next-audit-8-2026-09-20`

Checkpoint de départ :
`checkpoint/gensrpg-start-phase4-storage-next-audit-8-2026-09-20`

Base exacte :
`d579cb0d1ec4e065e2baa9f6c7bd770fb391fcf1`
(`checkpoint/gensrpg-phase4-storage-economy-rules-green-2026-09-20`).

### Pourquoi cet audit remplace Audit 7

Le lot partiel `gameplay-by-profile` a révélé un propriétaire réel hors du scanner Phase 2 :
`loadRpgGameplayByProfile/saveRpgGameplayByProfile/setStoredRpgGameplay/clearOldGameplayMirrorOnce`
dans le gros script principal anonyme.

La famille `gensrpg_rpg_gameplay_by_profile_v1` mélange donc :
- miroir historique de compatibilité ;
- plusieurs écritures ;
- `removeItem` ;
- marqueur scalaire voisin ;
- seed Monster Capture.

La branche partielle est abandonnée sans merge et sans checkpoint GREEN.

### État sûr de départ

`index.html` :
- taille : `8 174 580` ;
- blob : `16deeb169abbc31a7db04161902e9381fd6888ad`.

Stockage Phase 2 :
- `196 / 131 / 65 / 24`.

Production `main` reste :
`e8681f9823573ced8aec59c8ddc47a72b02bc663` — V16.78.114.11.

### Décision

Gameplay-by-profile : **différé**.

Nouveau candidat retenu :
`gensrpg_challenge_library_v1`.

Propriétaires :
- `dungeonCore051ExplorationPolish` ;
- `dungeonCore200Rebuild` ;
- `dungeonCore202ContentDensity`.

Accès directs :
- 3 lectures ;
- 2 écritures ;
- JSON homogène ;
- contenu/fréquence/logique des énigmes restent Dungeon-owned.

Micro-diff cible :
- taille : `8 174 580` ;
- blob : `bfe9149e8150f15017bfcffe1a00fb797791aa83`.

Document :
`docs/GENSRPG_PHASE4_STORAGE_NEXT_AUDIT_8.md`.

Sentinelle :
`tests/gens_phase4_storage_next_audit_8_v1.test.cjs`.

### Interdits

- aucun runtime dans cet audit ;
- aucun contenu d'énigme modifié ;
- aucun gameplay-by-profile ;
- aucun runtime_v2 ;
- aucun Stats/Tactical/Capture/Survie ;
- aucun observer/timer/retry/wrapper ;
- aucun merge sur `main`.

### Validation finale Audit 8 — GREEN

HEAD fonctionnel validé :
`fdd6c7178f5a3543f6dc826ca070c61d0cabdff0`

Runs :
- Architecture + navigateur complet `35521305083` — SUCCESS ;
- Firefox `35521305080` — SUCCESS ;
- Tactical Dock `35521305078` — SUCCESS.

Aucun runtime n'a été modifié.

Décision confirmée :
- gameplay-by-profile différé ;
- prochain lot = uniquement `gensrpg_challenge_library_v1`.

### Prochaine action

1. valider ce commit documentaire ;
2. créer le checkpoint GREEN final Audit 8 ;
3. ouvrir une branche neuve Challenge Library ;
4. poser parité + owner guards avant raccord ;
5. ne toucher ni au contenu ni à la fréquence des énigmes.



## Chantier courant prioritaire — Phase 4 stockage / Economy Rules — 2026-09-20

Branche :
`work/gensrpg-phase4-storage-economy-rules-2026-09-20`

Checkpoint de départ :
`checkpoint/gensrpg-start-phase4-storage-economy-rules-2026-09-20`

Base exacte :
`0cc5c00d340d8f46922e8ebb310859b6190e1ca4`
(`checkpoint/gensrpg-phase4-storage-next-audit-6-green-2026-09-20`).

Audit 6 clôturé GREEN :
- Architecture + navigateur complet `35517119091` — SUCCESS ;
- Firefox `35517116971` — SUCCESS ;
- Tactical Dock `35517116978` — SUCCESS.

Production `main` reste gelée sur :
`e8681f9823573ced8aec59c8ddc47a72b02bc663` — V16.78.114.11.

### Périmètre unique

Migrer uniquement :
`gensrpg_dungeon_economy_rules_160`.

Propriétaire :
`dungeonEconomy160`.

Source exacte :
- `index.html` : `8 174 580` octets ;
- blob : `a070af09f9cb1fcda78987e83bc117d7544d1b6c`.

Sous-responsabilité ciblée :
- 1 lecture JSON constante des règles ;
- 1 écriture JSON constante des règles.

Hors périmètre strict dans le même bloc :
- session Economy dynamique `gensrpg_dungeon_session_eco_160_<profileId>` ;
- inventaire héros via `key(heroId)`.

Micro-diff déterministe :
- taille cible : `8 174 580` octets ;
- blob cible : `16deeb169abbc31a7db04161902e9381fd6888ad`.

### Méthode

1. parité + owner guard avant raccord ;
2. owner guard attendu RED tant que les deux accès directs existent ;
3. raccord exact de deux lignes seulement ;
4. session dynamique et inventaire héros inchangés ;
5. réalignement uniquement des empreintes/manifeste obsolètes ;
6. Architecture+navigateur, Firefox, Tactical avant GREEN.

Document :
`docs/GENSRPG_PHASE4_STORAGE_ECONOMY_RULES.md`.


### Implémentation Economy Rules

Runtime :
`4f06178a0f6ba43caf46c28740494e93a5fbc11c`

Résultat :
- `index.html` : `8 174 580` octets ;
- blob : `16deeb169abbc31a7db04161902e9381fd6888ad` ;
- règles Economy : 0 accès directs, 1 lecture Core + 1 écriture Core ;
- session Economy dynamique et inventaire héros inchangés ;
- manifeste stockage : `196 / 131 / 65 / 24` ;
- Dungeon : `164 / 114 / 50 / 16`.

Le RED TDD initial était volontaire :
- parité SUCCESS ;
- garde owner FAILURE avant raccord sur le run `35517534861`.

Aucun autre runtime n'a été modifié.

### Validation finale Economy Rules — GREEN

HEAD fonctionnel validé :
`0c241f8fbc04fc6c91cfb74f28a0227cf9180f4e`

Runs :
- Architecture + navigateur complet `35517713333` — SUCCESS ;
- Firefox `35517713280` — SUCCESS ;
- Tactical Dock `35517713290` — SUCCESS.

Prochaine action après validation documentaire :
1. checkpoint GREEN final Economy Rules ;
2. branche neuve d'audit stockage ;
3. inspection des familles restantes sans mélanger les responsabilités ;
4. aucun merge sur `main`.

Interdits :
- aucun changement loot/coffres/fouilles/marchands/UI MJ ;
- aucune session Economy dynamique ;
- aucun inventaire héros ;
- aucun Dungeon runtime v2 ;
- aucun Challenge/Gameplay-by-profile/Stats/Tactical/Capture/Survie ;
- aucun observer/timer/retry/wrapper ;
- aucun merge sur `main`.



## Chantier courant prioritaire — Phase 4 stockage / audit suivant 6 — 2026-09-20

Branche :
`work/gensrpg-phase4-storage-next-audit-6-2026-09-20`

Checkpoint de départ :
`checkpoint/gensrpg-start-phase4-storage-next-audit-6-2026-09-20`

Base exacte :
`d5cc8d0321e3f2a0b0de81c5d5eef018074870c8`
(`checkpoint/gensrpg-phase4-storage-manual-mj-effects-green-2026-09-20`).

Lot précédent Manual MJ clôturé GREEN :
- Architecture + navigateur complet `35516286958` — SUCCESS ;
- Firefox `35516286988` — SUCCESS ;
- Tactical Dock `35516286973` — SUCCESS.

Production `main` reste gelée sur :
`e8681f9823573ced8aec59c8ddc47a72b02bc663` — V16.78.114.11.

### État de départ stockage

- accès directs : `198` ;
- résolus : `133` ;
- non résolus : `65` ;
- clés directes résolues : `25`.

`index.html` exact :
- taille : `8 174 580` octets ;
- blob : `a070af09f9cb1fcda78987e83bc117d7544d1b6c`.

### Mission

Audit uniquement.
Choisir le prochain micro-lot JSON minimal après Manual MJ.

Candidat retenu :
`gensrpg_dungeon_economy_rules_160`.

Frontière prouvée dans `dungeonEconomy160` :
- règles Economy constantes : 1 lecture + 1 écriture ;
- session Economy dynamique : 1 lecture + 1 écriture, hors périmètre ;
- inventaire héros : 1 écriture dynamique, hors périmètre.

Micro-diff cible ultérieur :
- lecture règles -> Core Storage sous le `try/catch` historique ;
- écriture règles -> Core Storage sans avaler les erreurs ;
- session dynamique et inventaire strictement intacts.

Résultat déterministe préparé :
- taille cible : `8 174 580` ;
- blob cible : `16deeb169abbc31a7db04161902e9381fd6888ad`.

Différés :
- Gameplay-by-profile ;
- Challenge Library ;
- `gensrpg_dungeon_runtime_v2`.

Document :
`docs/GENSRPG_PHASE4_STORAGE_NEXT_AUDIT_6.md`.

Sentinelle :
`tests/gens_phase4_storage_next_audit_6_v1.test.cjs`.

### Interdits

- aucun runtime dans cet audit ;
- aucune session Economy dynamique ;
- aucun inventaire héros ;
- aucun gameplay/UI/loot/marchand/coffre ;
- aucun Stats/Tactical/Capture/Survie ;
- aucun observer/timer/retry/wrapper ;
- aucun merge sur `main`.

### Validation finale Audit 6 — GREEN

HEAD fonctionnel validé :
`4463350d8ab77b819494d9722cb5619678f9d1e5`

Runs :
- Architecture + navigateur complet `35516800895` — SUCCESS ;
- Firefox `35516800810` — SUCCESS ;
- Tactical Dock `35516800829` — SUCCESS.

Aucun runtime n'a été modifié.
Le seul RED initial provenait d'une regex trop stricte dans la nouvelle sentinelle Audit 6 ; elle a été corrigée sans changement de périmètre.

Décision confirmée :
prochain lot = uniquement `gensrpg_dungeon_economy_rules_160`.

### Prochaine action

1. valider ce commit documentaire ;
2. créer le checkpoint GREEN final Audit 6 ;
3. ouvrir une branche neuve Economy Rules ;
4. caractériser la parité lecture/écriture avant raccord ;
5. ne toucher ni à la session Economy dynamique ni à l'inventaire héros.



## Chantier courant prioritaire — Phase 4 stockage / Manual MJ Effects — 2026-09-20

Branche :
`work/gensrpg-phase4-storage-manual-mj-effects-2026-09-20`

Checkpoint de départ :
`checkpoint/gensrpg-start-phase4-storage-manual-mj-effects-2026-09-20`

Base exacte :
`3a389423cd10d0ba6dda054791469f37637548a4`
(`checkpoint/gensrpg-phase4-storage-next-audit-5-green-2026-09-20`).

Audit 5 clôturé GREEN :
- Architecture + navigateur complet `35515305034` — SUCCESS ;
- Firefox `35515305062` — SUCCESS ;
- Tactical Dock `35515305026` — SUCCESS.

Production `main` reste gelée sur :
`e8681f9823573ced8aec59c8ddc47a72b02bc663` — V16.78.114.11.

### Périmètre unique

Migrer uniquement :
`gensrpg_manual_mj_effects_v1`

Propriétaire :
`dungeonCore046ManualMjAssist`.

Contrat historique :
- 1 lecture JSON directe ;
- absence / JSON invalide / type non-tableau -> `[]` ;
- 1 écriture JSON directe de `a || []` ;
- erreurs d'écriture propagées ;
- aucune migration ;
- aucun `gensrpg_dungeon_runtime_v2`.

Source exacte :
- `index.html` : `8 174 603` octets ;
- blob : `739ca52610308d085ecf2635c5bc748f70c79a11`.

Micro-diff déterministe préparé :
- cible : `8 174 580` octets ;
- blob cible : `a070af09f9cb1fcda78987e83bc117d7544d1b6c`.

### Méthode

1. tests parité + owner avant raccord ;
2. la garde owner est attendue RED tant que les accès directs existent ;
3. appliquer uniquement les deux remplacements exacts ;
4. réaligner les sentinelles d'empreinte/manifeste rendues obsolètes par ce blob ;
5. Architecture + navigateur, Firefox et Tactical Dock avant GREEN.

Interdits :
- aucun Economy / Challenge / Gameplay-by-profile ;
- aucun Stats/Tactical/Capture/Survie ;
- aucun changement UI/gameplay MJ ;
- aucun observer/timer/retry/wrapper ;
- aucun merge sur `main`.

Document :
`docs/GENSRPG_PHASE4_STORAGE_MANUAL_MJ_EFFECTS.md`.


### Implémentation Manual MJ

Runtime :
`6e1d975e3d4d87a4c16df734d474e10fdafd1784`

Résultat :
- `index.html` : `8 174 580` octets ;
- blob : `a070af09f9cb1fcda78987e83bc117d7544d1b6c` ;
- 0 accès directs Manual MJ ;
- 1 lecture Core + 1 écriture Core ;
- manifeste stockage : `198 / 133 / 65 / 25` ;
- Dungeon : `166 / 116 / 50 / 17`.

Le RED TDD initial était volontaire :
- parité SUCCESS ;
- garde owner FAILURE avant raccord sur le run `35515673649`.

Aucun autre runtime n'a été modifié.

### Validation finale Manual MJ — GREEN

HEAD fonctionnel validé :
`ab00bfeeecb1f55e5818044ffef0db29d447aa88`

Runs :
- Architecture + navigateur complet `35515980174` — SUCCESS ;
- Firefox `35515980167` — SUCCESS ;
- Tactical Dock `35515980168` — SUCCESS.

Prochaine action après validation documentaire :
1. checkpoint GREEN final Manual MJ ;
2. branche neuve d'audit stockage ;
3. inspection des familles restantes sans mélanger les responsabilités ;
4. aucun merge sur `main`.



## Chantier courant prioritaire — Phase 4 stockage / audit suivant 5 — 2026-09-20

Branche :
`work/gensrpg-phase4-storage-next-audit-5-2026-09-20`

Checkpoint de départ :
`checkpoint/gensrpg-start-phase4-storage-next-audit-5-2026-09-20`

Base exacte :
`46bc90315b2cb1e60b39213f34a7a824e7d05e03`
(`checkpoint/gensrpg-phase4-storage-dungeon-deck-green-2026-09-20`)

Dernier checkpoint GREEN :
`checkpoint/gensrpg-phase4-storage-dungeon-deck-green-2026-09-20`
sur `46bc90315b2cb1e60b39213f34a7a824e7d05e03`.

Validation de fermeture du lot précédent :
- Architecture + navigateur complet `35513226017` — SUCCESS ;
- Firefox `35513226010` — SUCCESS ;
- Tactical Dock `35513225997` — SUCCESS.

Production `main` reste gelée sur :
`e8681f9823573ced8aec59c8ddc47a72b02bc663` — V16.78.114.11.

### État de départ stockage

Manifeste Phase 2 :
- accès directs : `200` ;
- résolus : `135` ;
- non résolus : `65` ;
- clés directes résolues : `26`.

`index.html` exact post-Deck :
- taille : `8 174 603` octets ;
- blob : `739ca52610308d085ecf2635c5bc748f70c79a11`.

Une copie locale exacte a été reconstruite et vérifiée depuis le fichier utilisateur + micro-diff Deck.

### Mission

Audit uniquement.
Choisir le prochain micro-lot stockage JSON minimal après Dungeon Deck.

Candidats conservés par l'audit précédent :
- `gensrpg_dungeon_economy_rules_160` ;
- `gensrpg_manual_mj_effects_v1` ;
- `gensrpg_rpg_gameplay_by_profile_v1` ;
- `gensrpg_challenge_library_v1`.

### Exclusions maintenues

- `gensrpg_dungeon_runtime_v2` : audit dédié obligatoire ;
- Stats / état héros dynamique : futur service Stats ;
- Tactical adapter : runtime Dungeon + état héros dynamique ;
- Runtime Repair : mélange JSON et scalaires ;
- aucune valeur scalaire dans `GensStorageV1` ;
- aucun changement gameplay/UI ;
- aucun observer/timer/retry/wrapper ;
- aucun merge sur `main`.

### Note de reprise

Un brouillon `next-audit-4` a été créé depuis l'ancien checkpoint Primary Selection avant que l'ascendance Git révèle le lot Dungeon Deck déjà plus récent. Il a été abandonné avant toute modification runtime et ne constitue pas un point de reprise valide.

### Inspection exacte terminée

Le fichier post-Deck a été vérifié :
- taille `8 174 603` octets ;
- blob `739ca52610308d085ecf2635c5bc748f70c79a11`.

Candidat retenu :
`gensrpg_manual_mj_effects_v1`.

Pourquoi :
- un seul propriétaire `dungeonCore046ManualMjAssist` ;
- 1 lecture JSON + 1 écriture JSON ;
- fallback/type `[]` parfaitement caractérisé ;
- aucune dépendance `gensrpg_dungeon_runtime_v2` ;
- aucune migration ou compatibilité historique.

Différés :
- Economy : règles + état de session dynamique ;
- RPG gameplay mirror : compatibilité historique + seed Capture ;
- Challenge Library : plusieurs lecteurs historiques.

Document :
`docs/GENSRPG_PHASE4_STORAGE_NEXT_AUDIT_5.md`.

Sentinelle :
`tests/gens_phase4_storage_next_audit_5_v1.test.cjs`.

### Prochaine action

1. valider cet audit par Architecture + navigateur, Firefox et Tactical Dock ;
2. créer `checkpoint/gensrpg-phase4-storage-next-audit-5-green-2026-09-20` ;
3. ouvrir un lot neuf uniquement pour `gensrpg_manual_mj_effects_v1` ;
4. caractériser la parité read/write avant tout raccord ;
5. ne modifier aucun autre stockage.



### Validation finale — GREEN

HEAD validé :
`18ea4077b3c82c1eda4e045c96c5d7430e143b1d`

Runs :
- Architecture + navigateur complet `35514239454` — SUCCESS ;
- Firefox `35514239473` — SUCCESS ;
- Tactical Dock `35514239486` — SUCCESS.

Aucun runtime, gameplay, asset ou stockage n'a été modifié dans cet audit.

Décision confirmée :
le prochain micro-lot est uniquement
`gensrpg_manual_mj_effects_v1`.



## Chantier courant prioritaire — Phase 4 stockage / Dungeon Deck — 2026-09-20

Branche :
`work/gensrpg-phase4-storage-dungeon-deck-2026-09-20`

Checkpoint de départ :
`checkpoint/gensrpg-start-phase4-storage-dungeon-deck-2026-09-20`

Base exacte :
`b5c5b49a1b619b502b6a27764d9494852c0865cc`
(`checkpoint/gensrpg-phase4-storage-next-audit-3-green-2026-09-20`)

Production `main` reste gelée sur :
`e8681f9823573ced8aec59c8ddc47a72b02bc663`.

### Périmètre unique

Migrer uniquement :
`gensrpg_dungeon_deck_v1`

État historique exact :
- 1 lecture JSON directe ;
- 2 écritures JSON directes ;
- un seul bloc inline Dungeon ;
- aucun `gensrpg_dungeon_runtime_v2`.

Dungeon reste propriétaire :
- du schéma `remaining/createdAt/dungeonSession` ;
- de l'initialisation du deck ;
- des quantités configurées ;
- de la consommation, du reshuffle et du choix de loot.

Core Storage possède uniquement la sérialisation JSON.

### Règle 26

Le fichier fourni a été revérifié :
- taille `8 174 618` octets ;
- blob `5d2b0a6da51fd70bd36f087cb9ab82a1af308226`.

Micro-diff préparé localement :
- lecture -> `GensStorageV1.readJson(localStorage,DUNGEON_DECK_KEY,null)` ;
- 2 writers -> `GensStorageV1.writeJson(localStorage,DUNGEON_DECK_KEY,ds)` sous les `try/catch` historiques.

Résultat déterministe attendu :
- taille `8 174 603` octets ;
- blob `739ca52610308d085ecf2635c5bc748f70c79a11`.

### Interdits

- aucun `gensrpg_dungeon_runtime_v2` ;
- aucun changement de loot, rareté, quantité ou deck config ;
- aucun Economy/MJ/Challenge/Stats/Tactical/Capture ;
- aucune migration de schéma ;
- aucun observer/timer/retry ;
- aucun merge sur `main`.

### Implémentation appliquée

Micro-diff `index.html` :
- commit fonctionnel : `2b8d52274abd4bbe6fbc72ff487bcd054ceab6b9` ;
- compare Git : uniquement `index.html`, `3` additions / `3` suppressions ;
- taille finale : `8 174 603` octets ;
- blob final : `739ca52610308d085ecf2635c5bc748f70c79a11`.

Raccord :
- 1 lecture directe -> `GensStorageV1.readJson(..., null)` ;
- 2 écritures directes -> `GensStorageV1.writeJson(..., ds)` ;
- `try/catch` historiques des writers conservés ;
- initialisation, quantités, consommation et reshuffle inchangés.

Manifeste Phase 2 après raccord :
- accès directs : `203 -> 200` ;
- résolus : `138 -> 135` ;
- non résolus : `65` inchangés ;
- clés directes résolues : `27 -> 26` ;
- Dungeon : `171 -> 168` accès, `121 -> 118` résolus, `50` non résolus inchangés.

### Validation requise

Avant GREEN :
- test parité lecture/écriture/error swallowing ;
- garde autorité Core pour les 3 accès ;
- vrai raccord du bloc Deck ;
- manifeste Phase 2 avancé uniquement de 3 accès ;
- Architecture + navigateur complet ;
- Firefox ;
- Tactical Dock.


### Validation finale — GREEN

HEAD validé :
`9b56b3a78948369e13a11848ae6ec78d6b482e47`

Runs :
- Architecture + navigateur complet `35512912950` — SUCCESS ;
- Firefox `35512912966` — SUCCESS ;
- Tactical Dock `35512912956` — SUCCESS.

La validation a nécessité uniquement le réalignement de sentinelles/cartographies devenues obsolètes après le micro-diff :
- empreintes Phase 2 inline/global/timers -> blob `739ca52610308d085ecf2635c5bc748f70c79a11` ;
- audit stockage externe -> totaux post-Deck `200 / 135 / 65 / 26` ;
- empreinte de l'audit final resolver d'assets -> blob courant.

Aucun runtime n'a été modifié après le commit fonctionnel
`2b8d52274abd4bbe6fbc72ff487bcd054ceab6b9`.

Le vrai navigateur a repassé notamment :
Survie + Fouiller/arts, Dungeon après Survie, Builder, Config objet, fiche RPG,
authored caches/pièges, Save & Quit/reprise, PvP, Capture, non-interférence,
murs, preview et resolver d'assets.

### Prochaine action après fermeture

1. créer `checkpoint/gensrpg-phase4-storage-dungeon-deck-green-2026-09-20` sur le HEAD documentaire final validé ;
2. ouvrir un nouvel audit stockage depuis ce checkpoint ;
3. repartir de l'inventaire `200 / 135 / 65 / 26` ;
4. ne pas attaquer `gensrpg_dungeon_runtime_v2`, Stats ou Tactical sans audit dédié ;
5. le `index.html` exact post-Deck est le blob `739ca52610308d085ecf2635c5bc748f70c79a11` (8 174 603 octets).


## Chantier courant prioritaire — Phase 4 stockage / audit suivant 3 — 2026-09-20

Branche :
`work/gensrpg-phase4-storage-next-audit-3-2026-09-20`

Checkpoint de départ :
`checkpoint/gensrpg-start-phase4-storage-next-audit-3-2026-09-20`

Base exacte :
`bbe99430666bdd16d2807652f782ba3c6b293cb5`
(`checkpoint/gensrpg-phase4-storage-primary-selection-green-2026-09-20`)

Production `main` reste gelée sur :
`e8681f9823573ced8aec59c8ddc47a72b02bc663`.

### Mission

Audit documentaire uniquement.
Sélectionner le prochain sous-périmètre JSON minimal après le raccord
`gensrpg_dungeon_primary_selection_v167833`.

Aucune migration runtime dans ce lot.

### État de départ

Manifeste Phase 2 :
- accès directs : `203` ;
- résolus : `138` ;
- non résolus : `65` ;
- clés directes résolues : `27`.

`index.html` exact :
- taille : `8 174 618` octets ;
- blob Git : `5d2b0a6da51fd70bd36f087cb9ab82a1af308226`.

### Exclusions maintenues

- `gensrpg_dungeon_runtime_v2` : audit dédié obligatoire ;
- Core Stats / état héros dynamique : futur lot Stats ;
- Tactical adapter : mélange runtime Dungeon + état héros ;
- Runtime Repair : mélange JSON et scalaires ;
- clés manifestement scalaires (`active profile`, build marker, reload guard, etc.) : hors Core JSON actuel.

### Candidats inline à inspecter précisément

Priorité de lecture :
- `gensrpg_dungeon_deck_v1` ;
- `gensrpg_dungeon_economy_rules_160` ;
- `gensrpg_manual_mj_effects_v1` ;
- `gensrpg_rpg_gameplay_by_profile_v1` ;
- éventuellement `gensrpg_challenge_library_v1` si les quatre précédents ne sont pas isolés.

Avant toute décision :
- vérifier read/write/fallback exacts dans le `index.html` source ;
- vérifier propriétaire métier ;
- vérifier absence de migration de schéma ;
- vérifier absence de dépendance à `gensrpg_dungeon_runtime_v2`.

### Règle 26

Ne pas récupérer ou réécrire le gros `index.html` à l'aveugle.
Utiliser le fichier exact fourni par Sylvain et vérifier le blob attendu avant inspection/modification.


### Inspection exacte terminée

Le fichier fourni a été vérifié exact :
- taille `8 174 618` octets ;
- blob `5d2b0a6da51fd70bd36f087cb9ab82a1af308226`.

Prochain micro-lot retenu :
`gensrpg_dungeon_deck_v1`.

Pourquoi :
- 1 lecture JSON directe ;
- 2 écritures JSON directes ;
- un seul propriétaire inline Dungeon ;
- aucune dépendance `gensrpg_dungeon_runtime_v2` ;
- pas de migration de schéma ;
- initialisation et quantités restent propriété Dungeon ;
- erreurs d'écriture déjà avalées par les `try/catch` historiques.

Les autres candidats restent différés :
- Economy : bloc mêlé à état de session dynamique ;
- Manual MJ effects : nature session/configuration à clarifier ;
- RPG gameplay by profile : miroir historique + seed Capture ;
- Challenge library : plusieurs lecteurs/fallbacks Dungeon.


### Validation finale — GREEN

HEAD validé avant clôture documentaire :
`8de495ee94040cbc12913d9328f67c0689396e9d`

Résultats :
- Architecture + navigateur complet `35509834853` — SUCCESS ;
- Firefox `35509834854` — SUCCESS ;
- Tactical Dock `35509834852` — SUCCESS.

Conclusion :
- aucun runtime/gameplay/asset/stockage modifié ;
- inventaire post-Primary Selection verrouillé ;
- cinq familles inline prioritaires identifiées ;
- `gensrpg_dungeon_runtime_v2`, Stats, Tactical, Runtime Repair et les scalaires restent explicitement différés ;
- prochaine étape : inspecter le `index.html` exact blob `5d2b0a6da51fd70bd36f087cb9ab82a1af308226` selon la règle 26.



## Chantier courant prioritaire — Phase 4 stockage / Dungeon Primary Selection — 2026-09-20

Branche :
`work/gensrpg-phase4-storage-primary-selection-2026-09-20`

Checkpoint de départ :
`checkpoint/gensrpg-start-phase4-storage-primary-selection-2026-09-20`

Base exacte :
`193128afe716664021300d501d29c39ac8dc8ecd`
(`checkpoint/gensrpg-survival-search-art-integration-green-2026-09-20`)

Production `main` reste gelée sur :
`e8681f9823573ced8aec59c8ddc47a72b02bc663`.

### Périmètre unique

Migrer uniquement la clé JSON :
`gensrpg_dungeon_primary_selection_v167833`

Propriétaires/consommateurs concernés :
- `dungeon-world-session-bridge-167832.js` : reader + writer ;
- `dungeon-large-room-support-167834.js` : reader secondaire ;
- `dungeon-authored-bootstrap-167849.js` : fallback reader secondaire ;
- `dungeon-authored-action-fix-167857.js` : fallback reader secondaire.

Core Storage possède uniquement le transport JSON.
Dungeon conserve :
- la clé ;
- l'inférence `world/adventure` ;
- les validations ;
- les fallbacks métier ;
- les décisions de sélection.

### Précondition désormais satisfaite

Le lot GREEN `Core Storage Bootstrap Order` garantit que
`assets/gensrpg/core/storage-v1.js`
est disponible avant Large Room Support et les scripts inline/externes concernés.

### Invariants

- ne pas toucher `gensrpg_dungeon_runtime_v2` ;
- ne pas modifier les helpers `readRt()/writeRt()` ;
- ne pas modifier Stats/Tactical/Capture/Survie ;
- aucune migration de schéma ;
- aucun wrapper métier partagé ajouté ;
- aucun observer/timer/retry ;
- aucun changement gameplay ;
- aucun merge sur `main`.

### État de départ du manifeste stockage

- accès directs : `208` ;
- résolus : `143` ;
- non résolus : `65` ;
- clé Primary Selection : `5` accès directs répartis sur 4 fichiers.

### Dette fonctionnelle détectée hors périmètre

Le test historique `tests/dungeon_authored_action_fix_v167857.test.cjs`,
désormais exécutable avec Core Storage chargé, révèle une assertion RED préexistante :
le bouton générique `Fouiller` ne se réaffiche pas après avoir quitté la case d'un coffre exact authored.

Vérification :
- la logique `syncLegacyChestButton()` responsable est identique sur le checkpoint GREEN de départ ;
- le raccord Storage n'a modifié que `primary()` dans ce fichier ;
- parité Primary Selection et garde d'autorité Core sont GREEN ;
- World Session Bridge, Large Room et Authored Bootstrap historiques sont GREEN.

Décision conforme à la charte :
- ne pas corriger cette logique UI dans le lot stockage ;
- conserver la fixture Core adaptée ;
- ne pas utiliser cette assertion fonctionnelle préexistante comme critère de sortie du lot Storage ;
- ouvrir un lot fonctionnel séparé ultérieurement si ce comportement doit être corrigé.

### Validation finale — GREEN

HEAD validé avant clôture documentaire :
`f860f81cfa8063bcf8442ac76eca645e844e5c38`

Résultats :
- Architecture + navigateur complet `35508639664` — SUCCESS ;
- Firefox `35508639662` — SUCCESS ;
- Tactical Dock `35508639663` — SUCCESS.

Raccord validé :
- 4 lectures `PRIMARY_KEY` -> `GensStorageV1.readJson` ;
- 1 écriture `PRIMARY_KEY` -> `GensStorageV1.writeJson` ;
- clés, fallbacks et décisions métier Dungeon inchangés ;
- `gensrpg_dungeon_runtime_v2` explicitement non migré ;
- World Session Bridge, Large Room et Authored Bootstrap historiques GREEN ;
- parité JSON et garde d’autorité Core GREEN.

Manifeste Phase 2 :
- accès directs `208 -> 203` ;
- accès résolus `143 -> 138` ;
- accès non résolus `65` inchangés ;
- clés directes résolues `28 -> 27` ;
- Dungeon `176 -> 171` accès, `126 -> 121` résolus, `50` non résolus inchangés.

La dette UI Authored Search préexistante reste hors périmètre et n'a entraîné aucun changement runtime dans ce lot.

### Validation requise

Avant GREEN :
- parité historique read/write et fallbacks ;
- autorité Core Storage pour cette clé dans les 4 fichiers ;
- preuve que les accès `gensrpg_dungeon_runtime_v2` restent directs/intacts ;
- tests historiques World Session / Large Room / Authored ;
- manifeste Phase 2 mis à jour ;
- Architecture + navigateur complet ;
- Firefox ;
- Tactical Dock.


## Chantier courant prioritaire — Intégration Survie / Fouiller + arts — 2026-09-20

Branche :
`work/gensrpg-survival-search-art-integration-2026-09-20`

Checkpoint de départ :
`checkpoint/gensrpg-start-survival-search-art-integration-2026-09-20`

Base exacte :
`9f3183ca1822e07089ea2ecdf399a18b3c3e051e`
(`checkpoint/gensrpg-phase4-storage-capture-progress-green-2026-09-20`)

Production `main` reste gelée sur :
`e8681f9823573ced8aec59c8ddc47a72b02bc663`.

### Origine du lot

Agent 1 avait validé séparément :
`checkpoint/gensrpg-survival-search-art-repair-green-2026-09-20`
SHA documentaire :
`024dd6a92d2af50d226e9432fbc038a92173e2a0`

Le lot Agent 1 est divergent de la chaîne Phase 4 actuelle et ne doit pas être fusionné en bloc.

### Périmètre unique

Réintégrer uniquement les éléments Survie déjà validés :
- les 32 blobs historiques exacts `assets/img_01_...` à `assets/img_32_...` ;
- la sentinelle `tests/gens_survival_search_art_browser_v11411.test.cjs` ;
- son branchement dans la batterie navigateur Architecture.

### Diagnostic Agent 1 conservé

Fouiller :
- aucune correction runtime n'avait été nécessaire ;
- `#searchItemBtn` et `searchItem()` étaient fonctionnels sur la base auditée ;
- ne pas ajouter de second bouton, wrapper, patch CSS ou nouveau propriétaire.

Arts Survie :
- les chemins historiques existaient toujours dans les renderers ;
- les 32 fichiers physiques avaient disparu ;
- la correction était uniquement la restauration des blobs historiques exacts.

### Invariants

- aucun changement de runtime Survie ;
- aucun changement de règle gameplay ;
- aucun fallback Dungeon/Capture/PvP ;
- aucun déplacement physique des assets ;
- aucun observer/timer/retry ;
- aucun stockage/Stats/Tactical ;
- aucun merge sur `main`.

### Intégration appliquée

Assets :
- 32 blobs historiques exacts `assets/img_01_...` à `assets/img_32_...` ;
- réutilisation directe des SHA de blobs validés par Agent 1 ;
- aucun réencodage et aucun renommage ;
- commit : `c360edef639e636465f625cdec83820a3cab4cb2`.

Sentinelle :
- `tests/gens_survival_search_art_browser_v11411.test.cjs` reprise byte-for-byte du lot Agent 1 ;
- commit : `6fa7c40ed2f4e42d1365e1c296d1288b5248dc14`.

CI :
- sentinelle branchée après le lancement Survie réel ;
- commit : `5f3b72b47b4080782615a1a7655a39e98d157c0b`.

Aucun `index.html`, runtime, gameplay ou stockage n'a été modifié.

### Validation fonctionnelle — GREEN

HEAD fonctionnel :
`5004d4cac4ff118448b6867d58092c49fa4e8dee`

Runs :
- Architecture + navigateur complet `35506146562`, tentative 2 — SUCCESS ;
- Firefox `35506146704` — SUCCESS ;
- Tactical Dock `35506146608` — SUCCESS.

La nouvelle sentinelle prouve :
- Fouiller visible et unique ;
- clic réel `searchItem()` fonctionnel ;
- `state.found` modifié ;
- arts héros, objets/cartes et ennemis chargés ;
- couverture `img_01` à `img_32` ;
- aucune 404 Survie ;
- non-interférence des autres modes.

Note :
la tentative 1 du navigateur Architecture a échoué ponctuellement au contrôle immédiat du décodage d'un art objet. Sans aucun changement de code, la tentative 2 a passé cette sentinelle puis toute la batterie. Le runtime et le test ont été laissés inchangés.

### Stabilisation de la sentinelle

Le premier contrôle des arts objets testait `naturalWidth` immédiatement après création des balises `img`.
Sur la composition actuelle, les fichiers lourds pouvaient être encore en décodage malgré une réponse valide.

Correction uniquement dans le test :
- attente explicite de `img.decode()` pour les 20 arts objets/cartes ;
- les erreurs de décodage restent détectées par l'assertion finale ;
- aucun runtime ni asset modifié.

Commit :
`dbe144f33d34081a722e433e5a64b3afcd816c84`.

### Validation finale fonctionnelle — GREEN

HEAD fonctionnel :
`dbe144f33d34081a722e433e5a64b3afcd816c84`

Runs :
- Architecture + navigateur complet `35506567496` — SUCCESS ;
- Firefox `35506567482` — SUCCESS ;
- Tactical Dock `35506567367` — SUCCESS.

La nouvelle sentinelle Fouiller + arts Survie a passé dès cette validation stabilisée, puis toute la batterie navigateur a terminé GREEN.

### Validation finale — GREEN

HEAD validé :
`5004d4cac4ff118448b6867d58092c49fa4e8dee`

Résultats :
- Architecture + navigateur complet `35506146562`, tentative 2 — SUCCESS ;
- Firefox `35506146704` — SUCCESS ;
- Tactical Dock `35506146608` — SUCCESS.

La nouvelle sentinelle Survie valide :
- `Fouiller` visible, unique et fonctionnel ;
- clic réel -> `state.found` mis à jour ;
- 6 arts héros décodés ;
- 20 arts objets/cartes décodés ;
- 7 arts ennemis décodés ;
- couverture `img_01` à `img_32` ;
- aucune 404 Survie ;
- aucun fallback inter-module.

Première tentative Architecture :
- RED uniquement sur un timing ponctuel de décodage d'image dans la sentinelle ;
- aucune modification de code entre les deux tentatives ;
- tentative 2 totalement GREEN.

### Validation requise

Avant GREEN :
- vraie sentinelle Shell -> Survie -> fiche -> Fouiller ;
- décodage des 6 arts héros ;
- décodage des 20 arts objets/cartes ;
- décodage des 7 arts ennemis ;
- couverture collective `img_01` à `img_32` ;
- aucune 404 Survie ;
- Architecture + navigateur complet ;
- Firefox ;
- Tactical Dock.


## Référence obligatoire

Lire avant tout changement :
1. `docs/GENSRPG_CHARTE.md`
2. `docs/GENSRPG_RESTRUCTURATION_ROADMAP.md`
3. ce fichier
4. `docs/GENSRPG_COORDINATION.md`
5. `docs/GENSRPG_PHASE1_SENTINEL_AUDIT.md`

## Chantier courant prioritaire — Phase 4 / stockage — Capture progress JSON — 2026-09-20

Branche :
`work/gensrpg-phase4-storage-capture-progress-2026-09-20`

Checkpoint de départ :
`checkpoint/gensrpg-start-phase4-storage-capture-progress-2026-09-20`

Base exacte :
`54ba3c61af9e885239f1e3e397bf5386f6f6db41`
(`checkpoint/gensrpg-phase4-storage-core-bootstrap-order-green-2026-09-20`)

Production `main` reste gelée sur :
`e8681f9823573ced8aec59c8ddc47a72b02bc663`.

### Lot précédent — Core Storage Bootstrap Order — GREEN

HEAD documentaire final :
`54ba3c61af9e885239f1e3e397bf5386f6f6db41`

Runs :
- Architecture + navigateur complet `35502310229` — SUCCESS ;
- Firefox `35502310251` — SUCCESS ;
- Tactical Dock `35502310225` — SUCCESS.

Core Storage est désormais chargé une seule fois depuis le `index.html` source avant les scripts inline métier.
Pages conserve un fallback ordonné, et la preview hérite du bootstrap source sans injection concurrente.

### Périmètre unique du lot courant

Famille :
`gensrpg_capture_progress_v2_<profileId>`

Responsabilité métier :
Capture progression / réglages MJ Capture.

État historique caractérisé sur le `index.html` exact du checkpoint :
- 1 lecture JSON historique ;
- 6 écritures JSON historiques ;
- clé dynamique par profil via `captureCreatureProgressRulesKey()` ;
- fallback historique `{}`, fusionné dans les defaults de `captureCreatureProgressRules()` ;
- writers conservant le même objet sérialisé ;
- aucune migration de schéma demandée.

Le `index.html` exact courant a été reconstruit depuis le fichier fourni par Sylvain + l'unique micro-diff Bootstrap puis vérifié :
- taille : `8 174 618` octets ;
- blob Git : `476f91b7a5921c9f02f17ba72c801f4bec16a809` ;
- correspond exactement au `index.html` de la base GREEN.

### Validation de la passe — GREEN

HEAD fonctionnel :
`5b33877bcd1d9e7a3cd0699f0dffad876e543ebe`

Raccord :
- 1 lecture JSON Capture via `GensStorageV1.readJson(...,{})` ;
- 6 écritures JSON Capture via `GensStorageV1.writeJson(...)` ;
- clé, fallback, objet et propriétaires métier inchangés ;
- blob `index.html` : `5d2b0a6da51fd70bd36f087cb9ab82a1af308226` ;
- taille : `8 174 618` octets.

Runs :
- Architecture + navigateur complet `35505304987` — SUCCESS ;
- Firefox `35505305004` — SUCCESS ;
- Tactical Dock `35505304993` — SUCCESS.

Monster Capture réel, composition Capture complète et non-interférence des 4 modules sont GREEN.

### Objectif

Raccorder uniquement la sérialisation JSON de cette famille à `GensStorageV1` :
- mêmes clés ;
- mêmes objets ;
- mêmes fallbacks ;
- mêmes règles Capture ;
- mêmes writers métier ;
- aucun nouveau wrapper métier ;
- aucun changement d'UI ;
- aucune migration de format.

### Interdit

- aucun `gensrpg_dungeon_runtime_v2` ;
- aucun état héros dynamique `key(heroId)` ;
- aucun Stats/Tactical ;
- aucun changement des valeurs Capture ;
- aucun observer/timer/retry ;
- aucun merge sur `main`.

### Implémentation Capture progress

Raccord appliqué exclusivement à :
`gensrpg_capture_progress_v2_<profileId>`

- 1 lecture directe -> `GensStorageV1.readJson(..., {})` ;
- 6 écritures directes -> `GensStorageV1.writeJson(...)` ;
- clé, defaults, normalisation et règles restent propriétaires Capture ;
- taille `index.html` inchangée : `8 174 618` octets ;
- nouveau blob exact : `5d2b0a6da51fd70bd36f087cb9ab82a1af308226` ;
- commit fonctionnel : `6ef2ab5e7a8069c92ba722755ea7efeaeebb5d31`.

Inventaire stockage Phase 2 attendu :
- total `208` ;
- résolus `143` ;
- non résolus `65` ;
- Capture `23 / 10 / 13` (accès / résolus / non résolus).

Tests ajoutés :
- `tests/gens_phase4_storage_capture_progress_parity_v1.test.cjs` ;
- `tests/gens_phase4_storage_capture_progress_owner_v1.test.cjs`.

Document :
`docs/GENSRPG_PHASE4_STORAGE_CAPTURE_PROGRESS.md`.

État : **EN VALIDATION**. Aucun checkpoint GREEN avant Architecture + navigateur, Firefox et Tactical Dock tous SUCCESS.

## Chantier courant prioritaire — Phase 4 / Core Storage Bootstrap Order — 2026-09-20

Branche :
`work/gensrpg-phase4-storage-core-bootstrap-order-2026-09-20`

Checkpoint de départ :
`checkpoint/gensrpg-start-phase4-storage-core-bootstrap-order-2026-09-20`

Base exacte :
`38e047185b225de30c2e8a0cebe59adbc9c76ceb`
(`checkpoint/gensrpg-phase4-storage-inline-audit-green-2026-09-20`)

Production `main` reste gelée sur :
`e8681f9823573ced8aec59c8ddc47a72b02bc663`.

### Audit inline précédent — GREEN

Validation :
- Architecture + navigateur complet `35500424788` — SUCCESS ;
- Firefox `35500424783` — SUCCESS ;
- Tactical Dock `35500424784` — SUCCESS.

Le `index.html` fourni a été vérifié exact :
- taille `8 174 560` octets ;
- blob `ff11682d74be7921a591a9b76080eaf337c071be`.

Constat :
Core Storage était chargé trop tard pour servir proprement les scripts inline et Large Room Support.

### Périmètre unique

Corriger seulement l'ordre de bootstrap de :
`assets/gensrpg/core/storage-v1.js`

sans migrer aucune clé métier.

### Modifications

1. `index.html`
   - une seule balise Core Storage ajoutée après QRCode ;
   - commit du micro-diff :
     `2ddc2b8dcdb81ad6b0aa3a962cf898d73d57381c` ;
   - aucune autre ligne fonctionnelle modifiée dans ce commit.

2. `.github/workflows/main.yml`
   - fallback Core Storage placé avant Dungeon Core / Large Room Support ;
   - garde anti-doublon conservé.

3. `preview.html`
   - suppression de l'injection additionnelle Core Storage ;
   - la preview hérite désormais de la balise du `index.html` source ;
   - Large Room Support reste ajouté ensuite.

### Tests

- `tests/gens_phase4_storage_inline_audit_v1.test.cjs` avancé vers l'état post-bootstrap ;
- `tests/gens_phase4_storage_bootstrap_order_v1.test.cjs` ajouté ;
- CI Architecture verrouille désormais l'ordre de bootstrap.

### Invariants

- aucune migration de clé ;
- aucun format stockage modifié ;
- aucun gameplay modifié ;
- aucun `gensrpg_dungeon_runtime_v2` ;
- aucun changement Stats/Tactical ;
- aucun fallback concurrent ;
- aucun observer/timer/retry ;
- aucun merge sur `main`.

### Validation finale — GREEN

HEAD fonctionnel validé :
`50c11cc34d6757a9340a5eecc9f212ff6ab1adbf`

Nouveau blob `index.html` :
`476f91b7a5921c9f02f17ba72c801f4bec16a809`
(`8 174 618` octets).

Runs :
- Architecture + navigateur complet `35502015406` — SUCCESS ;
- Firefox `35502015416` — SUCCESS ;
- Tactical Dock `35502015502` — SUCCESS.

Les anciens gardes qui modélisaient l'injection Core Storage par preview/Pages ont été réalignés sur le nouveau bootstrap source. Aucun runtime métier supplémentaire n'a été modifié.

### Suite après GREEN

Ouvrir un nouveau lot homogène pour la famille JSON Capture :
`gensrpg_capture_progress_v2_<profileId>`

avec caractérisation de parité read/write/fallback avant raccord au Core Storage.

## Chantier courant prioritaire — Phase 4 / stockage — audit inline `index.html` — 2026-09-20

Branche :
`work/gensrpg-phase4-storage-inline-audit-2026-09-20`

Checkpoint de départ :
`checkpoint/gensrpg-start-phase4-storage-inline-audit-2026-09-20`

Base exacte :
`3e43e9220aeb762ee89edd39ad3d3f0fdd569b65`
(`checkpoint/gensrpg-phase4-storage-next-audit-2-green-2026-09-20`)

Production `main` reste gelée sur :
`e8681f9823573ced8aec59c8ddc47a72b02bc663`.

### Audit externe précédent — GREEN

Le deuxième audit stockage a conclu qu'aucun candidat externe restant n'est un raccord JSON simple et isolé :
- `gensrpg_dungeon_primary_selection_v167833` nécessite aussi un changement d'ordre Pages/preview ;
- les runtimes Room/World/Authored touchent `gensrpg_dungeon_runtime_v2` ;
- Stats doit rester pour le prochain service Phase 4 Stats ;
- Tactical mélange runtime Dungeon et état héros ;
- Runtime Repair V106 mélange JSON et valeurs scalaires.

Validation :
- Architecture + navigateur complet : run `35499679352`, tentative 2 — SUCCESS ;
- Firefox : run `35499679351` — SUCCESS ;
- Tactical Dock : run `35499679330` — SUCCESS.

Note de validation :
- la première tentative navigateur du run Architecture a rencontré une interception ponctuelle du clic Survie par un overlay Tactical existant ;
- aucun runtime n'avait changé dans le lot d'audit ;
- la relance du job échoué, sans changement de code, a passé le scénario `Dungeon après Survie` puis toute la batterie navigateur ;
- aucune correction runtime n'a été ajoutée dans ce lot.

### Résultat de l'audit inline

Le fichier fourni par Sylvain a été vérifié byte-for-byte :
- taille `8 174 560` octets ;
- blob Git `ff11682d74be7921a591a9b76080eaf337c071be` ;
- identique au `index.html` de la base exacte.

Constat :
- le `index.html` source ne charge pas encore `storage-v1.js` ;
- Pages injecte le service Core en fin de document, après les scripts inline ;
- Large Room Support est actuellement placé avant Core storage dans Pages et preview ;
- migrer une clé inline maintenant créerait une dépendance de timing ou un fallback concurrent.

Candidat futur confirmé :
`gensrpg_capture_progress_v2_<profileId>`, objet JSON Capture par profil.

Décision :
fermer cet audit sans migration runtime puis ouvrir un lot homogène
`Phase 4 — Core Storage Bootstrap Order`
avant tout nouveau raccord inline.

Document :
`docs/GENSRPG_PHASE4_STORAGE_INLINE_AUDIT.md`

Test :
`tests/gens_phase4_storage_inline_audit_v1.test.cjs`

### Mission de l'audit inline

Examiner uniquement les accès stockage inline encore présents dans `index.html` afin de sélectionner le prochain sous-périmètre JSON minimal.

Objectif :
- identifier une clé/famille autonome ;
- confirmer lecteur(s), writer(s), fallback et format exacts ;
- distinguer JSON de valeurs scalaires ;
- conserver le propriétaire métier ;
- ne modifier aucun runtime pendant cet audit ;
- ne pas toucher `gensrpg_dungeon_runtime_v2` ;
- ne pas anticiper Stats/Tactical.

### Règle 26 obligatoire

Le contenu exact de `index.html` est requis.

SHA exact demandé :
`3e43e9220aeb762ee89edd39ad3d3f0fdd569b65`

Lien :
`https://github.com/slyen4425-cloud/Zombicide-40k/blob/3e43e9220aeb762ee89edd39ad3d3f0fdd569b65/index.html`

Procédure :
1. Sylvain télécharge ce `index.html` exact ;
2. le compresse en ZIP ;
3. l'envoie dans la conversation ;
4. vérifier taille/cohérence et correspondance avant inspection ;
5. audit uniquement ; aucun raccord runtime tant que le candidat n'est pas caractérisé et qu'un nouveau lot n'est pas ouvert.

### Interdit

- aucune ancienne copie locale non vérifiée ;
- aucune lecture répétée du gros fichier via GitHub ;
- aucune modification de `index.html` dans ce lot d'audit ;
- aucun `gensrpg_dungeon_runtime_v2` ;
- aucune migration de schéma ;
- aucun nouveau wrapper / observer / timer / retry ;
- aucun merge sur `main`.

## Chantier courant prioritaire — Phase 4 / stockage — audit suivant 2 — 2026-09-20

Branche :
`work/gensrpg-phase4-storage-next-audit-2-2026-09-20`

Checkpoint de départ :
`checkpoint/gensrpg-start-phase4-storage-next-audit-2-2026-09-20`

Base exacte :
`3dcbc7e3954e607fd3db933dc41240b8dbe02641`
(`checkpoint/gensrpg-phase4-storage-world-summary-green-2026-09-20`)

Production `main` reste gelée sur :
`e8681f9823573ced8aec59c8ddc47a72b02bc663`.

### État de départ

World Summary est fermé GREEN sur :
`3dcbc7e3954e607fd3db933dc41240b8dbe02641`

Validation de fermeture :
- Architecture + navigateur complet `35499281396` — SUCCESS ;
- Firefox `35499281376` — SUCCESS ;
- Tactical Dock `35499281356` — SUCCESS.

Inventaire stockage direct :
- 213 accès ;
- 143 résolus ;
- 70 dynamiques/non résolus ;
- 28 clés/familles directes résolues.

### Audit externe

Document :
`docs/GENSRPG_PHASE4_STORAGE_NEXT_AUDIT_2.md`

Test :
`tests/gens_phase4_storage_next_audit_2_v1.test.cjs`

Résultat :
- `gensrpg_dungeon_primary_selection_v167833` est cohérent mais son premier consommateur Large Room Support est chargé avant `storage-v1.js` dans Pages/preview : raccord non isolé sans changement de composition ;
- Room Runtime / World Runtime / Authored Runtime partagent leurs helpers avec `gensrpg_dungeon_runtime_v2` : différés ;
- `gens-rpg-stats-clean-167874.js` : persistance dynamique à garder pour le futur lot Stats ;
- Tactical Adapter : mélange runtime Dungeon + état héros dynamique ;
- Runtime Repair V106 : mélange JSON de profils et valeurs scalaires, non adapté au seul service JSON actuel.

Aucun de ces candidats externes n'est migré dans ce lot.

### Décision

Le prochain audit minimal doit examiner les accès inline restants dans le gros `index.html` pour sélectionner une clé JSON autonome.

La règle 26 s'applique désormais :
- SHA exact requis : `3dcbc7e3954e607fd3db933dc41240b8dbe02641` ;
- lien :
  `https://github.com/slyen4425-cloud/Zombicide-40k/blob/3dcbc7e3954e607fd3db933dc41240b8dbe02641/index.html` ;
- demander à Sylvain de télécharger ce fichier, le compresser en ZIP et l'envoyer ;
- vérifier le fichier reçu avant toute inspection.

### Interdit

- aucune modification de `index.html` dans ce lot d'audit ;
- aucun `gensrpg_dungeon_runtime_v2` ;
- aucun changement Stats / Tactical / gameplay ;
- aucun changement d'ordre Pages/preview ;
- aucun nouveau wrapper / observer / timer / retry ;
- aucun merge sur `main`.

### Sortie attendue

Si Architecture + navigateur complet + Firefox + Tactical Dock sont GREEN :
1. créer `checkpoint/gensrpg-phase4-storage-next-audit-2-green-2026-09-20` ;
2. utiliser le `index.html` exact fourni par Sylvain uniquement pour l'audit inline suivant ;
3. ouvrir ensuite un nouveau lot de raccord seulement après choix du propriétaire et parité.


## Chantier courant prioritaire — Phase 4 / stockage World Summary — 2026-09-20

Branche :
`work/gensrpg-phase4-storage-world-summary-2026-09-20`

Checkpoint de départ :
`checkpoint/gensrpg-start-phase4-storage-world-summary-2026-09-20`

Base exacte :
`5d021592867bdf83408aa6fb49e9633b4403a67c`

Production `main` reste gelée sur :
`e8681f9823573ced8aec59c8ddc47a72b02bc663`.

### Périmètre unique

Raccorder uniquement la lecture JSON de :
`assets/gensrpg/gens-world-summary-167820.js`

au service Core existant :
`GensStorageV1`.

Familles de clés conservées exactement :
- `gensrpg_shared_entities_v1__<profileId>` ;
- `gensrpg_shared_entities_v1__family__creature`.

Responsabilités :
- Core storage : lecture JSON générique ;
- World Summary : résumé Shell en lecture seule ;
- Capture : données et schémas créatures, inchangés.

### Invariants

- aucune écriture ;
- aucune migration de format ;
- mêmes clés et mêmes fallbacks `[]` ;
- même priorité clé exacte -> famille ;
- même contenu de résumé ;
- aucun changement Capture ;
- aucun Dungeon / Tactical / Stats / Save & Quit ;
- aucun `index.html` ;
- aucun nouvel observer, timer, retry, wrapper ou monkey-patch ;
- `main` non touché.

### Parité / propriétaire

Tests :
- `tests/gens_phase4_storage_world_summary_parity_v1.test.cjs` ;
- `tests/gens_phase4_storage_world_summary_owner_v1.test.cjs` ;
- `tests/gens_world_summary_v167820.test.cjs` rejoué via le vrai Core.

Le premier run RED `35498906343` s'est arrêté sur une erreur du fixture de parité avant d'atteindre le garde propriétaire. Le fixture a été corrigé. L'état pré-raccord `ac09d261195e8d4b4f89766ff636f498370cf199` contient bien 1 lecture directe, 0 appel Core et 0 écriture.

### Raccord fonctionnel

Commit runtime :
`0ee4229dd6748e1672acdd59f77cb16d7b82200a`

Le helper local délègue désormais à :
`ROOT.GensStorageV1.readJson(ROOT.localStorage,key,fallback)`.

Aucun autre comportement World Summary n'a été modifié.

### Cartographie Phase 2

Après raccord :
- accès directs : `214 -> 213` ;
- accès résolus : `143` inchangés ;
- accès dynamiques/non résolus : `71 -> 70` ;
- domaine Shell : `4 -> 3` accès directs ;
- domaine Shell non résolu : `1 -> 0`.

### Validation fonctionnelle

SHA fonctionnel :
`a7b4da7be7b11a7b31665bdcff536fce5fb0635c`

- Architecture + navigateur complet `35499062048` — SUCCESS ;
- Firefox `35499062042` — SUCCESS ;
- Tactical Dock `35499062060` — SUCCESS.

Doc de fermeture :
`docs/GENSRPG_PHASE4_STORAGE_WORLD_SUMMARY.md`

Prochaine action :
1. valider la fermeture documentaire ;
2. créer `checkpoint/gensrpg-phase4-storage-world-summary-green-2026-09-20` sur le HEAD exact validé ;
3. créer un nouveau checkpoint de départ et une branche neuve d'audit stockage depuis ce GREEN ;
4. ne pas attaquer `gensrpg_dungeon_runtime_v2` ni les accès dynamiques restants comme un bloc global.


## Chantier courant prioritaire — Phase 4 / stockage zone graphs Builders — 2026-09-20

Branche :
`work/gensrpg-phase4-storage-zone-graphs-2026-09-20`

Checkpoint de départ :
`checkpoint/gensrpg-start-phase4-storage-zone-graphs-2026-09-20`

Base exacte :
`a0e1f1fc75e0465392d21b1064881e1446dd4092`
(`checkpoint/gensrpg-phase4-storage-room-creator-v2-green-2026-09-20`)

Production `main` reste gelée sur :
`e8681f9823573ced8aec59c8ddc47a72b02bc663`.

### Périmètre unique

Raccorder uniquement la clé historique partagée :
`gensrpg_zone_graphs_v1`

Consommateurs concernés :
- writer/reader : `assets/dungeon/dungeon-world-builder-167821.js` ;
- reader : `assets/dungeon/dungeon-room-visual-config-167826.js`.

Responsabilités :
- Core `GensStorageV1` : lecture/écriture JSON générique ;
- `DungeonWorldBuilder167821` : `STORAGE_KEY`, `normalizeGraph()`, graphe, validation et logique Builder ;
- `DungeonRoomVisualConfig167826` : `GRAPH_KEY`, sélection de contexte et UI de configuration ; lecture seule des graphes.

### Invariants

- aucune migration de format ;
- même clé locale ;
- même JSON persisté ;
- même fallback `[]` pour absence / JSON invalide / `null` / type non-tableau ;
- `normalizeGraph()` reste exclusivement module-owned ;
- Visual Config reste lecture seule sur les graphes ;
- erreurs d’écriture World Builder restent propagées ;
- Room Creator 1.0 et V2 restent raccordés et inchangés ;
- `GensStorageV1` est déjà chargé avant World Builder et avant le chargement dynamique de Visual Config ;
- aucun changement de Pages/preview/cache requis si l’ordre de composition reste identique ;
- aucun `index.html`.

### Tests requis

1. caractérisation de parité avant raccord ;
2. RED propriétaire : aucun accès direct `localStorage` dans World Builder ni Visual Config après raccord ;
3. World Builder lit/écrit `gensrpg_zone_graphs_v1` via `GensStorageV1` ;
4. Visual Config lit la même clé via `GensStorageV1` sans writer ;
5. JSON invalide / `null` / type non-tableau / tableau valide / round-trip ;
6. `normalizeGraph()` et le schéma restent dans World Builder ;
7. tests historiques World Builder + Visual Config exécutés avec le vrai service Core ;
8. cartographie Phase 2 réalignée après retrait des trois accès directs Builders restants ;
9. Builder navigateur réel + Config objet ;
10. Architecture + navigateur complet + Firefox + Tactical Dock.

### Interdit

- `gensrpg_dungeon_runtime_v2` ;
- IndexedDB ;
- Save & Quit ;
- migration de schéma ;
- stockage de contenu de zone `DungeonZoneContent167824` ;
- gameplay, mouvement, combat, Capture, Survie, Tactical ;
- nouveau wrapper / observer / timer / retry ;
- merge sur `main`.


### Résultat zone graphs — GREEN fonctionnel

RED propriétaire :
- parité `tests/gens_phase4_storage_zone_graphs_parity_v1.test.cjs` GREEN avant raccord ;
- garde `tests/gens_phase4_storage_zone_graphs_owner_v1.test.cjs` RED uniquement sur les accès directs historiques ;
- Architecture RED `35491583968` : échec attendu uniquement sur l’autorité Core des graphes Builder.

Raccord :
- commit runtime `6350c0bc7e3e73fd5854d0ce83c0d54713fc08c8` ;
- `DungeonWorldBuilder167821` lit/écrit désormais `gensrpg_zone_graphs_v1` via `GensStorageV1` ;
- `DungeonRoomVisualConfig167826` lit la même clé via `GensStorageV1` et reste strictement read-only ;
- `normalizeGraph()`, schéma, validation, graphes et UI restent dans leurs propriétaires Builders ;
- aucune migration de format, aucun changement de clé, aucun `index.html`, aucune règle gameplay.

Cartographie Phase 2 :
- commit de réalignement `0682d2e313944f1236b16c1e44e925751062c5c3` ;
- accès directs stockage : `217 -> 214` ;
- accès résolus directs : `145 -> 143` ;
- accès dynamiques directs : `72 -> 71` ;
- clés/familles directes résolues : `29 -> 28` ;
- domaine Builders : `3 -> 0` accès directs.

Validation ciblée :
- le test historique World Builder est rejoué avec le vrai Core stockage ;
- Visual Config est couvert par la parité `zone_graphs` et le vrai scénario navigateur Config objet ;
- l’ancienne chaîne imbriquée Visual Config -> hotfix -> template content n’est pas utilisée comme critère de ce lot, car elle entraîne un test Template Content hors périmètre après avoir validé Visual Config lui-même.

Validation fonctionnelle finale sur `85cc898e2e74165b304f55029e0db8ea736dd46c` :
- Architecture + navigateur complet `35491789347` — SUCCESS ;
- Firefox `35491789272` — SUCCESS ;
- Tactical Dock `35491789293` — SUCCESS.

État du sous-périmètre Builders stockage :
- `gensrpg_dungeon_custom_rooms_v1` — Core storage ;
- `gensrpg_dungeon_room_interactions_v2` — Core storage ;
- `gensrpg_zone_graphs_v1` — Core storage ;
- aucun accès direct `localStorage` ne reste dans le domaine Builders cartographié.

Prochaine action après validation de cette fermeture documentaire :
1. créer `checkpoint/gensrpg-phase4-storage-zone-graphs-green-2026-09-20` ;
2. ouvrir un nouvel audit stockage depuis ce checkpoint ;
3. choisir le prochain sous-périmètre minimal à partir des 214 accès directs restants ;
4. ne pas attaquer `gensrpg_dungeon_runtime_v2` ni les 71 accès dynamiques sans caractérisation dédiée.

## Chantier courant prioritaire — Phase 4 / stockage Room Creator V2 — 2026-09-20

Branche :
`work/gensrpg-phase4-storage-room-creator-v2-2026-09-20`

Checkpoint de départ :
`checkpoint/gensrpg-start-phase4-storage-room-creator-v2-2026-09-20`

Base exacte :
`1ffc8672950c526a9fef8c0b7506f126f67137aa`
(`checkpoint/gensrpg-phase4-storage-room-creator100-green-2026-09-20`)

Production `main` reste gelée sur :
`e8681f9823573ced8aec59c8ddc47a72b02bc663`.

### Périmètre unique

Raccorder uniquement `assets/dungeon/dungeon-room-creator-v2-167819.js` au service Core `GensStorageV1`.

Clé historique à conserver exactement :
`gensrpg_dungeon_room_interactions_v2`

Responsabilités :
- Core `storage-v1.js` : lecture/écriture JSON générique ;
- `DungeonRoomCreatorV2` : `STORAGE_KEY`, `normalizeMeta()`, attachments, caches et logique Builder.

### Invariants

- aucune migration de format ;
- même clé locale ;
- même JSON persisté ;
- même fallback `{}` pour absence/JSON invalide/`null`/type non-objet ;
- `normalizeMeta()` reste le seul normalizer métier ;
- erreurs d’écriture restent propagées ;
- Room Creator 1.0 reste raccordé et inchangé ;
- aucun World Builder, Visual Config, runtime Dungeon ou IndexedDB touché ;
- aucun wrapper, observer, timer/retry ou fallback legacy ajouté ;
- `storage-v1.js` est déjà chargé avant V1/V2 dans Pages et preview ;
- aucun changement de `index.html`.

### Tests requis

1. RED propriétaire V2 : plus aucun accès direct `localStorage` après raccord ;
2. clé historique et fallback `{}` conservés ;
3. parité JSON invalide / `null` / objet valide / round-trip ;
4. `normalizeMeta()` et schéma V2 inchangés ;
5. test historique V2 exécuté avec le vrai `GensStorageV1` ;
6. Room Creator 1.0 toujours GREEN ;
7. Builder navigateur réel ;
8. Architecture + navigateur complet + Firefox + Tactical Dock ;
9. aucun autre stockage migré dans ce sous-lot.

### Interdit

- `gensrpg_zone_graphs_v1` ;
- `gensrpg_dungeon_runtime_v2` ;
- IndexedDB assets ;
- Save & Quit ;
- migration de schéma ;
- gameplay, mouvement, combat, Capture, Survie, Tactical ;
- merge sur `main`.


### Résultat Room Creator V2 — GREEN

RED propriétaire :
- commit `14135d72054849e204825661c6e559032c000b7e` ;
- `tests/gens_phase4_storage_room_creator_v2_parity_v1.test.cjs` passe sur le comportement historique ;
- Architecture `35491030197` échoue uniquement sur « Verrouiller l’autorité Core du stockage Room Creator V2 » ;
- Firefox `35491030150` — SUCCESS ;
- Tactical Dock `35491030298` — SUCCESS.

Raccord :
- commit runtime `7a5e328af5317e306c20322e8dd81a89ac307b3a` ;
- `DungeonRoomCreatorV2` ne lit/écrit plus directement `localStorage` ;
- clé conservée exactement : `gensrpg_dungeon_room_interactions_v2` ;
- fallback de lecture `{}` conservé ;
- `normalizeMeta()`, schéma V2, attachments et cacheLinks restent propriétaires du module ;
- aucune migration de format ;
- aucun `index.html`, World Builder, Visual Config, runtime Dungeon ou gameplay modifié.

Cartographie :
- deux accès directs Builders retirés du manifeste Phase 2 ;
- inventaire direct : 219 -> 217 accès ;
- accès résolus : 147 -> 145 ;
- clés/familles directes résolues : 30 -> 29 ;
- Builders : 5 -> 3 accès directs, dont 2 résolus sur `gensrpg_zone_graphs_v1` et 1 lecture dynamique Visual Config.

Validation :
- `tests/dungeon_room_creator_v2_v167819.test.cjs` est désormais exécuté dans la CI restructuration avec le vrai `GensStorageV1` ;
- SHA candidat : `c5b39441211c3bb74b65e7e0bb5470a071967c97` ;
- Architecture + navigateur complet `35491128610` — SUCCESS ;
- Firefox `35491128659` — SUCCESS ;
- Tactical Dock `35491128619` — SUCCESS.

Prochaine action après validation de cette fermeture documentaire :
1. créer `checkpoint/gensrpg-phase4-storage-room-creator-v2-green-2026-09-20` ;
2. ouvrir un sous-lot neuf pour la clé partagée `gensrpg_zone_graphs_v1` ;
3. traiter ensemble son writer `DungeonWorldBuilder167821` et son lecteur `DungeonRoomVisualConfig167826`, sans déplacer `normalizeGraph()` ;
4. aucun runtime de partie ni IndexedDB dans ce lot.


## Chantier courant prioritaire — Phase 4 / stockage Room Creator 1.0 — 2026-09-19

Branche :
`work/gensrpg-phase4-storage-room-creator100-2026-09-19`

Checkpoint de départ :
`checkpoint/gensrpg-start-phase4-storage-room-creator100-2026-09-19`

Base exacte :
`164e340ca589386378968b128ba1bb5fef50e3d6`
(`checkpoint/gensrpg-phase4-storage-core-service-green-2026-09-19`)

Production `main` reste gelée sur :
`e8681f9823573ced8aec59c8ddc47a72b02bc663`.

### Périmètre unique

Raccorder uniquement `assets/dungeon/dungeon-room-creator-100.js` au service Core `GensStorageV1`.

Clé historique à conserver exactement :
`gensrpg_dungeon_custom_rooms_v1`

Responsabilités :
- Core `storage-v1.js` : lecture/écriture JSON générique ;
- `DungeonRoomCreator100` : `STORAGE_KEY`, `normalizeRoom()`, validation, bibliothèque de pièces et logique Builder.

### Invariants

- aucune migration de format ;
- même clé locale ;
- même JSON persisté ;
- même fallback `[]` pour absence/JSON invalide/`null`/type non-tableau ;
- `normalizeRoom()` reste le seul normalizer métier ;
- erreurs d'écriture restent propagées ;
- aucun Room Creator V2, World Builder, Visual Config ou runtime Dungeon modifié fonctionnellement ;
- aucun wrapper, observer, timer/retry ou fallback legacy ajouté ;
- `storage-v1.js` doit être chargé explicitement avant Room Creator dans Pages et preview ;
- cache PWA seulement si nécessaire pour rendre ce nouveau fichier production cohérent.

### Tests requis

1. caractérisation pré-raccord de la clé et du payload ;
2. RED propriétaire : plus aucun accès direct `localStorage` dans Room Creator 1.0 après raccord ;
3. service Core chargé avant Room Creator en composition Pages/preview ;
4. tests Room Creator existants via le service Core ;
5. JSON invalide / `null` / tableau valide / round-trip ;
6. Builder navigateur réel ;
7. Architecture + navigateur complet + Firefox + Tactical Dock ;
8. aucun autre stockage migré dans ce sous-lot.

### Interdit

- `gensrpg_dungeon_room_interactions_v2` ;
- `gensrpg_zone_graphs_v1` ;
- `gensrpg_dungeon_runtime_v2` ;
- Save & Quit ;
- migrations de schéma ;
- `index.html` ;
- gameplay, mouvement, combat, Capture, Survie, Tactical ;
- merge sur `main`.


### Résultat Room Creator 1.0 — GREEN

Raccord fonctionnel :
- `DungeonRoomCreator100` ne lit/écrit plus directement `localStorage` ;
- la clé historique reste exactement `gensrpg_dungeon_custom_rooms_v1` ;
- `normalizeRoom()`, validation, bibliothèque et logique Builder restent propriétaires du module ;
- `GensStorageV1` est chargé avant Room Creator dans GitHub Pages et `preview.html` ;
- le cache PWA référence le service Core connecté ;
- aucune migration de format ;
- aucun autre stockage Builder ou runtime Dungeon migré dans ce lot ;
- `index.html` inchangé.

Parité et garde propriétaire :
- `tests/gens_phase4_storage_room_creator100_owner_v1.test.cjs` ;
- `tests/gens_phase4_storage_room_creator100_parity_v1.test.cjs` ;
- tests historiques Room Creator rejoués via le Core.

Validation fonctionnelle sur `064dfed37869f1bb10a9f235c4cc870c0cc44610` :
- Architecture + navigateur complet `35488911644` — SUCCESS ;
- Firefox `35488911651` — SUCCESS ;
- Tactical Dock `35488911647` — SUCCESS.

Prochaine action :
1. valider cette fermeture documentaire sur les trois workflows ;
2. créer `checkpoint/gensrpg-phase4-storage-room-creator100-green-2026-09-20` ;
3. ouvrir un lot séparé pour `DungeonRoomCreatorV2` ;
4. conserver exactement `gensrpg_dungeon_room_interactions_v2`, son fallback `{}` et `normalizeMeta()` ;
5. ne pas toucher encore à `gensrpg_zone_graphs_v1` ni au runtime Dungeon.



## Chantier courant prioritaire — Phase 4 / service Core stockage JSON — 2026-09-19

Branche :
`work/gensrpg-phase4-storage-core-service-2026-09-19`

Checkpoint de départ :
`checkpoint/gensrpg-start-phase4-storage-core-service-2026-09-19`

Base exacte :
`151e714c1373748ee6a42a03a8ec7fb44aded8c9`
(`checkpoint/gensrpg-phase4-storage-builder-audit-green-2026-09-19`)

Production `main` reste gelée sur :
`e8681f9823573ced8aec59c8ddc47a72b02bc663`.

### Objectif du jalon

Créer `assets/gensrpg/core/storage-v1.js` comme service générique JSON pur, explicitement hors graphe de production.

API cible :
- `GensStorageV1.readJson(storage,key,fallback)` ;
- `GensStorageV1.writeJson(storage,key,value)` ;
- `GensStorageV1.create(storage)`.

### Invariants

- aucune clé métier dans le Core ;
- aucune connaissance Room / Graph / Hero / module ;
- aucune migration de format dans ce jalon ;
- stockage injecté explicitement ;
- lecture absente/invalide/null -> fallback ;
- erreurs d'écriture et de sérialisation propagées ;
- aucun DOM, observer, listener, timer/retry, gameplay ou navigation ;
- aucune modification de `index.html`, Pages, preview ou service worker ;
- aucun consommateur production raccordé dans ce lot.

### Tests requis

1. service syntaxiquement valide ;
2. absence de clés/schémas métier ;
3. missing / JSON invalide / chaîne vide / `null` ;
4. round-trip objet et tableau ;
5. erreur de lecture -> fallback ;
6. erreur d'écriture et JSON circulaire -> erreur propagée ;
7. service explicitement hors graphe production ;
8. Architecture + navigateur complet + Firefox + Tactical Dock.

### Suite autorisée uniquement après GREEN

Créer un checkpoint final de ce service, puis ouvrir un lot séparé pour raccorder uniquement `DungeonRoomCreator100` à la clé historique `gensrpg_dungeon_custom_rooms_v1`.

### Résultat du jalon — GREEN fonctionnel

Service :
`assets/gensrpg/core/storage-v1.js`

Commit fonctionnel :
`6f4a66a7b24e285d1ef62fc1f2b8d3d1cf22947e`

Résultat :
- API Core générique `GensStorageV1` créée ;
- `readJson(storage,key,fallback)`, `writeJson(storage,key,value)`, `create(storage)` ;
- aucune clé métier ni schéma Room/Graph dans le Core ;
- stockage injecté explicitement ;
- lecture absente, vide, JSON invalide, `null` et erreur de lecture couvertes ;
- round-trip objet/tableau couvert ;
- erreurs de sérialisation/écriture propagées ;
- service volontairement hors graphe production ;
- inventaire Phase 2 mis à jour : 72 fichiers baseline + 8 entrypoints Phase 3 + 2 services Phase 4, dont seul le resolver d’assets est connecté ;
- aucun changement de `index.html`, Pages, preview, service worker ou runtime module.

Validation fonctionnelle sur `6f4a66a7...` :
- Architecture + navigateur complet `35469487437` — SUCCESS ;
- Firefox `35469487438` — SUCCESS ;
- Tactical Dock `35469487439` — SUCCESS.

Le premier échec Architecture `35469444554` provenait uniquement d'un `deepStrictEqual` entre objets de realms Node `vm` différents ; le test a été corrigé pour comparer le contenu sérialisé sans changer le service.

Prochaine action après validation de cette fermeture documentaire :
1. créer `checkpoint/gensrpg-phase4-storage-core-service-green-2026-09-19` sur le HEAD exact validé ;
2. créer un checkpoint de départ et une branche neuve pour `DungeonRoomCreator100` ;
3. raccorder uniquement sa clé historique `gensrpg_dungeon_custom_rooms_v1` au service Core ;
4. charger `storage-v1.js` avant Room Creator dans Pages/preview et mettre à jour le cache PWA si nécessaire ;
5. conserver `normalizeRoom()`, le JSON persisté et les comportements de fallback exactement identiques ;
6. aucun autre Builder ni runtime Dungeon dans ce sous-lot.


## Chantier courant prioritaire — Phase 4 / stockage & migrations — audit Builders — 2026-09-19

Branche :
`work/gensrpg-phase4-storage-migrations-audit-2026-09-19`

Checkpoint de départ :
`checkpoint/gensrpg-start-phase4-storage-migrations-audit-2026-09-19`

Base exacte :
`9467429b7f195a24ec138cded7231f60b47ba5a4`
(`checkpoint/gensrpg-phase4-asset-resolver-complete-green-2026-09-19`)

Production `main` reste gelée sur :
`e8681f9823573ced8aec59c8ddc47a72b02bc663`.

### Objectif

Commencer le deuxième service commun de la Phase 4, `stockage / migrations`, uniquement par une caractérisation du sous-périmètre Builders avant toute extraction runtime.

La cartographie Phase 2 recense 221 accès directs, dont 74 dynamiques. Le lot ne tentera donc aucune centralisation globale.

### Sous-périmètre audité

Builders Dungeon uniquement :
- `assets/dungeon/dungeon-room-creator-100.js` ;
- `assets/dungeon/dungeon-room-creator-v2-167819.js` ;
- `assets/dungeon/dungeon-world-builder-167821.js` ;
- `assets/dungeon/dungeon-room-visual-config-167826.js`.

Clés réelles déjà confirmées :
- `gensrpg_dungeon_custom_rooms_v1` — bibliothèque Room Creator 1.0 ;
- `gensrpg_dungeon_room_interactions_v2` — métadonnées/attachements Room Creator V2 ;
- `gensrpg_zone_graphs_v1` — graphes World Builder, lus aussi par Visual Config.

La vieille cartographie Phase 2 n'avait résolu que deux de ces trois clés : `gensrpg_dungeon_custom_rooms_v1` avait été classée dynamique car `STORAGE_KEY` partage sa déclaration `const` avec d'autres constantes.

### Invariants

- conserver exactement les trois clés ;
- aucune migration de format pendant le premier déplacement ;
- `normalizeRoom`, `normalizeMeta`, `normalizeGraph` restent propriétaires des Builders ;
- aucun runtime Dungeon de partie, Save & Quit, Tactical, Capture ou Survie touché ;
- aucune suppression de compatibilité ;
- aucune nouvelle fabrique de clé dynamique ;
- aucun observer/timer/retry/wrapper ajouté.

### Première décision à valider

Si l'audit confirme l'absence d'autre propriétaire :
1. créer un service Core de stockage JSON minimal et testable ;
2. ne lui donner aucune connaissance métier des Rooms/Graphs ;
3. migrer d'abord `DungeonRoomCreator100` sur un sous-lot séparé ;
4. migrer ensuite V2 puis World Builder/Visual Config ;
5. seulement après ces jalons, réévaluer les stockages runtime beaucoup plus risqués comme `gensrpg_dungeon_runtime_v2`.

### Tests prévus

- caractérisation exacte des trois clés et de leurs lecteurs/writers ;
- parité lecture vide / JSON invalide / round-trip ;
- conservation des normalizers module ;
- sentinelles Builder existantes ;
- Architecture + navigateur complet + Firefox + Tactical Dock avant GREEN.

### Résultat audit Builders — GREEN

Audit dédié :
`docs/GENSRPG_PHASE4_STORAGE_BUILDER_AUDIT.md`

Sentinelle :
`tests/gens_phase4_storage_builder_audit_v1.test.cjs`

Résultat :
- trois clés Builders réelles confirmées :
  - `gensrpg_dungeon_custom_rooms_v1` ;
  - `gensrpg_dungeon_room_interactions_v2` ;
  - `gensrpg_zone_graphs_v1` ;
- correction de lecture de la cartographie Phase 2 : `gensrpg_dungeon_custom_rooms_v1` n'est pas dynamique ; elle avait seulement échappé au scanner à cause d'une déclaration `const` multiple ;
- les normalizers métier restent dans leurs modules ;
- aucune migration de format autorisée dans le premier déplacement ;
- `gensrpg_dungeon_runtime_v2` reste explicitement hors périmètre.

Validation du HEAD documentaire précédent :
- Architecture + navigateur complet `35464195718` — SUCCESS ;
- Firefox `35464195796` — SUCCESS ;
- Tactical Dock `35464195777` — SUCCESS.

Prochaine action après validation de cette fermeture documentaire :
1. créer `checkpoint/gensrpg-phase4-storage-builder-audit-green-2026-09-19` ;
2. ouvrir un nouveau sous-lot depuis ce checkpoint ;
3. créer un service Core stockage JSON minimal, hors production au premier jalon ;
4. le service ne doit connaître aucune clé métier ni aucun schéma Room/Graph ;
5. valider lecture absente, JSON invalide, `null`, round-trip et propagation des erreurs d'écriture ;
6. seulement après ce service GREEN, ouvrir un lot séparé pour raccorder `DungeonRoomCreator100`.


## Chantier courant prioritaire — Phase 4 / audit final resolver d’assets — 2026-09-19

Branche :
`work/gensrpg-phase4-asset-resolver-final-audit-2026-09-19`

Checkpoint de départ :
`checkpoint/gensrpg-start-phase4-asset-resolver-final-audit-2026-09-19`

Base exacte :
`c050f4516b6c3f312047929495e5e6f270139545`
(`checkpoint/gensrpg-phase4-asset-resolver-item-paths-green-2026-09-19`)

Production `main` reste gelée sur :
`e8681f9823573ced8aec59c8ddc47a72b02bc663`.

### Objectif

Auditer le reste du lot resolver d’assets contre la Phase 4 de la roadmap avant d’ouvrir un nouveau sous-lot runtime.

### Périmètre

- inventorier les dernières constructions de chemins d’assets actives dans `index.html` ;
- distinguer :
  - résolution d’entités dupliquée qui doit déléguer au Core ;
  - asset UI/tile exact appartenant légitimement au module Dungeon ;
- vérifier en priorité les couches héros tardives `dungeonCore213Stability` / `dungeonCore214SingleAuthority` et le bloc `dungeonCore055ExactAssets` ;
- ne modifier aucun runtime tant que la classification propriétaire n’est pas prouvée.

### Interdit

- aucun déplacement physique d’asset ;
- aucune migration de bloc 65 sans preuve de duplication de responsabilité ;
- aucune modification gameplay, mouvement, stockage, Tactical, Capture, Survie ou PvP ;
- aucun wrapper, observer, timer/retry ou fallback inter-module ;
- aucun merge sur `main`.

### Tests / sortie

Le lot d’audit doit produire une liste explicite :
1. chemins encore dupliqués à migrer ;
2. chemins exacts légitimes à conserver ;
3. sous-lot suivant minimal, s’il existe ;
4. si aucun resolver dupliqué ne reste, clôture du premier service Phase 4 et passage au service suivant de la roadmap : stockage / migrations.

### Résultat de l’audit

Audit dédié :
`docs/GENSRPG_PHASE4_ASSET_RESOLVER_FINAL_AUDIT.md`

Sentinelle :
`tests/gens_asset_resolver_final_audit_v1.test.cjs`

Classification prouvée :
- B.5 requis : mappings héros dupliqués dans Core 2.13 / 2.14 / 3.10 et fallbacks ennemi directs dans 3.09 / 3.10 ;
- B.6 requis : mapping logique des 8 loots `dloot_*` encore possédé par Core 0.23 ;
- bloc 65 : propriétaire de présentation Dungeon exact, pas un second resolver d’entités ; ne pas le migrer vers le Core partagé ;
- couches sols/portes/map : présentation Dungeon à traiter avec l’extraction du module/asset layout, pas comme logique commune.

Prochaine action après validation de cet audit :
1. checkpoint GREEN documentaire de l’audit ;
2. branche neuve B.5 depuis ce checkpoint ;
3. migrer uniquement les chemins d’entités des tokens tardifs vers les APIs Core existantes ;
4. B.6 séparé pour les loots ;
5. clôturer ensuite le resolver avant de passer à stockage/migrations.


## Chantier courant prioritaire — Phase 4 / B.5 chemins tokens tardifs — 2026-09-19

Branche :
`work/gensrpg-phase4-asset-resolver-late-token-paths-2026-09-19`

Checkpoint de départ :
`checkpoint/gensrpg-phase4-asset-resolver-final-audit-green-2026-09-19`

Base exacte :
`5777a7b1e4943c1a0d6e1196e360440b9462156c`

Audit source :
`docs/GENSRPG_PHASE4_ASSET_RESOLVER_FINAL_AUDIT.md`

Blob exact `index.html` :
`388d1b49adbe5d9ac80a4b5474f51b0b2b0b7fc9`
(vérifié localement, 8 175 046 octets).

### Périmètre B.5

Propriétaires historiques concernés uniquement :
- `dungeonCore213Stability.heroImg()` ;
- `dungeonCore214SingleAuthority.heroArt()` ;
- `dungeonCore309VisualFixes.enemyArt()` ;
- `dungeonCore310PersistenceAndTokens.heroArt()` ;
- `dungeonCore310PersistenceAndTokens.enemyArt()`.

Objectif :
- supprimer les tables Aldren/Lyra/Brom dupliquées dans ces couches tardives ;
- remplacer leurs constructions de chemins built-in par les APIs déjà existantes :
  - `GensAssetResolverV1.dungeonHeroPath(id)` ;
  - `GensAssetResolverV1.dungeonCreaturePath(id)` ;
- conserver la priorité des images/avatar personnalisés et des définitions ennemies existantes ;
- ne toucher à aucune position, paint/token layout, persistance, mouvement, combat, observer local ou navigation.

### Interdit

- aucun loot `dloot_*` dans ce sous-lot ;
- aucun bloc 65 ;
- aucun déplacement physique d’asset ;
- aucun fallback inter-module ;
- aucun nouveau wrapper/observer/timer/retry ;
- aucun merge sur `main`.

### Validation prévue

1. RED propriétaire dédié avant runtime ;
2. test du vrai preview/DOM pour vérifier que les tokens tardifs gardent les mêmes sources d’images ;
3. raccord minimal des cinq helpers ;
4. réalignement des empreintes Phase 2 uniquement si le blob change ;
5. Architecture + navigateur complet + Firefox + Tactical Dock ;
6. checkpoint B.5 GREEN avant d’ouvrir B.6 loots.

### Résultat B.5 — GREEN fonctionnel

RED propriétaire :
- test `tests/gens_asset_resolver_late_token_owner_v1.test.cjs` ;
- run Architecture `35455796033` — échec attendu uniquement sur l’étape 86 « Verrouiller l’autorité Core des chemins de tokens Dungeon tardifs » ;
- Firefox `35455795905` — SUCCESS ;
- Tactical Dock `35455795901` — SUCCESS.

Raccord runtime :
- workflow one-shot vérifié : run `35455873108` — SUCCESS ;
- commit runtime `6707682d2d5cdd71dcd2995455bf67076bbc3562` ;
- ancien blob `index.html` : `388d1b49adbe5d9ac80a4b5474f51b0b2b0b7fc9` ;
- nouveau blob : `207353f408d8c60213b512f73184bb9ec666b75d` ;
- `dungeonCore213Stability.heroImg()`, `dungeonCore214SingleAuthority.heroArt()` et `dungeonCore310PersistenceAndTokens.heroArt()` délèguent aux chemins héros du Core ;
- `dungeonCore309VisualFixes.enemyArt()` et `dungeonCore310PersistenceAndTokens.enemyArt()` passent d’abord par le resolver Core pour les IDs Dungeon built-in ;
- les fallbacks legacy non-`dng_*` restent après le chemin canonique pour ne pas changer le comportement historique hors périmètre ;
- aucun paint, positionnement, mouvement, combat, persistance, observer local ou règle de token modifié ;
- workflow one-shot supprimé dans le même commit.

Cartographie :
- commit `561a960e15ea258d70ab48e98bc8d3e950c100e0` réaligne les empreintes Phase 2 sur le blob `207353f4...` et fait passer l’audit final en état « B.5 résolu / B.6 restant ».

Parité navigateur :
- `tests/gens_asset_resolver_late_tokens_browser_v1.test.cjs` traverse le vrai Shell -> Dungeon -> Salle -> tokens finaux ;
- Aldren reste sur `assets/dungeon/creatures/dng_aldren.png` ;
- un ennemi built-in reste sur le chemin renvoyé par `dungeonCreaturePath()` ;
- l’entrée aléatoire de salle est figée uniquement dans la fixture de test afin d’exercer déterministement le vrai spawn/renderer, sans injecter d’asset ni de sortie moteur ;
- le diagnostic Tactical normal `not-detected-v113` est exclu des erreurs de cette sentinelle d’assets.

Validation fonctionnelle finale sur `4c19eb9a771d9f5bdde95419700ea618ad7b34d4` :
- Architecture + navigateur complet `35456295767`, tentative 2 — SUCCESS ;
- Firefox `35456295711` — SUCCESS ;
- Tactical Dock `35456295720` — SUCCESS.
La tentative 1 du navigateur a été interrompue par la dette préexistante du vieux scénario Dungeon -> Survie : overlay Tactical interceptant le clic. Le rerun du même SHA passe sans modification runtime.

Prochaine action :
1. valider la fermeture documentaire sur les trois workflows ;
2. créer `checkpoint/gensrpg-phase4-asset-resolver-late-token-paths-green-2026-09-19` sur le HEAD documentaire exact ;
3. ouvrir B.6 depuis ce checkpoint ;
4. B.6 doit uniquement centraliser les 8 mappings `dloot_*` dans `dungeonItemPath()` et retirer la table/racine dupliquée de Core 0.23 ;
5. aucun changement de `main`.


## Chantier courant prioritaire — Phase 4 / B.6 chemins loots Dungeon — 2026-09-19

Branche :
`work/gensrpg-phase4-asset-resolver-loot-paths-2026-09-19`

Checkpoint de départ :
`checkpoint/gensrpg-start-phase4-asset-resolver-loot-paths-2026-09-19`

Base exacte :
`bd78c55aba0d98d6c7fde96420526d5ef88f0929`
(`checkpoint/gensrpg-phase4-asset-resolver-late-token-paths-green-2026-09-19`)

Blob exact `index.html` :
`207353f408d8c60213b512f73184bb9ec666b75d`
(copie locale déjà vérifiée).

### Périmètre B.6

Propriétaire historique concerné :
- `dungeonCore023StabilityFix` ;
- table locale `DC023_LOOT_ART` ;
- racine locale `DC023_ASSET_ROOT` ;
- décorateur `window.dungeonLootCatalog160`.

Objectif :
- ajouter les 8 IDs `dloot_*` au mapping existant `DUNGEON_ITEM_FILES` du resolver Core ;
- faire déléguer Core 0.23 à `GensAssetResolverV1.dungeonItemPath(id)` ;
- conserver la priorité `it.image_data || chemin canonique` ;
- conserver strictement les définitions de loot, tables de drop, quantités, chances, prix et raretés.

### Interdit

- aucun changement de gameplay/drop/économie ;
- aucun déplacement physique d’asset ;
- aucun bloc 65 ;
- aucun fallback inter-module ;
- aucun nouveau resolver/API loot concurrent ;
- aucun observer/timer/retry/wrapper global ;
- aucun merge sur `main`.

### Validation prévue

1. RED propriétaire B.6 ;
2. test Core resolver des 8 IDs ;
3. vrai navigateur : `dungeonLootCatalog160()` conserve les mêmes chemins ;
4. raccord minimal Core 0.23 ;
5. réalignement des empreintes Phase 2 si le blob change ;
6. Architecture + navigateur complet + Firefox + Tactical Dock ;
7. checkpoint B.6 GREEN ;
8. audit final de non-duplication puis clôture du service resolver.


### Résultat B.6 — GREEN fonctionnel

RED propriétaire :
- test `tests/gens_asset_resolver_loot_owner_v1.test.cjs` ;
- Architecture `35461112854` — échec attendu uniquement sur l’étape 87 « Verrouiller l’autorité Core des chemins de loots Dungeon » ;
- Firefox `35461112846` — SUCCESS ;
- Tactical Dock `35461112853` — SUCCESS.

Raccord :
- ajout des 8 IDs `dloot_*` à `DUNGEON_ITEM_FILES` dans le resolver Core au commit `2f4df4af4b63f1f80551994315495f9e72174d5c` ;
- workflow one-shot `35461191517` — SUCCESS ;
- commit runtime `66a85755c2729b45f4d0dfd3a047ea85bcf068f4` ;
- ancien blob `index.html` : `207353f408d8c60213b512f73184bb9ec666b75d` ;
- nouveau blob : `ff11682d74be7921a591a9b76080eaf337c071be` ;
- `DC023_LOOT_ART` et `DC023_ASSET_ROOT` supprimés ;
- `dungeonCore023StabilityFix` délègue à `GensAssetResolverV1.dungeonItemPath()` ;
- priorité `it.image_data || canonical` conservée ;
- aucune définition de loot, rareté, prix, chance, quantité, drop ou économie modifiée ;
- workflow one-shot supprimé dans le même commit.

Cartographie / audit :
- commit `2ad16e7fab5e500ddb7b938f804b312160f488cd` réaligne les empreintes Phase 2 sur `ff11682d...` ;
- le contrat pur couvre maintenant les 8 IDs loot ;
- l’audit final ne contient plus de duplication logique de resolver à migrer ;
- le bloc 65 reste explicitement classé comme propriétaire légitime de présentation Dungeon.

Parité navigateur :
- `tests/gens_asset_resolver_browser_v1.test.cjs` vérifie les 8 chemins `dloot_*` via le vrai `dungeonLootCatalog160()` ;
- les chemins restent `assets/dungeon/creatures/<id>.png` ;
- aucun changement visible attendu.

Validation fonctionnelle finale sur `5f93c824c4142f2f18b11a784635c4ec38519372` :
- Architecture + navigateur complet `35461321604` — SUCCESS ;
- Firefox `35461321689` — SUCCESS ;
- Tactical Dock `35461321634` — SUCCESS.

### Sortie du service resolver d’assets

Le premier service Phase 4 est fonctionnellement terminé :
- créatures Dungeon -> Core ;
- héros built-in -> Core ;
- objets built-in -> Core ;
- tokens tardifs héros/ennemis -> Core ;
- loots `dloot_*` -> Core ;
- overrides personnalisés conservés ;
- aucun fallback inter-module ajouté ;
- les assets UI/tuiles exacts restent au module Dungeon et seront rangés physiquement en Phase 11.

Prochaine action :
1. valider cette fermeture documentaire avec Architecture + navigateur complet + Firefox + Tactical Dock ;
2. créer le checkpoint B.6 GREEN et le checkpoint de clôture du resolver sur le HEAD documentaire exact ;
3. ouvrir ensuite le service Phase 4 suivant : **stockage / migrations** ;
4. aucun changement de `main`.


## Chantier courant prioritaire — Phase 4 / resolver d’assets — 2026-09-19

Branche :
`work/gensrpg-phase4-asset-resolver-item-paths-2026-09-19`

Checkpoint de départ :
`checkpoint/gensrpg-phase4-asset-resolver-hero-paths-green-2026-09-19`

Base exacte :
`c4e32b99185b8908aa645ba7c6fcaf7a706fafbb`
(`checkpoint/gensrpg-phase4-asset-resolver-hero-paths-green-2026-09-19`)

Production `main` reste gelée sur V16.78.114.11 :
`e8681f9823573ced8aec59c8ddc47a72b02bc663`.

### Objectif du lot

Phase 4, lot 1 conformément à la roadmap :
- extraire / consolider le resolver d’assets commun ;
- conserver exactement les chemins et résultats actuels ;
- supprimer l’ancienne autorité inline seulement après vrai raccord GREEN ;
- ne déplacer aucun asset physique dans ce premier lot.

### État source `index.html`

Le fichier fourni par l’utilisateur au blob `55453138449d07bde731ff6934acc442f56bae32` a été réconcilié avec l’unique correction fiche RPG validée.
Copie locale exacte reconstruite et vérifiée contre le checkpoint courant :
- taille : 8 175 814 octets ;
- blob Git : `d942934741ca200319de02116c4dd384722d39c7`.

### Propriétaires candidats à caractériser

Cartographie Phase 2 inline :
- bloc 30 : Dungeon GitHub-hosted art catalogue/binding ;
- bloc 31 : Dungeon art rendering compatibility and visual binding fixes ;
- bloc 32 : Dungeon direct image binding layer ;
- bloc 33 : Dungeon hero/item asset build marker and bindings ;
- bloc 65 : Dungeon exact assets.

Ces blocs sont des candidats, pas encore déclarés propriétaires uniques.

### Périmètre autorisé

- inventorier les fonctions/globales réellement utilisées pour résoudre héros, ennemis, objets, tuiles et UI ;
- identifier le vrai resolver et distinguer catalogue / consommateur / compatibilité ;
- créer le service Core dans `assets/gensrpg/core/` uniquement après caractérisation ;
- raccorder progressivement les consommateurs au service Core ;
- ajouter des sentinelles de résolution et de non-interférence.

### Interdit

- aucun déplacement physique de PNG/JPG/WebP ;
- aucun fallback inter-module nouveau ;
- aucune modification de gameplay, combat, mouvement ou événements ;
- aucune modification de la fiche héros ;
- aucun observer, timer/retry, wrapper global de réparation ou second resolver permanent ;
- aucun changement de `main`;
- ne pas toucher au lot événements d’Agent 1.

### Invariants

- un `artId` explicite reste prioritaire lorsqu’il l’est déjà ;
- les chemins Dungeon actuels restent identiques pendant l’extraction ;
- aucun asset Dungeon ne devient fallback Survie/Capture/PvP ;
- le resolver Core ne doit pas devenir propriétaire d’une règle de gameplay ;
- l’UI consomme un chemin résolu, elle ne recrée pas sa propre table concurrente.

### Tests requis avant GREEN

1. caractérisation des résolutions actuelles par vrai chemin ;
2. héros Dungeon : Aldren/Lyra/Brom ;
3. ennemis/boss Dungeon ;
4. objets avec `artId` ;
5. murs/portes/coffres/tuiles déjà couverts ;
6. fallback nominal existant uniquement là où il est aujourd’hui autorisé ;
7. Survie/Capture/PvP inchangés ;
8. Architecture + navigateur complet ;
9. Firefox ;
10. Tactical Dock.

### Coordination

Agent 1 travaille séparément sur les événements après déplacement.
Ne pas ouvrir le lot performance mouvement avant son diagnostic propriétaire.

### Jalon A — service pur hors production — GREEN

Checkpoint intermédiaire :
`checkpoint/gensrpg-phase4-asset-resolver-service-green-2026-09-19`

SHA :
`8a653e9939a1c66f56160bba8373b5593763a66e`

Résultat :
- `assets/gensrpg/core/asset-resolver-v1.js` créé comme service pur ;
- le service reste volontairement hors graphe production ;
- résolution Dungeon couverte pour créatures, héros built-in et objets built-in ;
- priorité d’un override explicite conservée ;
- aucun fallback implicite Dungeon vers Survie/Capture/PvP ;
- aucun DOM, stockage, observer, listener, timer ou gameplay dans le resolver ;
- garde Phase 2 mis à jour pour distinguer 72 fichiers historiques + 8 entrypoints Phase 3 + 1 service Phase 4 hors production ;
- graphe production inchangé à 65 fichiers atteignables.

Validation :
- Architecture + navigateur complet `35434977969` — SUCCESS ;
- Firefox `35434977895` — SUCCESS ;
- Tactical Dock `35434977920` — SUCCESS.

### Jalon B.1 — parité historique réelle figée — GREEN

Sentinelle navigateur :
`tests/gens_asset_resolver_browser_v1.test.cjs`

HEAD validé :
`a351d084d0feb45493ce330fec75f5138ecf39c1`

La vraie composition `preview.html` verrouille désormais avant migration :
- `dungeonAutoArtPath164('dng_skeleton')` -> `assets/dungeon/creatures/dng_skeleton.png` ;
- `gensDungeonCreatureArt165('dng_skeleton')` -> même chemin canonique ;
- héros built-in Aldren/Lyra/Brom -> chemins actuels inchangés ;
- objets built-in représentatifs -> chemins actuels inchangés ;
- collisions Survie (`walker`) et Capture (`braiseau`) -> aucune résolution Dungeon ;
- override ennemi explicite -> reste prioritaire sur le chemin canonique ;
- le resolver Core Phase 4 reste encore hors graphe production à ce sous-jalon.

Validation sur `a351d084d0feb45493ce330fec75f5138ecf39c1` :
- Architecture + navigateur complet `35435294480` — SUCCESS ;
- Firefox `35435294459` — SUCCESS ;
- Tactical Dock `35435294469` — SUCCESS.

### Jalon B.2 — raccord Core des chemins de créatures — GREEN

Commit runtime :
`7d0a38b94e60676b17eb9521c29f11018dff8456`

HEAD fonctionnel validé :
`cc1b6c729a9c96f929751db124783b4954a9169a`

Blob `index.html` :
- avant : `d942934741ca200319de02116c4dd384722d39c7` ;
- après : `286e427df42bc1a04cc981ecbdf90ecb4de547ab`.

Raccord appliqué :
- `assets/gensrpg/core/asset-resolver-v1.js` est chargé explicitement avant les anciens consommateurs Dungeon ;
- `dungeonAutoArtPath164()` délègue à `GensAssetResolverV1.dungeonCreaturePath()` ;
- le constructeur `artPath` du bloc V165 délègue au même propriétaire Core ;
- le constructeur `dungeonPath166` du bloc V166 délègue au même propriétaire Core ;
- `GENSRPG_DUNGEON_ASSET_ROOT_168` reste uniquement comme alias délégué à `GensAssetResolverV1.ROOTS.dungeon.creatures` ;
- le bloc `dungeonCore055ExactAssets` reste volontairement inchangé : il possède des assets UI exacts et n’appartient pas à ce sous-lot ;
- aucun asset physique déplacé ;
- aucun wrapper, observer, timer/retry, stockage ou gameplay ajouté ;
- les overrides personnalisés existants restent au-dessus du chemin canonique.

Cartographie réalignée :
- graphe production : 66 fichiers JS atteignables ;
- le resolver Core possède désormais un propriétaire runtime explicite `GenSrpG Core Assets` ;
- les 8 entrypoints Phase 3 restent inertes et hors production ;
- manifestes inline/timers/effets globaux/stockage/hors-graphe réalignés sans changer leurs dettes fonctionnelles ;
- le resolver n’ajoute aucun observer, timer, listener, stockage ou wrapper ; seule son API publique `GensAssetResolverV1` est exportée ;
- RED propriétaire obtenu avant correction : Architecture `35439183155`, échec au seul nouveau garde de raccord.

Validation sur `cc1b6c729a9c96f929751db124783b4954a9169a` :
- Architecture + navigateur complet `35439871786` — SUCCESS ;
- Firefox `35439871780` — SUCCESS ;
- Tactical Dock `35439871790` — SUCCESS.

Le navigateur complet valide notamment :
- Survie ;
- Dungeon après Survie ;
- Builder Dungeon ;
- Config objet moderne ;
- fiche RPG sans flash Survie ;
- caches/pièges authored ;
- Save & Quit / reprise ;
- PvP ;
- Monster Capture ;
- non-interférence quatre modules ;
- preview ;
- parité réelle du resolver d’assets et priorité des overrides.

### Jalon B.3 — propriétaire chemins héros Dungeon — GREEN

Checkpoint de départ créé :
`checkpoint/gensrpg-phase4-asset-resolver-creature-paths-green-2026-09-19`
sur `88150851852f6e9e27e6c756a472cac3a58d1e1a`.

Caractérisation :
- `dungeonBuiltinHeroGithubArt168()` et `dungeonItems()` appartiennent au même gros script historique inline non identifié, pas au marqueur `dungeonHeroItemAssets168Marker` ;
- le marqueur bloc 33 reste seulement un alias de racine délégué ;
- ce sous-lot est limité aux héros ; les objets restent volontairement inchangés.

RED dédié :
- test `tests/gens_asset_resolver_hero_owner_v1.test.cjs` ;
- Architecture `35441301589` : échec uniquement sur la nouvelle étape d’autorité héros après succès des 82 étapes précédentes ;
- Firefox et Tactical Dock restent GREEN sur le même état RED.

Commits runtime :
- délégation héros : `a8e420df976a391e00438d7d6a2056fff46a48fe` ;
- ordre de chargement propriétaire : `8659cfeea3d07af6555ed5eef1e0cd628ef51a58`.

Blobs `index.html` :
- avant délégation héros : `286e427df42bc1a04cc981ecbdf90ecb4de547ab` ;
- après délégation : `04ca2b3803618694f8254e7b6a8fb103cfafa742` ;
- après raccord d’ordre de chargement : `ba47d9fb3b8aa1a2183e764455aae97e03965440`.

Raccord appliqué :
- `dungeonBuiltinHeroGithubArt168(id)` délègue maintenant à `GensAssetResolverV1.dungeonHeroPath(id)` ;
- la table héroïque historique dupliquée est retirée de ce helper ;
- `ensureDungeonHeroes()` conserve exactement la priorité existante `ov.avatar || githubArt || dungeonBuiltinPortrait(id)` ;
- le resolver Core est désormais chargé avant le gros script historique qui contient `dungeonBuiltinHeroGithubArt168()` et `dungeonItems()` ;
- l’ancien emplacement de chargement avant les blocs 30–32 est retiré, sans second chargement ;
- `dungeonItems()` et sa table `githubItemArts` ne sont pas modifiés ;
- aucun asset déplacé ;
- aucun gameplay, stockage, observer, timer/retry ou wrapper ajouté.

RED navigateur de load-order :
- Architecture + navigateur `35441536699` : statique GREEN, échec au vrai lancement Survie ;
- cause exacte : `dungeonBuiltinHeroGithubArt168()` était appelé avant le chargement du resolver, avec `GensAssetResolverV1 === undefined` ;
- Firefox `35441536658` et Tactical Dock `35441536713` restaient GREEN ;
- le garde statique `gens_asset_resolver_hero_owner_v1.test.cjs` verrouille désormais le chargement du Core avant le propriétaire historique héros/objets.

Validation finale du candidat sur `f7f7a2f456e2d3eb9f24bb910e7f8e6fc9cd08d0` :
- Architecture + navigateur complet `35441696020` — SUCCESS ;
- Firefox `35441695942` — SUCCESS ;
- Tactical Dock `35441695944` — SUCCESS.

Le navigateur complet valide notamment :
- isolation V114.11 ;
- lancement réel Survie ;
- Dungeon après Survie ;
- Dungeon Builder ;
- Config objet moderne ;
- fiche RPG ;
- caches/pièges authored ;
- Save & Quit / reprise ;
- PvP ;
- Capture ;
- non-interférence quatre modules ;
- murs Tactical ;
- preview ;
- parité réelle du resolver d’assets.

Validation documentaire finale B.3 :
- HEAD `c4e32b99185b8908aa645ba7c6fcaf7a706fafbb` ;
- Architecture + navigateur complet `35446436225` — SUCCESS ;
- Firefox `35446436232` — SUCCESS ;
- Tactical Dock `35446436226` — SUCCESS.

Checkpoint B.3 créé :
`checkpoint/gensrpg-phase4-asset-resolver-hero-paths-green-2026-09-19`
sur `c4e32b99185b8908aa645ba7c6fcaf7a706fafbb`.

### Jalon B.4 — chemins objets built-in Dungeon — GREEN

Branche dédiée :
`work/gensrpg-phase4-asset-resolver-item-paths-2026-09-19`

Blob source exact `index.html` :
`ba47d9fb3b8aa1a2183e764455aae97e03965440`
(taille vérifiée localement : 8 175 684 octets).

Propriétaire réel :
- `dungeonItems()` dans le gros script historique héros/objets ;
- il possède encore une table locale `githubItemArts` de 13 objets ;
- il reconstruit encore `assets/dungeon/creatures/<fichier>` ;
- `GensAssetResolverV1.dungeonItemPath(id)` possède déjà la même table canonique dans le Core.

Invariant à préserver :
`image_data: ov.image_data || asset canonique || dungeonItemArt(...)`.

Périmètre B.4 :
- supprimer uniquement la table/concaténation d’asset dupliquée de `dungeonItems()` ;
- déléguer le chemin built-in à `GensAssetResolverV1.dungeonItemPath(it.id)` ;
- conserver la base gameplay des objets, les overrides, crop, équipements, loot et fallback SVG inchangés ;
- ne pas toucher au bloc 65, aux assets UI exacts ni déplacer de fichiers.

RED propriétaire B.4 :
- test `tests/gens_asset_resolver_item_owner_v1.test.cjs` ;
- Architecture `35446784367` : échec attendu uniquement sur l’étape 84 « autorité Core des chemins d’objets Dungeon » ;
- Firefox `35446784379` — SUCCESS ;
- Tactical Dock `35446784428` — SUCCESS.

Raccord runtime :
- commit `0e45d9659f99f03a8f3a52d631a21a6a6692421b` ;
- ancien blob `index.html` : `ba47d9fb3b8aa1a2183e764455aae97e03965440` ;
- nouveau blob : `388d1b49adbe5d9ac80a4b5474f51b0b2b0b7fc9` ;
- table locale `githubItemArts` supprimée de `dungeonItems()` ;
- chemin built-in délégué à `GensAssetResolverV1.dungeonItemPath(it.id)` ;
- priorité conservée : `ov.image_data || canonicalArt || dungeonItemArt(...)` ;
- définitions gameplay, loot, crop, stockage et fallback généré inchangés ;
- workflow one-shot supprimé dans le même commit.

Cartographie :
- commit `f0a245a226953cb77254fff61c477bbb13ecdc5d` réaligne uniquement les quatre empreintes Phase 2 liées au blob ;
- le garde B.3 a été débarrassé de son ancienne assertion temporaire « objets encore historiques » au commit `1d40aabc13dc827fbd86166605570dc687a3a9f0` ; la responsabilité objets est désormais verrouillée par le garde B.4 dédié.

Validation finale du candidat `1d40aabc13dc827fbd86166605570dc687a3a9f0` :
- Architecture + navigateur complet `35446950829` — SUCCESS ;
- Firefox `35446950803` — SUCCESS ;
- Tactical Dock `35446950805` — SUCCESS.

Le navigateur Phase 4 confirme :
- chemins représentatifs longsword / potion / amulette inchangés ;
- override personnalisé ennemi toujours prioritaire ;
- override personnalisé objet toujours prioritaire ;
- Survie/Capture ne deviennent pas des fallbacks Dungeon ;
- non-interférence quatre modules, Save & Quit, authored, Builder, fiche RPG, murs et preview restent GREEN.

### Prochaine action

1. faire valider cette fermeture documentaire par Architecture + navigateur complet + Firefox + Tactical Dock ;
2. créer ensuite `checkpoint/gensrpg-phase4-asset-resolver-item-paths-green-2026-09-19` sur le HEAD documentaire exact validé ;
3. depuis ce checkpoint, auditer le reste du lot assets contre la roadmap avant d’ouvrir un nouveau sous-lot ;
4. ne pas supposer que le bloc 65 doit être migré : confirmer d’abord s’il possède des assets UI exacts légitimes ou une résolution dupliquée ;
5. aucun changement de `main`.

## Production sûre

- `main` gelé : V16.78.114.11
- SHA attendu : `e8681f9823573ced8aec59c8ddc47a72b02bc663`
- ne jamais travailler directement sur `main`

## Chantier courant prioritaire — Fiche RPG / isolation Shell — 2026-09-19

Branche :
`work/gensrpg-rpg-sheet-shell-isolation-2026-09-19`

Checkpoint de départ :
`checkpoint/gensrpg-start-rpg-sheet-shell-isolation-2026-09-19`

Base exacte :
`7b8173f7ca949f4592cacd51610d1c11f953f829`

Dernier checkpoint GREEN :
`checkpoint/gensrpg-object-config-editor-green-2026-09-19`
sur le même SHA.

Production `main` reste gelée :
`e8681f9823573ced8aec59c8ddc47a72b02bc663` — V16.78.114.11.

### Signalement utilisateur

En contexte RPG/Dungeon, à l'ouverture de la fiche personnage :
- une fiche ressemblant à la fiche Zombicide/Survie peut apparaître brièvement ;
- la fiche RPG correcte reprend ensuite l'affichage ;
- ce flash démontre qu'une ancienne autorité Survie/commune peut encore rendre avant le propriétaire RPG.

### Périmètre

Module concerné :
- Shell / fiche personnage en contexte Adventure RPG / Dungeon.

Responsabilité :
- ouverture et premier rendu de la fiche personnage ;
- choix du renderer selon le module actif.

Autorisé :
- caractériser le premier writer/renderer qui remplit ou affiche la fiche ;
- caractériser l'ordre réel des couches et événements ;
- retirer au propriétaire fautif son autorité en contexte RPG ;
- renforcer les sentinelles de frontière fiche Survie / fiche RPG.

Interdit :
- aucune modification des stats, progression, équipement, inventaire ou talents sauf preuve directe du propriétaire ;
- aucune modification Tactical ;
- aucune modification mouvement, coffre, événements ou détection ennemie ;
- aucun MutationObserver, heartbeat, polling, retry ou timer de réparation ;
- aucun second renderer de fiche ;
- aucune règle basée sur un simple délai d'affichage ;
- aucun changement sur `main`.

Propriétaire attendu par la charte :
- fiche personnage : Shell/module actif selon contexte, jamais Tactical.

### Résultat final — fiche RPG sans flash Survie

Correctif runtime propriétaire :
- commit `e105f9f0adad20bce43edae928f3412dfd61f1f7` ;
- fichier runtime : `index.html` ;
- ancien blob : `55453138449d07bde731ff6934acc442f56bae32` ;
- nouveau blob : `d942934741ca200319de02116c4dd384722d39c7` ;
- diff fonctionnel : **1 ligne**.

Correction :
- suppression du `setTimeout(...,0)` qui différait la préparation RPG au début de `render()` ;
- les propriétaires déjà existants `applyDungeonSheetIdentity()`, `renderDungeonHeroStats()`, `renderDungeonSkillTree()` et `updateDungeonSearchUi()` sont maintenant appelés synchroniquement ;
- aucune nouvelle fiche, aucun masque, aucun observer, aucun timer/retry ou renderer concurrent ajouté.

Preuve navigateur :
- le vrai bouton héros Dungeon appelle toujours le chemin natif `openChar()` ;
- à la sortie d'`openChar()`, le panneau `#zombicideSkillPanel` est déjà masqué ;
- `raf1` et `raf2` ne montrent jamais le panneau Survie/Zombicide ;
- les onglets Dungeon sont présents dans l'état final.

HEAD propre validé après retrait des workflows one-shot :
`86fe1c4b9c05359d668e48637bd4d7aa6a3d8e7a`

Validation :
- Architecture + navigateur complet `35433350018` — SUCCESS ;
- Firefox `35433350007` — SUCCESS ;
- Tactical Dock `35433350015` — SUCCESS.

Aucun changement sur `main`.

### Coordination après ce lot

Agent 1 travaille séparément sur :
- déclenchement tardif coffre après déplacement ;
- détection / ligne de vue ennemie après déplacement.

Ne pas ouvrir en parallèle un lot performance déplacement tant que ce diagnostic touche potentiellement le même propriétaire de fin de mouvement.

Prochaine action locale :
1. fermer ce lot avec checkpoint GREEN ;
2. attendre le résultat propriétaire d'Agent 1 avant tout chantier touchant la fin de mouvement ;
3. conserver la dette performance déplacement séparée et non modifiée.

### Diagnostic navigateur confirmé — flash Survie dans la fiche RPG

Sentinelle :
`tests/gens_rpg_sheet_survival_flash_browser_v11411.test.cjs`

Commit de caractérisation :
`edf99d16285d9a0dd7f7d8facdf188b56865bee6`

Résultat :
- le vrai bouton `#dc01Heroes .dc01Hero` ouvre la fiche par la fonction native `openChar()` ;
- `openChar()` rend `#sheet` visible immédiatement ;
- à la sortie de `openChar()`, en contexte `adventure` + profil `game_profile_dungeon_demo`, `#zombicideSkillPanel` reste visible alors que `#dungeonSheetTabs` est encore masqué ;
- cet état reste visible pendant plusieurs frames ;
- `renderDungeonAttributes()` n'arrive qu'environ 230 ms plus tard ;
- `renderDungeonHeroStats()` puis `renderDungeonSkillTree()` arrivent ensuite ;
- `renderDungeonSkillTree()` finit par masquer `#zombicideSkillPanel` ;
- `applyDungeonSheetTabs()` arrive environ 525 ms après l'entrée dans `openChar()` et installe finalement l'état RPG attendu.

Cartographie Phase 2 :
- dernier propriétaire global de `openChar` : bloc inline `dungeonCore028HeroExploreGuard` ;
- ordre inline : 38 ;
- domaine déclaré : Dungeon.

Modules externes contrôlés :
- `gens-rpg-stats-clean-167874.js` : décorateur/normalisation stats, ne possède pas l'ouverture de fiche ;
- `gens-stat-upgrade-policy-167898.js` : décorateur de progression/stat, ne possède pas `openChar` ;
- `gens-dungeon-hero-art-repair-167874.js` : réparation visuelle hors propriétaire de fiche ;
- `gens-hero-editor-dynamic-167897.js` : éditeur/décoration différée ;
- `gens-dungeon-ui-cleanup-1678100.js` : wrappe `openChar` uniquement pour programmer son nettoyage UI, sans installer l'état RPG ;
- les couches art de fiche V99/V102 sont déjà retirées/inertes selon les sentinelles existantes.

Conclusion :
- le flash utilisateur est reproduit et expliqué ;
- la correction doit viser le propriétaire inline natif de l'ouverture/visibilité de fiche, pas ajouter une couche de masquage externe ;
- aucun correctif runtime ne doit être écrit sans inspection du `index.html` exact.

### Correctif propriétaire appliqué — candidat à valider

Fichier exact fourni par l'utilisateur et vérifié :
- taille : `8 175 835` octets ;
- blob Git attendu/reçu : `55453138449d07bde731ff6934acc442f56bae32`.

Diagnostic confirmé dans `index.html` :
- `openChar()` rend `#sheet` visible avant le premier rendu ;
- `render()` différéait l'identité Dungeon avec `setTimeout(...,0)` ;
- pendant ce délai, le panneau `#zombicideSkillPanel` restait visible ;
- `renderDungeonSkillTree()` et `applyDungeonSheetTabs()` reprenaient ensuite l'autorité.

Correctif runtime :
- commit `e105f9f0adad20bce43edae928f3412dfd61f1f7` ;
- ancien blob `index.html` : `55453138449d07bde731ff6934acc442f56bae32` ;
- nouveau blob `index.html` : `d942934741ca200319de02116c4dd384722d39c7` ;
- changement fonctionnel : suppression du `setTimeout(...,0)` qui retardait l'identité RPG dans le propriétaire natif `render()` ;
- les mêmes fonctions existantes `applyDungeonSheetIdentity()`, `renderDungeonHeroStats()`, `renderDungeonSkillTree()` et `updateDungeonSearchUi()` sont appelées synchroniquement ;
- aucun nouveau renderer, masque, observer, wrapper, timer/retry, stockage ou règle de gameplay ajouté ;
- workflow one-shot supprimé dans le même commit.

Effet attendu :
- le même appel `openChar()` conserve l'ouverture de la fiche ;
- avant le premier paint, le renderer propriétaire a déjà masqué l'état Zombicide et posé l'identité Dungeon ;
- aucune autorité externe n'est ajoutée.

Validation automatique obtenue :
- HEAD candidat : `d35be1bd200aa17ba172d8cf8a8790790db7f2e9` ;
- Architecture + navigateur complet `35432531222` — SUCCESS ;
- Firefox `35432531231` — SUCCESS ;
- Tactical Dock `35432531226` — SUCCESS ;
- sentinelle `gens_rpg_sheet_survival_flash_browser_v11411.test.cjs` — SUCCESS ;
- Dungeon après Survie — SUCCESS ;
- Config objet — SUCCESS ;
- cache / retour / pièges authored — SUCCESS ;
- Save & Quit / reprise — SUCCESS ;
- Capture courant + composition complète — SUCCESS ;
- PvP — SUCCESS ;
- non-interférence quatre modules — SUCCESS ;
- murs / preview — SUCCESS.

Précision sur la sentinelle :
- le premier RED après correction venait de snapshots injectés au milieu du même appel JavaScript synchrone ;
- ces états internes ne peuvent pas être peints par le navigateur ;
- la sentinelle vérifie désormais les frontières réellement visibles : sortie de clic, `requestAnimationFrame` 1/2, `setTimeout(0)` et état final ;
- le panneau `#zombicideSkillPanel` est déjà masqué à chacune de ces frontières ;
- `openChar()` finit lui-même avec le panneau Zombicide masqué.

État :
- candidat automatiquement GREEN ;
- test utilisateur manuel requis avant checkpoint final ;
- aucun merge sur `main`.

### Règle 26 déclenchée

Le contenu exact de `index.html` est maintenant nécessaire pour inspecter le bloc `dungeonCore028HeroExploreGuard` et la chaîne native `openChar -> rendu Dungeon`.

SHA exact demandé :
`edf99d16285d9a0dd7f7d8facdf188b56865bee6`

Permalink :
`https://github.com/slyen4425-cloud/Zombicide-40k/blob/edf99d16285d9a0dd7f7d8facdf188b56865bee6/index.html`

Le fichier reçu doit être vérifié avant toute modification.
Aucun ancien `index.html` local ne doit être utilisé.

### Diagnostic obligatoire avant correction

1. traverser le vrai Shell vers Adventure -> Dungeon ;
2. ouvrir une vraie fiche héros ;
3. observer le DOM immédiatement au clic puis sur plusieurs frames ;
4. identifier les marqueurs Survie/Zombicide éventuellement présents avant le rendu RPG ;
5. identifier la fonction/fichier qui écrit ces marqueurs en premier ;
6. vérifier overlays, z-index, display, pointer-events et listeners avant toute réécriture ;
7. corriger uniquement l'autorité démontrée.

### Tests requis

- sentinelle navigateur du vrai chemin Dungeon -> fiche héros ;
- assertion qu'aucun marqueur exclusivement Survie/Zombicide n'apparaît, même transitoirement ;
- fiche RPG finale correcte ;
- ouverture/fermeture/réouverture stable ;
- Survie conserve sa propre fiche ;
- Save & Quit / reprise ;
- non-interférence quatre modules ;
- Architecture + navigateur complet ;
- Firefox ;
- Tactical Dock.

### Règle 26

Si le diagnostic prouve que le premier renderer fautif est inline dans `index.html`, ne pas tenter de lire/modifier le gros HTML par répétition de connecteurs.
Résoudre le SHA exact, fournir le permalink `index.html` correspondant à l'utilisateur et demander le ZIP du fichier exact avant toute inspection/modification de contenu.

### Dettes suivantes, hors périmètre

1. déclenchement coffre / détection ennemie tardif ou absent ;
2. ralentissement entre déplacements.

## État opérationnel prioritaire — 2026-09-19

Ce bloc prime sur les sections historiques conservées plus bas.

### Lot Config objet — validation fonctionnelle terminée

Branche :
`work/gensrpg-object-config-editor-2026-09-19`

Checkpoint de départ :
`checkpoint/gensrpg-start-object-config-editor-2026-09-19`

Base exacte :
`3b7aba98d6d3bb87168a1853383c5c8093974a54`

HEAD fonctionnel validé :
`e4c3ec4e3a6fc205274ffa6ae9b41651e8e04cc1`

Corrections propriétaires validées :
- la variante par zone passe par le seul `DungeonRoomVisualConfig167826.openEditor()` public décoré par l'UI moderne ;
- l'état visuel « configuré » vient du même contenu persisté via `configured:true`, jamais d'un état UI temporaire ;
- une ancienne copie automatique V16.78.44 portant `templateLinked:true` est migrée une seule fois vers `inherit` par le propriétaire `DungeonZoneContent167824` ;
- une vraie variante de zone explicitement détachée reste indépendante et n'est jamais migrée ;
- sur tactile, `DungeonRoomGridCapture167830` bloque la peinture au contact mais n'ouvre la fiche qu'après la fin du geste ; le même appui ne peut plus tomber sur « Annuler » ;
- sur une case de coffre authored exact, l'action exacte reste l'autorité ; l'ancien contrôle générique ne doit pas masquer le contenu configuré.

Preuve navigateur réelle :
- ancien coffre V44 `common` / vide injecté comme copie `fixed + templateLinked:true` ;
- reconfiguration du modèle ;
- migration de la zone vers `inherit` ;
- contenu effectif repris depuis le modèle ;
- coffre effectif avec rareté/or/objets configurés ;
- geste tactile complet validé ;
- couleur persistante après fermeture/réouverture.

Validation CI sur `e4c3ec4e3a6fc205274ffa6ae9b41651e8e04cc1` :
- Architecture + navigateur complet `35429554196` — SUCCESS ;
- Firefox `35429554183` — SUCCESS ;
- Tactical Dock `35429554188` — SUCCESS.

Validation utilisateur :
- l'utilisateur a confirmé qu'une nouvelle pièce fonctionne ;
- l'utilisateur a confirmé que le défaut `common` / coffre vide concerne les anciennes salles déjà créées ;
- poursuite du développement autorisée le 2026-09-19.

### Dettes séparées conservées

Ne pas mélanger avec Config objet :
1. flash bref d'une fiche personnage Zombicide/Survie en contexte RPG — prochain lot prioritaire ;
2. déclenchement coffre / ligne de vue ennemie parfois tardif ou absent — lot événementiel séparé après la fiche ;
3. ralentissement entre déplacements — lot performance séparé.

### Prochaine action

1. valider ce commit documentaire ;
2. créer `checkpoint/gensrpg-object-config-editor-green-2026-09-19` sur le HEAD documentaire GREEN ;
3. créer `checkpoint/gensrpg-start-rpg-sheet-shell-isolation-2026-09-19` sur ce même SHA ;
4. ouvrir `work/gensrpg-rpg-sheet-shell-isolation-2026-09-19` ;
5. caractériser le premier renderer qui affiche une fiche Survie/Zombicide avant la fiche RPG ;
6. retirer cette autorité uniquement dans le contexte RPG ;
7. aucune modification de stats, inventaire, Tactical, déplacement ou gameplay sans preuve ;
8. si le propriétaire exact exige l'inspection de `index.html`, appliquer immédiatement la règle 26.

## Dernier checkpoint vert

Phase 2 — cartographie runtime complète GREEN :
`checkpoint/gensrpg-phase2-runtime-cartography-complete-green-2026-09-18`

SHA :
`557cc86681053c389ac85c43be87d130586cf502`

Validation finale :
- Architecture `35353714007` — SUCCESS ;
- navigateur complet dans ce run — SUCCESS ;
- Firefox `35353713978` — SUCCESS ;
- Tactical Dock `35353713979` — SUCCESS.

## Chantier courant

**Phase 3 — créer l'arborescence cible et les contrats sans déplacer le gameplay**

Branche :
`work/gensrpg-phase3-target-structure-contracts-2026-09-18`

Checkpoint de départ :
`checkpoint/gensrpg-start-phase3-target-structure-contracts-2026-09-18`

Base exacte :
`557cc86681053c389ac85c43be87d130586cf502`

## Périmètre actif Phase 3

Module concerné :
- architecture physique GenSrpG uniquement ;
- aucun runtime Survie/Dungeon/Tactical/Capture/PvP n'est déplacé dans ce premier lot.

Propriétaire du lot :
- structure/contrats de modules ;
- aucun nouveau propriétaire runtime actif.

Systèmes existants réutilisés comme autorité :
- cartographie Phase 2 des 65 fichiers externes atteignables ;
- cartographie des 130 blocs inline ;
- load graph Pages actuel ;
- sentinelles Phase 1/2 existantes.

Objectif :
- matérialiser les dossiers cibles `core/`, `shell/`, `survival/`, `dungeon/`, `tactical/`, `capture/`, `pvp/`, `builders/` ;
- préparer des contrats / points d'entrée **inertes** ;
- ne rien raccorder à la production dans ce premier lot ;
- préparer les extractions Phase 4 sans créer une deuxième autorité.

Interdictions :
- aucun changement de `index.html` ;
- aucun changement du load graph GitHub Pages / `preview.html` ;
- aucun déplacement ou copie de gameplay actif ;
- aucun auto-install ;
- aucun wrapper global ;
- aucun `MutationObserver`, timer/retry, listener global ou accès stockage dans les nouveaux points d'entrée ;
- aucun changement de règle, stat, dé, combat, navigation, sauvegarde, asset ou cache PWA ;
- aucune correction de la dette « détection ennemie hors embuscade » ;
- aucun changement sur `main`.

Fonctions / systèmes protégés :
- Shell : `openGensFamily`, `openGensBuiltInGame`, `startConfiguredGame`, `resumeGame` ;
- UI native / fiche héros ;
- stats, dés, calcul de touche, dégâts, armure, résistances ;
- inventaire / équipement / sets ;
- Save & Quit / reprise / stockage ;
- mouvement Dungeon ;
- entrée/sortie Tactical ;
- Capture ;
- PvP ;
- composition Pages et service worker.

Tests prévus :
1. vérifier l'existence des huit domaines cibles ;
2. vérifier que chaque nouveau point d'entrée est inerte et sans effet global ;
3. vérifier qu'aucun nouveau point d'entrée n'est chargé par `index.html`, `preview.html`, `.github/workflows/main.yml` ou RuntimeBootstrap ;
4. vérifier que les 65 fichiers externes du graphe production restent exactement inchangés ;
5. conserver toutes les sentinelles Architecture ;
6. navigateur complet ;
7. Firefox ;
8. Tactical Dock.

Risques :
- introduire accidentellement un second bootstrap ;
- faire entrer un squelette Phase 3 dans le runtime production ;
- créer un contrat qui empiète sur un propriétaire existant ;
- traiter trop tôt un service Phase 4.

Critère de sortie :
- structure cible matérialisée ;
- contrats/entrypoints inertes documentés et testés ;
- graphe runtime production inchangé ;
- aucun gameplay déplacé ;
- toute la CI reste GREEN ;
- checkpoint GREEN Phase 3 créé avant Phase 4.

## Prochaine action

1. créer les points d'entrée/contrats inertes des huit domaines ;
2. ajouter une sentinelle de structure et de non-chargement ;
3. vérifier le diff : aucun runtime existant modifié ;
4. relancer la CI complète ;
5. seulement après GREEN, fermer Phase 3.

## Historique — défauts fonctionnels découverts pendant la cartographie

Le correctif Capture précédent a supprimé la récursion du bloc 030.

Le défaut courant appartient désormais au propriétaire Core Stats :
`assets/gensrpg/gens-rpg-stats-clean-167874.js -> saveProfile(p)`.

Quand le profil actif est Base et que `p` est Dungeon, `saveProfile(p)` mélange `p.id` et l'ID actif dans la même recherche. Il trouve Base avant Dungeon et remplace donc Base par Dungeon.

Chaîne récursive prouvée :

```text
refreshCustomEquipmentIntoItems
→ gensCurrentContentFamily
→ getActiveGameProfile
→ loadGameProfiles
→ ensureBaseGameProfile
→ captureCurrentGameProfile(game_profile_zombicide_base)
→ currentAllHeroIds
→ applyCustomHeroesMulti
→ gensContentCompatible(hero)
→ gensCurrentContentFamily
→ ...
```

Le profil Capture et son dresseur sont seedés avant que le bootstrap canonique Base/Dungeon soit garanti. Le refresh équipement provoque alors une réentrée de `ensureBaseGameProfile()` avant sa persistance.

Preuve :
- commit caractérisation `8c25a0940374ff36ff6754a8bd4aa4d59cf51afb` ;
- 80 appels récursifs tracés ;
- watchdog avant retour de `refreshCustomEquipmentIntoItems()`.

## Périmètre du lot

Autorisé :
- corriger uniquement l'ordre/bootstrap des profils lié à `builtinMonsterCapture162` ;
- réutiliser le propriétaire canonique existant des profils ;
- conserver strictement les données et règles Capture actuelles ;
- adapter le test de caractérisation en sentinelle de non-récursion si nécessaire.

Interdit :
- aucun changement de gameplay Capture ;
- aucun nouveau système de profils ;
- aucun wrapper global ;
- aucun observer ;
- aucun timer/retry supplémentaire ;
- aucune correction de la dette de détection ennemie ;
- aucun changement sur `main`.

## Source index.html

Copie locale exacte déjà fournie et vérifiée :
- SHA de référence runtime : `95db8780eeecdd33a662fbe99c260ecec2cb24a0` ;
- blob `index.html` : `a515c3d34a1f5c4973159457090e4437a33c2630` ;
- taille : 8 175 610 octets.

Depuis ce SHA, les commits de cartographie ont modifié uniquement tests/docs. Le runtime `index.html` du checkpoint de départ est donc identique à cette copie vérifiée.

## Correctif minimal visé

Hypothèse à valider par test après modification :
- dans le seed profil de `ensureBuiltinMonsterCapture162()`, utiliser le chargeur canonique `loadGameProfiles()` au lieu du chargeur brut `loadGameProfilesRaw()` ;
- ainsi Base/Dungeon sont initialisés avant l'enregistrement du dresseur Capture et avant le refresh qui consulte la famille active.

Aucune autre modification runtime n'est autorisée tant que ce correctif minimal n'a pas été testé.

## Tests obligatoires

- composition Pages complète Capture ;
- Capture courant ;
- UI native ;
- Survie ;
- Save & Quit / reprise ;
- PvP ;
- non-interférence quatre modules ;
- gardes Phase 2 ;
- Firefox ;
- Tactical Dock.

## Critère de sortie

- plus aucune récursion au boot Capture à froid ;
- le scénario Pages complet atteint ses assertions gameplay ;
- toutes les sentinelles obligatoires restent GREEN ;
- checkpoint GREEN créé seulement après validation ;
- aucune fusion sur `main`.

## Résultat du correctif Capture

Correctif runtime appliqué :
- commit `e7701e47ff6e44c61f53d62c9d7464b540da49c6` ;
- diff runtime : **1 ligne** dans `builtinMonsterCapture162` ;
- `loadGameProfilesRaw()` -> `loadGameProfiles()`.

Effet confirmé :
- la récursion initiale du bloc 030 a disparu ;
- le boot traverse désormais les 119 blocs inline et atteint les modules Pages externes ;
- les gardes Architecture restent GREEN ;
- Firefox et Tactical Dock restent GREEN sur les commits de caractérisation.

## Nouveau défaut indépendant découvert

Le boot complet bloque ensuite dans le callback `DOMContentLoaded` du propriétaire Core Stats :
`assets/gensrpg/gens-rpg-stats-clean-167874.js`.

Trace prouvée :
1. stockage avant Stats : `Base, Dungeon, Capture` ;
2. `currentRpgProfile()` choisit le profil Dungeon alors que le profil actif reste Base ;
3. `saveProfile(p)` construit une liste d'identifiants contenant à la fois `p.id` (Dungeon) et `activeGameProfileId()` (Base) ;
4. `findIndex()` trouve donc Base en premier ;
5. le profil Dungeon remplace Base ;
6. stockage après sauvegarde : `Dungeon, Dungeon, Capture` ;
7. `loadGameProfiles()` tente alors de recréer Base via `ensureBaseGameProfile()` et retombe dans une récursion.

Preuve de caractérisation :
- commit test `ff7dcf501087bde42315eac18a529ae993c23c0e` ;
- trace stockage : `game_profile_zombicide_base,game_profile_dungeon_demo,gp_mt7ker7t_m2iw9` puis `game_profile_dungeon_demo,game_profile_dungeon_demo,gp_mt7ker7t_m2iw9`.

## Décision de périmètre

Ce défaut appartient au propriétaire **Core Stats / persistance de profil**, pas à `builtinMonsterCapture162`.

Conformément à la charte :
- ne pas élargir ce lot Capture ;
- conserver le correctif Capture d'une ligne ;
- ouvrir un chantier dédié pour `saveProfile(p)` du Core Stats ;
- aucun wrapper/observer/timer de réparation.

## Prochain chantier

**Correctif dédié — Core Stats saveProfile doit remplacer uniquement le profil demandé.**

Correctif attendu :
- `p.id` doit être l'autorité primaire pour le remplacement ;
- l'identifiant actif ne peut servir de fallback que si `p.id` est absent/non exploitable ;
- ne jamais écraser Base lorsqu'on sauvegarde Dungeon, ni l'inverse.

Tests obligatoires :
- reproduction directe Base actif + sauvegarde Dungeon ;
- composition Pages complète Capture ;
- Capture courant ;
- UI native ;
- Survie ;
- Save & Quit / reprise ;
- PvP ;
- non-interférence quatre modules ;
- gardes Phase 2 ;
- Firefox ;
- Tactical Dock.

## Prochaine action

1. créer le checkpoint de départ sur le SHA documentaire courant ;
2. créer une branche Core Stats dédiée ;
3. corriger `saveProfile(p)` au propriétaire ;
4. transformer la caractérisation en test de régression ciblé ;
5. relancer toute la CI avant tout checkpoint GREEN.

## Dette séparée

La détection ennemie hors embuscade reste un chantier de caractérisation fonctionnelle distinct ; elle n'est pas corrigée dans cette cartographie.


## Mise à jour opérationnelle — Core Stats validé, routage Capture à isoler

Correctif Core Stats :
- runtime `cf64814122e45ae1815a6ea8cf853043757acf0b` ;
- test de propriété de profil `535be759dc550c0c4768fd1c487e371046259d2d` ;
- `saveProfile(p)` remplace désormais prioritairement le profil portant `p.id`.

CI sur `535be759dc550c0c4768fd1c487e371046259d2d` :
- Architecture statique : SUCCESS ;
- Firefox : SUCCESS ;
- Tactical Dock : SUCCESS ;
- navigateur Pages complet : atteint désormais le lancement final Capture puis échoue sur un défaut ultérieur indépendant.

Le stockage reste correctement `Base, Dungeon, Capture` après l'installation Core Stats : la récursion de profils est supprimée.

Nouveau défaut caractérisé :
- contexte juste avant lancement : mode `capture`, famille `creature`, profil Capture actif ;
- `isDungeonMode() === true` reste attendu car Capture utilise le substrat Dungeon ;
- après `startConfiguredGame()` : `DungeonCore01` est affiché et `captureGameHub` reste masqué ;
- la couche tardive `dungeonCore200Rebuild` route actuellement tout `isDungeonMode()` vers son `start()`, ce qui intercepte Capture avant la chaîne dédiée de `captureFix139`.

Décision :
- ne pas élargir le lot Core Stats ;
- ouvrir un lot séparé de routage Capture/Dungeon ;
- ne pas modifier globalement `isDungeonMode()` ;
- ne pas recréer un chemin Capture ;
- corriger uniquement le guard du propriétaire tardif après caractérisation.

Prochaine action :
1. checkpoint de départ ;
2. branche dédiée routage Capture/Dungeon ;
3. test ciblé du guard final ;
4. correctif minimal ;
5. CI complète.


## Mise à jour opérationnelle — routage Capture/Dungeon GREEN

Lot dédié :
- branche : `work/gensrpg-capture-start-routing-2026-09-18` ;
- checkpoint de départ : `checkpoint/gensrpg-start-capture-dungeon-routing-2026-09-18` ;
- base du lot : `b15567342c1fbdeb33a7559187c3670ba3e184de`.

Correctif runtime :
- commit : `b601f507cab884c9a427cf523bf671d53fb075bb` ;
- propriétaire modifié : `dungeonCore200Rebuild` ;
- diff runtime : **1 ligne** dans `index.html` ;
- l'interception finale conserve Dungeon, mais délègue Capture à la chaîne dédiée `captureFix139` ;
- aucun changement global de `isDungeonMode()` ;
- aucun wrapper, observer, timer ou retry ajouté ;
- blob final `index.html` : `3a3db76d12ae511f6293e8ff25d124616731a08b`.

Sentinelles :
- test ciblé du propriétaire : `tests/gens_capture_start_routing_owner_v11411.test.cjs` ;
- inventaire Phase 2 mis à jour pour verrouiller « Dungeon oui / Capture non » ;
- sentinelle Save & Quit mise à jour avec le même contrat, sans modification du scénario navigateur.

Validation finale sur `301f2f814e35648bed22fe4fb0dd6580c5e68d80` :
- Architecture `35346984569` — SUCCESS ;
- navigateur Pages complet dans ce run — SUCCESS ;
- Firefox `35346984602` — SUCCESS ;
- Tactical Dock `35346984616` — SUCCESS.

Le navigateur complet valide désormais successivement :
- UI native ;
- Survie ;
- Save & Quit / reprise Dungeon ;
- PvP ;
- Monster Capture courant ;
- composition Pages complète Capture ;
- non-interférence des quatre modules ;
- rendu/preview navigateur prévus par la sentinelle.

Conclusion :
- la récursion initiale Capture est corrigée ;
- l'écrasement Base/Dungeon par Core Stats est corrigé ;
- le détournement final Capture vers Dungeon est corrigé ;
- les trois défauts fonctionnels découverts pendant la cartographie ont été traités dans des lots dédiés ;
- `main` reste gelé sur V16.78.114.11 `e8681f9823573ced8aec59c8ddc47a72b02bc663`.

## Prochaine action après checkpoint GREEN

1. créer le checkpoint GREEN du lot routage Capture/Dungeon ;
2. repartir de ce checkpoint sur une branche neuve de poursuite Phase 2 ;
3. reprendre la cartographie runtime au point où la composition Pages complète était bloquée ;
4. conserver la dette « détection ennemie hors embuscade » dans un chantier fonctionnel séparé ;
5. ne rien fusionner sur `main` tant que la restructuration n'a pas atteint le jalon prévu par la roadmap.


## Reprise Phase 2 après correctifs GREEN

Les trois défauts qui bloquaient la composition Pages complète sont maintenant corrigés dans des lots séparés et validés :
- bootstrap à froid Capture ;
- persistance Core Stats Base/Dungeon ;
- routage final Capture/Dungeon.

La composition Pages complète est GREEN. La Phase 2 peut donc reprendre depuis le checkpoint :
`checkpoint/gensrpg-capture-start-routing-green-2026-09-18`.

Prochaine action opérationnelle :
1. inspecter le manifeste `docs/GENSRPG_PHASE2_RUNTIME_OWNERS.json` ;
2. compléter l'inventaire de responsabilité des 120 blocs inline exécutables ;
3. renforcer les sentinelles de propriétaire sans toucher au runtime ;
4. mettre à jour `docs/GENSRPG_PHASE2_RUNTIME_CARTOGRAPHY.md` au fur et à mesure.


## Clôture opérationnelle Phase 2 — validation finale en cours

La cartographie réelle du runtime est complète.

Branche :
`work/gensrpg-phase2-runtime-cartography-resume-2026-09-18`

Base sûre du lot :
`checkpoint/gensrpg-capture-start-routing-green-2026-09-18`
SHA `8ce4f4cfec785aa48ca81942629a60589461090f`.

Le lot de reprise Phase 2 ne modifie **aucun fichier runtime** depuis cette base : uniquement docs, tests et workflow de sentinelles.

Livrables finaux :
- `docs/GENSRPG_PHASE2_RUNTIME_OWNERS.json` — 65 fichiers externes atteignables ;
- `docs/GENSRPG_PHASE2_INLINE_OWNERS.json` — 130 blocs inline / 120 actifs / 10 désactivés ;
- `docs/GENSRPG_PHASE2_INLINE_GLOBAL_LAST_OWNERS.tsv` — 438 globals / 773 affectations / 123 multi-propriétaires ;
- `docs/GENSRPG_PHASE2_TIMER_CLASSIFICATION.json` ;
- `docs/GENSRPG_PHASE2_STORAGE_OWNERS.json` ;
- `docs/GENSRPG_PHASE2_NONPRODUCTION_FILES.json` ;
- `docs/GENSRPG_PHASE2_LAYERED_RESPONSIBILITIES.json` ;
- `docs/GENSRPG_PHASE2_EXTRACTION_READINESS.md`.

Résultats principaux :
- timers externes : 148 `setTimeout`, 1 `setInterval` ;
- timers inline actifs : 146 `setTimeout`, 1 `setInterval` ;
- stockage direct : 221 accès, 147 résolus, 30 clés/familles, 74 dynamiques ;
- 7 fichiers physiques hors graphe : 4 tests/docs uniquement, 3 cache/workflows historiques non exécutés ;
- 16 hotspots de responsabilités stratifiées ;
- arborescence Phase 3 encore largement absente : ne pas prétendre qu'elle est déjà construite.

Dernier HEAD fonctionnellement validé avant les deux commits documentaires de fermeture :
`a58eab3d60357c7739d5ee03c1aa8887b07ee97b`

CI de référence :
- Architecture `35353401883` — SUCCESS ;
- navigateur complet du même run — SUCCESS ;
- Firefox `35353401955` — SUCCESS ;
- Tactical Dock `35353402052` — SUCCESS.

Les commits documentaires de fermeture doivent repasser par la CI avant création du checkpoint GREEN final Phase 2.

### Prochaine action après validation documentaire

1. créer `checkpoint/gensrpg-phase2-runtime-cartography-complete-green-2026-09-18` sur le HEAD documentaire final validé ;
2. créer une branche neuve Phase 3 depuis ce checkpoint ;
3. mettre à jour ce fichier sur la branche Phase 3 avec le nouveau chantier ;
4. Phase 3 premier lot : structure + contrats + points d'entrée inertes uniquement ;
5. ne pas modifier le load graph production et ne déplacer aucun gameplay dans ce premier lot ;
6. ne rien fusionner sur `main`.

La dette « détection ennemie hors embuscade » reste un chantier fonctionnel séparé.


## Clôture Phase 3 — structure cible GREEN

Résultat du chantier :
- huit domaines cibles matérialisés ;
- huit `entry-v1.js` inertes ;
- huit `module-contract-v1.json` déclaratifs ;
- aucun placeholder chargé en production ;
- aucun runtime existant modifié ;
- aucun gameplay déplacé.

HEAD fonctionnel validé avant documentation finale :
`6efbf37786902bc96a5d0fffc56fbf78291a423b`

Validation :
- Architecture `35354649449` — SUCCESS ;
- navigateur complet du même run — SUCCESS ;
- Firefox `35354649407` — SUCCESS ;
- Tactical Dock `35354649374` — SUCCESS.

Document de clôture :
`docs/GENSRPG_PHASE3_TARGET_STRUCTURE.md`

Validation documentaire finale :
- HEAD `a613fde6d67f20c9b75564faa1f416d98611f12a` ;
- Architecture `35354985029` — SUCCESS ;
- navigateur complet du même run — SUCCESS ;
- Firefox `35354985012` — SUCCESS ;
- Tactical Dock `35354985051` — SUCCESS.

### Prochaine action

1. créer `checkpoint/gensrpg-phase3-target-structure-green-2026-09-18` sur le HEAD documentaire final validé ;
2. ouvrir une branche Phase 4 dédiée au resolver d'assets depuis ce checkpoint ;
3. appliquer la règle 26 si le contenu exact de `index.html` est requis ;
4. ne rien fusionner sur `main`.

## Chantier correctif isolé — Dungeon Builder invisible dans l'éditeur Dungeon

Ce lot repart volontairement du dernier checkpoint Phase 3 entièrement GREEN afin de ne pas dépendre du lot Dungeon après Survie encore non clôturé.

Branche :
`work/gensrpg-dungeon-builder-visibility-clean-2026-09-18`

Checkpoint de départ :
`checkpoint/gensrpg-start-dungeon-builder-visibility-clean-2026-09-18`

Base exacte :
`080a45a904590a2b24a2cbc87b9c270913f427e6`
(`checkpoint/gensrpg-phase3-target-structure-green-2026-09-18`)

Production sûre inchangée :
- `main` : V16.78.114.11 ;
- SHA `e8681f9823573ced8aec59c8ddc47a72b02bc663`.

### Régression caractérisée

Le World Builder n'a pas été supprimé :
- `assets/dungeon/dungeon-world-builder-167821.js` reste le propriétaire du Builder ;
- `#drc300Launch` est créé dans `#drc100Launcher` ;
- `assets/dungeon/dungeon-room-creator-100.js` reste propriétaire de `#drc100Launcher`.

Cause historique exacte :
- commit d'introduction : `d2f102a7be11094cb89b488732e40c8c51cf9e5a` (V16.78.111) ;
- `assets/gensrpg/gens-rpg-tactical-runtime-fixes-1678111.js` a ajouté `#drc100Launcher` et `[data-drc100-launcher]` à `TAB_SELECTORS` ;
- `hideRuntimeTabs()` peut donc appliquer `display:none!important` au conteneur structurel du Builder ;
- ce fichier est cartographié Phase 2 comme `Tactical Historical Layer`, alors que le World Builder appartient au domaine `Dungeon Builders`.

### Périmètre déclaré

Autorisé :
- retirer uniquement l'autorité V111 sur le launcher structurel Builder/Room Creator ;
- ajouter une sentinelle owner-level ;
- ajouter une sentinelle navigateur du vrai chemin Éditeurs -> Dungeon -> Builder ;
- brancher la sentinelle à Architecture.

Interdit :
- modifier le World Builder ou le Room Creator ;
- modifier le Shell, `index.html`, la navigation, le mouvement, le stockage ou le gameplay ;
- ajouter wrapper, observer, timer/retry ou second launcher ;
- toucher au lot Dungeon après Survie.

### Tests requis

1. V111 ne doit plus écrire `display` ni `data-v111-hidden-tab` sur `#drc100Launcher` ;
2. les contrôles legacy runtime V111 peuvent continuer à être masqués pendant le runtime ;
3. vrai chemin navigateur Éditeurs -> Dungeon : Room Creator visible ;
4. vrai chemin navigateur Éditeurs -> Dungeon : bouton « CONSTRUIRE UN DONJON » visible ;
5. ouverture réelle de `#drc300Modal` ;
6. Architecture / navigateur complet ;
7. Firefox ;
8. Tactical Dock ;
9. aucune publication sur `main` avant GREEN.

### Prochaine action

Appliquer un correctif soustractif dans V111 uniquement, puis lancer les sentinelles.

### Audit de conformité charte — lot Builder isolé

Contrôle effectué après rappel utilisateur :
- le premier changement responsable est identifié : `d2f102a7be11094cb89b488732e40c8c51cf9e5a` (V16.78.111), qui introduit l'autorité Tactical sur `#drc100Launcher` ;
- le défaut est déjà présent dans le checkpoint Phase 3 GREEN `080a45a904590a2b24a2cbc87b9c270913f427e6` et dans `main` V16.78.114.11 ;
- le lot Builder précédent basé sur `deb87df...` est abandonné comme base de validation car il héritait du lot Dungeon-après-Survie non encore clôturé GREEN ;
- le présent lot repart de Phase 3 GREEN avec checkpoint propre avant toute modification runtime ;
- le correctif `a209e74a1a96abd6a8bfbb6351ebe3beb7475900` est soustractif : V111 perd uniquement les sélecteurs structurels Builder/Room Creator ;
- aucun nouveau launcher, wrapper, observer, timer, retry, système de navigation ou stockage n'est ajouté ;
- `index.html`, World Builder, Room Creator, Shell, mouvement, persistance et gameplay restent inchangés ;
- le vrai chemin navigateur Éditeurs -> Dungeon -> Builder est couvert par une sentinelle dédiée ;
- le test historique V111 verrouille désormais la frontière : Tactical ne peut plus écrire la visibilité du launcher Builder.

Diff depuis le checkpoint de départ :
- runtime : 1 fichier V111, 1 ligne d'autorité retirée + commentaire ajusté ;
- tests : 1 sentinelle navigateur ajoutée, 1 sentinelle V111 renforcée ;
- CI : 1 étape navigateur ajoutée ;
- documentation uniquement en complément.

État CI au moment de l'audit :
- base Phase 3 GREEN : Firefox et Tactical Dock repassés SUCCESS ;
- HEAD correctif `a209e74...` : Architecture en cours, Firefox/Tactical Dock en attente ;
- aucun checkpoint GREEN final ne doit être créé avant succès des trois validations requises et test utilisateur ciblé.

## Lot d'intégration — Builder GREEN + correction Dungeon après Survie

Objectif : réunir proprement deux corrections déjà caractérisées séparément avant d'ouvrir le chantier authored-runtime caches/pièges.

Branche :
`work/gensrpg-dungeon-integrated-fixes-2026-09-18`

Checkpoint de départ :
`checkpoint/gensrpg-start-dungeon-integrated-fixes-2026-09-18`

Base exacte :
`4f38720de29edb255f498d28b9e7013d181a0313`
(`checkpoint/gensrpg-dungeon-builder-visibility-green-2026-09-18`)

### Correctifs à intégrer

1. Builder GREEN déjà présent dans la base :
- Tactical V111 ne possède plus `#drc100Launcher` ;
- vrai chemin Éditeurs -> Dungeon -> World Builder validé.

2. Correction Dungeon après Survie à réintroduire depuis le lot précédent :
- `isCaptureContext138()` doit utiliser uniquement la famille canonique `creature` ;
- Core 2.09 doit utiliser `window.GensRpgTacticalCombatV2Bridge` pour le garde/appel d'embuscade ;
- empreintes Phase 2 doivent correspondre au blob `index.html` corrigé `917c1a38fa605d53de9a8a9f03b8b76a96b379e3`.

### Règles d'intégration

- ne pas reprendre les workflows one-shot de nettoyage ;
- ne pas reprendre les commits documentaires historiques du lot map ;
- ne pas modifier Builder, Room Creator, Tactical V111 au-delà du correctif déjà GREEN ;
- ne pas commencer caches/pièges avant validation de cette base commune ;
- aucun merge sur `main`.

### Validation requise

- Architecture statique ;
- vrai scénario navigateur Chromium Dungeon après Survie ;
- vrai scénario Builder ;
- Save & Quit / Capture / non-interférence ;
- Firefox ;
- Tactical Dock ;
- test utilisateur déjà acquis pour la grille et le Builder, à conserver comme validation manuelle de comportement.

### Prochaine action

Appliquer uniquement les deux corrections runtime du lot map sur la base Builder GREEN, réaligner les empreintes Phase 2, réintroduire la sentinelle Dungeon après Survie et valider l'ensemble.

## Chantier authored-runtime — caches, stabilité visuelle et pièges non aléatoires

Branche :
`work/gensrpg-authored-cache-trap-runtime-2026-09-18`

Checkpoint de départ :
`checkpoint/gensrpg-start-authored-cache-trap-runtime-2026-09-18`

Base exacte :
`3558831ed126e292278c867dd17491cabf0f29ad`
(`checkpoint/gensrpg-dungeon-integrated-fixes-green-2026-09-18`)

Production `main` reste inchangée sur V16.78.114.11.

### Signalements utilisateur

Dans un donjon construit via World Builder :
1. entrer dans une cache/sous-pièce peut empêcher de revenir vers la salle parente ;
2. le runtime peut demander de « lire »/réutiliser la cache alors qu'après entrée le retour vers la salle précédente doit être disponible ;
3. l'affichage authored paraît parfois instable ;
4. des pièges authored peuvent être visibles à certains moments puis disparaître ;
5. des pièges non placés dans le Builder peuvent apparaître ;
6. en mode donjon construit/authored, aucun piège ou contenu aléatoire ne doit être ajouté au-dessus des données authored.

### Périmètre initial autorisé

Diagnostic uniquement avant preuve :
- navigation cache -> sous-pièce -> salle parente ;
- persistance de l'origine/parent de branche ;
- rendu des cellules authored et des interactions ;
- application des pièges authored ;
- recherche de tout générateur/fallback aléatoire encore actif dans un World Builder authored.

Propriétaires candidats à confirmer :
- `dungeon-authored-runtime-167839.js` ;
- `dungeon-authored-cache-ux-167853.js` ;
- `dungeon-authored-cache-visual-167852.js` ;
- `dungeon-authored-branch-nav-cleanup-167863.js` ;
- `dungeon-source-render-stability-167877.js` ;
- `dungeon-exact-trap-runtime-167845.js` ;
- `dungeon-authored-event-cells-167877.js` ;
- World/Room/Zone runtime uniquement si la preuve remonte à leur contrat.

### Interdit avant preuve

- aucune rustine globale de navigation ;
- aucun reset global de Dungeon state ;
- aucun nouveau observer ;
- aucun timer/retry permanent ;
- aucun piège forcé par CSS ;
- aucune désactivation générale des événements du Dungeon classique ;
- ne pas modifier Tactical, Capture, Survie, Shell ou le Builder éditeur sauf preuve directe ;
- ne pas mélanger les trois symptômes si leurs propriétaires sont distincts.

### Invariants à protéger

- donjon authored = structure et contenu définis par les données du Builder ;
- cache liée = branche vers une sous-pièce précise, avec retour déterministe vers son parent ;
- une interaction déjà consommée ne doit pas redevenir une nouvelle entrée aléatoire ;
- pièges authored uniquement aux cellules/targets configurés ;
- aucun fallback random dans une zone authored valide ;
- état/rendu d'une salle déjà visitée doit rester stable au retour.

### Tests prévus

1. caractérisation cache parent -> sous-pièce -> retour parent ;
2. caractérisation retour après consommation/lecture de cache ;
3. re-render de la même zone authored sans changement de cellules ;
4. piège authored présent = stable après render/reload local ;
5. absence de piège authored = aucun piège généré ;
6. plusieurs retours/re-renders n'ajoutent aucun contenu aléatoire ;
7. tests existants authored cache/trap/runtime ;
8. Architecture, navigateur complet, Firefox, Tactical Dock avant GREEN.

### Prochaine action

Lire les propriétaires et tests authored existants, puis construire des reproductions ciblées avant toute correction.

### Diagnostic confirmé — conflit Core 2.02 / authored

Le vrai scénario navigateur a confirmé qu'un piège de scène non-authored survivait dans une zone World Builder malgré l'autorité `DungeonExactTrapRuntime167845`.

Cause exacte trouvée dans l'`index.html` vérifié :
- bloc inline `dungeonCore202ContentDensity` ;
- `ensureTrap202()` recréait un piège `dc202` dès que `last.kind === "trap"` ;
- la même couche pouvait aussi forcer une rencontre après deux salles sans combat et injecter une énigme selon sa cadence ;
- ces mécanismes sont légitimes pour le Dungeon généré, jamais pour un monde authored.

Correction exacte appliquée sur le blob source vérifié :
- ancien blob `917c1a38fa605d53de9a8a9f03b8b76a96b379e3` ;
- nouveau blob `55453138449d07bde731ff6934acc442f56bae32` ;
- Core 2.02 reconnaît désormais `last.authoredRuntime167839` ;
- en authored : aucune réparation/génération de rencontre, piège, énigme ou combat forcé ;
- seul `paintTrap202()` reste autorisé pour afficher un piège exact déjà détecté ;
- aucun changement pour le Dungeon généré classique.

Le patch du gros `index.html` a été appliqué par workflow one-shot avec vérification stricte des blobs avant/après, puis ce workflow s'est supprimé dans le même commit.

SHA du patch index :
`65fac9d803f71ecf7c8c3f82aa15a80861276d71`

La validation globale reste requise avant tout checkpoint GREEN.

## Chantier isolé — Édition pièce / Config objet moderne

Branche :
`work/gensrpg-object-config-editor-2026-09-19`

Checkpoint de départ :
`checkpoint/gensrpg-start-object-config-editor-2026-09-19`

Base exacte :
`3b7aba98d6d3bb87168a1853383c5c8093974a54`
(`checkpoint/gensrpg-authored-cache-trap-runtime-green-2026-09-19`)

### Signalement utilisateur

Dans Édition pièce -> Config objet :
- la première ouverture peut afficher l'UI moderne avec menus déroulants ;
- après sortie puis retour dans l'éditeur, l'ancienne UI peut réapparaître ;
- cette ancienne UI redemande des ID/références manuelles ;
- besoin UX : un objet déjà configuré doit rester visuellement distinct d'un objet seulement placé.

### Propriétaires identifiés à diagnostiquer

- `DungeonRoomTemplateContent167828` : propriétaire de la configuration directe sur le modèle de pièce ;
- `DungeonRoomContentUI167831` : couche UI moderne qui simplifie/remplace les champs par menus déroulants ;
- `DungeonRoomVisualConfig167826` : variante de configuration par instance de zone ;
- `DungeonRoomCreator100` : grille et cycle open/edit/save uniquement.

### Contraintes

- ne pas créer une deuxième UI de configuration ;
- ne pas ajouter MutationObserver, heartbeat, timer/retry permanent ou réparation globale ;
- ne pas modifier World Builder/runtime gameplay ;
- ne pas traiter ici événements, performance déplacement ou fiche Zombicide/RPG ;
- conserver les données et schémas existants ;
- la couleur "configuré" doit être dérivée de la configuration réellement persistée, pas d'un état UI temporaire.

### Hypothèse à prouver avant correction

`DungeonRoomContentUI167831.patch()` remplace `openEditor` une seule fois sur l'objet API courant.
Si un propriétaire chargé/réinstallé plus tard republie ou remplace `DungeonRoomTemplateContent167828.openEditor`, le flag `__dui167831Patched` reste posé sur l'API et la couche moderne ne reprend plus la nouvelle fonction. Le symptôme attendu est exactement : première ouverture moderne, puis après cycle éditeur retour à l'ancienne UI avec champs ID.

### Tests requis

1. vrai chemin navigateur : Éditeurs -> Dungeon -> Créateur de pièces ;
2. placer/configurer un objet via l'UI moderne ;
3. vérifier que l'objet configuré porte un état visuel distinct dérivé du contenu persisté ;
4. fermer puis rouvrir le créateur ;
5. rouvrir le même objet ;
6. vérifier que les menus déroulants modernes sont toujours présents et que les champs ID legacy ne réapparaissent pas ;
7. répéter au moins deux cycles ouverture/fermeture ;
8. Architecture, navigateur complet, Firefox, Tactical Dock avant GREEN.

### Prochaine action

Construire la reproduction navigateur exacte avant toute modification runtime.

### Diagnostic confirmé — Config objet

La reproduction navigateur réelle a distingué les deux surfaces :
- configuration directe du modèle : UI moderne présente avant et après fermeture/réouverture ;
- variante par zone : retour à l'ancien formulaire malgré `DungeonRoomContentUI167831.__dui167831Patched === true`.

Cause exacte :
- `DungeonRoomVisualConfig167826.activateCell()` appelait le `openEditor()` lexical historique ;
- cet appel contournait le `openEditor()` public volontairement décoré par `DungeonRoomContentUI167831` ;
- résultat : l'ancien textarea / saisie d'ID réapparaissait sur ce chemin.

Correction propriétaire :
- commit `59764a6312f326f04c879d12d90e6d66e1cc0d13` ;
- `activateCell()` délègue désormais au seul `DungeonRoomVisualConfig167826.openEditor()` public ;
- aucun wrapper, observer, timer/retry ou second éditeur ajouté.

### Indicateur visuel « configuré »

L'ancien indicateur se basait sur la simple existence d'une spec. Or `reconcileTemplate()` crée automatiquement une spec par défaut pour tout objet placé, donc « spec existe » ne signifiait pas « configuré par l'utilisateur ».

Correction :
- commit `c6153b0cc76711db23fb874071630b625be11574` ;
- les specs authored existantes portent désormais `configured:true/false` dans le même stockage de contenu ;
- une spec automatique créée depuis un objet placé reste `configured:false` ;
- une sauvegarde réelle via `configureElement()` écrit `configured:true` ;
- les classes `drt167828Configured` / `drv167826Configured` sont appliquées uniquement à `configured:true` ;
- l'état configuré utilise une teinte/contour vert nettement distincts ;
- fermeture/réouverture du Room Creator relit cet état depuis le contenu persisté ;
- le handler local Template délègue lui aussi au `openEditor()` public pour supprimer le dernier chemin de contournement potentiel.

Compatibilité :
- les anciennes specs sans champ `configured` sont normalisées en `false` ;
- leur gameplay/données restent conservés ;
- elles deviennent visuellement « configurées » après une nouvelle sauvegarde explicite dans l'éditeur moderne.

### Validation automatique candidate

SHA fonctionnel :
`c6153b0cc76711db23fb874071630b625be11574`

- Architecture + navigateur complet `35410257944` — SUCCESS ;
- Firefox `35410257942` — SUCCESS ;
- Tactical Dock `35410257970` — SUCCESS.

Le navigateur réel valide :
- UI moderne à la première ouverture ;
- fermeture/réouverture du Créateur ;
- UI moderne toujours présente ;
- variante par zone moderne ;
- aucun textarea legacy d'IDs visible ;
- objet par défaut non marqué configuré ;
- sauvegarde -> couleur configurée ;
- couleur/configuration persistante après fermeture/réouverture ;
- caches/pièges authored ;
- Save & Quit ;
- Capture ;
- PvP ;
- non-interférence.

### État du lot

Candidat automatiquement GREEN, en attente du test utilisateur réel avant création du checkpoint GREEN final.

Les trois autres dettes signalées restent séparées et non modifiées :
- déclenchement tardif coffre / ligne de vue ennemie ;
- ralentissement entre déplacements ;
- fiche Zombicide apparaissant brièvement en RPG.

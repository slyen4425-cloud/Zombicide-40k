# GenSrpG — Phase 5 / Pré-audit Shell & navigation

Date : 2026-09-22

## Base

- branche :
  `work/gensrpg-phase5-shell-navigation-preaudit-2026-09-22` ;
- checkpoint de départ :
  `checkpoint/gensrpg-start-phase5-shell-navigation-preaudit-2026-09-22` ;
- base exacte :
  `4e8e87dec5043cc8687022e720aba998265b986e` ;
- dernier checkpoint GREEN :
  `checkpoint/gensrpg-phase4-complete-green-2026-09-22` ;
- production gelée :
  `main = e8681f9823573ced8aec59c8ddc47a72b02bc663`, V16.78.114.11.

Aucun runtime n'a été modifié dans ce pré-audit.

## Contrat cible Phase 3

Le contrat Shell inert existant définit trois responsabilités futures :
- root navigation ;
- active module/session routing ;
- global screen transitions.

Le Shell ne doit pas absorber :
- gameplay propre aux modules ;
- état privé Dungeon/Capture/Tactical ;
- règles de combat ou de progression.

`assets/gensrpg/shell/entry-v1.js` reste inert et hors composition production.

## Cartographie des responsabilités Phase 5

### 1. Accueil / root navigation

État :
- le Shell de base expose les écrans root/family/game ;
- les tests navigateur réels Survie, Capture, PvP et non-interférence
  traversent ces écrans ;
- aucune extraction n'est autorisée dans ce pré-audit.

Conclusion :
responsabilité Shell confirmée, mais pas premier hotspot soustractif.

### 2. Changement de module / famille

Propriétaire actif identifié :

`forceReload155`.

Il possède :
- `openGensBuiltInGame` — une affectation ;
- `gensProfileContentFamily155` — une affectation ;
- la clé Shell
  `gensrpg_forced_mode_reload_155`.

Cette frontière est déjà beaucoup plus proche d'une autorité unique.

Conclusion :
ne pas la traiter avant le hotspot de lancement partagé.

### 3. Navigation générale / lancement partagé

Hotspot principal :

`startConfiguredGame`.

Cartographie Phase 2 :
- classification : `cross-domain-boundary-chain` ;
- domaine déclaré : `shell` ;
- 6 affectations actives ;
- dernier propriétaire :
  `dungeonCore200Rebuild`.

Chaîne caractérisée :
1. `captureFix131`
2. `captureFix135`
3. `captureFix138`
4. `captureFix139`
5. `gensDungeonCore01Js`
6. `dungeonCore200Rebuild`

Les quatre premières couches sont Capture.
Les deux dernières sont Dungeon.

Le dernier wrapper Dungeon préserve explicitement la chaîne précédente hors
Dungeon et doit éviter de voler les lancements Capture.

Conclusion :
**premier micro-lot Phase 5 recommandé**.

### 4. Fiche personnage hors combat

État :
- les anciennes couches de réparation d'art de fiche ont déjà été neutralisées ;
- le runtime d'art board n'accapare plus la fiche ;
- `openChar` possède encore 3 affectations, dernier propriétaire :
  `dungeonCore028HeroExploreGuard`.

Conclusion :
la fiche reste une frontière à auditer plus tard, mais l'autorité visuelle a déjà
été assainie et elle n'est pas le premier lot.

### 5. Ouverture / fermeture des écrans

État :
- responsabilité encore mixte entre Shell de base et propriétaires spécifiques
  de module ;
- `goMenu` possède 5 affectations, dernier propriétaire :
  `dungeonCore200Rebuild`.

Conclusion :
lot ultérieur, après stabilisation de la frontière de lancement.

### 6. État session / module actif

État :
- famille/module : Shell guard + profile ;
- `markSessionActive` :
  propriétaire Dungeon `dungeonCore100ResumeAndInteractionFix` ;
- `gensSelectedFamily` :
  3 affectations, dernier propriétaire
  `dungeonCore310PersistenceAndTokens` ;
- `applyGameProfile` :
  propriétaire `gensStability151`.

Conclusion :
frontière mixte réelle, mais plus large et plus risquée que
`startConfiguredGame`.

## Frontière Tactical

La Phase 5 ne doit pas déplacer l'autorité Tactical.

Les sentinelles Tactical restent la barrière :
- contrat Dock ;
- rendu Chromium ;
- rendu Firefox ;
- native UI authority V114.11.

Le Shell ne doit gérer que l'entrée/sortie de module et les écrans globaux.

## Preuves navigateur conservées

Les tests suivants restent dans la CI :
- lancement réel Survie ;
- Save & Quit / reprise Shell ;
- placeholder PvP ;
- Monster Capture par le vrai Shell ;
- non-interférence quatre modules ;
- autorité native de fiche héros.

Ces tests verrouillent notamment :
- Survie -> Survie ;
- Dungeon -> Dungeon ;
- Capture -> Capture ;
- PvP -> placeholder ;
- absence de fuite de thème/runtime entre modules.

## Sentinelle du pré-audit

`tests/gens_phase5_shell_navigation_preaudit_v1.test.cjs`.

Elle confirme :
- contrat Shell Phase 3 inchangé et inert ;
- `forceReload155` déjà propriétaire Shell du changement de famille ;
- `startConfiguredGame` comme hotspot Shell transversal à 6 affectations ;
- propriétaires actuels des six responsabilités ;
- maintien des sentinelles navigateur réelles.

## Premier micro-lot recommandé

Nom :

**Phase 5 / autorité startConfiguredGame — pré-audit de consolidation**

Objectif du prochain lot :
- inventorier précisément les six affectations ;
- caractériser pour chacune sa précondition, sa délégation et ses effets ;
- identifier quelles couches ne font que wrapper le lancement ;
- définir une future autorité Shell unique ;
- conserver les routes Capture/Dungeon/Survie strictement identiques ;
- ne modifier aucun runtime dans ce pré-audit dédié.

Ne pas raccorder directement `assets/gensrpg/shell/entry-v1.js` tant que cette
preuve de consolidation n'est pas GREEN.

## Validation technique avant clôture documentaire

SHA :
`a914647121ed7717c39abf27c3c2b7bbb35dac3d`.

Runs :
- Architecture + navigateur complet :
  `35770564360` — SUCCESS ;
- Firefox :
  `35770564233` — SUCCESS ;
- Tactical Dock :
  `35770564315` — SUCCESS.

## Validation finale obligatoire

La présente clôture documentaire change le SHA.

Avant checkpoint GREEN du pré-audit Phase 5, le même SHA documentaire final doit
repasser :
1. Architecture + navigateur complet ;
2. Firefox ;
3. Tactical Dock.

Ensuite seulement :
- créer le checkpoint GREEN du pré-audit ;
- ouvrir le lot dédié
  `startConfiguredGame` ;
- ne modifier aucun runtime avant le RED/contrat propre à ce lot.

Aucun merge sur `main`.

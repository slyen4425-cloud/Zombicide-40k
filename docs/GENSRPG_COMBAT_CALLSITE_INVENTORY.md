# GenSrpG — Inventaire des points d’entrée combat historiques

Date : 2026-09-17
Base : restructuration issue de V16.78.114.11

## But

Avant de remplacer les anciens noms globaux par le contrat unique `GensRpgTacticalCombatV2Bridge.requestCombat()`, figer les appels encore présents dans le monolithe `index.html`.

Le but n’est pas de garder ces noms : cette liste est une dette à faire diminuer progressivement. Toute migration doit préserver les règles de participants, la détection, l’embuscade, les modes MJ et le retour exploration.

## Comptage actuel dans `index.html`

| Symbole historique | Occurrences | Rôle observé |
|---|---:|---|
| `dc200StartCombat` | 9 | alias Core 2.x, détection/embuscade et wrapper timeline actif Core 3.03 ; les boutons Core 2.01 et la timeline Core 3.01 désactivée ne l’utilisent plus |
| `openDungeonCombatSetup` | 1 | définition historique conservée uniquement comme rollback capturé par le Bridge ; aucun Core actif ne l’appelle ou ne la réinstalle |
| `launchCombat200` | 2 | fonction interne Core 2.x et appel de lancement après sélection/renforts |
| `startCombat` | 6 | fonction Core 2.x, échec de furtivité et alias vers `dc200StartCombat` |

## Groupes à migrer

### A. Entrée Core 2.x (`dc200StartCombat` / `startCombat`)

- alias historique `window.dc200StartCombat = startCombat` ;
- déclenchements détection ;
- déclenchement embuscade ;
- détection Core 2.11 ;
- wrapper timeline actif Core 3.03 autour de `window.dc200StartCombat`.

Les boutons de rencontre Core 2.01 ont quitté ce groupe au lot 4A. Le wrapper Core 3.01 désactivé a été retiré au lot 4B.

### B. Ancien setup Dungeon (`openDungeonCombatSetup`)

Une seule définition historique reste pour rollback capturé par le Bridge. Aucun consommateur Dungeon actif ne doit la réinstaller ou l’appeler.

### C. Lancement interne (`launchCombat200`)

- définition du lanceur ;
- rappel après calcul des renforts.

## Migration validée — lot UI manuel 1

Les deux boutons natifs `#dungeonCombatMenuBtn` et `#dungeonCombatSheetBtn` sont migrés directement vers `GensRpgTacticalCombatV2Bridge.requestCombat(window, options)` avec `reason: "manual-setup"`.

Ce lot ne modifie ni détection, ni embuscade, ni `dc200StartCombat`, ni `startCombat`, ni `launchCombat200`.

## Migration validée — lot 2, Core 0.99 désactivé

Le script `#dungeonCore099FinalTacticalAuthority`, déjà désactivé par `type="application/x-gensrpg-disabled"`, est retiré du monolithe. Son unique ligne de fallback comportait deux occurrences textuelles de `openDungeonCombatSetup` (`typeof` + appel), ainsi que des wrappers `DungeonCore01`, un listener capture et un timer, sans appartenir au runtime actif.

Le CSS `#dungeonCore099FinalTacticalCss` et le nettoyage UI Core 1.00 restent volontairement hors périmètre de ce lot.

## Migration validée — lot 3, fallback Core 0.53

Le chemin normal du bouton principal reste `dc030EngageCombat()`. Uniquement si cette entrée historique est absente, le fallback de Core 0.53 appelle maintenant `GensRpgTacticalCombatV2Bridge.requestCombat(window,{reason:"manual-setup",entry:"dc053MainActionFallback"})`. Les gardes `combatOn53()` et `coreCanAct53()` restent en amont.

## Migration validée — lot 3, retrait des dépendances actives à `openDungeonCombatSetup`

Les consommateurs actifs ne dépendent plus de l’ancien setup : Core 0.34 délègue à `Bridge.requestCombat`, l’embuscade conserve son chemin `dc030` et dispose d’un fallback Bridge explicite avec `reason: "embuscade"`, Core 0.45 ne wrappe plus l’ancien setup, et l’autorité Core 0.30 écrasée ainsi que la réinstallation Flow 171 sont retirées.

Une unique définition historique de `openDungeonCombatSetup` reste dans le monolithe uniquement comme rollback capturé par le Bridge. Aucun chemin Dungeon actif ne l’appelle.

## Migration validée — lot 4A, boutons de rencontre Core 2.01

Les deux commandes du panneau de rencontre Core 2.01 — `ENGAGER LE COMBAT` et `ATTAQUER` — ne dépendent plus du global `dc200StartCombat`.

Core 2.01 utilise un helper local sans état ni règle métier, `requestCombat201(enemyIds, reason)`, qui transmet uniquement les identifiants d’ennemis et la raison existante au contrat canonique `GensRpgTacticalCombatV2Bridge.requestCombat(window, options)`. Le mode positionnel reste contrôlé par `dc305PositionalGameplay()` et l’attaque positionnelle conserve la cible située sur la case du héros actif.

Le diagnostic utilise `entry: "dc201EncounterPanel"`, afin qu’aucune référence textuelle à l’ancien adaptateur ne subsiste dans Core 2.01.

## Migration validée — lot 4B, timeline Core 3.01 désactivée

Le script `#dungeonCore301Timeline`, déjà marqué `type="application/x-gensrpg-disabled"`, est supprimé au lieu d’être modernisé. Il contenait deux références à `dc200StartCombat` et n’appartenait pas au runtime actif.

Le lot est volontairement limité au script : le CSS historique `#dungeonCore301TimelineCss` reste hors périmètre. Surtout, le wrapper actif `#dungeonCore303TimelineRootFix` est conservé intact et devra être caractérisé séparément avant toute modification.

Ce lot ne modifie ni détection, ni embuscade, ni participants, ni résolution Tactical, ni `startCombat` / `launchCombat200`.

## Contrat cible déjà disponible

Le Bridge Tactical dispose maintenant d’une seule entrée interne :

`GensRpgTacticalCombatV2Bridge.requestCombat(runtime, options)`

Les noms historiques restants sont des adaptateurs de compatibilité ou des consommateurs à migrer progressivement. Ils ne doivent plus devenir des propriétaires indépendants de la logique de démarrage.

## Règle de migration

1. migrer un petit groupe d’appels à la fois ;
2. conserver les mêmes `enemyIds`, `reason` et comportements de retour ;
3. faire passer les sentinelles V112/V113/Bridge + navigateur ;
4. diminuer le compteur attendu dans le test d’inventaire ;
5. créer un checkpoint vert avant le groupe suivant.

Aucune suppression en masse du gros `index.html` n’est autorisée sans cette progression testée.

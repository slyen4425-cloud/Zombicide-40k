# GenSrpG — Inventaire des points d’entrée combat historiques

Date : 2026-09-15
Base : restructuration issue de V16.78.114.11

## But

Avant de remplacer les anciens noms globaux par le contrat unique `GensRpgTacticalCombatV2Bridge.requestCombat()`, figer les appels encore présents dans le monolithe `index.html`.

Le but n’est pas de garder ces noms : cette liste est une dette à faire diminuer progressivement. Toute migration doit préserver les règles de participants, la détection, l’embuscade, les modes MJ et le retour exploration.

## Comptage actuel dans `index.html`

| Symbole historique | Occurrences | Rôle observé |
|---|---:|---|
| `dc200StartCombat` | 13 | entrée Core 2.x, détection/embuscade, boutons de combat, anciens wrappers timeline |
| `openDungeonCombatSetup` | 13 | ancien setup de combat, embuscade et bridges Core historiques ; 2 boutons UI natifs migrés et le Core 0.99 désactivé retiré |
| `launchCombat200` | 2 | fonction interne Core 2.x et appel de lancement après sélection/renforts |
| `startCombat` | 6 | fonction Core 2.x, boutons de combat, échec de furtivité, alias vers `dc200StartCombat` |

## Groupes à migrer

### A. Entrée Core 2.x (`dc200StartCombat` / `startCombat`)

- alias historique `window.dc200StartCombat = startCombat` ;
- bouton « Engager le combat » ;
- bouton « Attaquer » sur case ennemie ;
- déclenchements détection ;
- déclenchement embuscade ;
- détection Core 2.11 ;
- deux anciens wrappers de timeline autour de `window.dc200StartCombat`.

### B. Ancien setup Dungeon (`openDungeonCombatSetup`)

- deux boutons UI historiques ;
- définition originale du setup ;
- redéfinition globale ultérieure ;
- appels d’embuscade / combat depuis plusieurs couches Core historiques ;
- wrapper « combat héros activé » ;
- fallback de plusieurs anciens chemins `dc030EngageCombat`.

### C. Lancement interne (`launchCombat200`)

- définition du lanceur ;
- rappel après calcul des renforts.

## Migration validée — lot UI manuel 1

Les deux boutons natifs `#dungeonCombatMenuBtn` et `#dungeonCombatSheetBtn` sont migrés directement vers `GensRpgTacticalCombatV2Bridge.requestCombat(window, options)` avec `reason: "manual-setup"`.

Ce lot ne modifie ni détection, ni embuscade, ni `dc200StartCombat`, ni `startCombat`, ni `launchCombat200`.

## Migration validée — lot 2, Core 0.99 désactivé

Le script `#dungeonCore099FinalTacticalAuthority`, déjà désactivé par `type="application/x-gensrpg-disabled"`, est retiré du monolithe. Son unique ligne de fallback comportait deux occurrences textuelles de `openDungeonCombatSetup` (`typeof` + appel), ainsi que des wrappers `DungeonCore01`, un listener capture et un timer, sans appartenir au runtime actif.

Le CSS `#dungeonCore099FinalTacticalCss` et le nettoyage UI Core 1.00 restent volontairement hors périmètre de ce lot.

## Contrat cible déjà disponible

Le Bridge Tactical dispose maintenant d’une seule entrée interne :

`GensRpgTacticalCombatV2Bridge.requestCombat(runtime, options)`

Les quatre noms historiques restent pour le moment des adaptateurs de compatibilité. Ils ne doivent plus devenir des propriétaires indépendants de la logique de démarrage.

## Règle de migration

1. migrer un petit groupe d’appels à la fois ;
2. conserver les mêmes `enemyIds`, `reason` et comportements de retour ;
3. faire passer les sentinelles V112/V113/Bridge + navigateur ;
4. diminuer le compteur attendu dans le test d’inventaire ;
5. créer un checkpoint vert avant le groupe suivant.

Aucune suppression en masse du gros `index.html` n’est autorisée sans cette progression testée.

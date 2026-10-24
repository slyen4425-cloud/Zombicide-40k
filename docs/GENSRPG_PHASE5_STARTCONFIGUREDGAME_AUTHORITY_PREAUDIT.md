# GenSrpG — Phase 5 / startConfiguredGame — pré-audit d'autorité

Date : 2026-09-22

## Base

- branche :
  `work/gensrpg-phase5-startconfiguredgame-authority-preaudit-2026-09-22` ;
- checkpoint de départ :
  `checkpoint/gensrpg-start-phase5-startconfiguredgame-authority-preaudit-2026-09-22` ;
- base exacte :
  `f3cf5acdaa2014e02adf353a3fdbdcd940048315` ;
- dernier checkpoint GREEN :
  `checkpoint/gensrpg-phase5-shell-navigation-preaudit-green-2026-09-22` ;
- production gelée :
  `main = e8681f9823573ced8aec59c8ddc47a72b02bc663`, V16.78.114.11.

Aucun runtime n'a été modifié dans ce pré-audit.

## Hotspot confirmé

`startConfiguredGame` est :
- classé `shell` dans la cartographie stratifiée ;
- classé `cross-domain-boundary-chain` ;
- affecté 6 fois ;
- détenu en dernier par `dungeonCore200Rebuild`.

Chaîne exacte :
1. `captureFix131`
2. `captureFix135`
3. `captureFix138`
4. `captureFix139`
5. `gensDungeonCore01Js`
6. `dungeonCore200Rebuild`

## Caractérisation des six affectations

### captureFix131

Affectation exacte :

`window.startConfiguredGame=async function(){ return await oldStartCfg.apply(this,arguments); }`

Constats :
- délégation inconditionnelle ;
- conserve `this` ;
- conserve `arguments` ;
- aucun test de contexte ;
- aucun stockage ;
- aucun DOM ;
- aucun timer ;
- aucune règle Capture/Dungeon ;
- aucune mutation propre.

Verdict :
**wrapper purement transitif / no-op fonctionnel pour le seam de lancement**.

### captureFix135

Responsabilité réelle :
- détection du pregame Capture ;
- remise à zéro du jour/tour/round Capture ;
- sauvegarde du world state Capture ;
- délégation vers le propriétaire précédent.

Verdict :
propriétaire Capture actif à conserver dans le premier micro-lot.

### captureFix138

Responsabilité réelle :
- détecte le contexte Capture avant délégation ;
- après lancement, restaure/affiche le hub Capture ;
- nettoie l'UI Dungeon ;
- utilise un délai historique de 30 ms.

Verdict :
wrapper Capture actif, hors premier micro-lot.

### captureFix139

Responsabilité réelle :
- route dédiée de lancement Capture ;
- validation participants/starter ;
- activation session ;
- initialisation monde Capture ;
- configuration turn order ;
- entrée dans le monde Capture ;
- délégation au propriétaire précédent uniquement hors Capture.

Verdict :
propriétaire Capture essentiel, protégé.

### gensDungeonCore01Js

Affectation :

`if(eligible()) return start(); else delegate previous owner`.

Verdict :
interception Dungeon native active, protégée.

### dungeonCore200Rebuild

Affectation finale :

- intercepte uniquement Dungeon ;
- exclut explicitement le contexte Capture ;
- délègue hors Dungeon/Capture vers la chaîne précédente.

Verdict :
interception Dungeon finale active, protégée.

## Premier micro-lot TDD sélectionné

**Retrait de la seule affectation `startConfiguredGame` de `captureFix131`.**

Ce micro-lot devra :
- laisser le reste du bloc `captureFix131` intact ;
- ne toucher à aucun autre wrapper ;
- faire passer la chaîne de 6 à 5 affectations ;
- faire capturer par `captureFix135` le propriétaire immédiatement antérieur à
  `captureFix131` ;
- conserver exactement les routes Survie/Dungeon/Capture/PvP ;
- ne pas connecter le Shell Phase 3 inert ;
- ne créer aucune nouvelle compatibilité.

## TDD futur

Le lot runtime devra commencer par une sentinelle RED exigeant :
- absence d'affectation `startConfiguredGame` dans `captureFix131` ;
- chaîne attendue à 5 affectations ;
- dernier propriétaire toujours `dungeonCore200Rebuild` ;
- `captureFix135/138/139`, `gensDungeonCore01Js` et
  `dungeonCore200Rebuild` byte/structure protégés ;
- tests navigateur Shell existants inchangés.

Puis seulement retirer le wrapper transitif.

## Validation technique avant clôture documentaire

SHA :
`1d2c5d144735b5517a1e1e699fbf2676477ec0b3`.

Runs :
- Architecture + navigateur complet :
  `35773498900` — SUCCESS ;
- Firefox :
  `35773498967` — SUCCESS ;
- Tactical Dock :
  `35773498893` — SUCCESS.

## Validation finale obligatoire

La présente clôture documentaire change le SHA.

Avant checkpoint GREEN :
1. Architecture + navigateur complet ;
2. Firefox ;
3. Tactical Dock ;

doivent repasser SUCCESS sur le même SHA documentaire final.

Ensuite seulement ouvrir le lot runtime TDD dédié au retrait du wrapper
`captureFix131`.

Aucun merge sur `main`.

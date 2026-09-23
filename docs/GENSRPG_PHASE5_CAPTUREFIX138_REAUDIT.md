# GenSrpG — Phase 5 / captureFix138 — ré-audit après retrait captureFix135

Date : 2026-09-23

## Base

- branche :
  `work/gensrpg-phase5-capturefix138-reaudit-2026-09-23` ;
- checkpoint de départ :
  `checkpoint/gensrpg-start-phase5-capturefix138-reaudit-2026-09-23` ;
- base exacte :
  `2feec88919aa41d9fbf8f151ca9402ac0ae3bdea` ;
- dernier checkpoint GREEN :
  `checkpoint/gensrpg-phase5-capturefix135-retirement-green-2026-09-23` ;
- production gelée :
  `main = e8681f9823573ced8aec59c8ddc47a72b02bc663`, V16.78.114.11.

Aucun runtime ni `index.html` n'a été modifié dans ce ré-audit.

## Chaîne actuelle

`captureFix138 -> captureFix139 -> gensDungeonCore01Js -> dungeonCore200Rebuild`.

Affectations `startConfiguredGame` : `4`.

## Sentinelle

`tests/gens_phase5_capturefix138_reaudit_v1.test.cjs`.

Elle verrouille :
- le prédicat `isCaptureContext138()` ;
- l'ordre effectif `captureFix138 -> captureFix139` ;
- la délégation synchrone de `captureFix139` hors Capture ;
- la branche post-lancement Capture de `captureFix138` ;
- l'inertie Shell/Capture Phase 3 ;
- aucune modification runtime.

## Preuve de shadowing

### captureFix138

Le wrapper fait :

1. `const cap=isCaptureContext138()` ;
2. délègue au propriétaire précédent ;
3. exécute sa branche post-Capture uniquement si `cap === true`.

Cette branche contient notamment :
- rendu du Hub Capture ;
- nettoyage UI ;
- `setTimeout(...,30)`.

### captureFix139

Le wrapper externe fait d'abord :

`if(!isCaptureContext138()) return await start139.apply(this,arguments)`.

Donc :

- si `isCaptureContext138() === true` :
  `captureFix139` intercepte le lancement Capture et **ne délègue pas** à
  `captureFix138` ;
- si `isCaptureContext138() === false` :
  `captureFix139` délègue immédiatement et synchroniquement à
  `captureFix138`, dont le test `cap` est alors faux.

Le prédicat `isCaptureContext138` ne contient ni :
- `await` ;
- timer ;
- observer ;
- listener ;
- mutation de l'état de routage.

Il lit uniquement le contexte Capture et renvoie un booléen.

### Table de vérité

- Capture = true :
  - captureFix139 délègue : non ;
  - captureFix138 atteint : non ;
  - branche Capture captureFix138 : non.

- Capture = false :
  - captureFix139 délègue : oui ;
  - captureFix138 atteint : oui ;
  - branche Capture captureFix138 : non.

Conclusion :

**la branche Capture de l'affectation startConfiguredGame de captureFix138 est
inatteignable dans la chaîne effective actuelle.**

Le wrapper est donc shadowé sur ce seam.

## Décision

Prochain micro-lot recommandé :

**retirer uniquement l'affectation `window.startConfiguredGame` du bloc
`captureFix138`, avec TDD RED dédié.**

Le bloc `captureFix138` doit rester présent pour ses autres responsabilités :
- `isCaptureContext138` ;
- gestion du turn manager Capture ;
- nettoyages UI ;
- autres hooks Capture historiques encore actifs.

Propriétaires à préserver :
- `captureFix139` ;
- `gensDungeonCore01Js` ;
- `dungeonCore200Rebuild`.

Cible future :
`4 -> 3` affectations.

Aucun retrait de `captureFix139` n'est autorisé dans ce ré-audit.

## Validation technique avant clôture documentaire

SHA technique :

`6d9339bb53f70311e90dc4d990897ac691444ca6`.

CI :
- Architecture + navigateur complet :
  `35827850005` — SUCCESS ;
- Firefox :
  `35827849946` — SUCCESS ;
- Tactical Dock :
  `35827850010` — SUCCESS.

## Validation finale obligatoire

La présente clôture documentaire change le SHA.

Avant checkpoint GREEN :
1. Architecture + navigateur complet ;
2. Firefox ;
3. Tactical Dock

doivent repasser SUCCESS sur le même SHA documentaire final.

Aucun merge sur `main`.

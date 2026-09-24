# GenSrpG — Phase 5 / audit de sortie vers Phase 6

Date : 2026-09-24

## Base

- dernier checkpoint GREEN validé utilisateur :
  `checkpoint/gensrpg-phase5-startconfiguredgame-capture135-retirement-green-2026-09-24` ;
- SHA de base :
  `6dcfa06d5785710a0fd09b76ee1d0143bd2fe67f` ;
- checkpoint de départ :
  `checkpoint/gensrpg-start-phase5-exit-audit-2026-09-24` ;
- branche :
  `work/gensrpg-phase5-exit-audit-2026-09-24` ;
- production `main` :
  `e8681f9823573ced8aec59c8ddc47a72b02bc663`, gelée.

Audit uniquement : aucun runtime, gameplay, asset ou `index.html` modifié.

Runtime vérifié par sentinelle :
- `index.html` : 8172118 octets ;
- blob Git :
  `198207e3f52730498831f196caa35c4a0283e934`.

## Critère roadmap contrôlé

Phase 5 :
**un seul propriétaire de navigation et fiche héros**.

## Navigation / Shell

### Lancement public

Le propriétaire public final est désormais :
`assets/gensrpg/shell/module-launch-final-authority-v1.js`.

Il possède `window.startConfiguredGame` et délègue uniquement via :
- `GensShellModuleLaunchV1.activeModule()` ;
- `GensShellModuleLaunchV1.startModuleSession(moduleId)`.

Il ne capture pas l'ancienne chaîne et ne contient aucun fallback legacy.

Le resolver de module actif est unique.

La chaîne historique encore chargée reste :
`captureFix138 -> captureFix139 -> gensDungeonCore01Js`.

Elle n'est plus l'autorité publique finale et sa seule présence ne constitue donc
pas, à elle seule, un échec du critère de sortie Phase 5.

### Retour écran / goMenu

Le Shell possède le registre public unique :
`GensShellScreenReturnV1`.

Le `goMenu()` natif délègue via `returnToPrimaryView`.

Nombre d'overrides inline globaux `window.goMenu` :
**0**.

Capture et Dungeon utilisent leurs providers locaux derrière le contrat Shell.

Verdict navigation :
**autorité Shell consolidée**.

## Fiche héros / openChar

Le `openChar(id)` natif reste le propriétaire du vrai affichage :
- ouverture de `#sheet` ;
- rendu canonique ;
- garde de participation à la session.

Dungeon Core 0.28 est retiré.

Mais il reste exactement un vrai wrapper global :

`captureFix139 -> window.openChar`.

Ce wrapper :
- capture `window.openChar` ;
- bloque l'ouverture pendant
  `window._captureStarting139 && isCaptureContext138()` ;
- délègue tous les autres appels au propriétaire natif.

Cette logique est Capture-owned mais elle reste installée sur une fonction globale
de fiche héros appartenant au Shell.

Verdict fiche héros :
**propriétaire unique NON encore atteint**.

## Décision

La Phase 5 ne doit pas encore être déclarée terminée.

Blocage unique prouvé :
**wrapper global `openChar` de `captureFix139`**.

Le prochain micro-lot doit cibler uniquement cette responsabilité.

Objectif du futur lot :
- conserver l'invariant « aucune fiche héros ne s'ouvre pendant le démarrage Capture » ;
- retirer l'affectation globale `window.openChar` de `captureFix139` ;
- laisser le vrai `openChar(id)` natif comme unique propriétaire ;
- ne pas retirer dans le même lot les wrappers `startConfiguredGame` ;
- ne pas déplacer de gameplay Capture dans le Shell ;
- TDD navigateur avant runtime ;
- aucune rustine, observer, timer/retry, polling ou reload.

Après ce micro-lot, réévaluer immédiatement le critère de sortie Phase 5.
S'il est atteint, clôturer Phase 5 et passer réellement à Phase 6 — isolation Survie.

## Validation du diagnostic

Sentinelle :
`tests/gens_phase5_exit_audit_v1.test.cjs`.

SHA technique avant clôture documentaire :
`bed5c32e284a8e39286ac93f419bc636ceb97951`.

Runs :
- Architecture + Browser :
  `36038322477` — SUCCESS ;
- Firefox :
  `36038322232` — SUCCESS ;
- Tactical Dock :
  `36038322288` — SUCCESS.

Aucun merge sur `main`.

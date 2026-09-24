# GenSrpG — Phase 5 / module-launch S3 — provider Capture

Date : 2026-09-24

## Base

Le runtime S3 ne peut partir que du checkpoint :

`checkpoint/gensrpg-phase5-module-launch-s3-capture-provider-preaudit-green-2026-09-24`.

Le pré-audit a prouvé que le registre Shell existe avant `captureFix139`
et que `captureFix139` reste le propriétaire du chemin Capture dédié.

## Mission unique

Exposer ce propriétaire Capture via :

`GensShellModuleLaunchV1.startModuleSession("capture")`.

S3 ne change pas le callsite de production.

## Raccord cible

Dans le bloc `captureFix139`, après l'installation de son
`window.startConfiguredGame` :

1. capturer cette fonction dans une référence stable ;
2. déclarer un provider routing-only ;
3. enregistrer `capture` dans le registre S1/S2.

Le provider ne possède aucun gameplay :
il délègue à l'autorité Capture139 existante.

## Invariants

- provider Survival S2 conservé ;
- aucun provider Dungeon/PvP ;
- cinq wrappers `startConfiguredGame` conservés ;
- bouton production inchangé ;
- aucun observer/timer/retry/polling ajouté par le provider ;
- aucun retrait historique.

## Preuves obligatoires après patch

- sentinelle S3 statique GREEN ;
- lancement Capture historique par le vrai Shell GREEN ;
- nouveau lancement Capture par le provider public GREEN ;
- Capture victoire/reprise GREEN ;
- Capture composition complète GREEN ;
- quatre modules non-interférence GREEN ;
- Dungeon -> Tactical GREEN ;
- Survival historique + provider S2 GREEN ;
- Firefox GREEN ;
- Tactical Dock GREEN.

Preview téléphone et validation utilisateur obligatoires avant S4 Dungeon.

Aucun merge sur `main`.

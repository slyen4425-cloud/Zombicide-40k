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


## Candidat runtime

RED acquis au SHA :
`afd995c1b7bb20eecd071581a5ef46c636a32d17`.

Échec attendu :
`S3 requires capturing Capture139 after its wrapper is installed`.

Runtime raccordé :
`b398261c3eef0bb4e230db5afb6cf6dc1b0a2223`.

Empreinte :
- `8172204` octets ;
- blob `6c95e3f6ca4bf8e34003776e7e43e44192aafb16`.

Modification :
- +7 lignes dans `captureFix139` ;
- provider Capture routing-only ;
- registration Capture unique ;
- aucun provider Dungeon/PvP ;
- provider Survival conservé ;
- aucun retrait historique.

Le premier one-shot d'application s'est arrêté avant commit car deux sentinelles Phase 2
lisent volontairement `HEAD:index.html`.
Ces vérifications ont été déplacées à leur emplacement correct : la CI post-commit.
Aucun runtime incomplet n'a été poussé par cet essai.

Le second one-shot a validé les contrats S1/S2/S3 et le rollback avant commit,
puis s'est supprimé dans le même commit runtime.

La validation triple CI complète doit maintenant être exécutée sur un SHA utilisateur
descendant de ce runtime.

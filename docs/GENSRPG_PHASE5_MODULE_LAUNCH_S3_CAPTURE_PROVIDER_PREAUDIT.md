# GenSrpG — Phase 5 / module-launch S3 — pré-audit provider Capture

Date : 2026-09-24

## Base

- Validation utilisateur S2 : « Ça a l'air correct ».
- Base GREEN :
  `checkpoint/gensrpg-phase5-module-launch-s2-survival-provider-green-2026-09-24`.
- SHA :
  `7701c9a21ec49ef12d7188d71e075a90055e7ede`.
- Runtime :
  `8171879` octets,
  blob `7601760f7a635094d4f687b725a639b5728e93b4`.
- Branche :
  `work/gensrpg-phase5-module-launch-s3-capture-provider-2026-09-24`.
- Production `main` gelée :
  `e8681f9823573ced8aec59c8ddc47a72b02bc663`.

## Mission unique

Caractériser le seam exact du futur provider public Capture avant toute modification runtime.

Aucun propriétaire historique n'est retiré dans ce pré-audit.

## Hypothèse à prouver

Le seam candidat est le propriétaire `captureFix139`.

Le registre Shell S1/S2 doit déjà exister lorsque `captureFix139` se charge.
Le futur provider devra capturer la fonction Capture139 immédiatement après que ce bloc installe son
`window.startConfiguredGame`, afin de référencer directement le propriétaire Capture avant les wrappers Dungeon tardifs.

Cette hypothèse n'autorise encore aucun raccord.

## Contraintes permanentes

Le rollback utilisateur antérieur prime sur toute lecture statique :
- `captureFix135` reste ;
- `captureFix138` reste ;
- `captureFix139` reste ;
- `gensDungeonCore01Js` reste ;
- `dungeonCore200Rebuild` reste.

Aucun retrait par shadowing ou ordre apparent.

## Preuves E2E requises pour le futur raccord

Le futur provider Capture devra passer au minimum :
- chemin Capture historique par le vrai Shell ;
- Capture victoire -> Hub ;
- Capture Resume ;
- composition Capture complète ;
- non-interférence des quatre modules ;
- Dungeon -> Tactical ;
- Survival historique et provider S2.

## PvP / Dungeon

S3 n'enregistre aucun provider Dungeon ou PvP.

## Sortie du pré-audit

GREEN uniquement si la sentinelle prouve :
- runtime exact S2 ;
- registre déjà exposé avant Capture139 ;
- ordre 135 -> 138 -> 139 -> Dungeon01 -> Dungeon200 ;
- Capture139 reste propriétaire réel du chemin Capture ;
- aucune registration Capture existante ;
- rollback guard et E2E permanents toujours présents.

Après GREEN :
ouvrir un RED dédié pour exiger le provider Capture, puis seulement modifier le runtime.

Aucun merge sur `main`.


## Résultat du pré-audit

SHA technique :
`0650d3325688869ace4e4c89e176eb3b011e72c8`.

Validation :
- Architecture + navigateur complet `35963606091` — SUCCESS ;
- Firefox `35963606145` — SUCCESS ;
- Tactical Dock `35963606147` — SUCCESS.

Ordre réel prouvé :
`GensShellModuleLaunchV1 -> captureFix135 -> captureFix138 -> captureFix139 -> gensDungeonCore01Js -> dungeonCore200Rebuild`.

Le registre existe donc déjà avant le chargement de Capture139.

Seam autorisé pour le RED suivant :
- après installation du wrapper Capture139 ;
- capturer cette fonction comme référence Capture publique ;
- provider routing-only ;
- aucune suppression ou modification des cinq propriétaires historiques ;
- aucun changement du bouton de production.

Checkpoint cible :
`checkpoint/gensrpg-phase5-module-launch-s3-capture-provider-preaudit-green-2026-09-24`.

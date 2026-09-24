# GenSrpG — Phase 5 / module-launch S4 — pré-audit provider Dungeon

Date : 2026-09-24

## Base sûre

- Validation utilisateur S3 : OK.
- Base GREEN :
  `checkpoint/gensrpg-phase5-module-launch-s3-capture-provider-green-2026-09-24`.
- SHA :
  `e8fd85ab68df818a138ed7949c411005ad622457`.
- Runtime attendu :
  - taille `8172204` octets ;
  - blob `6c95e3f6ca4bf8e34003776e7e43e44192aafb16`.
- Checkpoint de départ :
  `checkpoint/gensrpg-start-phase5-module-launch-s4-dungeon-provider-2026-09-24`.
- Branche :
  `work/gensrpg-phase5-module-launch-s4-dungeon-provider-2026-09-24`.
- Production `main` gelée :
  `e8681f9823573ced8aec59c8ddc47a72b02bc663`.

## Mission unique

Caractériser le seam exact du futur provider public Dungeon avant toute modification runtime.

S4 ne change pas encore le callsite de production et ne retire aucun propriétaire historique.

## État public avant S4

Providers raccordés :
- Survival ;
- Capture.

Non raccordés :
- Dungeon ;
- PvP.

Le bouton production continue d'appeler `startConfiguredGame()`.

## Propriétaires protégés

La chaîne historique reste protégée :
`captureFix135 -> captureFix138 -> captureFix139 -> gensDungeonCore01Js -> dungeonCore200Rebuild`.

Le précédent rollback utilisateur interdit toute conclusion fondée uniquement sur
l'ordre statique ou le shadowing.

## Hypothèse à caractériser, pas à adopter

Le seam Dungeon doit être recherché entre les deux propriétaires Dungeon historiques
et leur comportement E2E réel.

Le pré-audit doit déterminer quelle référence expose exactement le lancement Dungeon
déjà validé, sans détourner Capture/Survival et sans court-circuiter Tactical.

## Preuves requises avant RED

1. fichier exact `index.html` du SHA de base reçu et vérifié ;
2. ordre réel des propriétaires confirmé ;
3. responsabilités de `gensDungeonCore01Js` et `dungeonCore200Rebuild` caractérisées ;
4. vrai chemin Dungeon -> carte -> Tactical identifié ;
5. Save & Quit/reprise et Builder restent sur le même chemin ;
6. aucun provider Dungeon préexistant ;
7. provider Survival et Capture inchangés.

## Interdictions

- aucun retrait historique ;
- aucun changement gameplay ;
- aucun wrapper global supplémentaire ;
- aucun observer/timer/retry/polling ;
- aucun provider PvP ;
- aucun changement du bouton production ;
- aucune modification d'`index.html` avant RED dédié.

## Sortie du pré-audit

GREEN uniquement après caractérisation + sentinelle + triple CI.
Ensuite seulement : RED provider Dungeon, patch minimal, triple CI, preview téléphone,
validation utilisateur.

Aucun merge sur `main`.

# GenSrpG — Coordination

Ce document complète la charte, la roadmap, `GENSRPG_CURRENT_WORK.md` et l'audit Phase 1.

## Rôle du fil directeur

Un seul fil est coordinateur. Règle : **1 lot = 1 branche = 1 périmètre homogène**.

Aucun lot de restructuration ne fusionne directement dans `main`.

## État actif — 2026-09-20

Ce bloc prime sur les jalons historiques ci-dessous.

- Coordinateur : Audit Storage 11, branche `work/gensrpg-phase4-storage-next-audit-11-2026-09-20`.
- Base : Dungeon Scene GREEN, `c7e4dea6d9a9e51ddf381b2ab3c4e3d7145137a5`.
- Dernier checkpoint : `checkpoint/gensrpg-phase4-storage-dungeon-scene-green-2026-09-20`.
- Audit uniquement ; famille Economy Session dynamique à caractériser avant sélection.
- Agent 1 : pré-audit Core Stats uniquement sur `work/gensrpg-phase4-stats-preaudit-agent1-2026-09-20`,
  base `5259210bea918719603066057d3c64c4d68624eb`.
- Le coordinateur ne duplique pas cet audit et n'ouvre aucune migration Stats sans décision coordonnée.
- Production toujours gelée au SHA `e8681f9823573ced8aec59c8ddc47a72b02bc663`.
- Phase 4 Storage en cours ; estimation globale fournie par Sylvain : environ 35 %,
  sans métrique de complétude automatique.
- Point de reprise détaillé : premier bloc de `GENSRPG_CURRENT_WORK.md`.

## Historique — État du 2026-09-18

Production :
- `main` attendu : `e8681f9823573ced8aec59c8ddc47a72b02bc663`
- production gelée.

Dernier checkpoint vert confirmé :
- lancement Survie par le vrai Shell ;
- branche `work/gensrpg-phase1-survival-shell-sentinel-2026-09-18` ;
- checkpoint `checkpoint/gensrpg-phase1-survival-shell-sentinel-green-2026-09-18` ;
- SHA `0e8301fb4555279c4ea47b23e23e2d91f7eb4e5e`.

Lot Save & Quit / reprise validé fonctionnellement :
- branche `work/gensrpg-phase1-savequit-resume-sentinel-2026-09-18` ;
- checkpoint de départ `checkpoint/gensrpg-start-phase1-savequit-resume-sentinel-2026-09-18` ;
- base `0e8301fb4555279c4ea47b23e23e2d91f7eb4e5e` ;
- SHA fonctionnel vert avant fermeture documentaire `47d84f35c802dbe5f15d2f0bca158b82583ed9a8` ;
- Architecture `35317905997` — success ;
- Firefox `35317906010` — success ;
- Tactical Dock `35317905939` — success ;
- checkpoint final `checkpoint/gensrpg-phase1-savequit-resume-sentinel-green-2026-09-18`.

Résultat :
- Save & Quit + vraie reprise par le Shell désormais couverts ;
- lancement Dungeon depuis le Shell racine couvert par le même scénario ;
- aucun runtime/gameplay/asset/stockage modifié ;
- sentinelle branchée à `.github/workflows/gensrpg-architecture-sentinels.yml`.

## Lot PvP validé

- branche `work/gensrpg-phase1-pvp-placeholder-sentinel-2026-09-18` ;
- checkpoint de départ `checkpoint/gensrpg-start-phase1-pvp-placeholder-sentinel-2026-09-18` ;
- base `578f8fb5cf6ea05682b2ac10329ae6666d38a01e` ;
- SHA fonctionnel vert `fe5eec3cfcfb0973ae5edab5ab8888a48fd761b7` ;
- Architecture `35318561984` — success ;
- Firefox `35318561927` — success ;
- Tactical Dock `35318561939` — success ;
- aucun moteur/runtime PvP créé.

Résultat :
- le vrai Shell affiche toujours `PVP — À VENIR` ;
- aucune session/profil/runtime parasite n'est activé ;
- sentinelle branchée à la CI.

## Lot Capture validé

- branche `work/gensrpg-phase1-capture-current-sentinel-2026-09-18` ;
- checkpoint de départ `checkpoint/gensrpg-start-phase1-capture-current-sentinel-2026-09-18` ;
- base `cd797172ec1b32a6edcc84b743a45794d5dfbd32` ;
- SHA fonctionnel vert `97ad8aa05ccd7422f08c1bf1715fcb487d98c0ef` ;
- Architecture `35321411358` — success ;
- Firefox `35321411333` — success ;
- Tactical Dock `35321411366` — success ;
- checkpoint final `checkpoint/gensrpg-phase1-capture-current-sentinel-green-2026-09-18`.

Résultat :
- le vrai Shell traverse Adventure -> Monster Capture ;
- le reload V16.155 de changement de famille est protégé ;
- le pré-game Capture, le choix dresseur/créature, le lancement et le Hub Capture sont protégés ;
- Jour 1 -> Jour 2 est vérifié via l'état persistant Capture ;
- aucun runtime/gameplay/asset/règle Capture n'a été modifié ;
- sentinelle branchée à la CI.

## Non-interférence quatre modules — GREEN

Le RED Capture -> PvP a été corrigé au propriétaire Shell `openGensFamily()` par un changement de deux lignes :
- suppression des classes de pré-game `gensCapturePregame` et `gensAdventurePregame` lors de l'entrée dans une famille ;
- suppression de `gensDungeonTheme` pour les familles non-`adventure`.

Preuve GREEN :
- SHA fonctionnel `08220589eb89a06c73f5777050bbcc90275e48fd` ;
- Architecture `35324953366` — success ;
- Firefox `35324953326` — success ;
- Tactical Dock `35324953417` — success ;
- sentinelle quatre modules GREEN sur `Survie -> Dungeon -> Survie -> Capture -> PvP`.

Aucun profil, sauvegarde, session, moteur ou règle gameplay n'a été modifié.

## Phase 1 — sortie validée

Toutes les lignes de la matrice Phase 1 sont désormais couvertes, y compris la frontière inter-modules.

Prochaine phase selon la roadmap : **Phase 2 — cartographie réelle du runtime actif**.

Le premier lot Phase 2 doit rester documentaire/diagnostic en première intention : scripts chargés, ordre, dépendances, globals, propriétaires, classification par domaine et legacy/inactif.

## Invariants

- chaque lot suivant possède sa branche et son checkpoint de départ ;
- aucun nouveau mécanisme global de réparation ;
- un propriétaire par responsabilité ;
- aucune règle gameplay codée en dur ;
- `main` reste gelé ;
- si `index.html` devient inaccessible par les outils, appliquer la règle 26 de la charte.

## Signalement différé

Détection ennemie hors embuscade : caractérisation dédiée après Phase 1, séparée de la cartographie structurelle.

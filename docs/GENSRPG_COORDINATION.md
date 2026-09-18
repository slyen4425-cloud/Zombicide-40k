# GenSrpG — Coordination

Ce document complète la charte, la roadmap, `GENSRPG_CURRENT_WORK.md` et l'audit Phase 1.

## Rôle du fil directeur

Un seul fil est coordinateur. Règle : **1 lot = 1 branche = 1 périmètre homogène**.

Aucun lot de restructuration ne fusionne directement dans `main`.

## État — 2026-09-18

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

## Non-interférence quatre modules — RED caractérisé

La sentinelle dédiée traverse `Survie -> Dungeon -> Survie -> Capture -> PvP` dans un même contexte. Elle confirme les transitions jusqu’à Capture, puis révèle une fuite Shell sur Capture -> PvP : `gensDungeonTheme` et `gensCapturePregame` restent actifs sur `body` alors que le placeholder PvP est affiché. Aucun runtime/session parasite n’est créé.

Cause ciblée : `openGensFamily()` change la vue mais ne retire pas les classes transitoires laissées par le contexte précédent.

## Ordre Phase 1 restant

1. correctif Shell dédié de nettoyage de contexte ;
2. rendre la sentinelle quatre modules GREEN ;
3. revue finale de la matrice et validation du critère de sortie Phase 1.

Le lot séparé de lancement Dungeon Shell n'est plus nécessaire tant que la sentinelle Save/Resume reste verte.

## Invariants

- chaque lot suivant possède sa branche et son checkpoint de départ ;
- aucun nouveau mécanisme global de réparation ;
- un propriétaire par responsabilité ;
- aucune règle gameplay codée en dur ;
- `main` reste gelé ;
- si `index.html` devient inaccessible par les outils, appliquer la règle 26 de la charte.

## Signalement différé

Détection ennemie hors embuscade : caractérisation dédiée après Phase 1.

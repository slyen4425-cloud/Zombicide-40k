# GenSrpG — Phase 5 / Pré-audit goMenu & transitions écrans

Date : 2026-09-23

## Base

- branche :
  `work/gensrpg-phase5-gomenu-screen-transitions-preaudit-2026-09-23` ;
- checkpoint de départ :
  `checkpoint/gensrpg-start-phase5-gomenu-screen-transitions-preaudit-2026-09-23` ;
- base GREEN :
  `checkpoint/gensrpg-phase5-resume-single-owner-green-2026-09-23` ;
- SHA de base :
  `333919cacf809772df727419f3cc7f5aedd2c1a6` ;
- index de base :
  taille `8171795`,
  blob `4f8c3b9be4189a9ac163fcb17531c95cbd783b05` ;
- production :
  `main = e8681f9823573ced8aec59c8ddc47a72b02bc663`, V16.78.114.11.

Aucun runtime n'est modifié dans ce pré-audit.

## Chaîne goMenu actuelle

La sentinelle
`tests/gens_phase5_gomenu_screen_transitions_preaudit_v1.test.cjs`
parse le `index.html` courant et confirme cinq affectations :

1. `captureFix139`
2. `gensDungeonCore01Js`
3. `dungeonCore023StabilityFix`
4. `dungeonCore030HeroReturnFix`
5. `dungeonCore200Rebuild`

Dernier propriétaire :
`dungeonCore200Rebuild`.

## Classification

### captureFix139 — Capture

Rôle :
- intercepte `goMenu` si une session Capture est active ;
- renvoie vers `captureEnterWorld139()` ;
- délègue au propriétaire précédent hors Capture.

Verdict :
**logique Capture réelle**.

Elle ne doit pas être absorbée dans le Shell sans entrée publique Capture
explicitement prouvée.

### gensDungeonCore01Js — ancien retour Dungeon natif

Rôle :
- si son ancien `coreActive` est vrai et que Dungeon est éligible :
  sauvegarde, masque la fiche et réaffiche le Core Dungeon ;
- délègue sinon.

Verdict :
**ancienne logique Dungeon réelle**, pas un no-op syntaxique.

### dungeonCore023StabilityFix — nettoyage post-délégation Dungeon

Rôle :
- appelle d'abord le propriétaire précédent ;
- si le `DungeonCore01` courant reste actif :
  nettoie overflow/modales historiques et rappelle `DungeonCore01.show()`.

Verdict :
**couche de nettoyage Dungeon post-délégation**, pas un wrapper transitif pur.

### dungeonCore030HeroReturnFix — retour fiche héros Dungeon

Rôle :
- si Dungeon courant est actif et éligible :
  sauvegarde ;
  ferme la fiche ;
  nettoie overflow/pointer-events et modal historique ;
  réaffiche Dungeon ;
  rafraîchit le bouton combat ;
- délègue sinon.

Verdict :
**ancienne logique UI Dungeon réelle**.

### dungeonCore200Rebuild — interception finale Dungeon

Rôle :
- si `active200` et contexte Dungeon :
  masque la fiche puis appelle son `show()` ;
- délègue hors Dungeon.

Verdict :
**propriétaire Dungeon effectif final de la transition goMenu**.

## Shadowing observé

Sur le chemin courant `active200 && isDungeonMode()`, Core 2.00 retourne avant
de déléguer. Les trois anciennes couches Dungeon ne sont donc pas exécutées
sur ce chemin nominal.

Cette observation **ne suffit pas à autoriser leur retrait**.

La régression précédente sur `captureFix135` a démontré qu'un shadowing
statique ne garantit pas la sécurité sur :
- les retours inter-modules ;
- les sessions persistantes ;
- les écrans réouverts après reload ;
- les états Dungeon encore présents hors du chemin nominal.

## Décision de pré-audit

Aucun retrait `goMenu` dans ce lot.

Le prochain micro-lot doit d'abord ajouter une caractérisation E2E dédiée
`goMenu` couvrant au minimum :

1. Dungeon actif + fiche héros ouverte -> `goMenu` -> retour map Dungeon ;
2. Dungeon actif -> aucun overlay historique bloquant après retour ;
3. Capture active -> `goMenu` -> Hub Capture, jamais Dungeon ;
4. ancienne sauvegarde Dungeon présente pendant Capture -> Capture garde
   l'autorité ;
5. Survie -> navigation Shell inchangée ;
6. non-interférence quatre modules ;
7. Builder et Tactical inchangés.

Seulement après ce GREEN E2E, un éventuel retrait doit se faire :
- un propriétaire historique à la fois ;
- avec TDD RED avant retrait ;
- par suppression soustractive ;
- sans nouveau wrapper de compatibilité.

## Dettes hors périmètre

- détection ennemie immédiate hors embuscade : dette séparée ;
- embuscade proche des héros : sentinelle automatique GREEN, non validée
  manuellement par Sylvain.

## Critère de sortie du présent pré-audit

- chaîne exacte goMenu caractérisée ;
- responsabilités des cinq propriétaires documentées ;
- aucun runtime modifié ;
- sentinelle statique GREEN ;
- triple CI GREEN sur le SHA final documentaire.

Aucun merge sur `main`.

# GenSrpG — Phase 7 — Audit de sortie officiel — 2026-10-01

## Base

- checkpoint GREEN : `checkpoint/gensrpg-phase7-dungeon-generated-room-map-boundary-audit-green-2026-10-01`
- SHA de base : `9dccc9db3f76c928491aed47836a7edf4d02f8ba`
- branche : `work/gensrpg-phase7-exit-audit-2026-10-01`
- runtime : `index.html` 8169555 octets, blob `02a052bc231728eb383e17c83e61a958be0ac58c`

## Critère officiel

Roadmap Phase 7 : **exploration complète sans dépendance UI Tactical globale**.

Cet audit ne demande pas que chaque ligne historique Dungeon soit déplacée avant Phase 8. Il vérifie uniquement le critère de sortie officiel.

## Frontière retenue

Dungeon reste propriétaire :
- monde Dungeon ;
- exploration ;
- mouvement ;
- événements ;
- déclenchement de combat ;
- persistance Dungeon.

Dungeon ne doit pas posséder :
- résolution du combat Tactical ;
- UI Tactical globale ;
- autorité Tactical permanente pendant l'exploration.

Le déclenchement d'un combat vers un contrat public Tactical est une frontière autorisée ; consommer directement une UI/runtime Tactical globale pendant l'exploration ne l'est pas.

## Preuves structurelles

- `GensDungeonV1` reste l'API publique Dungeon.
- Le contrat Dungeon interdit explicitement `Tactical combat resolution`.
- L'entrée publique Dungeon ne consomme aucune API Tactical/gtv2 et ne prend aucune autorité DOM/timer/listener.
- Les propriétaires d'exploration generated/authored et leurs décorateurs audités ne consomment pas d'autorité globale Tactical dans leur code exécutable.
- La caractérisation structurelle Phase 7 conserve la garde interdisant une dépendance Tactical directe dans l'exploration authored.

## Preuves navigateur déjà actives

La sentinelle Chromium Phase 7 couvre :
- démarrage d'une aventure generated ;
- exploration generated ;
- sélection et démarrage d'un monde authored ;
- entrée dans une vraie salle Room Creator / World Builder ;
- placement exact du héros ;
- absence d'overlay Tactical pendant l'exploration ;
- absence de bataille Tactical pendant l'exploration.

Cette sentinelle est câblée dans le job Browser global et a été GREEN sur le SHA technique du lot 33.

## Prérequis Phase 8 déjà protégés

La CI protège déjà :
- Force canonique -> snapshot Tactical ;
- Agilité -> toucher distance avec attribution expliquée ;
- cohérence des statistiques éditeur / jeu ;
- sémantique armure canonique ;
- calcul final dégâts mêlée et formule visible.

## Décision GREEN

**PHASE 7 FERMÉE / EXIT GREEN**.

Preuves sur le SHA technique `0a548cc1d678cf462f4d2c2b798ea0a4484fc94d` :
- Architecture + Browser `36866229632` — SUCCESS ;
- Firefox `36866229526` — SUCCESS ;
- Tactical Dock `36866229475` — SUCCESS ;
- étape Architecture #244 — SUCCESS ;
- preuve Chromium d'exploration generated/authored sans UI Tactical globale — SUCCESS.

Aucun changement runtime n'a été nécessaire pour sortir de Phase 7.

Suite autorisée :
1. CI documentaire ;
2. checkpoint final Phase 7 ;
3. checkpoint de départ Phase 8 ;
4. Phase 8 — Consolider Tactical.

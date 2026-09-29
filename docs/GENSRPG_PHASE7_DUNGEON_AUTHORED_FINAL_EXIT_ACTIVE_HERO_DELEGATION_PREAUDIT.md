# GenSrpG — Phase 7 / Dungeon authored — délégation héros actif Final Exit — pré-audit — 2026-09-29

## Base sûre

Micro-lot précédent fermé GREEN :
`checkpoint/gensrpg-phase7-dungeon-authored-active-hero-resolution-post-divergence-green-2026-09-29`

SHA exact de base :
`9c5711e55438574a54e7b6e69961cbe3ea501333`

Checkpoint de départ :
`checkpoint/gensrpg-start-phase7-dungeon-authored-final-exit-active-hero-delegation-2026-09-29`

Branche :
`work/gensrpg-phase7-dungeon-authored-final-exit-active-hero-delegation-2026-09-29`

Production `main` reste gelée :
`e8681f9823573ced8aec59c8ddc47a72b02bc663`.

CI documentaire GREEN de la base :
- Architecture + Browser `36611757409` — SUCCESS ;
- Firefox `36611757248` — SUCCESS ;
- Tactical Dock `36611757326` — SUCCESS.

Runtime `index.html` inchangé :
- `8169990` octets ;
- blob Git `1dde9f80fcc1cd5e3c9560491ab28a2ecd2d2082`.

## Constat sur la base canonique

Le propriétaire pur existe désormais :
`GensDungeonV1.movement.resolveAuthoredActiveHero(participants, activeIndex)`.

Trois copies locales historiques restent :
- `DungeonAuthoredFinalExit167875.activeHero(x)` ;
- `DungeonAuthoredReturnPersist167862.activeHero(x)` ;
- `DungeonAuthoredBranchNavCleanup167863.activeHero(x)`.

Final Exit est le prochain seam le plus étroit :
- sa fonction locale `activeHero(x)` est privée ;
- elle est consommée uniquement par `finalState()` ;
- elle n'est pas exportée dans `DungeonAuthoredFinalExit167875`.

À l'inverse, Return Persist et Branch Nav Cleanup exposent encore `activeHero` dans leur API publique ; ils restent hors du présent lot.

## Cible stricte du micro-lot 18

Faire déléguer uniquement :
`DungeonAuthoredFinalExit167875.activeHero(x)`

vers :
`GensDungeonV1.movement.resolveAuthoredActiveHero(x?.participants, x?.index)`.

Aucune nouvelle API n'est créée.

## Parité obligatoire

La sélection doit conserver exactement la sémantique déjà verrouillée au lot 17 :
- non-tableau / tableau vide -> `""` ;
- index absent, NaN ou falsy -> index 0 ;
- négatif -> premier héros ;
- dépassement -> dernier héros ;
- chaîne numérique -> coercition Number ;
- fractionnaire au-delà de la borne -> clamp au dernier ;
- fractionnaire dans les bornes -> pas d'arrondi, lookup fractionnaire historique ;
- participant falsy -> `""` ;
- participant truthy -> `String(...)`.

La caractérisation doit passer par le vrai chemin `DungeonAuthoredFinalExit167875.finalState()`.

## Propriétaires préservés

Final Exit conserve intégralement :
- lecture du runtime ;
- validation `api().active()` ;
- rejet branche secondaire ;
- graphe / plan terminal ;
- divergence volontaire du resolver local `exitIdx` ;
- `hasExit` ;
- décision terminale canonique ;
- verrouillage ;
- `finish()` ;
- stockage / session / popup / retour accueil / UI.

Return Persist et Branch Nav Cleanup restent bit-à-bit hors raccord dans ce lot.

`DungeonSpatial313` reste inchangé.

## Hors périmètre absolu

Ne pas toucher :
- resolver local `exitIdx` Final Exit ;
- `hasExit` ;
- `isAuthoredTerminalExit` ;
- `isAuthoredExitBlocked` ;
- Authored Runtime ;
- Return Persist ;
- Branch Nav Cleanup ;
- Spatial ;
- mouvement réel / pathfinding ;
- travel ;
- finish / storage / session / home ;
- événements / spawn / coffres / pièges / énigmes ;
- Tactical / Survival / Capture / PvP ;
- assets ;
- `index.html`.

## TDD obligatoire

1. caractérisation GREEN de Final Exit depuis la base exacte ;
2. comparer le vrai résultat `finalState()` au helper canonique sur les cas historiques, y compris les deux cas fractionnaires ;
3. prouver que Final Exit utilise encore son sélecteur local et n'appelle pas encore le helper ;
4. triple CI GREEN ;
5. poser UNE garde RED exigeant la délégation Final Exit uniquement ;
6. vérifier RED isolé, Firefox et Tactical GREEN ;
7. micro-diff minimal dans Final Exit + contrat strictement nécessaire ;
8. Return Persist et Branch Nav Cleanup restent sans appel au helper ;
9. triple CI GREEN ;
10. fermeture documentaire ;
11. triple CI documentaire ;
12. checkpoint GREEN final exact.

## Rule 26

Aucune lecture ni modification du contenu exact de `index.html` n'est requise.
Toute dérive vers son contenu exact arrête le lot et déclenche Rule 26.

# GenSrpG — Phase 7 / Dungeon authored — délégation héros actif Return Persist — pré-audit — 2026-09-29

## Base sûre

Micro-lot précédent fermé GREEN :
`checkpoint/gensrpg-phase7-dungeon-authored-final-exit-active-hero-delegation-green-2026-09-29`

SHA exact de base :
`eabfb9ca136369e6a0166560d14d151df88650f7`

Checkpoint de départ :
`checkpoint/gensrpg-start-phase7-dungeon-authored-return-persist-active-hero-delegation-2026-09-29`

Branche :
`work/gensrpg-phase7-dungeon-authored-return-persist-active-hero-delegation-2026-09-29`

Production `main` reste gelée :
`e8681f9823573ced8aec59c8ddc47a72b02bc663`.

CI documentaire GREEN de la base :
- Architecture + Browser `36616443873` — SUCCESS ;
- Firefox `36616444021` — SUCCESS ;
- Tactical Dock `36616443949` — SUCCESS.

Runtime `index.html` inchangé :
- taille connue : `8169990` octets ;
- blob connu : `1dde9f80fcc1cd5e3c9560491ab28a2ecd2d2082`.

## Constat sur la base canonique

Le propriétaire pur existe :
`GensDungeonV1.movement.resolveAuthoredActiveHero(participants, activeIndex)`.

Deux copies locales historiques restent :
- `DungeonAuthoredReturnPersist167862.activeHero(x)` ;
- `DungeonAuthoredBranchNavCleanup167863.activeHero(x)`.

Return Persist est le seam le plus étroit :
- `activeHero(x)` est exposé dans l'API publique `DungeonAuthoredReturnPersist167862` ;
- `persistFinalPosition()` l'utilise pour résoudre le héros avant de persister la position ;
- le test historique `tests/dungeon_authored_return_persist_v167862.test.cjs` protège déjà le retour spatial exact après `enterNode` ;
- Branch Nav Cleanup possède en plus logique DOM, listeners, timers et politique de navigation ; il reste hors périmètre.

## Cible stricte du micro-lot 19

Conserver l'API publique :
`DungeonAuthoredReturnPersist167862.activeHero(x)`.

Faire déléguer uniquement son calcul interne vers :
`GensDungeonV1.movement.resolveAuthoredActiveHero(x?.participants, x?.index)`.

Aucune API publique n'est retirée ni renommée.

## Parité obligatoire

La sélection doit conserver exactement la sémantique verrouillée :
- participants non tableau / vide -> `""` ;
- index absent / NaN / falsy -> 0 ;
- index négatif -> premier héros ;
- dépassement -> dernier héros ;
- chaîne numérique -> coercition `Number` ;
- fractionnaire au-delà de la borne -> clamp au dernier ;
- fractionnaire à l'intérieur des bornes -> aucun arrondi et lookup fractionnaire historique ;
- participant falsy -> `""` ;
- participant truthy -> `String(...)`.

La caractérisation doit couvrir :
- l'appel public `activeHero(x)` ;
- le vrai chemin `persistFinalPosition()` ;
- le test historique de persistance de la position après `enterNode`.

## Propriétaires préservés

Return Persist conserve :
- lecture/écriture runtime ;
- API publique `activeHero` ;
- validation authored ;
- lecture de `positions[hero]` ;
- appels `DungeonSpatial313.ensure/persist` ;
- wrapper `enterNode` existant ;
- install/retry historique.

`DungeonSpatial313` reste propriétaire unique de la persistance spatiale.

Branch Nav Cleanup reste totalement inchangé, y compris sa copie locale `activeHero(x)`.

## Hors périmètre absolu

Ne pas toucher :
- Branch Nav Cleanup ;
- Final Exit ;
- Authored Runtime ;
- `DungeonSpatial313` ;
- wrapper / cadence retry de Return Persist ;
- mouvement réel / pathfinding ;
- graphe / travel / room entry ;
- events / spawn / coffres / pièges / énigmes ;
- Tactical / Survival / Capture / PvP ;
- `index.html`.

## TDD obligatoire

1. caractérisation GREEN de Return Persist depuis la base exacte ;
2. verrouiller l'API publique `activeHero` et sa sémantique complète ;
3. verrouiller le vrai chemin `persistFinalPosition()` et le test historique V167862 ;
4. prouver que Return Persist utilise encore son sélecteur local avant extraction ;
5. triple CI GREEN ;
6. poser UNE garde RED exigeant uniquement la délégation interne de `activeHero(x)` ;
7. vérifier RED isolé, Firefox et Tactical GREEN ;
8. micro-diff minimal Return Persist + contrat strictement nécessaire ;
9. Branch Nav Cleanup reste sans appel au helper ;
10. triple CI GREEN ;
11. fermeture documentaire ;
12. triple CI documentaire ;
13. checkpoint GREEN final exact.

## Rule 26

Aucune lecture ni modification du contenu exact de `index.html` n'est requise.
Toute dérive vers son contenu exact arrête le lot et déclenche Rule 26.

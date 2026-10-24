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


## Fermeture technique du micro-lot 19

### Caractérisation GREEN préalable

SHA :
`c30550f3d2c4847ba09e01565f9131059a74abf7`.

CI :
- Architecture + Browser `36623200886` — SUCCESS ;
- Firefox `36623200973` — SUCCESS ;
- Tactical Dock `36623200967` — SUCCESS.

La caractérisation couvre :
- l'API publique `DungeonAuthoredReturnPersist167862.activeHero(x)` ;
- la sémantique historique complète, y compris les deux cas fractionnaires ;
- le vrai chemin `persistFinalPosition()` ;
- le maintien du test historique de persistance spatiale V167862 ;
- Branch Nav Cleanup comme dernier sélecteur local hors périmètre.

### RED isolé

SHA :
`5d285db68de731ec9c23668906a342f1e6742945`.

Résultat :
- Architecture `36624556957` — FAILURE attendue uniquement sur #217 `Exiger la délégation héros actif Return Persist authored Phase 7` ;
- Browser — SKIPPED uniquement par dépendance au RED Architecture ;
- Firefox `36624556874` — SUCCESS ;
- Tactical Dock `36624556888` — SUCCESS.

La caractérisation #216 reste GREEN ; aucune autre sentinelle Architecture n'échoue.

### Micro-diff GREEN appliqué

Commits principaux :
- `ffe0297930cf199a7f2f0c4f7a09d94a5b9b603a` — `DungeonAuthoredReturnPersist167862.activeHero(x)` conserve son API publique et délègue uniquement la décision pure au propriétaire Dungeon ;
- `80289d1545369c7ef2ee10e76666ae05c08898ea` — frontière contractuelle documentée ;
- `47bb653432104668d407c4410840c44971b52ac7` — caractérisation post-raccord ;
- `72351c0a836b9b9a922ed2d6a93a7366e650421d` — fixture historique V167862 charge le propriétaire Dungeon avant Return Persist, sans affaiblir ses assertions ;
- `963cd8d4d5d59760bf2afe93037ec8828c40d058`, `2bb206489091afd1c42bfe92910f43f4b395240e`, `084102e409694bf8da3ed8d1e739e243f16a45d1` — sentinelles cumulatives lots 17/18 réalignées sur la nouvelle frontière.

Frontière finale du lot :
- `GensDungeonV1.movement.resolveAuthoredActiveHero` reste propriétaire unique de la décision pure ;
- Return Persist conserve son API publique `activeHero(x)` ;
- Return Persist conserve lecture/écriture runtime, garde authored, validation de position, `DungeonSpatial313.ensure/persist`, wrapper `enterNode` et retry d'installation ;
- Branch Nav Cleanup conserve la dernière copie locale historique du sélecteur ;
- Final Exit et Authored Runtime restent sur leur délégation canonique acquise ;
- `DungeonSpatial313` reste inchangé ;
- aucun changement de `index.html`.

### Triple CI technique GREEN

SHA technique :
`084102e409694bf8da3ed8d1e739e243f16a45d1`.

CI :
- Architecture + Browser `36624958335` — SUCCESS ;
- Firefox `36624958261` — SUCCESS ;
- Tactical Dock `36624958204` — SUCCESS.

Le Browser termine 45/45 sans échec.

### Conformité

- API publique Return Persist conservée ;
- aucune nouvelle API ;
- aucune rustine globale ;
- aucun nouvel observer, wrapper, timer, retry ou heartbeat ;
- cadence retry historique inchangée ;
- aucune modification de `main` ;
- aucun changement utilisateur visible ;
- aucun test utilisateur nécessaire ;
- Rule 26 non déclenchée.

Checkpoint final prévu après triple CI du SHA documentaire :
`checkpoint/gensrpg-phase7-dungeon-authored-return-persist-active-hero-delegation-green-2026-09-29`.

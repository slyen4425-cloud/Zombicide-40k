# GenSrpG — Phase 7 / Dungeon — délégation héros actif Room Runtime — pré-audit — 2026-09-30

## Base sûre

Micro-lot précédent fermé GREEN :
`checkpoint/gensrpg-phase7-dungeon-zone-links-active-hero-delegation-green-2026-09-30`

SHA exact de base :
`ba43236d9a90d38afd4db17c902062dad5edf0c2`

Checkpoint de départ :
`checkpoint/gensrpg-start-phase7-dungeon-room-runtime-active-hero-delegation-2026-09-30`

Branche :
`work/gensrpg-phase7-dungeon-room-runtime-active-hero-delegation-2026-09-30`

Production `main` reste gelée :
`e8681f9823573ced8aec59c8ddc47a72b02bc663`.

CI documentaire GREEN de la base :
- Architecture + Browser `36666260165` — SUCCESS ;
- Firefox `36666260075` — SUCCESS ;
- Tactical Dock `36666260082` — SUCCESS.

Runtime `index.html` inchangé :
- `8169990` octets ;
- blob Git `1dde9f80fcc1cd5e3c9560491ab28a2ecd2d2082`.

## Constat sur la base canonique

Le propriétaire pur existe :
`GensDungeonV1.movement.resolveAuthoredActiveHero(participants, activeIndex)`.

Les consommateurs migrés progressivement comprennent désormais :
- Authored Runtime ;
- Final Exit ;
- Return Persist ;
- Branch Nav Cleanup ;
- Action Fix ;
- Exact Trap Runtime ;
- Zone Links.

`DungeonRoomRuntime167822` possède encore une copie locale historique :
`activeHeroId(x)`.

Cette fonction est privée et consommée uniquement par :
`applyTemplateToCurrentRoom(forceRoom)`.

Dans ce chemin, le héros sélectionné sert uniquement à :
- lire le mouvement restant ;
- positionner ce héros sur `map.entryIdx` ;
- restaurer son mouvement restant après remplacement de géométrie.

## Cible stricte du micro-lot 24

Faire déléguer uniquement :
`DungeonRoomRuntime167822.activeHeroId(x)`

vers :
`GensDungeonV1.movement.resolveAuthoredActiveHero(x?.participants, x?.index)`.

Aucune nouvelle API n'est créée.

## Parité obligatoire

Conserver exactement la sémantique historique :
- non-tableau / tableau vide -> `""` ;
- index absent / NaN / falsy -> index 0 ;
- négatif -> premier héros ;
- dépassement -> dernier héros ;
- chaîne numérique -> coercition Number ;
- fractionnaire au-delà de la borne -> clamp au dernier ;
- fractionnaire dans les bornes -> aucun arrondi ;
- participant falsy -> `""` ;
- participant truthy -> `String(...)`.

La caractérisation doit passer par le vrai `applyTemplateToCurrentRoom(forceRoom)` et verrouiller :
- héros déplacé sur l'entrée ;
- mouvement restant conservé uniquement pour le héros sélectionné ;
- héros non sélectionnés inchangés ;
- cas fractionnaire dans les bornes -> aucun héros déplacé/restauré ;
- garde branch active / room déjà custom / transition non créée inchangées.

## Propriétaires préservés

Room Runtime conserve intégralement :
- configuration par aventure ;
- bibliothèque et validation de pièces ;
- sélection de template et chance ;
- conversion de carte ;
- marqueurs par type de rencontre ;
- remap d'ennemis ;
- détection transition créée ;
- persistance Spatial ;
- wrapper `DungeonCore01.explore` ;
- panneau de configuration ;
- listeners/timers d'installation historiques.

## Hors périmètre absolu

Ne pas toucher :
- World Runtime ;
- Large Room Support ;
- Core 317 / 318 ;
- Source Render Stability ;
- génération de rencontres ;
- remap de spawns hors caractérisation existante ;
- Spatial ;
- DOM/configuration ;
- Tactical / Survival / Capture / PvP ;
- `index.html`.

## TDD obligatoire

1. caractérisation GREEN via le vrai `applyTemplateToCurrentRoom(forceRoom)` ;
2. prouver que Room Runtime possède encore la copie locale et n'appelle pas le helper canonique ;
3. triple CI GREEN ;
4. poser UNE garde RED exigeant uniquement la délégation Room Runtime ;
5. vérifier RED isolé, Firefox et Tactical GREEN ;
6. micro-diff minimal Room Runtime + contrat strictement nécessaire ;
7. aligner uniquement les fixtures historiques si elles doivent charger le propriétaire Dungeon ;
8. triple CI GREEN ;
9. fermeture documentaire ;
10. triple CI documentaire ;
11. checkpoint GREEN final exact.

## Rule 26

Aucune lecture ni modification du contenu exact de `index.html` n'est requise.
Toute dérive vers son contenu exact arrête le lot et déclenche Rule 26.

# GenSrpG — Phase 7 / Dungeon — délégation héros actif Large Room Support — pré-audit — 2026-09-30

## Base sûre

Micro-lot précédent fermé GREEN :
`checkpoint/gensrpg-phase7-dungeon-world-runtime-active-hero-delegation-green-2026-09-30`

SHA exact de base :
`2088b622eea687c880c3a4558038edce187c54c7`

Checkpoint de départ :
`checkpoint/gensrpg-start-phase7-dungeon-large-room-active-hero-delegation-2026-09-30`

Branche :
`work/gensrpg-phase7-dungeon-large-room-active-hero-delegation-2026-09-30`

Production `main` reste gelée :
`e8681f9823573ced8aec59c8ddc47a72b02bc663`.

CI documentaire GREEN de la base :
- Architecture + Browser `36682686771` — SUCCESS ;
- Firefox `36682686722` — SUCCESS ;
- Tactical Dock `36682686715` — SUCCESS.

Runtime `index.html` inchangé :
- `8169990` octets ;
- blob Git `1dde9f80fcc1cd5e3c9560491ab28a2ecd2d2082`.

## Constat sur la base canonique

Le propriétaire pur existe :
`GensDungeonV1.movement.resolveAuthoredActiveHero(participants, activeIndex)`.

Les consommateurs déjà migrés progressivement incluent Authored Runtime, Final Exit, Return Persist, Branch Nav Cleanup, Action Fix, Exact Trap, Zone Links, Room Runtime et World Runtime.

`DungeonLargeRoom167834` possède encore la copie locale historique :

`function activeHero(x){const ids=Array.isArray(x?.participants)?x.participants:[],i=Math.max(0,Math.min(Math.max(0,ids.length-1),Number(x?.index)||0));return String(ids[i]||"")}`

Cette copie est privée et consommée uniquement par :
- `repairGenerated(before, desired)` pour replacer le héros actif à l'entrée après reconstruction d'une salle générée ;
- `ensureWorldState(x, sel, pack)`, appelé par `repairWorld(...)`, pour mettre à jour `heroNodes` et l'historique du héros dans un monde construit.

La copie est bit-à-bit équivalente au propriétaire canonique actuel.

## Cible stricte du micro-lot 26

Faire déléguer uniquement :
`DungeonLargeRoom167834.activeHero(x)`

vers :
`GensDungeonV1.movement.resolveAuthoredActiveHero(x?.participants, x?.index)`.

La fonction reste privée. Aucune nouvelle API n'est créée.

## Parité obligatoire

Conserver exactement la sémantique canonique déjà verrouillée :
- non-tableau / tableau vide -> `""` ;
- index absent / NaN / falsy -> index 0 ;
- négatif -> premier héros ;
- dépassement -> dernier héros ;
- chaîne numérique -> coercition `Number(...)` ;
- fractionnaire au-delà de la borne -> clamp au dernier ;
- fractionnaire dans les bornes -> aucun arrondi, lookup fractionnaire historique ;
- participant falsy -> `""` ;
- participant truthy -> `String(...)`.

La caractérisation doit passer par les vrais consommateurs :
- `repairGenerated()` doit repositionner exactement le héros sélectionné ;
- un index fractionnaire encore dans les bornes ne doit repositionner aucun héros ;
- `repairWorld()` doit enregistrer le nœud et l'historique sur exactement le héros sélectionné.

## Propriétaires préservés

Large Room Support conserve intégralement :
- tailles, clamp, génération, formes, entrées/sorties et obstacles ;
- `roomEnemies`, remap ennemis et scènes ;
- `persist` et l'appel à `DungeonSpatial313` ;
- détection authored et `roomWasCreated` ;
- logique `repairGenerated` hors sélection pure du héros ;
- sélection primaire World Builder, synchronisation et plan monde ;
- `worldPack`, `roomMap`, `structuralMatch`, `overlayDynamic` ;
- `ensureWorldState` hors sélection pure ;
- `repairWorld` ;
- retraite UI legacy, labels, style, rendu, wrappers et timers d'installation.

## Hors périmètre absolu

Ne pas toucher :
- géométrie / taille / génération ;
- randomisation ;
- World Builder ou World Runtime routing ;
- contenu de zone ;
- Spatial ;
- wrappers `render/show/explore` ;
- timers ;
- Core 317 / Core 318 ;
- Source Render Stability ;
- Tactical / Survival / Capture / PvP ;
- `index.html`.

## TDD obligatoire

1. caractérisation GREEN des deux vrais consommateurs depuis la base exacte ;
2. prouver que Large Room possède encore sa copie locale et n'appelle pas le helper ;
3. triple CI GREEN ;
4. poser UNE garde RED exigeant uniquement la délégation Large Room ;
5. vérifier RED isolé, Firefox et Tactical GREEN ;
6. micro-diff minimal Large Room + contrat strictement nécessaire ;
7. caractérisation post-raccord ;
8. triple CI GREEN ;
9. fermeture documentaire ;
10. triple CI documentaire ;
11. checkpoint GREEN final exact.

## Rule 26

Aucune lecture ni modification du contenu exact de `index.html` n'est requise.
Toute dérive vers son contenu exact arrête le lot et déclenche Rule 26.

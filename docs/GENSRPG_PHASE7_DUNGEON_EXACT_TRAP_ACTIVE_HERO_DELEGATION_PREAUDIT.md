# GenSrpG — Phase 7 / Dungeon authored — délégation héros actif Exact Trap Runtime — pré-audit — 2026-09-30

## Base sûre

Micro-lot précédent fermé GREEN :
`checkpoint/gensrpg-phase7-dungeon-authored-action-fix-active-hero-delegation-green-2026-09-30`

SHA exact de base :
`0b8da1aed803f52e5e5aabf12d080e3f6483f0b1`

Checkpoint de départ :
`checkpoint/gensrpg-start-phase7-dungeon-exact-trap-active-hero-delegation-2026-09-30`

Branche :
`work/gensrpg-phase7-dungeon-exact-trap-active-hero-delegation-2026-09-30`

Production `main` reste gelée :
`e8681f9823573ced8aec59c8ddc47a72b02bc663`.

CI documentaire GREEN de la base :
- Architecture + Browser `36639910939` — SUCCESS ;
- Firefox `36639910839` — SUCCESS ;
- Tactical Dock `36639910844` — SUCCESS.

Runtime `index.html` inchangé :
- `8169990` octets ;
- blob Git `1dde9f80fcc1cd5e3c9560491ab28a2ecd2d2082`.

## Constat sur la base canonique

Le propriétaire pur existe :
`GensDungeonV1.movement.resolveAuthoredActiveHero(participants, activeIndex)`.

Les consommateurs déjà migrés progressivement sont :
- `DungeonAuthoredRuntime167839` ;
- `DungeonAuthoredFinalExit167875` ;
- `DungeonAuthoredReturnPersist167862` ;
- `DungeonAuthoredBranchNavCleanup167863` ;
- `DungeonAuthoredActionFix167857`.

`DungeonExactTrapRuntime167845` possède encore la copie locale historique :

`function activeHero(x){const a=Array.isArray(x?.participants)?x.participants:[],i=Math.max(0,Math.min(Math.max(0,a.length-1),Number(x?.index)||0));return String(a[i]||"")}`

Cette fonction est privée et consommée uniquement par `triggerAtHero(x)`.

`triggerAtHero(x)` reste responsable de :
- validation du contexte authored ;
- position du héros ;
- état exact du piège ;
- sélection du piège sur la cellule ;
- normalisation du type ;
- appel `dungeonResolveTrapAgainstHero` ;
- marquage `triggeredTraps` ;
- neutralisation de la cellule ;
- suppression de l'élément de scène ;
- persistance Spatial/runtime.

## Cible stricte du micro-lot 22

Faire déléguer uniquement :
`DungeonExactTrapRuntime167845.activeHero(x)`

vers :
`GensDungeonV1.movement.resolveAuthoredActiveHero(x?.participants, x?.index)`.

La fonction peut rester privée. Aucune nouvelle API n'est créée.

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

La caractérisation doit passer par le vrai chemin `triggerAtHero(x)` et prouver que :
- le héros sélectionné est celui transmis à `dungeonResolveTrapAgainstHero` ;
- un index fractionnaire dans les bornes ne déclenche aucun héros/piège ;
- le contexte non-authored reste rejeté ;
- un piège déjà déclenché ne se redéclenche pas.

## Propriétaires préservés

Exact Trap Runtime conserve intégralement :
- `readRt` / `saveRt` ;
- `authored` ;
- `content` ;
- `trapState` ;
- `normalizeTrapId` / `trapName` ;
- scènes / synchronisation ;
- `removeSceneFor` ;
- tout `triggerAtHero` hors sélection pure du héros ;
- `beforeCore` / `afterCore` ;
- wrappers Core render/show/explore ;
- retry d'installation historique.

`DungeonSpatial313` reste propriétaire de sa persistance.

## Hors périmètre absolu

Ne pas toucher :
- logique exacte de piège ;
- contenu authored ;
- état `triggeredTraps` ;
- détection ;
- scènes ;
- wrappers Core ;
- timers/retry ;
- Zone Links ;
- World Runtime ;
- Room Runtime ;
- Large Room Support ;
- Core 317 / Core 318 ;
- Source Render Stability ;
- Tactical / Survival / Capture / PvP ;
- `index.html`.

## TDD obligatoire

1. caractérisation GREEN de la copie historique via le vrai chemin `triggerAtHero` ;
2. prouver que Exact Trap n'appelle pas encore le helper canonique ;
3. triple CI GREEN ;
4. poser UNE garde RED exigeant uniquement la délégation Exact Trap ;
5. vérifier RED isolé, Firefox et Tactical GREEN ;
6. micro-diff minimal Exact Trap + contrat strictement nécessaire ;
7. triple CI GREEN ;
8. fermeture documentaire ;
9. triple CI documentaire ;
10. checkpoint GREEN final exact.

## Rule 26

Aucune lecture ni modification du contenu exact de `index.html` n'est requise.
Toute dérive vers son contenu exact arrête le lot et déclenche Rule 26.

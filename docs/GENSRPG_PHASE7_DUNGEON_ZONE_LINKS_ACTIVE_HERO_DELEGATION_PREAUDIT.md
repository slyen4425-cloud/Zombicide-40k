# GenSrpG — Phase 7 / Dungeon authored — délégation héros actif Zone Links — pré-audit — 2026-09-30

## Base sûre

Micro-lot précédent fermé GREEN :
`checkpoint/gensrpg-phase7-dungeon-exact-trap-active-hero-delegation-green-2026-09-30`

SHA exact de base :
`3347cbd8c426a3fdb0b95903e42f6b1ca2669846`

Checkpoint de départ :
`checkpoint/gensrpg-start-phase7-dungeon-zone-links-active-hero-delegation-2026-09-30`

Branche :
`work/gensrpg-phase7-dungeon-zone-links-active-hero-delegation-2026-09-30`

Production `main` reste gelée :
`e8681f9823573ced8aec59c8ddc47a72b02bc663`.

CI documentaire GREEN de la base :
- Architecture + Browser `36663174741` — SUCCESS ;
- Firefox `36663174686` — SUCCESS ;
- Tactical Dock `36663174706` — SUCCESS.

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
- Exact Trap Runtime.

`DungeonZoneLinks167846` possède encore la copie locale historique :
`function activeHero(x){const a=Array.isArray(x?.participants)?x.participants:[],i=Math.max(0,Math.min(Math.max(0,a.length-1),Number(x?.index)||0));return String(a[i]||"")}`.

Cette fonction est privée et consommée uniquement par `authoredContext()`.

`authoredContext()` est public et reste propriétaire de :
- lecture de `DungeonAuthoredRuntime167839` ;
- lecture runtime ;
- validation `active()` et contexte authored ;
- lecture du graphe ;
- validation du `worldDungeonId` ;
- résolution du `currentNodeId` ;
- position du héros.

## Cible stricte du micro-lot 23

Faire déléguer uniquement la sélection privée :
`DungeonZoneLinks167846.activeHero(x)`

vers :
`GensDungeonV1.movement.resolveAuthoredActiveHero(x?.participants, x?.index)`.

Aucune nouvelle API n'est créée.

## Parité obligatoire

Conserver exactement la sémantique historique :
- non-tableau / tableau vide -> `""` ;
- index absent / NaN / falsy -> 0 ;
- négatif -> premier héros ;
- dépassement -> dernier héros ;
- chaîne numérique -> coercition Number ;
- fractionnaire au-delà de la borne -> clamp au dernier ;
- fractionnaire dans les bornes -> aucun arrondi ;
- participant falsy -> `""` ;
- participant truthy -> `String(...)`.

La caractérisation doit passer par le vrai `DungeonZoneLinks167846.authoredContext()` et verrouiller :
- héros choisi ;
- `currentNodeId` ;
- position ;
- rejet si runtime non-authored ;
- rejet si graphe absent ou dungeon id divergent ;
- cas fractionnaire dans les bornes -> contexte nul.

## Propriétaires préservés

Zone Links conserve intégralement :
- `readRt` / `writeRt` ;
- `authored`, `builder`, `roomApi` ;
- `authoredContext` hors sélection pure du héros ;
- nœuds / labels / entry index / cache cells ;
- reverse edges / cache bindings / branch graph ;
- piles de retour par héros ;
- `blocked` ;
- `performTransition` ;
- `travelReverse`, `travelCache`, `travelReturn` ;
- boutons et UI ;
- configuration Builder et validation ;
- wrapper Core render ;
- listener editor et retry d'installation.

## Hors périmètre absolu

Ne pas toucher :
- transition de zones ;
- piles de retour ;
- cache bindings ;
- graphe secondaire ;
- Builder ;
- DOM / boutons ;
- verrouillage de sortie ;
- Authored Runtime ;
- World Runtime ;
- Room Runtime ;
- Large Room Support ;
- Core 317 / 318 ;
- Source Render Stability ;
- Spatial ;
- Tactical / Survival / Capture / PvP ;
- `index.html`.

## TDD obligatoire

1. caractérisation GREEN via le vrai `authoredContext()` ;
2. prouver que Zone Links possède encore la copie locale et n'appelle pas le helper canonique ;
3. triple CI GREEN ;
4. poser UNE garde RED exigeant uniquement la délégation Zone Links ;
5. vérifier RED isolé, Firefox et Tactical GREEN ;
6. micro-diff minimal Zone Links + contrat strictement nécessaire ;
7. triple CI GREEN ;
8. fermeture documentaire ;
9. triple CI documentaire ;
10. checkpoint GREEN final exact.

## Rule 26

Aucune lecture ni modification du contenu exact de `index.html` n'est requise.
Toute dérive vers son contenu exact arrête le lot et déclenche Rule 26.


## Fermeture technique du micro-lot 23

### Caractérisation GREEN préalable

SHA :
`5732bb03d60a572c6c317ababeef02ce67cd92aa`.

CI :
- Architecture + Browser `36664129967` — SUCCESS ;
- Firefox `36664129907` — SUCCESS ;
- Tactical Dock `36664129980` — SUCCESS.

La caractérisation verrouille via le vrai `authoredContext()` :
- la sélection historique du héros ;
- `currentNodeId` ;
- la position ;
- le rejet du runtime non-authored ;
- le rejet d'un graphe absent ou d'un `worldDungeonId` divergent ;
- le cas fractionnaire dans les bornes, qui conserve un contexte nul.

### RED isolé

SHA :
`87a60dfe5069a7f13dd295823b6a6ea8f265eae7`.

Résultat :
- Architecture `36665107361` — FAILURE attendue uniquement sur l'étape #225 `Exiger la délégation héros actif Zone Links authored Phase 7` ;
- Browser SKIPPED uniquement par dépendance au RED Architecture ;
- Firefox `36665107335` — SUCCESS ;
- Tactical Dock `36665107324` — SUCCESS.

### Micro-diff GREEN appliqué

Commits :
- `3823c0b42922abe001b168e33f5c9f37418fad0e` — Zone Links délègue uniquement la sélection pure du héros au propriétaire canonique ;
- `a96d2f027b4d82a81325812e54c0fdeff76b8af0` — frontière contractuelle documentée ;
- `0f603cfb014d558001ddc3c80aa3b255812fc748` — caractérisation post-raccord ;
- `5cd67d6c1401f7affc518b1551f0e9d620625eaf` et `6ba8b4d694df1cd356a7951c8214f79f5959913c` — fixtures historiques Zone Links chargées avec le propriétaire Dungeon réel.

Le premier run post-raccord a échoué uniquement parce qu'une fixture historique chargeait encore Zone Links sans initialiser `GensDungeonV1`. Le log a confirmé :
`TypeError: Cannot read properties of undefined (reading 'movement')`.
La correction est restée limitée aux fixtures de test ; aucun correctif runtime supplémentaire n'a été ajouté.

### Triple CI technique GREEN

SHA technique :
`6ba8b4d694df1cd356a7951c8214f79f5959913c`.

CI :
- Architecture + Browser `36665363990` — SUCCESS ;
- Firefox `36665363960` — SUCCESS ;
- Tactical Dock `36665363881` — SUCCESS.

### Frontière préservée

- Zone Links ne possède plus l'algorithme de sélection du héros actif ;
- `GensDungeonV1.movement.resolveAuthoredActiveHero(...)` reste le propriétaire canonique ;
- `authoredContext` conserve lectures runtime/graphe, validation authored, `currentNodeId` et position ;
- transitions reverse/cache/return, piles par héros, cache bindings, Builder, boutons, DOM, wrapper Core, listener editor et retry restent Zone Links ;
- World Runtime, Room Runtime, Large Room Support, Core 317/318 et Source Render restent différés ;
- aucun changement `index.html`.

### Conformité

- aucune nouvelle API ;
- aucune rustine globale ;
- aucun wrapper, observer, timer, retry ou heartbeat ajouté ;
- aucune modification de `main` ;
- aucun changement utilisateur visible ;
- aucun test utilisateur nécessaire ;
- Rule 26 non déclenchée.

Checkpoint final prévu après triple CI du SHA documentaire :
`checkpoint/gensrpg-phase7-dungeon-zone-links-active-hero-delegation-green-2026-09-30`.

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


## Fermeture technique du micro-lot 26

### Caractérisation GREEN préalable

SHA :
`2aed29ecb8c663c1fae89f09e98305898b055f02`.

CI :
- Architecture + Browser `36687134583` — SUCCESS ;
- Firefox `36687134541` — SUCCESS ;
- Tactical Dock `36687134540` — SUCCESS.

La caractérisation verrouille les deux vrais consommateurs :
- `repairGenerated()` repositionne uniquement le héros sélectionné historiquement ;
- un index fractionnaire dans les bornes sélectionne toujours aucun héros ;
- `repairWorld()` / `ensureWorldState()` enregistrent le nœud et l'historique uniquement sur le héros actif historique.

### RED isolé

SHA :
`561c7a9cdaf5a29ded883a58f9504d44dcad095b`.

Résultat :
- Architecture `36688367873` — FAILURE attendue uniquement sur #231 `Exiger la délégation héros actif Large Room Phase 7` ;
- Browser SKIPPED uniquement par dépendance au RED Architecture ;
- Firefox `36688367959` — SUCCESS ;
- Tactical Dock `36688367872` — SUCCESS.

### Micro-diff GREEN appliqué

Commits runtime / contrat :
- `f00c396568d5ad9120c4f383f2a77adae6e21b2a` — Large Room délègue uniquement la sélection pure du héros au propriétaire canonique ;
- `a1c133300f4a75ce821329f65f1b94c4e5c314f0` — frontière contractuelle documentée.

Aucun autre changement runtime n'a été nécessaire.

### Réalignements de tests post-raccord

Le premier run post-raccord a révélé uniquement des fixtures historiques encore construites sur l'ancien propriétaire local :
- sur `a1c133300f4a75ce821329f65f1b94c4e5c314f0`, Architecture `36688624311` a échoué sur #230 car la caractérisation attendait encore l'ancien sélecteur local ;
- `a61b39f1e8a91f36f5758d5734edcfe434a6b04b` réaligne cette caractérisation sur l'état post-délégation, sans toucher au runtime ;
- le run suivant a révélé #263 `Rejouer les tests historiques Dungeon Primary Selection via Core` : la fixture `dungeon_large_room_v167834.test.cjs` chargeait Large Room sans charger `GensDungeonV1` ;
- `73dbb027d8ceebdefa73a3fdd5a3f57434de1f0d` charge explicitement le propriétaire Dungeon réel avant la fixture Large Room, sans fallback ni duplication.

### Triple CI technique GREEN finale

SHA technique :
`73dbb027d8ceebdefa73a3fdd5a3f57434de1f0d`.

CI :
- Architecture + Browser `36689169056` — SUCCESS ;
- Firefox `36689169091` — SUCCESS ;
- Tactical Dock `36689169092` — SUCCESS.

Le Browser global a terminé sans échec, y compris :
- autorité exploration Dungeon Phase 7 ;
- cache / retour / pièges authored ;
- Save & Quit / reprise Shell ;
- Dungeon Builder ;
- composition complète Capture et non-interférence des quatre modules.

### Frontière préservée

- Large Room ne possède plus l'algorithme de sélection du héros actif ;
- `GensDungeonV1.movement.resolveAuthoredActiveHero(...)` reste le propriétaire canonique ;
- géométrie, tailles, génération, randomisation, World Builder, World Runtime routing, contenu de zone et Spatial restent inchangés ;
- `repairGenerated` et `ensureWorldState` conservent toutes leurs responsabilités hors sélection pure ;
- wrappers `render/show/explore`, UI, labels, styles et timers restent inchangés ;
- Core 317 / Core 318 et Source Render Stability restent différés ;
- aucun changement `index.html`.

### Conformité

- aucune nouvelle API ;
- aucune rustine globale ;
- aucun fallback de compatibilité ;
- aucun observer, retry, heartbeat ou timer ajouté ;
- aucune modification de `main` ;
- aucun changement utilisateur visible ;
- aucun test utilisateur nécessaire ;
- Rule 26 non déclenchée.

Checkpoint final prévu après triple CI du SHA documentaire :
`checkpoint/gensrpg-phase7-dungeon-large-room-active-hero-delegation-green-2026-09-30`.

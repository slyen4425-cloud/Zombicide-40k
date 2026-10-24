# GenSrpG — Phase 7 / Dungeon World Runtime — délégation héros actif — pré-audit — 2026-09-30

## Base sûre

Micro-lot précédent fermé GREEN :
`checkpoint/gensrpg-phase7-dungeon-room-runtime-active-hero-delegation-green-2026-09-30`

SHA exact de base :
`32a970429c240110a8e207fee1fe18441e10e40d`

Checkpoint de départ :
`checkpoint/gensrpg-start-phase7-dungeon-world-runtime-active-hero-delegation-2026-09-30`

Branche :
`work/gensrpg-phase7-dungeon-world-runtime-active-hero-delegation-2026-09-30`

Production `main` reste gelée :
`e8681f9823573ced8aec59c8ddc47a72b02bc663`.

CI documentaire GREEN de la base :
- Architecture + Browser `36678532628` — SUCCESS ;
- Firefox `36678532695` — SUCCESS ;
- Tactical Dock `36678532649` — SUCCESS.

Runtime `index.html` inchangé :
- `8169990` octets ;
- blob Git `1dde9f80fcc1cd5e3c9560491ab28a2ecd2d2082`.

## Constat sur la base canonique

Le propriétaire pur existe :
`GensDungeonV1.movement.resolveAuthoredActiveHero(participants, activeIndex)`.

Les consommateurs déjà migrés progressivement incluent :
- Authored Runtime ;
- Final Exit ;
- Return Persist ;
- Branch Nav Cleanup ;
- Action Fix ;
- Exact Trap Runtime ;
- Zone Links ;
- Room Runtime.

`DungeonWorldRuntime167823` possède encore une copie locale historique privée :

`function activeHeroId(x){const list=Array.isArray(x?.participants)?x.participants:[],i=Math.max(0,Math.min(Math.max(0,list.length-1),Number(x?.index)||0));return String(list[i]||"")}`

Cette fonction est consommée dans deux chemins :
- le vrai wrapper `DungeonCore01.explore` installé par `installExploreWrapper()` ;
- `currentPlan()`, utilisé notamment par le bouton de sortie World Runtime.

## Cible stricte du micro-lot 25

Faire déléguer uniquement :
`DungeonWorldRuntime167823.activeHeroId(x)`

vers :
`GensDungeonV1.movement.resolveAuthoredActiveHero(x?.participants, x?.index)`.

La fonction reste privée.
Aucune nouvelle API n'est créée.

## Parité obligatoire

Conserver exactement la sémantique historique :
- non-tableau / tableau vide -> `""` ;
- index absent / NaN / falsy -> index 0 ;
- négatif -> premier héros ;
- dépassement -> dernier héros ;
- chaîne numérique -> coercition `Number(...)` ;
- fractionnaire au-delà de la borne -> clamp au dernier ;
- fractionnaire dans les bornes -> aucun arrondi, lookup fractionnaire historique ;
- participant falsy -> `""` ;
- participant truthy -> `String(...)`.

La caractérisation doit couvrir les deux vrais consommateurs :
1. `currentPlan()` ;
2. le vrai chemin `DungeonCore01.explore()` après installation du wrapper.

Elle doit prouver qu'un index fractionnaire dans les bornes continue à produire aucun héros et que World Runtime retombe sur le comportement historique approprié.

## Propriétaires préservés

World Runtime conserve intégralement :
- configuration authoritative world ;
- lecture/écriture runtime ;
- graphes Builder ;
- `ensureWorldState`, `nodeForHero`, `targetPlan` ;
- sélection des edges ;
- conversion de carte ;
- contenu de zone ;
- chargement direct d'une pièce ;
- snapshot / réactivation ;
- `directFixedNode` ;
- blocage de sortie ;
- wrappers `explore` et `render` ;
- bouton de sortie ;
- panneau legacy retiré ;
- timers d'installation historiques.

`DungeonSpatial313` reste propriétaire de la persistance spatiale.

## Hors périmètre absolu

Ne pas toucher :
- graph routing ;
- edge selection ;
- Room Creator ;
- Zone Content ;
- mouvement réel ;
- génération legacy ;
- `directFixedNode` hors sélection du héros ;
- Spatial ;
- DOM / boutons ;
- wrappers / timers ;
- Large Room Support ;
- Core 317 / Core 318 ;
- Source Render Stability ;
- Tactical / Survival / Capture / PvP ;
- `index.html`.

## TDD obligatoire

1. caractérisation GREEN des deux chemins réels depuis la base exacte ;
2. prouver que World Runtime possède encore sa copie locale et n'appelle pas le helper ;
3. triple CI GREEN ;
4. poser UNE garde RED exigeant uniquement la délégation World Runtime ;
5. vérifier RED isolé, Firefox et Tactical GREEN ;
6. micro-diff minimal World Runtime + contrat strictement nécessaire ;
7. triple CI GREEN ;
8. fermeture documentaire ;
9. triple CI documentaire ;
10. checkpoint GREEN final exact.

## Risque spécifique

`Source Render Stability` possède une sélection inline différente, sans clamp supérieur/inférieur identique. Elle ne doit pas être incluse dans ce lot ni traitée comme une simple duplication à parité garantie.

## Rule 26

Aucune lecture ni modification du contenu exact de `index.html` n'est requise.
Toute dérive vers son contenu exact arrête le lot et déclenche Rule 26.


## Fermeture technique du micro-lot 25

### Caractérisation GREEN préalable

SHA :
`a34730d271cfa2d2c4fbe038328aa66b01b0493e`.

CI :
- Architecture + Browser `36679933562` — SUCCESS ;
- Firefox `36679933625` — SUCCESS ;
- Tactical Dock `36679933558` — SUCCESS ;
- caractérisation World Runtime #228 — SUCCESS ;
- Browser 45/45 sans échec.

La caractérisation verrouille les deux vrais consommateurs :
- `DungeonWorldRuntime167823.currentPlan()` ;
- le wrapper réel `DungeonCore01.explore()` installé par World Runtime.

### RED isolé

SHA :
`bd79ae8b647552b2a0fd85be700a42ae190dc2b5`.

Résultat :
- Architecture `36681168409` — FAILURE attendue uniquement sur #229 `Exiger la délégation héros actif World Runtime Phase 7` ;
- Browser SKIPPED uniquement par dépendance au RED Architecture ;
- Firefox `36681168395` — SUCCESS ;
- Tactical Dock `36681168393` — SUCCESS.

### Micro-diff GREEN appliqué

Commits :
- `a5d87b7cb1bc2ef0497c5ac45a912cf4514000e6` — World Runtime délègue uniquement la sélection pure du héros ;
- `e87c414ccf396450072d6ae01624da36a3b8335b` — frontière contractuelle documentée ;
- `b4f61e5e89d993cf92c5eb67484a3ea27f451a5d` — caractérisation post-raccord ;
- `ceea7c6f1be9b36517e0b28c35d7b8f64575c74f` — fixture historique World Runtime chargée avec le propriétaire Dungeon réel.

### Triple CI technique GREEN

SHA technique :
`ceea7c6f1be9b36517e0b28c35d7b8f64575c74f`.

CI :
- Architecture + Browser `36681436344` — SUCCESS ;
- Firefox `36681436341` — SUCCESS ;
- Tactical Dock `36681436354` — SUCCESS ;
- Browser 45/45 sans échec ;
- caractérisation #228 — SUCCESS ;
- garde #229 — SUCCESS.

### Frontière préservée

- World Runtime ne possède plus l'algorithme de sélection du héros actif ;
- `GensDungeonV1.movement.resolveAuthoredActiveHero(...)` reste le propriétaire canonique ;
- configuration authoritative world, graphes, edge routing, snapshots, chargement direct, contenu, `directFixedNode`, Spatial, wrappers explore/render, bouton de sortie, panneau legacy et timers restent World Runtime ;
- Room Runtime, Zone Links, Exact Trap et les lots authored précédents restent inchangés ;
- Large Room Support, Core 317/318 et Source Render restent différés ;
- Source Render reste explicitement hors migration simple à cause de sa divergence de sélection inline ;
- aucun changement `index.html`.

### Conformité

- aucune nouvelle API ;
- aucune rustine globale ;
- aucun wrapper/observer/timer/retry ajouté ;
- aucune modification de `main` ;
- aucun changement utilisateur visible ;
- aucun test utilisateur nécessaire ;
- Rule 26 non déclenchée.

Checkpoint final prévu après triple CI du SHA documentaire :
`checkpoint/gensrpg-phase7-dungeon-world-runtime-active-hero-delegation-green-2026-09-30`.

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

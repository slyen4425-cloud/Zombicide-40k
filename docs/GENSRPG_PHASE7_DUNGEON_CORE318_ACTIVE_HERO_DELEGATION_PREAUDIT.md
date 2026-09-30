# GenSrpG — Phase 7 / Dungeon Core 3.18 — délégation héros actif — pré-audit — 2026-09-30

## Base sûre

Micro-lot précédent fermé GREEN :
`checkpoint/gensrpg-phase7-dungeon-large-room-active-hero-delegation-green-2026-09-30`

SHA exact de base :
`2a7b6b5a95bd5103dc4e6e667d62c870b74ba92c`

Checkpoint de départ :
`checkpoint/gensrpg-start-phase7-dungeon-core318-active-hero-delegation-2026-09-30`

Branche :
`work/gensrpg-phase7-dungeon-core318-active-hero-delegation-2026-09-30`

Production `main` reste gelée :
`e8681f9823573ced8aec59c8ddc47a72b02bc663`.

## Constat

Le propriétaire canonique existe :
`GensDungeonV1.movement.resolveAuthoredActiveHero(participants, activeIndex)`.

`assets/dungeon/dungeon-core-318.js` possède encore une copie privée à parité exacte :

```js
function activeHeroId(x){
  const list=Array.isArray(x?.participants)?x.participants:[];
  const i=Math.max(0,Math.min(Math.max(0,list.length-1),Number(x?.index)||0));
  return String(list[i]||"");
}
```

Consommateurs internes identifiés :
- `runtimeRoom()` pour choisir la salle du héros actif via `DungeonSpatial313.roomOf` ;
- `installBranchGuard()` pour rejoindre une sous-salle déjà initialisée.

La fonction n'est pas exportée dans `DungeonCore318`.

## Cible stricte du micro-lot 27

Remplacer uniquement la décision pure de `activeHeroId(x)` par :
`ROOT.GensDungeonV1.movement.resolveAuthoredActiveHero(x?.participants, x?.index)`.

Aucune nouvelle API publique.

## Parité obligatoire

Préserver exactement :
- non-tableau / tableau vide -> `""` ;
- index absent, NaN ou falsy -> premier héros ;
- négatif -> premier héros ;
- dépassement -> dernier héros ;
- chaîne numérique -> coercition `Number` ;
- fractionnaire au-delà de la borne -> clamp dernier ;
- fractionnaire dans les bornes -> lookup fractionnaire historique, donc `""` ;
- participant falsy -> `""` ;
- participant truthy non-string -> `String(...)`.

## Vrais chemins à caractériser

1. `DungeonCore318.activeRoom()` :
   - doit interroger `DungeonSpatial313.roomOf(x, heroId)` avec le héros historiquement sélectionné ;
   - doit conserver le fallback `x.room` puis legacy.

2. `dc200EnterBranch` enveloppé par `installBranchGuard()` :
   - doit sélectionner le même héros ;
   - ne doit pas générer de nouveau contenu lorsqu'une sous-salle existe déjà ;
   - doit conserver mouvement/position et règles tactiques existantes.

## Propriétaires préservés

Core 318 conserve intégralement :
- `dungeonMode`, `normRoom`, `clone` ;
- lecture/écriture runtime ;
- `activeRoom`, `withRoom`, `roomStack` ;
- sélection de salle ennemie ;
- stamping des ennemis ;
- wrappers producteurs/spawn ;
- tracker ;
- `branchStateForSource`, `entryIndex`, `heroName`, `branchNotice` ;
- logique `installBranchGuard` hors sélection pure du héros ;
- `install`, `debug` ;
- réinstallation tardive historique.

`DungeonSpatial313` reste inchangé.

## Divergences explicitement différées

- **Core 317** : son `activeHeroId` renvoie la valeur brute `list[i]||""` et non `String(...)`; un participant truthy non-string diverge du helper canonique. Pas de migration simple.
- **Source Render Stability** : sa sélection inline `x.participants?.[Number(x.index)||0]` ne clamp pas les index négatifs / hors borne. Pas de migration simple.

Ces seams devront être caractérisés comme divergences avant toute décision.

## Hors périmètre absolu

Ne pas toucher :
- Core 317 ;
- Source Render Stability ;
- logique de spawn / stamping ;
- sous-salles ;
- combat ;
- mouvement ;
- World/Room/Large Room Runtime ;
- Spatial ;
- DOM/UI ;
- Tactical / Survival / Capture / PvP ;
- `index.html`.

## TDD obligatoire

1. caractérisation GREEN Core 318 via `activeRoom()` et garde de sous-salle ;
2. prouver que Core 318 possède encore sa copie locale et n'appelle pas le helper ;
3. triple CI GREEN ;
4. UNE garde RED exigeant la délégation Core 318 uniquement ;
5. RED isolé ; Firefox et Tactical restent GREEN ;
6. micro-diff minimal Core 318 + contrat strictement nécessaire ;
7. caractérisation post-raccord ;
8. triple CI technique GREEN ;
9. fermeture documentaire ;
10. triple CI documentaire ;
11. checkpoint final exact.

## Rule 26

Aucune lecture ni modification du contenu exact de `index.html` n'est requise.
Toute dérive vers son contenu exact déclenche la règle 26.

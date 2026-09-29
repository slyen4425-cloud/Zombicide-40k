# GenSrpG — Phase 7 / Dungeon authored — délégation héros actif Action Fix — pré-audit — 2026-09-29

## Base sûre

Micro-lot précédent fermé GREEN :
`checkpoint/gensrpg-phase7-dungeon-authored-branch-nav-active-hero-delegation-green-2026-09-29`

SHA exact de base :
`48b1ac81c16fcd8ba4ae0f3e228b2cfd9dc3524c`

Checkpoint de départ :
`checkpoint/gensrpg-start-phase7-dungeon-authored-action-fix-active-hero-delegation-2026-09-29`

Branche :
`work/gensrpg-phase7-dungeon-authored-action-fix-active-hero-delegation-2026-09-29`

Production `main` reste gelée :
`e8681f9823573ced8aec59c8ddc47a72b02bc663`.

CI documentaire GREEN de la base :
- Architecture + Browser `36633251800` — SUCCESS ;
- Firefox `36633251726` — SUCCESS ;
- Tactical Dock `36633251601` — SUCCESS.

Runtime `index.html` inchangé :
- `8169990` octets ;
- blob Git `1dde9f80fcc1cd5e3c9560491ab28a2ecd2d2082`.

## Audit réel après micro-lot 20

Le propriétaire pur existe :
`GensDungeonV1.movement.resolveAuthoredActiveHero(participants, activeIndex)`.

Le micro-lot 20 a fermé la duplication dans Branch Nav Cleanup, mais l'audit élargi des modules Dungeon a identifié d'autres copies historiques.

Le prochain seam authored le plus étroit est :
`DungeonAuthoredActionFix167857.activeHero(x)`.

Copie locale actuelle :
`const a=Array.isArray(x?.participants)?x.participants:[],i=Math.max(0,Math.min(Math.max(0,a.length-1),Number(x?.index)||0));return String(a[i]||"")`.

Cette API est publique dans :
`DungeonAuthoredActionFix167857.activeHero`.

Elle est consommée localement par :
- `positionKey(x)` ;
- `exactChestAtActivePosition()`.

Autres copies ou sélections découvertes et volontairement hors périmètre :
- `DungeonExactTrapRuntime167845.activeHero` ;
- `DungeonZoneLinks167846.activeHero` ;
- `DungeonWorldRuntime167823.activeHeroId` ;
- `DungeonRoomRuntime167822.activeHeroId` ;
- `DungeonLargeRoomSupport167834.activeHero` ;
- Core 317 / Core 318 possèdent encore leurs propres sélecteurs de héros ;
- Source Render 167877 utilise une sélection inline différente, à caractériser séparément avant toute harmonisation.

Le présent lot ne prétend donc pas rendre la décision globale unique dans tout Dungeon. Il ne traite qu'Action Fix.

## Cible stricte du micro-lot 21

Conserver l'API publique :
`DungeonAuthoredActionFix167857.activeHero(x)`

et déléguer uniquement sa décision pure vers :
`GensDungeonV1.movement.resolveAuthoredActiveHero(x?.participants, x?.index)`.

Aucune nouvelle API n'est créée.

## Parité obligatoire

Conserver exactement :
- non-tableau / tableau vide -> `""` ;
- index absent / NaN / falsy -> 0 ;
- négatif -> premier héros ;
- dépassement -> dernier héros ;
- chaîne numérique -> coercition Number ;
- fractionnaire au-delà de la borne -> clamp au dernier ;
- fractionnaire dans les bornes -> aucun arrondi ;
- participant falsy -> `""` ;
- participant truthy -> `String(...)`.

La caractérisation doit également traverser :
- `positionKey(x)` ;
- `exactChestAtActivePosition()`.

## Propriétaires préservés

Action Fix conserve intégralement :
- lecture runtime ;
- sélection primaire / contexte authored ;
- `positionKey` hors sélection pure du héros ;
- détection exacte des coffres et état opened ;
- masquage/restauration des contrôles legacy ;
- synchronisation des actions ;
- wrapper `DungeonSpatial313.persist` ;
- blocage des clics legacy ;
- wrappers Core render/show ;
- listener click ;
- timers d'installation historiques.

## Hors périmètre absolu

Ne pas toucher :
- Exact Trap ;
- Zone Links ;
- World Runtime / Room Runtime / Large Room Support ;
- Core 317 / Core 318 ;
- Source Render ;
- Branch Nav ;
- Return Persist ;
- Final Exit ;
- Authored Runtime ;
- `DungeonSpatial313` ;
- DOM / wrappers / listeners / timers ;
- règles de coffre ;
- Tactical / Survival / Capture / PvP ;
- assets ;
- `index.html`.

## TDD obligatoire

1. caractérisation GREEN de l'API publique Action Fix `activeHero`, `positionKey` et `exactChestAtActivePosition` ;
2. prouver que la copie locale existe encore et que le helper canonique n'est pas consommé ;
3. triple CI GREEN ;
4. poser UNE garde RED exigeant la délégation Action Fix uniquement ;
5. vérifier RED isolé, Firefox et Tactical GREEN ;
6. micro-diff minimal Action Fix + contrat strictement nécessaire ;
7. conserver l'API publique ;
8. triple CI GREEN ;
9. fermeture documentaire ;
10. triple CI documentaire ;
11. checkpoint GREEN final exact.

## Rule 26

Aucune lecture ni modification du contenu exact de `index.html` n'est requise.
Toute dérive vers son contenu exact arrête le lot et déclenche Rule 26.


## Fermeture technique du micro-lot 21

### Caractérisation GREEN préalable

SHA :
`d23f66037732502da01786d49a1dad399b3fb8ab`.

CI :
- Architecture + Browser `36635090559` — SUCCESS ;
- Firefox `36635090431` — SUCCESS ;
- Tactical Dock `36635090451` — SUCCESS.

La caractérisation verrouille :
- l'API publique `DungeonAuthoredActionFix167857.activeHero` ;
- la sémantique historique exacte, y compris les deux cas fractionnaires ;
- le vrai consommateur `positionKey(x)` ;
- le vrai chemin `exactChestAtActivePosition()` ;
- la présence de la copie locale avant migration et l'absence d'appel au helper canonique.

### RED isolé

SHA :
`a5faa8b9286d5489afe4ac2957992528d1900955`.

Résultat :
- Architecture `36638185092` — FAILURE attendue uniquement sur #221 `Exiger la délégation héros actif Action Fix authored Phase 7` ;
- caractérisation #220 — SUCCESS ;
- Browser SKIPPED uniquement par dépendance au RED Architecture ;
- Firefox `36638184927` — SUCCESS ;
- Tactical Dock `36638184920` — SUCCESS.

Aucune autre sentinelle n'a échoué.

### Micro-diff GREEN appliqué

Commits :
- `88af59063ecc36ee802d9f94a9915968356714b5` — `DungeonAuthoredActionFix167857.activeHero(x)` conserve son API publique et délègue uniquement la sélection pure au propriétaire canonique ;
- `f3a9cdb4c6ec93b1efbe4884b04b7dc686d3a881` — frontière contractuelle Action Fix documentée ;
- `bee15e9aa39ee7f0bac9ba32a0b825e99ea6b464` — caractérisation post-raccord sans affaiblissement métier ;
- `7f35476850ca19da25bfe2cdf2fbb76d1668054d` — fixture historique Action Fix charge le propriétaire Dungeon réel avant le module.

Diff runtime :
- exactement une ligne logique remplacée dans Action Fix ;
- aucune règle de coffre, position, contexte authored, DOM, Spatial, wrapper, listener ou timer déplacée.

Frontière finale :
- `GensDungeonV1.movement.resolveAuthoredActiveHero` possède la décision pure ;
- Action Fix conserve lecture runtime, primaire/contexte authored, `positionKey`, règles coffre exact/ouvert, contrôles legacy, synchronisation, wrapper Spatial, wrappers Core, click et timers ;
- Exact Trap, Zone Links, World Runtime, Room Runtime, Large Room Support, Core 317/318 et Source Render restent explicitement différés ;
- Branch Nav, Return Persist, Final Exit, Authored Runtime et `DungeonSpatial313` restent inchangés ;
- aucun changement de `index.html`.

### Triple CI technique GREEN

SHA technique :
`7f35476850ca19da25bfe2cdf2fbb76d1668054d`.

CI :
- Architecture + Browser `36638438995` — SUCCESS ;
- Browser : 45/45 étapes complètes, aucun échec ;
- Firefox `36638439073` — SUCCESS ;
- Tactical Dock `36638438940` — SUCCESS.

### Conformité

- aucune nouvelle API ;
- API publique Action Fix `activeHero` conservée ;
- aucune rustine globale ;
- aucun wrapper, observer, listener ou timer ajouté au runtime ;
- aucune modification de `main` ;
- aucun changement utilisateur visible ;
- aucun test utilisateur nécessaire ;
- Rule 26 non déclenchée.

Checkpoint final prévu après triple CI du SHA documentaire :
`checkpoint/gensrpg-phase7-dungeon-authored-action-fix-active-hero-delegation-green-2026-09-30`.

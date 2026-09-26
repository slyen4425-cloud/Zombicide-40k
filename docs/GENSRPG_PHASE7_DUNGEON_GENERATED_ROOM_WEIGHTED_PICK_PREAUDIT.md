# GenSrpG — Phase 7 / Dungeon exploration — picker pondéré de salle generated — pré-audit — 2026-09-26

## Base de reprise

- micro-lot précédent GREEN :
  `checkpoint/gensrpg-phase7-dungeon-generated-advance-plan-green-2026-09-26`
- SHA exact de base :
  `497b34cc2b0b5e82f665a0b85b6251f34b34fca4`
- checkpoint de départ du présent lot :
  `checkpoint/gensrpg-start-phase7-dungeon-generated-room-weighted-pick-2026-09-26`
- branche :
  `work/gensrpg-phase7-dungeon-generated-room-weighted-pick-2026-09-26`
- production `main` reste gelée :
  `e8681f9823573ced8aec59c8ddc47a72b02bc663`

## Source exacte vérifiée

Le `index.html` du checkpoint GREEN a été lu en audit par son blob Git exact :

`e513d23c7a8c7aef9a187202bbcc34ab540e856f`

Runtime :
`8170350` octets.

Aucune ancienne copie de `index.html` n'est utilisée.

Conformément à la Rule 26 et à la consigne utilisateur, si une modification de `index.html` devient nécessaire après le RED, le fichier HTML actuel exact devra être demandé à l'utilisateur avant le micro-diff runtime.

## Autorité generated observée

Dans `dungeonCore200Rebuild`, après le plan d'avance Phase 7 :

`GensDungeonV1.exploration.planGeneratedAdvance(...)`

la création d'une nouvelle salle appelle encore :

`const kind=chooseKind(x.room),made=createRoom(x.room,kind);`

Le propriétaire historique `chooseKind(room)` réalise deux responsabilités distinctes :

1. règles Boss :
   - boss final ;
   - everyN ;
   - specific ;
   - random ;
2. sélection pondérée du type de salle non-Boss à partir de `roomWeights`.

Le présent micro-lot ne déplace **pas** les règles Boss.

## Frontière retenue

Extraire uniquement la sélection pondérée non-Boss vers une API Dungeon pure :

`GensDungeonV1.exploration.pickGeneratedRoomKind(weights, roll)`

Entrées :
- `weights` : objet de poids déjà résolu par Core 2.00 ;
- `roll` : valeur RNG normalisée fournie explicitement par Core 2.00.

Sortie :
- identifiant du type de salle sélectionné ;
- fallback final `enemy`.

Core 2.00 reste propriétaire :
- de `cfg()` ;
- des valeurs par défaut de gameplay ;
- du merge `roomWeights` ;
- des règles Boss ;
- de `Math.random()` et donc du nombre exact de tirages ;
- de `createRoom()`.

## Invariants de parité

Le picker pur doit reproduire exactement :
- `Math.max(0, Number(v)||0)` ;
- somme des poids avec total historique `||1` ;
- parcours dans l'ordre `Object.entries()` ;
- sélection quand le reste devient `<=0` ;
- fallback final `enemy`.

Le raccord doit conserver :
- zéro tirage pondéré sur les chemins Boss déterministes ;
- le tirage boss aléatoire historique lorsqu'il s'applique ;
- un tirage pondéré supplémentaire si le boss aléatoire n'est pas sélectionné ;
- les poids par défaut et leur ordre ;
- `chooseKind(room)` comme propriétaire des règles Boss.

## Hors périmètre strict

- `planGeneratedAdvance()`, déjà fermé GREEN ;
- `createRoom()` ;
- rencontre / boss / spawn ;
- mouvement / `DungeonSpatial313` ;
- événements ;
- branches ;
- coffres / pièges / énigmes ;
- Tactical / combat ;
- authored world / `DungeonAuthoredRuntime167839` ;
- Room Creator / World Builder ;
- stockage ;
- progression / stats / inventaire / dés ;
- Survie / Capture / PvP ;
- assets / projectiles.

## Procédure obligatoire

1. caractériser `chooseKind()` sur le runtime de base ;
2. raccorder cette caractérisation à la CI et obtenir GREEN ;
3. ajouter une sentinelle RED exigeant `pickGeneratedRoomKind` et la délégation minimale ;
4. vérifier que seul le nouveau contrat échoue ;
5. si `index.html` doit être modifié, demander l'HTML actuel exact à l'utilisateur avant tout micro-diff ;
6. appliquer le micro-diff runtime minimal ;
7. réaligner uniquement les fingerprints historiques rendus obsolètes ;
8. triple CI ;
9. checkpoint GREEN final avant tout lot suivant.

## Critère GREEN du micro-lot

- API pure `pickGeneratedRoomKind(weights, roll)` ;
- parité exacte des choix pondérés ;
- nombre et emplacement des tirages RNG conservés ;
- règles Boss toujours dans Core 2.00 ;
- `createRoom()` inchangé ;
- authored inchangé ;
- aucune dépendance Tactical ;
- Architecture + Browser, Firefox et Tactical Dock GREEN.

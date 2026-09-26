# GenSrpG — Phase 7 / Dungeon exploration — création/restauration de salle generated — pré-audit — 2026-09-27

## Base sûre

Micro-lot précédent fermé GREEN :
`checkpoint/gensrpg-phase7-dungeon-generated-room-kind-weighting-green-2026-09-27`

SHA GREEN de base :
`2fc83900b001a7643cdd21eecd94d048b91192d1`

Checkpoint de départ :
`checkpoint/gensrpg-start-phase7-dungeon-generated-room-creation-2026-09-27`

Branche :
`work/gensrpg-phase7-dungeon-generated-room-creation-2026-09-27`

Production `main` reste gelée :
`e8681f9823573ced8aec59c8ddc47a72b02bc663`.

## CI de la base

- Architecture + Browser : run `36278791790` — SUCCESS ;
- Firefox : run `36278791812` — SUCCESS ;
- Tactical Dock : run `36278791780` — SUCCESS.

Le Browser complet protège notamment :
- exploration Dungeon Phase 7 ;
- Dungeon après Survie ;
- Dungeon Builder ;
- authored caches/pièges ;
- Save & Quit / reprise ;
- Dungeon -> Tactical ;
- Capture / PvP ;
- non-interférence des quatre modules.

## État architectural déjà extrait

`GensDungeonV1.exploration` possède actuellement deux slices pures :

1. `planGeneratedAdvance(currentRoom, roomLimit, roomStates)`
   - décide complete / existing / create ;
   - ne matérialise aucune salle.

2. `pickWeightedGeneratedRoomKind(roomWeights, roll)`
   - sélectionne uniquement le type de salle generated non-Boss ;
   - reçoit le roll explicitement ;
   - ne possède aucun `Math.random()`.

La création réelle d'une nouvelle salle generated et la restauration d'une salle existante restent hors de ces deux slices.

## Question du micro-lot

Identifier précisément, dans le propriétaire generated final, la responsabilité qui :
- matérialise une nouvelle salle après le plan `create` ;
- réutilise/restaure l'état lorsque le plan retourne `existing` ;
- relie le type de salle choisi au nouvel état de salle ;
sans déplacer en même temps mouvement, événements/spawn, combat ou authored.

Aucune API cible n'est présumée avant lecture de la source exacte et caractérisation.

## Périmètre strict

Audit uniquement au départ :
- création generated ;
- restauration/réutilisation generated ;
- données minimales nécessaires à cette frontière.

Hors périmètre :
- politique Boss ;
- mouvement case par case ;
- événements/spawn ;
- coffres/pièges/énigmes ;
- branches secondaires ;
- Tactical/combat ;
- authored World Builder ;
- Survie / Capture / PvP ;
- refonte de stockage.

## Invariants

- generated et authored restent séparés ;
- Dungeon reste propriétaire du monde ;
- Tactical ne décide jamais de l'exploration ;
- aucun runtime avant caractérisation + RED isolé ;
- aucun wrapper global ;
- aucun timer / observer / retry ajouté ;
- aucun big-bang ;
- une seule responsabilité candidate sera déplacée si l'audit la prouve sûre.

## Rule 26 — obligatoire avant inspection native

Le propriétaire précis de création/restauration est dans le gros `index.html`. Son inspection exacte exige la source du SHA de base.

Permalink exact :
`https://github.com/slyen4425-cloud/Zombicide-40k/blob/2fc83900b001a7643cdd21eecd94d048b91192d1/index.html`

Le fichier doit être téléchargé depuis ce permalink, compressé et fourni par l'utilisateur.

L'ancien `work33.zip/index33.txt` correspond au runtime précédent `8170350 / e513d23...` et ne doit pas être utilisé comme source de vérité pour ce lot.

Après réception :
1. calculer taille + blob Git du fichier fourni ;
2. comparer au `index.html` du SHA `2fc83900...` ;
3. seulement si la correspondance est exacte, inspecter le propriétaire generated ;
4. produire une caractérisation statique ciblée ;
5. aucun runtime avant GREEN de caractérisation puis RED isolé.

## État

Pré-audit ouvert.
Aucune modification runtime.
Bloqué volontairement par Rule 26 jusqu'à réception de la source exacte.

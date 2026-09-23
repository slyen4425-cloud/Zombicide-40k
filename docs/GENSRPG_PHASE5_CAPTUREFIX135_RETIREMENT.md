# GenSrpG — Phase 5 / captureFix135 retirement

Date : 2026-09-23

## Base

- branche :
  `work/gensrpg-phase5-capturefix135-retirement-2026-09-23` ;
- checkpoint de départ :
  `checkpoint/gensrpg-start-phase5-capturefix135-retirement-2026-09-23` ;
- base exacte :
  `22cc0e61f22e350dc61da390cb99925d74122eed` ;
- dernier checkpoint GREEN :
  `checkpoint/gensrpg-phase5-capture-public-launch-entry-preaudit-green-2026-09-23` ;
- production gelée :
  `main = e8681f9823573ced8aec59c8ddc47a72b02bc663`, V16.78.114.11.

## Mission

Retirer uniquement l'affectation `window.startConfiguredGame` du bloc
`captureFix135`, démontrée shadowée dans la chaîne effective par
`captureFix139`.

Le reste du bloc `captureFix135` reste présent.

## TDD

Sentinelle dédiée :

`tests/gens_phase5_capturefix135_retirement_v1.test.cjs`.

RED prouvé sur :

`70074747115be8e316eb3904292d0fc63e693f58`.

Échec exact :

`5 !== 4`

avec le message :

`Phase 5 target must reduce startConfiguredGame assignments from 5 to 4`.

Firefox et Tactical étaient GREEN pendant ce RED.

## Règle 26 / source exacte

Le fichier utilisateur fourni a été vérifié contre la source Git du chantier :

- taille avant retrait : `8174148` octets ;
- blob Git avant retrait :
  `f13835a2827dbfa9e2698cb026d3e732ad62aba4`.

Après retrait strict du wrapper :

- taille : `8173578` octets ;
- delta : `-570` octets ;
- blob Git :
  `9313afd3437fe827b9c17245a675f75645570878`.

Le commit runtime du retrait est :

`cbbb21def96039b46940df4fcc5031acf8ab1ca7`
— `refactor: retire shadowed captureFix135 start wrapper`.

## Changement runtime

Une seule autorité globale est retirée :

`captureFix135 -> window.startConfiguredGame`.

Chaîne avant :

`captureFix135 -> captureFix138 -> captureFix139 -> gensDungeonCore01Js -> dungeonCore200Rebuild`.

Chaîne après :

`captureFix138 -> captureFix139 -> gensDungeonCore01Js -> dungeonCore200Rebuild`.

Nombre d'affectations :

`5 -> 4`.

Dernier propriétaire inchangé :

`dungeonCore200Rebuild`.

Aucune modification des règles Capture/Dungeon/Tactical.

## Écriture du gros index

Un workflow one-shot gardé a été utilisé uniquement comme mécanisme de
transport/patch exact du gros `index.html`.

Il a été supprimé immédiatement après l'application du patch :

- ajout temporaire :
  `6bec6a94f80180913963982ef262dda504d5c8f0` ;
- retrait :
  `921758055da1b7ee246a11ed2a08533c5d383632`.

Aucun workflow temporaire de patch ne reste actif.

## Cartographies et sentinelles réalignées

Les cartographies Phase 2 ont été réalignées vers :
- nouveau blob source ;
- chaîne `startConfiguredGame` à 4 propriétaires ;
- propriétaire final Dungeon inchangé.

Les sentinelles Phase 4 qui verrouillaient l'empreinte exacte de
`index.html` ont été réalignées uniquement sur :
- nouvelle taille ;
- nouveau blob.

Les sentinelles historiques Phase 5 ont aussi été réalignées pour préserver
leurs vrais invariants sans interdire les réductions ultérieures approuvées :
- `captureFix131` reste retiré ;
- `captureFix135` reste retiré du seam ;
- les quatre propriétaires restants sont exacts.

Aucun moteur Core ni règle métier n'a été modifié par ces réalignements.

## Validation technique GREEN avant clôture documentaire

SHA technique :

`1026c89d3dc602baddeb72e721fb658b92a0e8ee`.

CI :
- Architecture + navigateur complet :
  `35826657289` — SUCCESS ;
- Firefox :
  `35826657238` — SUCCESS ;
- Tactical Dock :
  `35826657231` — SUCCESS.

Le navigateur complet valide notamment :
- Survie ;
- Dungeon après Survie ;
- Dungeon Builder ;
- Config objet ;
- fiche RPG ;
- cache / retour / pièges authored ;
- Save & Quit / reprise ;
- PvP ;
- Monster Capture ;
- non-interférence quatre modules ;
- Preview ;
- assets ;
- Equipment.

## Suite obligatoire

Avant tout second retrait Capture :

**ré-audit dédié de `captureFix138`**.

Aucun retrait de `captureFix138` n'est autorisé par le présent lot.

## Validation finale obligatoire

La présente clôture documentaire change le SHA.

Avant checkpoint GREEN final :
1. Architecture + navigateur complet ;
2. Firefox ;
3. Tactical Dock

doivent repasser SUCCESS sur le même SHA documentaire final.

Aucun merge sur `main`.

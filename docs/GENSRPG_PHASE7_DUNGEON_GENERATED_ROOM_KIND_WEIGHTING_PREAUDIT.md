# GenSrpG — Phase 7 / Dungeon exploration — pondération du type de salle generated — pré-audit — 2026-09-26

## Base de départ

Micro-lot Phase 7 précédent fermé GREEN :
`checkpoint/gensrpg-phase7-dungeon-generated-advance-plan-green-2026-09-26`

SHA GREEN de base :
`497b34cc2b0b5e82f665a0b85b6251f34b34fca4`

Checkpoint de départ du présent micro-lot :
`checkpoint/gensrpg-start-phase7-dungeon-generated-room-kind-weighting-2026-09-26`

Branche :
`work/gensrpg-phase7-dungeon-generated-room-kind-weighting-2026-09-26`

Production `main` reste gelée :
`e8681f9823573ced8aec59c8ddc47a72b02bc663`

## Rule 26 — source index exacte

Le `index.html` exact du checkpoint GREEN a été fourni par l'utilisateur dans `work33.zip` sous le nom `index33.txt`.

Vérification locale :
- taille : `8170350` octets ;
- blob Git : `e513d23c7a8c7aef9a187202bbcc34ab540e856f`.

Cette empreinte correspond exactement au checkpoint GREEN de base.
Aucune ancienne copie de `index.html` n'est utilisée.

## Autorité réelle caractérisée

Dans le propriétaire generated final `dungeonCore200Rebuild`, la fonction :

`chooseKind(room)`

possède encore deux responsabilités distinctes :

1. décider si la salle est un Boss selon :
   - dernière salle ;
   - mode `everyN` ;
   - salles explicites ;
   - chance Boss aléatoire ;
2. si aucun Boss n'est choisi, sélectionner le type de salle par pondération `roomWeights`.

Le présent micro-lot ne cible que la seconde responsabilité.

Dans Core 2.00, `chooseKind(room)` n'a qu'un consommateur réel sur le chemin generated :
`const kind=chooseKind(x.room)`.

Le chemin authored reste séparé et n'utilise pas cette fonction.

Un ancien calcul de type de salle subsiste également dans `gensDungeonCore01Js`.
Il reste hors périmètre : le propriétaire generated final est Core 2.00 et aucun ancien runtime ne doit être réactivé ni fusionné artificiellement.

## Sémantique exacte à préserver

Pondérations par défaut :
- `enemy: 44`
- `ambush: 12`
- `trap: 14`
- `chest: 14`
- `merchant: 8`
- `rest: 11`
- `mystery: 11`

Les valeurs configurées dans `roomWeights` remplacent les défauts correspondants.
Les nouvelles clés éventuellement présentes dans `roomWeights` restent ajoutées à la fin de l'ordre d'énumération, comme aujourd'hui.

Chaque poids est normalisé avec :
`Math.max(0, Number(v) || 0)`.

Le total utilise :
`entries.reduce(... ) || 1`.

Le tirage actuel consomme exactement un `Math.random()` uniquement après que les règles Boss n'ont pas retenu la salle.

Le micro-lot doit conserver ce nombre et ce moment d'appel aléatoire.
La nouvelle API pure ne doit donc jamais appeler `Math.random()` elle-même : le roll doit lui être passé explicitement par Core 2.00.

## API cible

`GensDungeonV1.exploration.pickWeightedGeneratedRoomKind(roomWeights, roll)`

Entrées :
- `roomWeights` : objet optionnel de pondérations ;
- `roll` : nombre déterministe représentant le tirage déjà effectué par le callsite.

Sortie :
- identifiant du type de salle sélectionné ;
- fallback `enemy` identique au comportement actuel.

## Périmètre strict

À modifier après RED uniquement :
- `assets/gensrpg/dungeon/entry-v1.js` ;
- `assets/gensrpg/dungeon/module-contract-v1.json` ;
- le bloc `dungeonCore200Rebuild` du `index.html` exact Rule 26 ;
- sentinelle dédiée ;
- workflow Architecture pour raccorder la sentinelle si nécessaire.

## Hors périmètre absolu

Ne pas modifier :
- la politique Boss de `chooseKind(room)` ;
- `createRoom()` ;
- rencontres / boss room ;
- pièges / coffres / marchands / repos ;
- événements / spawn ;
- branches spéciales ;
- mouvement case par case ;
- persistance ;
- combat / Tactical ;
- Authored World Builder ;
- `gensDungeonCore01Js` legacy ;
- Survie / Capture / PvP ;
- assets.

## Invariants

- Dungeon reste propriétaire du monde generated.
- Tactical ne reçoit aucune responsabilité d'exploration.
- Authored reste possédé par `DungeonAuthoredRuntime167839`.
- aucune nouvelle globale ;
- aucun wrapper ;
- aucun timer / observer / retry ;
- aucune lecture DOM ou stockage dans l'API pure ;
- aucun appel aléatoire interne dans l'API pure ;
- le callsite Core 2.00 conserve l'appel `Math.random()` exactement sur le chemin non-Boss.

## Plan TDD

1. caractériser le propriétaire actuel et la sémantique pondérée ;
2. raccorder cette caractérisation à la CI et obtenir GREEN ;
3. ajouter une sentinelle RED exigeant `pickWeightedGeneratedRoomKind` et le raccord Core 2.00 ;
4. prouver que seule cette nouvelle sentinelle devient RED ;
5. appliquer le micro-diff runtime minimal ;
6. réaligner uniquement les fingerprints historiques réellement invalidés ;
7. triple CI : Architecture + Browser, Firefox, Tactical Dock ;
8. si aucun changement visible, pas de preview utilisateur requise ;
9. créer le checkpoint GREEN final du micro-lot.

## Critère GREEN

Le lot est GREEN uniquement si :
- la politique Boss reste dans Core 2.00 et inchangée ;
- Core 2.00 délègue seulement le calcul pondéré non-Boss à `GensDungeonV1` ;
- les seuils et l'ordre des poids sont identiques ;
- `Math.random()` reste consommé au même endroit et une seule fois sur ce chemin ;
- l'API Dungeon reste pure ;
- authored est inchangé ;
- les trois CI requises sont SUCCESS.


## RED prouvé

SHA RED :
`44bda5f3d5f1c46ce3ed4ddaa7c7e168f506cd60`

Triple contrôle du SHA RED :
- Architecture : run `36272062948` — FAILURE attendue ;
- Firefox : run `36272062952` — SUCCESS ;
- Tactical Dock : run `36272062985` — SUCCESS.

La caractérisation Phase 7 reste GREEN :
- #181 autorité exploration : SUCCESS ;
- #182 plan d'avance generated : SUCCESS ;
- #183 pondération generated caractérisée : SUCCESS.

La seule nouvelle garde rouge est :
- #184 `Exiger la pondération Dungeon des salles generated Phase 7`.

Erreur exacte attendue :
`Phase 7 micro-lot 2 requires Dungeon-owned weighted generated room-kind selection`

État observé :
- attendu : `function` ;
- réel : `undefined`.

Le RED prouve donc uniquement l'absence de la nouvelle API publique Dungeon avant raccord.

## Candidat runtime appliqué

Le raccord minimal a été appliqué après RED isolé.

SHA runtime :
`8f2661ed1d7c34c6f3f21664401feb9ca64a8fed`

Le gros `index.html` a été modifié via un workflow one-shot auto-supprimé, afin de respecter Rule 26 sans réutiliser une ancienne copie.

One-shot final :
- run `36272623866` — SUCCESS ;
- source vérifiée avant patch : taille `8170350`, blob `e513d23c7a8c7aef9a187202bbcc34ab540e856f` ;
- cible vérifiée après patch : taille `8170143`, blob `23b4f59009c5e51fdb91e9bfe3fd87d2a79bba3d`.

Micro-diff runtime :
- `assets/gensrpg/dungeon/entry-v1.js` expose `pickWeightedGeneratedRoomKind(roomWeights, roll)` ;
- l'API ne possède aucun `Math.random()` ;
- Core 2.00 conserve toute la politique Boss ;
- Core 2.00 passe explicitement `Math.random()` au sélecteur uniquement sur le chemin non-Boss ;
- l'ancien calcul pondéré inline est retiré ;
- authored reste inchangé ;
- le contrat Dungeon documente la seconde slice pure.

Tests ciblés exécutés dans le one-shot avant commit :
- plan d'avance generated : SUCCESS ;
- caractérisation pondération generated : SUCCESS ;
- nouvelle garde propriétaire pondération : SUCCESS ;
- `git diff --check` : SUCCESS.

La triple CI complète doit maintenant valider le runtime exact avant toute déclaration GREEN.

# GenSrpG — Point de reprise courant

Ce fichier est le point d'entrée prioritaire lorsqu'un fil de discussion est plein ou qu'un chantier doit être repris dans un nouveau fil.

## Chantier courant — migration combat, lot 4E : détection Core 2.09

- Branche : `work/gensrpg-combat-callsite-migration-4e-2026-09-17`
- Base exacte / checkpoint vert lot 4D : `e9ee86b128d8954629163ee264dc5e950421e9e9`
- Checkpoint vert 4D : `checkpoint/gensrpg-combat-callsite-migration-4d-green-2026-09-17`
- Checkpoint de départ 4E : `checkpoint/gensrpg-start-combat-callsite-migration-4e-2026-09-17`
- Test de caractérisation 4E : `tests/gens_core209_detection_direct_bridge_lot4e.test.cjs`
- Production `main` sûre : V16.78.114.11 — `e8681f9823573ced8aec59c8ddc47a72b02bc663`
- `main` ne doit pas être modifié pendant la restructuration.

## Lot 4D — état figé vert

Core 2.11 passe directement par `GensRpgTacticalCombatV2Bridge.requestCombat()` pour sa détection, tout en conservant ses gardes, sa sélection exacte des `enemyIds`, ses délais et sa persistance.

Validation finale 4D sur `e9ee86b128d8954629163ee264dc5e950421e9e9` :

- architecture : vert — run `35204985777` ;
- Chromium / preview : vert dans le même run ;
- Firefox : vert — run `35204985756` ;
- workflow progression revenu au blob canonique lecture seule `31c5043f8352b656f1d015bc4888332e738bf913` ;
- `main` resté sur `e8681f9823573ced8aec59c8ddc47a72b02bc663`.

Dette après 4D : `dc200StartCombat` 5, `openDungeonCombatSetup` 1, `launchCombat200` 2, `startCombat` 6.

## Caractérisation 4E avant correction

Les cinq références `dc200StartCombat` restantes ont été séparées par rôle avant toute modification runtime :

1. une référence = alias historique Core 2.x : `window.dc200StartCombat=startCombat` ;
2. deux références = détection Core 2.09 : garde `typeof` + appel ;
3. deux références = embuscade Core 2.09 : garde `typeof` + appel.

Le plus petit groupe homogène choisi pour 4E est **uniquement la détection Core 2.09**. L'alias et l'embuscade restent hors périmètre.

Le test `tests/gens_core209_detection_direct_bridge_lot4e.test.cjs` a été créé avant correction. Il verrouille :

- garde `triggering` et salle valide ;
- héros actif et position active ;
- sélection des détecteurs via `zones.filter(z=>z.zone.has(hp))` ;
- déduplication/persistance `dc209Detected` ;
- délai de détection 80 ms ;
- libération de `triggering` à 250 ms ;
- conservation des `enemyIds` issus de `detectors.map(...)` ;
- conservation de `reason:"detection"` ;
- migration attendue uniquement vers `Bridge.requestCombat` avec `entry:"dc209EnemyDetection"`.

Le même test protège explicitement l'embuscade comme hors périmètre :

- garde `ambushStarting` ;
- `x.last?.kind==="ambush"` ;
- source `living(x)` ;
- persistance `dc209AmbushDone` ;
- délai 120 ms ;
- libération à 250 ms ;
- appel historique `dc200StartCombat(...,"ambush")` encore exigé pendant le lot 4E.

La caractérisation locale est rouge exactement sur l'entrée historique de détection, après passage des invariants en amont. Aucun runtime 4E n'a encore été modifié au moment de cette caractérisation.

## Correction autorisée pour 4E

Le seul changement runtime autorisé est :

`dc200StartCombat(detectors.map(z=>String(z.e.id)),"detection")`

vers le contrat canonique :

`GensRpgTacticalCombatV2Bridge.requestCombat(window,{enemyIds:detectors.map(z=>String(z.e.id)),reason:"detection",entry:"dc209EnemyDetection"})`

La sélection V113 des participants doit rester centralisée dans le Bridge. Aucune règle V113 ne doit être recopiée dans Core 2.09.

Le compteur `dc200StartCombat` ne pourra passer de 5 à 3 qu'après application et validation de ce changement exact.

## Ce qui ne doit pas être touché dans 4E

- embuscade Core 2.09 ;
- alias `window.dc200StartCombat=startCombat` ;
- `startCombat` et `launchCombat200` ;
- détection Core 2.11 déjà validée ;
- résolution Tactical ;
- timeline/IA Core 3.03 ;
- participants et règles de combat ;
- stats, XP, récompenses et loot ;
- déplacement ;
- navigation générale, fiche héros, Save & Quit ;
- Survival, Capture, PvP, World Builder ;
- cache/PWA.

## Observations utilisateur hors périmètre

1. Les commandes flottantes de combat `Attaque / Fin de tour / Capacité` ont disparu de l'interface.
2. Des éléments de `Talent` ont brièvement clignoté une fois sur la fiche héros puis ont disparu ; non reproduit au second essai.

Ne pas les corriger pendant ce lot sans diagnostic de propriétaire conforme à la charte.

## Étapes de fermeture 4E

1. appliquer uniquement la migration de détection Core 2.09 ;
2. raccorder le test 4E aux sentinelles architecture ;
3. aligner l'inventaire de dette 5 → 3 uniquement si le runtime contient réellement 3 références ;
4. restaurer immédiatement tout workflow temporaire d'écriture du gros `index.html` ;
5. exiger architecture + Chromium/preview + Firefox verts sur le même SHA ;
6. vérifier `main` intact ;
7. créer `checkpoint/gensrpg-combat-callsite-migration-4e-green-2026-09-17` avant le lot suivant.

## Jalons verts précédents

- Lot 4D : `checkpoint/gensrpg-combat-callsite-migration-4d-green-2026-09-17` — `e9ee86b128d8954629163ee264dc5e950421e9e9`.
- Lot 4C : `checkpoint/gensrpg-combat-callsite-migration-4c-green-2026-09-17` — `8ce140c924d259091a6c9838b82d669256a104f3`.
- Lot 4B : `9c1b939ed7e7b34108882be933a99f2151529c79`.
- Lot 4A : `checkpoint/gensrpg-combat-callsite-migration-4a-green-2026-09-17` — `498ab21e9e52746160a5a6de2cb158393a06a7d1`.
- Lot 3 : `checkpoint/gensrpg-combat-callsite-migration-3-green-2026-09-16` — `8c2c225674ed66212e1025a827e3ca078354f9e9`, validé utilisateur.
- Lot 2 : `checkpoint/gensrpg-combat-callsite-migration-2-green-2026-09-16` — `b77225582f9b854b2b0e658029ebb783fc31aab7`.
- Lot 1 : `checkpoint/gensrpg-combat-callsite-migration-1-green-2026-09-16` — `2aa6ba574923229af105cbee1635eeb9efab18cb`.
- XP + portrait : `checkpoint/gensrpg-xp-portrait-cleanfix-green-2026-09-16` — `695be0e029fb49ee70966729474b35aa0a2d9c63`, validé utilisateur Firefox.

## Règle permanente de continuité

À chaque chantier :

1. lire `docs/GENSRPG_CHARTE.md` puis ce fichier ;
2. checkpoint de départ avant le premier changement ;
3. branche créée depuis exactement ce checkpoint ;
4. caractériser/tester avant correction ;
5. checkpoint vert sur le SHA exact validé ;
6. mettre ce fichier à jour avant le chantier suivant.

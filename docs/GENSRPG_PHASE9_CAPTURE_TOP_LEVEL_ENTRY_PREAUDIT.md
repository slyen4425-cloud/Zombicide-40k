# GenSrpG — Phase 9 — Préaudit entrée Capture autonome de premier niveau

Date : 2026-10-06.

## Base et gouvernance

- Branche : `work/gensrpg-phase9-capture-top-level-entry-preaudit-2026-10-06`
- Checkpoint de départ : `checkpoint/gensrpg-start-phase9-capture-top-level-entry-preaudit-2026-10-06`
- Base GREEN : `19e56a082ca0ec36e0169d143776ebc04d3d520d`
- Checkpoint GREEN précédent : `checkpoint/gensrpg-phase9-survival-editor-canonical-boundary-green-2026-10-06`
- Triple CI de base : Architecture+Browser `37498140987`, Firefox `37498140914`, Tactical Dock `37498140733` — SUCCESS
- Production `main` gelée : `e8681f9823573ced8aec59c8ddc47a72b02bc663`

Aucun runtime n'est modifié dans ce préaudit.

## Question

La frontière publique Capture existe déjà. Il faut déterminer le premier verrou restant qui empêche Monster Capture d'être physiquement un module autonome de premier niveau, sans recréer une autorité concurrente.

## Sources propriétaires inspectées

- `assets/gensrpg/capture/entry-v1.js`
- `assets/gensrpg/capture/module-contract-v1.json`
- `assets/gensrpg/shell/module-launch-final-authority-v1.js`
- contrat Shell de retour écran
- rapports Phase 5 / Phase 9 de raccord public Capture, dépendances Capture139 et retrait des couplages Dungeon déjà GREEN
- sentinelles `gens_phase9_capture_public_entry_raccord_v1` et `gens_phase5_module_launch_s3_capture_provider_v1`

## Faits actuels

### Entrée publique

`GensCaptureV1` possède déjà :
- l'identité pure `isProfile(profile)` ;
- le provider public `startModuleSession()` ;
- l'enregistrement unique `shell.register("capture", startModuleSession)`.

Le Shell final reste routing-only et appelle le provider du module actif.

### Dépendance encore active

Le provider Capture ne possède pas encore l'initialisation de session. Il conserve :

`legacyStartConfiguredGame`

et `startModuleSession()` appelle directement cette référence après le guard `activeModule()==="capture"`.

`install(legacyStart)` exige explicitement la fonction historique Capture139. Le contrat module déclare lui-même :
- `temporary legacy Capture139 session start binding` dans `consumes` ;
- Capture139 comme `sole temporary legacy session initializer`.

Les tests permanents Phase 5/9 verrouillent encore volontairement cette situation.

Conclusion : la frontière publique est au bon emplacement, mais le **propriétaire physique du démarrage de session reste l'inline Capture139**.

### Retour / fermeture

Le contrat `moduleScreenReturn.returnToPrimaryView` est toujours déclaré `declared-not-loaded` pour Capture. Cette dette est réelle mais distincte.

Elle n'est pas sélectionnée dans ce lot : la Phase 9 exige d'abord que Capture puisse démarrer comme module autonome et le chemin actif de démarrage dépend aujourd'hui directement de Capture139. Mélanger démarrage et retour écran créerait un lot multi-responsabilités.

## Décision de propriété

Premier verrou sélectionné :
**retirer la dépendance de l'entrée publique à la fonction legacy Capture139 en transférant, par étapes TDD, l'ownership du démarrage de session vers le module Capture.**

Ce préaudit n'autorise PAS encore un déplacement du corps Capture139.

La forme exacte du futur propriétaire owner-local doit être décidée seulement après inspection Rule 26 du `index.html` exact. Il est interdit de copier arbitrairement le corps legacy dans un nouveau fichier ou de garder deux initialisateurs actifs.

## Invariants du prochain lot

- `GensCaptureV1.isProfile()` reste l'unique identité Capture ;
- Shell reste routing-only ;
- un seul provider public `capture` ;
- aucun runtime Dungeon/Survie/Tactical/PvP dans l'entrée Capture ;
- aucun wrapper global, observer, timer/retry ou fallback ;
- aucun changement gameplay, progression, créatures, capacités, combat, assets ou laboratoires ;
- les retraits déjà GREEN (`ensureBaseGameProfile`, `saveActiveEnemies`, faux `gameStyle="dungeon"`, bouton/entrée Dungeon) ne sont pas réintroduits ;
- compatibilité profils Capture historiques conservée ;
- parité ouverture/reprise Capture et non-interférence des quatre modules conservées.

## Gate Rule 26 pour la suite

Le prochain lot qui inspectera ou modifiera le corps exact de Capture139 doit utiliser le `index.html` correspondant au checkpoint GREEN de ce préaudit.

Avant toute mutation runtime :
1. fermer ce préaudit par triple CI ;
2. créer son checkpoint GREEN ;
3. résoudre son SHA exact ;
4. demander à Sylvain le `index.html` exact de ce SHA via le permalink GitHub ;
5. vérifier taille/blob avant inspection locale ;
6. sélectionner un seul seam TDD d'owner transfer.

## Sortie du préaudit

Le préaudit est GREEN lorsque :
- une sentinelle permanente prouve la dépendance legacy au niveau de l'entrée/contrat ;
- aucune dépendance Dungeon/Survie privée n'est réintroduite ;
- le workflow Architecture exécute cette sentinelle ;
- Architecture+Browser, Firefox et Tactical Dock sont SUCCESS sur le HEAD documentaire exact ;
- checkpoint final dédié créé.

Prochain chantier : préaudit Rule 26 du transfert du propriétaire de démarrage de session Capture139 vers le module Capture. Le raccord retour écran reste séparé.

Aucun merge/deploy main.

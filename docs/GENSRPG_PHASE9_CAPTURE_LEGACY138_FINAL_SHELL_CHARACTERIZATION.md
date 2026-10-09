# GenSrpG — Phase 9 : Capture138, Dungeon200 et autorité finale Shell

Date : 9 octobre 2026. **Lot de caractérisation uniquement ; aucune mutation du runtime, du moteur ni de `index.html`.**

## Base et sécurité

- Source de départ GREEN : `049d616c6a16decdb3eefd1ece922c3720a7eff3`, checkpoint `checkpoint/gensrpg-phase9-capture-legacy138-launch-preaudit-green-2026-10-09`. CI Architecture `37960827487`, Firefox `37960827480` et Tactical Dock `37960827332`, toutes SUCCESS.
- Nouveau checkpoint de départ : `checkpoint/gensrpg-start-phase9-capture-legacy138-launch-characterization-2026-10-09`. Branche isolée : `work/gensrpg-phase9-capture-legacy138-launch-characterization-2026-10-09`.
- L'utilisateur a fourni `indexj.txt` ; source byte-exacte : **8 165 398 octets**, Git blob `18627cc0c5fc7945732c8a910504c59ef823b6ae`, identique au `index.html` du checkpoint.
- `main` reste gelée : `e8681f9823573ced8aec59c8ddc47a72b02bc663`. Chantier parallèle de fermeture Capture `work/gensrpg-phase9-capture-lifecycle-shutdown-preaudit-2026-10-09` (SHA `e537678c68c43d7f58899f55d58341421caf90ad`), **divergent et exclu**.

## Chaîne réelle observée (ordre du code source)

1. `index.html` : `captureFix138` installe `window.startConfiguredGame`, conserve `start138` et, si contexte Capture au début, programme un rendu Hub après **30 ms** lorsque le démarrage historique se termine.
2. `index.html` : `dungeonCore200Rebuild` évalue `const startOutside200=window.startConfiguredGame` **avant** le remplacement Shell final ; sa fonction locale `gensDungeonStartConfiguredGame200V1` préserve donc une référence à l'ancien wrapper pour son fallback.
3. `index.html` en fin de body charge `assets/gensrpg/shell/module-launch-final-authority-v1.js`. Ce fichier remplace `window.startConfiguredGame` et délègue à `GensShellModuleLaunchV1.startModuleSession(activeModule())`. Le bouton HTML `onclick="startConfiguredGame()"` utilise ce global final à l'exécution.
4. En parcours public Capture, `assets/gensrpg/capture/entry-v1.js` délègue au propriétaire `GensCaptureSessionStartV1`, qui appelle `GensCaptureHubEntryV1.enterWorld()`. Le wrapper historique 138 ne fait **pas** partie de ce parcours public normal.
5. Le parcours Dungeon public utilise son propriétaire local. Le fallback du dispatcher Dungeon conserve cependant l'ancienne chaîne. Le callback 30 ms Capture138 ne revérifie pas lui-même le contexte au moment de l'exécution. `gensStability151` protège une partie du rendu monde, mais cela ne démontre pas à lui seul l'absence de risque UI et de course.

## Sentinelle d'architecture

`tests/gens_phase9_capture_legacy138_final_shell_route_characterization_v1.test.cjs` :
- charge le véritable `index.html` depuis la branche et vérifie sa taille ainsi que son empreinte Git, conformément à la règle 26 ;
- extrait et exécute en VM les **véritables tranches** Capture138 et Dungeon200 dans leur ordre de chargement ;
- exécute ensuite les **vrais fichiers** `entry-v1.js` et `module-launch-final-authority-v1.js` ;
- vérifie le routage public Capture, Dungeon et l'absence de repli Capture en contexte Survie simulé ;
- caractérise la référence conservée par Dungeon200, son timer 30 ms, le rendu historique et son comportement après changement de mode.

**Limite :** la VM injecte des dépendances externes de manière instrumentée ; elle ne remplace pas un test E2E navigateur d'une transition réelle. Le scénario hors module est une caractérisation de l'ancien fallback, pas la preuve qu'il est appelé par l'UI normale. Ne pas déclarer l'ancien wrapper supprimable sur ce seul oracle.

## Décision de gouvernance

Conserver `captureFix138`, le fallback local Dungeon200, `gensStability151`, le renderer monde et les propriétaires Capture existants **inchangés** dans ce lot. Aucun wrapper, timer ou mécanisme d'autorité ajouté.

**Suite en lot séparé après CI du présent commit :**
1. ajouter le RED cible : un lancement Capture devenu hors contexte ne doit jamais rouvrir un Hub après bascule ; vérifier aussi le fallback Dungeon200 et les démarrages Survie/Dungeon réels ;
2. prouver la parité, puis retirer la référence ou l'autorité historique ciblée par changement **soustractif unique**, sans déplacer le code vers un second propriétaire ;
3. préserver la possibilité de rollback `index.html` byte-exact, exécuter sentinelles Phase 5/9, Architecture/Browser, Firefox, Tactical, puis validation mobile utilisateur.

**Statut à la rédaction :** test VM local GREEN ; CI GitHub à vérifier sur le SHA complet de ce lot. Ce rapport ne revendique pas de correction du runtime ni de GREEN fonctionnel.

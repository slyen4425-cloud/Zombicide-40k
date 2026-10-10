# GenSrpG — Phase 9 — Axe B : partie Capture sans Dungeon, reload et reprise

Date : 10 octobre 2026. **Statut : ciblé GREEN, CI de clôture à vérifier au SHA final. Phase 9 non terminée.**

## Base et périmètre
- Dernier checkpoint fonctionnel : `checkpoint/gensrpg-phase9-capture-axis-a-runtime-isolation-green-2026-10-10`, SHA `5b39eacb2fdc2f0ab69b3c6063196f7a37f40453`. Triple CI 38025145492 Architecture+Browser, 38025145499 Firefox, 38025145507 Tactical : SUCCESS sur ce SHA.
- Checkpoint de départ : `checkpoint/gensrpg-start-phase9-capture-axis-b-clean-resume-2026-10-10` sur le même SHA. Branche : `work/gensrpg-phase9-capture-axis-b-clean-resume-2026-10-10`.
- Scope unique : **reprise d'une partie Monster Capture en contexte navigateur vierge**, sans jamais préparer de partie Dungeon. Aucune modification de `index.html`, du moteur, des sauvegardes, du Shell, du Core ou de la navigation.
- `main` reste gelée `e8681f9823573ced8aec59c8ddc47a72b02bc663` ; branches concurrentes de retrait Capture138 et lifecycle Capture non fusionnées.

## Parcours réellement exécuté
La sentinelle `tests/gens_phase9_capture_axis_b_clean_resume_browser_v1.test.cjs` réutilise le chemin réel de l'axe A, sur vrai `preview.html` depuis le même arbre de fichiers, Chromium mobile 412 × 915. Elle :
1. repart d'un navigateur propre `localStorage.clear()` puis reload ;
2. passe par l'UI de profil, dresseur et créature, lance Capture, conserve `gameStyle:""` et `isDungeonMode()===false` ;
3. avance au jour 2 et vérifie la persistance du monde Capture dans `gensrpg_capture_world_v1_<profil>` ;
4. crée un vrai combat du moteur historique Capture, fait une attaque, gagne et ferme le panneau de victoire ;
5. **ferme la page**, en ouvre une nouvelle dans le même contexte persistant, vérifie session et monde jour 2 avant reprise ;
6. sélectionne le profil Capture puis clique le **vrai bouton Shell Reprendre** ;
7. contrôle le Hub Capture restauré avec jour 2, clique le bouton de progression et vérifie le jour 3 sauvegardé ;
8. vérifie à chaque snapshot que les clés `gensrpg_dungeon_runtime_v2` et `gensrpg_dungeon_state_v1` restent `null`, que le mode Dungeon demeure faux, et que les menus Dungeon restent cachés.

La fixture ne crée **aucune** sauvegarde Dungeon. Le test inter-module historique avec ancienne sauvegarde Dungeon est conservé, car il prouve la compatibilité inverse sans couvrir cette indépendance.

## Résultat ciblé GitHub
- Commit de première version du test : `51414b9c62f4d810fe7c3f781e0a9cc17dc82d47`.
- Workflow temporaire ciblé : [38032142960](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/38032142960), **SUCCESS**.
- Observations réelles dans les logs : après victoire `day:2` et aucun état Dungeon ; après page reload et clic Reprendre le Hub est visible et le monde encore `day:2` ; après nouvelle action `day:3`, `dungeonRuntime:null`, `dungeonState:null`, `dungeonMode:false`.
- **Attention à la portée :** le monde Capture est automatiquement persisté et le bouton « Reprendre » fonctionne. Ce test ne clique pas une fonction explicite « Sauvegarder et quitter », ne démontre pas le teardown des listeners/timers et ne prouve pas l'inactivité de chaque fonction historique préchargée. La fermeture propre est l'axe C séparé.

## Intégration et sortie du lot
- Ajouter la sentinelle dans le **job navigateur permanent** `.github/workflows/gensrpg-architecture-sentinels.yml`, juste après l'axe A.
- Retirer entièrement `.github/workflows/gensrpg-phase9-capture-axis-b-diagnostic.yml` après son succès, sans laisser d'autorité de test temporaire.
- Exiger Architecture+Browser, Firefox et Tactical SUCCESS sur le même SHA final. Créer ensuite un checkpoint GREEN **pour l'axe B ciblé uniquement**, non pour la Phase 9 complète.
- Le prochain axe C doit commencer par son propre checkpoint de départ et la coordination avec le chantier lifecycle divergent ; aucune rustine. Si inspection exacte du gros index nécessaire, appliquer §26 en demandant le fichier byte-exact de son nouveau SHA.

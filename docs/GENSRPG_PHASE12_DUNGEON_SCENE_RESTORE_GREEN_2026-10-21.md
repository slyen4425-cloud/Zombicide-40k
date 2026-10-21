# GenSrpG — Phase 12 / Dungeon : cycle complet du coffre, sauvegarde et reprise — GREEN ciblé

**21 octobre 2026.** Propriétaires : Core200 (synchronisation carte/scènes), Core213 (consommation), Core051 (convention existante du marqueur). Ce GREEN certifie **les coffres consommés**, pas tous les marqueurs de pièges ou toutes les scènes Dungeon.

## Gouvernance, checkpoints et gel

- **Base certifiée** : `checkpoint/gensrpg-phase12-dungeon-room2-entry-green-2026-10-21`, SHA `ca77d8e5651892b39c37f1c035823014e8cdf7e0`, [CI 39564370399](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/39564370399).
- **START §25** antérieur aux modifications : `checkpoint/gensrpg-start-phase12-dungeon-scene-restore-2026-10-21` à ce même SHA ; branche dédiée `work/gensrpg-phase12-dungeon-scene-restore-2026-10-21`.
- **Final GREEN** : `checkpoint/gensrpg-phase12-dungeon-scene-restore-green-2026-10-21`, SHA exact **`31dc3c664784a37bf231ab66ae581d29d37940f2`** ; [CI finale 39648954634](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/39648954634), contextes `gensrpg/phase12/dungeon-scenes/browser` et `gensrpg/phase12/dungeon-scenes/regression` **success** sur le même SHA. Checkpoint créé après ces réussites, jamais déplacé.
- **§26** : `index.html` inchangé, Git blob `9f35eb833a6ede4b91399854f19bb9bef59f45ab`, 1 729 855 octets ; [source immuable](https://github.com/slyen4425-cloud/Zombicide-40k/blob/31dc3c664784a37bf231ab66ae581d29d37940f2/index.html). Aucun gros HTML lu/modifié via GitHub.
- Production `main` maintenue à `e8681f9823573ced8aec59c8ddc47a72b02bc663`, **aucun merge/Pages/PWA**, pas d'intervention sur Survie/Capture/PvP ni laboratoires Combat/Exploration.

## Régression prouvée avant correction

Le [run RED 39646635549](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/39646635549) jouait réellement la victoire du squelette, reprenait Dungeon en salle 1, avançait en salle 2 avec poids **coffre 100 %** réglé par l'API officielle, ouvrait et consommait via l'UI Core213, rechargeait la page, puis constatait **un coffre supplémentaire réintroduit sur une autre case**, avec ID distinct.

La vérification initiale ne recherchait que l'absence de l'ancien ID ; la sentinelle a été renforcée pour exiger **zéro nouvelle scène coffre et zéro case `chest`** après consommation et reprise.

## Cause exacte et modifications minimales

1. **Propriétaire Core213** `assets/gensrpg/dungeon/core213-stability-v1.js`, `removeChest213(id)` : la consommation ôtait la scène et la case, mais n'inscrivait pas le marqueur existant `_dc051ChestConsumed` dans la carte du runtime principal `x.last.map` avant `saveRt(x)`. `removeDungeonSceneElement` posait ce marqueur sur l'ancienne représentation `loadDungeonState`; un rendu ultérieur le remplaçait par la carte du runtime Core200 sans le marqueur. **Correction** : lors d'un coffre `fromMap`, poser ce marqueur prévu dans `x.last.map` avant la publication ; aucune nouvelle source de vérité.
2. **Propriétaire Core200** `assets/gensrpg/dungeon/core200-rebuild-v1.js`, `syncChestAuthority208` : corrige l'enregistrement de scène en préservant la scène créée dans la sauvegarde finale au lieu d'écrire un tableau capturé avant sa création. Lorsqu'une scène `fromMap` ne correspond plus à une case coffre, ne pas fabriquer une nouvelle case sur un sol libre, mais retirer la scène obsolète ; les coffres ajoutés hors carte gardent leur raccord existant.
3. Aucun changement de Core051, de moteur Tactical, règles, IA, Core Stats, D100, inventaire ou résolution d'assets ; les fonctions Core051 `ensureMapChest051` et le marqueur existant sont réutilisés.
4. Les garde-fous reconstruisant **des snapshots historiques immuables** de Core213 ont été corrigés pour retrouver les octets pré-modification depuis le SHA GREEN, sans relâcher leur empreinte ou transformer les contrats du vieux code. La sentinelle propre à ce lot vérifie le diff exact des deux fichiers propriétaires et l'absence de tout autre changement de runtime.

## Parcours réel vérifié sur Chromium et Firefox

Accueil → Aventure RPG → Dungeon → nouvelle partie Aldren/Lyra/Brom → squelette vivant 5 PV salle 1 → combat Tactical par boutons réels (attaque, dés, tours IA) → victoire, attribution XP → retour Dungeon → reload et **REPRENDRE LA PARTIE** → vraie entrée en salle 2 (type coffre par configuration auteur) → carte et ID du coffre identiques après reload et seconde reprise → bouton **FOUILLER LE COFFRE**, puis bouton distinct Core213 **OUVRIR / FOUILLER**, fenêtre **Coffre fouillé** → case supprimée et scène retirée → nouveau reload et **REPRENDRE** → **zéro scène coffre et zéro case coffre réapparues**, salle 2 intacte.

La CI finale a passé les deux jobs, a contrôlé les XP/blessures et la cohérence de salle 1, et n'a introduit aucune valeur de combat, loot, monstre, jet ou victoire artificielle. Les réglages de poids de salle proviennent des API normales de configuration utilisateur.

## Limites et prochain lot

- **Non testés** : résultat de défaite, véritable butin de monstre non vide, réactions de pièges et invariance stricte de leurs cases lors de reprises répétées, cheminement spatial au contact des sorties avec tous les profils de mouvement, cas multijoueur/multi-héros, PWA et test manuel sur smartphone. Les warnings 404 de ressources Chromium et avertissements Firefox restent hors scope.
- **Phase 12 globale OUVERTE**. Ouvrir un autre §25 START au SHA GREEN `31dc3c664784a37bf231ab66ae581d29d37940f2` pour un futur lot clairement distinct. Sans déploiement preview sur cette branche, ne pas prétendre qu'un lien Pages joue ce code de travail.
- Historique des échecs et preuves conservés dans `docs/GENSRPG_PHASE12_DUNGEON_SCENE_RESTORE_RED_2026-10-21.md`. Ne pas effacer les diagnostics RED antérieurs.

Références : `docs/GENSRPG_CHARTE.md` §§1–5, 12–26 ; `docs/GENSRPG_CHECKPOINT_POLICY.md` ; `tests/gensrpg_phase12_dungeon_scene_restore_browser.cjs` ; `tests/gensrpg_phase12_dungeon_scene_owner_guard.test.cjs`.

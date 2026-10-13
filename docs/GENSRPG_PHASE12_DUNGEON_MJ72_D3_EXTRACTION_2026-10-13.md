# Phase 12 — D3 Dungeon MJ72 Scene / Contenu

Date : 13 octobre 2026.

- Dernier SHA base GREEN triple CI : `370da67fc163576c8e1a78f8b01e5beaf9236d64`. Checkpoint précédent : `checkpoint/gensrpg-phase12-dungeon-core051-d2-green-2026-10-13`.
- Checkpoint §25 D3 : `checkpoint/gensrpg-start-phase12-dungeon-mj72-d3-extraction-2026-10-13` depuis cette base.
- Branche de lot : `work/gensrpg-phase12-dungeon-mj72-d3-extraction-2026-10-13`, ni `main` ni les laboratoires.
- Source §26 fournie par utilisateur : `ar.zip` / `index.html(4).txt`, 7 863 589 octets, Git blob `e5f8895495f969597a6c209fcc29afd66b7a0636` exact.
- Propriétaire : Dungeon, `dungeonMj72_2Script` actif, domaine exclusif Dungeon selon `docs/GENSRPG_PHASE2_INLINE_OWNERS.json`.
- Source inline : **27 511 octets**, blob `8304087b15bbbf5f71c22b7f8c916e0a78b1b905` ; cible `assets/gensrpg/dungeon/mj72-scene-v1.js`, tag classique chargé au même emplacement parser.
- Index attendu : **7 836 124 octets**, blob `972f0e0be12fac14427853fbcd7abe5233eb5a8c`, économie 27 465 octets nets.
- Autorité et comportement : conserver exactement le code, les const lexicales globales, les fonctions de sauvegarde et scène, sans IIFE, module, async/defer, duplicata ou nouveau wrapper.
- Application GitHub Actions contrôlée et reproductible : `tools/gensrpg_phase12_dungeon_mj72_extract_apply.py --apply` sur le SHA certifié ; `--verify` prouve reconstruction D3 → D2 ; D2 → D1 → ancienne source également testés.
- Adapter uniquement l'inventaire propriétaire vivant, la composition directe et les snapshots historiques, sans affaiblir les tests.
- GREEN seulement après triple CI Architecture/Chromium, Firefox, Tactical SUCCESS **sur le même SHA** et création d'un checkpoint final.
- Ne modifier ni `main` gelé, ni les laboratoires combat/exploration, ni les images Survie historiques.

## Livraison physique D3 — en validation

- Workflow d'application [38459404192](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/38459404192) SUCCESS ; commit moteur 7a2242ab825b95707b671207106c73d216cfaf5f.
- Indices : index 7 836 124 octets Git blob `972f0e0be12fac14427853fbcd7abe5233eb5a8c` ; source externe MJ72 27 511 octets Git blob `8304087b15bbbf5f71c22b7f8c916e0a78b1b905`.
- Checkpoints D1 et D2, preuves exactes et tests initiaux validés. Attente des CI structurelles et navigateur sur un même commit final. Pas de checkpoint D3 GREEN à ce stade.
